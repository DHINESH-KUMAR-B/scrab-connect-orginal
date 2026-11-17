import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'

export const Glass = ({ className = '', children }) => <div className={`glass p-4 sm:p-5 ${className}`}>{children}</div>
export const Skeleton = ({ className = 'h-24' }) => <div aria-hidden className={`glass animate-pulse ${className}`}/>
export const StatCard = ({ label, value, unit }) => (
  <Glass>
    <p className="truncate text-xs sm:text-sm opacity-70">{label}</p>
    <p className="mt-1 truncate text-2xl sm:text-3xl font-extrabold tabular-nums">
      {value}
      {unit && <span className="ml-1 text-sm sm:text-base font-normal opacity-70">{unit}</span>}
    </p>
  </Glass>
)
export const Grid = ({ children }) => <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>

export function useLoading(ms = 700) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(timer)
  }, [ms])
  return loading
}

const T = createContext(() => {})
export const useToast = () => useContext(T)

export function ToastProvider({ children }) {
  const [items, set] = useState([])
  const push = useCallback(msg => {
    const id = Date.now() + Math.random()
    set(i => [...i, { id, msg }])
    setTimeout(() => set(i => i.filter(x => x.id !== id)), 3500)
  }, [])
  return (
    <T.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {items.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="glass px-4 py-3 text-sm"
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </T.Provider>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('scrap-theme') !== 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('scrap-theme', dark ? 'dark' : 'light')
  }, [dark])
  const home = user ? { user: '/dashboard', collector: '/collector', admin: '/admin' }[user.role] : '/login'
  const roleNav = user?.role === 'collector'
    ? [{ to: '/collector', label: 'My route', icon: '⌖' }]
    : user?.role === 'admin'
      ? [{ to: '/admin', label: 'Overview', icon: '▦' }]
      : [{ to: '/dashboard', label: 'Dashboard', icon: '▦' }, { to: '/pickup', label: 'Book a pickup', icon: '＋' }]
  const navigation = [
    ...roleNav,
    { to: '/rates', label: 'Live rates', icon: '₹' },
    { to: '/centers', label: 'Drop-off hubs', icon: '◎' },
    { to: '/wallet', label: 'Online wallet', icon: '◈' },
    { to: '/support', label: 'Customer support', icon: '?' },
    { to: '/creative', label: 'Creative studio', icon: '✦' },
    { to: '/reviews', label: 'Reviews', icon: '★' },
    { to: '/profile', label: 'Profile setup', icon: '⚙' },
  ]
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-6 !py-3" aria-label="Main">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {user && (
              <button
                type="button"
                onClick={() => setSidebarOpen(value => !value)}
                aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={sidebarOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
              >
                {sidebarOpen ? '×' : '☰'}
              </button>
            )}
            <Link to="/" className="whitespace-nowrap shrink-0" aria-label="Scrap Connect Home">
              <BrandLogo size={28} withWordmark wordmarkClass="text-base sm:text-lg font-extrabold tracking-tight" />
            </Link>
          </div>
          <div className="hidden items-center gap-5 text-sm font-medium md:flex">
            <NavLink to="/rates" className={({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`}>Live rates</NavLink>
            <NavLink to="/centers" className={({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`}>Drop-off hubs</NavLink>
            <NavLink to="/creative" className={({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`}>Creative studio</NavLink>
            <NavLink to="/reviews" className={({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`}>Reviews</NavLink>
            <NavLink to="/support" className={({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`}>Support</NavLink>
            {user && <NavLink to={home} className={({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`}>Workspace</NavLink>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm shrink-0">
            <button onClick={() => setDark(value => !value)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">{dark ? '☼' : '◐'}</button>
            {user
              ? <button onClick={logout} className="whitespace-nowrap shrink-0 px-1.5 py-1 opacity-80 hover:opacity-100">Log out</button>
              : <Link to="/login" className="btn whitespace-nowrap shrink-0 !min-h-0 !py-1.5 !px-3.5 text-xs">Log in</Link>}
          </div>
        </nav>
      </header>
      {user && (
        <>
          {sidebarOpen && <button type="button" aria-label="Close navigation menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden"/>}
          <aside className={`glass fixed bottom-0 left-0 top-20 z-40 w-64 overflow-y-auto rounded-none border-l-0 border-b-0 p-4 transition-transform lg:top-24 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Sidebar navigation">
            <Link to="/profile" onClick={() => setSidebarOpen(false)} className="mb-6 flex items-center gap-3 group">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-leaf-500/20 flex items-center justify-center text-sm font-bold text-leaf-400">
                {user.photoUrl
                  ? <img src={user.photoUrl} alt={user.name || 'Profile'} referrerPolicy="no-referrer" className="h-full w-full object-cover"/>
                  : (user.name || user.email || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold group-hover:text-leaf-400">{user.name || user.email}</p>
                <p className="text-xs capitalize opacity-60">{user.role} · {user.profileCompleted ? 'Profile ready' : 'Finish setup'}</p>
              </div>
            </Link>
            <nav className="space-y-2" aria-label="Workspace">
              {navigation.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-leaf-500/20 text-leaf-400' : 'opacity-75 hover:bg-white/10 hover:opacity-100'}`}
                >
                  <span aria-hidden="true" className="w-5 text-center text-base">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-xs leading-relaxed opacity-60">Make recycling easier. Track pickups, explore local scrap rates and drop-off hubs, and grow your green impact.</p>
              <Link className="btn mt-4 block text-center text-sm" to={home} onClick={() => setSidebarOpen(false)}>Go to my home</Link>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
