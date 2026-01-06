import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PollList from './PollList';

const Dashboard = ({ user, polls = [], onOpenAnswer, onViewAnswers, getUserAnswerForPoll }) => {
  const [view, setView] = useState('pending'); // 'pending', 'completed', or 'created'

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Welcome, {user.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>{user.battalion} / {user.platoon} / {user.className}</Typography>

      <div className="tabs">
        <button onClick={() => setView('pending')}>Polls to Fill</button>
        <button onClick={() => setView('completed')}>History</button>
        <button onClick={() => setView('created')}>My Published Polls</button>
      </div>

      <hr />

      {view === 'pending' && (
        <section>
          <Typography variant="h6">Pending Polls</Typography>
          <PollList
            polls={polls}
            user={user}
            onOpenAnswer={onOpenAnswer}
            onViewAnswers={onViewAnswers}
            getUserAnswerForPoll={getUserAnswerForPoll}
          />
        </section>
      )}

      {view === 'created' && (
        <section>
          <Typography variant="h6">Assign New Poll</Typography>
          <button className="btn-primary">+ Create New Poll</button>
          
          <Typography variant="h6">Polls You Published</Typography>
          <div className="poll-item">
            <p>Equipment Check (Sent to Platoon A)</p>
            <button>View Responses (CSV)</button>
          </div>
        </section>
      )}
    </Box>
  );
};

export default Dashboard;