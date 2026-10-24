import type { DemoState, NotificationItem } from '../types'

export const notificationEnabled = (preferences:DemoState['notificationPreferences'], kind:NotificationItem['kind']) =>
  kind==='Overlap'?preferences.overlaps:kind==='Coordination'?preferences.coordination:preferences.reminders
