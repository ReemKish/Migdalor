import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import Divider from '@mui/material/Divider'

const experiences = [
  {
    id: 1,
    name: 'התנסות א',
    preservationSummary: 'המשתתפים שומרים על אנרגיה ועבודת צוות טובה.',
    improvementSummary: 'יש להגדיר תפקידים ולתת זמן תרגול נוסף.',
    cadetFeedback: {
      preservation: [
        { text: 'המשתתפים שמרו על אנרגיה גבוהה לאורך הפעילות', tag: 'אנרגיה' },
        { text: 'העבודה בקבוצות היתה מסודרת וברורה', tag: 'עבודה קבוצתית' },
        { text: 'הצוערים אהבו את שיטת הלימוד המעורבת', tag: 'שיטה' }
      ],
      improvement: [
        { text: 'צריך קביעת תפקידים ברורה יותר', tag: 'תפקידים' },
        { text: 'לשפר את זמן התרגול הפרטני', tag: 'זמן' },
        { text: 'צריך יותר משימות פרקטיות', tag: 'מעשי' }
      ],
      generalSummary: 'צוערים מרוצים מהשיטה, ומבקשים עוד תרגול מעשי.'
    },
    commanderFeedback: {
      preservation: [ { text: 'שמירה על סדר ודיוק במהלך התרגילים', tag: 'סדר', original: 'המפק"ץ: שמרו על סדר ודיוק בתרגילים, זה עזר לקצב השיעור.' } ],
      improvement: [ { text: 'לאחוז בפירוט מטרות כל משימה', tag: 'מטרות', original: 'המפק"ץ: מומלץ לפרט את מטרות כל משימה כדי לשפר הבנה בקרב המשתתפים.' } ],
      overallSummary: 'המפק"צים ציינו סדר וטענו שיש להבהר מטרות המשימות.',
      originalOverall: 'טקסט מקורי מהמפק"ץ שמסביר את הסיכום וההמלצות בפירוט.'
    }
  },
  {
    id: 2,
    name: 'התנסות ב',
    preservationSummary: 'התוכן התקבל היטב על ידי המשתתפים.',
    improvementSummary: 'להפחית זמן תיאורטי ולהוסיף דוגמאות.',
    cadetFeedback: {
      preservation: [ { text: 'המשוב מהמשתתפים היה חיובי לגבי התוכן', tag: 'תוכן' }, { text: 'הצעירים אהבו את הפעילות המעשית', tag: 'מעשי' } ],
      improvement: [ { text: 'לקצר את ההרצאה התיאורטית', tag: 'קיצור' }, { text: 'להוסיף דוגמאות ויזואליות', tag: 'ויזואל' }, { text: 'רוצים יותר חומרים להדגמה', tag: 'חומרים' } ],
      generalSummary: 'צוערים נהנו אך רוצים חומרים נוספים.'
    },
    commanderFeedback: {
      preservation: [ { text: 'הקצב היה נכון, שמרו על דגש', tag: 'קצב', original: 'הטקסט המקורי מהמפק"ץ: הקצב היה נכון ושמרנו על דגש על התרגול המעשי.' } ],
      improvement: [ { text: 'צריך להבהיר קריטריונים להערכה', tag: 'קריטריונים', original: 'הטקסט המקורי מהמפק"ץ: יש להבהיר אילו קריטריונים משמשים להערכת ביצועים.' } ],
      overallSummary: 'המפק"צים סיכמו: הקפידו על קצב ובררו קריטריונים להערכה.',
      originalOverall: 'טקסט מקורי מלא מהמפק"ץ שמסכם את התצפיות וההמלצות.'
    }
  }
]

export default function Insightx() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalContent, setModalContent] = useState('')

  function openModal(content, title) {
    setModalContent(content)
    setModalTitle(title)
    setModalOpen(true)
  }

  return (
    <Box dir="rtl" component="section" sx={{ width: '100%', minHeight: '100vh', px: 0, py: 6, bgcolor: '#f6f7fb' }}>
      <Typography variant="h4" align="right" gutterBottom sx={{ fontWeight: 700 }}>פריסת התנסות</Typography>
      <Typography variant="body1" align="right" color="text.secondary" gutterBottom sx={{ mb: 3 }}>בחר/י התנסות כדי לראות נקודות שימור ושיפור וסיכום AI לכל חלק.</Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {experiences.map(exp => (
          <Grid item xs={12} key={exp.id}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#ffffff', width: '100%' }}>
              <Typography variant="h5" align="right" sx={{ fontWeight: 700 }}>{exp.name}</Typography>

              {/* Cadet feedback */}
              {exp.cadetFeedback && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                    <Typography variant="subtitle1" align="right">משוב צוערים</Typography>
                  </Box>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שימור</Typography>
                      {exp.cadetFeedback.preservation.map((p, i) => (
                        <Paper key={i} sx={{ p: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography align="right">{p.text}</Typography>
                            <Chip label={p.tag} size="small" color="primary" variant="outlined" sx={{ mr: 1 }} />
                          </Box>
                        </Paper>
                      ))}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שיפור</Typography>
                      {exp.cadetFeedback.improvement.map((p, i) => (
                        <Paper key={i} sx={{ p: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography align="right">{p.text}</Typography>
                            <Chip label={p.tag} size="small" sx={{ bgcolor: '#fff6e6', mr: 1 }} />
                          </Box>
                        </Paper>
                      ))}
                    </Grid>
                  </Grid>
                  <Paper sx={{ mt: 2, p: 2, bgcolor: '#f7fbff' }}>
                    <Typography align="right" sx={{ fontWeight: 600 }}>סיכום צוערים:</Typography>
                    <Typography align="right">{exp.cadetFeedback.generalSummary}</Typography>
                  </Paper>
                </Box>
              )}

              {/* Commander feedback */}
              {exp.commanderFeedback && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                    <Typography variant="subtitle1" align="right">משוב מפק"צים</Typography>
                  </Box>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שימור</Typography>
                      {exp.commanderFeedback.preservation.map((p, i) => (
                        <Paper key={i} onClick={() => openModal(p.original, `מקור שימור — ${p.tag}`)} sx={{ p: 2, mb: 1, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { boxShadow: 8, transform: 'translateY(-6px)' } }}>
                          <Typography align="right" sx={{ flex: 1 }}>{p.text}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <Chip label={p.tag} size="small" variant="outlined" sx={{ bgcolor: '#eef2ff' }} />
                            <IconButton size="small"><SearchIcon fontSize="small" /></IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography align="right" sx={{ mb: 1, fontWeight: 600 }}>שיפור</Typography>
                      {exp.commanderFeedback.improvement.map((p, i) => (
                        <Paper key={i} onClick={() => openModal(p.original, `מקור שיפור — ${p.tag}`)} sx={{ p: 2, mb: 1, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { boxShadow: 8, transform: 'translateY(-6px)' } }}>
                          <Typography align="right" sx={{ flex: 1 }}>{p.text}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <Chip label={p.tag} size="small" variant="outlined" sx={{ bgcolor: '#fff6e6' }} />
                            <IconButton size="small"><SearchIcon fontSize="small" /></IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Grid>
                  </Grid>

                  <Paper onClick={() => openModal(exp.commanderFeedback.originalOverall, 'מקור סיכום מפק"צים')} sx={{ mt: 2, p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { boxShadow: 8, transform: 'translateY(-6px)' } }}>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 800 }}>סיכום מפק"צים:</Typography>
                      <Typography sx={{ mt: 0.5 }}>{exp.commanderFeedback.overallSummary}</Typography>
                    </Box>
                    <IconButton size="small"><SearchIcon fontSize="small" /></IconButton>
                  </Paper>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <Button variant="contained">חזור</Button>
                </Link>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ textAlign: 'right' }}>{modalTitle}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ whiteSpace: 'pre-wrap', textAlign: 'right' }}>{modalContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
