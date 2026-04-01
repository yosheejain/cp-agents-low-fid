import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GraduationCap, BookOpen, FlaskConical, Briefcase, Globe } from 'lucide-react'

// ── Edit roles here ────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'student',      label: 'Student',       description: 'Learning, exploring concepts, homework help', Icon: GraduationCap },
  { id: 'instructor',   label: 'Instructor',    description: 'Creating course material, lesson planning',  Icon: BookOpen      },
  { id: 'researcher',   label: 'Researcher',    description: 'Deep analysis, literature review',           Icon: FlaskConical  },
  { id: 'professional', label: 'Professional',  description: 'Practical workplace applications',           Icon: Briefcase     },
  { id: 'general',      label: 'General User',  description: 'Open-ended general purpose assistance',      Icon: Globe         },
]
// ──────────────────────────────────────────────────────────────────────────────

export default function RoleSelect() {
  const { role, selectRole, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (id) => { selectRole(id); navigate('/topic') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-green-500 text-xs font-semibold uppercase tracking-wider mb-1">Step 1 of 2</p>
            <h1 className="text-2xl font-bold text-slate-800">Select Interaction Role</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Hi <span className="text-slate-600 font-medium">{user?.username}</span> — who do you want to talk to today?
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => navigate('/canvas')} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors bg-white">
              View History
            </button>
            <button onClick={logout} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors bg-white">
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.map(({ id, label, description, Icon }) => {
            const selected = role === id
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`p-5 rounded-xl border-2 text-left transition-all duration-150 hover:scale-[1.01] ${
                  selected
                    ? 'border-green-400 bg-green-50 shadow-sm shadow-green-100'
                    : 'border-green-100 bg-white hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 mb-3">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-slate-800 font-semibold">{label}</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
                {selected && <p className="mt-2.5 text-xs font-semibold text-green-600">✓ Previously selected</p>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
