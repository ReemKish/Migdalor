import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import experiences from '../data/experiences.json'
import ExperienceDetails from '../components/ExperienceDetails'

export default function Insightx() {
  return (
    <Box dir="rtl" component="section" sx={{ width: '100%', minHeight: '100vh', px: 0, py: 6, bgcolor: '#f6f7fb' }}>
      <Typography variant="h4" align="right" gutterBottom sx={{ fontWeight: 700 }}>פריסת התנסות</Typography>
      <Typography variant="body1" align="right" color="text.secondary" gutterBottom sx={{ mb: 3 }}>בחר/י התנסות כדי לראות נקודות שימור ושיפור וסיכום AI לכל חלק.</Typography>

      <Grid container spacing={4} direction="column" alignItems="center" sx={{ mt: 2 }}>
        {experiences.map(exp => (
          <Grid item xs={12} key={exp.id} sx={{ width: '100%' }}>
            <ExperienceDetails exp={exp} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
