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
    const [teamNameById, setTeamNameById] = useState({});

    const fetchTeamsMap = async () => {
        const { data, error } = await supabase
            .from('group_node')
            .select('id,name')
            .eq('group_type_id', 4);

        if (error) {
            console.error('Error fetching teams map:', error);
            return;
        }

        const map = {};
        (data || []).forEach(t => { map[String(t.id)] = t.name; });
        setTeamNameById(map);
    };

    // Load team names mapping
    useEffect(() => {
        fetchTeamsMap();
    }, []);
    useEffect(() => {
        if (!user?.group_id) return;

        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD מקומי

        const fetchDailyClassesForMyCompany = async () => {
            try {
                // 1) הצוות שלי -> להביא parent_id (פלוגה)
                const { data: myTeam, error: teamErr } = await supabase
                    .from('group_node')
                    .select('id, parent_id')
                    .eq('id', user.group_id)
                    .single();

                if (teamErr) throw teamErr;

                const companyId = myTeam?.parent_id ? String(myTeam.parent_id) : null;
                if (!companyId) {
                    setDailyClasses([]);
                    return;
                }

                // 2) להביא את כל הצוותים של הפלוגה
                const { data: companyTeams, error: teamsErr } = await supabase
                    .from('group_node')
                    .select('id')
                    .eq('group_type_id', 4)       // צוות
                    .eq('parent_id', companyId);  // שייכים לפלוגה

                if (teamsErr) throw teamsErr;

                const teamIds = (companyTeams || []).map(t => String(t.id));
                if (teamIds.length === 0) {
                    setDailyClasses([]);
                    return;
                }

                // 3) להביא שיעורים רק לצוותים האלה
                const { data, error } = await supabase
                    .from('schedule_lessons')
                    .select(`
          *,
          room_type:needed_room_type_id ( id, name )
        `)
                    .eq('date', today)
                    .in('team_id', teamIds)
                    .order('start_time', { ascending: true });

                if (error) throw error;

                setDailyClasses(data || []);
            } catch (e) {
                console.error('Error fetching daily classes for company:', e);
                setDailyClasses([]);
            }
        };

        fetchDailyClassesForMyCompany();
    }, [user?.group_id]);

    // אם עדיין אין משתמש (למרות שה-Layout אמור לטפל בזה), לא נציג כלום או טעינה פשוטה
    if (!user) return null;

    return (
        <Container maxWidth={false} sx={{ px: 4, py: 6 }}>
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
                                    width: '100%',

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
                                <DailySchedule classes={dailyClasses} teamNameById={teamNameById} />
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}