import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Card,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Grid,
  Container,
  Paper,
  TableContainer,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  AutoFixHigh as Wand2Icon,
  CalendarMonth as CalendarIcon,
  VpnKey as KeyIcon,
  Refresh as RefreshCwIcon,
  Warning as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Delete as Trash2Icon,
  Security as ShieldIcon,
} from "@mui/icons-material";
import { supabase } from "../../lib/supabaseClient";

const KeysAllocator = () => {
  // Mock user data
  const user = {
    email: "admin@example.com",
    roles: ["admin"],
    platoon_name: "פלוגה א",
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem("keysAllocatorDate");
    return savedDate || new Date().toISOString().split("T")[0];
  });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allKeys, setAllKeys] = useState([]);
  const [lessons, setLessons] = useState([]);

  // Save selected date to localStorage
  useEffect(() => {
    localStorage.setItem("keysAllocatorDate", selectedDate);
  }, [selectedDate]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch available keys
        const { data: keysData, error: keysError } = await supabase
          .from("keysmanager_keys")
          .select(
            `id, room_number, room_type_id, has_computers, room_type(name)`,
          )
          .eq("status", "available");

        if (keysError) throw keysError;
        console.log("Fetched keys data:", keysData);
        const formattedKeys = keysData.map((key) => ({
          id: key.id,
          room_number: key.room_number,
          room_type: key.room_type?.name || "unknown",
          has_computers: key.has_computers,
        }));

        setAllKeys(formattedKeys);

        // 2. Fetch lessons with JOINS for Team and Room Type names
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("schedule_lessons")
          .select(
            `
          id,
          start_time,
          end_time,
          status,
          date,
          room_number,
          need_computer,
          needed_room_type_id,
          group_node(name),
          room_type:needed_room_type_id(name)
        `,
          )
          .eq("date", selectedDate);

        if (lessonsError) throw lessonsError;

        const formattedLessons = lessonsData.map((lesson) => ({
          id: lesson.id,
          team_name: lesson.group_node?.name || "Unknown", // Replaced crew/pluga with unified name
          start_time: lesson.start_time,
          end_time: lesson.end_time,
          room_type_needed: lesson.room_type?.name || "Unknown",
          needs_computers: lesson.need_computer,
          status: lesson.status,
          assigned_key: lesson.room_number,
          date: lesson.date,
        }));

        setLessons(formattedLessons);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  const isAdmin = user.roles.includes("admin");

  const toggleKeySelection = (keyId) => {
    setSelectedKeys((prev) =>
      prev.includes(keyId)
        ? prev.filter((id) => id !== keyId)
        : [...prev, keyId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === allKeys.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allKeys.map((k) => k.id));
    }
  };

  const toggleLessonSelection = (lessonId) => {
    setSelectedLessons((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId],
    );
  };

  const toggleSelectAllLessons = () => {
    const allIds = allItemsToDisplay.map((l) => l.id);
    if (selectedLessons.length === allIds.length) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons(allIds);
    }
  };
  /////////////////////////////////////////////////////////////
  const allocateKeys = async () => {
    setIsAllocating(true);
    console.log("Allocating keys...");

    // Get lessons to allocate (selected ones or all pending)
    const lessonsToAllocate =
      selectedLessons.length > 0
        ? lessons.filter((l) => selectedLessons.includes(l.id))
        : lessons.filter((l) => l.status === "pending");

    if (lessonsToAllocate.length === 0) {
      setIsAllocating(false);
      alert("אין שיעורים לשבץ");
      return;
    }

    // Available keys from selected
    let availableKeys = allKeys.filter((k) => selectedKeys.includes(k.id));

    if (availableKeys.length === 0) {
      setIsAllocating(false);
      alert("אין מפתחות זמינים לשיבוץ");
      return;
    }

    //// Allocation algorithm

    // Sort lessons by priority
    const sortedLessons = [...lessonsToAllocate].sort((a, b) => {
      // 1. Platoon rooms (פלוגתי) first
      const aIsPlatoonRoom = a.room_type_needed === "פלוגתי" ? 0 : 1;
      const bIsPlatoonRoom = b.room_type_needed === "פלוגתי" ? 0 : 1;
      if (aIsPlatoonRoom !== bIsPlatoonRoom)
        return aIsPlatoonRoom - bIsPlatoonRoom;

      // 2. Lessons requiring computers
      const aHasComputers = a.needs_computers ? 0 : 1;
      const bHasComputers = b.needs_computers ? 0 : 1;
      if (aHasComputers !== bHasComputers) return aHasComputers - bHasComputers;

      // 3. Earlier lessons
      return a.start_time.localeCompare(b.start_time);
    });

    const allocations = {};

    // Allocate keys to lessons
    for (const lesson of sortedLessons) {
      if (availableKeys.length === 0) break;

      // Score each available key
      let bestKey = null;
      let bestScore = -1;

      for (const key of availableKeys) {
        let score = 0;

        // Check if room type matches
        if (key.room_type !== lesson.room_type_needed) {
          // Can upgrade צוותי to פלוגתי if needed
          if (
            lesson.room_type_needed === "צוותי" &&
            key.room_type === "פלוגתי"
          ) {
            score += 50; // Upgrade is acceptable but not preferred
          } else if (
            lesson.room_type_needed === "פלוגתי" &&
            key.room_type === "צוותי"
          ) {
            score -= 100; // Downgrade not allowed
          } else {
            score -= 100;
          }
        } else {
          score += 100; // Perfect room type match
        }

        // Check if computer requirement is met
        if (lesson.needs_computers && !key.has_computers) {
          score -= 50;
        } else if (lesson.needs_computers && key.has_computers) {
          score += 50;
        }

        // Check crew affinity (has this crew used this room before today)
        const crewUsedThisRoom = Object.values(allocations).some(
          (alloc) =>
            alloc.crew_name === lesson.crew_name &&
            alloc.assigned_key === key.room_number,
        );
        if (crewUsedThisRoom) {
          score += 200; // Strong preference for crew consistency
        }

        // Check platoon affinity
        const platoonUsedThisRoom = Object.values(allocations).some(
          (alloc) =>
            alloc.platoon_name === lesson.platoon_name &&
            alloc.assigned_key === key.room_number,
        );
        if (platoonUsedThisRoom) {
          score += 150; // Strong preference for platoon consistency
        }

        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }

      // Allocate the best key to this lesson
      if (bestKey && bestScore >= -50) {
        allocations[lesson.id] = {
          ...lesson,
          assigned_key: bestKey.room_number,
          status: "assigned",
        };

        // Remove used key from available
        availableKeys = availableKeys.filter((k) => k.id !== bestKey.id);
        console.log(
          `Allocated room ${bestKey.room_number} to ${lesson.crew_name} (${lesson.start_time}-${lesson.end_time})`,
        );
      }
    }

    // Simulate allocation delay
    setTimeout(() => {
      console.log("Allocation complete:", allocations);
      setIsAllocating(false);
      setSelectedKeys([]);
      setSelectedLessons([]);
      alert(
        `שיבוץ הושלם בהצלחה! ${Object.keys(allocations).length} שיעורים שובצו`,
      );
    }, 1500);
  };

  const resetAllocations = () => {
    if (window.confirm("האם למחוק את כל ההקצאות?")) {
      console.log("Resetting allocations...");
      alert("ההקצאות אופסו");
    }
  };

  const handleDelete = (lessonId) => {
    console.log("Deleting lesson:", lessonId);
    alert("שיעור נמחק");
  };

  const handleDeleteAll = () => {
    if (window.confirm("האם למחוק את כל השיעורים?")) {
      console.log("Deleting all lessons...");
      alert("כל השיעורים נמחקו");
    }
  };

  const handleManualAssign = async (lessonId, roomNumber) => {
    try {
      const updateValue = roomNumber === "unassign" ? null : roomNumber;

      const { error } = await supabase
        .from("schedule_lessons")
        .update({
          room_number: updateValue,
          status: roomNumber === "unassign" ? "pending" : "assigned",
        })
        .eq("id", lessonId);

      if (error) throw error;

      // Update local state
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                assigned_key: updateValue,
                status: roomNumber === "unassign" ? "pending" : "assigned",
              }
            : lesson,
        ),
      );

      if (roomNumber === "unassign") {
        alert("הקצאה בוטלה");
      } else {
        alert(`חדר ${roomNumber} הוקצה בהצלחה`);
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("שגיאה בעדכון ההקצאה");
    }
  };

  // Combine lessons and special requests for display
  const allItemsToDisplay = [...lessons].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );

  const pendingCount = lessons.filter((l) => l.status === "pending").length;
  const assignedCount = lessons.filter((l) => l.status === "assigned").length;
  // const specialRequestsCount = specialRequests.length;
  ///////////////////////////////////////////////////////////////////
  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        dir="rtl"
      >
        <Card sx={{ p: 4, textAlign: "center", maxWidth: 500 }}>
          <ShieldIcon sx={{ fontSize: 64, color: "#f87171", mb: 2 }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}
          >
            אין הרשאת גישה
          </Typography>
          <Typography variant="body1" sx={{ color: "#475569" }}>
            רק מנהלי מערכת יכולים לגשת להקצאת מפתחות
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, #f8fafc, #ffffff, #f1f5f9)",
      }}
      dir="rtl"
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}
          >
            הקצאת מפתחות 🎯
          </Typography>
        </Box>

        {/* Date and Actions */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              תאריך:
            </Typography>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="small"
              sx={{ width: "auto" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              startIcon={
                isAllocating ? <CircularProgress size={16} /> : <Wand2Icon />
              }
              onClick={allocateKeys}
              disabled={
                selectedKeys.length === 0 || pendingCount === 0 || isAllocating
              }
              sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
            >
              {selectedLessons.length > 0
                ? `שבץ ${selectedLessons.length} נבחרים`
                : "שבץ אוטומטית"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshCwIcon />}
              onClick={resetAllocations}
              disabled={assignedCount === 0}
            >
              אפס הקצאות
            </Button>
            <Button
              variant="outlined"
              startIcon={<Trash2Icon />}
              onClick={handleDeleteAll}
              disabled={lessons.length === 0}
              sx={{
                color: "#dc2626",
                borderColor: "#dc2626",
                "&:hover": { bgcolor: "#fef2f2", borderColor: "#dc2626" },
              }}
            >
              מחק הכל
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ p: 2, bgcolor: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <Typography variant="body2" sx={{ color: "#16a34a", mb: 0.5 }}>
                שובצו
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#15803d" }}
              >
                {assignedCount}/{lessons.length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ p: 2, bgcolor: "#eff6ff", borderColor: "#bfdbfe" }}>
              <Typography variant="body2" sx={{ color: "#2563eb", mb: 0.5 }}>
                מפתחות זמינים
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#1d4ed8" }}
              >
                {selectedKeys.length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ p: 2, bgcolor: "#eef2ff", borderColor: "#c7d2fe" }}>
              <Typography variant="body2" sx={{ color: "#4f46e5", mb: 0.5 }}>
                שיעורים נבחרים
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "#4338ca" }}
              >
                {selectedLessons.length}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Available Keys Selection */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, border: "1px solid #e2e8f0" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <KeyIcon sx={{ fontSize: 20, color: "#475569" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    בחר מפתחות זמינים
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={toggleSelectAll}
                >
                  {selectedKeys.length === allKeys.length
                    ? "בטל הכל"
                    : "בחר הכל"}
                </Button>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  maxHeight: 500,
                  overflowY: "auto",
                }}
              >
                {allKeys.map((key) => (
                  <Paper
                    key={key.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      border: "1px solid #e2e8f0",
                      "&:hover": { bgcolor: "#f8fafc" },
                    }}
                  >
                    <Checkbox
                      checked={selectedKeys.includes(key.id)}
                      onChange={() => toggleKeySelection(key.id)}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#334155", mb: 0.5 }}
                      >
                        חדר {key.room_number}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                          label={`${key.room_type === "פלוגתי" ? "🏢" : "🏠"} ${key.room_type}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                        {key.has_computers && (
                          <Chip label="💻" size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Lessons List */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e2e8f0",
                  bgcolor: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 20, color: "#475569" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    לוח זמנים שיעורים
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={toggleSelectAllLessons}
                >
                  {selectedLessons.length === allItemsToDisplay.length
                    ? "בטל הכל"
                    : "בחר הכל"}
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        ✓
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        שעה
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        קבוצה
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        סוג
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        💻
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        סטטוס
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        חדר
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        הקצאה ידנית
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        מחק
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : allItemsToDisplay.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          align="center"
                          sx={{ py: 4, color: "#94a3b8" }}
                        >
                          אין שיעורים או בקשות מתוכננים לתאריך זה
                        </TableCell>
                      </TableRow>
                    ) : (
                      allItemsToDisplay.map((lesson) => (
                        <TableRow
                          key={lesson.id}
                          sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                        >
                          <TableCell align="center">
                            <Checkbox
                              checked={selectedLessons.includes(lesson.id)}
                              onChange={() => toggleLessonSelection(lesson.id)}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                            }}
                          >
                            {lesson.start_time}-{lesson.end_time}
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {lesson.team_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                lesson.room_type_needed === "פלוגתי"
                                  ? "🏢"
                                  : "🏠"
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {lesson.needs_computers ? "✅" : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {lesson.status === "assigned" ? (
                              <CheckCircleIcon
                                sx={{ fontSize: 16, color: "#16a34a" }}
                              />
                            ) : (
                              <AlertTriangleIcon
                                sx={{ fontSize: 16, color: "#ca8a04" }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {lesson.assigned_key ? (
                              <Chip
                                label={lesson.assigned_key}
                                size="small"
                                sx={{ bgcolor: "#d1fae5", color: "#065f46" }}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{ color: "#94a3b8" }}
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={lesson.assigned_key || ""}
                                onChange={(e) =>
                                  handleManualAssign(lesson.id, e.target.value)
                                }
                                displayEmpty
                              >
                                <MenuItem value="" disabled>
                                  {"בחר חדר"}
                                </MenuItem>
                                {lesson.assigned_key && (
                                  <MenuItem
                                    value="unassign"
                                    sx={{ color: "#dc2626" }}
                                  >
                                    ❌ בטל הקצאה
                                  </MenuItem>
                                )}
                                {allKeys.map((key) => (
                                  <MenuItem
                                    key={key.id}
                                    value={key.room_number}
                                  >
                                    {key.room_type === "פלוגתי" ? "🏢" : "🏠"}{" "}
                                    חדר {key.room_number}
                                    {key.has_computers && " 💻"}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(lesson.id)}
                              sx={{
                                color: "#f87171",
                                "&:hover": {
                                  color: "#dc2626",
                                  bgcolor: "#fef2f2",
                                },
                              }}
                            >
                              <Trash2Icon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>

        {/* Priority Info */}
        <Alert
          severity="info"
          sx={{ mt: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: "#1e3a8a", mb: 1 }}
          >
            סדר עדיפויות הקצאה:
          </Typography>
          <Box
            component="ol"
            sx={{ pl: 2, m: 0, color: "#1e40af", fontSize: "0.875rem" }}
          >
            <li>
              <strong>שימור כיתות לצוות</strong> - צוות שקיבל כיתה מסוימת ישאר
              איתה לאורך היום
            </li>
            <li>
              <strong>שימור כיתות לפלוגה</strong> - העדפה לאותה כיתה שהפלוגה
              השתמשה בה
            </li>
            <li>
              <strong>שימור אזור</strong> - העדפה לכיתות באותו אזור פיזי
            </li>
            <li>שיעורים מוקדמים יותר מקבלים עדיפות</li>
            <li>חדרים פלוגתיים משובצים ראשונים</li>
            <li>שיעורים שדורשים מחשבים מקבלים עדיפות על פני אלו שלא</li>
            <li>בקשות לחדרים צוותיים עשויות לקבל שדרוג לפלוגתי במידת הצורך</li>
            <li>
              <strong>בקשות מיוחדות מקבלות עדיפות נמוכה</strong> - משובצות
              אחרונות
            </li>
          </Box>
        </Alert>
      </Container>
    </Box>
  );
};

export default KeysAllocator;
