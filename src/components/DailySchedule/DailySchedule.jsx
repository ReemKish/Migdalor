/**
 * DailySchedule.jsx
 *
 * Displays today's daily classes in a styled table.
 * Props:
 * - classes: array of lesson objects fetched from Supabase daily_classes table
 *
 * Example lesson object:
 * {
 *   id,
 *   crew_name,
 *   start_time,
 *   end_time,
 *   room_type_needed,
 *   need_computer,
 *   room_number,
 *   notes,
 *   status
 * }
 */

import React from "react";
import {
    Box,
    Card,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    Chip,
    Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Status configuration
const statusConfig = {
    pending: { label: "ממתין", color: "warning", icon: <AccessTimeIcon fontSize="small" /> },
    assigned: { label: "שובץ", color: "success", icon: <CheckCircleIcon fontSize="small" /> },
    completed: { label: "הושלם", color: "default", icon: <CheckCircleIcon fontSize="small" /> },
    cancelled: { label: "בוטל", color: "error", icon: <CancelIcon fontSize="small" /> },
};

/**
 * Returns a Chip for the lesson status
 */
const getStatusChip = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
        <Chip
            label={config.label}
            color={config.color}
            icon={config.icon}
            size="small"
            sx={{ fontWeight: 500 }}
        />
    );
};

export default function DailySchedule({ classes }) {
    if (!classes || classes.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
                אין שיעורים היום 🎉
            </Typography>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
                <TableHead>
                    <TableRow sx={{ bgcolor: "#f3f4f6" }}>
                        <TableCell align="center">שעה</TableCell>
                        <TableCell align="center">סוג חדר</TableCell>
                        <TableCell align="center">מחשבים</TableCell>
                        <TableCell align="center">סטטוס</TableCell>
                        <TableCell align="center">חדר משובץ</TableCell>
                        <TableCell align="center">הערות</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {classes.map((lesson) => (
                        <TableRow key={lesson.id} hover>
                            <TableCell align="center">
                                {lesson.start_time} - {lesson.end_time}
                            </TableCell>
                            <TableCell align="center">{lesson.room_type_needed || "-"}</TableCell>
                            <TableCell align="center">
                                {lesson.need_computer ? <LaptopMacIcon fontSize="small" /> : "-"}
                            </TableCell>
                            <TableCell align="center">{getStatusChip(lesson.status)}</TableCell>
                            <TableCell align="center">{lesson.room_number || "-"}</TableCell>
                            <TableCell align="center">{lesson.notes || "-"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
