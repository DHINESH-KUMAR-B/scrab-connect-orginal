import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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

// Priority waste streams. Each one has its own page with its own tools.
const SPECIAL_WASTE = [
  {
    key: 'E-Waste',
    to: '/ewaste',
    label: 'E-waste',
    hint: 'Value estimator, data wipe, bulk pickup',
    icon: '⌁',
    idle: 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20',
    on: 'border-amber-300 bg-amber-400 text-emerald-950',
  },
  {
    key: 'Dye waste',
    to: '/dye-waste',
    label: 'Dye waste',
    hint: 'Effluent check, safe storage, waste log',
    icon: '❋',
    idle: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300 hover:bg-fuchsia-400/20',
    on: 'border-fuchsia-300 bg-fuchsia-400 text-emerald-950',
  },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const { pathname, search } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('scrap-theme') !== 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('scrap-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Close the menu on every page change
  useEffect(() => { setMenuOpen(false) }, [pathname, search])

  // While the menu is open: Escape closes it, the page behind it does not scroll,
  // and it closes by itself if the screen is resized to desktop.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = e => { if (e.key === 'Escape') setMenuOpen(false) }
    const onResize = () => { if (window.innerWidth >= 1280) setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  // Which special waste page (if any) is open right now
  const activeMaterial = pathname === '/ewaste' ? 'E-Waste' : pathname === '/dye-waste' ? 'Dye waste' : null

  const home = user ? { user: '/dashboard', collector: '/collector', admin: '/admin' }[user.role] : '/login'
  const roleNav = user?.role === 'collector'
    ? [{ to: '/collector', label: 'My route', icon: '⌖' }]
    : user?.role === 'admin'
      ? [{ to: '/admin', label: 'Overview', icon: '▦' }]
      : [{ to: '/dashboard', label: 'Dashboard', icon: '▦' }, { to: '/pickup', label: 'Book a pickup', icon: '＋' }]
  const publicNav = [
    { to: '/rates', label: 'Live rates', icon: '₹' },
    { to: '/centers', label: 'Drop-off hubs', icon: '◎' },
    { to: '/creative', label: 'Creative studio', icon: '✦' },
    { to: '/reviews', label: 'Reviews', icon: '★' },
    { to: '/support', label: 'Customer support', icon: '?' },
  ]
  const navigation = user
    ? [
        ...roleNav,
        { to: '/rates', label: 'Live rates', icon: '₹' },
        { to: '/centers', label: 'Drop-off hubs', icon: '◎' },
        { to: '/wallet', label: 'Online wallet', icon: '◈' },
        { to: '/support', label: 'Customer support', icon: '?' },
        { to: '/creative', label: 'Creative studio', icon: '✦' },
        { to: '/reviews', label: 'Reviews', icon: '★' },
        { to: '/profile', label: 'Profile setup', icon: '⚙' },
      ]
    : publicNav

  const topLinkClass = ({ isActive }) => `whitespace-nowrap shrink-0 hover:underline ${isActive ? 'text-leaf-400' : 'opacity-80'}`

  // Logged-in users get a permanent sidebar from lg up; everyone else uses the menu up to xl.
  const hamburgerVisibility = user ? 'lg:hidden' : 'xl:hidden'
  const drawerVisibility = user ? 'lg:translate-x-0' : 'xl:hidden'
  const overlayVisibility = user ? 'lg:hidden' : 'xl:hidden'

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl dark:bg-emerald-950/80">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4" aria-label="Main">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(value => !value)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 ${hamburgerVisibility}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <Link to="/" className="min-w-0 shrink" aria-label="Scrap Connect Home">
              <BrandLogo size={28} withWordmark wordmarkClass="text-sm sm:text-lg font-extrabold tracking-tight whitespace-nowrap" />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Priority streams: icon only on phones, icon + label from sm up */}
            {SPECIAL_WASTE.map(item => (
              <Link
                key={item.key}
                to={item.to}
                aria-label={item.label}
                title={item.label}
                className={`inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition sm:w-auto sm:px-3 ${
                  activeMaterial === item.key ? item.on : item.idle
                }`}
              >
                <span aria-hidden="true" className="text-sm leading-none">{item.icon}</span>
                <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
              </Link>
            ))}

            <div className="hidden items-center gap-5 pl-2 text-sm font-medium xl:flex">
              <NavLink to="/rates" className={topLinkClass}>Live rates</NavLink>
              <NavLink to="/centers" className={topLinkClass}>Drop-off hubs</NavLink>
              <NavLink to="/creative" className={topLinkClass}>Creative studio</NavLink>
              <NavLink to="/reviews" className={topLinkClass}>Reviews</NavLink>
              <NavLink to="/support" className={topLinkClass}>Support</NavLink>
              {user && <NavLink to={home} className={topLinkClass}>Workspace</NavLink>}
            </div>

            <button
              onClick={() => setDark(value => !value)}
              aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
              className="hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex"
            >
              {dark ? '☼' : '◐'}
            </button>
            {user
              ? <button onClick={logout} className="hidden whitespace-nowrap px-1.5 py-1 text-sm opacity-80 hover:opacity-100 sm:block">Log out</button>
              : <Link to="/login" className="btn whitespace-nowrap !min-h-0 !py-1.5 !px-3 text-xs sm:!px-3.5">Log in</Link>}
          </div>
        </nav>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className={`fixed inset-0 z-30 bg-black/50 ${overlayVisibility}`}
        />
      )}

      <aside
        id="site-menu"
        aria-label="Site menu"
        className={`fixed bottom-0 left-0 top-14 z-40 flex w-72 max-w-[85vw] flex-col lg:w-64 overflow-y-auto border-r border-white/10 bg-white p-4 transition-transform dark:bg-emerald-950 sm:top-16 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} ${drawerVisibility}`}
      >
        {user && (
          <Link to="/profile" className="mb-5 flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-leaf-500/20 text-sm font-bold text-leaf-400">
              {user.photoUrl
                ? <img src={user.photoUrl} alt={user.name || 'Profile'} referrerPolicy="no-referrer" className="h-full w-full object-cover"/>
                : (user.name || user.email || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold group-hover:text-leaf-400">{user.name || user.email}</p>
              <p className="text-xs capitalize opacity-60">{user.role} · {user.profileCompleted ? 'Profile ready' : 'Finish setup'}</p>
            </div>
          </Link>
        )}

        <div className="mb-5">
          <p className="mb-2 px-1 text-xs font-semibold opacity-60">Special waste</p>
          <div className="space-y-2">
            {SPECIAL_WASTE.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
                  activeMaterial === item.key ? item.on : item.idle
                }`}
              >
                <span aria-hidden="true" className="w-5 text-center text-lg">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs opacity-75">{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <nav className="space-y-1.5" aria-label="Pages">
          {navigation.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-leaf-500/20 text-leaf-400' : 'opacity-75 hover:bg-white/10 hover:opacity-100'}`}
            >
              <span aria-hidden="true" className="w-5 text-center text-base">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
          {user && (
            <p className="text-xs leading-relaxed opacity-60">Make recycling easier. Track pickups, explore local scrap rates and drop-off hubs, and grow your green impact.</p>
          )}
          <Link className="btn block text-center text-sm" to={home}>{user ? 'Go to my home' : 'Log in'}</Link>
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setDark(value => !value)}
              className="rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-white/10 hover:opacity-100"
            >
              {dark ? '☼ Light mode' : '◐ Dark mode'}
            </button>
            {user && (
              <button type="button" onClick={logout} className="rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-white/10 hover:opacity-100">
                Log out
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
