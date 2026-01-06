import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';

export default function PollAnswerForm({ poll, existingAnswer, onSubmit, onCancel }) {
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (!poll) return;
    if (existingAnswer) setDraft(existingAnswer.answers || {});
    else {
      const d = {};
      poll.questions.forEach((q) => { d[q.id] = q.type === 'choice' ? '' : ''; });
      setDraft(d);
    }
  }, [poll, existingAnswer]);

  if (!poll) return null;

  const handleSubmit = () => {
    // validate required
    for (const q of poll.questions) {
      if (q.required && (!draft[q.id] || String(draft[q.id]).trim() === '')) return alert('Please fill required questions');
    }
    onSubmit(draft);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Answer: {poll.title}</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {poll.questions.map((q) => (
            <Box key={q.id}>
              <Typography sx={{ fontWeight: 700 }}>{q.question} {q.required && '*'}</Typography>
              {q.type === 'text' ? (
                <TextField value={draft[q.id] || ''} onChange={(e) => setDraft((p) => ({ ...p, [q.id]: e.target.value }))} multiline minRows={3} fullWidth sx={{ mt: 1 }} />
              ) : (
                <RadioGroup value={draft[q.id] || ''} onChange={(e) => setDraft((p) => ({ ...p, [q.id]: e.target.value }))} sx={{ mt: 1 }}>
                  {q.options.map((opt, idx) => (
                    <FormControlLabel key={idx} value={opt} control={<Radio />} label={opt} />
                  ))}
                </RadioGroup>
              )}
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>Submit</Button>
            <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
