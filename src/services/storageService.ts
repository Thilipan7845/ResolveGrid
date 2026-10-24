import type { DemoState } from '../types'
import { createInitialState } from '../data/seedData'
import { detectOverlaps, similarityReasons } from './overlapService'
import { normalizeInstitutionId } from '../utils/institutionUtils'

const STORAGE_KEY = 'resolvegrid-demo-v1'
const SESSION_KEY = 'resolvegrid-session-v1'
type StoredEnvelope = Partial<DemoState> & { version?: number }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isValidState = (value: unknown): value is StoredEnvelope => {
  if (!isRecord(value)) return false
  const arrays = ['complaints','institutions','officers','alerts','coordination','notifications']
  if (!arrays.every((key) => Array.isArray(value[key]))) return false
  const idsAreUnique = (key:string) => {
    const rows = value[key] as Array<unknown>
    return rows.every((row) => isRecord(row) && typeof row.id === 'string') && new Set(rows.map((row) => (row as Record<string,unknown>).id)).size === rows.length
  }
  if (!['complaints','institutions','officers','alerts','coordination','notifications'].every(idsAreUnique)) return false
  if (value.role !== undefined && !['Administrator','Bureau Officer','Reviewer/Coordinator'].includes(String(value.role))) return false
  if (value.appearance !== undefined && !['Light','Dark','System Default'].includes(String(value.appearance))) return false
  if (value.notificationPreferences !== undefined) {
    if (!isRecord(value.notificationPreferences)) return false
    const preferences=value.notificationPreferences as Record<string,unknown>
    if (!['reminders','overlaps','coordination'].every((key) => typeof preferences[key] === 'boolean')) return false
  }
  const complaints = value.complaints as Array<Record<string,unknown>>
  if (!complaints.every((row) => typeof row.id === 'string' && typeof row.institutionId === 'string' && typeof row.subject === 'string' && typeof row.description === 'string' && Array.isArray(row.history) && Array.isArray(row.remarks) && Array.isArray(row.relatedIds))) return false
  return true
}
export const readLocalSession = () => {
  try {
    const remembered = localStorage.getItem(SESSION_KEY)
    const transient = sessionStorage.getItem(SESSION_KEY)
    const raw = remembered ?? transient
    if (!raw) return null
    const session: unknown = JSON.parse(raw)
    if (!isRecord(session) || !['Administrator','Bureau Officer','Reviewer/Coordinator'].includes(String(session.role)) || typeof session.email !== 'string') return null
    return { role:session.role as DemoState['role'], email:session.email, remember:remembered !== null }
  } catch (error) {
    console.warn('ResolveGrid session could not be restored.', error)
    return null
  }
}
export const loadState = (): DemoState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createInitialState()
    const parsed: unknown = JSON.parse(saved)
    if (isValidState(parsed)) {
      const session = readLocalSession()
      const defaults=createInitialState()
      const migrated:DemoState = {
        ...defaults, ...parsed,
        notificationPreferences:{...defaults.notificationPreferences,...parsed.notificationPreferences},
        appearance:parsed.appearance ?? defaults.appearance,
        loggedIn:Boolean(session), role:session?.role ?? parsed.role ?? defaults.role,
        email:session?.email ?? '', rememberSession:Boolean(session),
      }
      migrated.institutions=migrated.institutions.map(institution=>({...institution,id:normalizeInstitutionId(institution.id)}))
      migrated.complaints=migrated.complaints.map(complaint=>{
        const officer=migrated.officers.find(item=>item.id===complaint.officerId&&item.bureau===complaint.bureau)
          ??migrated.officers.find(item=>item.bureau===complaint.bureau)
        const isDisposed=complaint.status==='Resolved'||complaint.status==='Closed'
        return {...complaint,institutionId:normalizeInstitutionId(complaint.institutionId),officerId:officer?.id??complaint.officerId,disposedAt:complaint.disposedAt??(isDisposed?complaint.updatedAt:undefined),history:complaint.history.map(entry=>({...entry,note:entry.note?.replace(/\bdemonstration\b/gi,'sample')}))}
      })
      if((parsed.version??0)<3){
        const departmentSample=defaults.complaints.find(complaint=>complaint.id==='RG-2026-013')
        if(departmentSample&&!migrated.complaints.some(complaint=>complaint.id===departmentSample.id)){
          migrated.complaints.push(departmentSample)
        }
      }
      const validIds=new Set(migrated.complaints.map((complaint)=>complaint.id))
      migrated.alerts=migrated.alerts.flatMap((alert)=>{
        if(!alert.complaintIds.every((id)=>validIds.has(id))) return []
        const [leftId,rightId]=alert.complaintIds
        const left=migrated.complaints.find((complaint)=>complaint.id===leftId)
        const right=migrated.complaints.find((complaint)=>complaint.id===rightId)
        if(!left||!right) return []
        const match=similarityReasons(left,right)
        return [{...alert,...match,history:alert.history??[]}]
      })
      const existingPairs=new Set(migrated.alerts.map(alert=>[...alert.complaintIds].sort().join(':')))
      for(const [index,match] of detectOverlaps(migrated.complaints).entries()){
        const pairKey=[...match.ids].sort().join(':')
        if(existingPairs.has(pairKey))continue
        existingPairs.add(pairKey)
        migrated.alerts.push({id:`OV-MIG-2026-${String(index+1).padStart(3,'0')}`,complaintIds:match.ids,score:match.score,reasons:match.reasons,createdAt:new Date().toISOString(),review:'Open',history:[]})
      }
      for(const alert of migrated.alerts.filter((item)=>item.review==='Confirmed')){
        for(const complaint of migrated.complaints.filter((item)=>alert.complaintIds.includes(item.id))){
          complaint.relatedIds=[...new Set([...complaint.relatedIds,...alert.complaintIds.filter((id)=>id!==complaint.id)])]
        }
      }
      const complaintIds=new Set(migrated.complaints.map((item)=>item.id))
      migrated.coordination=migrated.coordination.filter((record)=>record.complaintIds.every((id)=>complaintIds.has(id)))
      const seenNotifications=new Set<string>()
      migrated.notifications=migrated.notifications.filter((notification)=>{
        const key=`${notification.kind}|${notification.title}|${notification.complaintId??''}|${notification.alertId??''}`
        if(seenNotifications.has(key)) return false
        seenNotifications.add(key)
        return true
      })
      return migrated
    }
    console.warn('ResolveGrid saved records failed validation; original sample records were loaded.')
  } catch (error) {
    console.warn('ResolveGrid local data could not be read; restoring sample data.', error)
  }
  return createInitialState()
}
export const saveState = (state: DemoState) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, loggedIn:false, email:'', rememberSession:false, version:3 })) }
  catch (error) { console.error('ResolveGrid local data could not be saved.', error) }
}
export const storeLocalSession = (session: { email:string; role:DemoState['role']; remember:boolean }) => {
  const destination = session.remember ? localStorage : sessionStorage
  const other = session.remember ? sessionStorage : localStorage
  other.removeItem(SESSION_KEY)
  destination.setItem(SESSION_KEY, JSON.stringify(session))
}
export const clearLocalSession = () => {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
