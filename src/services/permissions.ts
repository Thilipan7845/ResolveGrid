import type { Role } from '../types'

export type Permission = 'complaint:create'|'complaint:update'|'complaint:assign'|'complaint:transfer'|'complaint:close'|'alert:review'|'coordination:manage'|'settings:admin'
const permissionMatrix: Record<Role, ReadonlySet<Permission>> = {
  Administrator:new Set(['complaint:create','complaint:update','complaint:assign','complaint:transfer','complaint:close','alert:review','coordination:manage','settings:admin']),
  'Bureau Officer':new Set(['complaint:create','complaint:update','complaint:assign','alert:review','coordination:manage']),
  'Reviewer/Coordinator':new Set(['alert:review','coordination:manage']),
}
export const hasPermission = (role:Role, permission:Permission) => permissionMatrix[role].has(permission)
export const permissionDescription = (permission:Permission) => ({
  'complaint:create':'Only administrators and case-handling officers can register cases.',
  'complaint:update':'This action is available to administrators and case-handling officers.',
  'complaint:assign':'Only administrators and case-handling officers can assign an officer.',
  'complaint:transfer':'Case transfers require administrator authorization.',
  'complaint:close':'Only administrators can close resolved cases.',
  'alert:review':'This role cannot review overlap alerts.',
  'coordination:manage':'This role cannot manage inter-bureau coordination.',
  'settings:admin':'Only administrators can change access roles or restore the sample records.',
} satisfies Record<Permission,string>)[permission]
