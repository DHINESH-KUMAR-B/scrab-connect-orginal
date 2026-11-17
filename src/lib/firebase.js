import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
const env = import.meta.env
const requiredKeys = ['VITE_FB_API_KEY', 'VITE_FB_AUTH_DOMAIN', 'VITE_FB_PROJECT_ID', 'VITE_FB_APP_ID']
const suppliedKeys = requiredKeys.filter(key => env[key])
export const configured = suppliedKeys.length === requiredKeys.length
export const firebaseConfigError = suppliedKeys.length > 0 && !configured
  ? `Firebase setup is incomplete. Add these values to .env: ${requiredKeys.filter(key => !env[key]).join(', ')}`
  : null
const app = configured ? initializeApp({
  apiKey: env.VITE_FB_API_KEY,
  authDomain: env.VITE_FB_AUTH_DOMAIN,
  projectId: env.VITE_FB_PROJECT_ID,
  appId: env.VITE_FB_APP_ID
}) : null
export const auth = app && getAuth(app)
export const db = app && getFirestore(app)
