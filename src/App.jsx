import React, { useState, useEffect } from 'react';
import Signup from './components/Signup';
import GroupManagement from './components/GroupManagement';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import PollEditor from './components/PollEditor';
import PollList from './components/PollList';
import PollAnswerForm from './components/PollAnswerForm';
import PollAnswersView from './components/PollAnswersView';
import './index.css';

// Material UI
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';

function App() {
  const USERS_KEY = 'pollx_users';
  const SESSION_KEY = 'pollx_session';
  const POLLS_KEY = 'pollx_polls';
  const ANSWERS_KEY = 'pollx_answers';
  const GROUPS_KEY = 'pollx_groups';

  const loadUsers = () => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
  };
  const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u || []));

  const loadPolls = () => {
    try { return JSON.parse(localStorage.getItem(POLLS_KEY) || '[]'); } catch { return []; }
  };
  const savePolls = (p) => localStorage.setItem(POLLS_KEY, JSON.stringify(p || []));

  const loadAnswers = () => {
    try { return JSON.parse(localStorage.getItem(ANSWERS_KEY) || '[]'); } catch { return []; }
  };
  const saveAnswers = (a) => localStorage.setItem(ANSWERS_KEY, JSON.stringify(a || []));

  const loadGroups = () => {
    try {
      const raw = localStorage.getItem(GROUPS_KEY) || '{"battalions":[],"platoons":[],"classes":[]}';
      console.log('loadGroups: reading from localStorage, raw:', raw.slice(0, 200));
      return JSON.parse(raw);
    } catch (err) {
      console.error('loadGroups: parse error', err);
      return { battalions: [], platoons: [], classes: [] };
    }
  };
  const saveGroups = (g) => {
    try {
      console.log('saveGroups: saving groups ->', g);
      localStorage.setItem(GROUPS_KEY, JSON.stringify(g || { battalions: [], platoons: [], classes: [] }));
    } catch (err) {
      console.error('saveGroups: error saving groups', err);
    }
  };

  // Parse CSV text into groups. Accepts rows like: type,name  OR battalion,platoon,class per row.
  const parseCsvToGroups = (csvText) => {
    console.log('parseCsvToGroups: raw csv length', csvText?.length);
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    console.log('parseCsvToGroups: lines count', lines.length, 'first 5 lines:', lines.slice(0,5));
    if (lines.length === 0) {
      console.warn('parseCsvToGroups: csv empty, fallback to local groups');
      return loadGroups();
    }

    // Peeking first line columns
    const firstCols = lines[0].split(',').map(c => c.trim());
    const headerLower = firstCols.map(h => h.toLowerCase());
    console.log('parseCsvToGroups: first line cols (peek):', firstCols);

    // If header-like row (contains known labels), treat as header
    const looksLikeHeader = headerLower.some(h => ['type','name','battalion','platoon','class','classname'].some(k => h.includes(k)));
    if (looksLikeHeader) {
      const header = headerLower;
      console.log('parseCsvToGroups: detected header cols:', header);

      // If header mentions type/name
      if (header.includes('type') && header.includes('name')) {
        const typeIdx = header.indexOf('type');
        const nameIdx = header.indexOf('name');
        const out = { battalions: [], platoons: [], classes: [] };
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          const type = (cols[typeIdx] || '').toLowerCase();
          const name = cols[nameIdx] || '';
          if (!name) continue;
          if (type.includes('batt')) out.battalions.push(name);
          else if (type.includes('plat') || type.includes('platoon')) out.platoons.push(name);
          else if (type.includes('class')) out.classes.push(name);
        }
        console.log('parseCsvToGroups: parsed (type,name) ->', out);
        return out;
      }

      // If header seems to be battalion,platoon,class columns
      if (header.includes('battalion') || header.includes('platoon') || header.includes('class') || header.includes('classname')) {
        const bIdx = header.indexOf('battalion');
        const pIdx = header.indexOf('platoon');
        const cIdx = header.indexOf('class') >= 0 ? header.indexOf('class') : header.indexOf('classname');
        const out = { battalions: [], platoons: [], classes: [] };
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (bIdx >= 0 && cols[bIdx]) out.battalions.push(cols[bIdx]);
          if (pIdx >= 0 && cols[pIdx]) out.platoons.push(cols[pIdx]);
          if (cIdx >= 0 && cols[cIdx]) out.classes.push(cols[cIdx]);
        }
        console.log('parseCsvToGroups: parsed (battalion,platoon,class) ->', { battalions: out.battalions.slice(0,10), platoons: out.platoons.slice(0,10), classes: out.classes.slice(0,10) });
        return out;
      }
    }

    // If no header and first row has 3+ columns, assume each line is: battalion,platoon,class
    if (firstCols.length >= 3) {
      const out = { battalions: [], platoons: [], classes: [] };
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        // take first three columns as battalion, platoon, class
        const batt = cols[0] || '';
        const plat = cols[1] || '';
        const cls = cols[2] || '';
        if (batt || plat || cls) {
          out.battalions.push(batt);
          out.platoons.push(plat);
          out.classes.push(cls);
        }
      }
      console.log('parseCsvToGroups: parsed header-less 3-col rows ->', { rows: out.battalions.length, sample: { b: out.battalions.slice(0,3), p: out.platoons.slice(0,3), c: out.classes.slice(0,3) } });
      return out;
    }

    // Generic fallback: treat each line as "GroupType,GroupName" without header
    const out = { battalions: [], platoons: [], classes: [] };
    for (const line of lines) {
      const cols = line.split(',').map(c => c.trim());
      if (cols.length >= 2) {
        const t = cols[0].toLowerCase(), name = cols[1];
        if (t.includes('batt')) out.battalions.push(name);
        else if (t.includes('plat') || t.includes('platoon')) out.platoons.push(name);
        else if (t.includes('class')) out.classes.push(name);
      }
    }
    console.log('parseCsvToGroups: parsed generic fallback ->', out);
    return out;
  };

  const fetchGroupsFromBackendCsv = async () => {
    const candidates = [
      '/units.csv',
      '/public/units.csv',
      '/static/units.csv',
      '/data/units.csv',
      '/assets/units.csv',
      '/units',
      '/api/units',
      '/api/units.csv',
      '/units.csv?raw=true'
    ];

    const isLikelyCsv = (text) => {
      if (!text) return false;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return false;
      // if many lines have at least 2-3 comma-separated columns, treat as CSV
      let count = 0;
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        if (lines[i].split(',').length >= 2) count++;
      }
      return count >= Math.min(2, lines.length);
    };

    const tryFetch = async (url) => {
      try {
        console.log('tryFetch: attempting', url);
        const resp = await fetch(url, { cache: 'no-cache' });
        console.log('tryFetch: response status for', url, resp.status, 'content-type:', resp.headers.get('content-type'));
        if (!resp.ok) {
          console.warn('tryFetch: not ok', url);
          return null;
        }
        const txt = await resp.text();
        // quick guard: if body looks like HTML (starts with <!doctype or <html) treat as HTML
        const head = txt.slice(0, 200).toLowerCase();
        if (head.includes('<!doctype') || head.includes('<html') || head.includes('<meta')) {
          console.log('tryFetch: fetched HTML from', url, '— scanning for CSV links');
          // try to find any .csv link inside HTML
          const match = txt.match(/["']([^"']+?(?:units|unit)[^"']*?\.csv)["']/i) || txt.match(/href=["']([^"']+?\.csv)["']/i) || txt.match(/src=["']([^"']+?\.csv)["']/i);
          if (match && match[1]) {
            const found = match[1];
            // resolve relative URLs
            const resolved = (found.startsWith('http') ? found : new URL(found, window.location.href).href);
            console.log('tryFetch: found CSV link inside HTML:', found, 'resolved:', resolved);
            // attempt to fetch the resolved CSV once
            const csvResp = await fetch(resolved, { cache: 'no-cache' });
            console.log('tryFetch: csv resolved response status', csvResp.status, 'content-type:', csvResp.headers.get('content-type'));
            if (!csvResp.ok) return null;
            const csvText = await csvResp.text();
            if (isLikelyCsv(csvText)) return csvText;
            return null;
          }
          // no csv found inside HTML
          return null;
        } else {
          if (isLikelyCsv(txt)) {
            console.log('tryFetch: body looks like CSV from', url);
            return txt;
          } else {
            console.log('tryFetch: body does not look like CSV for', url, 'peek:', txt.slice(0,200));
            return null;
          }
        }
      } catch (err) {
        console.error('tryFetch: error fetching', url, err);
        return null;
      }
    };

    for (const p of candidates) {
      const txt = await tryFetch(p);
      if (txt) {
        try {
          console.log('fetchGroupsFromBackendCsv: parsing csv from', p);
          const parsed = parseCsvToGroups(txt);
          const normalize = (arr) => Array.from(new Set((arr || []).map(s => (s||'').trim()).filter(Boolean)));
          const groupsObj = { battalions: normalize(parsed.battalions), platoons: normalize(parsed.platoons), classes: normalize(parsed.classes) };
          console.log('fetchGroupsFromBackendCsv: SUCCESS groupsObj ->', { battalions: groupsObj.battalions.length, platoons: groupsObj.platoons.length, classes: groupsObj.classes.length });
          saveGroups(groupsObj);
          setGroups(groupsObj);
          return groupsObj;
        } catch (err) {
          console.error('fetchGroupsFromBackendCsv: parse error for', p, err);
          // continue to next candidate
        }
      } else {
        console.log('fetchGroupsFromBackendCsv: no CSV at', p);
      }
    }

    console.warn('fetchGroupsFromBackendCsv: no CSV found in candidates, falling back to localStorage');
    const local = loadGroups();
    console.log('fetchGroupsFromBackendCsv: local groups ->', local);
    setGroups(local);
    return local;
  };

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(loadUsers());
  const [loginName, setLoginName] = useState('');

  // Poll/editor state
  const [polls, setPolls] = useState(loadPolls());
  const [answers, setAnswers] = useState(loadAnswers());

  // Groups state
  const [groups, setGroups] = useState(loadGroups());

  // UI state
  const [activePollToAnswer, setActivePollToAnswer] = useState(null);
  const [activePollAnswersView, setActivePollAnswersView] = useState(null);

  // admin dialog state & inputs
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  // NEW: signup dialog state
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);

  // add view state (dashboard | admin_create | admin_manage)
  const [view, setView] = useState('dashboard');

  // Safe setter that persists/clears session
  const setAppUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem(SESSION_KEY, u.name);
      // refresh groups from backend CSV (or fallback) when a user logs in
      fetchGroupsFromBackendCsv()
        .then(g => console.log('setAppUser: refreshed groups ->', { battalions: g.battalions.length, platoons: g.platoons.length, classes: g.classes.length }))
        .catch(err => console.error('setAppUser: failed to refresh groups', err));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  useEffect(() => {
    // restore users/polls/answers from storage and any active session
    const storedUsers = loadUsers();
    setUsers(storedUsers);
    setPolls(loadPolls());
    setAnswers(loadAnswers());
    // try to load groups from backend CSV, fall back to localStorage
    fetchGroupsFromBackendCsv().then(g => {
      console.log('useEffect: fetchGroupsFromBackendCsv returned groups ->', g);
    }).catch(err => console.error('useEffect: fetchGroupsFromBackendCsv error', err));
    const sessionName = localStorage.getItem(SESSION_KEY);
    if (sessionName) {
      const found = storedUsers.find((x) => x.name === sessionName);
      if (found) setUser(found);
    }

    // set a visible, pleasant background for the whole page
    const originalBackground = document.body.style.background;
    const originalBackgroundColor = document.body.style.backgroundColor;
    document.body.style.background = 'linear-gradient(135deg, #f6f9fc 0%, #e6eef6 50%, #dfeffb 100%)';
    document.body.style.backgroundColor = '#f6f9fc';
    document.body.style.color = '#1f2937';

    return () => {
      document.body.style.background = originalBackground;
      document.body.style.backgroundColor = originalBackgroundColor;
    };
  }, []);

  // keep localStorage in sync when users/polls/answers change
  useEffect(() => { saveUsers(users); }, [users]);
  useEffect(() => { savePolls(polls); }, [polls]);
  useEffect(() => { saveAnswers(answers); }, [answers]);
  useEffect(() => { saveGroups(groups); }, [groups]);

  // when user changes, ensure view defaults sensibly
  useEffect(() => {
    if (!user) return;
    setView(user.isAdmin ? 'admin_create' : 'polls');
  }, [user]);

  // --- auth helpers (register/login/admin/logout) ---
  const register = ({ name, email = '', battalion = '', platoon = '', className = '' }) => {
    if (!name || !name.trim()) return { error: 'Name is required' };
    const normalized = name.trim();
    const exists = users.some((u) => u.name.toLowerCase() === normalized.toLowerCase());
    if (exists) return { error: 'Name already taken' };
    const newUser = { name: normalized, email, isAdmin: false, battalion, platoon, className };
    const next = [...users, newUser];
    setUsers(next);
    setAppUser(newUser);
    return { ok: true, user: newUser };
  };
  const loginByName = (name) => {
    if (!name || !name.trim()) return { error: 'Name is required' };
    const found = users.find((u) => u.name.toLowerCase() === name.trim().toLowerCase());
    if (!found) return { error: 'No user with that name' };
    setAppUser(found);
    return { ok: true, user: found };
  };
  const handleAdminLogin = () => {
    setAdminUsernameInput('');
    setAdminPasswordInput('');
    setAdminError('');
    setAdminDialogOpen(true);
  };
  const logout = () => { setAppUser(null); };

  // --- polls/answers helpers ---
  const genId = (prefix = '') => `${prefix}${Date.now().toString(36)}-${Math.floor(Math.random()*10000).toString(36)}`;

  const createPoll = ({ title, questions = [], createdBy }) => {
    if (!title || !title.trim()) return { error: 'Title required' };
    const p = {
      id: genId('p_'),
      title: title.trim(),
      questions: questions.map((q) => ({ ...q, id: genId('q_') })),
      groups: [],
      published: false,
      createdBy: createdBy || 'unknown',
      createdAt: Date.now()
    };
    setPolls((prev) => {
      const next = [...prev, p];
      savePolls(next);
      return next;
    });
    return { ok: true, poll: p };
  };

  const publishPoll = (pollId, groupsArray) => {
    setPolls((prev) => {
      const next = prev.map((p) => p.id === pollId ? { ...p, published: true, groups: groupsArray } : p);
      savePolls(next);
      return next;
    });
  };

  const unpublishPoll = (pollId) => {
    setPolls((prev) => {
      const next = prev.map((p) => p.id === pollId ? { ...p, published: false, groups: [] } : p);
      savePolls(next);
      return next;
    });
  };

  const deletePoll = (pollId) => {
    // remove the poll
    setPolls((prev) => {
      const next = prev.filter((p) => p.id !== pollId);
      savePolls(next);
      return next;
    });
    // remove any answers associated with the poll
    setAnswers((prev) => {
      const nextA = prev.filter((a) => a.pollId !== pollId);
      saveAnswers(nextA);
      return nextA;
    });
    // clear any active views on that poll
    if (activePollToAnswer === pollId) setActivePollToAnswer(null);
    if (activePollAnswersView === pollId) setActivePollAnswersView(null);
  };

  const saveAnswer = (pollId, userName, answersObj) => {
    // overwrite existing user's answer for same poll
    setAnswers((prev) => {
      const filtered = prev.filter((a) => !(a.pollId === pollId && a.userName === userName));
      const entry = { id: genId('a_'), pollId, userName, answers: answersObj, ts: Date.now() };
      const next = [...filtered, entry];
      saveAnswers(next);
      return next;
    });
  };

  const getAnswersForPoll = (pollId) => answers.filter((a) => a.pollId === pollId);

  const getUserAnswerForPoll = (pollId, userName) => answers.find((a) => a.pollId === pollId && a.userName === userName);

  const getPollsForUser = (u) => {
    if (!u) return [];
    return polls.filter((p) => {
      if (!p.published) return false;
      const groups = p.groups || [];
      if (groups.includes('all')) return true;
      const userGroups = [u.battalion, u.platoon, u.className].filter(Boolean).map(String);
      return groups.some((g) => userGroups.includes(String(g)));
    });
  };

  // --- UI handlers connecting components ---
  const handleCreatePoll = ({ title, questions }) => {
    const res = createPoll({ title, questions, createdBy: user?.name });
    if (res?.error) { alert(res.error); return; }
    setPolls(loadPolls());
  };

  const handleOpenAnswer = (pollId) => {
    setActivePollToAnswer(pollId);
  };

  const handleSubmitAnswer = (pollId, answersObj) => {
    if (!user) return alert('not logged in');
    saveAnswer(pollId, user.name, answersObj);
    setActivePollToAnswer(null);
  };

  // validate credentials and create/login admin user named "amirbourvine"
  const submitAdminCredentials = () => {
    const ADMIN_USER = 'amirbourvine';
    const ADMIN_PASS = '049302';
    if (adminUsernameInput === ADMIN_USER && adminPasswordInput === ADMIN_PASS) {
      // create admin user if missing and persist
      let admin = users.find((u) => u.name === ADMIN_USER);
      if (!admin) {
        admin = { name: ADMIN_USER, email: 'admin@test.com', isAdmin: true, battalion: 'HQ', platoon: 'Admin', className: 'Root' };
        setUsers((prev) => {
          const next = [...prev.filter((p) => p.name !== ADMIN_USER), admin];
          saveUsers(next);
          return next;
        });
      }
      setAppUser(admin);
      setAdminDialogOpen(false);
    } else {
      setAdminError('Invalid username or password.');
    }
  };

  // --- render ---
  return (
    <>
      {/* Debug overlay */}
      <Box sx={{ position: 'fixed', top: 8, left: 8, zIndex: 9999 }}>
        <Box sx={{ background: 'rgba(0,0,0,0.85)', color: '#00ff7f', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'monospace', fontSize: 12 }}>
          App mounted — user: {user ? user.name : 'none'}
        </Box>
      </Box>

      {user && <Navbar user={user} setUser={setAppUser} setView={setView} view={view} />}

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {!user ? (
          <Box>
            {/* Sign Up and Admin buttons side-by-side */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <Button variant="contained" onClick={() => { setSignupDialogOpen(true); }}>Sign Up</Button>
              <Button variant="contained" color="secondary" onClick={handleAdminLogin}>Enter as Admin (Setup Mode)</Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            {/** Quick login and registered users */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <Box sx={{ width: '100%', maxWidth: 640, mt: 2, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: '1.6rem' }}>Quick login by name</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'center' }}>
                  <input
                    placeholder="Enter name..."
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    style={{ width: '100%', maxWidth: '400px', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', fontSize: '1.05rem', textAlign: 'center' }}
                  />
                  <Button variant="outlined" onClick={() => { const r = loginByName(loginName); if (r?.error) alert(r.error); }} sx={{ width: '100%', maxWidth: '400px', fontSize: '1rem', padding: '12px 24px' }}>Login</Button>
                </Box>

                {/* <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Registered users:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {users.length === 0 ? <em>No users yet — register above.</em> : users.map((u) => (
                      <Button key={u.name} size="small" onClick={() => loginByName(u.name)}>{u.name}</Button>
                    ))}
                  </Box>
                </Box> */}
              </Box>
            </Box>

            {/* Signup dialog (contains existing Signup component) */}
            <Dialog open={signupDialogOpen} onClose={() => setSignupDialogOpen(false)} fullWidth maxWidth="sm">
              <DialogTitle>Sign Up</DialogTitle>
              <DialogContent>
                <Signup onSignup={(data) => {
                  const res = register(data || {});
                  if (res?.error) alert(res.error);
                  else setSignupDialogOpen(false);
                }} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSignupDialogOpen(false)}>Cancel</Button>
              </DialogActions>
            </Dialog>
          </Box>
        ) : (
          <Box>
            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{user.name} {user.isAdmin && '(admin)'}</Typography>
              <Box>
                <Button variant="contained" color="error" onClick={logout}>Logout</Button>
              </Box>
            </Box> */}

            <Divider sx={{ mb: 2 }} />

            {/* Show Group Management for regular users; for admins show either Create or Manage based on view */}
            {user.isAdmin ? (
              view === 'admin_create' ? (
                <Box>
                  <Typography variant="h4" gutterBottom>Create Poll</Typography>
                  <PollEditor onCreate={handleCreatePoll} />
                </Box>
              ) : view === 'admin_manage' ? (
                <Box>
                  <Typography variant="h4" gutterBottom>Existing Polls</Typography>
                  <PollList
                    polls={polls}
                    user={user}
                    onPublish={(id, groups) => publishPoll(id, groups)}
                    onUnpublish={(id) => unpublishPoll(id)}
                    onViewAnswers={(id) => setActivePollAnswersView(id)}
                    onDelete={(id) => deletePoll(id)}
                    onOpenAnswer={(id) => handleOpenAnswer(id)}
                    getUserAnswerForPoll={getUserAnswerForPoll}
                    answers={answers}
                  />
                </Box>
              ) : (
                <Box>
                  <Typography variant="h4" gutterBottom>Group Management</Typography>
                  <GroupManagement groups={groups} setGroups={setGroups} />
                </Box>
              )
            ) : (
              <Dashboard
                user={user}
                polls={getPollsForUser(user)}
                onOpenAnswer={(id) => handleOpenAnswer(id)}
                onViewAnswers={(id) => setActivePollAnswersView(id)}
                getUserAnswerForPoll={getUserAnswerForPoll}
              />
            )}
          </Box>
        )}
      </Container>

      {/* Show answer form inline when needed */}
      {activePollToAnswer && (
        <Box sx={{ px: 3 }}>
          <PollAnswerForm
            poll={polls.find(p => p.id === activePollToAnswer)}
            existingAnswer={getUserAnswerForPoll(activePollToAnswer, user?.name)}
            onSubmit={(answersObj) => handleSubmitAnswer(activePollToAnswer, answersObj)}
            onCancel={() => setActivePollToAnswer(null)}
          />
        </Box>
      )}

      {/* Show answers dialog when requested */}
      {activePollAnswersView && (
        <PollAnswersView
          poll={polls.find(p => p.id === activePollAnswersView)}
          answers={getAnswersForPoll(activePollAnswersView)}
          onClose={() => setActivePollAnswersView(null)}
        />
      )}

      {/* admin login dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)}>
        <DialogTitle>Admin Login</DialogTitle>
        <DialogContent>
          {adminError && <Alert severity="error" sx={{ mb: 1 }}>{adminError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            value={adminUsernameInput}
            onChange={(e) => setAdminUsernameInput(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
        </DialogActions>
        <Button variant="contained" onClick={submitAdminCredentials}>Login</Button>
      </Dialog>
    </>
  );
}

export default App;