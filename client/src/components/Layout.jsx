import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children, activePage, onNavigate }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#0f1117',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowX: 'auto'
      }}>
        {children}
      </main>
    </div>
  )
}