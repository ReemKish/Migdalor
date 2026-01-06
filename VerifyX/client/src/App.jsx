import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Insightx from './pages/Insightx'
import Verifyx from './pages/Verifyx'
import VerifyxStaff from './pages/VerifyxStaff'

export default function App() {
  const location = useLocation()
  const isFullPage =
    location.pathname.startsWith('/insightx') || location.pathname.startsWith('/verifyx')

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 20 }}>
      {!isFullPage && (
        <header style={{ marginBottom: 20 }}>
          <h1>Skillx Template</h1>
          <nav>
            <Link to="/insightx" style={{ marginRight: 10 }}>Insightx</Link>
            <Link to="/verifyx" style={{ marginRight: 10 }}>Verifyx</Link>
            <Link to="/verifyx-staff">Verifyx Staff</Link>
          </nav>
        </header>
      )}

      <main>
        <Routes>
          <Route path="/insightx" element={<Insightx />} />
          <Route path="/verifyx" element={<Verifyx />} />
          <Route path="/verifyx-staff" element={<VerifyxStaff />} />
          <Route path="/" element={<div>Welcome — open /insightx, /verifyx, or /verifyx-staff</div>} />
        </Routes>
      </main>
    </div>
  )
}
