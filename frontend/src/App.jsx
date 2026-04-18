import { useState } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [view, setView] = useState('login')
  const [loggedInUser, setLoggedInUser] = useState(null)

  return (
    <div className="app">
      {view === 'login' ? (
        <LoginPage
          onLoginSuccess={(user) => { setLoggedInUser(user); setView('dashboard') }}
          onViewDashboard={() => setView('dashboard')}
        />
      ) : (
        <Dashboard
          loggedInUser={loggedInUser}
          onLogout={() => { setLoggedInUser(null); setView('login') }}
        />
      )}
    </div>
  )
}

export default App
