import React, { useEffect } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ExperienceDetails from '../components/ExperienceDetails'
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'
import store from '../data/experiencesStore'

export default function Insightx() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)
  const [userid, setUserId] = useState(null)
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user ? user.id : null)
    }
    fetchUserId()
  }, [supabase.auth])

  const [experiences, setExperiences] = useState(store.getExperiences())

  useEffect(() => {
    const unsub = store.subscribe(setExperiences)
    return unsub
  }, [])

  return (
    <Box dir="rtl" component="section" sx={{ width: '100%', minHeight: '100vh', px: 0, py: 6, bgcolor: '#f6f7fb' }}>
      <Typography variant="h4" align="right" gutterBottom sx={{ fontWeight: 700 }}>פריסת התנסות</Typography>
      <Typography variant="body1" align="right" color="text.secondary" gutterBottom sx={{ mb: 3 }}>בחר/י התנסות כדי לראות נקודות שימור ושיפור וסיכום AI לכל חלק.</Typography>

      <Grid container spacing={4} direction="column" alignItems="center" sx={{ mt: 2 }}>
        {/* userid: {userid} */}
        {experiences.map(exp => (
          <Grid item xs={12} key={exp.id} sx={{ width: '100%' }}>
            <ExperienceDetails exp={exp} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
