import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const RAW_API = import.meta.env.VITE_API_BASE || '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chatapp_user')
    return saved ? JSON.parse(saved) : null
  })
  const [role, setRoleState] = useState(() => localStorage.getItem('chatapp_role') || null)
  const [topic, setTopicState] = useState(() => localStorage.getItem('chatapp_topic') || null)

  const login = useCallback(async (username, password) => {
    try {
      const res = await axios.post(`${RAW_API}/auth.php`, {
        action: 'login',
        username,
        password,
      })
      if (res.data.success) {
        const userData = {
          username,
          token: res.data.token,
          id: res.data.user_id,
          is_admin: res.data.is_admin,
          group: res.data.group_id ?? 1,
        }
        setUser(userData)
        localStorage.setItem('chatapp_user', JSON.stringify(userData))
        return { success: true }
      }
      return { success: false, error: res.data.error }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Connection error' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setRoleState(null)
    setTopicState(null)
    localStorage.removeItem('chatapp_user')
    localStorage.removeItem('chatapp_role')
    localStorage.removeItem('chatapp_topic')
  }, [])

  const selectRole = useCallback((r) => {
    setRoleState(r)
    localStorage.setItem('chatapp_role', r)
  }, [])

  const selectTopic = useCallback((t) => {
    setTopicState(t)
    localStorage.setItem('chatapp_topic', t)
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, topic, login, logout, selectRole, selectTopic }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
