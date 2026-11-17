import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Glass, useToast } from '../components/ui'
import BrandLogo from '../components/BrandLogo'
import { configured, firebaseConfigError } from '../lib/firebase'
export default function Login() {
  const { login, register } = useAuth(), nav = useNavigate(), toast = useToast()
  const [f, setF] = useState({ email: '', password: '', name: '', role: 'user', mode: 'login' })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const go = { user: '/dashboard', collector: '/collector', admin: '/admin' }
  const submit = async e => { e.preventDefault()
    try {
      const authenticated = f.mode === 'login'
        ? await login(f.email, f.password, f.role)
        : await register(f.email, f.password, f.name || 'New user', f.role)
      nav(f.mode === 'register' ? '/profile?setup=1' : (go[authenticated.role] || '/dashboard'))
    } catch (err) { toast(err.message) } }
  return (<Glass className="mx-auto max-w-md">
    <div className="mb-4 flex items-center justify-between gap-3">
      <BrandLogo size={34} withWordmark wordmarkClass="text-lg font-extrabold tracking-tight" />
    </div>
    <h1 className="mb-4 text-2xl font-bold">{f.mode === 'login' ? 'Log in' : 'Create account'}</h1>
    {firebaseConfigError
      ? <p role="alert" className="mb-3 text-sm text-amber-300">{firebaseConfigError}</p>
      : !configured && <p className="mb-3 text-sm text-amber-300">Demo mode: add Firebase keys in .env to use real sign-in. Any email works here.</p>}
    <form onSubmit={submit} className="space-y-3">
      {f.mode === 'register' && <input className="input" placeholder="Full name" aria-label="Full name" value={f.name} onChange={set('name')}/>}
      <input className="input" type="email" required placeholder="Email" aria-label="Email" value={f.email} onChange={set('email')}/>
      <input className="input" type="password" required minLength={6} placeholder="Password" aria-label="Password" value={f.password} onChange={set('password')}/>
      {(!configured || f.mode === 'register') && <select className="input" aria-label="Role" value={f.role} onChange={set('role')}><option value="user">User</option><option value="collector">Collector</option>{!configured && f.mode === 'login' && <option value="admin">Admin</option>}</select>}
      {configured && f.mode === 'register' && <p className="text-xs opacity-70">Admin access can only be granted by an administrator.</p>}
      <button className="btn w-full">{f.mode === 'login' ? 'Log in' : 'Sign up'}</button></form>
    <button className="mt-3 text-sm underline" onClick={() => setF({ ...f, mode: f.mode === 'login' ? 'register' : 'login' })}>{f.mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</button></Glass>)
}
