import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { signInLocally, localAccessDetails } from '../services/authService'
import type { Role } from '../types'

export default function LoginPage() {
  const [email,setEmail]=useState(localAccessDetails.email)
  const [password,setPassword]=useState('')
  const [role,setRole]=useState<Role>('Administrator')
  const [remember,setRemember]=useState(true)
  const [showPassword,setShowPassword]=useState(false)
  const [error,setError]=useState('')
  const [forgot,setForgot]=useState(false)
  const [loading,setLoading]=useState(false)
  const {login}=useApp()
  const navigate=useNavigate()
  const submit=(event:React.FormEvent)=> {
    event.preventDefault()
    setError('')
    const result=signInLocally(email,password,role,remember)
    if(!result.ok) { setError(result.message); return }
    setLoading(true)
    window.setTimeout(()=>{login(result.session.role,result.session.email,result.session.remember);navigate('/dashboard')},180)
  }
  return <main className="login-screen"><section className="login-aside"><div className="login-brand"><span className="brand-mark"><Activity size={21}/></span><div><b>ResolveGrid</b><small>Intelligent Complaint Monitoring & Coordination</small></div></div><div className="login-message"><span className="eyebrow">SIH 2026 · PROBLEM STATEMENT 26264</span><h1>One coordinated view of institutional complaints.</h1><p>Monitor cases, identify potential overlaps and bring responsible teams together.</p><div className="login-proof"><span><ShieldCheck size={16}/> Secure access workflow</span><span>Team Gremlinix</span></div></div><div className="login-aside-footer">Sample records are illustrative. This application is not connected to AICTE services.</div></section>
    <section className="login-main"><form className="login-card" onSubmit={submit} noValidate><div className="login-mobile-brand"><span className="brand-mark"><Activity size={20}/></span><b>ResolveGrid</b></div><span className="eyebrow">OFFICIAL ACCESS</span><h2>Sign in to your workspace</h2><p>Use the local access account to explore this prototype.</p>
      {error&&<div className="form-error" role="alert">{error}</div>}
      <label className="field"><span>Email address</span><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@organisation.gov.in" required/></label>
      <label className="field password-field"><span>Password</span><div className="password-input"><input type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
      <label className="field"><span>Access role</span><select value={role} onChange={e=>setRole(e.target.value as Role)}><option>Administrator</option><option>Bureau Officer</option><option>Reviewer/Coordinator</option></select></label>
      <div className="login-options"><label><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Keep me signed in on this browser</label><button type="button" onClick={()=>setForgot(true)}>Forgot password?</button></div>
      <button className="button primary login-submit" type="submit" disabled={loading}>{loading?'Signing in…':'Sign in'} {!loading&&<ArrowRight size={16}/>}</button>
      <div className="login-access"><KeyRound size={15}/><span><b>Local access account</b><small>Email: {localAccessDetails.email} · Password: {localAccessDetails.password}</small></span></div>
      <small className="login-storage">Local prototype authentication is not production security and does not contact an authentication service.</small>
    </form></section>
    {forgot&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setForgot(false)}}><section className="modal" role="dialog" aria-modal="true" aria-label="Password assistance"><div className="modal-head"><h2>Password assistance</h2><button className="icon-button" onClick={()=>setForgot(false)} aria-label="Close dialog">×</button></div><p className="modal-copy">Password recovery email is not configured for this local application. Use the sample account details shown on the sign-in page or contact your system administrator.</p><div className="modal-actions"><button className="button primary" onClick={()=>setForgot(false)}>Return to sign in</button></div></section></div>}
  </main>
}
