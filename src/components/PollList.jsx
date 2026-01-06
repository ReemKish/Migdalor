import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function PollList({ polls = [], user, onPublish, onUnpublish, onViewAnswers, onOpenAnswer, getUserAnswerForPoll, onDelete }) {
  const [editingPollId, setEditingPollId] = useState(null);
  const [publishGroupsInput, setPublishGroupsInput] = useState('');

  return (
    <Stack spacing={2}>
      {polls.length === 0 && <Typography variant="body2"><em>No polls.</em></Typography>}
      {polls.map((p) => {
        const ua = getUserAnswerForPoll ? getUserAnswerForPoll(p.id, user?.name) : null;
        return (
          <Card key={p.id} variant="outlined">
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{p.title}</Typography>
                <Typography variant="caption" color="text.secondary">{p.published ? `Published to: ${p.groups.join(', ')}` : 'Unpublished'}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {user?.isAdmin ? (
                  <>
                    <TextField size="small" placeholder="groups (csv e.g. HQ,Alpha,all)" value={editingPollId === p.id ? publishGroupsInput : ''} onChange={(e) => { setEditingPollId(p.id); setPublishGroupsInput(e.target.value); }} />
                    <Button variant="outlined" onClick={() => { if (!publishGroupsInput && !p.published) return alert('enter groups to publish'); const groups = publishGroupsInput ? publishGroupsInput.split(',').map(s => s.trim()).filter(Boolean) : p.groups; onPublish && onPublish(p.id, groups); setPublishGroupsInput(''); setEditingPollId(null); }}>Publish</Button>
                    <Button variant="outlined" color="inherit" onClick={() => onUnpublish && onUnpublish(p.id)}>Unpublish</Button>
                    <Button variant="contained" onClick={() => onViewAnswers && onViewAnswers(p.id)}>View Answers</Button>
                    <Button variant="outlined" color="error" onClick={() => {
                      try {
                        if (!window.confirm || window.confirm('Delete this poll? This cannot be undone.')) {
                          onDelete && onDelete(p.id);
                        }
                      } catch (e) {
                        // fallback if window.confirm isn't available
                        onDelete && onDelete(p.id);
                      }
                    }}>Delete</Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={() => { if (ua) onViewAnswers && onViewAnswers(p.id); else onOpenAnswer && onOpenAnswer(p.id); }}>
                    {ua ? 'View your answer' : 'Answer'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
