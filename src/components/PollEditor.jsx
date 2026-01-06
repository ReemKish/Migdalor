import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function PollEditor({ onCreate }) {
  const genLocalId = (p = '') => `${p}${Date.now().toString(36)}-${Math.floor(Math.random()*10000).toString(36)}`;
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);

  const addQuestion = (type = 'text') => {
    setQuestions((s) => [...s, { id: genLocalId('q_'), type, question: '', required: true, options: type === 'choice' ? ['Option 1'] : [] }]);
  };
  const updateQuestion = (id, patch) => setQuestions((s) => s.map((q) => q.id === id ? { ...q, ...patch } : q));
  const removeQuestion = (id) => setQuestions((s) => s.filter((q) => q.id !== id));
  const addOption = (id) => {
    const q = questions.find(x => x.id === id);
    updateQuestion(id, { options: [...(q.options||[]), `Option ${(q.options||[]).length + 1}`] });
  };

  const handleCreate = () => {
    if (!title.trim()) return alert('Title required');
    if (questions.length === 0) return alert('Add at least one question');
    for (const q of questions) {
      if (!q.question || !q.question.trim()) return alert('All questions need text');
      if (q.type === 'choice' && (!q.options || q.options.length === 0)) return alert('Choice questions require options');
    }
    const outQuestions = questions.map(({ type, question, required, options }) => ({ type, question, required, options }));
    onCreate({ title, questions: outQuestions });
    setTitle(''); setQuestions([]);
  };

  return (
    <Box>
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {questions.map((q) => (
          <Card key={q.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select value={q.type} label="Type" onChange={(e) => updateQuestion(q.id, { type: e.target.value, options: e.target.value === 'choice' ? (q.options && q.options.length ? q.options : ['Option 1']) : [] })}>
                    <MenuItem value="text">Free text</MenuItem>
                    <MenuItem value="choice">Single choice</MenuItem>
                  </Select>
                </FormControl>

                <TextField placeholder="Question text" value={q.question} onChange={(e) => updateQuestion(q.id, { question: e.target.value })} fullWidth size="small" />
                <FormControlLabel control={<Checkbox checked={q.required} onChange={(e) => updateQuestion(q.id, { required: e.target.checked })} />} label="required" />
                <IconButton onClick={() => removeQuestion(q.id)} color="error"><DeleteIcon /></IconButton>
              </Box>

              {q.type === 'choice' && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {q.options.map((opt, idx) => (
                      <TextField key={idx} value={opt} size="small" onChange={(e) => { const newOpts = [...q.options]; newOpts[idx] = e.target.value; updateQuestion(q.id, { options: newOpts }); }} />
                    ))}
                    <Button startIcon={<AddIcon />} size="small" onClick={() => addOption(q.id)}>Add option</Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => addQuestion('text')}>Add Free-text Question</Button>
          <Button variant="outlined" onClick={() => addQuestion('choice')}>Add Choice Question</Button>
        </Box>

        <Box>
          <Button variant="contained" color="primary" onClick={handleCreate}>Create Poll</Button>
        </Box>
      </Box>
    </Box>
  );
}
