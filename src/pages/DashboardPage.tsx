import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Building2, CircleAlert, Clock3, FilePlus2, GitMerge, ShieldCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { ComplaintTable, PageTitle, PriorityPill } from '../components/shared/Shared'
import { isOpen, isOverdue, fmtDate } from '../utils/dateUtils'
import { hasPermission } from '../services/permissions'

export default function DashboardPage() {
  const {state}=useApp(), navigate=useNavigate()
  const cases=state.complaints
  const open=cases.filter(c=>isOpen(c.status))
  const overdue=open.filter(c=>isOverdue(c.dueAt,c.status))
  const disposed=cases.filter(c=>c.status==='Resolved'||c.status==='Closed')
  const openOverlap=state.alerts.filter(a=>a.review==='Open').length
  const confirmedOverlap=state.alerts.filter(a=>a.review==='Confirmed').length
  const bureauNames=['Regulation Bureau','PGRC','Coordination Cell']
  const bureauData=bureauNames.map(name=>({name,short:name.replace(' Bureau','').replace(' Cell',''),cases:open.filter(c=>c.bureau===name).length}))
  const ageDays=(c:typeof cases[number])=>(Date.now()-new Date(c.submittedAt).getTime())/86400000
  const ageing=[{name:'0–7 days',value:open.filter(c=>ageDays(c)<=7).length,color:'#6a9c92'},{name:'8–30 days',value:open.filter(c=>ageDays(c)>7&&ageDays(c)<=30).length,color:'#d2a45b'},{name:'31+ days',value:open.filter(c=>ageDays(c)>30).length,color:'#c77369'}]
  const months=Array.from({length:6},(_,index)=>{
    const date=new Date();date.setDate(1);date.setMonth(date.getMonth()-5+index)
    const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
    return {month:date.toLocaleString('en-IN',{month:'short'}),key,intake:cases.filter(c=>c.submittedAt.slice(0,7)===key).length,disposed:cases.filter(c=>(c.status==='Resolved'||c.status==='Closed')&&c.disposedAt?.slice(0,7)===key).length}
  })
  const high=open.filter(c=>c.priority==='Critical'||c.priority==='High').slice(0,4)
  const reviewAlerts=state.alerts.filter(a=>a.review==='Open').slice(0,3)
  const upcoming=[...open].sort((a,b)=>+new Date(a.dueAt)-+new Date(b.dueAt)).slice(0,4)
  const recentActivities=cases.flatMap(c=>c.history.slice(0,1).map(h=>({caseId:c.id,subject:c.subject,action:h.action,at:h.at}))).sort((a,b)=>+new Date(b.at)-+new Date(a.at)).slice(0,4)
  return <><PageTitle title="Operational overview" description="Complaint volumes, deadlines and cross-bureau activity in one view." action={hasPermission(state.role,'complaint:create')?<Link className="button primary" to="/complaints/new"><FilePlus2 size={16}/> Register complaint</Link>:undefined}/>
    <div className="demo-banner"><ShieldCheck size={16}/><span>Sample records</span><i/>Fictional examples only; no live AICTE systems are connected.</div>
    <div className="metric-grid">
      {[
        {label:'Total complaints',value:cases.length,icon:Building2,tone:'navy',href:'/complaints'},
        {label:'Pending cases',value:open.length,icon:Clock3,tone:'amber',href:'/complaints?filter=pending'},
        {label:'Overdue cases',value:overdue.length,icon:CircleAlert,tone:'red',href:'/complaints?filter=overdue'},
        {label:'Potential overlaps',value:openOverlap,icon:GitMerge,tone:'teal',href:'/overlaps?review=Open'},
        {label:'Confirmed overlaps',value:confirmedOverlap,icon:GitMerge,tone:'blue',href:'/overlaps?review=Confirmed'},
        {label:'Disposed cases',value:disposed.length,icon:ShieldCheck,tone:'green',href:'/complaints?filter=resolved'},
        {label:'Disposal rate',value:`${cases.length?Math.round(disposed.length/cases.length*100):0}%`,icon:ArrowUpRight,tone:'blue',href:'/complaints?filter=resolved'},
      ].map(item=><button className="metric-card" key={item.label} onClick={()=>navigate(item.href)}><div className={`metric-icon ${item.tone}`}><item.icon size={18}/></div><div><span>{item.label}</span><strong>{item.value}</strong></div><ArrowUpRight size={15} className="metric-arrow"/></button>)}
    </div>
    <div className="dashboard-grid charts-row">
      <section className="panel chart-panel wide"><div className="panel-heading"><div><h2>Intake & disposal</h2><p>Registered and resolved or closed cases by month</p></div><span className="mini-label">6 MONTHS</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={months} barGap={8}><CartesianGrid vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'var(--chart-tick)'}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'var(--chart-tick)'}}/><Tooltip cursor={{fill:'var(--chart-hover)'}}/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/><Bar dataKey="intake" name="Intake" fill="#315f70" radius={[4,4,0,0]} cursor="pointer" isAnimationActive={false} onClick={(_,index)=>{const item=months[index];if(item)navigate(`/complaints?month=${item.key}`)}}/><Bar dataKey="disposed" name="Disposed" fill="#8eaf9f" radius={[4,4,0,0]} cursor="pointer" isAnimationActive={false} onClick={(_,index)=>{const item=months[index];if(item)navigate(`/complaints?month=${item.key}`)}}/></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Open workload</h2><p>Cases by responsible Bureau / Cell</p></div></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={bureauData} layout="vertical" margin={{left:0,right:10}}><CartesianGrid horizontal={false} stroke="var(--chart-grid)"/><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--chart-tick)'}}/><YAxis type="category" dataKey="short" width={92} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'var(--chart-tick)'}}/><Tooltip/><Bar dataKey="cases" name="Open cases" fill="#6a9c92" radius={[0,4,4,0]} cursor="pointer" isAnimationActive={false} onClick={(_,index)=>{const team=bureauData[index];if(team)navigate(`/complaints?bureau=${encodeURIComponent(team.name)}&filter=pending`)}}/></BarChart></ResponsiveContainer></div></section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Cases needing attention</h2><p>High-priority open matters</p></div><Link className="text-link" to="/complaints?priority=High">View register <ArrowRight size={14}/></Link></div><div className="attention-list">{high.map(c=><Link to={`/complaints/${c.id}`} className="attention-row" key={c.id}><span className="attention-mark"/><div className="grow"><b>{c.subject}</b><small>{c.id} · {c.institutionName}</small></div><PriorityPill priority={c.priority}/></Link>)}</div></section>
      <section className="panel age-panel"><div className="panel-heading"><div><h2>Open case ageing</h2><p>Time since registration</p></div></div><div className="age-content"><div className="age-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ageing} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={3} isAnimationActive={false}>{ageing.map(item=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><b>{open.length}<small>open</small></b></div><div className="age-legend">{ageing.map(i=><div key={i.name}><i style={{background:i.color}}/><span>{i.name}</span><b>{i.value}</b></div>)}</div></div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Potential overlaps</h2><p>Rule-based similarity · review required</p></div><Link className="text-link" to="/overlaps">Review all <ArrowRight size={14}/></Link></div><div className="overlap-mini-list">{reviewAlerts.length?reviewAlerts.map(a=>{const one=cases.find(c=>c.id===a.complaintIds[0]);return <Link to={`/overlaps?alert=${a.id}`} className="overlap-mini" key={a.id}><div className="score-ring">{a.score}</div><div className="grow"><b>{one?.institutionName}</b><small>{a.complaintIds.join(' · ')}</small></div><ArrowRight size={15}/></Link>}):<p className="quiet-empty">No open alerts.</p>}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Next deadlines</h2><p>Open cases in due-date order</p></div><Link className="text-link" to="/complaints?filter=overdue">All cases <ArrowRight size={14}/></Link></div><div className="deadline-list">{upcoming.map(c=><Link to={`/complaints/${c.id}`} key={c.id} className="deadline-row"><span className={`deadline-dot ${isOverdue(c.dueAt,c.status)?'red':''}`}/><div className="grow"><b>{c.id}</b><small>{c.subject}</small></div><span className={isOverdue(c.dueAt,c.status)?'text-red':''}>{fmtDate(c.dueAt)}</span></Link>)}</div></section>
    </div>
    <section className="panel recent-panel"><div className="panel-heading"><div><h2>Recent complaints</h2><p>Latest case updates across the register</p></div><Link className="text-link" to="/complaints">Open register <ArrowRight size={14}/></Link></div><ComplaintTable complaints={[...cases].sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt)).slice(0,5)} compact/></section>
    <section className="panel recent-activity"><div className="panel-heading"><div><h2>Recent activity</h2><p>Most recent recorded case actions</p></div></div><div className="activity-list">{recentActivities.map(item=><Link className="activity-row" to={`/complaints/${item.caseId}`} key={item.caseId}><span className="activity-dot"/><span className="grow"><b>{item.action}</b><small>{item.caseId} · {item.subject}</small></span><time>{fmtDate(item.at)}</time></Link>)}</div></section>
  </>
}
