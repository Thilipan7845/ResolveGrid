import type { Role } from '../types'

export type LocalSession = { email: string; role: Role; remember: boolean }
export type AuthResult = { ok: true; session: LocalSession } | { ok: false; message: string }
const SAMPLE_EMAIL = 'official@resolvegrid.local'
const SAMPLE_PASSWORD = 'ResolveGrid-Access'

export const signInLocally = (email: string, password: string, role: Role, remember: boolean): AuthResult => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok:false, message:'Enter a valid email address.' }
  if (email.trim().toLowerCase() !== SAMPLE_EMAIL || password !== SAMPLE_PASSWORD) {
    return { ok:false, message:'The credentials do not match the local sample account. Use the access details shown on this page.' }
  }
  return { ok:true, session:{ email:email.trim().toLowerCase(), role, remember } }
}

export const localAccessDetails = { email:SAMPLE_EMAIL, password:SAMPLE_PASSWORD }
