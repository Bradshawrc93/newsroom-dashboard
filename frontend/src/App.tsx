// import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import SquadManager from '@/components/SquadManager'
import Users from '@/pages/Users'
import Tags from '@/pages/Tags'
import Messages from '@/pages/Messages'
import Channels from '@/pages/Channels'
import Analytics from '@/pages/Analytics'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="squads" element={<SquadManager />} />
          <Route path="messages" element={<Messages />} />
          <Route path="channels" element={<Channels />} />
          <Route path="users" element={<Users />} />
          <Route path="tags" element={<Tags />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
