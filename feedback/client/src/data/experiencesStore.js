import initial from './experiences.json'

const STORAGE_KEY = 'experiences'

let experiences = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : initial
  } catch (e) {
    return initial
  }
})()

const subscribers = new Set()

// --- new: trend analysis storage ---
// let trendAnalysis = ''

function notify() {
  subscribers.forEach(cb => {
    try { cb(experiences) } catch (e) { /* ignore subscriber errors */ }
  })
}

export function getExperiences() {
  return experiences
}

export function setExperiences(newArr) {
  experiences = Array.isArray(newArr) ? newArr : []
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
  notify()
}

export function subscribe(fn) {
  subscribers.add(fn)
  // call immediately with current value
  try { fn(experiences) } catch (e) {}
  return () => subscribers.delete(fn)
}

export function addOrMergeExperienceByName(exp) {
  const nameTrim = (exp.name || '').trim()
  if (!nameTrim) {
    const id = experiences.length ? Math.max(...experiences.map(e => e.id)) + 1 : 1
    const newExp = { ...exp, id }
    experiences = [newExp, ...experiences]
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
    // Clear stored trend analysis so it recomputes with new experience
    try { 
      localStorage.removeItem(TREND_KEY)
      localStorage.removeItem(TREND_HASH_KEY)
    } catch (e) {}
    trendAnalysis = ''
    notify()
    return
  }

  const idx = experiences.findIndex(e => (e.name || '').trim().toLowerCase() === nameTrim.toLowerCase())
  if (idx !== -1) {
    const copy = [...experiences]
    const existing = { ...copy[idx] }
    if (exp.cadetFeedback) {
      existing.cadetFeedback = existing.cadetFeedback || { preservation: [], improvement: [], generalSummary: '' }
      existing.cadetFeedback.preservation = (existing.cadetFeedback.preservation || []).concat(exp.cadetFeedback.preservation || [])
      existing.cadetFeedback.improvement = (existing.cadetFeedback.improvement || []).concat(exp.cadetFeedback.improvement || [])
    }
    if (exp.commanderFeedback) {
      existing.commanderFeedback = existing.commanderFeedback || { preservation: [], improvement: [], overallSummary: '' }
      existing.commanderFeedback.preservation = (existing.commanderFeedback.preservation || []).concat(exp.commanderFeedback.preservation || [])
      existing.commanderFeedback.improvement = (existing.commanderFeedback.improvement || []).concat(exp.commanderFeedback.improvement || [])
      const newSummary = (exp.commanderFeedback.overallSummary || '').trim()
      if (newSummary) {
        if (existing.commanderFeedback.overallSummary && existing.commanderFeedback.overallSummary.trim()) {
          existing.commanderFeedback.overallSummary = existing.commanderFeedback.overallSummary.trim() + '\n\n' + newSummary
        } else {
          existing.commanderFeedback.overallSummary = newSummary
        }
      }
    }
    if (exp.Aisummary !== undefined && exp.Aisummary !== null) {
      existing.Aisummary = exp.Aisummary
    }
    copy[idx] = existing
    experiences = copy
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
    // Clear stored trend analysis so it recomputes with updated experience
    try { localStorage.removeItem(TREND_KEY) } catch (e) {}
    trendAnalysis = ''
    notify()
    return
  }

  const id = experiences.length ? Math.max(...experiences.map(e => e.id)) + 1 : 1
  const newExp = { ...exp, id, name: nameTrim || exp.name }
  experiences = [newExp, ...experiences]
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
  // Clear stored trend analysis so it recomputes with new experience
  try { 
    localStorage.removeItem(TREND_KEY)
    localStorage.removeItem(TREND_HASH_KEY)
  } catch (e) {}
  trendAnalysis = ''
  notify()
}

export function deleteExperienceById(id) {
  const idx = experiences.findIndex(e => e.id === id)
  if (idx !== -1) {
    experiences = experiences.filter(e => e.id !== id)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
    // Clear stored trend analysis so it recomputes after deletion
    try { 
      localStorage.removeItem(TREND_KEY)
      localStorage.removeItem(TREND_HASH_KEY)
    } catch (e) {}
    trendAnalysis = ''
    notify()
  }
}

export function exportExperiencesJSON() {
  return JSON.stringify(experiences, null, 2)
}

// --- new functions for trend analysis ---
// export function getTrendAnalysis() {
//   return trendAnalysis
// }

// export function setTrendAnalysis(text) {
//   trendAnalysis = text
// }

// in store.js
const TREND_KEY = 'trendAnalysis'
const TREND_HASH_KEY = 'trendAnalysisHash'

// Generate a hash of experiences for validation
function generateExperiencesHash(exps) {
  // Create a simple hash based on experience IDs and feedback counts
  const hashData = exps.map(exp => ({
    id: exp.id,
    cadetPreservation: exp.cadetFeedback?.preservation?.length || 0,
    cadetImprovement: exp.cadetFeedback?.improvement?.length || 0,
    commanderPreservation: exp.commanderFeedback?.preservation?.length || 0,
    commanderImprovement: exp.commanderFeedback?.improvement?.length || 0
  }))
  return JSON.stringify(hashData)
}

// Load saved trend analysis from localStorage
let trendAnalysis = (() => {
  try {
    return localStorage.getItem(TREND_KEY) || ''
  } catch (e) {
    return ''
  }
})()

// Save new trend analysis with hash
export function setTrendAnalysis(text) {
  trendAnalysis = text
  try {
    localStorage.setItem(TREND_KEY, text)
    const hash = generateExperiencesHash(experiences)
    localStorage.setItem(TREND_HASH_KEY, hash)
  } catch (e) {}
}

// Read current trend analysis
export function getTrendAnalysis() {
  return trendAnalysis
}

// Check if stored trend analysis is still valid for current experiences
export function isTrendAnalysisValid() {
  try {
    const storedHash = localStorage.getItem(TREND_HASH_KEY)
    if (!storedHash) return false
    const currentHash = generateExperiencesHash(experiences)
    return storedHash === currentHash
  } catch (e) {
    return false
  }
}


export default {
  getExperiences,
  setExperiences,
  subscribe,
  addOrMergeExperienceByName,
  deleteExperienceById,
  exportExperiencesJSON,
  getTrendAnalysis,   // added
  setTrendAnalysis,   // added
  isTrendAnalysisValid // added
}
