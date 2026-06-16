import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-400">TIPINC Dev Portal</h1>
        <p className="mt-2 text-gray-400">Application Update & Request Manager</p>
        <span className="mt-4 inline-block bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full">
          v0.0.01 — Scaffold
        </span>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <h1 className="text-2xl text-gray-400">404 — Page not found</h1>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App