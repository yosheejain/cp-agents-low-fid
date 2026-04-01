import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { LogIn, Users, Trash2, Plus, Lock, ShieldCheck } from 'lucide-react'

const RAW_API = import.meta.env.VITE_API_BASE || '/api'

export default function Login() {
  const [tab, setTab] = useState('signin')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [adminPw, setAdminPw] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [users, setUsers] = useState([])
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [addMsg, setAddMsg] = useState({ type: '', text: '' })
  const [usersLoading, setUsersLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    const result = await login(username, password)
    setLoginLoading(false)
    if (result.success) {
      navigate('/role')
    } else {
      setLoginError(result.error || 'Login failed')
    }
  }

  const handleAdminUnlock = async (e) => {
    e.preventDefault()
    setAdminError('')
    try {
      const res = await axios.post(`${RAW_API}/auth.php`, { action: 'verify_admin', password: adminPw })
      if (res.data.success) {
        setAdminUnlocked(true)
        fetchUsers(adminPw)
      } else {
        setAdminError('Incorrect admin password')
      }
    } catch {
      setAdminError('Connection error')
    }
  }

  const fetchUsers = async (pw = adminPw) => {
    setUsersLoading(true)
    try {
      const res = await axios.post(`${RAW_API}/users.php`, { action: 'list', admin_password: pw })
      setUsers(res.data.users || [])
    } catch { /* ignore */ }
    finally { setUsersLoading(false) }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setAddMsg({ type: '', text: '' })
    try {
      const res = await axios.post(`${RAW_API}/users.php`, {
        action: 'create', admin_password: adminPw,
        username: newUsername, password: newPassword, is_admin: newIsAdmin,
      })
      if (res.data.success) {
        setAddMsg({ type: 'ok', text: 'User created.' })
        setNewUsername(''); setNewPassword(''); setNewIsAdmin(false)
        fetchUsers()
      } else {
        setAddMsg({ type: 'err', text: res.data.error || 'Failed to create user' })
      }
    } catch (err) {
      setAddMsg({ type: 'err', text: err.response?.data?.error || 'Error creating user' })
    }
  }

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return
    await axios.post(`${RAW_API}/users.php`, { action: 'delete', admin_password: adminPw, id })
    fetchUsers()
  }

  const switchTab = (t) => {
    setTab(t)
    if (t === 'manage') { setAdminUnlocked(false); setAdminPw(''); setAdminError('') }
  }

  const inputCls = 'w-full bg-white border border-green-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300 transition text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-400 mb-4 shadow-md shadow-green-200">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">GPT Chat Interface</h1>
          <p className="text-green-600 mt-1 text-sm font-medium">UIUC Learning Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-green-100">
            <button
              onClick={() => switchTab('signin')}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                tab === 'signin' ? 'bg-green-400 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-green-50'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => switchTab('manage')}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                tab === 'manage' ? 'bg-green-400 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-green-50'
              }`}
            >
              <Users className="w-4 h-4" /> Manage Users
            </button>
          </div>

          <div className="p-6">
            {/* Sign In */}
            {tab === 'signin' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-green-700 mb-1.5 uppercase tracking-wider">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} placeholder="Enter username" required autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-green-700 mb-1.5 uppercase tracking-wider">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Enter password" required />
                </div>
                {loginError && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loginError}</p>}
                <button type="submit" disabled={loginLoading} className="w-full bg-green-400 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm">
                  {loginLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Admin lock screen */}
            {tab === 'manage' && !adminUnlocked && (
              <form onSubmit={handleAdminUnlock} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Lock className="w-4 h-4 text-green-400" />
                  Enter the admin password to manage users.
                </div>
                <input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)} className={inputCls} placeholder="Admin password" required autoFocus />
                {adminError && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{adminError}</p>}
                <button type="submit" className="w-full bg-green-400 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-colors">Unlock</button>
              </form>
            )}

            {/* Admin panel */}
            {tab === 'manage' && adminUnlocked && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4" /> Admin access granted
                </div>

                <form onSubmit={handleAddUser} className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add New User</h3>
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className={inputCls} placeholder="Username" required />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} placeholder="Password" required />
                  <label className="flex items-center gap-2 text-slate-500 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} className="rounded accent-green-500" />
                    Admin privileges
                  </label>
                  {addMsg.text && <p className={`text-xs rounded px-2 py-1 ${addMsg.type === 'ok' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-500 bg-red-50 border border-red-200'}`}>{addMsg.text}</p>}
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-400 hover:bg-green-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> Add User
                  </button>
                </form>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Users ({users.length})</h3>
                  {usersLoading ? <p className="text-slate-400 text-sm">Loading…</p> : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {users.length === 0 && <p className="text-slate-400 text-sm">No users yet.</p>}
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 text-sm font-medium">{u.username}</span>
                            {u.is_admin ? <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">admin</span> : null}
                          </div>
                          <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
