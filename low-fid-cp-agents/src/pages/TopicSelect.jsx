import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Code2, Calculator, Pencil, Atom, Landmark, Music, MessageCircle, Lightbulb } from 'lucide-react'

// ── Edit group display names here ──────────────────────────────────────────────
const GROUP_NAMES = { 1: 'Group 1', 2: 'Group 2' }

// ── Edit topics per group here ─────────────────────────────────────────────────
const TOPICS_BY_GROUP = {
  1: [
    { id: 'database', label: 'Databases',       description: 'Talks about databases and their use in software development',    Icon: Code2          },
  ],
  2: [
    { id: 'database', label: 'Databases',       description: 'Talks about databases and their use in software development',    Icon: Code2          },
  ],
}
// ──────────────────────────────────────────────────────────────────────────────

export default function TopicSelect() {
  const { topic, role, selectTopic, user, logout } = useAuth()
  const navigate = useNavigate()

  const group = user?.group ?? 1
  const topics = TOPICS_BY_GROUP[group] ?? TOPICS_BY_GROUP[1]

  const handleSelect = (id) => { selectTopic(id); navigate('/chat') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-green-500 text-xs font-semibold uppercase tracking-wider">Step 2 of 2</p>
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                {GROUP_NAMES[group]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Choose a Topic</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Role: <span className="text-slate-600 font-medium capitalize">{role?.replace('_', ' ') || '—'}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => navigate('/role')} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors bg-white">
              ← Back
            </button>
            <button onClick={logout} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors bg-white">
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {topics.map(({ id, label, description, Icon }) => {
            const selected = topic === id
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-150 hover:scale-[1.01] ${
                  selected
                    ? 'border-green-400 bg-green-50 shadow-sm shadow-green-100'
                    : 'border-green-100 bg-white hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 mb-2.5">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-slate-800 font-semibold text-sm leading-tight">{label}</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
                {selected && <p className="mt-2 text-xs font-semibold text-green-600">✓ Previously selected</p>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
