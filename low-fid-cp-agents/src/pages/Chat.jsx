import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { Send, StopCircle, LayoutDashboard, ChevronLeft, Bot, User } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 chat-bubble">
      <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-green-700" />
      </div>
      <div className="bg-white border border-green-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-green-300 animate-bounce-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const time = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex items-end gap-3 chat-bubble ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-green-400' : 'bg-green-200'}`}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-green-700" />}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-green-400 text-white rounded-br-sm'
            : 'bg-white border border-green-100 text-slate-700 rounded-bl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-slate-300 text-xs px-1">{time}</span>
      </div>
    </div>
  )
}

const ROLE_LABELS  = { student: 'Student', instructor: 'Instructor', researcher: 'Researcher', professional: 'Professional', general: 'General User' }
const TOPIC_LABELS = { computer_science: 'Computer Science', mathematics: 'Mathematics', writing: 'Writing & Literature', science: 'Science', history: 'History', arts: 'Arts & Humanities', communication: 'Communication', general: 'General' }

export default function Chat() {
  const { role, topic, userRole, user, logout } = useAuth()
  const navigate = useNavigate()

  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')
  const [ended, setEnded] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {
    if (!role)  { navigate('/role');  return }
    if (!topic) { navigate('/topic'); return }
    createConversation()
  }, []) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const createConversation = async () => {
    try {
      const res = await api.post('/chat.php', { action: 'create_conversation', role, topic, user_role: userRole })
      setConversationId(res.data.conversation_id)
      const opening = []
      if (res.data.opening_message)   opening.push({ role: 'assistant', content: res.data.opening_message })
      if (res.data.opening_message_2) opening.push({ role: 'assistant', content: res.data.opening_message_2 })
      if (opening.length) setMessages(opening)
    } catch {
      setError('Failed to start conversation. Check your PHP server and config.')
    } finally {
      setInitializing(false)
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !conversationId || ended) return

    setMessages((prev) => [...prev, { role: 'user', content: text, created_at: new Date().toISOString() }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      console.log('[Chat] sending message, conversation_id=', conversationId, 'user=', JSON.parse(localStorage.getItem('chatapp_user') || '{}')?.username)
      const res = await api.post('/chat.php', { action: 'send_message', conversation_id: conversationId, message: text })
      if (res.data.error) throw new Error(res.data.error)
      const content = res.data.message
      if (!content && content !== 0) {
        console.error('Unexpected response:', res.data)
        throw new Error('Empty response from server. Check PHP terminal for errors.')
      }
      setMessages((prev) => [...prev, { role: 'assistant', content, created_at: new Date().toISOString() }])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to get a response.')
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setLoading(false)
    }
  }, [input, loading, conversationId, ended])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const endConversation = async () => {
    if (!window.confirm('End this conversation and go to the dashboard?')) return
    try { await api.post('/chat.php', { action: 'end_conversation', conversation_id: conversationId }) } catch { /* best-effort */ }
    setEnded(true)
    navigate('/canvas')
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-slate-400">Starting conversation…</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-green-50">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-green-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/topic')} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-700 font-semibold text-sm">{user?.username}</span>
              <span className="text-slate-200 text-xs">·</span>
              <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{ROLE_LABELS[role] || role}</span>
              <span className="text-slate-200 text-xs">·</span>
              <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{TOPIC_LABELS[topic] || topic}</span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/canvas')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors bg-white">
            <LayoutDashboard className="w-3.5 h-3.5" /> Canvas
          </button>
          <button onClick={endConversation} disabled={ended || !conversationId} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 bg-white">
            <StopCircle className="w-3.5 h-3.5" /> End Chat
          </button>
          <button onClick={logout} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">Sign Out</button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-green-200 flex items-center justify-center mx-auto shadow-sm">
              <Bot className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-slate-600 font-medium">Ready to chat!</p>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Focused on <strong className="text-slate-500">{TOPIC_LABELS[topic] || topic}</strong> for a <strong className="text-slate-500">{ROLE_LABELS[role] || role}</strong>.
            </p>
          </div>
        )}

        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && <TypingIndicator />}

        {error && (
          <div className="text-center">
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">{error}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 p-4 bg-white border-t border-green-100">
        {ended ? (
          <p className="text-center text-slate-400 text-sm">This conversation has ended.</p>
        ) : (
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-300 text-sm resize-none focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 transition max-h-40"
              style={{ minHeight: '48px' }}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !conversationId}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-green-400 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
