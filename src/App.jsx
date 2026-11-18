
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/ui'
import ErrorBoundary from './components/ErrorBoundary'
import Landing from './pages/Landing'
import Login from './pages/Login'
import UserDashboard from './pages/UserDashboard'
import Pickup from './pages/Pickup'
import Collector from './pages/Collector'
import Admin from './pages/Admin'
import Rates from './pages/Rates'
import Centers from './pages/Centers'
import Profile from './pages/Profile'
import CreativeStudio from './pages/CreativeStudio'
import Reviews from './pages/Reviews'
import Support from './pages/Support'
import Wallet from './pages/Wallet'
import EWaste from './pages/EWaste'
import DyeWaste from './pages/DyeWaste'

const Guard = ({ role, children }) => {
  const { user, loading, authError } = useAuth()
  if (loading) return null
  if (authError) return <div role="alert" className="glass mx-auto max-w-xl p-6">{authError} <Link className="underline" to="/login">Return to login</Link></div>
  return user && (!role || user.role === role) ? children : <Navigate to="/login" replace/>
}

export default function App() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <Navbar/>
      <main className={`mx-auto max-w-6xl px-4 pb-16 pt-24 ${user ? 'lg:ml-64' : ''}`}>
        <ErrorBoundary key={pathname}>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/rates" element={<Rates/>}/>
          <Route path="/centers" element={<Centers/>}/>
          <Route path="/ewaste" element={<EWaste/>}/>
          <Route path="/dye-waste" element={<DyeWaste/>}/>
          <Route path="/creative" element={<CreativeStudio/>}/>
          <Route path="/reviews" element={<Reviews/>}/>
          <Route path="/support" element={<Support/>}/>
          <Route path="/wallet" element={<Wallet/>}/>
          <Route path="/dashboard" element={<Guard role="user"><UserDashboard/></Guard>}/>
          <Route path="/pickup" element={<Guard role="user"><Pickup/></Guard>}/>
          <Route path="/collector" element={<Guard role="collector"><Collector/></Guard>}/>
          <Route path="/admin" element={<Guard role="admin"><Admin/></Guard>}/>
          <Route path="/profile" element={<Guard><Profile/></Guard>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
        </ErrorBoundary>
      </main>
    </MotionConfig>
  )
}

