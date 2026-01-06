import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';

export default function PollAnswersView({ poll, answers = [], onClose }) {
  if (!poll) return null;
  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Answers for {poll.title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {answers.length === 0 && <Typography><em>No answers yet.</em></Typography>}
          {answers.map((a) => (
            <Card key={a.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1"><strong>{a.userName}</strong> <Typography component="span" variant="caption" color="text.secondary"> — {new Date(a.ts).toLocaleString()}</Typography></Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {poll.questions.map((q) => (
                    <div key={q.id}>
                      <Typography sx={{ fontWeight: 600 }}>{q.question}</Typography>
                      <Typography>{String(a.answers[q.id] ?? '')}</Typography>
                    </div>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
