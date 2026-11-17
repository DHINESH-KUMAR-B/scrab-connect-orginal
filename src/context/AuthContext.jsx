import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, configured, firebaseConfigError } from '../lib/firebase'
import { api } from '../lib/api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [authError, setAuthError] = useState(firebaseConfigError)
  const profileSetup = useRef(false)

  useEffect(() => {
    if (firebaseConfigError) { setLoading(false); return }
    if (!configured) {
      try {
        const saved = localStorage.getItem('demo-user')
        if (saved) {
          const parsed = JSON.parse(saved)
          setUser(parsed)
          if (parsed?.id) {
            api.getUser(parsed.id)
              .then(res => {
                if (res?.user) {
                  const merged = { ...parsed, ...res.user, id: parsed.id, role: parsed.role }
                  localStorage.setItem('demo-user', JSON.stringify(merged))
                  setUser(merged)
                }
              })
              .catch(() => {})
          }
        }
      } catch (error) {
        console.error('Unable to restore the demo session.', error)
        localStorage.removeItem('demo-user')
      }
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async currentUser => {
      setAuthError(null)
      if (!currentUser) { setUser(null); setLoading(false); return }
      try {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid))
        if (!snapshot.exists()) {
          if (profileSetup.current) return
          throw new Error('Your account profile was not found. Contact an administrator.')
        }
        setUser({ id: currentUser.uid, email: currentUser.email, ...snapshot.data() })
      } catch (error) {
        console.error('Unable to load the signed-in user profile.', error)
        setUser(null)
        setAuthError(error.message || 'Unable to load your account profile.')
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const login = async (email, password, role, name = 'Demo') => {
    setAuthError(null)
    if (firebaseConfigError) throw new Error(firebaseConfigError)
    if (!configured) {
      const demoId = 'demo-' + role
      let existingProfile = {}
      try {
        const res = await api.getUser(demoId)
        if (res?.user) existingProfile = res.user
      } catch {
        // No existing server profile yet
      }
      const demoUser = {
        ...existingProfile,
        id: demoId,
        email,
        name: existingProfile.name && name === 'Demo' ? existingProfile.name : name,
        role,
      }
      localStorage.setItem('demo-user', JSON.stringify(demoUser))
      setUser(demoUser)
      return demoUser
    }
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const snapshot = await getDoc(doc(db, 'users', credential.user.uid))
    if (!snapshot.exists()) throw new Error('Your account profile was not found. Contact an administrator.')
    const authenticatedUser = { id: credential.user.uid, email: credential.user.email, ...snapshot.data() }
    setUser(authenticatedUser)
    return authenticatedUser
  }

  const register = async (email, password, name, role = 'user') => {
    if (!configured) {
      const demoUser = { id: 'demo-' + role, email, name, role, profileCompleted: false }
      try {
        await api.updateProfile(demoUser.id, demoUser)
      } catch {
        // Ignore if server offline
      }
      localStorage.setItem('demo-user', JSON.stringify(demoUser))
      setUser(demoUser)
      return demoUser
    }
    profileSetup.current = true
    try {
      const c = await createUserWithEmailAndPassword(auth, email, password)
      const profile = { name, email, phone: '', greenPoints: 0, role: role === 'collector' ? 'collector' : 'user', profileCompleted: false }
      await setDoc(doc(db, 'users', c.user.uid), profile)
      if (profile.role === 'collector') {
        await setDoc(doc(db, 'collectors', c.user.uid), { name, vehicle: '', verified: false, rating: 0 })
      }
      const authenticatedUser = { id: c.user.uid, ...profile }
      setAuthError(null)
      setUser(authenticatedUser)
      return authenticatedUser
    } finally {
      profileSetup.current = false
    }
  }

  const updateProfile = async updates => {
    if (!user) throw new Error('Sign in before updating your profile.')
    const merged = { ...user, ...updates, profileCompleted: true }
    if (configured) {
      const { id, ...profileData } = merged
      await setDoc(doc(db, 'users', id), profileData, { merge: true })
      if (merged.role === 'collector') {
        await setDoc(
          doc(db, 'collectors', id),
          {
            name: merged.name || '',
            vehicle: merged.vehicle || '',
            phone: merged.phone || '',
            areas: merged.areas || [],
          },
          { merge: true }
        )
      }
    } else {
      try {
        const res = await api.updateProfile(user.id, { ...updates, role: user.role, email: user.email, profileCompleted: true })
        if (res?.user) {
          Object.assign(merged, res.user, { id: user.id, role: user.role })
        }
      } catch {
        // Persist locally even if backend call fails
      }
      localStorage.setItem('demo-user', JSON.stringify(merged))
    }
    setUser(merged)
    return merged
  }

  const logout = async () => {
    if (configured) await signOut(auth)
    else localStorage.removeItem('demo-user')
    setUser(null)
    setAuthError(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, authError, login, register, updateProfile, logout }}>
      {children}
    </Ctx.Provider>
  )
}
