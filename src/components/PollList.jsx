import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';

export default function PollList({ polls = [], user, onPublish, onUnpublish, onViewAnswers, onOpenAnswer, getUserAnswerForPoll, onDelete, answers = [], groups = { battalions: [], platoons: [], classes: [] } }) {
  const [editingPollId, setEditingPollId] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState({});

  // Download answers for a poll as CSV
  const downloadAnswersCSV = (poll) => {
    const pollAnswers = answers.filter(a => a.pollId === poll.id);
    
    if (pollAnswers.length === 0) {
      alert('No answers to download for this poll.');
      return;
    }

    // Build CSV header
    const header = ['Username', 'Timestamp', ...poll.questions.map(q => q.question)];
    const csvLines = [header.map(h => `"${h}"`).join(',')];

    // Build CSV rows
    pollAnswers.forEach(answer => {
      const date = new Date(answer.ts);
      // Format as: YYYY-MM-DD HH:mm:ss (single column)
      const timestamp = date.toISOString().replace('T', ' ').slice(0, 19);
      const row = [answer.userName, timestamp];
      poll.questions.forEach(q => {
        const ans = answer.answers[q.id] || '';
        row.push(`"${ans}"`);
      });
      csvLines.push(row.join(','));
    });

    // Create and download file with UTF-8 BOM for proper encoding
    const csvContent = csvLines.join('\n');
    const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for proper Hebrew/RTL character encoding
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${poll.title}_answers.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                    <Button variant="outlined" color="success" onClick={() => downloadAnswersCSV(p)}>Download CSV</Button>
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
