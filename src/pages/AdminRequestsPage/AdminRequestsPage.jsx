import {
    AppBar,
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
    Drawer,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Toolbar,
    Typography,
    Avatar,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    Alert,
    Snackbar
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Check,
    X,
    Clock,
    Search,
    Filter,
    MoreVertical,
    UserCheck,
    Mail,
    Calendar,
    Shield,
    AlertCircle,
    Database,
    Key,
    Lightbulb,
    Notebook,
    Settings,
    LogOut,
    Menu as MenuIcon,
    ChevronRight,
    Home as HomeIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from 'lib/supabaseClient';

export default function AdminRequests() {
    const [user, setUser] = useState(null);
    const [isDark, setIsDark] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
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
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser }, error } = await supabase.auth.getUser();
            if (error || !authUser) {
                navigate('/login');
                return;
            }

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('full_name, role, status')
                .eq('id', authUser.id)
                .single();

            if (userError || !userData || userData.role !== 'admin') {
                navigate('/Home');
                return;
            }

            setUser(userData);
            await fetchRequests();
            await fetchGroupNodes();
        };
        fetchUser();
    }, [navigate]);

    const fetchGroupNodes = async () => {
        const { data: nodesData } = await supabase
            .from('group_node')
            .select('id, name, group_type_id')
            .order('name');

        if (nodesData) {
            // group_type_id: 2=battalion, 3=company, 4=team
            setBattalions(nodesData.filter(n => n.group_type_id === 2));
            setCompanies(nodesData.filter(n => n.group_type_id === 3));
            setTeams(nodesData.filter(n => n.group_type_id === 4));
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_date', { ascending: false });

            console.log('Users fetch result:', { usersData, usersError });

            if (usersError) {
                console.error('Error fetching users:', usersError);
                setSnackbar({ open: true, message: `שגיאה בטעינת נתונים: ${usersError.message}`, severity: 'error' });
                setLoading(false);
                return;
            }

            if (!usersData || usersData.length === 0) {
                console.log('No users found');
                setRequests([]);
                setFilteredRequests([]);
                setLoading(false);
                return;
            }

            console.log('Number of users:', usersData.length);
            console.log('Sample user:', usersData[0]);

            // Get all unique node IDs from users
            const allNodeIds = new Set();
            usersData.forEach(user => {
                if (user.battalion_id) allNodeIds.add(user.battalion_id);
                if (user.company_id) allNodeIds.add(user.company_id);
                if (user.team_id) allNodeIds.add(user.team_id);
            });

            console.log('All node IDs:', Array.from(allNodeIds));

            // Fetch all group nodes
            let groupNodesMap = {};
            if (allNodeIds.size > 0) {
                const { data: nodesData, error: nodesError } = await supabase
                    .from('group_node')
                    .select('id, name, group_type_id')
                    .in('id', Array.from(allNodeIds));

                console.log('Group nodes fetch result:', { nodesData, nodesError });

                if (nodesData) {
                    groupNodesMap = nodesData.reduce((acc, node) => {
                        acc[node.id] = node.name;
                        return acc;
                    }, {});
                    console.log('Group nodes map:', groupNodesMap);
                }
            }

            // Transform the data
            const transformedData = usersData.map(user => ({
                ...user,
                battalion_name: user.battalion_id ? groupNodesMap[user.battalion_id] : null,
                company_name: user.company_id ? groupNodesMap[user.company_id] : null,
                team_name: user.team_id ? cleanTeamName(groupNodesMap[user.team_id]) : null
            }));

            console.log('Final transformed data sample:', transformedData[0]);
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

        // Filter by tab (status)
        if (currentTab === 0) {
            filtered = filtered.filter(req => req.status === 'pending');
        } else if (currentTab === 1) {
            filtered = filtered.filter(req => req.status === 'approved');
        } else if (currentTab === 2) {
            filtered = filtered.filter(req => req.status === 'rejected');
        }

        // Filter by search term
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
        setEditForm({
            full_name: request.full_name || '',
            phone: request.phone || '',
            role: request.role || 'cadet',
            battalion_id: request.battalion_id || '',
            company_id: request.company_id || '',
            team_id: request.team_id || ''
        });
        setEditDialogOpen(true);
        handleMenuClose();
    };

    const handleEditSave = async () => {
        if (!selectedRequest) return;

        // ולידציה
        if (!editForm.full_name || !editForm.full_name.trim()) {
            setSnackbar({ open: true, message: 'שם מלא הוא שדה חובה', severity: 'error' });
            return;
        }

        if (!editForm.phone || editForm.phone.length !== 10 || !/^\d{10}$/.test(editForm.phone)) {
            setSnackbar({ open: true, message: 'מספר טלפון חייב להיות 10 ספרות', severity: 'error' });
            return;
        }

        const { error } = await supabase
            .from('users')
            .update({
                full_name: editForm.full_name,
                phone: editForm.phone,
                group_id: editForm.group_id || null,
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

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin':
                return 'מנהל';
            case 'staff':
                return 'סגל';
            case 'cadet':
                return 'צוער';
            default:
                return role;
        }
    };

    const cleanTeamName = (name) => {
        if (!name) return null;
        // Remove "צוות" prefix and trim whitespace
        return name.replace(/^צוות\s+/g, '').trim();
    };

    // פונקציה להצגת הטלפון עם מקף
    const formatPhoneDisplay = (phone) => {
        if (!phone) return '';
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length <= 3) return cleaned;
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    };

    const isAdmin = user?.rules(role_id) === 'admin';

    const classroomFeatures = [
        {
            title: 'ניהול כיתות',
            icon: Lightbulb,
            path: '/Dashboard',
            color: '#6366f1',
        },
        {
            title: 'הקצאת מפתחות',
            icon: Key,
            path: '/AllocateKeys',
            color: '#10b981',
        },
        {
            title: 'ניהול מפתחות',
            icon: Key,
            path: '/ManageKeys',
            color: '#f59e0b',
        },
        {
            title: 'לו"ז',
            icon: Notebook,
            path: '/Schedule',
            color: '#ef4444',
        },
    ];

    const adminFeatures = [
        {
            title: 'ניהול בקשות',
            icon: UserCheck,
            path: '/admin',
            color: '#6366f1',
        },
        {
            title: 'ניהול משתמשים',
            icon: Settings,
            path: '/manage-users',
            color: '#8b5cf6',
        },
        {
            title: 'ייצוא נתונים',
            icon: Database,
            path: '/data-export',
            color: '#ec4899',
        }
    ];

    const drawerWidth = 280;

    if (!user) return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
            color: 'white'
        }}>
            <Typography variant="h5">טוען...</Typography>
        </Box>
    );

    return (
        <Box
            className={isDark ? 'dark' : 'light'}
            sx={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                display: 'flex'
            }}
            dir="rtl"
        >
            {/* Background elements */}
            <Box className="background-orbs">
                <Box className="orb orb-1" />
                <Box className="orb orb-2" />
                <Box className="orb orb-3" />
            </Box>
            <Box className="noise-overlay" />

            {/* Sidebar */}
            <Drawer
                variant="persistent"
                anchor="right"
                open={drawerOpen}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: 'none',
                        borderLeft: isDark
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid #e2e8f0',
                        transition: 'all 0.3s',
                    },
                }}
            >
                {/* Logo Section */}
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="img"
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/2f970d938_9.png"
                        alt="מגדלור לוגו"
                        sx={{ width: 48, height: 48, objectFit: 'contain' }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: isDark ? 'white' : '#1e293b',
                            textAlign: 'right',
                            direction: 'rtl'
                        }}
                    >
                        מגדלור
                    </Typography>
                </Box>

                <Divider sx={{
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
                }} />

                {/* Navigation */}
                <List sx={{ px: 2, py: 2 }}>
                    {/* Home */}
                    <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            component={Link}
                            to="/Home"
                            sx={{
                                borderRadius: '12px',
                                '&:hover': {
                                    bgcolor: isDark
                                        ? 'rgba(99, 102, 241, 0.1)'
                                        : 'rgba(99, 102, 241, 0.05)',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <HomeIcon
                                    size={20}
                                    style={{
                                        color: isDark ? 'white' : '#1e293b'
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary="אזור אישי"
                                sx={{
                                    '& .MuiTypography-root': {
                                        color: isDark ? 'white' : '#1e293b',
                                        fontWeight: 500,
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    }
                                }}
                            />
                        </ListItemButton>
                    </ListItem>

                    {/* Classroom Management Section */}
                    <Typography
                        variant="overline"
                        sx={{
                            px: 2,
                            py: 1,
                            display: 'block',
                            color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textAlign: 'right',
                            direction: 'rtl'
                        }}
                    >
                        ניהול כיתות
                    </Typography>

                    {classroomFeatures.map((feature) => (
                        <ListItem key={feature.title} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                component={Link}
                                to={feature.path}
                                sx={{
                                    borderRadius: '12px',
                                    '&:hover': {
                                        bgcolor: isDark
                                            ? `${feature.color}20`
                                            : `${feature.color}10`,
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <feature.icon
                                        size={20}
                                        style={{ color: feature.color }}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={feature.title}
                                    sx={{
                                        '& .MuiTypography-root': {
                                            color: isDark ? 'white' : '#1e293b',
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            direction: 'rtl'
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}

                    {/* Admin Section */}
                    {isAdmin && (
                        <>
                            <Divider sx={{
                                my: 2,
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
                            }} />

                            <Typography
                                variant="overline"
                                sx={{
                                    px: 2,
                                    py: 1,
                                    display: 'block',
                                    color: isDark ? 'rgba(139, 92, 246, 0.8)' : '#8b5cf6',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textAlign: 'right',
                                    direction: 'rtl'
                                }}
                            >
                                🛡️ אזור מנהל
                            </Typography>

                            {adminFeatures.map((feature) => (
                                <ListItem key={feature.title} disablePadding sx={{ mb: 1 }}>
                                    <ListItemButton
                                        component={Link}
                                        to={feature.path}
                                        sx={{
                                            borderRadius: '12px',
                                            bgcolor: isDark
                                                ? 'rgba(139, 92, 246, 0.05)'
                                                : 'rgba(139, 92, 246, 0.02)',
                                            '&:hover': {
                                                bgcolor: isDark
                                                    ? 'rgba(139, 92, 246, 0.15)'
                                                    : 'rgba(139, 92, 246, 0.08)',
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <feature.icon
                                                size={20}
                                                style={{ color: feature.color }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature.title}
                                            sx={{
                                                '& .MuiTypography-root': {
                                                    color: isDark ? 'white' : '#1e293b',
                                                    fontWeight: 500,
                                                    textAlign: 'right',
                                                    direction: 'rtl'
                                                }
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </>
                    )}
                </List>

                {/* Bottom Actions */}
                <Box sx={{ mt: 'auto', p: 2 }}>
                    <Divider sx={{
                        mb: 2,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
                    }} />

                    {/* User Info */}
                    <Box
                        sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: '12px',
                            bgcolor: isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.02)',
                        }}
                    >
                        <Typography
                            sx={{
                                color: isDark ? 'white' : '#1e293b',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                mb: 0.5,
                                textAlign: 'right',
                                direction: 'rtl'
                            }}
                        >
                            {user.full_name}
                        </Typography>
                        <Typography
                            sx={{
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
                                fontSize: '0.75rem',
                                textAlign: 'right',
                                direction: 'rtl'
                            }}
                        >
                            {user.roles(role_id) === 'admin' ? 'מנהל' :  user.roles(role_id) === 'staff' ? 'סגל' : 'צוער'}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Theme Toggle */}
                        <Box
                            onClick={toggleTheme}
                            sx={{
                                flex: 1,
                                height: 44,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                '&:hover': {
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                                }
                            }}
                        >
                            {isDark ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </Box>

                        {/* Logout */}
                        <Box
                            onClick={handleSignOut}
                            sx={{
                                flex: 1,
                                height: 44,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s',
                                bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                color: '#ef4444',
                                '&:hover': {
                                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                }
                            }}
                        >
                            <LogOut size={20} />
                        </Box>
                    </Box>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box
                sx={{
                    flexGrow: 1,
                    transition: 'margin 0.3s',
                    marginRight: drawerOpen ? 0 : `-${drawerWidth}px`,
                    position: 'relative',
                    zIndex: 3
                }}
            >
                {/* Top Bar */}
                <AppBar
                    position="sticky"
                    sx={{
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                        boxShadow: 'none',
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        {/* Right side - Menu toggle and logo */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {/* Menu toggle */}
                            <Box
                                onClick={toggleDrawer}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                    color: isDark ? 'white' : '#1f2937',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                                    }
                                }}
                            >
                                {drawerOpen ? <ChevronRight size={20} /> : <MenuIcon size={20} />}
                            </Box>

                            {/* Logo - Only visible when drawer is closed */}
                            {!drawerOpen && (
                                <Box
                                    component="img"
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/2f970d938_9.png"
                                    alt="מגדלור לוגו"
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        objectFit: 'contain',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                    onClick={() => navigate('/Home')}
                                />
                            )}
                        </Box>

                        {/* Left side buttons */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {/* Theme toggle */}
                            <Box
                                onClick={toggleTheme}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                    color: isDark ? 'white' : '#1f2937',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                                        transform: 'scale(1.05)',
                                    }
                                }}
                            >
                                {isDark ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                )}
                            </Box>

                            {/* Sign out button */}
                            <Box
                                onClick={handleSignOut}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                                    color: isDark ? 'white' : '#1f2937',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        transform: 'scale(1.05)',
                                    }
                                }}
                            >
                                <LogOut size={20} />
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: 4 }}>
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <UserCheck size={32} style={{ color: '#6366f1' }} />
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: isDark ? 'white' : '#1e293b',
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    }}
                                >
                                    ניהול בקשות
                                </Typography>
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                                    textAlign: 'right',
                                    direction: 'rtl'
                                }}
                            >
                                ניהול בקשות הרשמה למערכת
                            </Typography>
                        </Box>
                    </motion.div>
                    {/* Search and Filters */}
                    <Card
                        sx={{
                            mb: 3,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                            boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <TextField
                                    placeholder="חיפוש לפי שם או אימייל..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                            color: isDark ? 'white' : '#1e293b',
                                            '& fieldset': {
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                                            }
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: <Search size={20} style={{ marginLeft: 8, color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b' }} />
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Card
                        sx={{
                            mb: 3,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                            boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <Tabs
                            value={currentTab}
                            onChange={(e, newValue) => setCurrentTab(newValue)}
                            sx={{
                                '& .MuiTab-root': {
                                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                                    fontWeight: 600,
                                    '&.Mui-selected': {
                                        color: isDark ? 'white' : '#1e293b',
                                    }
                                },
                                '& .MuiTabs-indicator': {
                                    bgcolor: '#6366f1',
                                }
                            }}
                        >
                            <Tab icon={<Clock size={18} />} iconPosition="start" label="ממתין" />
                            <Tab icon={<Check size={18} />} iconPosition="start" label="אושר" />
                            <Tab icon={<X size={18} />} iconPosition="start" label="נדחה" />
                            <Tab icon={<Shield size={18} />} iconPosition="start" label="הכל" />
                        </Tabs>
                    </Card>

                    {/* Requests Table */}
                    <Card
                        sx={{
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                            boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>תאריך</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>שם משתמש</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>אימייל</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>טלפון</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>תפקיד</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>גדוד</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>פלוגה</TableCell>
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>צוות</TableCell>
                                        {currentTab === 3 && (
                                            <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>סטטוס</TableCell>
                                        )}
                                        <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontWeight: 700 }}>פעולות</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={currentTab === 3 ? 10 : 9} align="center" sx={{ py: 4 }}>
                                                <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                                                    טוען...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={currentTab === 3 ? 10 : 9} align="center" sx={{ py: 4 }}>
                                                <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }}>
                                                    אין בקשות להצגה
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRequests.map((request) => {
                                            const statusConfig = getStatusColor(request.status);
                                            return (
                                                <TableRow
                                                    key={request.id}
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                        {request.created_date ? new Date(request.created_date).toLocaleDateString('he-IL', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        }) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#6366f1', width: 36, height: 36 }}>
                                                                {request.full_name?.charAt(0) || '?'}
                                                            </Avatar>
                                                            <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                                                {request.full_name || 'לא ידוע'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                        {request.email}
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                        {request.phone || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={getRoleLabel(request.role)}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                                color: '#6366f1',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                        {request.battalion_name || '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                        {request.company_name || '-'}
                                                    </TableCell>
                                                    <TableCell sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569' }}>
                                                        {request.team_name || '-'}
                                                    </TableCell>
                                                    {currentTab === 3 && (
                                                        <TableCell>
                                                            <Chip
                                                                label={statusConfig.label}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: statusConfig.bg,
                                                                    color: statusConfig.color,
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            {request.status === 'pending' && (
                                                                <>
                                                                    <IconButton
                                                                        onClick={() => handleApprove(request.id)}
                                                                        sx={{
                                                                            color: '#10b981',
                                                                            '&:hover': {
                                                                                bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                                            }
                                                                        }}
                                                                        title="אישור בקשה"
                                                                    >
                                                                        <Check size={20} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        onClick={() => openRejectDialog(request)}
                                                                        sx={{
                                                                            color: '#ef4444',
                                                                            '&:hover': {
                                                                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                                            }
                                                                        }}
                                                                        title="דחיית בקשה"
                                                                    >
                                                                        <X size={20} />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                            <IconButton
                                                                onClick={(e) => handleMenuClick(e, request)}
                                                                sx={{ color: isDark ? 'white' : '#1e293b' }}
                                                                title="אפשרויות נוספות"
                                                            >
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
                </Container>
            </Box>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        bgcolor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'white',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    }
                }}
            >
                <MenuItem onClick={() => openDialog(selectedRequest)}>
                    <AlertCircle size={18} style={{ marginLeft: 8 }} />
                    צפייה בפרטים
                </MenuItem>
                <MenuItem onClick={() => openEditDialog(selectedRequest)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
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
                    sx: {
                        bgcolor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'white',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    }
                }}
            >
                <DialogTitle sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 700, textAlign: 'right', direction: 'rtl' }}>
                    פרטי בקשה
                </DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                <Avatar sx={{ bgcolor: '#6366f1', width: 56, height: 56, fontSize: '1.5rem' }}>
                                    {selectedRequest.full_name?.charAt(0) || '?'}
                                </Avatar>
                                <Box sx={{ flex: 1, textAlign: 'right' }}>
                                    <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 700, fontSize: '1.25rem' }}>
                                        {selectedRequest.full_name || 'לא ידוע'}
                                    </Typography>
                                    <Chip
                                        label={getStatusColor(selectedRequest.status).label}
                                        size="small"
                                        sx={{
                                            bgcolor: getStatusColor(selectedRequest.status).bg,
                                            color: getStatusColor(selectedRequest.status).color,
                                            fontWeight: 600,
                                            mt: 0.5
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                    <Mail size={20} style={{ color: '#6366f1' }} />
                                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                                        <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                            אימייל
                                        </Typography>
                                        <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                            {selectedRequest.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                {selectedRequest.phone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                                טלפון
                                            </Typography>
                                            <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600, direction: 'ltr', textAlign: 'right' }}>
                                                {formatPhoneDisplay(selectedRequest.phone)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                    <Shield size={20} style={{ color: '#8b5cf6' }} />
                                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                                        <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                            תפקיד
                                        </Typography>
                                        <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                            {getRoleLabel(selectedRequest.role)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {selectedRequest.battalion_name && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                        </svg>
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                                גדוד
                                            </Typography>
                                            <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                                {selectedRequest.battalion_name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {selectedRequest.company_name && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                                פלוגה
                                            </Typography>
                                            <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                                {selectedRequest.company_name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {selectedRequest.team_name && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                                צוות
                                            </Typography>
                                            <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                                {selectedRequest.team_name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {selectedRequest.rejection_reason && (
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', flexDirection: 'row-reverse' }}>
                                        <AlertCircle size={20} style={{ color: '#ef4444', marginTop: 2 }} />
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                                סיבת הדחייה
                                            </Typography>
                                            <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                                {selectedRequest.rejection_reason}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: 'row-reverse' }}>
                                    <Calendar size={20} style={{ color: '#10b981' }} />
                                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                                        <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontSize: '0.875rem' }}>
                                            תאריך הרשמה
                                        </Typography>
                                        <Typography sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 600 }}>
                                            {selectedRequest.created_date ? new Date(selectedRequest.created_date).toLocaleDateString('he-IL', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) + ' ' + new Date(selectedRequest.created_date).toLocaleTimeString('he-IL', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '-'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    {selectedRequest?.status === 'pending' && (
                        <>
                            <Button
                                onClick={() => openRejectDialog(selectedRequest)}
                                startIcon={<X size={18} />}
                                sx={{
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                                }}
                            >
                                דחה
                            </Button>
                            <Button
                                onClick={() => handleApprove(selectedRequest?.id)}
                                startIcon={<Check size={18} />}
                                sx={{
                                    bgcolor: '#10b981',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#059669' }
                                }}
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
                    sx: {
                        bgcolor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'white',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    }
                }}
            >
                <DialogTitle sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 700, direction: 'rtl', textAlign: 'right' }}>
                    עריכת פרטי משתמש
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                        {/* Full Name */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                שם מלא (בעברית)
                            </Typography>
                            <TextField
                                fullWidth
                                value={editForm.full_name || ''}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^\u0590-\u05FF\s]/g, '');
                                    setEditForm({ ...editForm, full_name: value });
                                }}
                                placeholder="הזן שם מלא"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                        color: isDark ? 'white' : '#1e293b',
                                        '& input': {
                                            textAlign: 'right',
                                        }
                                    }
                                }}
                            />
                        </Box>

                        {/* Phone */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                טלפון (10 ספרות)
                            </Typography>
                            <TextField
                                fullWidth
                                value={formatPhoneDisplay(editForm.phone || '')}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '').substring(0, 10);
                                    setEditForm({ ...editForm, phone: value });
                                }}
                                placeholder="050-1234567"
                                inputProps={{
                                    maxLength: 11,
                                    inputMode: 'numeric'
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                        color: isDark ? 'white' : '#1e293b',
                                        '& input': {
                                            textAlign: 'right',
                                            direction: 'ltr',
                                        }
                                    }
                                }}
                            />
                        </Box>

                        {/* Role */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                תפקיד
                            </Typography>
                            <TextField
                                fullWidth
                                select
                                value={editForm.role || 'cadet'}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                SelectProps={{
                                    native: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                        color: isDark ? 'white' : '#1e293b',
                                    },
                                    '& select': {
                                        textAlign: 'right',
                                        paddingRight: '14px',
                                    }
                                }}
                            >
                                <option value="cadet">צוער</option>
                                <option value="staff">סגל</option>
                                <option value="admin">מנהל</option>
                            </TextField>
                        </Box>

                        {/* Battalion */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                גדוד
                            </Typography>
                            <TextField
                                fullWidth
                                select
                                value={editForm.battalion_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, battalion_id: e.target.value })}
                                SelectProps={{
                                    native: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                        color: isDark ? 'white' : '#1e293b',
                                    },
                                    '& select': {
                                        textAlign: 'right',
                                        paddingRight: '14px',
                                    }
                                }}
                            >
                                <option value="">בחר גדוד</option>
                                {battalions.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </TextField>
                        </Box>

                        {/* Company */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                פלוגה
                            </Typography>
                            <TextField
                                fullWidth
                                select
                                value={editForm.company_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
                                SelectProps={{
                                    native: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                        color: isDark ? 'white' : '#1e293b',
                                    },
                                    '& select': {
                                        textAlign: 'right',
                                        paddingRight: '14px',
                                    }
                                }}
                            >
                                <option value="">בחר פלוגה</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </TextField>
                        </Box>

                        {/* Team */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                צוות
                            </Typography>
                            <TextField
                                fullWidth
                                select
                                value={editForm.team_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, team_id: e.target.value })}
                                SelectProps={{
                                    native: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                        color: isDark ? 'white' : '#1e293b',
                                    },
                                    '& select': {
                                        textAlign: 'right',
                                        paddingRight: '14px',
                                    }
                                }}
                            >
                                <option value="">בחר צוות</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{cleanTeamName(t.name)}</option>
                                ))}
                            </TextField>
                        </Box>

                        {/* Email - Read Only */}
                        <Box>
                            <Typography sx={{ mb: 1, color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8', fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
                                אימייל (לא ניתן לעריכה)
                            </Typography>
                            <TextField
                                fullWidth
                                value={selectedRequest?.email || ''}
                                disabled
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                        '& input': {
                                            textAlign: 'right',
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setEditDialogOpen(false)}
                        sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b' }}
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={handleEditSave}
                        startIcon={<Check size={18} />}
                        sx={{
                            bgcolor: '#6366f1',
                            color: 'white',
                            '&:hover': { bgcolor: '#4f46e5' }
                        }}
                    >
                        שמור שינויים
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rejection Dialog */}
            <Dialog
                open={rejectDialogOpen}
                onClose={() => setRejectDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: isDark ? 'rgba(30, 30, 46, 0.95)' : 'white',
                        backdropFilter: 'blur(20px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    }
                }}
            >
                <DialogTitle sx={{ color: isDark ? 'white' : '#1e293b', fontWeight: 700 }}>
                    דחיית בקשה
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569', mb: 2 }}>
                            האם ברצונך להוסיף סיבה לדחייה?
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="הזן סיבה לדחייה (אופציונלי)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                    color: isDark ? 'white' : '#1e293b',
                                    '& fieldset': {
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                                    }
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setRejectDialogOpen(false)}
                        sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b' }}
                    >
                        ביטול
                    </Button>
                    <Button
                        onClick={() => handleReject(selectedRequest?.id, rejectionReason)}
                        startIcon={<X size={18} />}
                        sx={{
                            bgcolor: '#ef4444',
                            color: 'white',
                            '&:hover': { bgcolor: '#dc2626' }
                        }}
                    >
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
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&display=swap');

                .light {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                }

                .dark {
                    background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
                }

                .background-orbs {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    z-index: 1;
                }

                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    animation: float 20s ease-in-out infinite;
                }

                .dark .orb {
                    opacity: 0.3;
                }

                .light .orb {
                    opacity: 0.2;
                }

                .orb-1 {
                    width: 500px;
                    height: 500px;
                    top: -10%;
                    left: -10%;
                }

                .dark .orb-1 {
                    background: radial-gradient(circle, #6366f1 0%, transparent 70%);
                }

                .light .orb-1 {
                    background: radial-gradient(circle, #818cf8 0%, transparent 70%);
                }

                .orb-2 {
                    width: 400px;
                    height: 400px;
                    bottom: -10%;
                    right: -5%;
                    animation-delay: -7s;
                }

                .dark .orb-2 {
                    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
                }

                .light .orb-2 {
                    background: radial-gradient(circle, #a78bfa 0%, transparent 70%);
                }

                .orb-3 {
                    width: 350px;
                    height: 350px;
                    top: 50%;
                    right: 20%;
                    animation-delay: -14s;
                }

                .dark .orb-3 {
                    background: radial-gradient(circle, #ec4899 0%, transparent 70%);
                }

                .light .orb-3 {
                    background: radial-gradient(circle, #f472b6 0%, transparent 70%);
                }

                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(50px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-30px, 30px) scale(0.9);
                    }
                }

                .noise-overlay {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    z-index: 2;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    pointer-events: none;
                }

                .dark .noise-overlay {
                    opacity: 0.03;
                }

                .light .noise-overlay {
                    opacity: 0.02;
                }

                * {
                    font-family: 'Heebo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                }
            `}</style>
        </Box>
    );
}