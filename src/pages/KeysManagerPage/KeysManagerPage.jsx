import React, { useState } from 'react';
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
} from '@mui/material';
import {
    Add as PlusIcon,
    VpnKey as KeyIcon,
    Delete as Trash2Icon,
    Edit as Edit2Icon,
    Computer as MonitorIcon,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { supabase } from 'lib/supabaseClient';

const KeysManager = () => {
    const [user, setUser] = useState(null);
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Error fetching user:', error);
            }
            const userData = supabase.from('users').select('email, site_role, pluga').eq('id', user.id).single();
            setUser({
                email: userData.email,
                site_role: userData.site_role,
                platoon_name: userData.pluga,
            });
        };

        fetchUser();
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [misdarEditKey, setMisdarEditKey] = useState(null);
    const [misdarValue, setMisdarValue] = useState('');
    const [isLoading] = useState(false);
    const [formData, setFormData] = useState({
        room_number: '',
        room_type: 'צוותי',
        has_computers: false,
        building: '',
    });


    const [keys, setKeys] = useState([]);
    const [buildings, setBuildings] = useState([]);
    useEffect(() => {
        const fetchKeys = async () => {
            const { data, error } = await supabase.from('keysmanager_keys').select('*');
            if (error) {
                console.error('Error fetching keys:', error);
            } else {
                setKeys(data);
            }
        };

        const fetchBuildings = async () => {
            const { data, error } = await supabase.from("buildings").select("*");
            if (error) {
                console.error(error);
            } else {
                setBuildings(data);
            }
        }

        fetchKeys();
        fetchBuildings();
    }, []);

    const [todayLessons, setTodayLessons] = useState([]);
    const [wednesdayLessons, setWednesdayLessons] = useState([]);
    useEffect(() => {
        function getNextWednesday(from = new Date()) {
            const date = new Date(from);
            const day = date.getDay(); // 0 = Sun, 3 = Wed
            const daysUntilWednesday = (3 - day) % 7;
            date.setDate(date.getDate() + daysUntilWednesday);
            return date;
        }

        function changeFormat(data) {
            return {
                id: data.id,
                assigned_key: data.room_number,
                crew_name: data.crew,
                start_time: data.start_time.slice(0, 5),
                end_time: data.end_time.slice(0, 5),
                status: data.status,
            }
        }

        const fetchLessons = async () => {
            // get todays lessons
            const { data: todayLessons } = await supabase.from('schedule_lessons')
                .select('*')
                .eq('date', new Date().toISOString().split("T")[0]);
            setTodayLessons(todayLessons.map(changeFormat));


            // get lessons on next wednesday
            const { data: wednesdayLessons } = await supabase.from('schedule_lessons')
                .select('*')
                .eq('date', getNextWednesday().toISOString().split("T")[0]);
            setWednesdayLessons(wednesdayLessons.map(changeFormat));
        }

        fetchLessons();
    }, []);

    if (user === null) return <p> Loading... </p>;
    const isAdmin = user?.site_role === 'admin' || true;
    // Get current key holder for a room
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

    // Get who's responsible for cleaning this room (Misdar)
    const getMisdarResponsible = (key) => {
        // Check for manual assignment first
        if (key.manual_misdar_assignment) {
            return { crewName: key.manual_misdar_assignment, platoon: null };
        }

        if (!wednesdayLessons.length) return null;

        // Find all lessons for this room
        const roomLessons = wednesdayLessons.filter((l) => l.assigned_key === key.room_number);
        if (roomLessons.length === 0) return null;

        // Check each lesson to see if the key was passed to another crew
        for (const lesson of roomLessons) {
            // Check if there's another lesson that took this key after this one
            const nextLesson = wednesdayLessons.find(
                (l) =>
                    l.assigned_key === key.room_number &&
                    l.crew_manager !== lesson.crew_manager &&
                    l.start_time >= lesson.end_time
            );

            // If no one took the key after this lesson, this crew is responsible
            if (!nextLesson) {
                const platoon = lesson.platoon_name || null;
                return { crewName: lesson.crew_name, platoon };
            }
        }

        return null;
    };

    const handleSubmit = async () => {
        if (!formData.room_number) {
            alert('אנא הזן מספר חדר');
            return;
        }

        if (editingKey) {
            console.log('Updating key:', editingKey.id, formData);
        } else {
            const key = {
                room_number: formData.room_number,
                room_type: formData.room_type,
                has_computers: formData.has_computers,
                building: formData.building,
                status: 'free',
                manual_misdar_assignment: "",
            };
            const { error } = await supabase.from("keysmanager_keys").insert(key);
            console.log('Creating key:', formData);
            if (error !== null) {
                console.error(error);

            }
        }

        setShowModal(false);
        setEditingKey(null);
        setFormData({ room_number: '', room_type: 'צוותי', has_computers: false, building: '' });
    };

    const handleEdit = (key) => {
        setEditingKey(key);
        setFormData({
            room_number: key.room_number,
            room_type: key.room_type,
            has_computers: key.has_computers || false,
            building: key.building || '',
        });
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingKey(null);
        setFormData({ room_number: '', room_type: 'צוותי', has_computers: false, building: '' });
    };

    const handleDelete = (id) => {
        console.log('Deleting key:', id);
    };

    const handleMisdarEdit = (key) => {
        setMisdarEditKey(key);
        setMisdarValue(key.manual_misdar_assignment || '');
    };

    const handleMisdarSave = () => {
        if (misdarEditKey) {
            console.log('Updating misdar assignment:', misdarEditKey.id, misdarValue);
            setMisdarEditKey(null);
            setMisdarValue('');
        }
    };

    const smallCount = keys.filter((k) => k.room_type === 'צוותי').length;
    const largeCount = keys.filter((k) => k.room_type === 'פלוגתי').length;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)',
            }}
            dir="rtl"
        >
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        ניהול מפתחות 🗝️
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        הוסף, ערוך או הסר מפתחות כיתות
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, border: '1px solid #e2e8f0' }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                סה״כ מפתחות
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {keys.length}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, bgcolor: '#eff6ff', borderColor: '#bfdbfe' }}>
                            <Typography variant="body2" sx={{ color: '#2563eb', mb: 0.5 }}>
                                חדרים צוותיים
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                                {smallCount}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, bgcolor: '#faf5ff', borderColor: '#e9d5ff' }}>
                            <Typography variant="body2" sx={{ color: '#9333ea', mb: 0.5 }}>
                                חדרים פלוגתיים
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#7e22ce' }}>
                                {largeCount}
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {isAdmin && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<PlusIcon />}
                            onClick={() => setShowModal(true)}
                            sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        >
                            הוסף מפתח חדש
                        </Button>
                    </Box>
                )}

                {/* Keys Table */}
                <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    מספר חדר
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    סוג
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    אזור
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    מחשבים
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    סטטוס / מחזיק
                                </TableCell>
                                {isAdmin && (
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                        מסדר כיתות 🧹
                                    </TableCell>
                                )}
                                {isAdmin && (
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                        פעולות
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 7 : 5} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : keys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 7 : 5} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        עדיין לא נוספו מפתחות
                                    </TableCell>
                                </TableRow>
                            ) : (
                                keys.map((key) => (
                                    <TableRow key={key.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                <KeyIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {key.room_number}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={key.room_type === 'פלוגתי' ? '🏢 פלוגתי' : '🏠 צוותי'}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor: key.room_type === 'פלוגתי' ? '#c084fc' : '#60a5fa',
                                                    color: key.room_type === 'פלוגתי' ? '#7e22ce' : '#1d4ed8',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {key.building ? (
                                                <Chip
                                                    label={`📍 ${key.building}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderColor: '#cbd5e1', color: '#475569' }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {key.has_computers ? (
                                                <MonitorIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                                            ) : (
                                                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {(() => {
                                                const holder = getCurrentHolder(key.room_number);
                                                return holder ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                        <Chip
                                                            label="תפוס"
                                                            size="small"
                                                            sx={{ bgcolor: '#fef3c7', color: '#92400e' }}
                                                        />
                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                            {holder}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Chip
                                                        label="זמין"
                                                        size="small"
                                                        sx={{ bgcolor: '#d1fae5', color: '#065f46' }}
                                                    />
                                                );
                                            })()}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    {(() => {
                                                        const responsible = getMisdarResponsible(key);
                                                        return responsible ? (
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                                <Chip
                                                                    label={`🧹 ${responsible.crewName}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        bgcolor: '#fff7ed',
                                                                        color: '#c2410c',
                                                                        borderColor: '#fed7aa',
                                                                    }}
                                                                />
                                                                {responsible.platoon && (
                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                                        {responsible.platoon}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                                —
                                                            </Typography>
                                                        );
                                                    })()}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleMisdarEdit(key)}
                                                        sx={{ color: '#94a3b8', '&:hover': { color: '#ea580c' } }}
                                                    >
                                                        <Edit2Icon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}
                                        {isAdmin && (
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(key)}
                                                        sx={{ color: '#64748b', '&:hover': { color: '#475569' } }}
                                                    >
                                                        <Edit2Icon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(key.id)}
                                                        sx={{ color: '#f87171', '&:hover': { color: '#dc2626', bgcolor: '#fef2f2' } }}
                                                    >
                                                        <Trash2Icon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>

            {/* Misdar Edit Modal */}
            <Dialog
                open={!!misdarEditKey}
                onClose={() => {
                    setMisdarEditKey(null);
                    setMisdarValue('');
                }}
                maxWidth="sm"
                fullWidth
                dir="rtl"
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: '#ffedd5',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                        }}
                    >
                        🧹
                    </Box>
                    ערוך מסדר כיתות
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        הגדר ידנית איזו פלוגה אחראית על מסדר חדר {misdarEditKey?.room_number}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>שם הפלוגה האחראית</InputLabel>
                            <Select
                                value={misdarValue}
                                onChange={(e) => setMisdarValue(e.target.value)}
                                label="שם הפלוגה האחראית"
                            >
                                <MenuItem value="">חישוב אוטומטי</MenuItem>
                                <MenuItem value="פלוגה א - סהר">פלוגה א - סהר</MenuItem>
                                <MenuItem value="פלוגה ב - יפתח">פלוגה ב - יפתח</MenuItem>
                                <MenuItem value="פלוגה ג - אייל">פלוגה ג - אייל</MenuItem>
                                <MenuItem value="פלוגה ד - אסף">פלוגה ד - אסף</MenuItem>
                                <MenuItem value="פלוגה ה - איתן">פלוגה ה - איתן</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                            בחר "חישוב אוטומטי" כדי להשתמש בחישוב לפי לוח השיעורים ביום רביעי
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={() => {
                            setMisdarEditKey(null);
                            setMisdarValue('');
                        }}
                        variant="outlined"
                        fullWidth
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={handleMisdarSave}
                        variant="contained"
                        fullWidth
                        sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}
                    >
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Key Modal */}
            <Dialog open={showModal} onClose={handleClose} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: '#d1fae5',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <KeyIcon sx={{ color: '#059669', fontSize: 20 }} />
                    </Box>
                    {editingKey ? 'ערוך מפתח' : 'הוסף מפתח חדש'}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        {editingKey ? 'עדכן את פרטי המפתח' : 'הוסף מפתח חדש למעקב'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        {/* Room Number */}
                        <TextField
                            fullWidth
                            label="מספר חדר *"
                            placeholder="למשל, 101..."
                            value={formData.room_number}
                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                        />

                        {/* Room Type */}
                        <FormControl fullWidth>
                            <InputLabel>סוג חדר</InputLabel>
                            <Select
                                value={formData.room_type}
                                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                label="סוג חדר"
                            >
                                <MenuItem value="צוותי">צוותי 🏠</MenuItem>
                                <MenuItem value="פלוגתי">פלוגתי 🏢</MenuItem>
                                <MenuItem value="פלוגתי">"דו-צוותי"</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Has Computers */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.has_computers}
                                    onChange={(e) => setFormData({ ...formData, has_computers: e.target.checked })}
                                />
                            }
                            label="יש מחשב בכיתה 💻"
                        />

                        {/* building */}
                        <FormControl fullWidth>
                            <InputLabel>אזור (אופציונלי)</InputLabel>
                            <Select
                                value={formData.building}
                                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                label="אזור (אופציונלי)"
                            >
                                <MenuItem value="">בחר אזור...</MenuItem>
                                {buildings.map((building) => (
                                    <MenuItem key={building.id} value={building.name}>
                                        {building.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" fullWidth>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        fullWidth
                        disabled={!formData.room_number}
                        sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                    >
                        {editingKey ? 'עדכן מפתח' : 'הוסף מפתח'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KeysManager;
