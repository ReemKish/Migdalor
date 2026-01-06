import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function GroupManagement({ groups = { battalions: [], platoons: [], classes: [] }, setGroups }) {
  const [local, setLocal] = useState(groups);
  const [editIdx, setEditIdx] = useState({ section: null, idx: -1 });
  const [newInputs, setNewInputs] = useState({ battalion: '', platoon: '', className: '' });

  const updateParent = (next) => {
    setLocal(next);
    setGroups && setGroups(next);
  };
  // Add a full row (battalion, platoon, className). All three are required.
  const addRow = (battalion, platoon, className) => {
    const b = (battalion || '').trim();
    const p = (platoon || '').trim();
    const c = (className || '').trim();
    if (!b || !p || !c) return alert('Please provide Battalion, Platoon and Class. All three are required.');

    const payload = { battalion: b, platoon: p, className: c };
    fetch('http://localhost:5000/api/admin/add-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => {
      if (!res.ok) console.warn('Failed to persist unit to backend', res.status);
    }).catch(err => console.error('Error persisting unit to backend', err));

    const next = {
      battalions: [...(local.battalions || []), b],
      platoons: [...(local.platoons || []), p],
      classes: [...(local.classes || []), c]
    };
    updateParent(next);
    setNewInputs({ battalion: '', platoon: '', className: '' });
  };

  const removeItem = (section, idx) => {
    const arr = [...(local[section] || [])];
    arr.splice(idx, 1);
    updateParent({ ...local, [section]: arr });
  };

  const startEdit = (section, idx) => {
    setEditIdx({ section, idx });
  };

  const saveEdit = (section, idx, value) => {
    const arr = [...(local[section] || [])];
    arr[idx] = value;
    updateParent({ ...local, [section]: arr });
    setEditIdx({ section: null, idx: -1 });
    // Persist the edited value as a new row in the backend CSV (backend does not support updates/deletes)
    const trimmed = (value || '').trim();
    if (trimmed) {
      const payload = {
        battalion: section === 'battalions' ? trimmed : '',
        platoon: section === 'platoons' ? trimmed : '',
        className: section === 'classes' ? trimmed : ''
      };
      fetch('http://localhost:5000/api/admin/add-unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        if (!res.ok) console.warn('Failed to persist edited unit to backend', res.status);
      }).catch(err => console.error('Error persisting edited unit to backend', err));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
        <TextField size="small" label="Battalion" value={newInputs.battalion || ''} onChange={(e) => setNewInputs((s) => ({ ...s, battalion: e.target.value }))} />
        <TextField size="small" label="Platoon" value={newInputs.platoon || ''} onChange={(e) => setNewInputs((s) => ({ ...s, platoon: e.target.value }))} />
        <TextField size="small" label="Class" value={newInputs.className || ''} onChange={(e) => setNewInputs((s) => ({ ...s, className: e.target.value }))} />
        <Button variant="contained" onClick={() => addRow(newInputs.battalion, newInputs.platoon, newInputs.className)}>Add Group (Battalion → Platoon → Class)</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
        {[
          { key: 'battalions', title: 'Battalions' },
          { key: 'platoons', title: 'Platoons' },
          { key: 'classes', title: 'Classes' }
        ].map(({ key, title }) => (
          <Box key={key} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <List dense>
              {(local[key] || []).map((item, idx) => (
                <ListItem key={idx} divider>
                  {editIdx.section === key && editIdx.idx === idx ? (
                    <>
                      <TextField
                        size="small"
                        defaultValue={item}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(key, idx, e.target.value);
                          if (e.key === 'Escape') setEditIdx({ section: null, idx: -1 });
                        }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => saveEdit(key, idx, document.activeElement.value || item)}><SaveIcon /></IconButton>
                        <IconButton edge="end" onClick={() => setEditIdx({ section: null, idx: -1 })}><CancelIcon /></IconButton>
                      </ListItemSecondaryAction>
                    </>
                  ) : (
                    <>
                      <ListItemText primary={item} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => startEdit(key, idx)}><EditIcon /></IconButton>
                        <IconButton edge="end" onClick={() => removeItem(key, idx)}><DeleteIcon /></IconButton>
                      </ListItemSecondaryAction>
                    </>
                  )}
                </ListItem>
              ))}
              {(local[key] || []).length === 0 && <Typography variant="body2" color="text.secondary">No {title.toLowerCase()} yet.</Typography>}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>All Groups</Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small" aria-label="groups table">
          <TableHead>
            <TableRow>
              <TableCell>Battalion</TableCell>
              <TableCell>Platoon</TableCell>
              <TableCell>Class</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const b = local.battalions || [];
              const p = local.platoons || [];
              const c = local.classes || [];
              const max = Math.max(b.length, p.length, c.length);
              if (max === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={3}><Typography variant="body2" color="text.secondary">No groups available.</Typography></TableCell>
                  </TableRow>
                );
              }
              const rows = [];
              for (let i = 0; i < max; i++) {
                rows.push({
                  battalion: b[i] || '',
                  platoon: p[i] || '',
                  className: c[i] || ''
                });
              }
              return rows.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.battalion || '—'}</TableCell>
                  <TableCell>{r.platoon || '—'}</TableCell>
                  <TableCell>{r.className || '—'}</TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
