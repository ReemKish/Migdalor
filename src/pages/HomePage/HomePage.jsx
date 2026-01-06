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
    Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabaseClient';

export default function Home() {
    const [user, setUser] = useState(null);
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

    if (user === null) return <p> Loading... </p>

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
            color: '#3bf660ff',
            available: true
        },
        {
            title: 'ניהול כללי של מפתחות',
            description: 'מקום לעקוב אחר מפתחות',
            icon: Key,
            path: '/ManageKeys',
            color: '#f3f63bff',
            available: true
        },
        {
            title: 'לו"ז',
            description: 'מה הלו"ז?',
            icon: Notebook,
            path: '/Schedule',
            color: '#f63b3bff',
            available: true
        },
    ];

    const adminFeatures = [
        {
            title: 'ניהול משתמשים',
            description: 'צפייה ועריכת משתמשים במערכת',
            icon: Settings,
            path: '/manage-users',
            available: isAdmin
        },
        {
            title: 'ייצוא נתונים',
            description: 'ייצוא נתונים ל-PostgreSQL/Supabase',
            icon: Database,
            path: '/data-export',
            available: isAdmin
        }
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)'
            }}
            dir="rtl"
        >
            {/* Top Navigation */}
            <AppBar
                position="sticky"
                sx={{
                    bgcolor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    boxShadow: 'none'
                }}
            >
                <Toolbar sx={{ maxWidth: '1280px', width: '100%', mx: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Box
                                component="img"
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/9732960ed_8.png"
                                alt="מגדלור לוגו"
                                sx={{ width: 48, height: 48, objectFit: 'contain' }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                מגדלור
                            </Typography>
                        </Link>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 6 }}>
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

                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>
                            שלום {user.full_name} 👋
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#475569' }}>
                            מגדלור, כאן בשבילך 🙂
                        </Typography>
                        <Typography sx={{ color: '#64748b', mt: 1 }}>״כשהאור תמיד דולק, הדרך ברורה.״</Typography>
                    </Box>
                </motion.div>

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
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                    '& .icon-wrapper': {
                                                        transform: 'scale(1.1)'
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
                                                        transition: 'transform 0.3s'
                                                    }}
                                                >
                                                    <feature.icon size={28} style={{ color: 'white' }} />
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                                    {feature.title}
                                                </Typography>
                                                <Typography sx={{ color: '#475569', mb: 2 }}>
                                                    {feature.description}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        color: '#6366f1',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <span>כניסה</span>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ) : (
                                    <Card
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            border: '1px solid #e2e8f0',
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
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                                {feature.title}
                                            </Typography>
                                            <Typography sx={{ color: '#475569', mb: 2 }}>
                                                {feature.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', fontWeight: 500 }}>
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
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
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
                                                    border: '2px solid #bfdbfe',
                                                    bgcolor: 'rgba(239, 246, 255, 0.3)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s',
                                                    '&:hover': {
                                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                        borderColor: '#93c5fd',
                                                        '& .icon-wrapper': {
                                                            transform: 'scale(1.1)'
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
                                                            bgcolor: '#2563eb',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mb: 2,
                                                            transition: 'transform 0.3s'
                                                        }}
                                                    >
                                                        <feature.icon size={28} style={{ color: 'white' }} />
                                                    </Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                                        {feature.title}
                                                    </Typography>
                                                    <Typography sx={{ color: '#475569', mb: 2 }}>
                                                        {feature.description}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            color: '#2563eb',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <span>כניסה</span>
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
    );
}
