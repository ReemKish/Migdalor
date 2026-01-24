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
    TableContainer,
    CircularProgress,
    Fade,
    Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Plus,
    Key,
    Trash2,
    Edit2,
    Monitor,
    Save,
    X,
    BrushCleaning, // במקום CleaningServices
    Send,
    Search,
    Building,
    CheckCircle,
    User
} from 'lucide-react';
import { useOutletContext } from 'react-router';
import { supabase } from '../../lib/supabaseClient';
import { BAHAD_GROUP_KEY_ID } from 'lib/consts';

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
    // קבלת נתונים מה-Layout
    const { user, isDark } = useOutletContext();

    // --- State Management ---
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

    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('Admin') || true; // לוגיקה זמנית ל-Admin

    // --- Data Fetching ---

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // הוסר ה-fetch של המשתמש כי הוא מגיע מה-Context

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
                requester: user?.group_node?.id || user?.group_id, // התאמה למבנה שלך
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

    if (!user) return null;

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Header Section */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b' }}>
                            ניהול מפתחות
                        </Typography>
                        <Key size={32} style={{ color: '#10b981' }} />
                    </Box>
                    <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                        הוסף, ערוך או בקש הקצאת מפתחות כיתות
                    </Typography>
                </Box>
            </motion.div>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: 'סה״כ מפתחות', value: keys.length, color: '#3b82f6', bg: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' },
                    { title: 'חדרים צוותיים', value: smallCount, color: '#10b981', bg: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5' },
                    { title: 'חדרים פלוגתיים', value: largeCount, color: '#8b5cf6', bg: isDark ? 'rgba(139, 92, 246, 0.1)' : '#f5f3ff' },
                ].map((stat, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card sx={{
                                p: 3,
                                bgcolor: stat.bg,
                                borderRadius: '20px',
                                border: `1px solid ${stat.color}30`,
                                boxShadow: 'none'
                            }}>
                                <Typography variant="body2" sx={{ color: stat.color, fontWeight: 600, mb: 0.5 }}>{stat.title}</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b' }}>{stat.value}</Typography>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Actions Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
                {!isDistributing ? (
                    <>
                        <Button
                            variant="contained"
                            startIcon={<Send size={18} />}
                            onClick={() => setShowRequestModal(true)}
                            sx={{
                                bgcolor: '#3b82f6',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: '#2563eb' }
                            }}
                        >
                            בקשת מפתחות
                        </Button>
                        {isAdmin && (
                            <>
                                <Button
                                    variant="contained"
                                    startIcon={<Plus size={18} />}
                                    onClick={() => setShowModal(true)}
                                    sx={{
                                        bgcolor: '#10b981',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: '#059669' }
                                    }}
                                >
                                    הוסף מפתח
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Edit2 size={18} />}
                                    onClick={() => setIsDistributing(true)}
                                    sx={{
                                        borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#cbd5e1',
                                        color: isDark ? 'white' : '#475569',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': {
                                            borderColor: isDark ? 'white' : '#94a3b8',
                                            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                        }
                                    }}
                                >
                                    חלק מפתחות
                                </Button>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSaveDistribution} sx={{ bgcolor: '#10b981', borderRadius: '12px', '&:hover': { bgcolor: '#059669' } }}>שמור חלוקה</Button>
                        <Button variant="outlined" startIcon={<X size={18} />} onClick={() => { setIsDistributing(false); fetchData(); }} color="error" sx={{ borderRadius: '12px' }}>בטל</Button>
                    </>
                )}
            </Box>

            {/* Main Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card sx={{
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,1)' }}>
                                    {[
                                        'מספר חדר', 'סוג', 'אזור', 'מחשבים', 'סטטוס / מחזיק',
                                        ...(isAdmin ? ['מסדר כיתות'] : []),
                                        ...(isAdmin && !isDistributing ? ['פעולות'] : []),
                                        ...(isDistributing ? ['מוקצא ל'] : [])
                                    ].map((header) => (
                                        <TableCell key={header} align="center" sx={{
                                            color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
                                            fontWeight: 600,
                                            borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0'
                                        }}>
                                            {header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, borderBottom: 'none' }}><CircularProgress /></TableCell></TableRow>
                                ) : keys.map((key, index) => (
                                    <TableRow key={key.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.5)' } }}>
                                        {/* Room Number */}
                                        <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                <Key size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? 'white' : '#1e293b' }}>{key.room_number}</Typography>
                                            </Box>
                                        </TableCell>

                                        {/* Type */}
                                        <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                            <Chip
                                                label={key.room_type === 'פלוגתי' ? 'פלוגתי' : 'צוותי'}
                                                size="small"
                                                sx={{
                                                    bgcolor: key.room_type === 'פלוגתי'
                                                        ? isDark ? 'rgba(139, 92, 246, 0.15)' : '#f3e8ff'
                                                        : isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
                                                    color: key.room_type === 'פלוגתי' ? '#a855f7' : '#2563eb',
                                                    fontWeight: 600,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </TableCell>

                                        {/* Building */}
                                        <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                            {key.building_id ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                                                    <Building size={14} />
                                                    <Typography variant="caption">{buildings.find(b => b.id === key.building_id)?.name || key.building_id}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>-</Typography>
                                            )}
                                        </TableCell>

                                        {/* Computers */}
                                        <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                            {key.has_computers ? <Monitor size={16} color="#3b82f6" /> : <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>-</Typography>}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                            {(() => {
                                                const holder = getCurrentHolder(key.room_number) || getAssignedGroupName(key);
                                                return holder ? (
                                                    <Chip
                                                        label={holder}
                                                        size="small"
                                                        icon={<User size={12} />}
                                                        sx={{ bgcolor: isDark ? 'rgba(251, 146, 60, 0.15)' : '#ffedd5', color: '#ea580c', fontWeight: 600, borderRadius: '8px' }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="פנוי"
                                                        size="small"
                                                        icon={<CheckCircle size={12} />}
                                                        sx={{ bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5', color: '#059669', fontWeight: 600, borderRadius: '8px' }}
                                                    />
                                                );
                                            })()}
                                        </TableCell>

                                        {/* Misdar (Admin) */}
                                        {isAdmin && (
                                            <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    {(() => {
                                                        const res = getMisdarResponsible(key);
                                                        return res ? (
                                                            <Chip
                                                                label={res.crewName}
                                                                size="small"
                                                                icon={<BrushCleaning size={12} />}
                                                                sx={{ bgcolor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed', color: '#c2410c', borderRadius: '6px' }}
                                                            />
                                                        ) : (
                                                            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>-</Typography>
                                                        );
                                                    })()}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { setMisdarEditKey(key); setMisdarValue(key.manual_misdar_assignment || ''); }}
                                                        sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8', '&:hover': { color: '#3b82f6' } }}
                                                    >
                                                        <Edit2 size={14} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}

                                        {/* Actions (Admin) */}
                                        {isAdmin && !isDistributing && (
                                            <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <IconButton size="small" onClick={() => handleOpenEdit(key)} sx={{ color: '#3b82f6', bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' }}>
                                                        <Edit2 size={14} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(key.id)} sx={{ color: '#ef4444', bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }}>
                                                        <Trash2 size={14} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}

                                        {/* Distribute Select */}
                                        {isDistributing && (
                                            <TableCell align="center" sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                                                <Select
                                                    size="small"
                                                    value={key.assigned_group_id || BAHAD_GROUP_KEY_ID}
                                                    onChange={(e) => handleLocalAssign(index, e.target.value)}
                                                    sx={{
                                                        minWidth: 120,
                                                        color: isDark ? 'white' : 'inherit',
                                                        '.MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e2e8f0' }
                                                    }}
                                                >
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
                </Card>
            </motion.div>

            {/* Request Modal */}
            <Dialog open={showRequestModal} onClose={() => setShowRequestModal(false)} maxWidth="sm" fullWidth dir="rtl" PaperProps={{ sx: { borderRadius: '20px', bgcolor: isDark ? '#1e293b' : 'white', color: isDark ? 'white' : 'inherit' } }}>
                <DialogTitle sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>בקשת הקצאת מפתחות</DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <TextField
                                label="מתאריך"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true, style: { color: isDark ? '#94a3b8' : 'inherit' } }}
                                value={requestFormData.range_start}
                                onChange={(e) => setRequestFormData({ ...requestFormData, range_start: e.target.value })}
                                sx={{ '& input': { color: isDark ? 'white' : 'inherit' } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="עד תאריך"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true, style: { color: isDark ? '#94a3b8' : 'inherit' } }}
                                value={requestFormData.range_end}
                                onChange={(e) => setRequestFormData({ ...requestFormData, range_end: e.target.value })}
                                sx={{ '& input': { color: isDark ? 'white' : 'inherit' } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="צוותי"
                                type="number"
                                fullWidth
                                value={requestFormData.single_team_amount}
                                onChange={(e) => setRequestFormData({ ...requestFormData, single_team_amount: e.target.value })}
                                sx={{ '& input': { color: isDark ? 'white' : 'inherit' } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="דו-צוותי"
                                type="number"
                                fullWidth
                                value={requestFormData.two_team_amount}
                                onChange={(e) => setRequestFormData({ ...requestFormData, two_team_amount: e.target.value })}
                                sx={{ '& input': { color: isDark ? 'white' : 'inherit' } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="פלוגתי"
                                type="number"
                                fullWidth
                                value={requestFormData.company_amount}
                                onChange={(e) => setRequestFormData({ ...requestFormData, company_amount: e.target.value })}
                                sx={{ '& input': { color: isDark ? 'white' : 'inherit' } }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>
                    <Button onClick={() => setShowRequestModal(false)} sx={{ color: isDark ? '#94a3b8' : 'inherit' }}>ביטול</Button>
                    <Button onClick={handleSubmitRequest} variant="contained" sx={{ bgcolor: '#3b82f6', borderRadius: '8px' }}>שלח בקשה</Button>
                </DialogActions>
            </Dialog>

            {/* Edit/Add Key Modal */}
            <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth dir="rtl" PaperProps={{ sx: { borderRadius: '20px', bgcolor: isDark ? '#1e293b' : 'white', color: isDark ? 'white' : 'inherit' } }}>
                <DialogTitle sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>{editingKey ? 'ערוך מפתח' : 'הוסף מפתח'}</DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label="מספר חדר"
                            fullWidth
                            value={formData.room_number}
                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                            sx={{ '& input': { color: isDark ? 'white' : 'inherit' } }}
                        />
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: isDark ? '#94a3b8' : 'inherit' }}>סוג חדר</InputLabel>
                            <Select
                                value={formData.room_type}
                                label="סוג חדר"
                                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                sx={{ color: isDark ? 'white' : 'inherit', '.MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'inherit' } }}
                            >
                                <MenuItem value="צוותי">צוותי</MenuItem>
                                <MenuItem value="פלוגתי">פלוגתי</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: isDark ? '#94a3b8' : 'inherit' }}>בניין</InputLabel>
                            <Select
                                value={formData.building_id}
                                label="בניין"
                                onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                                sx={{ color: isDark ? 'white' : 'inherit', '.MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'inherit' } }}
                            >
                                <MenuItem value="">ללא בניין</MenuItem>
                                {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={<Checkbox checked={formData.has_computers} onChange={(e) => setFormData({ ...formData, has_computers: e.target.checked })} sx={{ color: isDark ? '#94a3b8' : 'inherit' }} />}
                            label="מחשבים בחדר"
                            sx={{ color: isDark ? 'white' : 'inherit' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>
                    <Button onClick={handleCloseModal} sx={{ color: isDark ? '#94a3b8' : 'inherit' }}>ביטול</Button>
                    <Button onClick={handleSubmitKey} variant="contained" sx={{ bgcolor: '#10b981', borderRadius: '8px' }}>{editingKey ? 'עדכן' : 'צור'}</Button>
                </DialogActions>
            </Dialog>

            {/* Misdar Modal */}
            <Dialog open={!!misdarEditKey} onClose={() => setMisdarEditKey(null)} maxWidth="sm" fullWidth dir="rtl" PaperProps={{ sx: { borderRadius: '20px', bgcolor: isDark ? '#1e293b' : 'white', color: isDark ? 'white' : 'inherit' } }}>
                <DialogTitle sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>ערוך מסדר כיתות</DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel sx={{ color: isDark ? '#94a3b8' : 'inherit' }}>פלוגה אחראית</InputLabel>
                        <Select
                            value={misdarValue}
                            onChange={(e) => setMisdarValue(e.target.value)}
                            label="פלוגה אחראית"
                            sx={{ color: isDark ? 'white' : 'inherit', '.MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'inherit' } }}
                        >
                            <MenuItem value="">חישוב אוטומטי</MenuItem>
                            <MenuItem value="פלוגה א - סהר">פלוגה א - סהר</MenuItem>
                            <MenuItem value="פלוגה ב - יפתח">פלוגה ב - יפתח</MenuItem>
                            <MenuItem value="פלוגה ג - אייל">פלוגה ג - אייל</MenuItem>
                            <MenuItem value="פלוגה ד - אסף">פלוגה ד - אסף</MenuItem>
                            <MenuItem value="פלוגה ה - איתן">פלוגה ה - איתן</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>
                    <Button onClick={() => setMisdarEditKey(null)} sx={{ color: isDark ? '#94a3b8' : 'inherit' }}>ביטול</Button>
                    <Button onClick={handleMisdarSave} variant="contained" sx={{ bgcolor: '#ea580c', borderRadius: '8px' }}>שמור</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default KeysManager;