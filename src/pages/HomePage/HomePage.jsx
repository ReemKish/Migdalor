import { Box, Card, Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router'; // שימוש במידע מה-Layout
import { supabase } from 'lib/supabaseClient';

// Components
import UnifiedPlanner from 'components/UnifiedPlanner/UnifiedPlanner';
import DailySchedule from 'components/DailySchedule/DailySchedule';

export default function Home() {
    // שליפת המידע המשותף שהגיע מ-MainLayout
    const { user, isDark, authUserGroupIds } = useOutletContext();
    const [dailyClasses, setDailyClasses] = useState([]);

    // שליפת השיעורים היומיים (לוגיקה ספציפית לעמוד זה)
    useEffect(() => {
        if (!authUserGroupIds) return;

        const today = new Date().toLocaleDateString('en-CA');

        const fetchDailyClasses = async () => {
            const { data, error } = await supabase
                .from('schedule_lessons')
                .select(`
    *,
    room_type:needed_room_type_id ( id, name )
  `)
                .eq('date', today)
                .order('start_time', { ascending: true });

            if (!error && data) setDailyClasses(data);
            else setDailyClasses([]);
        };

        fetchDailyClasses();

        const channel = supabase
            .channel('daily-schedule')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedule_lessons',
                    filter: `date=eq.${today}`
                },
                () => {
                    // כל שינוי היום -> טוען מחדש
                    fetchDailyClasses();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [authUserGroupIds]);
    useEffect(() => {
        if (!authUserGroupIds) return;

        const today = new Date().toLocaleDateString('en-CA');

        const fetchDailyClasses = async () => {
            const { data, error } = await supabase
                .from('schedule_lessons')
                .select('*')
                .eq('date', today)
                .order('start_time', { ascending: true });

            if (!error && data) setDailyClasses(data);
            else setDailyClasses([]);
        };

        fetchDailyClasses();

        const channel = supabase
            .channel('daily-schedule')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'schedule_lessons', filter: `date=eq.${today}` },
                () => fetchDailyClasses()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [authUserGroupIds]);


    // אם עדיין אין משתמש (למרות שה-Layout אמור לטפל בזה), לא נציג כלום או טעינה פשוטה
    if (!user) return null;

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Hero Section - הודעת שלום */}
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
                            textAlign: 'center',
                            direction: 'rtl'
                        }}
                    >
                        שלום {user.full_name} 👋
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                            textAlign: 'center',
                            direction: 'rtl'
                        }}
                    >
                        מגדלור, כאן בשבילך 🙂
                    </Typography>
                    <Typography
                        sx={{
                            color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                            mt: 1,
                            textAlign: 'center',
                            direction: 'rtl'
                        }}
                    >
                        ״כשהאור תמיד דולק, הדרך ברורה.״
                    </Typography>
                </Box>
            </motion.div>

            {/* Missions + Today's Schedule */}
            <Box mt={8}>
                <Grid container spacing={4}>
                    {/* Unified Monthly Planner */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card
                                sx={{
                                    p: 3,
                                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '24px',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 3,
                                        color: isDark ? 'white' : '#1e293b',
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    }}
                                >
                                    📋 משימות חודשיות
                                </Typography>
                                <UnifiedPlanner />
                            </Card>
                        </motion.div>
                    </Grid>

                    {/* Daily Classes for Today */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card
                                sx={{
                                    p: 3,
                                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '24px',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 600,
                                        mb: 3,
                                        color: isDark ? 'white' : '#1e293b',
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    }}
                                >
                                    📅 לו"ז יומי
                                </Typography>
                                <DailySchedule classes={dailyClasses} />
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}