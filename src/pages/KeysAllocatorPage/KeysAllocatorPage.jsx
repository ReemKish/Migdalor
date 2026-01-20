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
  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem("keysAllocatorDate");
    return savedDate || new Date().toISOString().split("T")[0];
  });
  ``;
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allKeys, setAllKeys] = useState([]);
  const [lessons, setLessons] = useState([]); // TODO: make sure that role is קהד גדודי
  const [refreshTrigger, setRefreshTrigger] = useState(0); // TODO: fix bug where lessons refresh twice at start
  const [user, setUser] = useState(null);
  const [userGdudId, setUserGdudId] = useState(null);

  // Helper function to find the user's Gdud in the hierarchy
  const findUserGdud = async (groupId) => {
    let currentId = groupId;
    let currentGroup = null;

    // Traverse up the hierarchy until we find a Gdud (group_type_id = 2)
    while (currentId) {
      const { data, error } = await supabase
        .from("group_node")
        .select("id, parent_id, group_type_id")
        .eq("id", currentId)
        .single();

      if (error || !data) break;

      currentGroup = data;
      if (data.group_type_id === 2) {
        // Found Gdud
        console.log("Found user Gdud ID:", data.id);
        return data.id;
      }
      currentId = data.parent_id;
    }

    return groupId; // Fallback to user's group if Gdud not found
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData?.user) return;

      const { data, error: error2 } = await supabase
        .from("users")
        // Select from 'roles', using the relationship called 'user_roles'
        .select(
          `
              full_name,
              group_id,
              roles!user_roles (
              name
              )
          `,
        )
        .eq("id", authData.user.id)
        .single();

      if (!error2 && data) {
        const userData = {
          full_name: data.full_name,
          group_id: data.group_id,
          site_roles: data.roles?.map((r) => r.name) ?? [],
        };
        setUser(userData);

        // Find the user's גדוד
        if (data.group_id) {
          const gdudId = await findUserGdud(data.group_id);
          setUserGdudId(gdudId);
        }
      } else {
        console.error("Error fetching user data:", error2);
      }
    };

    fetchUser();
  }, []);

  // Helper function to check if a lesson's group belongs to the user's גדוד
  const isLessonInUserGdud = async (groupId) => {
    if (!userGdudId || !groupId) return false;

    let currentId = groupId;

    // Traverse up the hierarchy to check if we reach the user's גדוד
    while (currentId) {
      if (currentId === userGdudId) {
        return true;
      }

      const { data, error } = await supabase
        .from("group_node")
        .select("parent_id")
        .eq("id", currentId)
        .single();

      if (error || !data) break;
      currentId = data.parent_id;
    }

    return false;
  };

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
            `id, room_number, room_type_id, has_computers, building_id, room_type(name), building:building_id(name)`,
          )
          .eq("status", "available");

        if (keysError) throw keysError;
        console.log("Fetched keys data:", keysData);
        const formattedKeys = keysData.map((key) => ({
          id: key.id,
          room_number: key.room_number,
          room_type: key.room_type?.name || "unknown",
          has_computers: key.has_computers,
          building_id: key.building_id,
          building_name: key.building?.name || "unknown",
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
            group_node(id, name, parent_id, group_type_id), 
            room_type:needed_room_type_id(name)
        `,
          )
          .eq("date", selectedDate);

        if (lessonsError) throw lessonsError;

        // Filter lessons to only include those under the user's גדוד and not beyond פלוגה level
        let filteredLessonsData = lessonsData || [];
        if (userGdudId) {
          filteredLessonsData = [];
          for (const lesson of lessonsData || []) {
            // Exclude lessons at Bahad (1) or Gdud (2) level - only include Platoon (3) and Team (4)
            if (
              lesson.group_node?.group_type_id &&
              lesson.group_node.group_type_id > 2
            ) {
              const isInGdud = await isLessonInUserGdud(lesson.group_node?.id);
              if (isInGdud) {
                filteredLessonsData.push(lesson);
              }
            }
          }
        }

        const formattedLessons =
          filteredLessonsData?.map((l) => {
            const isPlatoon = l.group_node?.group_type_id === 3; // Company
            return {
              id: l.id,
              team_id: l.group_node?.id,
              // אם זו פלוגה, היא הפלוגה של עצמה. אם צוות, הפלוגה היא האבא.
              effective_platoon_id: isPlatoon
                ? l.group_node?.id
                : l.group_node?.parent_id,
              team_name: l.group_node?.name || "Unknown",
              start_time: l.start_time,
              end_time: l.end_time,
              room_type_name: l.room_type?.name || "Unknown",
              needs_computers: l.need_computer,
              status: l.status,
              assigned_key: l.room_number,
              date: l.date,
            };
          }) || [];
        console.log("Fetched lessons data:", formattedLessons);
        setLessons(formattedLessons);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, refreshTrigger, userGdudId]);

  const isAdmin = user?.site_roles?.includes("admin");

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
  // Helper function to check if two time ranges overlap
  const timesOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  const allocateKeys = async () => {
    // make sure is no התנגשויות
    // add דוץ
    setIsAllocating(true);

    const lessonsToAllocate =
      selectedLessons.length > 0
        ? lessons.filter((l) => selectedLessons.includes(l.id))
        : lessons.filter((l) => l.status === 1); // 1 = pending

    let availableKeys = allKeys.filter((k) => selectedKeys.includes(k.id));

    if (lessonsToAllocate.length === 0 || availableKeys.length === 0) {
      setIsAllocating(false);
      alert("אין נתונים לשיבוץ");
      return;
    }

    // מיון עדיפויות
    const sortedLessons = [...lessonsToAllocate].sort((a, b) => {
      if (a.room_type_name !== b.room_type_name)
        return a.room_type_name === "פלוגתי" ? -1 : 1;
      if (a.needs_computers !== b.needs_computers)
        return a.needs_computers ? -1 : 1;
      return a.start_time.localeCompare(b.start_time);
    });

    const finalUpdates = [];
    const sessionAllocations = [];

    for (const lesson of sortedLessons) {
      let bestKey = null;
      let maxScore = -Infinity;

      for (const key of availableKeys) {
        // Check if this key has any overlapping assignments
        const hasOverlap = lessons.some((l) => {
          if (l.id === lesson.id || !l.assigned_key) return false;
          return (
            l.assigned_key === key.room_number &&
            timesOverlap(
              lesson.start_time,
              lesson.end_time,
              l.start_time,
              l.end_time,
            )
          );
        });

        // Also check against allocations made in this session
        const sessionOverlap = sessionAllocations.some((alloc) => {
          return (
            alloc.room_number === key.room_number &&
            timesOverlap(
              lesson.start_time,
              lesson.end_time,
              alloc.start_time,
              alloc.end_time,
            )
          );
        });

        // Skip keys with overlapping lessons
        if (hasOverlap || sessionOverlap) continue;

        let score = 0;

        // בדיקת התאמת סוג חדר
        if (key.room_type === lesson.room_type_name) score += 1000;
        else if (
          lesson.room_type_name === "צוותי" &&
          key.room_type === "פלוגתי"
        )
          score += 400;
        else score -= 10000;

        // שימור כיתה לצוות
        const teamMatch = lessons.find(
          (l) =>
            l.team_id === lesson.team_id && l.assigned_key === key.room_number,
        );
        if (teamMatch) score += 3000;

        // שימור כיתה לפלוגה (שימוש ב-ID האפקטיבי)
        const platoonMatch = lessons.find(
          (l) =>
            l.effective_platoon_id === lesson.effective_platoon_id &&
            l.assigned_key === key.room_number,
        );
        if (platoonMatch) score += 1200;

        // העדפה לבניין זהה לשיעורים קודמים של הצוות
        const teamInBuilding = lessons.find((l) => {
          if (l.team_id !== lesson.team_id || !l.assigned_key) return false;
          const assignedKey = allKeys.find(
            (k) => k.room_number === l.assigned_key,
          );
          return assignedKey && assignedKey.building_id === key.building_id;
        });
        if (teamInBuilding) score += 2000;

        // העדפה לבניין זהה לשיעורים קודמים של הפלוגה
        const platoonInBuilding = lessons.find((l) => {
          if (
            l.effective_platoon_id !== lesson.effective_platoon_id ||
            !l.assigned_key
          )
            return false;
          const assignedKey = allKeys.find(
            (k) => k.room_number === l.assigned_key,
          );
          return assignedKey && assignedKey.building_id === key.building_id;
        });
        if (platoonInBuilding) score += 800;

        if (score > maxScore) {
          maxScore = score;
          bestKey = key;
        }
      }

      if (bestKey && maxScore > 0) {
        finalUpdates.push({ id: lesson.id, room_number: bestKey.room_number });
        sessionAllocations.push({
          room_number: bestKey.room_number,
          start_time: lesson.start_time,
          end_time: lesson.end_time,
        });
      }
    }

    // עדכון DB
    for (const up of finalUpdates) {
      await supabase
        .from("schedule_lessons")
        .update({ room_number: up.room_number, status: 2 }) // 2 = assigned
        .eq("id", up.id);
    }

    alert(`הוקצו בהצלחה ${finalUpdates.length} שיעורים`);
    setIsAllocating(false);
    setSelectedLessons([]);
    setSelectedKeys([]);
    setRefreshTrigger((prev) => prev + 1); // Trigger data refresh
  };
  const resetAllocations = async () => {
    if (window.confirm("האם למחוק את כל ההקצאות?")) {
      try {
        const { error } = await supabase
          .from("schedule_lessons")
          .update({ room_number: null, status: 1 }) // 1 = pending
          .eq("date", selectedDate)
          .neq("status", 1);

        // Update local state
        setLessons((prev) =>
          prev.map((lesson) => ({
            ...lesson,
            assigned_key: null,
            status: 1, // 1 = pending
          })),
        );

        alert("כל ההקצאות אופסו בהצלחה");
        setRefreshTrigger((prev) => prev + 1); // Trigger data refresh
      } catch (error) {
        console.error("Error resetting allocations:", error);
        alert("שגיאה בביטול ההקצאות");
      }
    }
  };

  const handleDelete = async (lessonId) => {
    if (window.confirm("האם למחוק שיעור זה?")) {
      try {
        const { error } = await supabase
          .from("schedule_lessons")
          .delete()
          .eq("id", lessonId);

        if (error) throw error;

        // Update local state
        setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));

        // Remove from selected lessons if it was selected
        setSelectedLessons((prev) => prev.filter((id) => id !== lessonId));

        alert("שיעור נמחק בהצלחה");
      } catch (error) {
        console.error("Error deleting lesson:", error);
        alert("שגיאה במחיקת השיעור");
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("האם למחוק את כל השיעורים?")) {
      try {
        const { error } = await supabase
          .from("schedule_lessons")
          .delete()
          .eq("date", selectedDate);

        if (error) throw error;

        // Update local state
        setLessons([]);
        setSelectedLessons([]);

        alert("כל השיעורים נמחקו בהצלחה");
        setRefreshTrigger((prev) => prev + 1); // Trigger data refresh
      } catch (error) {
        console.error("Error deleting lessons:", error);
        alert("שגיאה במחיקת השיעורים");
      }
    }
  };

  const handleManualAssign = async (lessonId, roomNumber) => {
    try {
      const updateValue = roomNumber === "unassign" ? null : roomNumber;

      const { error } = await supabase
        .from("schedule_lessons")
        .update({
          room_number: updateValue,
          status: roomNumber === "unassign" ? 1 : 2, // 1 = pending, 2 = assigned
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
                status: roomNumber === "unassign" ? 1 : 2, // 1 = pending, 2 = assigned
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

  const pendingCount = lessons.filter((l) => l.status === 1).length; // 1 = pending
  const assignedCount = lessons.filter((l) => l.status === 2).length; // 2 = assigned
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
                        <Chip
                          label={`📍 ${key.building_name}`}
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
                              direction: "ltr",
                            }}
                          >
                            {lesson.start_time?.slice(0, 5)} -{" "}
                            {lesson.end_time?.slice(0, 5)}
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
                                lesson.room_type_name === "פלוגתי" ? "🏢" : "🏠"
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
                            {lesson.status === 2 ? ( // 2 = assigned
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
            {/* <li>
              <strong>בקשות מיוחדות מקבלות עדיפות נמוכה</strong> - משובצות
              אחרונות
            </li> */}
          </Box>
        </Alert>
      </Container>
    </Box>
  );
};

export default KeysAllocator;
