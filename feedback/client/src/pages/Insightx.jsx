import React, { useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
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
  const [trendAnalysis, setTrendAnalysis] = useState('')
  const [loadingTrendAnalysis, setLoadingTrendAnalysis] = useState(false)

  useEffect(() => {
    const unsub = store.subscribe(setExperiences)
    return unsub
  }, [])

  // Load stored trend analysis on mount
  useEffect(() => {
    const stored = store.getTrendAnalysis()
    if (stored) {
      setTrendAnalysis(stored)
    }
  }, [])

  const generateTrendAnalysis = useCallback(async () => {
    if (experiences.length === 0) return
    
    // Check if we have a stored analysis that's still valid for current experiences
    const stored = store.getTrendAnalysis()
    if (stored && store.isTrendAnalysisValid()) {
      setTrendAnalysis(stored)
      return
    }
    
    setLoadingTrendAnalysis(true)
    
    // Collect all feedback from all experiences
    const allFeedback = []
    
    experiences.forEach(exp => {
      // Add cadet feedback
      if (exp.cadetFeedback) {
        if (exp.cadetFeedback.preservation) {
          exp.cadetFeedback.preservation.forEach(item => {
            allFeedback.push({ text: item.text, tag: item.tag, type: 'cadet', category: 'preservation' })
          })
        }
        if (exp.cadetFeedback.improvement) {
          exp.cadetFeedback.improvement.forEach(item => {
            allFeedback.push({ text: item.text, tag: item.tag, type: 'cadet', category: 'improvement' })
          })
        }
      }
      
      // Add commander feedback
      if (exp.commanderFeedback) {
        if (exp.commanderFeedback.preservation) {
          exp.commanderFeedback.preservation.forEach(item => {
            allFeedback.push({ text: item.text, tag: item.tag, type: 'commander', category: 'preservation' })
          })
        }
        if (exp.commanderFeedback.improvement) {
          exp.commanderFeedback.improvement.forEach(item => {
            allFeedback.push({ text: item.text, tag: item.tag, type: 'commander', category: 'improvement' })
          })
        }
      }
    })

    if (allFeedback.length === 0) {
      setLoadingTrendAnalysis(false)
      return
    }

    const apiKey = "AIzaSyClaox7mXlRPKi-8tNiQ7pK4WrbDfPIdmc"
    const contentExample = `
Here is information of reviews given by cadets and commanders for a cadet for a few assignments.

In a short hebrew paragraph, analyze trends for 
1)what has improved/kept at high level.
2) what has worsen/hadn't improved.
3) suggest a way for improvement/ "what should i do"
4) optionally interesting review you noticed
5) answer in a clear and not too high level language
6) respond only with sentences, no additional text
7) respond in bullet points

${allFeedback.map(e => `{ "text": "${(e.text||'').replace(/\n/g,' ').replace(/"/g, '\\"')}", "tag": "${(e.tag||'').replace(/\n/g,' ').replace(/"/g, '\\"')}", "type": "${e.type}", "category": "${e.category}" }`).join(',\n')}
`

    try {
      const mod = await import('@google/genai')
      const GoogleGenAI = mod && (mod.GoogleGenAI || mod.default?.GoogleGenAI || mod.default || mod)
      if (!GoogleGenAI) throw new Error('GoogleGenAI SDK not found in module exports')
      const ai = new GoogleGenAI({ apiKey })
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: contentExample })
      const text = response?.text || (response && JSON.stringify(response))
      if (text) {
        setTrendAnalysis(text)
        store.setTrendAnalysis(text)
      } else {
        setTrendAnalysis('')
      }
    } catch (error) {
      console.error('Error generating trend analysis:', error)
      setTrendAnalysis('')
    } finally {
      setLoadingTrendAnalysis(false)
    }
  }, [experiences])

  useEffect(() => {
    if (experiences.length > 0) {
      generateTrendAnalysis()
    }
  }, [experiences, generateTrendAnalysis])

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
        
        {/* Trend Analysis Section */}
        {experiences.length > 0 && (
          <Grid item xs={12} sx={{ width: '100%', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="h5" align="right" sx={{ fontWeight: 700, mb: 2 }}>ניתוח מגמות</Typography>
              {loadingTrendAnalysis ? (
                <Typography align="right" color="text.secondary">טוען ניתוח מגמות...</Typography>
              ) : trendAnalysis ? (
                <Typography align="right" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{trendAnalysis}</Typography>
              ) : (
                <Typography align="right" color="text.secondary">אין מספיק נתונים לניתוח מגמות</Typography>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
