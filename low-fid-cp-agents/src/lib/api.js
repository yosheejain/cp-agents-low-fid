import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
})

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('chatapp_user') || 'null')
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('chatapp_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  },
)

export default api
