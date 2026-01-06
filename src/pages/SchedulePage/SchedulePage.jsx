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
    Alert,
    CircularProgress,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Aliases
const PlusIcon = AddIcon;
const ClockIcon = AccessTimeIcon;
const Trash2Icon = DeleteIcon;
const KeyIcon = VpnKeyIcon;
const XCircleIcon = CancelIcon;
const Edit2Icon = EditIcon;
const CalendarIcon = CalendarMonthIcon;

const Schedule = () => {
    // Mock user data
    const user = {
        email: 'user@example.com',
        platoon_name: 'פלוגה א',
        squad_name: 'צוות 1',
        positions: ['קה״ד פלוגתי'],
        role: 'user',
    };

    const [showModal, setShowModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [isLoading] = useState(false);

    const [formData, setFormData] = useState({
        crew_name: '',
        platoon_name: '',
        start_time: '',
        end_time: '',
        room_type_needed: 'צוותי',
        needs_computers: false,
        notes: '',
        room_count: 1,
        squad_count: '',
        selected_squads: [],
    });

    // Mock data
    const crews = [
        { id: '1', name: 'פלוגה א', order: 1 },
        { id: '2', name: 'פלוגה ב', order: 2 },
        { id: '3', name: 'פלוגה ג', order: 3 },
    ];

    const squads = [
        { id: '1', squad_number: 'צוות 1', platoon_name: 'פלוגה א', order: 1 },
        { id: '2', squad_number: 'צוות 2', platoon_name: 'פלוגה א', order: 2 },
        { id: '3', squad_number: 'צוות 3', platoon_name: 'פלוגה א', order: 3 },
        { id: '4', squad_number: 'צוות 1', platoon_name: 'פלוגה ב', order: 4 },
        { id: '5', squad_number: 'צוות 2', platoon_name: 'פלוגה ב', order: 5 },
    ];

    const lessons = [
        {
            id: '1',
            crew_name: 'צוות 1',
            platoon_name: 'פלוגה א',
            start_time: '08:00',
            end_time: '10:00',
            room_type_needed: 'צוותי',
            needs_computers: true,
            notes: 'שיעור תכנות',
            status: 'assigned',
            assigned_key: '101',
            date: selectedDate,
            crew_manager: user.email,
        },
        {
            id: '2',
            crew_name: 'צוות 2',
            platoon_name: 'פלוגה א',
            start_time: '10:30',
            end_time: '12:00',
            room_type_needed: 'פלוגתי',
            needs_computers: false,
            notes: '',
            status: 'pending',
            date: selectedDate,
            crew_manager: user.email,
        },
    ];

    const specialRequests = [
        {
            id: '1',
            crew_name: 'צוות 3',
            platoon_name: 'פלוגה א',
            start_time: '14:00',
            end_time: '16:00',
            preferred_type: 'any',
            notes: 'בקשה מיוחדת לחדר',
            date: selectedDate,
        },
    ];

    const myMisdarAssignments = [
        { roomNumber: '101', crewName: 'פלוגה א', endTime: '18:00', manual: false },
        { roomNumber: '205', crewName: 'פלוגה א', endTime: '19:00', manual: true },
    ];

    const isAdmin = user?.role === 'admin';
    const canAddLessons =
        isAdmin || (user?.positions && (user.positions.includes('קה״ד פלוגתי') || user.positions.includes('מפק״ץ הדרכה')));

    const filteredCrews = crews.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    const filteredSquads = squads
        .filter((squad) => !user?.platoon_name || squad.platoon_name === user.platoon_name)
        .sort((a, b) => {
            const numA = parseInt(a.squad_number.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.squad_number.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

    const handleSubmit = () => {
        if (!formData.crew_name || !formData.start_time || !formData.end_time) {
            alert('אנא מלא את כל השדות הנדרשים');
            return;
        }

        if (formData.start_time >= formData.end_time) {
            alert('שעת הסיום חייבת להיות מאוחרת יותר משעת ההתחלה');
            return;
        }

        console.log('Submitting lesson:', formData);
        setShowModal(false);
        resetForm();
    };

    const handleEdit = (lesson) => {
        setEditingLesson(lesson);
        setFormData({
            crew_name: lesson.crew_name,
            platoon_name: lesson.platoon_name || '',
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            room_type_needed: lesson.room_type_needed,
            needs_computers: lesson.needs_computers || false,
            notes: lesson.notes || '',
            room_count: 1,
            squad_count: '',
            selected_squads: [],
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        console.log('Deleting lesson:', id);
    };

    const resetForm = () => {
        setFormData({
            crew_name: '',
            platoon_name: '',
            start_time: '',
            end_time: '',
            room_type_needed: 'צוותי',
            needs_computers: false,
            notes: '',
            room_count: 1,
            squad_count: '',
            selected_squads: [],
        });
        setEditingLesson(null);
    };

    const getStatusChip = (status) => {
        const config = {
            pending: { color: 'warning', label: 'ממתין', icon: <ClockIcon sx={{ fontSize: 16 }} /> },
            assigned: { color: 'success', label: 'שובץ', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
            completed: { color: 'default', label: 'הושלם', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
            cancelled: { color: 'error', label: 'בוטל', icon: <XCircleIcon sx={{ fontSize: 16 }} /> },
        };
        const { color, label, icon } = config[status] || config.pending;
        return (
            <Chip color={color} label={label} size="small" icon={icon} sx={{ fontWeight: 500 }} />
        );
    };

    const handleCrewChange = (event) => {
        const selectedValue = event.target.value;
        const selectedSquad = squads.find((s) => s.squad_number === selectedValue);
        const selectedCrew = crews.find((c) => c.name === selectedValue);
        setFormData({
            ...formData,
            crew_name: selectedValue,
            platoon_name: selectedSquad ? selectedSquad.platoon_name : selectedCrew ? selectedCrew.name : '',
        });
    };

    if (!user) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            dir="rtl"
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)',
            }}
        >
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        לוח הזמנים של {user?.platoon_name || 'הפלוגה'} 📅
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        הגש את לוח הזמנים שלך להקצאת מפתחות
                    </Typography>
                </Box>

                {/* Misdar Alert */}
                {myMisdarAssignments && myMisdarAssignments.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 3, bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: '#ffedd5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                    }}
                                >
                                    🧹
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#92400e' }}>
                                        מסדר כיתות - יום רביעי 22:00
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#b45309' }}>
                                        הפלוגה שלך מנקה את החדרים הבאים: ({myMisdarAssignments.length} חדרים)
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#c2410c' }}>
                                        מתעדכן ביום רביעי בשעה 9:00 בבוקר
                                    </Typography>
                                </Box>
                            </Box>

                            <Grid container spacing={2}>
                                {myMisdarAssignments.map((assignment, idx) => (
                                    <Grid item xs={12} sm={6} md={4} key={idx}>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                bgcolor: '#ffedd5',
                                                border: '2px solid #fb923c',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <KeyIcon sx={{ fontSize: 20, color: '#c2410c' }} />
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#c2410c' }}>
                                                    חדר {assignment.roomNumber}
                                                </Typography>
                                                {assignment.manual && (
                                                    <Chip label="ידני" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                )}
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#ea580c' }}>
                                                {assignment.manual ? 'הקצאה ידנית' : `סיום בשעה ${assignment.endTime}`}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Alert>
                )}

                {/* Date Selector and Add Button */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            בחר תאריך:
                        </Typography>
                        <TextField
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            size="small"
                            sx={{ width: 'auto' }}
                        />
                    </Box>
                    {canAddLessons && (
                        <Button
                            variant="contained"
                            startIcon={<PlusIcon />}
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                        >
                            הוסף שיעור
                        </Button>
                    )}
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                סה״כ שיעורים
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {lessons.length}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                            <Typography variant="body2" sx={{ color: '#16a34a', mb: 0.5 }}>
                                שובצו
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803d' }}>
                                {lessons.filter((l) => l.status === 'assigned').length}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, bgcolor: '#fefce8', borderColor: '#fde047' }}>
                            <Typography variant="body2" sx={{ color: '#ca8a04', mb: 0.5 }}>
                                ממתינים
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#a16207' }}>
                                {lessons.filter((l) => l.status === 'pending').length}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, bgcolor: '#eff6ff', borderColor: '#93c5fd' }}>
                            <Typography variant="body2" sx={{ color: '#2563eb', mb: 0.5 }}>
                                בקשות מיוחדות
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                                {specialRequests.length}
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Lessons Table */}
                <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>צוות</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>שעה</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>סוג חדר</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>מחשבים</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>סטטוס</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>חדר משובץ</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>הערות</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : lessons.length === 0 && specialRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        אין שיעורים או בקשות מיוחדות לתאריך זה
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {/* Special Requests */}
                                    {specialRequests.map((request) => (
                                        <TableRow key={`request-${request.id}`} sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    <Chip label="בקשה מיוחדת" size="small" sx={{ bgcolor: '#2563eb', color: 'white' }} />
                                                    <Typography variant="body2">{request.crew_name}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <ClockIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                                                    <Typography variant="body2">
                                                        {request.start_time} - {request.end_time}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={
                                                        request.preferred_type === 'any'
                                                            ? '🔄 כל חדר'
                                                            : request.preferred_type === 'פלוגתי'
                                                                ? '🏢 פלוגתי'
                                                                : '🏠 צוותי'
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderColor: '#60a5fa', color: '#1d4ed8' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                    —
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip color="info" label="ממתין" size="small" icon={<ClockIcon sx={{ fontSize: 16 }} />} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                    —
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ color: '#475569' }}>
                                                    {request.notes || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    בקשה מיוחדת
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Regular Lessons */}
                                    {lessons.map((lesson) => (
                                        <TableRow key={lesson.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {lesson.crew_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <ClockIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    <Typography variant="body2">
                                                        {lesson.start_time} - {lesson.end_time}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={lesson.room_type_needed === 'פלוגתי' ? '🏢 פלוגתי' : '🏠 צוותי'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: lesson.room_type_needed === 'פלוגתי' ? '#c084fc' : '#60a5fa',
                                                        color: lesson.room_type_needed === 'פלוגתי' ? '#7e22ce' : '#1d4ed8',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2">{lesson.needs_computers ? '💻' : '—'}</Typography>
                                            </TableCell>
                                            <TableCell align="center">{getStatusChip(lesson.status)}</TableCell>
                                            <TableCell align="center">
                                                {lesson.assigned_key ? (
                                                    <Chip
                                                        icon={<KeyIcon sx={{ fontSize: 16 }} />}
                                                        label={`חדר ${lesson.assigned_key}`}
                                                        size="small"
                                                        sx={{ bgcolor: '#e0e7ff', color: '#4338ca' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ color: '#475569' }}>
                                                    {lesson.notes || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {canAddLessons ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEdit(lesson)}
                                                            sx={{ color: '#64748b', '&:hover': { color: '#475569' } }}
                                                        >
                                                            <Edit2Icon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(lesson.id)}
                                                            sx={{ color: '#f87171', '&:hover': { color: '#dc2626', bgcolor: '#fef2f2' } }}
                                                        >
                                                            <Trash2Icon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                        צפייה בלבד
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>

            {/* Add/Edit Lesson Modal */}
            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: '#e0e7ff',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CalendarIcon sx={{ color: '#4f46e5', fontSize: 20 }} />
                    </Box>
                    {editingLesson ? 'ערוך שיעור' : 'הוסף שיעור'}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        {/* Crew/Squad Selector */}
                        <FormControl fullWidth>
                            <InputLabel>החדר עבור *</InputLabel>
                            <Select value={formData.crew_name} onChange={handleCrewChange} label="החדר עבור *">
                                <MenuItem value="" disabled>
                                    בחר פלוגה או צוות...
                                </MenuItem>
                                <MenuItem disabled sx={{ fontWeight: 600, color: '#475569' }}>
                                    פלוגות
                                </MenuItem>
                                {filteredCrews.map((crew) => (
                                    <MenuItem key={crew.id} value={crew.name} sx={{ pl: 4 }}>
                                        {crew.name}
                                    </MenuItem>
                                ))}
                                <MenuItem disabled sx={{ fontWeight: 600, color: '#475569', mt: 1 }}>
                                    צוותים
                                </MenuItem>
                                {filteredSquads.map((squad) => (
                                    <MenuItem key={squad.id} value={squad.squad_number} sx={{ pl: 4 }}>
                                        {squad.squad_number} {squad.platoon_name ? `(${squad.platoon_name})` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Time Fields */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="שעת התחלה *"
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="שעת סיום *"
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        {/* Room Type */}
                        <FormControl fullWidth>
                            <InputLabel>סוג חדר נדרש *</InputLabel>
                            <Select
                                value={formData.room_type_needed}
                                onChange={(e) => setFormData({ ...formData, room_type_needed: e.target.value })}
                                label="סוג חדר נדרש *"
                            >
                                <MenuItem value="צוותי">צוותי 🏠</MenuItem>
                                <MenuItem value="פלוגתי">פלוגתי 🏢</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Computers Checkbox */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.needs_computers}
                                    onChange={(e) => setFormData({ ...formData, needs_computers: e.target.checked })}
                                />
                            }
                            label="💻 דורש כיתה עם מחשב"
                        />

                        {/* Notes */}
                        <TextField
                            fullWidth
                            label="הערות (אופציונלי)"
                            placeholder="דרישות מיוחדות..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setShowModal(false)} variant="outlined" fullWidth>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        fullWidth
                        disabled={!formData.crew_name || !formData.start_time || !formData.end_time}
                        sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                    >
                        {editingLesson ? 'עדכן שיעור' : 'הוסף שיעור'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Schedule;
