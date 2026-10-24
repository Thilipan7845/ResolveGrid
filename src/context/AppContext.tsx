import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Complaint, CoordinationRecord, DemoState, NotificationItem, Role, Status } from '../types'
import { createInitialState } from '../data/seedData'
import { loadState, saveState } from '../services/storageService'
import { detectOverlaps, similarityReasons } from '../services/overlapService'
import { shiftDate } from '../utils/dateUtils'
import { clearLocalSession, readLocalSession, storeLocalSession } from '../services/storageService'
import { hasPermission } from '../services/permissions'
import { notificationEnabled } from '../services/notificationService'

type ContextValue = {
  state: DemoState
  login: (role: Role, email:string, remember:boolean) => void
  logout: () => void
  setRole: (role: Role) => void
  reset: () => void
  registerComplaint: (input: Omit<Complaint, 'id'|'updatedAt'|'relatedIds'|'history'|'remarks'|'escalated'>) => string
  updateComplaint: (id: string, changes: Partial<Complaint>, action: string, note?: string) => void
  addRemark: (id: string, remark: string) => void
  reviewAlert: (id: string, review: 'Reviewed'|'Confirmed'|'Dismissed', note?: string) => void
  startCoordination: (ids: [string,string], receiving: CoordinationRecord['receiving'], officerId: string, note: string) => string | null
  reassignCoordination: (id:string, receiving:CoordinationRecord['receiving'], officerId:string, note:string) => void
  addCoordinationRemark: (id:string, remark:string) => void
  updateCoordination: (id: string, status: CoordinationRecord['status'], note: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  setPreferences: (preferences: DemoState['notificationPreferences']) => void
  setAppearance: (appearance:DemoState['appearance']) => void
}
const Context = createContext<ContextValue | null>(null)
const newHistory = (action: string, note?: string, actor='ResolveGrid official') => ({ id:`h-${Date.now()}-${Math.random().toString(16).slice(2,6)}`, at:new Date().toISOString(), actor, action, note })
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DemoState>(loadState)
  useEffect(() => saveState(state), [state])
  useEffect(() => {
    const session = readLocalSession()
    setState((current) => ({ ...current, loggedIn:Boolean(session), email:session?.email ?? '', role:session?.role ?? current.role, rememberSession:Boolean(session) }))
  }, [])
  useEffect(() => {
    const today = Date.now()
    const generated: NotificationItem[] = []
    for (const complaint of state.complaints) {
      const unresolved = complaint.status !== 'Resolved' && complaint.status !== 'Closed'
      const timeUntilDeadline = new Date(complaint.dueAt).getTime() - today
      const daysRemaining = timeUntilDeadline < 0
        ? -Math.max(1, Math.ceil(Math.abs(timeUntilDeadline) / 86400000))
        : Math.ceil(timeUntilDeadline / 86400000)
      if (!unresolved || !state.notificationPreferences.reminders) continue
      if (daysRemaining < 0 && !state.notifications.some((item) => item.complaintId === complaint.id && item.kind === 'Escalation')) {
        generated.push({ id:`OVERDUE-${complaint.id}`, title:'Overdue case escalation', message:`${complaint.id} is ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} past its due date.`, kind:'Escalation', createdAt:new Date().toISOString(), read:false, complaintId:complaint.id })
      } else if (daysRemaining >= 0 && daysRemaining <= 2 && !state.notifications.some((item) => item.complaintId === complaint.id && item.kind === 'Deadline')) {
        generated.push({ id:`DUE-${complaint.id}`, title:'Upcoming case deadline', message:`${complaint.id} is due ${daysRemaining === 0 ? 'today' : `in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}.`, kind:'Deadline', createdAt:new Date().toISOString(), read:false, complaintId:complaint.id })
      }
    }
    if(state.notificationPreferences.reminders)for(const cycle of state.coordination){
      if(cycle.status==='Completed')continue
      const timeUntilDeadline=new Date(cycle.deadline).getTime()-today
      const overdue=timeUntilDeadline<0
      const daysRemaining=overdue?-Math.max(1,Math.ceil(Math.abs(timeUntilDeadline)/86400000)):Math.ceil(timeUntilDeadline/86400000)
      if(!overdue&&daysRemaining>2)continue
      const id=`CO-${overdue?'OVERDUE':'DUE'}-${cycle.id}`
      if(state.notifications.some(item=>item.id===id))continue
      generated.push({id,title:overdue?'Coordination deadline overdue':'Coordination response due',message:`${cycle.id} for ${cycle.complaintIds.join(' and ')} is ${overdue?`${Math.abs(daysRemaining)} day${Math.abs(daysRemaining)===1?'':'s'} overdue`:daysRemaining===0?'due today':`due in ${daysRemaining} day${daysRemaining===1?'':'s'}`}.`,kind:overdue?'Escalation':'Deadline',createdAt:new Date().toISOString(),read:false,complaintId:cycle.complaintIds[0]})
    }
    if (generated.length) setState((current) => {
      const existingIds = new Set(current.notifications.map((item) => item.id))
      const additions = generated.filter((item) => {
        if (existingIds.has(item.id)) return false
        existingIds.add(item.id)
        return true
      })
      return additions.length ? { ...current, notifications:[...additions,...current.notifications] } : current
    })
  }, [state.complaints, state.coordination, state.notificationPreferences, state.notifications])
  const notify = (item: Omit<NotificationItem, 'id'|'createdAt'|'read'>, preferences:DemoState['notificationPreferences'], existing:NotificationItem[] = state.notifications) => {
    if (!notificationEnabled(preferences,item.kind)) return null
    if (existing.some((notification)=>notification.kind===item.kind&&notification.title===item.title&&notification.message===item.message&&notification.complaintId===item.complaintId&&notification.alertId===item.alertId)) return null
    return { ...item, id:`N-${Date.now()}-${Math.random().toString(16).slice(2,5)}`, createdAt:new Date().toISOString(), read:false } satisfies NotificationItem
  }
  const actorName = (current:DemoState) => current.email ? current.email.split('@')[0] : current.role
  const value = useMemo<ContextValue>(() => ({
    state,
    login: (role,email,remember) => { storeLocalSession({ role,email,remember }); setState((s) => ({ ...s, role,email,rememberSession:remember,loggedIn:true })) },
    logout: () => { clearLocalSession(); setState((s) => ({ ...s, loggedIn:false,email:'',rememberSession:false })) },
    setRole: (role) => { if (!hasPermission(state.role,'settings:admin')) return; storeLocalSession({ role,email:state.email,remember:state.rememberSession }); setState((s) => ({ ...s, role })) },
    reset: () => { if (!hasPermission(state.role,'settings:admin')) return; const fresh = createInitialState(); setState({ ...fresh, loggedIn:true, role:state.role,email:state.email,rememberSession:state.rememberSession,appearance:state.appearance }) },
    registerComplaint: (input) => {
      if (!hasPermission(state.role,'complaint:create')) return ''
      if (!state.officers.some((officer)=>officer.id===input.officerId&&officer.bureau===input.bureau)) return ''
      const id = `RG-2026-${String(Math.max(12, ...state.complaints.map((c) => Number(c.id.slice(-3)))) + 1).padStart(3,'0')}`
      const complaint: Complaint = { ...input, id, updatedAt:new Date().toISOString(), relatedIds:[], history:[newHistory('Complaint registered', 'New illustrative record.',actorName(state))], remarks:[], escalated:false }
      const all = [...state.complaints, complaint]
      const matches = detectOverlaps(all).filter((match) => match.ids.includes(id))
      const newAlerts = matches.filter((match) => !state.alerts.some((existing) => [...existing.complaintIds].sort().join(':') === [...match.ids].sort().join(':'))).map((match, index) => ({ id:`OV-${Date.now()}-${index+1}`, complaintIds:match.ids as [string,string], score:match.score, reasons:match.reasons, createdAt:new Date().toISOString(), review:'Open' as const,history:[] }))
      const notifications:NotificationItem[] = []
      const registered=notify({ title:'Complaint registered', message:`${id} has been added to the register.`, kind:'Assignment', complaintId:id },state.notificationPreferences)
      if(registered)notifications.push(registered)
      for(const alert of newAlerts){const item=notify({ title:'Potential overlap detected', message:`${alert.complaintIds.join(' and ')} may share context.`, kind:'Overlap', alertId:alert.id },state.notificationPreferences,[...state.notifications,...notifications]);if(item)notifications.push(item)}
      setState((s) => ({ ...s, complaints:all, alerts:[...newAlerts,...s.alerts], notifications:[...notifications,...s.notifications] }))
      return id
    },
    updateComplaint: (id, changes, action, note) => {
      const permission = changes.bureau !== undefined ? 'complaint:transfer' : changes.status === 'Closed' ? 'complaint:close' : changes.priority !== undefined || changes.officerId !== undefined ? 'complaint:assign' : 'complaint:update'
      if (!hasPermission(state.role,permission)) return
      const current = state.complaints.find((complaint)=>complaint.id===id)
      if (!current || current.status==='Closed') return
      if (changes.officerId && !state.officers.some((officer)=>officer.id===changes.officerId&&officer.bureau===(changes.bureau??current.bureau))) return
      if (changes.status==='Resolved' && !note?.trim()) return
      const allowedTransitions:Record<Status,Status[]> = {
        Submitted:['Under Review','Awaiting Institution Response','Inter-Bureau Coordination','Resolved'],
        'Under Review':['Awaiting Institution Response','Inter-Bureau Coordination','Resolved'],
        'Awaiting Institution Response':['Under Review','Inter-Bureau Coordination','Resolved'],
        'Inter-Bureau Coordination':['Under Review','Awaiting Institution Response','Resolved'],
        Resolved:['Closed'],
        Closed:[],
      }
      if (changes.status && changes.status!==current.status && !allowedTransitions[current.status].includes(changes.status)) return
      setState((s) => {
        const updated=s.complaints.map((c) => {
          if (c.id !== id) return c
          const disposedAt=changes.status==='Resolved'?new Date().toISOString():changes.status==='Closed'?(c.disposedAt??new Date().toISOString()):c.disposedAt
          return { ...c, ...changes, disposedAt, updatedAt:new Date().toISOString(), history:[newHistory(action,note,actorName(s)), ...c.history] }
        })
        const matches=detectOverlaps(updated)
        const pairKey=(ids:string[])=>[...ids].sort().join(':')
        const existingPairs=new Set(s.alerts.map(alert=>pairKey(alert.complaintIds)))
        const newAlerts=matches.filter(match=>!existingPairs.has(pairKey(match.ids))).map((match,index)=>({id:`OV-${Date.now()}-${index+1}`,complaintIds:match.ids,score:match.score,reasons:match.reasons,createdAt:new Date().toISOString(),review:'Open' as const,history:[]}))
        const refreshedAlerts=s.alerts.map(alert=>{const left=updated.find(complaint=>complaint.id===alert.complaintIds[0]),right=updated.find(complaint=>complaint.id===alert.complaintIds[1]);if(!left||!right)return alert;return {...alert,...similarityReasons(left,right)}})
        const notices:NotificationItem[]=[]
        if(changes.bureau){const item=notify({title:'Case transferred',message:`${id} was transferred to ${changes.bureau}.`,kind:'Assignment',complaintId:id},s.notificationPreferences,s.notifications);if(item)notices.push(item)}
        if(changes.officerId&&changes.officerId!==current.officerId){const name=s.officers.find(o=>o.id===changes.officerId)?.name??'a new officer';const item=notify({title:'Case assignment updated',message:`${id} is assigned to ${name}.`,kind:'Assignment',complaintId:id},s.notificationPreferences,[...s.notifications,...notices]);if(item)notices.push(item)}
        if(changes.status==='Resolved'||changes.status==='Closed'){const item=notify({title:changes.status==='Closed'?'Case closed':'Case resolved',message:`${id} was ${changes.status.toLowerCase()}.`,kind:'Resolution',complaintId:id},s.notificationPreferences,[...s.notifications,...notices]);if(item)notices.push(item)}
        for(const alert of newAlerts){const item=notify({title:'Potential overlap detected',message:`${alert.complaintIds.join(' and ')} may share context.`,kind:'Overlap',alertId:alert.id},s.notificationPreferences,[...s.notifications,...notices]);if(item)notices.push(item)}
        return {...s,complaints:updated,alerts:[...newAlerts,...refreshedAlerts],notifications:[...notices,...s.notifications]}
      })
    },
    addRemark: (id, remark) => { if (!hasPermission(state.role,'complaint:update')) return; setState((s) => ({ ...s, complaints:s.complaints.map((c) => c.id === id ? { ...c, updatedAt:new Date().toISOString(), remarks:[remark,...c.remarks], history:[newHistory('Remark added',remark,actorName(s)),...c.history] } : c) })) },
    reviewAlert: (id, review, note) => setState((s) => {
      if (!hasPermission(s.role,'alert:review')) return s
      const alert = s.alerts.find((item) => item.id === id)
      const at=new Date().toISOString(), decision={decision:review,actor:actorName(s),at,note}
      const complaints = s.complaints.map((c) => alert?.complaintIds.includes(c.id) && review === 'Confirmed' ? { ...c, relatedIds:[...new Set([...c.relatedIds,...alert.complaintIds.filter((related) => related !== c.id)])], history:[newHistory('Related cases confirmed',note,actorName(s)),...c.history] } : c)
      const left=alert&&complaints.find((c)=>c.id===alert.complaintIds[0]),right=alert&&complaints.find((c)=>c.id===alert.complaintIds[1])
      const refreshedMatch=left&&right?similarityReasons(left,right):undefined
      const notifications=review==='Confirmed'?notify({title:'Related cases confirmed',message:`${alert?.complaintIds.join(' and ')} were confirmed as related.`,kind:'Overlap',alertId:id},s.notificationPreferences,s.notifications):null
      return { ...s, complaints, alerts:s.alerts.map((item) => item.id === id ? { ...item, ...refreshedMatch, review, reviewNote:note || item.reviewNote,history:[...(item.history??[]),decision] } : item), notifications:notifications?[notifications,...s.notifications]:s.notifications }
    }),
    startCoordination: (ids, receiving, officerId, note) => {
      if (!hasPermission(state.role,'coordination:manage')) return null
      const originCase=state.complaints.find((complaint)=>complaint.id===ids[0])
      if(!originCase||receiving===originCase.bureau||!state.officers.some((officer)=>officer.id===officerId&&officer.bureau===receiving))return null
      if(ids.some((id)=>{const complaint=state.complaints.find((item)=>item.id===id);return !complaint||complaint.status==='Resolved'||complaint.status==='Closed'}))return null
      const duplicate = state.coordination.find((c) => [...c.complaintIds].sort().join(':') === [...ids].sort().join(':') && c.status !== 'Completed')
      if (duplicate) return duplicate.id
      const id = `CO-${Date.now().toString().slice(-7)}`
      const record: CoordinationRecord = { id, complaintIds:ids, origin:originCase.bureau, receiving, officerId, status:'Awaiting Acceptance', deadline:shiftDate(5), updatedAt:new Date().toISOString(), history:[newHistory('Coordination initiated',note,actorName(state))],remarks:[note] }
      setState((s) => {
        const updatedComplaints = s.complaints.map((c) => ids.includes(c.id) ? { ...c, status:'Inter-Bureau Coordination' as Status, updatedAt:new Date().toISOString(), history:[newHistory('Inter-Bureau Coordination',note,actorName(s)),...c.history] } : c)
        const notification=notify({ title:'Coordination initiated', message:`Coordination opened for ${ids.join(' and ')}.`, kind:'Coordination', complaintId:ids[0] },s.notificationPreferences,s.notifications)
        return { ...s, coordination:[record,...s.coordination], complaints:updatedComplaints, notifications:notification?[notification,...s.notifications]:s.notifications }
      })
      return id
    },
    reassignCoordination: (id, receiving, officerId, note) => {
      if (!hasPermission(state.role,'coordination:manage')) return
      const current=state.coordination.find((item)=>item.id===id)
      if(!current||current.status==='Completed'||receiving===current.origin||!state.officers.some((officer)=>officer.id===officerId&&officer.bureau===receiving))return
      setState((s)=>({ ...s, coordination:s.coordination.map(c=>c.id===id?{...c,receiving,officerId,updatedAt:new Date().toISOString(),history:[newHistory('Coordination reassigned',note,actorName(s)),...c.history]}:c),notifications:[notify({title:'Coordination reassigned',message:`${id} is assigned to ${receiving}.`,kind:'Coordination',complaintId:s.coordination.find(c=>c.id===id)?.complaintIds[0]},s.notificationPreferences),...s.notifications].filter((item):item is NotificationItem=>Boolean(item)) }))
    },
    addCoordinationRemark: (id, remark) => {
      if (!hasPermission(state.role,'coordination:manage')) return
      if(state.coordination.find((record)=>record.id===id)?.status==='Completed')return
      setState((s)=>({ ...s, coordination:s.coordination.map(c=>c.id===id?{...c,remarks:[remark,...(c.remarks??[])],updatedAt:new Date().toISOString(),history:[newHistory('Coordination remark added',remark,actorName(s)),...c.history]}:c) }))
    },
    updateCoordination: (id, status, note) => {
      if (!hasPermission(state.role,'coordination:manage')) return
      if(state.coordination.find((record)=>record.id===id)?.status==='Completed')return
      setState((s) => ({ ...s, coordination:s.coordination.map((c) => c.id === id ? { ...c, status, updatedAt:new Date().toISOString(), history:[newHistory(status,note,actorName(s)),...c.history] } : c), complaints:status==='Completed'?s.complaints.map((complaint)=>s.coordination.some((record)=>record.id===id&&record.complaintIds.includes(complaint.id))&&complaint.status==='Inter-Bureau Coordination'?{...complaint,status:'Under Review',updatedAt:new Date().toISOString(),history:[newHistory('Coordination completed',note,actorName(s)),...complaint.history]}:complaint):s.complaints, notifications:[notify({ title:'Coordination updated', message:`${id}: ${status}.`, kind:'Coordination', complaintId:s.coordination.find((c) => c.id === id)?.complaintIds[0] },s.notificationPreferences),...s.notifications].filter((item):item is NotificationItem=>Boolean(item)) }))
    },
    markRead: (id) => setState((s) => ({ ...s, notifications:s.notifications.map((n) => n.id === id ? { ...n, read:true } : n) })),
    markAllRead: () => setState((s) => ({ ...s, notifications:s.notifications.map((n) => ({ ...n, read:true })) })),
    setPreferences: (notificationPreferences) => setState((s) => ({ ...s, notificationPreferences })),
    setAppearance: (appearance) => setState((s)=>({...s,appearance})),
  }), [state])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useApp = () => {
  const context = useContext(Context)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
