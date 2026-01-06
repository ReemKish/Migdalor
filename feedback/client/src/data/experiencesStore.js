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
    // assign id and push
    const id = experiences.length ? Math.max(...experiences.map(e => e.id)) + 1 : 1
    const newExp = { ...exp, id }
    experiences = [newExp, ...experiences]
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
    notify()
    return
  }

  const idx = experiences.findIndex(e => (e.name || '').trim().toLowerCase() === nameTrim.toLowerCase())
  if (idx !== -1) {
    const copy = [...experiences]
    const existing = { ...copy[idx] }
    // merge cadetFeedback
    if (exp.cadetFeedback) {
      existing.cadetFeedback = existing.cadetFeedback || { preservation: [], improvement: [], generalSummary: '' }
      existing.cadetFeedback.preservation = (existing.cadetFeedback.preservation || []).concat(exp.cadetFeedback.preservation || [])
      existing.cadetFeedback.improvement = (existing.cadetFeedback.improvement || []).concat(exp.cadetFeedback.improvement || [])
    }
    // merge commanderFeedback
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
    copy[idx] = existing
    experiences = copy
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
    notify()
    return
  }

  // no existing - add new
  const id = experiences.length ? Math.max(...experiences.map(e => e.id)) + 1 : 1
  const newExp = { ...exp, id, name: nameTrim || exp.name }
  experiences = [newExp, ...experiences]
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences)) } catch (e) {}
  notify()
}

export function exportExperiencesJSON() {
  return JSON.stringify(experiences, null, 2)
}

export default {
  getExperiences,
  setExperiences,
  subscribe,
  addOrMergeExperienceByName,
  exportExperiencesJSON
}
