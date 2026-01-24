import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Avatar,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Check,
    X,
    Clock,
    Search,
    MoreVertical,
    UserCheck,
    Mail,
    Calendar,
    Shield,
    AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { supabase } from 'lib/supabaseClient';

export default function AdminRequests() {
    const { user, isDark } = useOutletContext();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [battalions, setBattalions] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [teams, setTeams] = useState([]);

    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('Admin');

    useEffect(() => {
        if (!user) return;

        if (!isAdmin) {
            navigate('/Home');
            return;
        }

        fetchRequests();
        fetchGroupNodes();
    }, [user, isAdmin, navigate]);
    // כשמשנים גדוד – מאפסים פלוגה וצוות
    useEffect(() => {
        if (!editDialogOpen) return;

        if (!editForm?.battalion_id) {
            setEditForm((prev) => ({ ...prev, company_id: '', team_id: '' }));
            return;
        }

        // אם הפלוגה שנבחרה לא שייכת לגדוד הנבחר – מאפסים
        const companyValid = companies.some(
            (c) => c.id === editForm.company_id && c.parent_id === editForm.battalion_id
        );

        if (!companyValid) {
            setEditForm((prev) => ({ ...prev, company_id: '', team_id: '' }));
        }
    }, [editForm.battalion_id, editDialogOpen, companies]); // eslint-disable-line

    // כשמשנים פלוגה – מאפסים צוות אם לא שייך
    useEffect(() => {
        if (!editDialogOpen) return;

        if (!editForm?.company_id) {
            setEditForm((prev) => ({ ...prev, team_id: '' }));
            return;
        }

        const teamValid = teams.some(
            (t) => t.id === editForm.team_id && t.parent_id === editForm.company_id
        );

        if (!teamValid) {
            setEditForm((prev) => ({ ...prev, team_id: '' }));
        }
    }, [editForm.company_id, editDialogOpen, teams]); // eslint-disable-line


    const fetchGroupNodes = async () => {
        const { data: nodesData } = await supabase
            .from('group_node')
            .select('id, name, group_type_id, parent_id')
            .order('name');

        if (!nodesData) return;

        const normalized = nodesData.map(n => ({
            ...n,
            id: String(n.id),
            parent_id: n.parent_id == null ? null : String(n.parent_id),
        }));

        setBattalions(normalized.filter(n => n.group_type_id === 2));
        setCompanies(normalized.filter(n => n.group_type_id === 3));
        setTeams(normalized.filter(n => n.group_type_id === 4));
    };
    const rtlFieldSx = {
        '& .MuiInputBase-root': {
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#fff'
        },
        '& .MuiInputBase-input': {
            textAlign: 'right'
        },
        // Fix label positioning in RTL (the main bug)
        '& .MuiInputLabel-root': {
            right: 14,
            left: 'auto',
            transformOrigin: 'top right',
            textAlign: 'right'
        },
        '& .MuiInputLabel-shrink': {
            transformOrigin: 'top right'
        },
        // Fix the notch/legend alignment in RTL
        '& .MuiOutlinedInput-notchedOutline legend': {
            textAlign: 'right'
        }
    };

    const resolveHierarchyFromTeam = (teamId) => {
        if (!teamId) return { battalion_id: '', company_id: '', team_id: '' };

        const all = [...battalions, ...companies, ...teams];
        const map = Object.fromEntries(all.map(n => [n.id, n]));

        const team = map[String(teamId)];
        if (!team) return { battalion_id: '', company_id: '', team_id: String(teamId) };

        const company = team.parent_id ? map[team.parent_id] : null;
        const battalion = company?.parent_id ? map[company.parent_id] : null;

        return {
            team_id: team.id,
            company_id: company?.id || '',
            battalion_id: battalion?.id || '',
        };
    };



    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_date', { ascending: false });

            if (usersError) {
                setSnackbar({ open: true, message: `שגיאה בטעינת נתונים: ${usersError.message}`, severity: 'error' });
                setLoading(false);
                return;
            }

            if (!usersData || usersData.length === 0) {
                setRequests([]);
                setFilteredRequests([]);
                setLoading(false);
                return;
            }

            // Fetch ALL group nodes to build hierarchy
            const { data: allNodes, error: nodesError } = await supabase
                .from('group_node')
                .select('id, name, group_type_id, parent_id');

            if (nodesError) {
                console.error('Error fetching nodes:', nodesError);
            }

            // Create a map for quick lookup
            const nodesMap = {};
            if (allNodes) {
                allNodes.forEach(node => {
                    nodesMap[node.id] = node;
                });
            }

            // Function to get hierarchy from a group_id
            const getHierarchy = (groupId) => {
                const result = {
                    team_id: null,
                    team_name: null,
                    company_id: null,
                    company_name: null,
                    battalion_id: null,
                    battalion_name: null
                };

                if (!groupId || !nodesMap[groupId]) return result;

                // Walk up the tree
                let currentNode = nodesMap[groupId];
                const path = [];

                while (currentNode) {
                    path.push(currentNode);
                    if (currentNode.parent_id && nodesMap[currentNode.parent_id]) {
                        currentNode = nodesMap[currentNode.parent_id];
                    } else {
                        break;
                    }
                }

                // Assign based on group_type_id
                // group_type_id: 1=בה"ד, 2=גדוד, 3=פלוגה, 4=צוות
                path.forEach(node => {
                    if (node.group_type_id === 4) {
                        result.team_id = node.id;
                        result.team_name = node.name.replace(/^צוות\s+/g, '').trim();
                    } else if (node.group_type_id === 3) {
                        result.company_id = node.id;
                        result.company_name = node.name;
                    } else if (node.group_type_id === 2) {
                        result.battalion_id = node.id;
                        result.battalion_name = node.name;
                    }
                });

                return result;
            };

            // Transform the data
            const transformedData = usersData.map(user => {
                const hierarchy = getHierarchy(user.group_id);
                return {
                    ...user,
                    ...hierarchy
                };
            });

            setRequests(transformedData);
            setFilteredRequests(transformedData);
        } catch (err) {
            console.error('Exception during fetch:', err);
            setSnackbar({ open: true, message: 'שגיאה בטעינת נתונים', severity: 'error' });
        }
        setLoading(false);
    };

    useEffect(() => {
        let filtered = requests;

        if (currentTab === 0) {
            filtered = filtered.filter(req => req.status === 'pending');
        } else if (currentTab === 1) {
            filtered = filtered.filter(req => req.status === 'approved');
        } else if (currentTab === 2) {
            filtered = filtered.filter(req => req.status === 'rejected');
        }

        if (searchTerm) {
            filtered = filtered.filter(req =>
                req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRequests(filtered);
    }, [currentTab, searchTerm, requests]);

    const handleApprove = async (requestId) => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('users')
            .update({
                status: 'approved',
                reviewed_by: currentUser?.id,
                updated_date: new Date().toISOString()
            })
            .eq('id', requestId);

        if (!error) {
            setSnackbar({ open: true, message: 'הבקשה אושרה בהצלחה!', severity: 'success' });
            await fetchRequests();
            setDialogOpen(false);
        } else {
            setSnackbar({ open: true, message: 'שגיאה באישור הבקשה', severity: 'error' });
        }
    };

    const handleReject = async (requestId, reason = '') => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('users')
            .update({
                status: 'rejected',
                rejection_reason: reason || null,
                reviewed_by: currentUser?.id,
                updated_date: new Date().toISOString()
            })
            .eq('id', requestId);

        if (!error) {
            setSnackbar({ open: true, message: 'הבקשה נדחתה', severity: 'info' });
            await fetchRequests();
            setDialogOpen(false);
            setRejectDialogOpen(false);
        } else {
            setSnackbar({ open: true, message: 'שגיאה בדחיית הבקשה', severity: 'error' });
        }
    };

    const handleMenuClick = (event, request) => {
        setAnchorEl(event.currentTarget);
        setSelectedRequest(request);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const openDialog = (request) => {
        setSelectedRequest(request);
        setDialogOpen(true);
        handleMenuClose();
    };

    const openRejectDialog = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectDialogOpen(true);
        handleMenuClose();
    };

    const openEditDialog = (request) => {
        setSelectedRequest(request);

        const { battalion_id, company_id, team_id } = resolveHierarchyFromTeam(request.group_id);

        setEditForm({
            full_name: request.full_name || '',
            phone: request.phone || '',
            battalion_id,
            company_id,
            team_id
        });

        setEditDialogOpen(true);
        handleMenuClose();
    };
    useEffect(() => {
        if (!editDialogOpen) return;

        if (!editForm.battalion_id) {
            setEditForm(prev => ({ ...prev, company_id: '', team_id: '' }));
            return;
        }

        // אם הפלוגה לא שייכת לגדוד הנבחר
        const companyOk = companies.some(c => c.id === editForm.company_id && c.parent_id === editForm.battalion_id);
        if (!companyOk) setEditForm(prev => ({ ...prev, company_id: '', team_id: '' }));
    }, [editForm.battalion_id, editDialogOpen, companies]);

    useEffect(() => {
        if (!editDialogOpen) return;

        if (!editForm.company_id) {
            setEditForm(prev => ({ ...prev, team_id: '' }));
            return;
        }

        // אם הצוות לא שייך לפלוגה הנבחרת
        const teamOk = teams.some(t => t.id === editForm.team_id && t.parent_id === editForm.company_id);
        if (!teamOk) setEditForm(prev => ({ ...prev, team_id: '' }));
    }, [editForm.company_id, editDialogOpen, teams]);


    const handleEditSave = async () => {
        if (!selectedRequest) return;

        if (!editForm.full_name || !editForm.full_name.trim()) {
            setSnackbar({ open: true, message: 'שם מלא הוא שדה חובה', severity: 'error' });
            return;
        }

        if (editForm.phone && (editForm.phone.length !== 10 || !/^\d{10}$/.test(editForm.phone))) {
            setSnackbar({ open: true, message: 'מספר טלפון חייב להיות 10 ספרות', severity: 'error' });
            return;
        }

        const { error } = await supabase
            .from('users')
            .update({
                full_name: editForm.full_name,
                phone: editForm.phone || null,
                group_id: editForm.team_id || null,   // זה העיקר
                updated_date: new Date().toISOString()
            })
            .eq('id', selectedRequest.id);


        if (!error) {
            setSnackbar({ open: true, message: 'הפרטים עודכנו בהצלחה!', severity: 'success' });
            await fetchRequests();
            setEditDialogOpen(false);
        } else {
            setSnackbar({ open: true, message: 'שגיאה בעדכון הפרטים', severity: 'error' });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return { bg: 'rgba(251, 191, 36, 0.1)', color: '#f59e0b', label: 'ממתין' };
            case 'approved':
                return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', label: 'אושר' };
            case 'rejected':
                return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'נדחה' };
            default:
                return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', label: 'לא ידוע' };
        }
    };

    const cleanTeamName = (name) => {
        if (!name) return null;
        return name.replace(/^צוות\s+/g, '').trim();
    };

    const formatPhoneDisplay = (phone) => {
        if (!phone) return '';
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length <= 3) return cleaned;
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    };

    // Loading state
    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Not admin
    if (!isAdmin) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <Shield size={64} color="#ef4444" />
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 700, color: isDark ? 'white' : '#1e293b' }}>
                    אין הרשאת גישה
                </Typography>
            </Container>
        );
    }

    const cellStyle = {
        color: isDark ? 'rgba(255,255,255,0.8)' : '#334155',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        textAlign: 'center',
        verticalAlign: 'middle',
    };


    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <UserCheck size={32} style={{ color: '#6366f1' }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1e293b' }}>
                            ניהול בקשות
                        </Typography>
                    </Box>
                    <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                        ניהול בקשות הרשמה למערכת
                    </Typography>
                </Box>
            </motion.div>

            {/* Search */}
            <Card sx={{
                mb: 3,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            }}>
                <CardContent>
                    <TextField
                        placeholder="חיפוש לפי שם או אימייל..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                                color: isDark ? 'white' : '#1e293b',
                            }
                        }}
                        InputProps={{
                            startAdornment: <Search size={20} style={{ marginLeft: 8, color: '#64748b' }} />
                        }}
                    />
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card sx={{
                mb: 3,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    sx={{
                        '& .MuiTab-root': {
                            color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                            fontWeight: 600,
                            '&.Mui-selected': { color: isDark ? 'white' : '#1e293b' }
                        },
                        '& .MuiTabs-indicator': { bgcolor: '#6366f1' }
                    }}
                >
                    <Tab icon={<Clock size={18} />} iconPosition="start" label="ממתין" />
                    <Tab icon={<Check size={18} />} iconPosition="start" label="אושר" />
                    <Tab icon={<X size={18} />} iconPosition="start" label="נדחה" />
                    <Tab icon={<Shield size={18} />} iconPosition="start" label="הכל" />
                </Tabs>
            </Card>

            {/* Table */}
            <Card sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>תאריך</TableCell>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>שם משתמש</TableCell>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>אימייל</TableCell>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>טלפון</TableCell>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>גדוד</TableCell>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>פלוגה</TableCell>
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>צוות</TableCell>
                                {currentTab === 3 && <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>סטטוס</TableCell>}
                                <TableCell sx={{ ...cellStyle, fontWeight: 700 }}>פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={currentTab === 3 ? 9 : 8} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={currentTab === 3 ? 9 : 8} align="center" sx={{ py: 4, ...cellStyle }}>
                                        אין בקשות להצגה
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((request) => {
                                    const statusConfig = getStatusColor(request.status);
                                    return (
                                        <TableRow key={request.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' } }}>
                                            <TableCell sx={cellStyle}>
                                                {request.created_date ? new Date(request.created_date).toLocaleDateString('he-IL') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                                                    <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                                        {request.full_name || 'לא ידוע'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={cellStyle}>{request.email}</TableCell>
                                            <TableCell sx={cellStyle}>{request.phone || '-'}</TableCell>
                                            <TableCell sx={cellStyle}>{request.battalion_name || '-'}</TableCell>
                                            <TableCell sx={cellStyle}>{request.company_name || '-'}</TableCell>
                                            <TableCell sx={cellStyle}>{request.team_name || '-'}</TableCell>
                                            {currentTab === 3 && (
                                                <TableCell>
                                                    <Chip
                                                        label={statusConfig.label}
                                                        size="small"
                                                        sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 600 }}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <IconButton onClick={() => handleApprove(request.id)} sx={{ color: '#10b981' }}>
                                                                <Check size={20} />
                                                            </IconButton>
                                                            <IconButton onClick={() => openRejectDialog(request)} sx={{ color: '#ef4444' }}>
                                                                <X size={20} />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                    <IconButton onClick={(e) => handleMenuClick(e, request)} sx={{ color: isDark ? 'white' : '#1e293b' }}>
                                                        <MoreVertical size={20} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Context Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => openDialog(selectedRequest)}>
                    <AlertCircle size={18} style={{ marginLeft: 8 }} />
                    צפייה בפרטים
                </MenuItem>
                <MenuItem onClick={() => openEditDialog(selectedRequest)}>
                    עריכת פרטים
                </MenuItem>
                {selectedRequest?.status === 'pending' && (
                    <>
                        <MenuItem onClick={() => handleApprove(selectedRequest?.id)}>
                            <Check size={18} style={{ marginLeft: 8, color: '#10b981' }} />
                            אישור בקשה
                        </MenuItem>
                        <MenuItem onClick={() => openRejectDialog(selectedRequest)}>
                            <X size={18} style={{ marginLeft: 8, color: '#ef4444' }} />
                            דחיית בקשה
                        </MenuItem>
                    </>
                )}
            </Menu>

            {/* Details Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    dir: 'rtl',
                    sx: {
                        borderRadius: 3,
                        textAlign: 'right'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    פרטי בקשה
                </DialogTitle>

                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>

                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: '#6366f1',
                                        width: 56,
                                        height: 56,
                                        fontSize: 22,
                                        fontWeight: 700
                                    }}
                                >
                                    {selectedRequest.full_name?.charAt(0) || '?'}
                                </Avatar>

                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {selectedRequest.full_name}
                                    </Typography>

                                    <Chip
                                        label={getStatusColor(selectedRequest.status).label}
                                        size="small"
                                        sx={{
                                            mt: 0.5,
                                            bgcolor: getStatusColor(selectedRequest.status).bg,
                                            color: getStatusColor(selectedRequest.status).color,
                                            fontWeight: 600
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Divider-like spacing */}
                            <Box sx={{ height: 1, bgcolor: 'divider' }} />

                            {/* Details */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 1.5 }}>
                                <Typography fontWeight={600}>אימייל:</Typography>
                                <Typography sx={{ direction: 'ltr', textAlign: 'right' }}>
                                    {selectedRequest.email}
                                </Typography>

                                <Typography fontWeight={600}>טלפון:</Typography>
                                <Typography sx={{ direction: 'ltr', textAlign: 'right' }}>
                                    {formatPhoneDisplay(selectedRequest.phone) || '-'}
                                </Typography>

                                <Typography fontWeight={600}>גדוד:</Typography>
                                <Typography>{selectedRequest.battalion_name || '-'}</Typography>

                                <Typography fontWeight={600}>פלוגה:</Typography>
                                <Typography>{selectedRequest.company_name || '-'}</Typography>

                                <Typography fontWeight={600}>צוות:</Typography>
                                <Typography>{selectedRequest.team_name || '-'}</Typography>
                            </Box>

                            {selectedRequest.rejection_reason && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                    סיבת דחייה: {selectedRequest.rejection_reason}
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ direction: 'rtl' }}>
                    {selectedRequest?.status === 'pending' && (
                        <>
                            <Button onClick={() => openRejectDialog(selectedRequest)} color="error">
                                דחה
                            </Button>
                            <Button
                                onClick={() => handleApprove(selectedRequest?.id)}
                                variant="contained"
                                color="success"
                            >
                                אשר
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setDialogOpen(false)}>סגור</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    dir: 'rtl',
                    sx: { textAlign: 'right', borderRadius: 4 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'right' }}>
                    עריכת פרטי משתמש
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    <Box
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'
                        }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>

                            <TextField
                                label="שם מלא"
                                value={editForm.full_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                fullWidth
                                sx={rtlFieldSx}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                label="טלפון"
                                value={editForm.phone || ''}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, phone: e.target.value.replace(/[^0-9]/g, '').substring(0, 10) })
                                }
                                fullWidth
                                sx={rtlFieldSx}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ style: { direction: 'ltr', textAlign: 'right' } }}
                            />

                            <TextField
                                label="גדוד"
                                select
                                value={editForm.battalion_id || ''}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, battalion_id: e.target.value, company_id: '', team_id: '' })
                                }
                                SelectProps={{ native: true }}
                                fullWidth
                                sx={rtlFieldSx}
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">בחר גדוד</option>
                                {battalions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </TextField>

                            <TextField
                                label="פלוגה"
                                select
                                value={editForm.company_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value, team_id: '' })}
                                SelectProps={{ native: true }}
                                fullWidth
                                disabled={!editForm.battalion_id}
                                sx={rtlFieldSx}
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">
                                    {editForm.battalion_id ? 'בחר פלוגה' : 'בחר גדוד תחילה'}
                                </option>
                                {companies
                                    .filter(c => c.parent_id === editForm.battalion_id)
                                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </TextField>

                            <TextField
                                label="צוות"
                                select
                                value={editForm.team_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                                SelectProps={{ native: true }}
                                fullWidth
                                disabled={!editForm.company_id}
                                sx={rtlFieldSx}
                                InputLabelProps={{ shrink: true }}
                            >
                                <option value="">
                                    {editForm.company_id ? 'בחר צוות' : 'בחר פלוגה תחילה'}
                                </option>
                                {teams
                                    .filter(t => t.parent_id === editForm.company_id)
                                    .map(t => <option key={t.id} value={t.id}>{cleanTeamName(t.name)}</option>)}
                            </TextField>

                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ direction: 'rtl', px: 3, pb: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ fontWeight: 700 }}>
                        ביטול
                    </Button>
                    <Button onClick={handleEditSave} variant="contained" sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>




            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>דחיית בקשה</DialogTitle>
                <DialogContent>
                    <TextField
                        label="סיבת הדחייה (אופציונלי)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>ביטול</Button>
                    <Button onClick={() => handleReject(selectedRequest?.id, rejectionReason)} variant="contained" color="error">
                        דחה בקשה
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}