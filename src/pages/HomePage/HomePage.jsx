import {
    AppBar,
    Box,
    Card,
    CardContent,
    Container,
    Grid,
    Toolbar,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Database,
    Key,
    Lightbulb,
    Notebook,
    Settings,
    LogOut
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from 'lib/supabaseClient';

export default function Home() {
    const [user, setUser] = useState(null);
    const [isDark, setIsDark] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Error fetching user:', error);
                return;
            }
            const { data, error2 } = await supabase
                .from('users')
                .select('full_name, site_role')
                .eq('id', user.id)
                .single();
            if (error2) {
                console.error('Error fetching user data:', error);
            } else {
                setUser(data);
            }
        }
        fetchUser();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    if (user === null) return (
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

    const isAdmin = user?.site_role === 'admin';

    const features = [
        {
            title: 'ניהול כיתות',
            description: 'ניהול מפתחות, הקצאת חדרים ולוח זמנים',
            icon: Lightbulb,
            path: '/Dashboard',
            color: '#6366f1',
            available: true
        },
        {
            title: 'הקצאת מפתחות',
            description: 'מקום להקצות מפתחות בצורה מסודרת',
            icon: Key,
            path: '/AllocateKeys',
            color: '#10b981',
            available: true
        },
        {
            title: 'ניהול כללי של מפתחות',
            description: 'מקום לעקוב אחר מפתחות',
            icon: Key,
            path: '/ManageKeys',
            color: '#f59e0b',
            available: true
        },
        {
            title: 'לו"ז',
            description: 'מה הלו"ז?',
            icon: Notebook,
            path: '/Schedule',
            color: '#ef4444',
            available: true
        },
    ];

    const adminFeatures = [
        {
            title: 'ניהול משתמשים',
            description: 'צפייה ועריכת משתמשים במערכת',
            icon: Settings,
            path: '/manage-users',
            color: '#8b5cf6',
            available: isAdmin
        },
        {
            title: 'ייצוא נתונים',
            description: 'ייצוא נתונים ל-PostgreSQL/Supabase',
            icon: Database,
            path: '/data-export',
            color: '#ec4899',
            available: isAdmin
        }
    ];

    return (
        <Box
            className={isDark ? 'dark' : 'light'}
            sx={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
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

            {/* Main Content */}
            <Box sx={{ position: 'relative', zIndex: 3 }}>
                {/* Top Navigation */}
                <AppBar
                    position="sticky"
                    sx={{
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                        boxShadow: 'none',
                        transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                >
                    <Toolbar sx={{ maxWidth: '1280px', width: '100%', mx: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Box
                                    component="img"
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/2f970d938_9.png"
                                    alt="מגדלור לוגו"
                                    sx={{ width: 48, height: 48, objectFit: 'contain' }}
                                />
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: isDark ? 'white' : '#1e293b',
                                        transition: 'color 0.5s'
                                    }}
                                >
                                    מגדלור
                                </Typography>
                            </Link>
                        </Box>
                        
                        {/* Action buttons on the left */}
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
                                        <circle cx="12" cy="12" r="5"/>
                                        <line x1="12" y1="1" x2="12" y2="3"/>
                                        <line x1="12" y1="21" x2="12" y2="23"/>
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                        <line x1="1" y1="12" x2="3" y2="12"/>
                                        <line x1="21" y1="12" x2="23" y2="12"/>
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
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

                <Container maxWidth="lg" sx={{ py: 6 }}>
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Box
                                component="img"
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/2f970d938_9.png"
                                alt="מגדלור לוגו"
                                sx={{ width: 96, height: 96, objectFit: 'contain', mx: 'auto', mb: 3 }}
                            />

                            <Typography 
                                variant="h3" 
                                sx={{ 
                                    fontWeight: 700, 
                                    color: isDark ? 'white' : '#1e293b',
                                    mb: 1.5,
                                    transition: 'color 0.5s'
                                }}
                            >
                                שלום {user.full_name} 👋
                            </Typography>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                                    transition: 'color 0.5s'
                                }}
                            >
                                מגדלור, כאן בשבילך 🙂
                            </Typography>
                            <Typography 
                                sx={{ 
                                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                                    mt: 1,
                                    transition: 'color 0.5s'
                                }}
                            >
                                ״כשהאור תמיד דולק, הדרך ברורה.״
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* Features Grid */}
                    <Grid container spacing={3}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} md={6} lg={4} key={feature.title}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{ height: '100%' }}
                                >
                                    {feature.available ? (
                                        <Link to={feature.path} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                                            <Card
                                                sx={{
                                                    p: 3,
                                                    height: '100%',
                                                    background: isDark 
                                                        ? 'rgba(255, 255, 255, 0.05)' 
                                                        : 'white',
                                                    backdropFilter: 'blur(20px)',
                                                    border: isDark 
                                                        ? '1px solid rgba(255, 255, 255, 0.1)' 
                                                        : '1px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: isDark
                                                            ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                                                            : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                        '& .icon-wrapper': {
                                                            transform: 'scale(1.1) rotate(5deg)'
                                                        }
                                                    }
                                                }}
                                            >
                                                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                                    <Box
                                                        className="icon-wrapper"
                                                        sx={{
                                                            width: 56,
                                                            height: 56,
                                                            bgcolor: feature.color,
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mb: 2,
                                                            transition: 'transform 0.3s',
                                                            boxShadow: `0 8px 24px ${feature.color}40`
                                                        }}
                                                    >
                                                        <feature.icon size={28} style={{ color: 'white' }} />
                                                    </Box>
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            fontWeight: 700, 
                                                            color: isDark ? 'white' : '#1e293b',
                                                            mb: 1,
                                                            transition: 'color 0.5s'
                                                        }}
                                                    >
                                                        {feature.title}
                                                    </Typography>
                                                    <Typography 
                                                        sx={{ 
                                                            color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                                                            mb: 2,
                                                            transition: 'color 0.5s'
                                                        }}
                                                    >
                                                        {feature.description}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            color: feature.color,
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <span>כניסה ←</span>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ) : (
                                        <Card
                                            sx={{
                                                p: 3,
                                                height: '100%',
                                                background: isDark 
                                                    ? 'rgba(255, 255, 255, 0.02)' 
                                                    : 'white',
                                                border: isDark 
                                                    ? '1px solid rgba(255, 255, 255, 0.05)' 
                                                    : '1px solid #e2e8f0',
                                                opacity: 0.6,
                                                cursor: 'not-allowed'
                                            }}
                                        >
                                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                                <Box
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        bgcolor: feature.color,
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mb: 2,
                                                        opacity: 0.5
                                                    }}
                                                >
                                                    <feature.icon size={28} style={{ color: 'white' }} />
                                                </Box>
                                                <Typography 
                                                    variant="h6" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        color: isDark ? 'white' : '#1e293b',
                                                        mb: 1 
                                                    }}
                                                >
                                                    {feature.title}
                                                </Typography>
                                                <Typography 
                                                    sx={{ 
                                                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#475569',
                                                        mb: 2 
                                                    }}
                                                >
                                                    {feature.description}
                                                </Typography>
                                                <Box 
                                                    sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 1, 
                                                        color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8',
                                                        fontWeight: 500 
                                                    }}
                                                >
                                                    <span>בקרוב...</span>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )}
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Admin Section */}
                    {isAdmin && (
                        <Box sx={{ mt: 6 }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 700, 
                                        color: isDark ? 'white' : '#1e293b',
                                        mb: 3,
                                        transition: 'color 0.5s'
                                    }}
                                >
                                    🛡️ אזור מנהל
                                </Typography>
                            </motion.div>
                            <Grid container spacing={3}>
                                {adminFeatures.map((feature, index) => (
                                    <Grid item xs={12} md={6} lg={4} key={feature.title}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 + index * 0.1 }}
                                            style={{ height: '100%' }}
                                        >
                                            <Link to={feature.path} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                                                <Card
                                                    sx={{
                                                        p: 3,
                                                        height: '100%',
                                                        background: isDark
                                                            ? 'rgba(139, 92, 246, 0.1)'
                                                            : 'rgba(239, 246, 255, 0.5)',
                                                        backdropFilter: 'blur(20px)',
                                                        border: isDark
                                                            ? '2px solid rgba(139, 92, 246, 0.3)'
                                                            : '2px solid #bfdbfe',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                                        '&:hover': {
                                                            transform: 'translateY(-4px)',
                                                            boxShadow: isDark
                                                                ? '0 20px 40px rgba(139, 92, 246, 0.3)'
                                                                : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                            borderColor: isDark ? 'rgba(139, 92, 246, 0.5)' : '#93c5fd',
                                                            '& .icon-wrapper': {
                                                                transform: 'scale(1.1) rotate(5deg)'
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                                        <Box
                                                            className="icon-wrapper"
                                                            sx={{
                                                                width: 56,
                                                                height: 56,
                                                                bgcolor: feature.color,
                                                                borderRadius: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                mb: 2,
                                                                transition: 'transform 0.3s',
                                                                boxShadow: `0 8px 24px ${feature.color}40`
                                                            }}
                                                        >
                                                            <feature.icon size={28} style={{ color: 'white' }} />
                                                        </Box>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontWeight: 700, 
                                                                color: isDark ? 'white' : '#1e293b',
                                                                mb: 1,
                                                                transition: 'color 0.5s'
                                                            }}
                                                        >
                                                            {feature.title}
                                                        </Typography>
                                                        <Typography 
                                                            sx={{ 
                                                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
                                                                mb: 2,
                                                                transition: 'color 0.5s'
                                                            }}
                                                        >
                                                            {feature.description}
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                color: feature.color,
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            <span>כניסה ←</span>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Container>
            </Box>

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
                    position: absolute;
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
                    animation-delay: 0s;
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
                    position: absolute;
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