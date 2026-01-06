import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import ExperienceDetails from '../components/ExperienceDetails'
import Divider from '@mui/material/Divider'
import store from '../data/experiencesStore'

const sampleTags = ['אנרגיה', 'תפקידים', 'קצב', 'מעשי', 'חומרים', 'מטרות', 'אחר']


export default function Commanderx() {
  const [experiences, setExperiences] = useState(store.getExperiences())
  useEffect(() => {
    const unsub = store.subscribe(setExperiences)
    return unsub
  }, [])

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [feedbackType, setFeedbackType] = useState('commander')
  const [generated, setGenerated] = useState({ preservation: [], improvement: [], overallSummary: '' })

  

  function openAdd() {
    setName('')
    setFeedbackType('commander')
    // reset generated fields
    setGenerated({ preservation: [], improvement: [], overallSummary: '' })
    setAddOpen(true)
  }

  function addPairField() {
    setGenerated(prev => ({
      ...prev,
      preservation: [...prev.preservation, { text: '', tag: sampleTags[0] }],
      improvement: [...prev.improvement, { text: '', tag: sampleTags[1] }]
    }))
  }

  // Tag edit modal for choosing existing tag or entering a custom one
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [tagModalSection, setTagModalSection] = useState(null)
  const [tagModalIdx, setTagModalIdx] = useState(null)
  const [tempTag, setTempTag] = useState('')

  function openTagModal(section, idx) {
    setTagModalSection(section)
    setTagModalIdx(idx)
    const current = generated[section] && generated[section][idx] ? generated[section][idx].tag : ''
    setTempTag(current || '')
    setTagModalOpen(true)
  }

  function applyTagModal() {
    if (tagModalSection == null || tagModalIdx == null) return
    updateGeneratedItem(tagModalSection, tagModalIdx, 'tag', tempTag)
    setTagModalOpen(false)
  }

  

  function submitNewExperience() {
    const nameTrim = (name || '').trim() || ''
    const newExpTemplate = { name: nameTrim || '' }

    // Build feedback object based on form
    if (feedbackType === 'cadet') {
      newExpTemplate.cadetFeedback = {
        preservation: generated.preservation.map(g => ({ text: g.text, tag: g.tag })),
        improvement: generated.improvement.map(g => ({ text: g.text, tag: g.tag })),
        generalSummary: ''
      }
    } else {
      newExpTemplate.commanderFeedback = {
        preservation: generated.preservation.map(g => ({ text: g.text, tag: g.tag, original: '' })),
        improvement: generated.improvement.map(g => ({ text: g.text, tag: g.tag, original: '' })),
        overallSummary: (generated.overallSummary || '').trim(),
        originalOverall: ''
      }
    }

    // Delegate merge/add to store
    store.addOrMergeExperienceByName(newExpTemplate)
    setAddOpen(false)
  }

  function exportExperiences() {
    const data = store.exportExperiencesJSON()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'experiences.updated.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function updateGeneratedItem(section, idx, key, value) {
    setGenerated(prev => {
      const copy = { ...prev, preservation: [...prev.preservation], improvement: [...prev.improvement] }
      copy[section][idx] = { ...copy[section][idx], [key]: value }
      return copy
    })
  }

  return (
    <Box dir="rtl" component="section" sx={{ width: '100%', minHeight: '100vh', px: 0, py: 6, bgcolor: '#f6f7fb' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" align="right" sx={{ fontWeight: 700 }}>דף מפק"ץ</Typography>
        <Button variant="contained" onClick={openAdd}>הוספת התנסות</Button>
      </Box>

      <Grid container spacing={4} direction="column" alignItems="center" sx={{ mt: 2 }}>
        {experiences.map(exp => (
          <Grid item xs={12} key={exp.id} sx={{ width: '100%' }}>
            <ExperienceDetails exp={exp} />
          </Grid>
        ))}
      </Grid>

      {/* Add Experience Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="md" PaperProps={{ dir: 'rtl' }}>
        <DialogTitle sx={{ textAlign: 'right' }}>הוספת התנסות</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
            <TextField label="שם התנסות" value={name} onChange={e => setName(e.target.value)} />

            <FormControl>
              <RadioGroup row value={feedbackType} onChange={e => setFeedbackType(e.target.value)}>
                <FormControlLabel value="cadet" control={<Radio />} label="משוב צוערים" />
                <FormControlLabel value="commander" control={<Radio />} label={'משוב מפק"צים'} />
              </RadioGroup>
            </FormControl>

            {feedbackType === 'commander' && (
              <TextField label={'סיכום מפק"ץ'} multiline minRows={2} value={generated.overallSummary} onChange={e => setGenerated(prev => ({ ...prev, overallSummary: e.target.value }))} />
            )}

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button variant="outlined" onClick={addPairField}>+ הוסף זוג שימור/שיפור</Button>
            </Box>

            <Divider />

            <Grid container spacing={2}>
              {Array.from({ length: Math.max(generated.preservation.length, generated.improvement.length) }).map((_, idx) => (
                <Grid item xs={12} key={idx}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שימור</Typography>
                      <Paper sx={{ p: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField fullWidth multiline value={generated.preservation[idx]?.text || ''} onChange={e => updateGeneratedItem('preservation', idx, 'text', e.target.value)} />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                            <Button variant="outlined" onClick={() => openTagModal('preservation', idx)}>ערוך תג</Button>
                            <Chip label={generated.preservation[idx]?.tag || ''} size="small" sx={{ mr: 1 }} />
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שיפור</Typography>
                      <Paper sx={{ p: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField fullWidth multiline value={generated.improvement[idx]?.text || ''} onChange={e => updateGeneratedItem('improvement', idx, 'text', e.target.value)} />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                            <Button variant="outlined" onClick={() => openTagModal('improvement', idx)}>ערוך תג</Button>
                            <Chip label={generated.improvement[idx]?.tag || ''} size="small" sx={{ mr: 1 }} />
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>ביטול</Button>
          <Button variant="contained" onClick={submitNewExperience}>הוסף התנסות</Button>
        </DialogActions>
      </Dialog>

      

      {/* Tag edit dialog */}
      <Dialog open={tagModalOpen} onClose={() => setTagModalOpen(false)} PaperProps={{ dir: 'rtl' }}>
        <DialogTitle sx={{ textAlign: 'right' }}>ערוך תג</DialogTitle>
        <DialogContent sx={{ minWidth: 320, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <InputLabel>בחר תג קיים</InputLabel>
            <Select value={tempTag} label="בחר תג קיים" onChange={e => setTempTag(e.target.value)}>
              {sampleTags.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="או הקלד תג מותאם" value={tempTag} onChange={e => setTempTag(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagModalOpen(false)}>ביטול</Button>
          <Button variant="contained" onClick={applyTagModal}>שמור תג</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
