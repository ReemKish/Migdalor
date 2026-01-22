// HomePlannerSection.jsx
// Unified Missions + Calendar (Home Page)
// Google Calendar – Option A: App is source of truth (sync-ready)

import { useEffect, useState } from "react";
import {
    Box,
    Card,
    Chip,
    Grid,
    Typography,
    Divider,
    Button,
} from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { supabase } from "lib/supabaseClient";

/* ---------- Status UI config ---------- */

const statusColors = {
    open: "info",
    in_progress: "warning",
    late: "error",
    done: "success",
};

const statusLabels = {
    open: "פתוחה",
    in_progress: "בתהליך",
    late: "באיחור",
    done: "הושלמה",
};

/* ---------- Status logic ---------- */

const getTaskStatus = (isTaskDone, taskDueDate) => {
    if (isTaskDone) return "done";

    if (!taskDueDate) return "open";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(taskDueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) return "late";

    return "in_progress";
};

/* ---------- Component ---------- */

export default function UnifiedPlanner() {
    const [missions, setMissions] = useState([]);
    const [googleConnected, setGoogleConnected] = useState(false);

    useEffect(() => {
        const fetchUserTasks = async () => {
            const { data: authData, error } = await supabase.auth.getUser();
            if (error || !authData?.user) return;

            const { data, error: error2 } = await supabase
                .from("tasks")
                .select(
                    `
          id,
          title,
          due_date,
          is_done
        `
                )
                .eq("assignee_id", authData.user.id)
                .order("due_date", { ascending: true });

            if (error2) {
                console.error("Error fetching tasks:", error2);
                return;
            }

            const mappedTasks = data.map((task) => ({
                id: task.id,
                title: task.title,
                due_date: task.due_date,
                status: getTaskStatus(task.is_done, task.due_date),
            }));

            setMissions(mappedTasks);
        };

        fetchUserTasks();

        // TODO: fetch Google connection status from Supabase
        setGoogleConnected(false);
    }, []);

    /* ---------- Calendar events ---------- */

    const calendarEvents = missions.map((m) => ({
        id: `mission-${m.id}`,
        title: `📝 ${m.title}`,
        date: m.due_date,
        color: m.status === "late" ? "#ef4444" : "#6366f1", // red if late
    }));

    const connectGoogleCalendar = async () => {
        // Supabase Edge Function OAuth entry
        window.location.href = "/functions/google-calendar-auth";
    };

    return (
        <Box mt={10}>
            {/* Header */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >
                <Typography variant="h5" fontWeight={700}>
                    🗓️ יומן ומשימות
                </Typography>

                {!googleConnected && (
                    <Button variant="outlined" onClick={connectGoogleCalendar}>
                        חיבור ליומן Google
                    </Button>
                )}
            </Box>

            <Grid container spacing={4}>
                {/* Missions – horizontal list */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ p: 3 }}>
                        <Typography fontWeight={700} mb={2}>
                            משימות קרובות
                        </Typography>

                        {missions.length === 0 && (
                            <Typography color="text.secondary">
                                אין משימות פעילות 🎉
                            </Typography>
                        )}

                        {missions.map((m, i) => (
                            <Box key={m.id}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    py={1.5}
                                    sx={{
                                        borderLeft:
                                            m.status === "late"
                                                ? "4px solid #ef4444"
                                                : "4px solid transparent",
                                        pl: 1.5,
                                    }}
                                >
                                    <Typography fontWeight={500}>{m.title}</Typography>

                                    <Box display="flex" gap={1.5} alignItems="center">
                                        <Chip
                                            size="small"
                                            label={statusLabels[m.status]}
                                            color={statusColors[m.status]}
                                        />
                                        <Typography fontSize={13} color="text.secondary">
                                            {m.due_date ?? "ללא תאריך"}
                                        </Typography>
                                    </Box>
                                </Box>

                                {i < missions.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </Card>
                </Grid>

                {/* Calendar */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ p: 2 }}>
                        <FullCalendar
                            plugins={[dayGridPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            height="auto"
                        />
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
