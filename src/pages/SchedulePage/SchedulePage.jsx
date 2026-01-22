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
        crew_name: '',
        start_time: '',
        end_time: '',
        room_type_needed: 'צוותי',
        needs_computers: false,
        notes: '',
    });

    // --- HELPER FUNCTIONS ---

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

    // --- EFFECT 1: FETCH AUTH USER -> DB PROFILE -> HIERARCHY ---
    useEffect(() => {
        const initUser = async () => {
            setIsUserLoading(true);
            try {
                // 1. Get the currently logged-in user from Supabase Auth
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error("Auth Error: No user logged in.", authError);
                    // Optional: Redirect to login page here
                    setIsUserLoading(false);
                    return;
                }

                console.log("1. Auth User Found:", user.email);

                // 2. Fetch their details from your public 'users' table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', user.email) // Use the email from step 1
                    .maybeSingle();

                if (userError) {
                    console.error("Database Error:", userError);
                    return;
                }

                if (!userData) {
                    console.error(`❌ User '${user.email}' exists in Auth but NOT in the 'users' table.`);
                    setIsUserLoading(false);
                    return;
                }

                // 3. User Details Found -> Save to state
                console.log("2. DB Profile Found:", userData);
                setUserProfile(userData);

                // 4. Traverse Hierarchy
                if (userData.group_id) {
                    const companyNode = await findUserCompany(userData.group_id);
                    setPlatoonNode(companyNode);

                    if (companyNode) {
                        const squads = await fetchCompanySquads(companyNode.id);
                        setCompanySquads(squads);

                        // Log for debugging
                        const squadIds = squads.map(s => s.id);
                        console.log("3. IDs of Groups in this Company:", squadIds);
                    }


                }
            } catch (error) {
                console.error("Initialization error:", error);
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
            lesson.team_id === companyId ||     // Check if it matches the Company ID directly
            squadIds.includes(lesson.team_id)   // Check if the team_id is inside the squadIds array
        )
    );

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
            pending: { color: 'warning', label: 'ממתין', icon: <ClockIcon sx={{ fontSize: 16 }} /> },
            assigned: { color: 'success', label: 'שובץ', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
            completed: { color: 'default', label: 'הושלם', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
            cancelled: { color: 'error', label: 'בוטל', icon: <XCircleIcon sx={{ fontSize: 16 }} /> },
        };
        const { color, label, icon } = config[status] || config.pending;
        return <Chip color={color} label={label} size="small" icon={icon} sx={{ fontWeight: 500 }} />;
    };

    // --- HANDLERS ---
    const handleSubmit = () => {
        console.log('Saving:', formData);
        setShowModal(false);
        // In real app: await supabase.from('schedule_lessons').insert(...)
    };

    const handleEdit = (lesson) => {
        setEditingLesson(lesson);
        setFormData({
            crew_name: lesson.crew_name || '',
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            room_type_needed: lesson.room_type_needed || 'צוותי',
            needs_computers: lesson.needs_computers || false,
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <TextField
                        type="date"
                        size="small"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    {canAddLessons && (
                        <Button
                            variant="contained"
                            startIcon={<PlusIcon />}
                            onClick={() => setShowModal(true)}
                            sx={{ bgcolor: '#4f46e5' }}
                        >
                            הוסף שיעור
                        </Button>
                    )}
                </Box>

                {/* Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell align="center">קבוצה</TableCell>
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
                                        <TableCell align="center">
                                            {/* Look up the name in our map. If not found, fall back to the ID */}
                                            {groupNames[lesson.team_id] || lesson.team_id}
                                        </TableCell>
                                        <TableCell align="center">{lesson.start_time} - {lesson.end_time}</TableCell>
                                        <TableCell align="center">{lesson.room_type_needed}</TableCell>
                                        <TableCell align="center">{lesson.need_computer ? '💻' : '-'}</TableCell>
                                        <TableCell align="center">{getStatusChip(lesson.status)}</TableCell>
                                        <TableCell align="center">{lesson.room_number || '-'}</TableCell>
                                        <TableCell align="center">-</TableCell>
                                        <TableCell align="center">-</TableCell>
                                        <TableCell align="center">{lesson.notes || '-'}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => handleEdit(lesson)}><Edit2Icon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* MODAL */}
                <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm" dir="rtl">
                    <DialogTitle>הוסף שיעור</DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>החדר עבור</InputLabel>
                                <Select
                                    value={formData.crew_name}
                                    onChange={(e) => setFormData({ ...formData, crew_name: e.target.value })}
                                    label="החדר עבור"
                                >
                                    {companySquads.map(squad => (
                                        <MenuItem key={squad.id} value={squad.name}>{squad.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TimePicker
                                            label="התחלה"
                                            ampm={false}
                                            value={formData.start_time ? dayjs(formData.start_time, 'HH:mm') : null}
                                            onChange={(val) => setFormData({ ...formData, start_time: val ? val.format('HH:mm') : '' })}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TimePicker
                                            label="סיום"
                                            ampm={false}
                                            value={formData.end_time ? dayjs(formData.end_time, 'HH:mm') : null}
                                            onChange={(val) => setFormData({ ...formData, end_time: val ? val.format('HH:mm') : '' })}
                                        />
                                    </Grid>
                                </Grid>
                            </LocalizationProvider>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowModal(false)}>ביטול</Button>
                        <Button variant="contained" onClick={handleSubmit}>שמור</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Schedule;