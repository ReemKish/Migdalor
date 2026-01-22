import { Box, Card, Chip, Typography } from "@mui/material";

// DailySchedule Component
export default function DailySchedule({ classes }) {
    if (!classes || classes.length === 0) {
        return (
            <Box mt={2}>
                <Typography textAlign="center" color="text.secondary">
                    אין שיעורים היום
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={2}>
            {classes.map((cls) => (
                <Grid item xs={12} sm={6} key={cls.id}>
                    <Card
                        sx={{
                            p: 2,
                            bgcolor: cls.need_computer ? "#fff7ed" : "#f0f9ff",
                            borderLeft: `4px solid ${cls.need_computer ? "#f97316" : "#0284c7"
                                }`,
                        }}
                    >
                        <Typography fontWeight={600} variant="subtitle1">
                            {cls.notes || "שיעור ללא שם"}
                        </Typography>
                        <Typography fontSize={14} color="text.secondary">
                            {cls.start_time} - {cls.end_time}
                        </Typography>
                        <Typography fontSize={14}>
                            חדר: {cls.room_number || "לא מוגדר"}
                        </Typography>
                        {cls.need_computer && (
                            <Chip
                                label="צריך מחשב"
                                size="small"
                                sx={{ mt: 1, bgcolor: "#fef3c7", color: "#b45309" }}
                            />
                        )}
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}
