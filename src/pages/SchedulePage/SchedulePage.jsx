import React, { useState, useEffect } from 'react';
import {
    Box, Button, TextField, Card, Typography, Dialog, DialogTitle,
    DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
    Table, TableHead, TableRow, TableCell, TableBody, Checkbox, FormControlLabel,
    Chip, IconButton, Grid, Container, Paper, TableContainer, Alert, CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
// Icons
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { supabase } from "../../lib/supabaseClient";

// Aliases
const PlusIcon = AddIcon;
const ClockIcon = AccessTimeIcon;
const Trash2Icon = DeleteIcon;
const KeyIcon = VpnKeyIcon;
const XCircleIcon = CancelIcon;
const Edit2Icon = EditIcon;
const CalendarIcon = CalendarMonthIcon;

const Schedule = () => {
    // --- STATE ---
    const [userProfile, setUserProfile] = useState(null);
    const [platoonNode, setPlatoonNode] = useState(null); // The Company/Platoon
    const [companySquads, setCompanySquads] = useState([]); // List of squads

    const companyId = platoonNode?.id;
    const squadIds = React.useMemo(() => {
        return companySquads.map(squad => squad.id);
    }, [companySquads]);

    // --- NEW: Group Name Lookup ---
    const groupNames = React.useMemo(() => {
        const map = {};

        // 1. Add the Company Name
        if (platoonNode) {
            map[platoonNode.id] = platoonNode.name;
        }

        // 2. Add all Squad Names
        companySquads.forEach(squad => {
            map[squad.id] = squad.name;
        });

        return map;
    }, [platoonNode, companySquads]);

    const [lessons, setLessons] = useState([]);
    const [specialRequests, setSpecialRequests] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Loaders
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isLessonsLoading, setIsLessonsLoading] = useState(false);


    const [formData, setFormData] = useState({
        team_id: '',
        start_time: '',
        end_time: '',
        room_type_needed: 'צוותי',
        needs_computers: false,
        notes: '',
        room_count: 1,  // חדש - כמות כיתות

    });

    // --- HELPER FUNCTIONS ---
    const isCompanySelected = formData.team_id === platoonNode?.id;
    const maxRooms = companySquads.length;
    // 1. Traverse up to find Company (Type 3)
    const findUserCompany = async (startGroupId) => {
        let currentGroupId = startGroupId;

        // Safety: Limit depth to prevent infinite loops
        for (let i = 0; i < 10; i++) {
            if (!currentGroupId) return null;

            const { data: node, error } = await supabase
                .from('group_node')
                .select('*')
                .eq('id', currentGroupId)
                .single();

            if (error || !node) return null;

            // Found the Company/Platoon (Type 3)
            if (node.group_type_id === 3) {
                return node;
            }

            // Keep climbing up
            currentGroupId = node.parent_id;
        }
        return null;
    };

    // 2. Fetch all children of the Company
    const fetchCompanySquads = async (parentId) => {
        const { data, error } = await supabase
            .from('group_node')
            .select('*')
            .eq('parent_id', parentId);

        return error ? [] : data;
    };

    // --- EFFECT 1: FETCH USER ---
    useEffect(() => {
        const initUser = async () => {
            setIsUserLoading(true);
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error("Auth Error:", authError);
                    setIsUserLoading(false);
                    return;
                }

                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', user.email)
                    .maybeSingle(); // Prevents crash if 0 rows

                if (userError) console.error("DB Error:", userError);

                if (!userData) {
                    console.warn("⚠️ User not found in DB. Enabling 'Debug Mode' to show all lessons.");
                    // Fallback: Create a fake user profile so the app doesn't break
                    setUserProfile({ group_id: null, isDebug: true });
                } else {
                    setUserProfile(userData);
                    if (userData.group_id) {
                        const companyNode = await findUserCompany(userData.group_id);
                        setPlatoonNode(companyNode);
                        if (companyNode) {
                            const squads = await fetchCompanySquads(companyNode.id);
                            setCompanySquads(squads);
                        }
                    }
                }
            } catch (error) {
                console.error("Init Error:", error);
            } finally {
                setIsUserLoading(false);
            }
        };
        initUser();
    }, []);

    // --- EFFECT 2: FETCH LESSONS (Runs when Date changes) ---
    useEffect(() => {
        const fetchLessons = async () => {
            setIsLessonsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('schedule_lessons')
                    .select('*, created_at')
                    .eq('date', selectedDate);

                if (error) throw error;

                setLessons(data || []);
                setSpecialRequests(data || []); // Assuming specific logic separates them later if needed
            } catch (error) {
                console.error("Lessons fetch error:", error);
            } finally {
                setIsLessonsLoading(false);
            }
        };

        fetchLessons();
    }, [selectedDate]);


    // --- RENDERING HELPERS ---

    // Filter Logic: Matches User's Group ID + Selected Date
    console.log("3. IDs of Groups in this Company (during filtering):", squadIds);
    const visibleLessons = lessons.filter(lesson =>
        userProfile && (
            // lesson.team_id === companyId ||     // Check if it matches the Company ID directly
            // squadIds.includes(lesson.team_id)   // Check if the team_id is inside the squadIds array
            true
        )
    );
    const stats = React.useMemo(() => {
        const total = visibleLessons.length;
        const assigned = visibleLessons.filter(l => l.status === 2).length;  // 2 = assigned
        const pending = visibleLessons.filter(l => l.status === 1 || l.status === null || l.status === undefined).length;  // 1 = pending
        return { total, assigned, pending };
    }, [visibleLessons]);

    // Misc Logic
    const now = new Date();
    const showMisdarAlert = now.getDay() === 3 && now.getHours() >= 9;
    const canAddLessons = true;
    const myMisdarAssignments = [
        { roomNumber: '101', crewName: platoonNode?.name || '...', endTime: '18:00', manual: false },
        { roomNumber: '205', crewName: platoonNode?.name || '...', endTime: '19:00', manual: true },
    ];

    const getStatusChip = (status) => {
        const config = {
            1: {
                bgcolor: '#fef9c3',
                color: '#854d0e',
                label: 'ממתין',
                icon: <ClockIcon sx={{ fontSize: 16 }} />
            },
            2: {
                bgcolor: '#d1fae5',
                color: '#065f46',
                label: 'שובץ',
                icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
            },
        };

        const statusKey = status ?? 1; // אם null או undefined, תחזיר 1 (ממתין)
        const { bgcolor, color, label, icon } = config[statusKey] || config[1];

        return (
            <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: bgcolor,
                color: color,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                fontSize: '0.875rem',
                fontWeight: 500,
            }}>
                {label}
                {icon}
            </Box>
        );
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.team_id) {
            alert('יש לבחור צוות או פלוגה');
            return;
        }
        if (!formData.start_time || !formData.end_time) {
            alert('יש למלא שעת התחלה ושעת סיום');
            return;
        }
        if (formData.end_time <= formData.start_time) {
            alert('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
            return;
        }
        if (!editingLesson) {
            const now = new Date();
            const lessonDateTime = new Date(`${selectedDate}T${formData.start_time}`);
            if (lessonDateTime < now) {
                alert('לא ניתן לתזמן שיעור לשעה שכבר עברה');
                return;
            }
        }

        try {
            const isCompany = formData.team_id === platoonNode?.id;

            if (isCompany && formData.room_count > 1) {
                // Insert multiple lessons - one for each squad
                const squadsToInsert = companySquads.slice(0, formData.room_count);

                const lessonsToInsert = squadsToInsert.map(squad => ({
                    team_id: squad.id,
                    date: selectedDate,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    needed_room_type_id: formData.room_type_needed === 'צוותי' ? 1 : 2,
                    need_computer: formData.needs_computers,
                    notes: formData.notes || null,
                }));

                const { error } = await supabase
                    .from('schedule_lessons')
                    .insert(lessonsToInsert);

                if (error) throw error;
            } else {
                // Single lesson
                const lessonData = {
                    team_id: formData.team_id,
                    date: selectedDate,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    needed_room_type_id: formData.room_type_needed === 'צוותי' ? 1 : 2,
                    need_computer: formData.needs_computers,
                    notes: formData.notes || null,
                };

                if (editingLesson) {
                    const { error } = await supabase
                        .from('schedule_lessons')
                        .update(lessonData)
                        .eq('id', editingLesson.id);

                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('schedule_lessons')
                        .insert(lessonData);

                    if (error) throw error;
                }
            }

            // Reset & close
            setShowModal(false);
            setEditingLesson(null);
            setFormData({
                team_id: '',
                start_time: '',
                end_time: '',
                room_type_needed: 'צוותי',
                needs_computers: false,
                notes: '',
                room_count: 1,
            });

            // Refresh
            const { data } = await supabase
                .from('schedule_lessons')
                .select('*')
                .eq('date', selectedDate);

            setLessons(data || []);

        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('שגיאה בשמירת השיעור');
        }
    };
    const handleDelete = async (lessonId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את השיעור?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('schedule_lessons')
                .delete()
                .eq('id', lessonId);

            if (error) throw error;

            // Refresh
            const { data } = await supabase
                .from('schedule_lessons')
                .select('*')
                .eq('date', selectedDate);

            setLessons(data || []);
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('שגיאה במחיקת השיעור');
        }
    };

    const handleEdit = (lesson) => {
        setEditingLesson(lesson);
        setFormData({
            team_id: lesson.team_id || '',
            start_time: lesson.start_time?.slice(0, 5) || '',
            end_time: lesson.end_time?.slice(0, 5) || '',
            room_type_needed: lesson.needed_room_type_id === 1 ? 'צוותי' : 'פלוגתי',
            needs_computers: lesson.need_computer || false,
            notes: lesson.notes || '',
        });
        setShowModal(true);
    };

    // --- RENDER ---
    if (isUserLoading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box dir="rtl" sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        לוח הזמנים של {platoonNode?.name || '...'} 📅
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        הגש את לוח הזמנים שלך להקצאת מפתחות
                    </Typography>
                </Box>

                {/* Misdar Alert */}
                {showMisdarAlert && myMisdarAssignments.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 3, bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
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
                        </Box>
                    </Alert>
                )}

                {/* Date & Add Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    {/* Date Picker - Right Side */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>בחר תאריך:</Typography>
                        <TextField
                            type="date"
                            size="small"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            sx={{
                                bgcolor: 'white',
                                '& .MuiOutlinedInput-root': { borderRadius: 2 }
                            }}
                        />
                    </Box>

                    {/* Add Button - Left Side */}
                    <Box>
                        {canAddLessons && (
                            <Button
                                variant="contained"
                                startIcon={<PlusIcon />}
                                onClick={() => setShowModal(true)}
                                sx={{ bgcolor: '#4f46e5', borderRadius: 2 }}
                            >
                                הוסף שיעור
                            </Button>
                        )}
                    </Box>
                </Box>


                {/* Statistics Cards */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {/* Total Lessons */}
                    <Paper sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
                            סה"כ שיעורים
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#4f46e5' }}>
                            {stats.total}
                        </Typography>
                    </Paper>

                    {/* Assigned */}
                    <Paper sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#d1fae5',
                        border: '1px solid #a7f3d0',
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: '#065f46', mb: 0.5 }}>
                            שובצו
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#065f46' }}>
                            {stats.assigned}
                        </Typography>
                    </Paper>

                    {/* Pending */}
                    <Paper sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#fef9c3',
                        border: '1px solid #fde047',
                        textAlign: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: '#854d0e', mb: 0.5 }}>
                            ממתינים
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#854d0e' }}>
                            {stats.pending}
                        </Typography>
                    </Paper>
                </Box>



                {/* Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center">צוות</TableCell>
                                <TableCell align="center">שעה</TableCell>
                                <TableCell align="center">סוג חדר</TableCell>
                                <TableCell align="center">מחשבים</TableCell>
                                <TableCell align="center">סטטוס</TableCell>
                                <TableCell align="center">חדר משובץ</TableCell>
                                <TableCell align="center">קבלת מפתח</TableCell>
                                <TableCell align="center">מסירת מפתח</TableCell>
                                <TableCell align="center">הערות</TableCell>
                                <TableCell align="center">פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLessonsLoading ? (
                                <TableRow><TableCell colSpan={10} align="center"><CircularProgress size={20} /></TableCell></TableRow>
                            ) : visibleLessons.length === 0 ? (
                                <TableRow><TableCell colSpan={10} align="center">אין שיעורים</TableCell></TableRow>
                            ) : (
                                visibleLessons.map(lesson => (
                                    <TableRow key={lesson.id} hover>
                                        <TableCell align="center">{groupNames[lesson.team_id] || lesson.team_id}</TableCell>
                                        <TableCell align="center">
                                             {lesson.end_time?.slice(0, 5)} - {lesson.start_time?.slice(0, 5)} 
                                        </TableCell>
                                        <TableCell align="center">
                                            {lesson.needed_room_type_id === 1 ? '🏠 צוותי' : '🏢 פלוגתי'}
                                        </TableCell>                                        <TableCell align="center">{lesson.need_computer ? '💻' : '-'}</TableCell>
                                        <TableCell align="center">{getStatusChip(lesson.status)}</TableCell>
                                        <TableCell align="center">
                                            {lesson.room_number ? (
                                                <Box sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    bgcolor: '#e0e7ff',
                                                    color: '#3730a3',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                }}>
                                                    חדר {lesson.room_number}
                                                    <KeyIcon sx={{ fontSize: 16 }} />
                                                </Box>
                                            ) : '-'}
                                        </TableCell>                                        <TableCell align="center">-</TableCell>
                                        <TableCell align="center">-</TableCell>
                                        <TableCell align="center">{lesson.notes || '-'}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => handleEdit(lesson)}>
                                                <Edit2Icon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(lesson.id)}>
                                                <Trash2Icon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* MODAL */}
                <Dialog
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    fullWidth
                    maxWidth="xs"  // שינוי מ-sm ל-xs כדי שיהיה יותר קטן
                    dir="rtl"
                    sx={{ '& .MuiDialog-paper': { direction: 'rtl', borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ width: 24 }} />
                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                {/* אייקון וכותרת באותה שורה */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>הוסף שיעור</Typography>
                                    <CalendarIcon sx={{ color: '#4f46e5', fontSize: 28 }} />

                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    הוסף שיעור חדש ללוח הזמנים שלך ל-{new Date(selectedDate).toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setShowModal(false)} size="small">
                                <CancelIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>


                            {/* Team Selection */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                    החדר עבור *
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.team_id}
                                        onChange={(e) => setFormData({ ...formData, team_id: e.target.value, room_count: 1 })}
                                        displayEmpty
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            borderRadius: 2,
                                            '& .MuiSelect-select': { textAlign: 'right' }
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: { direction: 'rtl' }
                                            }
                                        }}
                                    >
                                        <MenuItem value="" disabled>בחר פלוגה או צוות...</MenuItem>
                                        {platoonNode && (
                                            <MenuItem value={platoonNode.id}>
                                                {platoonNode.name} (פלוגה) 🏢
                                            </MenuItem>
                                        )}
                                        {companySquads.map(squad => (
                                            <MenuItem key={squad.id} value={squad.id}>
                                                {squad.name} 👥
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Room Count - only show if company is selected */}
                            {isCompanySelected && (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                        כמות כיתות
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => setFormData({ ...formData, room_count: Math.min(formData.room_count + 1, maxRooms) })}
                                            sx={{ border: '1px solid #ddd', borderRadius: 2 }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                        <TextField
                                            value={formData.room_count}
                                            size="small"
                                            inputProps={{
                                                style: { textAlign: 'center' },
                                                readOnly: true
                                            }}
                                            sx={{
                                                flex: 1,
                                                bgcolor: '#f5f5f5',
                                                '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => setFormData({ ...formData, room_count: Math.max(formData.room_count - 1, 1) })}
                                            sx={{ border: '1px solid #ddd', borderRadius: 2 }}
                                        >
                                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>−</Typography>
                                        </IconButton>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        מקסימום: {maxRooms} צוותים בפלוגה
                                    </Typography>
                                </Box>
                            )}

                            {/* Time Pickers */}
                            {/* Time Pickers */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                            שעת התחלה *
                                        </Typography>
                                        <TimePicker
                                            ampm={false}
                                            value={formData.start_time ? dayjs(formData.start_time, 'HH:mm') : null}
                                            onChange={(val) => setFormData({ ...formData, start_time: val ? val.format('HH:mm') : '' })}
                                            sx={{ width: '100%' }}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                    sx: {
                                                        width: '100%',
                                                        bgcolor: '#f5f5f5',
                                                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                            שעת סיום *
                                        </Typography>
                                        <TimePicker
                                            ampm={false}
                                            value={formData.end_time ? dayjs(formData.end_time, 'HH:mm') : null}
                                            onChange={(val) => setFormData({ ...formData, end_time: val ? val.format('HH:mm') : '' })}
                                            sx={{ width: '100%' }}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                    sx: {
                                                        width: '100%',
                                                        bgcolor: '#f5f5f5',
                                                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </LocalizationProvider>

                            {/* Room Type Selection */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                    סוג חדר נדרש *
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={formData.room_type_needed}
                                        onChange={(e) => setFormData({ ...formData, room_type_needed: e.target.value })}
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            borderRadius: 2,
                                            '& .MuiSelect-select': { textAlign: 'right' }
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: { direction: 'rtl' }
                                            }
                                        }}
                                    >
                                        <MenuItem value="צוותי">צוותי 🏠</MenuItem>
                                        <MenuItem value="פלוגתי">פלוגתי 🏢</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Needs Computer Checkbox */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.needs_computers}
                                        onChange={(e) => setFormData({ ...formData, needs_computers: e.target.checked })}
                                        size="small"
                                    />
                                }
                                label="דורש כיתה עם מחשב 🖥️"
                                sx={{
                                    margin: 0,
                                    // flexDirection: 'row-reverse',
                                    justifyContent: 'flex-start',
                                    '& .MuiFormControlLabel-label': { mr: 0, ml: 1, fontSize: '0.875rem' }
                                }}
                            />

                            {/* Notes */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                    הערות (אופציונלי)
                                </Typography>
                                <TextField
                                    placeholder="דרישות מיוחדות..."
                                    multiline
                                    rows={2}
                                    size="small"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    fullWidth
                                    sx={{
                                        bgcolor: '#f5f5f5',
                                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                    }}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            fullWidth
                            sx={{ bgcolor: '#4f46e5', borderRadius: 2, py: 1 }}
                        >
                            {editingLesson ? 'עדכן שיעור' : 'הוסף שיעור'}
                        </Button>
                        <Button
                            onClick={() => setShowModal(false)}
                            variant="outlined"
                            fullWidth
                            sx={{ borderRadius: 2, py: 1 }}
                        >
                            ביטול
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Schedule;