import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, Clock3, Search, X } from 'lucide-react'
import type { Complaint, Priority, Status } from '../../types'
import { fmtDate, isOverdue } from '../../utils/dateUtils'
import { useApp } from '../../context/AppContext'

export const PageTitle = ({ title, description, action }: { title:string; description:string; action?:ReactNode }) => <div className="page-heading"><div><p className="eyebrow">RESOLVEGRID / SAMPLE ENVIRONMENT</p><h1>{title}</h1><p className="subheading">{description}</p></div>{action && <div className="heading-action">{action}</div>}</div>
export const StatusPill = ({ status }: { status:Status }) => <span className={`pill status-${status.toLowerCase().replaceAll(' ','-')}`}>{status}</span>
export const PriorityPill = ({ priority }: { priority:Priority }) => <span className={`priority priority-${priority.toLowerCase()}`}><i />{priority}</span>
export const Deadline = ({ complaint }: { complaint:Complaint }) => {
  const overdue = isOverdue(complaint.dueAt, complaint.status)
  return <span className={`deadline ${overdue ? 'late' : ''}`}><Clock3 size={13}/>{overdue ? `Overdue · ${fmtDate(complaint.dueAt)}` : `Due ${fmtDate(complaint.dueAt)}`}</span>
}
export const EmptyState = ({ title, children }: { title:string; children?:ReactNode }) => <div className="empty-state"><div className="empty-icon"><AlertTriangle size={19}/></div><strong>{title}</strong><p>{children ?? 'Nothing to show for this view.'}</p></div>
export const Modal = ({ title, children, onClose }: { title:string; children:ReactNode; onClose:()=>void }) => <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div>{children}</div></div>
export const ComplaintTable = ({ complaints, compact=false }: { complaints:Complaint[]; compact?:boolean }) => {
  const navigate=useNavigate()
  if (!complaints.length) return <EmptyState title="No matching complaints">Try adjusting your search or filters.</EmptyState>
  return <div className="table-wrap"><table><thead><tr><th>CASE</th><th>INSTITUTION</th><th>SUBJECT</th><th>STATUS</th><th>PRIORITY</th>{!compact && <th>BUREAU / CELL</th>}<th>DUE</th><th /></tr></thead><tbody>{complaints.map((c) => <tr key={c.id} className="click-row" onClick={() => navigate(`/complaints/${c.id}`)} onKeyDown={(event)=>{if(event.key==='Enter')navigate(`/complaints/${c.id}`)}} tabIndex={0}><td><span className="case-id">{c.id}</span><small>{fmtDate(c.submittedAt)}</small></td><td><span className="cell-primary">{c.institutionName}</span><small>{c.institutionId}</small></td><td className="subject-cell">{c.subject}</td><td><StatusPill status={c.status}/></td><td><PriorityPill priority={c.priority}/></td>{!compact && <td>{c.bureau}</td>}<td><Deadline complaint={c}/></td><td><ArrowUpRight size={15} className="muted"/></td></tr>)}</tbody></table></div>
}
export const SelectField = ({ value, onChange, options, label, disabled=false, optionLabels }: { value:string; onChange:(value:string)=>void; options:string[]; label:string; disabled?:boolean; optionLabels?:Record<string,string> }) => <label className="field"><span>{label}</span><div className="select-holder"><select disabled={disabled} value={value} onChange={(e)=>onChange(e.target.value)}>{options.map((option)=><option key={option} value={option}>{optionLabels?.[option] ?? option}</option>)}</select><ChevronDown size={15}/></div></label>
export const CaseSearch = () => {
  const { state } = useApp()
  const [query,setQuery]=useState('')
  const [open,setOpen]=useState(false)
  const matches = query.trim() ? state.complaints.filter((c)=>`${c.id} ${c.subject} ${c.institutionName}`.toLowerCase().includes(query.toLowerCase())).slice(0,5) : []
  return <div className="global-search"><Search size={16}/><input value={query} onChange={(e)=>{setQuery(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} onKeyDown={(e)=>{if(e.key==='Escape')setOpen(false)}} placeholder="Search cases or institutions…" aria-label="Search cases or institutions"/>{query&&<button onClick={()=>{setQuery('');setOpen(false)}} aria-label="Clear search"><X size={14}/></button>}{open&&matches.length>0&&<div className="search-results">{matches.map((c)=><Link to={`/complaints/${c.id}`} key={c.id} onClick={()=>{setOpen(false);setQuery('')}}><span className="case-id">{c.id}</span><span>{c.subject}</span></Link>)}</div>}</div>
}
export const Toast = ({ message, onClose }: { message:string; onClose:()=>void }) => message ? <div className="toast"><Check size={17}/><span>{message}</span><button onClick={onClose}><X size={15}/></button></div> : null
