import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Bell, Building2, ChevronRight, ClipboardList, FilePlus2, Gauge, GitMerge, Menu, Settings, UsersRound, X, LogOut, BarChart3, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { CaseSearch } from '../shared/Shared'
import { hasPermission } from '../../services/permissions'
import { notificationEnabled } from '../../services/notificationService'

const navItems = [
  { to:'/dashboard', label:'Overview', icon:Gauge }, { to:'/complaints', label:'Complaints', icon:ClipboardList },
  { to:'/complaints/new', label:'Register Complaint', icon:FilePlus2 }, { to:'/institutions', label:'Institutions', icon:Building2 },
  { to:'/overlaps', label:'Overlap Intelligence', icon:GitMerge }, { to:'/coordination', label:'Coordination', icon:UsersRound },
  { to:'/notifications', label:'Notifications', icon:Bell }, { to:'/reports', label:'Reports & Analytics', icon:BarChart3 },
  { to:'/settings', label:'Settings', icon:Settings },
]
export default function AppLayout() {
  const { state, logout } = useApp()
  const location=useLocation(), navigate=useNavigate()
  const [mobileOpen,setMobileOpen]=useState(false)
  const [profileOpen,setProfileOpen]=useState(false)
  const [collapsed,setCollapsed]=useState(false)
  const crumbs=location.pathname.split('/').filter(Boolean)
  const unreadCount=state.notifications.filter(n=>!n.read&&notificationEnabled(state.notificationPreferences,n.kind)).length
  return <div className="app-shell">
    {mobileOpen&&<button className="mobile-scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <aside className={`sidebar ${mobileOpen?'sidebar-open':''} ${collapsed?'sidebar-collapsed':''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={20}/></div><div className="brand-copy"><b>ResolveGrid</b><small>Complaint intelligence</small></div><button className="collapse-toggle icon-button" onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed?'Expand navigation':'Collapse navigation'}>{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button><button className="mobile-close icon-button" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X size={17}/></button></div>
      <div className="nav-label">WORKSPACE</div><nav>{navItems.filter(({to})=>to!=='/complaints/new'||hasPermission(state.role,'complaint:create')).map(({to,label,icon:Icon})=><NavLink title={collapsed?label:undefined} key={to} to={to} end={to==='/complaints'} onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={17}/><span>{label}</span>{label==='Notifications'&&unreadCount>0&&<i className="nav-dot"/>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="account-card"><span className="avatar">{state.role==='Administrator'?'AR':state.role==='Bureau Officer'?'BO':'RC'}</span><div className="account-copy"><b>{state.role==='Administrator'?'ResolveGrid Administrator':state.role==='Bureau Officer'?'Bureau Officer':'Reviewer / Coordinator'}</b><small>{state.email||'Local access account'}</small><em>{state.role}</em></div></div><button className="nav-link signout" title={collapsed?'Sign out':undefined} onClick={()=>{logout();navigate('/login')}}><LogOut size={17}/><span>Sign out</span></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><div className="crumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{crumbs[crumbs.length-1]?.replaceAll('-',' ') ?? 'Overview'}</strong></div><div className="top-actions"><CaseSearch/><button className="notification-button" onClick={()=>navigate('/notifications')} aria-label="Open notifications"><Bell size={18}/>{unreadCount>0&&<i>{unreadCount}</i>}</button><div className="user-wrap"><button className="user-button" onClick={()=>setProfileOpen(!profileOpen)}><span className="avatar">{state.role==='Administrator'?'AR':state.role==='Bureau Officer'?'BO':'RC'}</span><span className="user-name"><b>{state.role}</b><small>{state.email||'Local account'}</small></span><ChevronRight size={14}/></button>{profileOpen&&<div className="profile-menu"><strong>{state.role}</strong><small>{state.email||'Local access account'}</small><button onClick={()=>{setProfileOpen(false);navigate('/settings')}}>Profile & settings</button><button onClick={()=>{logout();navigate('/login')}}>Sign out</button></div>}</div></div></header>
      <main className="content"><div className="breadcrumb-line">{crumbs.map((crumb,index)=><span key={crumb}>{index>0&&<ChevronRight size={12}/>}<span className={index===crumbs.length-1?'current':''}>{crumb.replaceAll('-',' ')}</span></span>)}</div><Outlet/></main>
      <footer className="app-footer"><span>ResolveGrid · SIH 2026</span><span>Illustrative sample records · No live AICTE integration</span></footer>
    </div>
  </div>
}
