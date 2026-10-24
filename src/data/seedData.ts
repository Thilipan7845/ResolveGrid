import type { Complaint, CoordinationRecord, DemoState, Institution, NotificationItem, Officer, OverlapAlert } from '../types'
import { shiftDate } from '../utils/dateUtils'
import { detectOverlaps } from '../services/overlapService'
import { normalizeInstitutionId } from '../utils/institutionUtils'

export const institutions: Institution[] = [
  { id: 'AICTE-SAMPLE-001', name: 'Northlake Institute of Technology', location: 'Jaipur, Rajasthan', type: 'Private — Autonomous', established: 2008, contact: 'registrar@northlake.example' },
  { id: 'AICTE-SAMPLE-002', name: 'Sahyadri College of Engineering', location: 'Pune, Maharashtra', type: 'Private — Affiliated', established: 1998, contact: 'office@sahyadri.example' },
  { id: 'AICTE-SAMPLE-003', name: 'Eastern Valley Technical University', location: 'Bhubaneswar, Odisha', type: 'State University', established: 2004, contact: 'registrar@evtu.example' },
  { id: 'AICTE-SAMPLE-004', name: 'Meridian School of Applied Sciences', location: 'Bhopal, Madhya Pradesh', type: 'Private — Affiliated', established: 2012, contact: 'admin@meridian.example' },
  { id: 'AICTE-SAMPLE-005', name: 'Coastal Polytechnic and Research College', location: 'Kochi, Kerala', type: 'Government Aided', established: 1986, contact: 'principal@coastal.example' },
  { id: 'AICTE-SAMPLE-006', name: 'Aravalli Institute of Digital Engineering', location: 'Ahmedabad, Gujarat', type: 'Private — Autonomous', established: 2016, contact: 'helpdesk@aravalli.example' },
]
export const officers: Officer[] = [
  { id: 'off-01', name: 'Ananya Rao', title: 'Deputy Director', bureau: 'Regulation Bureau' },
  { id: 'off-02', name: 'Kabir Menon', title: 'Regional Officer', bureau: 'PGRC' },
  { id: 'off-03', name: 'Meera Kulkarni', title: 'Case Coordinator', bureau: 'Coordination Cell' },
  { id: 'off-04', name: 'Rohan Sen', title: 'Assistant Director', bureau: 'Regulation Bureau' },
]
const cases: Array<Omit<Complaint, 'history' | 'remarks' | 'updatedAt' | 'dueAt'> & { due: number; update: number; remark: string }> = [
  { id:'RG-2026-001', institutionId:'AICTE-DEMO-001', institutionName:institutions[0].name, category:'Admission', subject:'Refund pending after cancellation', description:'Students report that admission cancellation requests were accepted, but the institute has not returned the semester fee within the stated period.', submittedAt:shiftDate(-172), bureau:'PGRC', officerId:'off-02', priority:'High', status:'Under Review', relatedIds:[], escalated:true, due:-3, update:-1, remark:'Initial documents received; fee ledger requested.' },
  { id:'RG-2026-002', institutionId:'AICTE-DEMO-001', institutionName:institutions[0].name, category:'Fees', subject:'Delay in refund of withdrawn students', description:'Multiple students indicate that fees paid before withdrawal remain unpaid despite submitting cancellation forms and bank details.', submittedAt:shiftDate(-151), bureau:'Regulation Bureau', officerId:'off-01', priority:'Critical', status:'Inter-Bureau Coordination', relatedIds:[], escalated:true, due:-2, update:0, remark:'Cross-bureau review requested for matching refund records.' },
  { id:'RG-2026-003', institutionId:'AICTE-DEMO-002', institutionName:institutions[1].name, category:'Examination', subject:'Delayed publication of revaluation results', description:'Revaluation outcomes for the May assessment cycle have not been published, affecting student progression and placement verification.', submittedAt:shiftDate(-139), bureau:'PGRC', officerId:'off-02', priority:'High', status:'Resolved', relatedIds:[], escalated:false, due:2, update:-130, remark:'Institution published revaluation results; outcome verified.' },
  { id:'RG-2026-004', institutionId:'AICTE-DEMO-003', institutionName:institutions[2].name, category:'Infrastructure', subject:'Laboratory access and equipment gaps', description:'Students report restricted access to required engineering laboratories and several unavailable safety and measurement instruments.', submittedAt:shiftDate(-119), bureau:'Regulation Bureau', officerId:'off-04', priority:'Medium', status:'Closed', relatedIds:[], escalated:false, due:9, update:-110, remark:'Access schedule and equipment checks verified.' },
  { id:'RG-2026-005', institutionId:'AICTE-DEMO-003', institutionName:institutions[2].name, category:'Infrastructure', subject:'Insufficient practical lab facilities', description:'The engineering laboratory lacks functional equipment and students cannot complete scheduled practical sessions or safety training.', submittedAt:shiftDate(-99), bureau:'PGRC', officerId:'off-02', priority:'High', status:'Resolved', relatedIds:[], escalated:false, due:11, update:-90, remark:'Practical equipment availability confirmed by the review team.' },
  { id:'RG-2026-006', institutionId:'AICTE-DEMO-004', institutionName:institutions[3].name, category:'Faculty', subject:'Unfilled faculty positions in core departments', description:'Core computing and electronics courses are being handled by visiting staff while approved faculty vacancies remain unfilled.', submittedAt:shiftDate(-91), bureau:'Regulation Bureau', officerId:'off-01', priority:'Medium', status:'Closed', relatedIds:[], escalated:false, due:14, update:-82, remark:'Updated faculty roster reviewed and case closed.' },
  { id:'RG-2026-007', institutionId:'AICTE-DEMO-005', institutionName:institutions[4].name, category:'Student Grievance', subject:'No response to hostel safety complaint', description:'A previously submitted hostel safety grievance has not received a formal response and residents are seeking a documented action plan.', submittedAt:shiftDate(-72), bureau:'PGRC', officerId:'off-02', priority:'Critical', status:'Awaiting Institution Response', relatedIds:[], escalated:false, due:1, update:-1, remark:'Reminder sent to institution nodal officer.' },
  { id:'RG-2026-008', institutionId:'AICTE-DEMO-006', institutionName:institutions[5].name, category:'Admission', subject:'Admission offer withdrawn after fee payment', description:'An applicant states the admission offer was withdrawn after tuition payment and requests a review of the payment and refund record.', submittedAt:shiftDate(-62), bureau:'Regulation Bureau', officerId:'off-04', priority:'High', status:'Resolved', relatedIds:[], escalated:false, due:5, update:-55, remark:'Payment record reviewed and the refund process confirmed.' },
  { id:'RG-2026-009', institutionId:'AICTE-DEMO-006', institutionName:institutions[5].name, category:'Fees', subject:'Refund status not shared with applicant', description:'The applicant has not received a refund timeline after an admission offer was cancelled following collection of the first term fee.', submittedAt:shiftDate(-48), bureau:'PGRC', officerId:'off-02', priority:'Medium', status:'Submitted', relatedIds:[], escalated:false, due:7, update:-1, remark:'Awaiting payment receipt attachment.' },
  { id:'RG-2026-010', institutionId:'AICTE-DEMO-002', institutionName:institutions[1].name, category:'Examination', subject:'Incorrect examination fee charged', description:'Students report a duplicate examination charge on the portal and request clarification of the additional assessment fee.', submittedAt:shiftDate(-37), bureau:'PGRC', officerId:'off-02', priority:'Low', status:'Resolved', relatedIds:[], escalated:false, due:-20, update:-35, remark:'Institution corrected the student fee statements.' },
  { id:'RG-2026-011', institutionId:'AICTE-DEMO-004', institutionName:institutions[3].name, category:'Infrastructure', subject:'Accessibility lift outage', description:'The academic block lift is unavailable and students with mobility needs report difficulty reaching upper-floor teaching spaces.', submittedAt:shiftDate(-23), bureau:'Regulation Bureau', officerId:'off-04', priority:'High', status:'Closed', relatedIds:[], escalated:false, due:-30, update:-20, remark:'Resolution verified and case closed.' },
  { id:'RG-2026-012', institutionId:'AICTE-DEMO-005', institutionName:institutions[4].name, category:'Student Grievance', subject:'Hostel water quality follow-up', description:'Residents request an update on drinking water test results and remedial steps in the hostel accommodation block.', submittedAt:shiftDate(-5), bureau:'PGRC', officerId:'off-02', priority:'Medium', status:'Submitted', relatedIds:[], escalated:false, due:12, update:0, remark:'Pending assignment review.' },
  { id:'RG-2026-013', institutionId:'AICTE-DEMO-005', institutionName:institutions[4].name, category:'Student Grievance', subject:'Coordinated review of hostel safety actions', description:'The institution has submitted a revised safety action plan and requests coordinated review of its implementation timeline and student communication.', submittedAt:shiftDate(-3), bureau:'Coordination Cell', officerId:'off-03', priority:'High', status:'Under Review', relatedIds:[], escalated:false, due:10, update:-1, remark:'Action plan routed to the Coordination Cell for a joint review.' },
]
export const initialComplaints: Complaint[] = cases.map((item) => ({
  ...item, institutionId:normalizeInstitutionId(item.institutionId), dueAt: shiftDate(item.due), updatedAt: shiftDate(item.update), disposedAt:item.status==='Resolved'||item.status==='Closed'?shiftDate(item.update):undefined,
  history: [{ id:`h-${item.id}-1`, at:item.submittedAt, actor:'System', action:'Complaint registered', note:'Illustrative sample record.' },
    { id:`h-${item.id}-2`, at:shiftDate(item.update), actor:officers.find((officer) => officer.id === item.officerId)?.name ?? 'Demo Officer', action:item.status === 'Submitted' ? 'Assigned for initial review' : item.status, note:item.remark }],
  remarks:[item.remark],
}))
const seededAlertReviews: Record<string, { id:string; review:OverlapAlert['review']; note?:string }> = {
  'RG-2026-001:RG-2026-002':{ id:'OV-2026-014', review:'Open' },
  'RG-2026-004:RG-2026-005':{ id:'OV-2026-012', review:'Open' },
  'RG-2026-008:RG-2026-009':{ id:'OV-2026-009', review:'Reviewed', note:'Reviewed; both refer to the same applicant-facing admission cycle.' },
  'RG-2026-007:RG-2026-012':{ id:'OV-2026-006', review:'Open' },
  'RG-2026-003:RG-2026-010':{ id:'OV-2026-003', review:'Dismissed', note:'Different examination issues; retained as a false-positive example.' },
}
export const initialAlerts: OverlapAlert[] = detectOverlaps(initialComplaints).map((match, index) => {
  const pairKey = [...match.ids].sort().join(':')
  const seeded = seededAlertReviews[pairKey]
  const review = seeded?.review ?? 'Open'
  const note = seeded?.note
  return { id:seeded?.id ?? `OV-2026-${String(20-index).padStart(3,'0')}`, complaintIds:match.ids, score:match.score, reasons:match.reasons, createdAt:shiftDate(-Math.min(index+1,25)), review, reviewNote:note, history:note ? [{ decision:review as 'Reviewed'|'Dismissed', actor:'Sample reviewer', at:shiftDate(-Math.min(index+1,25)), note }] : [] }
})
export const initialCoordination: CoordinationRecord[] = [{
  id:'CO-2026-004', complaintIds:['RG-2026-001','RG-2026-002'], origin:'PGRC', receiving:'Regulation Bureau', officerId:'off-01',
  status:'In Coordination', deadline:shiftDate(4), updatedAt:shiftDate(-1),
  history:[{ id:'co-h1', at:shiftDate(-2), actor:'Meera Kulkarni', action:'Coordination initiated', note:'Compare refund and cancellation records.' }, { id:'co-h2', at:shiftDate(-1), actor:'Ananya Rao', action:'Accepted by receiving Bureau' }],
  remarks:['Compare refund and cancellation records.'],
}]
export const initialNotifications: NotificationItem[] = [
  { id:'N-001', title:'Overdue case requires attention', message:'RG-2026-001 is 3 days past its due date.', kind:'Escalation', createdAt:shiftDate(-1), read:false, complaintId:'RG-2026-001' },
  { id:'N-002', title:'Potential overlap detected', message:'RG-2026-001 and RG-2026-002 may concern a shared refund issue.', kind:'Overlap', createdAt:shiftDate(-1), read:false, alertId:'OV-2026-014' },
  { id:'N-003', title:'Coordination accepted', message:'Regulation Bureau accepted coordination for RG-2026-001.', kind:'Coordination', createdAt:shiftDate(-1), read:false, complaintId:'RG-2026-001' },
  { id:'DUE-RG-2026-007', title:'Upcoming case deadline', message:'RG-2026-007 is due in 1 day.', kind:'Deadline', createdAt:shiftDate(0), read:false, complaintId:'RG-2026-007' },
  { id:'N-005', title:'Case assigned for review', message:'RG-2026-006 is assigned to Ananya Rao.', kind:'Assignment', createdAt:shiftDate(-2), read:true, complaintId:'RG-2026-006' },
  { id:'N-006', title:'Complaint registered', message:'RG-2026-012 was registered and is awaiting review.', kind:'Reminder', createdAt:shiftDate(0), read:true, complaintId:'RG-2026-012' },
  { id:'N-007', title:'Resolution recorded', message:'RG-2026-010 has been resolved.', kind:'Resolution', createdAt:shiftDate(-4), read:true, complaintId:'RG-2026-010' },
  { id:'N-008', title:'Potential overlap needs review', message:'Two infrastructure complaints at Eastern Valley may share context.', kind:'Overlap', createdAt:shiftDate(-3), read:true, alertId:'OV-2026-012' },
]
export const createInitialState = (): DemoState => ({
  complaints: initialComplaints, institutions, officers, alerts: initialAlerts, coordination: initialCoordination,
  notifications: initialNotifications, role:'Administrator', loggedIn:false,
  notificationPreferences:{ reminders:true, overlaps:true, coordination:true }, appearance:'Light', email:'', rememberSession:false,
})
