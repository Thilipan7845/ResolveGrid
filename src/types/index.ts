export type Bureau = 'Regulation Bureau' | 'PGRC' | 'Coordination Cell'
export type Status = 'Submitted' | 'Under Review' | 'Awaiting Institution Response' | 'Inter-Bureau Coordination' | 'Resolved' | 'Closed'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Role = 'Administrator' | 'Bureau Officer' | 'Reviewer/Coordinator'
export type ActionHistoryEntry = { id: string; at: string; actor: string; action: string; note?: string }
export type AlertDecision = { decision: 'Reviewed' | 'Confirmed' | 'Dismissed'; actor: string; at: string; note?: string }
export type Institution = { id: string; name: string; location: string; type: string; established: number; contact: string }
export type Officer = { id: string; name: string; title: string; bureau: Bureau }
export type Complaint = {
  id: string; institutionId: string; institutionName: string; category: string; subject: string; description: string
  submittedAt: string; updatedAt: string; bureau: Bureau; officerId: string; priority: Priority; status: Status
  dueAt: string; relatedIds: string[]; history: ActionHistoryEntry[]; remarks: string[]; escalated: boolean
  disposedAt?: string
}
export type OverlapAlert = {
  id: string; complaintIds: [string, string]; score: number; reasons: string[]; createdAt: string
  review: 'Open' | 'Reviewed' | 'Confirmed' | 'Dismissed'; reviewNote?: string; history?: AlertDecision[]
}
export type CoordinationRecord = {
  id: string; complaintIds: [string, string]; origin: Bureau; receiving: Bureau; officerId: string
  status: 'Awaiting Acceptance' | 'In Coordination' | 'Awaiting Response' | 'Completed'
  deadline: string; updatedAt: string; history: ActionHistoryEntry[]; remarks?: string[]
}
export type NotificationItem = {
  id: string; title: string; message: string; kind: 'Reminder' | 'Deadline' | 'Escalation' | 'Assignment' | 'Overlap' | 'Coordination' | 'Resolution'
  createdAt: string; read: boolean; complaintId?: string; alertId?: string
}
export type DemoState = {
  complaints: Complaint[]; institutions: Institution[]; officers: Officer[]; alerts: OverlapAlert[]
  coordination: CoordinationRecord[]; notifications: NotificationItem[]; role: Role; loggedIn: boolean
  notificationPreferences: { reminders: boolean; overlaps: boolean; coordination: boolean }
  appearance: 'Light' | 'Dark' | 'System Default'
  email: string
  rememberSession: boolean
}
