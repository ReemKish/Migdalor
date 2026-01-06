import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PollList from './PollList';

const Dashboard = ({ user, polls = [], onOpenAnswer, onViewAnswers, getUserAnswerForPoll }) => {
  const [view, setView] = useState('pending'); // 'pending' or 'completed'

  // Separate polls into available (not answered) and completed (answered)
  const availablePolls = polls.filter(p => !getUserAnswerForPoll(p.id, user?.name));
  const completedPolls = polls.filter(p => getUserAnswerForPoll(p.id, user?.name));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Welcome, {user.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>{user.battalion} / {user.platoon} / {user.className}</Typography>

      <div className="tabs">
        <button onClick={() => setView('pending')}>Polls to Fill</button>
        <button onClick={() => setView('completed')}>Completed Polls</button>
      </div>

      <hr />

      {view === 'pending' && (
        <section>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Available Polls ({availablePolls.length})</Typography>
            {availablePolls.length === 0 ? (
              <Typography variant="body2" color="textSecondary">No pending polls at the moment.</Typography>
            ) : (
              <PollList
                polls={availablePolls}
                user={user}
                onOpenAnswer={onOpenAnswer}
                onViewAnswers={onViewAnswers}
                getUserAnswerForPoll={getUserAnswerForPoll}
              />
            )}
          </Box>
        </section>
      )}

      {view === 'completed' && (
        <section>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Completed Polls ({completedPolls.length})</Typography>
          {completedPolls.length === 0 ? (
            <Typography variant="body2" color="textSecondary">You haven't completed any polls yet.</Typography>
          ) : (
            <PollList
              polls={completedPolls}
              user={user}
              onOpenAnswer={onOpenAnswer}
              onViewAnswers={onViewAnswers}
              getUserAnswerForPoll={getUserAnswerForPoll}
            />
          )}
        </section>
      )}
    </Box>
  );
};

export default Dashboard;