import {
    Box,
    Button,
    Card,
    Container,
    Typography,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from 'lib/supabaseClient';
import { CheckCircle, XCircle, Clock, Phone, Users, Shield, ArrowLeft } from 'lucide-react';

export default function ManageRequestsPage() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        checkAdminAndFetchRequests();
    }, []);

    const checkAdminAndFetchRequests = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            navigate('/login');
            return;
        }

        // קבלת פרטי המשתמש מטבלת users
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', user.id);

        console.log('User roles data:', userRoles);

        // בדיקה אם המשתמש הוא אדמין - התאם לפי המבנה שלך
        const isAdmin = userRoles?.some(ur => ur.roles?.name === 'admin');


        console.log('Is admin:', isAdmin);

        if (!isAdmin) {
            console.log('User is not admin, redirecting...');
            navigate('/home');
            return;
        }

        fetchRequests();
    };

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('join_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching requests:', error);
                alert('שגיאה בטעינת בקשות: ' + error.message);
                return;
            }

            if (data) {
                setRequests(data);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            alert('שגיאה לא צפויה: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request) => {
        try {
            // עדכון המשתמש - הוספת group_id
            await supabase
                .from('users')
                .update({
                    group_id: request.group_id,
                    updated_date: new Date().toISOString()
                })
                .eq('id', request.user_id);

            // הוספת התפקיד למשתמש בטבלת user_roles
            await supabase
                .from('user_roles')
                .insert({
                    user_id: request.user_id,
                    role_id: request.role_id,
                    assigned_date: new Date().toISOString()
                });

            // עדכון סטטוס הבקשה
            await supabase
                .from('join_requests')
                .update({
                    status: 'approved',
                    updated_at: new Date().toISOString()
                })
                .eq('id', request.id);

            fetchRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('שגיאה באישור הבקשה');
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            await supabase
                .from('join_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedRequest.id);

            setRejectDialogOpen(false);
            setRejectionReason('');
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('שגיאה בדחיית הבקשה');
        }
    };

    const openRejectDialog = (request) => {
        setSelectedRequest(request);
        setRejectDialogOpen(true);
    };

    const getStatusChip = (status) => {
        const configs = {
            pending: { label: 'ממתין', color: '#f59e0b', icon: <Clock size={16} /> },
            approved: { label: 'אושר', color: '#10b981', icon: <CheckCircle size={16} /> },
            rejected: { label: 'נדחה', color: '#ef4444', icon: <XCircle size={16} /> }
        };
        const config = configs[status] || configs.pending;

        return (
            <Chip
                icon={config.icon}
                label={config.label}
                size="small"
                sx={{
                    bgcolor: `${config.color}20`,
                    color: config.color,
                    fontWeight: 600,
                    border: `1px solid ${config.color}40`
                }}
            />
        );
    };

    const getRoleTypeLabel = (type) => {
        const types = {
            commanding: 'מפקד',
            staff: 'סגל',
            cadet: 'צוער'
        };
        return types[type] || type;
    };

    const toggleTheme = () => setIsDark(!isDark);

    if (loading) {
        return (
            <Box sx={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)'
            }}>
                <Typography sx={{ color: 'white' }}>טוען...</Typography>
            </Box>
        );
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <Box className={isDark ? 'dark' : 'light'} sx={{ minHeight: '100vh', position: 'relative' }} dir="rtl">
            <Box className="background-orbs">
                <Box className="orb orb-1" />
                <Box className="orb orb-2" />
                <Box className="orb orb-3" />
            </Box>
            <Box className="noise-overlay" />

            {/* Theme toggle */}
            <Box onClick={toggleTheme}
                sx={{
                    position: 'fixed', top: 24, left: 24, zIndex: 100,
                    width: 48, height: 48, borderRadius: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'white',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                    color: isDark ? 'white' : '#1f2937',
                }}
            >
                {isDark ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </Box>

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3, py: 6 }}>
                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/home')}
                        sx={{ color: isDark ? 'white' : '#1f2937' }}>
                        <ArrowLeft />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b', mb: 0.5 }}>
                            ניהול בקשות הצטרפות
                        </Typography>
                        <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                            אשר או דחה בקשות של משתמשים חדשים
                        </Typography>
                    </Box>
                </Box>

                {/* Pending Requests */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b', mb: 3 }}>
                        בקשות ממתינות ({pendingRequests.length})
                    </Typography>

                    {pendingRequests.length === 0 ? (
                        <Card sx={{
                            p: 4, textAlign: 'center',
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                            backdropFilter: 'blur(20px)', borderRadius: '16px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                        }}>
                            <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                                אין בקשות ממתינות
                            </Typography>
                        </Card>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {pendingRequests.map((request) => (
                                <Card key={request.id} sx={{
                                    p: 3, background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                    backdropFilter: 'blur(20px)', borderRadius: '16px',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? 'white' : '#1f2937', mb: 0.5 }}>
                                                {request.full_name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {getStatusChip(request.status)}
                                                {request.role_id && (
                                                    <Chip
                                                        label={`תפקיד ID: ${request.role_id}`}
                                                        size="small"
                                                        sx={{ bgcolor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff', color: '#8b5cf6' }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af' }}>
                                            {new Date(request.created_at).toLocaleDateString('he-IL')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Phone size={16} style={{ color: '#10b981' }} />
                                            <Typography sx={{ fontSize: '14px', color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                {request.phone || 'לא צוין'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Users size={16} style={{ color: '#f59e0b' }} />
                                            <Typography sx={{ fontSize: '14px', color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                קבוצה: {request.group_id || 'לא צוין'}
                                            </Typography>
                                        </Box>
                                        {request.email && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Shield size={16} style={{ color: '#ef4444' }} />
                                                <Typography sx={{ fontSize: '14px', color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                    {request.email}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button fullWidth variant="contained"
                                            startIcon={<CheckCircle size={18} />}
                                            onClick={() => handleApprove(request)}
                                            sx={{
                                                bgcolor: '#10b981', color: 'white', fontWeight: 600,
                                                '&:hover': { bgcolor: '#059669' }
                                            }}
                                        >
                                            אשר
                                        </Button>
                                        <Button fullWidth variant="outlined"
                                            startIcon={<XCircle size={18} />}
                                            onClick={() => openRejectDialog(request)}
                                            sx={{
                                                borderColor: '#ef4444', color: '#ef4444', fontWeight: 600,
                                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: '#dc2626' }
                                            }}
                                        >
                                            דחה
                                        </Button>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Processed Requests */}
                {processedRequests.length > 0 && (
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b', mb: 3 }}>
                            בקשות שטופלו ({processedRequests.length})
                        </Typography>
                        <Card sx={{
                            p: 2, background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                            backdropFilter: 'blur(20px)', borderRadius: '16px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                        }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 600 }}>שם</TableCell>
                                            <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 600 }}>תפקיד</TableCell>
                                            <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 600 }}>קבוצה</TableCell>
                                            <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 600 }}>סטטוס</TableCell>
                                            <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 600 }}>תאריך</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {processedRequests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell sx={{ color: isDark ? 'white' : '#1f2937' }}>{request.full_name}</TableCell>
                                                <TableCell sx={{ color: isDark ? 'white' : '#1f2937' }}>
                                                    תפקיד ID: {request.role_id || 'לא צוין'}
                                                </TableCell>
                                                <TableCell sx={{ color: isDark ? 'white' : '#1f2937' }}>
                                                    קבוצה: {request.group_id || 'לא צוין'}
                                                </TableCell>
                                                <TableCell>{getStatusChip(request.status)}</TableCell>
                                                <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                                                    {new Date(request.updated_at || request.created_at).toLocaleDateString('he-IL')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Box>
                )}
            </Container>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>דחיית בקשה</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, color: '#64748b' }}>
                        האם אתה בטוח שברצונך לדחות את הבקשה של {selectedRequest?.full_name}?
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="סיבת הדחייה (אופציונלי)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="הסבר למשתמש מדוע הבקשה נדחתה..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleReject} color="error" variant="contained">
                        דחה בקשה
                    </Button>
                </DialogActions>
            </Dialog>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&display=swap');
                .light { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); }
                .dark { background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%); }
                .background-orbs { position: absolute; width: 100%; height: 100%; overflow: hidden; z-index: 1; }
                .orb { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
                .dark .orb { opacity: 0.3; }
                .light .orb { opacity: 0.2; }
                .orb-1 { width: 500px; height: 500px; top: -10%; left: -10%; background: radial-gradient(circle, #6366f1 0%, transparent 70%); }
                .orb-2 { width: 400px; height: 400px; bottom: -10%; right: -5%; animation-delay: -7s; background: radial-gradient(circle, #8b5cf6 0%, transparent 70%); }
                .orb-3 { width: 350px; height: 350px; top: 50%; right: 20%; animation-delay: -14s; background: radial-gradient(circle, #ec4899 0%, transparent 70%); }
                @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(50px, -50px) scale(1.1); } 66% { transform: translate(-30px, 30px) scale(0.9); } }
                .noise-overlay { position: absolute; width: 100%; height: 100%; z-index: 2; pointer-events: none; opacity: 0.03; }
                * { font-family: 'Heebo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
            `}</style>
        </Box>
    );
}