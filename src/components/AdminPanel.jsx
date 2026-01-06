import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PollEditor from './PollEditor';
import PollList from './PollList';

const AdminPanel = ({ polls = [], onCreate, onPublish, onUnpublish, onViewAnswers, getUserAnswerForPoll, user }) => {
  const [units, setUnits] = useState([]);
  const [newEntry, setNewEntry] = useState({ battalion: '', platoon: '', className: '' });

  // Load existing units when Admin Panel opens
  useEffect(() => {
    fetch('http://localhost:5000/api/units')
      .then(res => res.json())
      .then(data => setUnits(data));
  }, []);

  const handleAddStructure = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/admin/add-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    });

    if (response.ok) {
      setUnits([...units, newEntry]); // Update the list immediately
      setNewEntry({ battalion: '', platoon: '', className: '' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create Poll</Typography>
      <PollEditor onCreate={onCreate} />
      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" gutterBottom>Existing Polls</Typography>
      <PollList
        polls={polls}
        user={{ ...user, isAdmin: true }}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onViewAnswers={onViewAnswers}
        getUserAnswerForPoll={getUserAnswerForPoll}
      />
      <h2>Admin Control Panel</h2>
      <form onSubmit={handleAddStructure} className="auth-card">
        <input placeholder="Battalion Name" value={newEntry.battalion} onChange={e => setNewEntry({...newEntry, battalion: e.target.value})} required />
        <input placeholder="Platoon Name" value={newEntry.platoon} onChange={e => setNewEntry({...newEntry, platoon: e.target.value})} required />
        <input placeholder="Class Name" value={newEntry.className} onChange={e => setNewEntry({...newEntry, className: e.target.value})} required />
        <button type="submit">Add to Hierarchy</button>
      </form>

      <h3>Existing Hierarchy</h3>
      <table border="1" width="100%" style={{marginTop: '20px', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#eee'}}>
            <th>Battalion</th>
            <th>Platoon</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u, index) => (
            <tr key={index}>
              <td>{u.battalion}</td>
              <td>{u.platoon}</td>
              <td>{u.className}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default AdminPanel;