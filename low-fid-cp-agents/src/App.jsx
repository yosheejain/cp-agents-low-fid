import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import UserRoleSelect from './pages/UserRoleSelect'
import RoleSelect from './pages/RoleSelect'
import TopicSelect from './pages/TopicSelect'
import Chat from './pages/Chat'
import Canvas from './pages/Canvas'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/user-role" element={<ProtectedRoute><UserRoleSelect /></ProtectedRoute>} />
          <Route path="/role" element={<ProtectedRoute><RoleSelect /></ProtectedRoute>} />
          <Route path="/topic" element={<ProtectedRoute><TopicSelect /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/canvas" element={<ProtectedRoute><Canvas /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
