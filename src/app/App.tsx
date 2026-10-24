import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { hasPermission } from '../services/permissions'
const AppLayout=lazy(()=>import('../components/layout/AppLayout'))
const DashboardPage=lazy(()=>import('../pages/DashboardPage'))
const ComplaintsPage=lazy(()=>import('../pages/ComplaintPages').then(module=>({default:module.ComplaintsPage})))
const ComplaintDetailPage=lazy(()=>import('../pages/ComplaintPages').then(module=>({default:module.ComplaintDetailPage})))
const ComplaintFormPage=lazy(()=>import('../pages/ComplaintPages').then(module=>({default:module.ComplaintFormPage})))
const InstitutionsPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.InstitutionsPage})))
const InstitutionDetailPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.InstitutionDetailPage})))
const OverlapsPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.OverlapsPage})))
const CoordinationPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.CoordinationPage})))
const NotificationsPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.NotificationsPage})))
const ReportsPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.ReportsPage})))
const SettingsPage=lazy(()=>import('../pages/OperationsPages').then(module=>({default:module.SettingsPage})))
const LoginPage=lazy(()=>import('../pages/LoginPage'))

function Protected({ children, permission }: { children:React.ReactNode; permission?:Parameters<typeof hasPermission>[1] }) {
  const {state}=useApp()
  if (!state.loggedIn) return <Navigate to="/login" replace/>
  if (permission && !hasPermission(state.role,permission)) return <section className="access-denied"><span className="eyebrow">ACCESS RESTRICTED</span><h1>This action is unavailable for your access role.</h1><p>{state.role} can view this workspace but is not authorized to perform this action. Contact an administrator if you need access.</p></section>
  return state.loggedIn ? <>{children}</> : <Navigate to="/login" replace/>
}
export default function App() {
  const {state}=useApp()
  useEffect(()=>{
    const media=window.matchMedia('(prefers-color-scheme: dark)')
    const apply=()=>{const dark=state.appearance==='Dark'||state.appearance==='System Default'&&media.matches;document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light'}
    apply()
    media.addEventListener('change',apply)
    return ()=>media.removeEventListener('change',apply)
  },[state.appearance])
  return <Suspense fallback={<div className="route-loading" role="status">Loading workspace…</div>}><Routes>
    <Route path="/login" element={state.loggedIn?<Navigate to="/dashboard" replace/>:<LoginPage/>}/>
    <Route path="/" element={<Protected><AppLayout/></Protected>}>
      <Route index element={<Navigate to="/dashboard" replace/>}/>
      <Route path="dashboard" element={<DashboardPage/>}/>
      <Route path="complaints" element={<ComplaintsPage/>}/>
      <Route path="complaints/new" element={<Protected permission="complaint:create"><ComplaintFormPage/></Protected>}/>
      <Route path="complaints/:id" element={<ComplaintDetailPage/>}/>
      <Route path="institutions" element={<InstitutionsPage/>}/>
      <Route path="institutions/:id" element={<InstitutionDetailPage/>}/>
      <Route path="overlaps" element={<OverlapsPage/>}/>
      <Route path="coordination" element={<CoordinationPage/>}/>
      <Route path="notifications" element={<NotificationsPage/>}/>
      <Route path="reports" element={<ReportsPage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Route>
  </Routes></Suspense>
}
