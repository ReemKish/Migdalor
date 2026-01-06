import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Renders cadet & commander feedback for an experience
export default function ExperienceDetails({ exp }) {
  // Simple simulated AI summaries by concatenating key phrases
  // Combined AI summary (merge preservation + improvement tags)
  const aiSummary = (() => {
    if (!exp.cadetFeedback) return ''
    const tags = []
    if (Array.isArray(exp.cadetFeedback.preservation)) tags.push(...exp.cadetFeedback.preservation.map(p => p.tag))
    if (Array.isArray(exp.cadetFeedback.improvement)) tags.push(...exp.cadetFeedback.improvement.map(p => p.tag))
    const uniq = Array.from(new Set(tags)).slice(0, 5)
    return uniq.length ? 'AI סיכום שימור ושיפור: ' + uniq.join(', ') + '.' : ''
  })()

  // For commander, use their overallSummary as the commander-written summary
  const commanderSummary = exp.commanderFeedback && exp.commanderFeedback.overallSummary
    ? exp.commanderFeedback.overallSummary
    : ''

  return (
    <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', p: 3, bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 48px)' }}>
      <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h5" align="right" sx={{ fontWeight: 700 }}>{exp.name}</Typography>

      {/* Cadet feedback */}
      {exp.cadetFeedback && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="subtitle1" align="right">משוב צוערים</Typography>
          </Box>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={12}>
              <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שימור</Typography>
              {exp.cadetFeedback.preservation.map((p, i) => (
                <Paper key={i} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography align="right">{p.text}</Typography>
                    <Chip label={p.tag} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
                  </Box>
                </Paper>
              ))}
            </Grid>

            <Grid item xs={12} md={12}>
              <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שיפור</Typography>
              {exp.cadetFeedback.improvement.map((p, i) => (
                <Paper key={i} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography align="right">{p.text}</Typography>
                    <Chip label={p.tag} size="small" sx={{ bgcolor: '#fff6e6', ml: 1 }} />
                  </Box>
                </Paper>
              ))}
            </Grid>
          </Grid>

          {/* Combined AI summary for both preservation & improvement */}
          {aiSummary && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: '#f7fbff' }}>
              <Typography align="right" sx={{ fontWeight: 600 }}>סיכום AI (שימור ושיפור):</Typography>
              <Typography align="right">{aiSummary}</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Commander feedback - render lists like cadets but show commander summary instead of AI */}
      {exp.commanderFeedback && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="subtitle1" align="right">משוב מפק"צים</Typography>
          </Box>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={12}>
              <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שימור</Typography>
              {(exp.commanderFeedback.preservation || []).map((p, i) => (
                <Paper key={i} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography align="right">{p.text}</Typography>
                    <Chip label={p.tag} size="small" variant="outlined" sx={{ bgcolor: '#eef2ff', ml: 1 }} />
                  </Box>
                </Paper>
              ))}
            </Grid>

            <Grid item xs={12} md={12}>
              <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שיפור</Typography>
              {(exp.commanderFeedback.improvement || []).map((p, i) => (
                <Paper key={i} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography align="right">{p.text}</Typography>
                    <Chip label={p.tag} size="small" variant="outlined" sx={{ bgcolor: '#fff6e6', ml: 1 }} />
                  </Box>
                </Paper>
              ))}
            </Grid>
          </Grid>

          {/* Show commander overall summary if present */}
          {commanderSummary && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: '#f0f7f0' }}>
              <Typography align="right" sx={{ fontWeight: 800 }}>סיכום מפק"צים:</Typography>
              <Typography align="right" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{commanderSummary}</Typography>
            </Paper>
          )}

        </Box>
      )}

  
      </Box>
    </Paper>
  )
}

