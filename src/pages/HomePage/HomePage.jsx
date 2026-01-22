/**
 * HomePage.jsx
 * 
 * Main landing page after login.
 * Shows:
 * 1. Greeting + user info
 * 2. Site navigation
 * 3. Missions (monthly tasks) via UnifiedPlanner
 * 4. Daily classes schedule for today
 * 5. Username editing and logout functionality
 */

import {
    AppBar,
    Box,
    Card,
    Container,
    Grid,
    IconButton,
    Toolbar,
    Typography,
} from "@mui/material";
import { Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";

// Components
import UnifiedPlanner from "components/UnifiedPlanner/UnifiedPlanner";
import DailySchedule from "components/DailySchedule/DailySchedule";

const getAllGroupIds = (mainGroupId) => {
    // TODO: add the group's parent groups as well to the array.
    return [mainGroupId]
}

export default function HomePage() {
    // ---------- STATE ----------
    const [user, setUser] = useState(null);           // Authenticated user info
    const [authUserId, setAuthUserId] = useState(null);
    const [authUserGroupIds, setAuthUserGroupIds] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [dailyClasses, setDailyClasses] = useState([]); // Today’s lessons

    const navigate = useNavigate();

    // ---------- EFFECT 1: FETCH USER DATA ----------
    useEffect(() => {
        const fetchUser = async () => {
            const { data: authData, error } = await supabase.auth.getUser();
            if (error || !authData?.user) return;

            setAuthUserId(authData.user.id);
            setAuthUserGroupIds(getAllGroupIds(authData.user.group_id));

            // Fetch user record and roles
            const { data, error: error2 } = await supabase
                .from("users")
                .select(`full_name, roles!user_roles(name)`)
                .eq("id", authData.user.id)
                .single();

            if (!error2 && data) {
                setUser({
                    full_name: data.full_name,
                    site_roles: data.roles?.map((r) => r.name) ?? [],
                });
                setNewName(data.full_name);
            } else {
                console.error("Error fetching user data:", error2);
            }
        };

        fetchUser();
    }, []);

    // ---------- EFFECT 2: FETCH TODAY'S DAILY CLASSES ----------
    useEffect(() => {
        const fetchDailyClasses = async () => {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
            const { data, error } = await supabase
                .from("schedule_lessons")
                .select("*")
                .eq("date", today)
                .in("id", authUserGroupIds)
                .order("start_time", { ascending: true });

            if (!error) setDailyClasses(data);
            else console.error("Error fetching daily classes:", error);
        };

        fetchDailyClasses();
    }, []);

    // ---------- HANDLER: UPDATE USER NAME ----------
    const updateName = async () => {
        if (!authUserId) return;

        const { error } = await supabase
            .from("users")
            .update({ full_name: newName })
            .eq("id", authUserId);

        if (!error) {
            setUser((prev) => ({ ...prev, full_name: newName }));
            setEditingName(false);
        }
    };

    // ---------- HANDLER: LOGOUT ----------
    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    if (!user) return <p>Loading...</p>;

    const isAdmin = user.site_roles.includes("Admin");

    // ---------- SITE NAVIGATION SECTIONS ----------
    const siteSections = [
        { title: "לוח בקרה", path: "/Dashboard" },
        { title: "לו\"ז", path: "/Schedule" },
        { title: "ניהול מפתחות", path: "/ManageKeys" },
        { title: "הקצאת מפתחות", path: "/AllocateKeys" },
    ];

    return (
        <Box minHeight="100vh" dir="rtl" bgcolor="#f8fafc">
            {/* Top App Bar */}
            <AppBar
                position="sticky"
                sx={{
                    bgcolor: "white",
                    boxShadow: "none",
                    borderBottom: "1px solid #e5e7eb",
                }}
            >
                <Toolbar sx={{ maxWidth: 1280, mx: "auto", width: "100%" }}>
                    {/* RIGHT: Logo */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            component="img"
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/9732960ed_8.png"
                            alt="logo"
                            sx={{ width: 40 }}
                        />
                        <Typography fontWeight={700}>מגדלור</Typography>
                    </Box>

                    {/* CENTER: Site Sections */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: "flex",
                            justifyContent: "center",
                            gap: 3,
                        }}
                    >
                        {siteSections.map((section) => (
                            <Link
                                key={section.title}
                                to={section.path}
                                style={{ textDecoration: "none" }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        color: "#1e293b",
                                        "&:hover": { color: "#2563eb" },
                                    }}
                                >
                                    {section.title}
                                </Typography>
                            </Link>
                        ))}
                    </Box>

                    {/* LEFT: Settings + Logout */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton onClick={() => setEditingName(true)}>
                            <Settings size={20} />
                        </IconButton>

                        <IconButton onClick={logout}>
                            <LogOut size={20} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 6 }}>
                {/* Greeting Section */}
                <Box textAlign="center" mb={6}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                        <Typography variant="h3" fontWeight={700}>
                            שלום {user.full_name}
                        </Typography>

                        <Typography
                            sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "999px",
                                fontSize: 14,
                                bgcolor: isAdmin ? "#fee2e2" : "#e0f2fe",
                                color: isAdmin ? "#991b1b" : "#075985",
                            }}
                        >
                            {user.site_roles?.join(", ")}
                        </Typography>
                    </Box>
                </Box>

                {/* Username Edit Section */}
                {editingName && (
                    <Box maxWidth={400} mx="auto" mb={6}>
                        <Card sx={{ p: 3 }}>
                            <Typography fontWeight={600} mb={2}>
                                ✏️ שינוי שם משתמש
                            </Typography>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 8,
                                    borderRadius: 6,
                                    border: "1px solid #cbd5f5",
                                }}
                            />
                            <Box mt={2} display="flex" gap={1}>
                                <button onClick={updateName}>שמור</button>
                                <button onClick={() => setEditingName(false)}>ביטול</button>
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* Missions + Today’s Schedule */}
                <Box mt={8}>
                    <Grid container spacing={4}>
                        {/* Unified Monthly Planner */}
                        <Grid item xs={12} md={6}>
                            <UnifiedPlanner />
                        </Grid>

                        {/* Daily Classes for Today */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5" fontWeight={600} mb={2}>
                                לו"ז יומי
                            </Typography>
                            <DailySchedule classes={dailyClasses} />
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
}
