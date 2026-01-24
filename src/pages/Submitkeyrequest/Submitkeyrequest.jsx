import {
    Box,
    Button,
    Card,
    Container,
    Grid,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Fade,
    Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Key,
    Send,
    Calendar,
    ArrowLeft,
    ArrowRight,
    Calculator
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { supabase } from 'lib/supabaseClient';

export default function SubmitKeyRequest() {
    const { user, isDark } = useOutletContext();

    const [loading, setLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        single_team_amount: 0,
        two_team_amount: 0,
        company_amount: 0,
        range_start: '',
        range_end: ''
    });

    const [wednesdayOffset, setWednesdayOffset] = useState(0);

    useEffect(() => {
        setDefaultDate();
    }, [wednesdayOffset]);

    const getNextWednesday = (weeksFromNow) => {
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (14 + (weeksFromNow * 7)));

        const dayOfWeek = targetDate.getDay();
        let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
        if (daysUntilWednesday === 0 && targetDate.getDay() !== 3) {
            daysUntilWednesday = 7;
        }

        const nextWednesday = new Date(targetDate);
        nextWednesday.setDate(targetDate.getDate() + daysUntilWednesday);

        return nextWednesday;
    };

    const setDefaultDate = () => {
        const targetWednesday = getNextWednesday(wednesdayOffset);
        const targetDateStr = targetWednesday.toISOString().split('T')[0];

        setFormData(prev => ({
            ...prev,
            range_start: targetDateStr,
            range_end: targetDateStr
        }));
    };

    const handleNextWednesday = () => {
        setWednesdayOffset(prev => prev + 1);
    };

    const handlePreviousWednesday = () => {
        if (wednesdayOffset > 0) {
            setWednesdayOffset(prev => prev - 1);
        }
    };

    const handleInputChange = (field, value) => {
        const numVal = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            [field]: numVal >= 0 ? numVal : 0
        }));

        if (error) {
            setError(null);
        }
    };

    const fetchAncestorGroup = async (startGroupId, targetTypeName) => {
        try {
            const { data, error } = await supabase
                .rpc('get_parent_group_by_type', {
                    start_group_id: startGroupId,
                    target_type_name: targetTypeName
                });

            if (error) {
                console.error("RPC Error:", error.message);
                return null;
            }

            return data && data.length > 0 ? data[0] : null;
        } catch (err) {
            console.error("Unexpected Error:", err);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSubmitSuccess(false);

        try {
            const totalRooms = parseInt(formData.single_team_amount) +
                parseInt(formData.two_team_amount) +
                parseInt(formData.company_amount);

            if (totalRooms === 0) {
                setError('יש לבקש לפחות כיתה אחת');
                setLoading(false);
                return;
            }

            const battalionGroup = await fetchAncestorGroup(user.group_id, 'Battalion');
            const requesteeId = battalionGroup ? battalionGroup.id : user.group_id;

            const { error: insertError } = await supabase
                .from('keys_request')
                .insert({
                    requester: user.group_id,
                    requestee: requesteeId,
                    single_team_amount: parseInt(formData.single_team_amount) || 0,
                    two_team_amount: parseInt(formData.two_team_amount) || 0,
                    company_amount: parseInt(formData.company_amount) || 0,
                    range_start: formData.range_start,
                    range_end: formData.range_end,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            setSubmitSuccess(true);
            setFormData({
                single_team_amount: 0,
                two_team_amount: 0,
                company_amount: 0,
                range_start: '',
                range_end: ''
            });
            setWednesdayOffset(0);
            setDefaultDate();

        } catch (err) {
            console.error('Error submitting request:', err);
            setError('שגיאה בהגשת הבקשה: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const totalRooms = (parseInt(formData.single_team_amount) || 0) +
        (parseInt(formData.two_team_amount) || 0) +
        (parseInt(formData.company_amount) || 0);

    if (!user) return null;

    const InputLabel = ({ children }) => (
        <Typography
            sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155',
                fontSize: '0.95rem',
                fontWeight: 600,
                mb: 1,
                textAlign: 'center'
            }}
        >
            {children}
        </Typography>
    );

    const textFieldStyle = {
        '& .MuiOutlinedInput-root': {
            color: isDark ? 'white' : '#1e293b',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            transition: 'all 0.2s',
            '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0',
                borderWidth: '1px',
            },
            '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
            },
            '&.Mui-focused': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                '& fieldset': {
                    borderColor: '#10b981',
                    borderWidth: '2px',
                }
            },
            '& input': {
                textAlign: 'center',
                fontSize: '1.2rem',
                fontWeight: 600,
                padding: '12px'
            }
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Title Centered */}
                    <Box sx={{ display: 'flex', alignItems: 'right', gap: 2, mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b' }}>
                            הגשת בקשה למפתחות
                        </Typography>
                        <Key size={28} style={{ color: '#10b981' }} />

                    </Box>

                    <Typography
                        sx={{
                            color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                            textAlign: 'center',
                            direction: 'rtl',
                            mb: 3,
                            fontSize: '0.95rem'
                        }}
                    >
                        בחר יום רביעי לשריון כיתות
                    </Typography>

                    {/* Date Navigator - Full Width */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between', // מרווח בין החצים לטקסט
                        gap: 2,
                        p: 1.5,
                        width: '100%', // רוחב מלא כמו הכרטיס למטה
                        borderRadius: '16px', // עיגול תואם לכרטיס
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                        border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.1)',
                    }}>
                        <Box onClick={handlePreviousWednesday} sx={{
                            width: 40, height: 40, borderRadius: '10px', cursor: wednesdayOffset > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                            opacity: wednesdayOffset > 0 ? 1 : 0.3,
                            '&:hover': wednesdayOffset > 0 ? { bgcolor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)' } : {}
                        }}>
                            <ArrowRight size={20} style={{ color: '#6366f1' }} />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Calendar size={20} style={{ color: '#6366f1' }} />
                            <Typography sx={{ color: '#6366f1', fontSize: '1.1rem', fontWeight: 600 }}>
                                יום רביעי, {new Date(formData.range_start).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                        </Box>

                        <Box onClick={handleNextWednesday} sx={{
                            width: 40, height: 40, borderRadius: '10px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                            '&:hover': { bgcolor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)' }
                        }}>
                            <ArrowLeft size={20} style={{ color: '#6366f1' }} />
                        </Box>
                    </Box>
                </Box>
            </motion.div>

            {/* Form Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card sx={{
                    p: 4,
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px', // תואם ל-Date Navigator
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3} justifyContent="center">

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <InputLabel>כיתות צוותיות</InputLabel>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        placeholder="0"
                                        value={formData.single_team_amount || ''}
                                        onChange={(e) => handleInputChange('single_team_amount', e.target.value)}
                                        sx={textFieldStyle}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <InputLabel>כיתות דו״צ</InputLabel>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        placeholder="0"
                                        value={formData.two_team_amount || ''}
                                        onChange={(e) => handleInputChange('two_team_amount', e.target.value)}
                                        sx={textFieldStyle}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <InputLabel>כיתות פלוגתיות</InputLabel>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        placeholder="0"
                                        value={formData.company_amount || ''}
                                        onChange={(e) => handleInputChange('company_amount', e.target.value)}
                                        sx={textFieldStyle}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ my: 2 }}>
                                    <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', mb: 3 }} />

                                    <Fade in={true}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1
                                        }}>
                                            <Box sx={{ display: 'center', alignItems: 'flex-end', gap: 1, color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 100 }}>
                                                    סה"כ כיתות מבוקשות
                                                </Typography>
                                                <Calculator size={18} />

                                            </Box>

                                            <Typography variant="h2" sx={{
                                                fontWeight: 800,
                                                color: totalRooms > 0 ? '#10b981' : (isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'),
                                                fontSize: '3rem',
                                                lineHeight: 1,
                                                transition: 'color 0.3s'
                                            }}>
                                                {totalRooms}
                                            </Typography>
                                        </Box>
                                    </Fade>
                                </Box>
                            </Grid>

                            {error && (
                                <Grid item xs={12}>
                                    <Alert severity="error" variant="filled" size="small" sx={{ borderRadius: '10px', justifyContent: 'center' }}>
                                        {error}
                                    </Alert>
                                </Grid>
                            )}

                            {submitSuccess && (
                                <Grid item xs={12}>
                                    <Alert severity="success" variant="filled" size="small" sx={{ borderRadius: '10px', justifyContent: 'center', bgcolor: '#10b981' }}>
                                        הבקשה נשלחה בהצלחה!
                                    </Alert>
                                </Grid>
                            )}

                            <Grid item xs={12} sx={{ display: 'center', justifyContent: 'center' }}>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    variant="contained"
                                    sx={{
                                        minWidth: '7px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        py: 1.2,
                                        px: 4,
                                        borderRadius: '12px',
                                        fontWeight: 100,
                                        fontSize: '1rem',
                                        textTransform: 'none',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                                        },
                                        '&:disabled': {
                                            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                        }
                                    }}

                                >
                                    {loading ? 'שולח...' : ' שלח בקשה '}
                                    {loading ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}

                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Card>
            </motion.div>
        </Container>
    );
}