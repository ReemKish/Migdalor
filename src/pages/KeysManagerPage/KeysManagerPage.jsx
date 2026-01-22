import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    TextField,
    Card,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Checkbox,
    FormControlLabel,
    Chip,
    IconButton,
    Grid,
    Container,
    Paper,
    TableContainer,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Add as PlusIcon,
    VpnKey as KeyIcon,
    Delete as Trash2Icon,
    Edit as Edit2Icon,
    Computer as MonitorIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    CleaningServices as BroomIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient'; // Ensure path is correct
import { BAHAD_GROUP_KEY_ID } from 'lib/consts'

// --- Utility Functions ---

function getNextWednesday(from = new Date()) {
    const date = new Date(from);
    const day = date.getDay(); // 0 = Sun, 3 = Wed
    const daysUntilWednesday = (3 - day + 7) % 7;
    date.setDate(date.getDate() + daysUntilWednesday);
    return date;
}

function formatLessonData(data) {
    return {
        id: data.id,
        assigned_key: data.assigned_key || data.room_number,
        crew_name: data.crew_name || data.crew,
        platoon_name: data.platoon_name,
        crew_manager: data.crew_manager,
        start_time: data.start_time?.slice(0, 5),
        end_time: data.end_time?.slice(0, 5),
        status: data.status,
    };
}

const KeysManager = () => {
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [keys, setKeys] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [groups, setGroups] = useState([]);
    const [todayLessons, setTodayLessons] = useState([]);
    const [wednesdayLessons, setWednesdayLessons] = useState([]);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isDistributing, setIsDistributing] = useState(false);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [misdarEditKey, setMisdarEditKey] = useState(null);
    const [misdarValue, setMisdarValue] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        room_number: '',
        room_type: 'צוותי',
        has_computers: false,
        building_id: '',
    });

    const [requestFormData, setRequestFormData] = useState({
        range_start: new Date().toISOString().split('T')[0],
        range_end: getNextWednesday().toISOString().split('T')[0],
        single_team_amount: 0,
        two_team_amount: 0,
        company_amount: 0
    });

    const isAdmin = user?.site_role === 'admin' || true;

    // --- Data Fetching ---

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: userData } = await supabase.from('users')
                    .select('id, full_name, group_node(id, name)')
                    .eq('id', authUser.id).single();
                console.log("user data:", userData);
                setUser(userData);
            }

            const [keysReq, buildingsReq, groupsReq, todayLessonsReq, wedLessonsReq] = await Promise.all([
                supabase.from('keysmanager_keys').select('*, group_node(id, name)').order('room_number', { ascending: true }),
                supabase.from("buildings").select("*"),
                supabase.from("group_node").select("*, group_type(id, name)"),
                supabase.from('schedule_lessons').select('*').eq('date', new Date().toISOString().split("T")[0]),
                supabase.from('schedule_lessons').select('*').eq('date', getNextWednesday().toISOString().split("T")[0])
            ]);

            if (keysReq.data) setKeys(keysReq.data);
            if (buildingsReq.data) setBuildings(buildingsReq.data);
            if (groupsReq.data) setGroups(groupsReq.data);
            if (todayLessonsReq.data) setTodayLessons(todayLessonsReq.data.map(formatLessonData));
            if (wedLessonsReq.data) setWednesdayLessons(wedLessonsReq.data.map(formatLessonData));

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Logic Helpers ---

    const getCurrentHolder = (roomNumber) => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentLesson = todayLessons.find(
            (lesson) =>
                lesson.assigned_key === roomNumber &&
                lesson.start_time <= currentTime &&
                lesson.end_time > currentTime
        );
        return currentLesson ? currentLesson.crew_name : null;
    };

    const getMisdarResponsible = (key) => {
        if (key.manual_misdar_assignment) {
            return { crewName: key.manual_misdar_assignment, platoon: null, isManual: true };
        }
        if (!wednesdayLessons.length) return null;
        const roomLessons = wednesdayLessons.filter((l) => l.assigned_key === key.room_number);
        if (roomLessons.length === 0) return null;
        roomLessons.sort((a, b) => a.start_time.localeCompare(b.start_time));
        for (const lesson of roomLessons) {
            const nextLesson = wednesdayLessons.find(
                (l) => l.assigned_key === key.room_number && l.crew_manager !== lesson.crew_manager && l.start_time >= lesson.end_time
            );
            if (!nextLesson) return { crewName: lesson.crew_name, platoon: lesson.platoon_name, isManual: false };
        }
        return null;
    };

    const isKeyAvailable = (key) => key.assigned_group_id !== null && key.assigned_group_id !== BAHAD_GROUP_KEY_ID;
    const getAssignedGroupName = (key) => isKeyAvailable(key) ? key.group_node?.name : null;

    // --- Handlers ---

    const handleOpenEdit = (key) => {
        setEditingKey(key);
        setFormData({
            room_number: key.room_number,
            room_type: key.room_type,
            has_computers: key.has_computers || false,
            building_id: key.building_id || '',
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingKey(null);
        setFormData({ room_number: '', room_type: 'צוותי', has_computers: false, building_id: '' });
    };

    const handleSubmitKey = async () => {
        if (!formData.room_number) return alert('אנא הזן מספר חדר');
        const payload = {
            room_number: formData.room_number,
            room_type: formData.room_type,
            has_computers: formData.has_computers,
            building_id: formData.building_id || null,
            assigned_group_id: BAHAD_GROUP_KEY_ID,
        };

        try {
            if (editingKey) {
                const { data, error } = await supabase.from("keysmanager_keys").update(payload).eq('id', editingKey.id).select('*, group_node(id, name)').single();
                if (error) throw error;
                setKeys(prev => prev.map(k => k.id === editingKey.id ? data : k));
            } else {
                const { data, error } = await supabase.from("keysmanager_keys").insert([{ ...payload, status: 'free', manual_misdar_assignment: "" }]).select('*, group_node(id, name)').single();
                if (error) throw error;
                setKeys(prev => [...prev, data]);
            }
            handleCloseModal();
        } catch (error) { console.error(error); }
    };

    const handleSubmitRequest = async () => {
        try {
            setIsLoading(true);
            const payload = {
                requester: user?.group_node.id,
                requestee: BAHAD_GROUP_KEY_ID,
                range_start: requestFormData.range_start,
                range_end: requestFormData.range_end,
                single_team_amount: parseInt(requestFormData.single_team_amount) || 0,
                two_team_amount: parseInt(requestFormData.two_team_amount) || 0,
                company_amount: parseInt(requestFormData.company_amount) || 0,
                status: 'pending'
            };
            const { error } = await supabase.from('keys_request').insert([payload]);
            if (error) throw error;
            alert("בקשה נשלחה בהצלחה!");
            setShowRequestModal(false);
        } catch (error) {
            alert("שגיאה בשליחת הבקשה: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("בטוח שברצונך למחוק מפתח זה?")) return;
        const { error } = await supabase.from('keysmanager_keys').delete().eq('id', id);
        if (!error) setKeys(prev => prev.filter(k => k.id !== id));
    };

    const handleMisdarSave = async () => {
        const { data, error } = await supabase.from('keysmanager_keys').update({ manual_misdar_assignment: misdarValue }).eq('id', misdarEditKey.id).select('*, group_node(id, name)').single();
        if (!error) {
            setKeys(prev => prev.map(k => k.id === misdarEditKey.id ? data : k));
            setMisdarEditKey(null);
        }
    };

    const handleLocalAssign = (index, groupId) => {
        setKeys(prevKeys => {
            const newKeys = [...prevKeys];
            newKeys[index] = { ...newKeys[index], assigned_group_id: groupId };
            return newKeys;
        });
    };

    const handleSaveDistribution = async () => {
        setIsLoading(true);
        const updates = keys.map(k => ({ id: k.id, assigned_group_id: k.assigned_group_id, room_number: k.room_number, has_computers: k.has_computers, status: k.status }));
        const { error } = await supabase.from("keysmanager_keys").upsert(updates);
        if (!error) {
            await fetchData();
            setIsDistributing(false);
        }
        setIsLoading(false);
    };

    const smallCount = keys.filter((k) => k.room_type === 'צוותי').length;
    const largeCount = keys.filter((k) => k.room_type === 'פלוגתי').length;

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)' }} dir="rtl">
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>ניהול מפתחות 🗝️</Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>הוסף, ערוך או בקש הקצאת מפתחות כיתות</Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, border: '1px solid #e2e8f0' }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>סה״כ מפתחות</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>{keys.length}</Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, bgcolor: '#eff6ff', borderColor: '#bfdbfe' }}>
                            <Typography variant="body2" sx={{ color: '#2563eb', mb: 0.5 }}>חדרים צוותיים</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d4ed8' }}>{smallCount}</Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, bgcolor: '#faf5ff', borderColor: '#e9d5ff' }}>
                            <Typography variant="body2" sx={{ color: '#9333ea', mb: 0.5 }}>חדרים פלוגתיים</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#7e22ce' }}>{largeCount}</Typography>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
                    {!isDistributing ? (
                        <>
                            <Button variant="contained" startIcon={<SendIcon />} onClick={() => setShowRequestModal(true)} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                                בקשת מפתחות
                            </Button>
                            {isAdmin && (
                                <>
                                    <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setShowModal(true)} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                                        הוסף מפתח
                                    </Button>
                                    <Button variant="outlined" startIcon={<Edit2Icon />} onClick={() => setIsDistributing(true)}>
                                        חלק מפתחות
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveDistribution} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>שמור חלוקה</Button>
                            <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => { setIsDistributing(false); fetchData(); }} color="error">בטל</Button>
                        </>
                    )}
                </Box>

                <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>מספר חדר</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>סוג</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>אזור</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>מחשבים</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>סטטוס / מחזיק</TableCell>
                                {isAdmin && <TableCell align="center" sx={{ fontWeight: 600 }}>מסדר כיתות 🧹</TableCell>}
                                {isAdmin && !isDistributing && <TableCell align="center" sx={{ fontWeight: 600 }}>פעולות</TableCell>}
                                {isDistributing && <TableCell align="center" sx={{ fontWeight: 600 }}>מוקצא ל</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                            ) : keys.map((key, index) => (
                                <TableRow key={key.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <KeyIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{key.room_number}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={key.room_type === 'פלוגתי' ? '🏢 פלוגתי' : '🏠 צוותי'} size="small" variant="outlined" sx={{ borderColor: key.room_type === 'פלוגתי' ? '#c084fc' : '#60a5fa', color: key.room_type === 'פלוגתי' ? '#7e22ce' : '#1d4ed8' }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        {key.building_id ? <Chip label={`📍 ${buildings.find(b => b.id === key.building_id)?.name || key.building_id}`} size="small" variant="outlined" sx={{ borderColor: '#cbd5e1', color: '#475569' }} /> : '—'}
                                    </TableCell>
                                    <TableCell align="center">{key.has_computers ? <MonitorIcon sx={{ fontSize: 16, color: '#2563eb' }} /> : '—'}</TableCell>
                                    <TableCell align="center">
                                        {(() => {
                                            const holder = getCurrentHolder(key.room_number) || getAssignedGroupName(key);
                                            return holder ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Chip label="תפוס" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />
                                                    <Typography variant="caption">{holder}</Typography>
                                                </Box>
                                            ) : <Chip label="זמין" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46' }} />;
                                        })()}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                {(() => {
                                                    const res = getMisdarResponsible(key);
                                                    return res ? <Chip label={`🧹 ${res.crewName}`} size="small" variant="outlined" sx={{ bgcolor: '#fff7ed', color: '#c2410c' }} /> : '—';
                                                })()}
                                                <IconButton size="small" onClick={() => { setMisdarEditKey(key); setMisdarValue(key.manual_misdar_assignment || ''); }}><Edit2Icon sx={{ fontSize: 14 }} /></IconButton>
                                            </Box>
                                        </TableCell>
                                    )}
                                    {isAdmin && !isDistributing && (
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => handleOpenEdit(key)}><Edit2Icon fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(key.id)}><Trash2Icon fontSize="small" sx={{ color: '#f87171' }} /></IconButton>
                                        </TableCell>
                                    )}
                                    {isDistributing && (
                                        <TableCell align="center">
                                            <Select size="small" value={key.assigned_group_id || BAHAD_GROUP_KEY_ID} onChange={(e) => handleLocalAssign(index, e.target.value)} sx={{ minWidth: 120 }}>
                                                <MenuItem value={BAHAD_GROUP_KEY_ID}>בה"ד (פנוי)</MenuItem>
                                                {groups.filter(g => g.group_type.name === "Battalion").map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                                            </Select>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>

            {/* Request Modal */}
            <Dialog open={showRequestModal} onClose={() => setShowRequestModal(false)} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle>בקשת הקצאת מפתחות</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={6}><TextField label="מתאריך" type="date" fullWidth InputLabelProps={{ shrink: true }} value={requestFormData.range_start} onChange={(e) => setRequestFormData({ ...requestFormData, range_start: e.target.value })} /></Grid>
                        <Grid item xs={6}><TextField label="עד תאריך" type="date" fullWidth InputLabelProps={{ shrink: true }} value={requestFormData.range_end} onChange={(e) => setRequestFormData({ ...requestFormData, range_end: e.target.value })} /></Grid>
                        <Grid item xs={4}><TextField label="צוותי" type="number" fullWidth value={requestFormData.single_team_amount} onChange={(e) => setRequestFormData({ ...requestFormData, single_team_amount: e.target.value })} /></Grid>
                        <Grid item xs={4}><TextField label="דו-צוותי" type="number" fullWidth value={requestFormData.two_team_amount} onChange={(e) => setRequestFormData({ ...requestFormData, two_team_amount: e.target.value })} /></Grid>
                        <Grid item xs={4}><TextField label="פלוגתי" type="number" fullWidth value={requestFormData.company_amount} onChange={(e) => setRequestFormData({ ...requestFormData, company_amount: e.target.value })} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={() => setShowRequestModal(false)}>ביטול</Button><Button onClick={handleSubmitRequest} variant="contained">שלח בקשה</Button></DialogActions>
            </Dialog>

            {/* Edit Key Modal */}
            <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle>{editingKey ? 'ערוך מפתח' : 'הוסף מפתח'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField label="מספר חדר" fullWidth value={formData.room_number} onChange={(e) => setFormData({ ...formData, room_number: e.target.value })} />
                        <FormControl fullWidth><InputLabel>סוג חדר</InputLabel><Select value={formData.room_type} label="סוג חדר" onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}><MenuItem value="צוותי">צוותי</MenuItem><MenuItem value="פלוגתי">פלוגתי</MenuItem></Select></FormControl>
                        <FormControl fullWidth><InputLabel>בניין</InputLabel><Select value={formData.building_id} label="בניין" onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}><MenuItem value="">ללא בניין</MenuItem>{buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}</Select></FormControl>
                        <FormControlLabel control={<Checkbox checked={formData.has_computers} onChange={(e) => setFormData({ ...formData, has_computers: e.target.checked })} />} label="מחשבים בחדר" />
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={handleCloseModal}>ביטול</Button><Button onClick={handleSubmitKey} variant="contained">{editingKey ? 'עדכן' : 'צור'}</Button></DialogActions>
            </Dialog>

            {/* Misdar Manual Modal */}
            <Dialog open={!!misdarEditKey} onClose={() => setMisdarEditKey(null)} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle>ערוך מסדר כיתות</DialogTitle>
                <DialogContent dividers>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>פלוגה אחראית</InputLabel>
                        <Select value={misdarValue} onChange={(e) => setMisdarValue(e.target.value)} label="פלוגה אחראית">
                            <MenuItem value="">חישוב אוטומטי</MenuItem>
                            <MenuItem value="פלוגה א - סהר">פלוגה א - סהר</MenuItem>
                            <MenuItem value="פלוגה ב - יפתח">פלוגה ב - יפתח</MenuItem>
                            <MenuItem value="פלוגה ג - אייל">פלוגה ג - אייל</MenuItem>
                            <MenuItem value="פלוגה ד - אסף">פלוגה ד - אסף</MenuItem>
                            <MenuItem value="פלוגה ה - איתן">פלוגה ה - איתן</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions><Button onClick={() => setMisdarEditKey(null)}>ביטול</Button><Button onClick={handleMisdarSave} variant="contained" sx={{ bgcolor: '#ea580c' }}>שמור</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default KeysManager;
