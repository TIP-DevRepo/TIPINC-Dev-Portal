import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './utils/authConfig'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import FormPreview from './pages/FormPreview'
import KanbanBoard from './pages/KanbanBoard'

const msalInstance = new PublicClientApplication(msalConfig)

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <h1 className="text-2xl text-gray-400">404 — Page not found</h1>
    </div>
  )
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
            <Route path="/form-preview" element={<FormPreview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MsalProvider>
  )
}

export default App