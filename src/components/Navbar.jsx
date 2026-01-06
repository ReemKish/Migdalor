import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export default function Navbar({ user, setUser, setView, view }) {
  const handleLogout = () => {
    setUser(null);
  };

  const initials = user ? user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() : '';

  return (
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar sx={{ display: 'flex', gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          PollX
        </Typography>

        <Box sx={{ flex: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(e, val) => { if (val) setView(val); }}
              size="small"
            >
              {/* Available Polls toggle shown only to regular users (not admins) */}
              {!user.isAdmin && <ToggleButton value="polls">Available Polls</ToggleButton>}
              {user.isAdmin && <ToggleButton value="groups">Group Management</ToggleButton>}
              {user.isAdmin && <ToggleButton value="admin_create">Create Poll</ToggleButton>}
              {user.isAdmin && <ToggleButton value="admin_manage">Manage Polls</ToggleButton>}
            </ToggleButtonGroup>

            <Avatar alt={user.name} sx={{ width: 36, height: 36 }}>{initials}</Avatar>
            <Typography variant="body1" sx={{ mr: 1 }}>{user.name}{user.isAdmin ? ' (admin)' : ''}</Typography>
            <Button variant="outlined" color="primary" onClick={handleLogout}>Logout</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}