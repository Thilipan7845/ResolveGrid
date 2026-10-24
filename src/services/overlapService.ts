import type { Complaint } from '../types'

const stopWords = new Set(['the','and','for','with','that','have','has','from','after','into','this','their','were','been','not','are','was','but','students','student','institute','institution','complaint','report','request','requests'])
const tokens = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((word) => word.length > 3 && !stopWords.has(word)))
export const similarityReasons = (a: Complaint, b: Complaint) => {
  let score = 0
  const reasons: string[] = []
  if (a.institutionId === b.institutionId) { score += 35; reasons.push('Same institution ID (+35)') }
  if (a.category === b.category) { score += 25; reasons.push(`Same category: ${a.category} (+25)`) }
  else if ((a.category === 'Admission' || a.category === 'Fees') && (b.category === 'Admission' || b.category === 'Fees')) { score += 12; reasons.push('Related admission and fees categories (+12)') }
  const at = tokens(`${a.subject} ${a.description}`)
  const bt = tokens(`${b.subject} ${b.description}`)
  const common = [...at].filter((word) => bt.has(word)).sort()
  const ratio = common.length / Math.max(1, new Set([...at, ...bt]).size)
  if (common.length > 0) {
    const points = Math.min(24, Math.round(ratio * 48))
    score += points
    reasons.push(`Shared terms: ${common.slice(0, 5).join(', ')} (+${points})`)
  }
  if (a.bureau !== b.bureau) { score += 12; reasons.push(`Different Bureaus: ${a.bureau} and ${b.bureau} (+12)`) }
  if (a.status === 'Closed' || b.status === 'Closed') { score -= 5; reasons.push('One case is closed; reduced relevance (−5)') }
  if (a.relatedIds.includes(b.id) || b.relatedIds.includes(a.id)) { score += 8; reasons.push('Existing related-case reference (+8)') }
  return { score: Math.max(0, Math.min(99, score)), reasons }
}
export const detectOverlaps = (complaints: Complaint[]) => {
  const found: Array<{ ids: [string, string]; score: number; reasons: string[] }> = []
  for (let i = 0; i < complaints.length; i += 1) {
    for (let j = i + 1; j < complaints.length; j += 1) {
      const a = complaints[i], b = complaints[j]
      const result = similarityReasons(a, b)
      if (result.score >= 55) found.push({ ids:[a.id,b.id], ...result })
    }
  }
  return found.sort((a,b) => b.score - a.score)
}
