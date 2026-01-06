import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    Chip,
    IconButton,
    Grid,
    Container,
    Paper,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as PlusIcon,
    VpnKey as KeyIcon,
    AccessTime as ClockIcon,
    FilterList as FilterIcon,
    CalendarMonth as CalendarIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

const DashboardPage = () => {
    // Mock user data
    const user = {
        email: 'user@example.com',
        role: 'user',
        platoon_name: 'פלוגה א',
        squad_name: 'צוות 1',
    };

    const [checkoutKey, setCheckoutKey] = useState(null);
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState({ start: '', end: '' });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({
        holderName: '',
        startTime: '',
        endTime: '',
        platoonName: '',
    });
    const [queueForm, setQueueForm] = useState({
        crew_name: '',
        platoon_name: '',
        start_time: '',
        end_time: '',
        preferred_type: 'any',
        notes: '',
    });

    const isAdmin = user?.role === 'admin';

    // Mock data
    const keys = [
        {
            id: '1',
            room_number: '101',
            room_type: 'צוותי',
            has_computers: true,
            status: 'available',
            current_holder: null,
            checkout_time: null,
            checkout_start_time: null,
            checkout_end_time: null,
            checked_out_by: null,
        },
        {
            id: '2',
            room_number: '102',
            room_type: 'צוותי',
            has_computers: false,
            status: 'taken',
            current_holder: 'צוות 2',
            checkout_time: new Date().toISOString(),
            checkout_start_time: '09:00',
            checkout_end_time: '11:00',
            checked_out_by: user.email,
        },
        {
            id: '3',
            room_number: '201',
            room_type: 'פלוגתי',
            has_computers: true,
            status: 'available',
            current_holder: null,
            checkout_time: null,
            checkout_start_time: null,
            checkout_end_time: null,
            checked_out_by: null,
        },
        {
            id: '4',
            room_number: '202',
            room_type: 'פלוגתי',
            has_computers: false,
            status: 'available',
            current_holder: null,
            checkout_time: null,
            checkout_start_time: null,
            checkout_end_time: null,
            checked_out_by: null,
        },
    ];

    const crews = [
        { id: '1', name: 'פלוגה א' },
        { id: '2', name: 'פלוגה ב' },
        { id: '3', name: 'פלוגה ג' },
    ];

    const squads = [
        { id: '1', squad_number: 'צוות 1', platoon_name: 'פלוגה א' },
        { id: '2', squad_number: 'צוות 2', platoon_name: 'פלוגה א' },
        { id: '3', squad_number: 'צוות 3', platoon_name: 'פלוגה א' },
    ];

    const queue = [
        {
            id: '1',
            crew_name: 'צוות 3',
            platoon_name: 'פלוגה א',
            start_time: '14:00',
            end_time: '16:00',
            preferred_type: 'any',
            notes: 'בקשה מיוחדת',
            priority: 1,
        },
        {
            id: '2',
            crew_name: 'צוות 4',
            platoon_name: 'פלוגה ב',
            start_time: '15:00',
            end_time: '17:00',
            preferred_type: 'צוותי',
            notes: '',
            priority: 2,
        },
    ];

    const handleCheckout = () => {
        console.log('Checking out key:', checkoutKey, checkoutForm);
        alert('מפתח נלקח בהצלחה!');
        setCheckoutKey(null);
        setCheckoutForm({ holderName: '', startTime: '', endTime: '', platoonName: '' });
    };

    const handleReturn = (key) => {
        const isKeyOwner = key.checked_out_by === user?.email;

        if (!isAdmin && !isKeyOwner) {
            alert('רק המשתמש שלקח את המפתח או המנהל יכולים להחזיר אותו');
            return;
        }

        console.log('Returning key:', key.id);
        alert('מפתח הוחזר בהצלחה!');
    };

    const handleAddToQueue = () => {
        console.log('Adding to queue:', queueForm);
        alert('נוסף לתור המתנה בהצלחה!');
        setShowQueueModal(false);
        setQueueForm({
            crew_name: '',
            platoon_name: '',
            start_time: '',
            end_time: '',
            preferred_type: 'any',
            notes: '',
        });
    };

    const handleRemoveFromQueue = (itemId) => {
        console.log('Removing from queue:', itemId);
        alert('הוסר מהתור');
    };

    const filteredKeys = keys.filter((k) => filter === 'all' || k.room_type === filter);

    const availableCount = keys.filter((k) => k.status === 'available').length;
    const takenCount = keys.filter((k) => k.status === 'taken').length;

    if (isLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)',
            }}
            dir="rtl"
        >
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        ניהול מפתחות 🔑
                    </Typography>
                </Box>

                {/* Stats */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                סה״כ מפתחות
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {keys.length}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, bgcolor: '#d1fae5', borderColor: '#bbf7d0' }}>
                            <Typography variant="body2" sx={{ color: '#16a34a', mb: 0.5 }}>
                                זמינים
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803d' }}>
                                {availableCount}
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ p: 2, bgcolor: '#fef3c7', borderColor: '#fde047' }}>
                            <Typography variant="body2" sx={{ color: '#ca8a04', mb: 0.5 }}>
                                תפוסים
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#a16207' }}>
                                {takenCount}
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <KeyIcon />
                                        <span>מפתחות</span>
                                    </Box>
                                }
                            />
                            <Tab
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ClockIcon />
                                        <span>תור ({queue.length})</span>
                                    </Box>
                                }
                            />
                        </Tabs>
                        <Button
                            variant="outlined"
                            startIcon={<PlusIcon />}
                            onClick={() => setShowQueueModal(true)}
                            sx={{ borderColor: '#bfdbfe', color: '#2563eb' }}
                        >
                            הוסף בקשה מיוחדת
                        </Button>
                    </Box>
                </Box>

                {/* Keys Tab */}
                {activeTab === 0 && (
                    <Box>
                        {/* Filters */}
                        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Room Type Filter */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FilterIcon sx={{ color: '#94a3b8' }} />
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    סוג חדר:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {['all', 'צוותי', 'פלוגתי'].map((f) => (
                                        <Button
                                            key={f}
                                            variant={filter === f ? 'contained' : 'outlined'}
                                            size="small"
                                            onClick={() => setFilter(f)}
                                            sx={{
                                                ...(filter === f && { bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }),
                                            }}
                                        >
                                            {f === 'all' ? 'הכל' : f === 'צוותי' ? '🏠 צוותי' : '🏢 פלוגתי'}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>

                            {/* Date and Time Filter */}
                            <Paper sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarIcon sx={{ color: '#475569' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        תאריך:
                                    </Typography>
                                    <TextField
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        size="small"
                                        sx={{ width: 'auto' }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <ClockIcon sx={{ color: '#475569' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        סנן לפי זמינות:
                                    </Typography>
                                    <TextField
                                        type="time"
                                        value={timeFilter.start}
                                        onChange={(e) => setTimeFilter({ ...timeFilter, start: e.target.value })}
                                        size="small"
                                        sx={{ width: 120 }}
                                    />
                                    <Typography variant="body2">עד</Typography>
                                    <TextField
                                        type="time"
                                        value={timeFilter.end}
                                        onChange={(e) => setTimeFilter({ ...timeFilter, end: e.target.value })}
                                        size="small"
                                        sx={{ width: 120 }}
                                    />
                                    {(timeFilter.start || timeFilter.end) && (
                                        <Button size="small" onClick={() => setTimeFilter({ start: '', end: '' })}>
                                            נקה
                                        </Button>
                                    )}
                                </Box>
                            </Paper>
                        </Box>

                        {/* Keys Grid */}
                        <Grid container spacing={2}>
                            {filteredKeys.map((key) => (
                                <Grid item xs={12} sm={6} md={4} key={key.id}>
                                    <Card
                                        sx={{
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.3s',
                                            '&:hover': { boxShadow: 3 },
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <KeyIcon sx={{ color: '#475569' }} />
                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                        חדר {key.room_number}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={key.status === 'available' ? 'זמין' : 'תפוס'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: key.status === 'available' ? '#d1fae5' : '#fef3c7',
                                                        color: key.status === 'available' ? '#065f46' : '#92400e',
                                                    }}
                                                />
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                <Chip
                                                    label={`${key.room_type === 'פלוגתי' ? '🏢' : '🏠'} ${key.room_type}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                {key.has_computers && <Chip label="💻" size="small" variant="outlined" />}
                                            </Box>

                                            {key.status === 'taken' && (
                                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fef3c7', borderRadius: 1 }}>
                                                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                                                        מוחזק על ידי: {key.current_holder}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#a16207' }}>
                                                        {key.checkout_start_time} - {key.checkout_end_time}
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {key.status === 'available' ? (
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        onClick={() => setCheckoutKey(key)}
                                                        sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                                                    >
                                                        קח מפתח
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        onClick={() => handleReturn(key)}
                                                        sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                                                    >
                                                        החזר מפתח
                                                    </Button>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Queue Tab */}
                {activeTab === 1 && (
                    <Box>
                        {queue.length === 0 ? (
                            <Paper sx={{ p: 8, textAlign: 'center' }}>
                                <ClockIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: '#475569', mb: 1 }}>
                                    אין בקשות מיוחדות
                                </Typography>
                                <Button startIcon={<PlusIcon />} onClick={() => setShowQueueModal(true)}>
                                    הוסף לתור
                                </Button>
                            </Paper>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {queue.map((item, index) => (
                                    <Card key={item.id} sx={{ border: '1px solid #e2e8f0' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Chip label={`#${index + 1}`} size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af' }} />
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                            {item.crew_name}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                            ({item.platoon_name})
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <ClockIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                            {item.start_time} - {item.end_time}
                                                        </Typography>
                                                        <Chip
                                                            label={
                                                                item.preferred_type === 'any'
                                                                    ? '🔄 כל חדר'
                                                                    : item.preferred_type === 'פלוגתי'
                                                                        ? '🏢 פלוגתי'
                                                                        : '🏠 צוותי'
                                                            }
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                    {item.notes && (
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                                                            {item.notes}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <IconButton onClick={() => handleRemoveFromQueue(item.id)} sx={{ color: '#ef4444' }}>
                                                    <CloseIcon />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </Container>

            {/* Checkout Modal */}
            <Dialog open={!!checkoutKey} onClose={() => setCheckoutKey(null)} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle>קח מפתח - חדר {checkoutKey?.room_number}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>צוות/פלוגה</InputLabel>
                            <Select
                                value={checkoutForm.holderName}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, holderName: e.target.value })}
                                label="צוות/פלוגה"
                            >
                                <MenuItem value="" disabled>
                                    בחר...
                                </MenuItem>
                                {crews.map((crew) => (
                                    <MenuItem key={crew.id} value={crew.name}>
                                        {crew.name}
                                    </MenuItem>
                                ))}
                                {squads.map((squad) => (
                                    <MenuItem key={squad.id} value={squad.squad_number}>
                                        {squad.squad_number}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="שעת התחלה"
                            type="time"
                            value={checkoutForm.startTime}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, startTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="שעת סיום"
                            type="time"
                            value={checkoutForm.endTime}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, endTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setCheckoutKey(null)} variant="outlined" fullWidth>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleCheckout}
                        variant="contained"
                        fullWidth
                        disabled={!checkoutForm.holderName || !checkoutForm.startTime || !checkoutForm.endTime}
                    >
                        אישור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add to Queue Modal */}
            <Dialog open={showQueueModal} onClose={() => setShowQueueModal(false)} maxWidth="sm" fullWidth dir="rtl">
                <DialogTitle>הוסף בקשה מיוחדת</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>צוות/פלוגה</InputLabel>
                            <Select
                                value={queueForm.crew_name}
                                onChange={(e) => setQueueForm({ ...queueForm, crew_name: e.target.value })}
                                label="צוות/פלוגה"
                            >
                                <MenuItem value="" disabled>
                                    בחר...
                                </MenuItem>
                                {crews.map((crew) => (
                                    <MenuItem key={crew.id} value={crew.name}>
                                        {crew.name}
                                    </MenuItem>
                                ))}
                                {squads.map((squad) => (
                                    <MenuItem key={squad.id} value={squad.squad_number}>
                                        {squad.squad_number}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="שעת התחלה"
                            type="time"
                            value={queueForm.start_time}
                            onChange={(e) => setQueueForm({ ...queueForm, start_time: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="שעת סיום"
                            type="time"
                            value={queueForm.end_time}
                            onChange={(e) => setQueueForm({ ...queueForm, end_time: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <FormControl fullWidth>
                            <InputLabel>סוג חדר מועדף</InputLabel>
                            <Select
                                value={queueForm.preferred_type}
                                onChange={(e) => setQueueForm({ ...queueForm, preferred_type: e.target.value })}
                                label="סוג חדר מועדף"
                            >
                                <MenuItem value="any">כל חדר</MenuItem>
                                <MenuItem value="צוותי">צוותי</MenuItem>
                                <MenuItem value="פלוגתי">פלוגתי</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="הערות"
                            multiline
                            rows={2}
                            value={queueForm.notes}
                            onChange={(e) => setQueueForm({ ...queueForm, notes: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setShowQueueModal(false)} variant="outlined" fullWidth>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleAddToQueue}
                        variant="contained"
                        fullWidth
                        disabled={!queueForm.crew_name || !queueForm.start_time || !queueForm.end_time}
                    >
                        הוסף לתור
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DashboardPage;
