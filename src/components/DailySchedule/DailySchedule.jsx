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
// Status configuration (numeric FK)
const statusConfig = {
    1: { label: "ממתין", color: "warning", icon: <AccessTimeIcon fontSize="small" /> },
    2: { label: "שובץ", color: "success", icon: <CheckCircleIcon fontSize="small" /> },
};

const getStatusChip = (lesson) => {
    // תומך בכל שמות השדות הנפוצים
    const statusId =
        Number(lesson?.status ?? lesson?.status_id ?? lesson?.status_type_id) || 1;

    // UX: אם יש חדר משובץ – הצג שובץ (גם אם הסטטוס לא עודכן)
    const effectiveStatus = lesson?.room_number ? 2 : statusId;

    const config = statusConfig[effectiveStatus] || statusConfig[1];

    return (
        <Chip
            label={config.label}
            color={config.color}
            icon={config.icon}
            size="small"
            sx={{ fontWeight: 600 }}
        />
    );
};
const Pill = ({ icon, text, bg, color }) => (
    <Box
        sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.8,
            px: 1.5,
            py: 0.5,
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.85rem',
            bgcolor: bg,
            color,
            whiteSpace: 'nowrap',
        }}
    >
        {icon}
        {text}
    </Box>
);

const StatusBadge = ({ lesson }) => {
    // 1=pending, 2=assigned
    const statusId = Number(lesson?.status) || 1;

    // UX: אם יש חדר – נציג שובץ גם אם הסטטוס נשאר 1
    const effective = lesson?.room_number ? 2 : statusId;

    if (effective === 2) {
        return (
            <Pill
                icon={<CheckCircleIcon fontSize="small" />}
                text="שובץ"
                bg="#DCFCE7"
                color="#065F46"
            />
        );
    }

    return (
        <Pill
            icon={<AccessTimeIcon fontSize="small" />}
            text="ממתין"
            bg="#FEF3C7"
            color="#92400E"
        />
    );
};

const RoomBadge = ({ room }) => {
    if (!room) return <Typography sx={{ color: '#94a3b8' }}>-</Typography>;
    return (
        <Pill
            icon={<span style={{ fontSize: 16 }}>🔑</span>}
            text={`חדר ${room}`}
            bg="#E0E7FF"
            color="#3730A3"
        />
    );
};

const RoomTypeBadge = ({ roomType }) => {
    if (!roomType) return '-';

    const isTeamRoom = roomType === 'צוותי';

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.85rem',
                // bgcolor: isTeamRoom ? '#E0F2FE' : '#ECFEFF',
                // color: isTeamRoom ? '#075985' : '#0F766E',
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ fontSize: 16 }}>
                {isTeamRoom ? '🏠' : '🏢'}
            </span>
            {/* {roomType} */}
        </Box>
    );
};


const ComputerBadge = ({ needComputer }) => {
    return needComputer ? (
        <Pill
            text="💻"

        />
    ) : (
        <Typography sx={{ color: '#94a3b8' }}>-</Typography>
    );
};


const statusStyles = {
    pending: {
        label: 'ממתין',
        bg: '#FEF3C7',
        color: '#92400E',
        icon: <AccessTimeIcon fontSize="small" />,
    },
    assigned: {
        label: 'שובץ',
        bg: '#DCFCE7',
        color: '#065F46',
        icon: <CheckCircleIcon fontSize="small" />,
    },
};






export default function DailySchedule({ classes, teamNameById }) {
    if (!classes || classes.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
                אין שיעורים היום 🎉
            </Typography>
        );
    }

    return (
        <TableContainer
            component={Paper}
            sx={{
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
            }}
        >            <Table sx={{ width: '100%' }}>

                <TableHead>
                    <TableRow sx={{ bgcolor: "#f3f4f6" }}>
                        <TableCell align="center">עבור</TableCell>

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
                                <Typography sx={{ direction: 'rtl' }}>
                                    {teamNameById?.[String(lesson.team_id)] || '-'}
                                </Typography>
                            </TableCell>

                            <TableCell align="center">
                                {lesson.start_time?.slice(0, 5)} - {lesson.end_time?.slice(0, 5)}
                            </TableCell>


                            <TableCell align="center">
                                <RoomTypeBadge roomType={lesson.room_type?.name || '-'} />
                            </TableCell>


                            <TableCell align="center">
                                <ComputerBadge needComputer={lesson.need_computer} />
                            </TableCell>

                            <TableCell align="center">
                                <StatusBadge lesson={lesson} />
                            </TableCell>

                            <TableCell align="center">
                                <RoomBadge room={lesson.room_number} />
                            </TableCell>

                            <TableCell align="center">
                                <Typography
                                    sx={{
                                        maxWidth: 220,
                                        mx: 'auto',
                                        fontSize: '0.9rem',
                                        color: '#334155',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        direction: 'rtl',
                                    }}
                                    title={lesson.notes || ''}
                                >
                                    {lesson.notes || '-'}
                                </Typography>
                            </TableCell>
                        </TableRow>

                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
