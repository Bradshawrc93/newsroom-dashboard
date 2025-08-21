import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import SquadManager from '@/components/SquadManager'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="squads" element={<SquadManager />} />
          <Route path="messages" element={<div className="p-6">Messages Page - Coming Soon</div>} />
          <Route path="channels" element={<div className="p-6">Channels Page - Coming Soon</div>} />
          <Route path="users" element={<div className="p-6">Users Page - Coming Soon</div>} />
          <Route path="tags" element={<div className="p-6">Tags Page - Coming Soon</div>} />
          <Route path="analytics" element={<div className="p-6">Analytics Page - Coming Soon</div>} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
