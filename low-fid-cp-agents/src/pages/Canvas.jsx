import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { LayoutDashboard, MessageSquare, X, Bot, User, Calendar } from 'lucide-react'

const ROLE_LABELS  = { student: 'Student', instructor: 'Instructor', researcher: 'Researcher', professional: 'Professional', general: 'General User' }
const TOPIC_LABELS = { computer_science: 'CS', mathematics: 'Math', writing: 'Writing', science: 'Science', history: 'History', arts: 'Arts', communication: 'Communication', general: 'General' }

function Badge({ label }) {
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
      {label}
    </span>
  )
}

function ConversationModal({ convId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/conversations.php?action=get&id=${convId}`).then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [convId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white border border-green-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-100 bg-green-50">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-green-500" />
            {data && (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-700 font-semibold text-sm">{data.conversation.username}</span>
                  <Badge label={ROLE_LABELS[data.conversation.role] || data.conversation.role} />
                  <Badge label={TOPIC_LABELS[data.conversation.topic] || data.conversation.topic} />
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  {new Date(data.conversation.started_at).toLocaleString()} · {data.messages.length} messages
                </p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-green-50/30">
          {loading && <p className="text-slate-400 text-sm text-center py-8">Loading…</p>}
          {data?.messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div key={i} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-green-400' : 'bg-green-200'}`}>
                  {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-green-700" />}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  isUser
                    ? 'bg-green-400 text-white rounded-br-sm'
                    : 'bg-white border border-green-100 text-slate-700 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Canvas() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewId, setViewId] = useState(null)

  const formatDuration = (start, end) => {
    const mins = Math.round((new Date(end || Date.now()) - new Date(start)) / 60000)
    if (mins < 1) return '< 1 min'
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/conversations.php?action=list')
      setConversations(res.data.conversations || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchConversations() }, []) // eslint-disable-line

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-green-100 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-green-500" />
            <div>
              <h1 className="text-slate-800 font-bold">Conversation Canvas</h1>
              <p className="text-slate-400 text-xs">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate('/role')} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-400 hover:bg-green-500 rounded-lg transition-colors">
              + New Chat
            </button>
            <button onClick={logout} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading && <p className="text-slate-400 text-center py-16">Loading…</p>}

        {!loading && conversations.length === 0 && (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-green-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No conversations yet</p>
            <p className="text-slate-400 text-sm mt-1">Start a chat to see it here.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setViewId(conv.id)}
              className="group p-4 rounded-xl border border-green-100 bg-white hover:border-green-300 hover:bg-green-50 text-left transition-all duration-150 hover:scale-[1.01] shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <span className="text-slate-700 font-semibold text-sm truncate">{conv.username}</span>
                <span className="text-slate-300 text-xs flex-shrink-0 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(conv.started_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <Badge label={ROLE_LABELS[conv.role] || conv.role} />
                <Badge label={TOPIC_LABELS[conv.topic] || conv.topic} />
              </div>

              {conv.first_message && (
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-2.5 italic">
                  "{conv.first_message}"
                </p>
              )}

              <div className="flex items-center justify-between text-slate-300 text-xs">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {conv.message_count} msg{conv.message_count !== 1 ? 's' : ''}
                </span>
                <span>{formatDuration(conv.started_at, conv.ended_at)}</span>
              </div>

              {!conv.ended_at && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-500 text-xs">Active</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </main>

      {viewId && <ConversationModal convId={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
