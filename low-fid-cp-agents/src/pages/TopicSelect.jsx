import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Code2, Calculator, Pencil, Atom, Landmark, Music, MessageCircle, Lightbulb } from 'lucide-react'

// ── Edit topics here ───────────────────────────────────────────────────────────
const TOPICS = [
  { id: 'computer_science', label: 'Computer Science',       description: 'Programming, algorithms, software',    Icon: Code2          },
  { id: 'mathematics',      label: 'Mathematics',            description: 'Algebra, calculus, statistics, proofs', Icon: Calculator     },
  { id: 'writing',          label: 'Writing & Literature',   description: 'Essays, creative writing, editing',     Icon: Pencil         },
  { id: 'science',          label: 'Science',                description: 'Physics, chemistry, biology',           Icon: Atom           },
  { id: 'history',          label: 'History & Social Studies', description: 'Events, geography, politics',         Icon: Landmark       },
  { id: 'arts',             label: 'Arts & Humanities',      description: 'Music, philosophy, culture',            Icon: Music          },
  { id: 'communication',    label: 'Communication',          description: 'Presentations, language, writing',      Icon: MessageCircle  },
  { id: 'general',          label: 'General / Other',        description: 'Brainstorming, miscellaneous',          Icon: Lightbulb      },
]
// ──────────────────────────────────────────────────────────────────────────────

export default function TopicSelect() {
  const { topic, role, selectTopic, logout } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (id) => { selectTopic(id); navigate('/chat') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-green-500 text-xs font-semibold uppercase tracking-wider mb-1">Step 2 of 2</p>
            <h1 className="text-2xl font-bold text-slate-800">Choose a Computing Topic</h1>
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
          {TOPICS.map(({ id, label, description, Icon }) => {
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
