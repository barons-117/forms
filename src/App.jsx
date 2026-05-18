import { Routes, Route } from 'react-router-dom'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFormEditor from './pages/admin/AdminFormEditor'
import AdminSubmissions from './pages/admin/AdminSubmissions'
import PublicForm from './pages/public/PublicForm'
import ThankYou from './pages/public/ThankYou'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/forms/new" element={<ProtectedRoute><AdminFormEditor /></ProtectedRoute>} />
      <Route path="/admin/forms/:id/edit" element={<ProtectedRoute><AdminFormEditor /></ProtectedRoute>} />
      <Route path="/admin/forms/:id/submissions" element={<ProtectedRoute><AdminSubmissions /></ProtectedRoute>} />
      <Route path="/:slug" element={<PublicForm />} />
      <Route path="/:slug/thank-you" element={<ThankYou />} />
    </Routes>
  )
}
