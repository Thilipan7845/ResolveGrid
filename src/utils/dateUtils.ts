export const shiftDate = (days: number, from = new Date()) => {
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
export const fmtDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
export const fmtDateTime = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
export const isOpen = (status: string) => status !== 'Resolved' && status !== 'Closed'
export const isOverdue = (dueAt: string, status: string) => isOpen(status) && new Date(dueAt).getTime() < Date.now()
export const daysUntil = (value: string) => Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)
