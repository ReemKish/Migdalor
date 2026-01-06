import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Stack,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Alert,
  Divider,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

/** ===========================
 *  STORAGE
 *  =========================== */
const STORAGE_KEY = "guard_scheduler_state_v2_mui_pink";

/** ===========================
 *  POSTS / RULES
 *  =========================== */

const POSTS = [
  { id: "sg_front", name: 'ש"ג קדמי', type: "ALWAYS", slotsAlways: 2, isPairPost: true },
  { id: "sg_back", name: 'ש"ג אחורי', type: "SG_BACK_SEASONAL", isPairPost: true }, // 1 ביום, 2 בשאר הזמן
  { id: "sg_foot", name: 'ש"ג רגלי', type: "WINDOW_DAY", slotsAlways: 1, isPairPost: false }, // רק ביום
  { id: "patl", name: "פטל", type: "ALWAYS", slotsAlways: 1, isPairPost: false },
  { id: "yamah", name: "ימח", type: "ALWAYS", slotsAlways: 1, isPairPost: false },
  { id: "armory", name: "נשקייה", type: "ALWAYS", slotsAlways: 1, isPairPost: false },
  { id: "hamal", name: "חמל", type: "ALWAYS", slotsAlways: 1, isPairPost: false },
  { id: "bunker", name: "בונקר", type: "ALWAYS", slotsAlways: 1, isPairPost: false },
  { id: "observer", name: "תצפיתן", type: "ALWAYS", slotsAlways: 1, isPairPost: false },
];

// אסתמה: רק נשקייה / ש"ג רגלי / תצפיתן
const ASTHMA_ALLOWED = new Set(["armory", "sg_foot", "observer"]);

// פטור ישיבה: רק חמל / נשקייה
const SITTING_ALLOWED = new Set(["hamal", "armory"]);

/** ===========================
 *  TIME UTILS
 *  =========================== */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function minutesToHHMM(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h)}:${pad2(mm)}`;
}

function parseHHMM(str) {
  const s = (str || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function overlapLinear(aStart, aEnd, bStart, bEnd) {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

function toClockSegments(absStart, absEnd) {
  const segments = [];
  const startDay = Math.floor(absStart / 1440);
  const endDay = Math.floor((absEnd - 1) / 1440);

  for (let day = startDay; day <= endDay; day++) {
    const dayStartAbs = day * 1440;
    const segStartAbs = Math.max(absStart, dayStartAbs);
    const segEndAbs = Math.min(absEnd, dayStartAbs + 1440);
    segments.push([segStartAbs - dayStartAbs, segEndAbs - dayStartAbs]);
  }
  return segments;
}

function overlapsWindow(absStart, absEnd, winStart, winEnd) {
  const segments = toClockSegments(absStart, absEnd);
  return segments.some(([s, e]) => overlapLinear(s, e, winStart, winEnd));
}

function isAnyOverlapWithDayWindow(season, absStart, absEnd) {
  const dayStart = season === "summer" ? 6 * 60 : 5 * 60;
  const dayEnd = season === "summer" ? 18 * 60 : 17 * 60;
  return overlapsWindow(absStart, absEnd, dayStart, dayEnd);
}



/** ===========================
 *  DEMAND
 *  =========================== */

function requiredSlotsForPost(post, season, absStart, absEnd) {
  if (post.type === "ALWAYS") return post.slotsAlways;

  if (post.type === "WINDOW_DAY") {
    return isAnyOverlapWithDayWindow(season, absStart, absEnd) ? 1 : 0;
  }

  if (post.type === "SG_BACK_SEASONAL") {
    // ביום -> 1, בשאר הזמן -> 2
    return isAnyOverlapWithDayWindow(season, absStart, absEnd) ? 1 : 2;
  }

  return 0;
}

function buildBlocks({ startMinuteOfDay, durationMinutes }) {
  const blocks = [];
  const blockSize = 240; // 4h
  let cursor = 0;
  let i = 0;

  while (cursor < durationMinutes) {
    const absStart = cursor;
    const absEnd = Math.min(durationMinutes, cursor + blockSize); // last can be shorter
    const startClock = startMinuteOfDay + absStart;
    const endClock = startMinuteOfDay + absEnd;

    const startDayOffset = Math.floor(startClock / 1440);
    const endDayOffset = Math.floor((endClock - 1) / 1440);

    const startLabel = `${minutesToHHMM(startClock)}${startDayOffset > 0 ? ` (יום ${startDayOffset + 1})` : ""}`;
    const endLabel = `${minutesToHHMM(endClock)}${endDayOffset > 0 ? ` (יום ${endDayOffset + 1})` : ""}`;

    blocks.push({
      id: `b${i}`,
      i,
      absStart,
      absEnd,
      minutes: absEnd - absStart,
      label: `${startLabel}–${endLabel}`,
    });

    cursor += blockSize;
    i++;
  }
  return blocks;
}

function computeDemand(blocks, season) {
  const demand = {};
  for (const b of blocks) {
    demand[b.id] = {};
    for (const p of POSTS) {
      demand[b.id][p.id] = requiredSlotsForPost(p, season, b.absStart, b.absEnd);
    }
  }
  return demand;
}

/** ===========================
 *  CSV EXPORT
 *  =========================== */

function fmt(x) {
  return Number((x ?? 0).toFixed(2));
}

function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function exportJusticeCSV(justiceRows) {
  const rows = [
    ["שם", "היסטוריה", "נוכחי", "סה״כ", "כוללות"],
    ...justiceRows.map((r) => [r.name, fmt(r.historyUnits), fmt(r.currentUnits), fmt(r.totalUnits), fmt(r.includesUnits)]),
  ];
  downloadCSV("טבלת_צדק.csv", rows);
}

function exportScheduleCSV(currentRun) {
  if (!currentRun) return;
  const header = ["עמדה", ...currentRun.blocks.map((b) => b.label)];
  const rows = [header];

  POSTS.forEach((post) => {
    const row = [post.name];
    currentRun.blocks.forEach((b) => {
      const names = (currentRun.assignments[b.id] || [])
        .filter((s) => s.postId === post.id)
        .map((s) => s.personName)
        .filter(Boolean)
        .join(" / ");
      row.push(names || "—");
    });
    rows.push(row);
  });

  downloadCSV("טבלת_שמירות.csv", rows);
}

/** ===========================
 *  STORAGE HELPERS
 *  =========================== */

function safeLoadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeSaveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/** ===========================
 *  ELIGIBILITY
 *  =========================== */

function canServe(person, postId, season, block) {
  // standby: לא שומר
  if (person.standby !== "none") return false;

  // פטור יום (רק ביום)
  if (person.exemptions.dayOnly) {
    // מותר רק אם הבלוק חופף ל"יום"
    if (!isAnyOverlapWithDayWindow(season, block.absStart, block.absEnd)) return false;
  }

  // פטור זוג (רק עמדות זוגיות)
  if (person.exemptions.pairOnly) {
    const post = POSTS.find((p) => p.id === postId);
    if (!post?.isPairPost) return false;
  }

  // פטור ישיבה (רק חמל/נשקייה)
  if (person.exemptions.sittingOnly) {
    if (!SITTING_ALLOWED.has(postId)) return false;
  }

  // אסתמה
  if (person.exemptions.asthma) {
    if (!ASTHMA_ALLOWED.has(postId)) return false;
  }

  return true;
}

/**
 * מנוחה: אחרי X דקות שמירה צריך 2X דקות מנוחה לפני השיבוץ הבא
 */
function isRestOk(lastWork, blockAbsStart) {
  if (!lastWork) return true;
  const requiredRest = 2 * lastWork.minutes;
  return blockAbsStart >= lastWork.endAbs + requiredRest;
}

/** ===========================
 *  FAIRNESS BUILD (history)
 *  =========================== */

function unitsFromMinutes(mins) {
  return mins / 240; // 4h = 1, 2h = 0.5
}

function buildHistoryStats(historyRuns, people) {
  // stats by person: totalUnits + byPostUnits + standbyUnits
  const byId = {};
  people.forEach((p) => {
    byId[p.id] = { totalUnits: 0, standbyUnits: 0, byPostUnits: {} };
  });

  for (const run of historyRuns || []) {
    const blocksById = {};
    for (const b of run.blocks || []) blocksById[b.id] = b;

    // standby from snapshot people in that run (so it counts as 2)
    const snapPeople = run.peopleSnapshot || [];
    for (const sp of snapPeople) {
      if (!sp?.id) continue;
      if (!byId[sp.id]) byId[sp.id] = { totalUnits: 0, standbyUnits: 0, byPostUnits: {} };
      if (sp.standby === "A" || sp.standby === "B") {
        byId[sp.id].standbyUnits += 2;
      }
    }

    // assignments
    for (const [blockId, slotArr] of Object.entries(run.assignments || {})) {
      const block = blocksById[blockId];
      const u = unitsFromMinutes(block?.minutes ?? 0);
      for (const slot of slotArr || []) {
        if (!slot.personId) continue;
        if (!byId[slot.personId]) byId[slot.personId] = { totalUnits: 0, standbyUnits: 0, byPostUnits: {} };
        byId[slot.personId].totalUnits += u;
        const k = slot.postId;
        byId[slot.personId].byPostUnits[k] = (byId[slot.personId].byPostUnits[k] || 0) + u;
      }
    }
  }
  return byId;
}

/** ===========================
 *  SCHEDULING
 *  =========================== */

function buildSlotsForBlock(block, demand) {
  const slots = [];

  // observer first (helps asthma preference)
  const observerNeed = demand[block.id]["observer"] || 0;
  for (let k = 0; k < observerNeed; k++) slots.push({ postId: "observer", postName: "תצפיתן" });

  for (const p of POSTS) {
    if (p.id === "observer") continue;
    const need = demand[block.id][p.id] || 0;
    for (let k = 0; k < need; k++) slots.push({ postId: p.id, postName: p.name });
  }

  return slots;
}

function allowedPostsForPerson(person, season, block) {
  // posts that person can serve in right now (for fairness computation)
  return POSTS.filter((post) => canServe(person, post.id, season, block)).map((p) => p.id);
}

function generateSchedule({ people, blocks, demand, season, historyStats }) {
  const assignments = {};
  const unfilled = [];

  // current stats (units + byPost)
  const cur = {};
  people.forEach((p) => {
    cur[p.id] = { totalUnits: 0, byPostUnits: {} };
  });

  // rest tracking within this run
  const lastWork = {}; // personId -> { endAbs, minutes }

  for (const b of blocks) {
    const slots = buildSlotsForBlock(b, demand);
    assignments[b.id] = [];

    for (const slot of slots) {
      const candidates = people
        .filter((p) => canServe(p, slot.postId, season, b))
        .filter((p) => isRestOk(lastWork[p.id], b.absStart))
        .sort((a, z) => {
          const aHistTotal = historyStats[a.id]?.totalUnits ?? 0;
          const zHistTotal = historyStats[z.id]?.totalUnits ?? 0;
          const aTotal = aHistTotal + (cur[a.id]?.totalUnits ?? 0);
          const zTotal = zHistTotal + (cur[z.id]?.totalUnits ?? 0);

          // fairness across posts:
          const aHistPost = historyStats[a.id]?.byPostUnits?.[slot.postId] ?? 0;
          const zHistPost = historyStats[z.id]?.byPostUnits?.[slot.postId] ?? 0;
          const aPost = aHistPost + (cur[a.id]?.byPostUnits?.[slot.postId] ?? 0);
          const zPost = zHistPost + (cur[z.id]?.byPostUnits?.[slot.postId] ?? 0);

          const aAllowed = allowedPostsForPerson(a, season, b);
          const zAllowed = allowedPostsForPerson(z, season, b);

          const aMin = aAllowed.length
            ? Math.min(...aAllowed.map((pid) => (historyStats[a.id]?.byPostUnits?.[pid] ?? 0) + (cur[a.id]?.byPostUnits?.[pid] ?? 0)))
            : 0;
          const zMin = zAllowed.length
            ? Math.min(...zAllowed.map((pid) => (historyStats[z.id]?.byPostUnits?.[pid] ?? 0) + (cur[z.id]?.byPostUnits?.[pid] ?? 0)))
            : 0;

          // penalty if repeating a post "above" your minimum coverage
          const aRepeatPenalty = Math.max(0, aPost - aMin);
          const zRepeatPenalty = Math.max(0, zPost - zMin);

          const aScore = aTotal * 10 + aPost * 5 + aRepeatPenalty * 20;
          const zScore = zTotal * 10 + zPost * 5 + zRepeatPenalty * 20;

          if (aScore !== zScore) return aScore - zScore;

          // asthma preference for observer
          if (slot.postId === "observer") {
            const aAsthma = !!a.exemptions.asthma;
            const zAsthma = !!z.exemptions.asthma;
            if (aAsthma !== zAsthma) return aAsthma ? -1 : 1;
          }

          return a.name.localeCompare(z.name, "he");
        });

      const chosen = candidates[0];

      if (!chosen) {
        unfilled.push({ blockId: b.id, blockLabel: b.label, postName: slot.postName });
        assignments[b.id].push({
          postId: slot.postId,
          postName: slot.postName,
          personId: null,
          personName: "— חסר —",
        });
        continue;
      }

      // assign
      assignments[b.id].push({
        postId: slot.postId,
        postName: slot.postName,
        personId: chosen.id,
        personName: chosen.name,
      });

      // update current units
      const u = unitsFromMinutes(b.minutes);
      cur[chosen.id].totalUnits += u;
      cur[chosen.id].byPostUnits[slot.postId] = (cur[chosen.id].byPostUnits[slot.postId] || 0) + u;

      // update rest
      lastWork[chosen.id] = { endAbs: b.absEnd, minutes: b.minutes };
    }
  }

  return { assignments, unfilled, currentUnitsById: cur };
}

/** ===========================
 *  THEME
 *  =========================== */

const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fontWeightBold: 900,
  },
  palette: {
    mode: "light",
    primary: { main: "#e91e63" },
    secondary: { main: "#ff80ab" },
    background: { default: "#fff7fb", paper: "#ffffff" },
  },
  shape: { borderRadius: 18 },
  components: {
    MuiPaper: { styleOverrides: { root: { boxShadow: "0 10px 30px rgba(233,30,99,0.10)" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 14, fontWeight: 800 } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: "none" } } },
  },
});

/** ===========================
 *  APP
 *  =========================== */

export default function App() {
  const loaded = useMemo(() => safeLoadState(), []);

  const [season, setSeason] = useState(loaded?.season ?? "summer");
  const [startHHMM, setStartHHMM] = useState(loaded?.startHHMM ?? "06:00");
  const [durationHours, setDurationHours] = useState(loaded?.durationHours ?? 24);
  const [durationMinutesExtra, setDurationMinutesExtra] = useState(loaded?.durationMinutesExtra ?? 0);

  const [people, setPeople] = useState(
    loaded?.people ?? [
      {
        id: "p1",
        name: "אדם 1",
        standby: "none",
        exemptions: { asthma: false, dayOnly: false, pairOnly: false, sittingOnly: false },
      },
      {
        id: "p2",
        name: "אדם 2",
        standby: "none",
        exemptions: { asthma: true, dayOnly: false, pairOnly: false, sittingOnly: false },
      },
      {
        id: "p3",
        name: "אדם 3",
        standby: "A",
        exemptions: { asthma: false, dayOnly: false, pairOnly: false, sittingOnly: false },
      },
    ]
  );

  const [historyRuns, setHistoryRuns] = useState(loaded?.historyRuns ?? []);
  const [currentRun, setCurrentRun] = useState(loaded?.currentRun ?? null);

  // auto-save
  useEffect(() => {
    safeSaveState({
      season,
      startHHMM,
      durationHours,
      durationMinutesExtra,
      people,
      historyRuns,
      currentRun,
    });
  }, [season, startHHMM, durationHours, durationMinutesExtra, people, historyRuns, currentRun]);

  // derived
  const startMinuteOfDay = useMemo(() => parseHHMM(startHHMM), [startHHMM]);
  const durationMinutes = useMemo(() => {
    const h = Number(durationHours) || 0;
    const m = Number(durationMinutesExtra) || 0;
    return Math.max(0, h * 60 + m);
  }, [durationHours, durationMinutesExtra]);

  const blocks = useMemo(() => {
    if (startMinuteOfDay === null || durationMinutes <= 0) return [];
    return buildBlocks({ startMinuteOfDay, durationMinutes });
  }, [startMinuteOfDay, durationMinutes]);

  const demand = useMemo(() => computeDemand(blocks, season), [blocks, season]);

  // require 4 כ"כ א + 4 כ"כ ב
  const standbyA = useMemo(() => people.filter((p) => p.standby === "A").length, [people]);
  const standbyB = useMemo(() => people.filter((p) => p.standby === "B").length, [people]);
  const standbyOk = standbyA === 4 && standbyB === 4;

  const inputError =
    startMinuteOfDay === null
      ? "שעת התחלה לא תקינה (HH:MM)"
      : durationMinutes <= 0
      ? "משך חייב להיות גדול מ-0"
      : null;

  // history stats (exclude currentRun from history calc)
  const historyStats = useMemo(() => {
    const filtered =
      currentRun?.createdAt ? historyRuns.filter((r) => r.createdAt !== currentRun.createdAt) : historyRuns;
    return buildHistoryStats(filtered, people);
  }, [historyRuns, people, currentRun]);

  // current units stats (for justice)
  const currentUnitsStats = useMemo(() => {
    // if we saved it in currentRun, use that; else compute empty
    return currentRun?.currentUnitsById ?? {};
  }, [currentRun]);

  // add/update helpers
  function addPerson() {
    const nextNum = people.length + 1;
    setPeople((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: `אדם ${nextNum}`,
        standby: "none",
        exemptions: { asthma: false, dayOnly: false, pairOnly: false, sittingOnly: false },
      },
    ]);
  }

  function removePerson(id) {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePerson(id, patch) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function updateExemption(id, key, value) {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, exemptions: { ...(p.exemptions || {}), [key]: value } } : p
      )
    );
  }

  function resetHistory() {
    setHistoryRuns([]);
    setCurrentRun(null);
  }

  function onGenerate() {
    if (inputError) return;

    if (!standbyOk) {
      // still generate? better to block: but you asked for alert. We'll block generation.
      return;
    }

    const res = generateSchedule({ people, blocks, demand, season, historyStats });

    const run = {
      createdAt: new Date().toISOString(),
      season,
      startHHMM,
      durationMinutes,
      blocks,
      demand,
      assignments: res.assignments,
      unfilled: res.unfilled,
      currentUnitsById: res.currentUnitsById,
      peopleSnapshot: people.map((p) => ({ id: p.id, standby: p.standby })), // so standby counts in history
    };

    setCurrentRun(run);
    setHistoryRuns((prev) => [run, ...prev].slice(0, 30));
  }

  // justice rows
  const justiceRows = useMemo(() => {
    const rows = people.map((p) => {
      const hTotal = historyStats[p.id]?.totalUnits ?? 0;
      const cTotal = currentUnitsStats[p.id]?.totalUnits ?? 0;

      // includes = total + standbyUnits (history + current)
      const hStandby = historyStats[p.id]?.standbyUnits ?? 0;
      const cStandby = p.standby === "A" || p.standby === "B" ? 2 : 0;

      return {
        id: p.id,
        name: p.name,
        historyUnits: hTotal,
        currentUnits: cTotal,
        totalUnits: hTotal + cTotal,
        includesUnits: hTotal + cTotal + hStandby + cStandby,
        standby: p.standby,
      };
    });

    rows.sort((a, b) => b.includesUnits - a.includesUnits);
    return rows;
  }, [people, historyStats, currentUnitsStats]);

  // UI helpers
  const availablePeopleCount = useMemo(() => people.filter((p) => p.standby === "none").length, [people]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: "100vw", minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="sticky" color="primary">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Chip label="Pink UI" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 900 }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              מחולל טבלת שמירות
            </Typography>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            p: { xs: 1.5, md: 2.5 },
            maxWidth: "1600px",
            mx: "auto",
          }}
        >
          <Paper sx={{ p: { xs: 2, md: 2.5 }, width: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              הגדרות
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" flexWrap="wrap">
              <FormControl sx={{ minWidth: 170 }}>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>עונה</Typography>
                <Select value={season} onChange={(e) => setSeason(e.target.value)} size="small">
                  <MenuItem value="summer">קיץ</MenuItem>
                  <MenuItem value="winter">חורף</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label='התחלה (HH:MM)'
                value={startHHMM}
                onChange={(e) => setStartHHMM(e.target.value)}
                size="small"
                sx={{ width: 170 }}
              />

              <TextField
                label="משך (שעות)"
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                size="small"
                sx={{ width: 140 }}
                inputProps={{ min: 0 }}
              />

              <TextField
                label="דקות נוספות"
                type="number"
                value={durationMinutesExtra}
                onChange={(e) => setDurationMinutesExtra(e.target.value)}
                size="small"
                sx={{ width: 140 }}
                inputProps={{ min: 0, max: 59 }}
              />

              <Chip
                color="secondary"
                variant="filled"
                label={`כוח אדם זמין: ${availablePeopleCount}/${people.length}`}
                sx={{ fontWeight: 900 }}
              />

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={onGenerate} disabled={!!inputError || blocks.length === 0}>
                  צור טבלת שמירות
                </Button>
                <Button variant="outlined" color="error" onClick={resetHistory}>
                  אפס היסטוריה
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ mt: 2 }}>
              {inputError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {inputError}
                </Alert>
              )}

              {!standbyOk && (
                <Alert severity="warning">
                  חייב להיות בדיוק <b>4</b> כ״כ א ו־<b>4</b> כ״כ ב. כרגע: כ״כ א = {standbyA}, כ״כ ב = {standbyB}
                </Alert>
              )}
            </Box>
          </Paper>

          <Divider sx={{ my: 2.5, opacity: 0.5 }} />

          <Paper sx={{ p: { xs: 2, md: 2.5 }, width: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                אנשים
              </Typography>
              <Button variant="outlined" onClick={addPerson}>
                הוסף אדם
              </Button>
            </Stack>

            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>שם</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      אסתמה
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      פטור לילה (רק יום)
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      פטור יחיד (רק זוג)
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      פטור ישיבה
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>כ״כ א/כ״כ ב</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      הסרה
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {people.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ minWidth: 260 }}>
                        <TextField
                          variant="standard"
                          value={p.name}
                          onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                          fullWidth
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Checkbox
                          checked={!!p.exemptions.asthma}
                          onChange={(e) => updateExemption(p.id, "asthma", e.target.checked)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Checkbox
                          checked={!!p.exemptions.dayOnly}
                          onChange={(e) => updateExemption(p.id, "dayOnly", e.target.checked)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Checkbox
                          checked={!!p.exemptions.pairOnly}
                          onChange={(e) => updateExemption(p.id, "pairOnly", e.target.checked)}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Checkbox
                          checked={!!p.exemptions.sittingOnly}
                          onChange={(e) => updateExemption(p.id, "sittingOnly", e.target.checked)}
                        />
                      </TableCell>

                      <TableCell sx={{ minWidth: 200 }}>
                        <FormControl variant="standard" fullWidth>
                          <Select value={p.standby} onChange={(e) => updatePerson(p.id, { standby: e.target.value })}>
                            <MenuItem value="none">לא</MenuItem>
                            <MenuItem value="A">כ״כ א</MenuItem>
                            <MenuItem value="B">כ״כ ב</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="הסר אדם">
                          <IconButton onClick={() => removePerson(p.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          <Divider sx={{ my: 2.5, opacity: 0.5 }} />

          <Paper sx={{ p: { xs: 2, md: 2.5 }, width: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                טבלת צדק
              </Typography>

              <Button variant="outlined" onClick={() => exportJusticeCSV(justiceRows)}>
                הורד CSV
              </Button>
            </Stack>

            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>שם</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      היסטוריה
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      נוכחי
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      סה״כ
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      כוללות
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {justiceRows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <span>{r.name}</span>
                          {(r.standby === "A" || r.standby === "B") && (
                            <Chip size="small" color="secondary" label={r.standby === "A" ? "כ״כ א" : "כ״כ ב"} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{fmt(r.historyUnits)}</TableCell>
                      <TableCell align="center">{fmt(r.currentUnits)}</TableCell>
                      <TableCell align="center">{fmt(r.totalUnits)}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 900 }}>
                        {fmt(r.includesUnits)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          <Divider sx={{ my: 2.5, opacity: 0.5 }} />

          <Paper sx={{ p: { xs: 2, md: 2.5 }, width: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                טבלת שמירות
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => exportScheduleCSV(currentRun)} disabled={!currentRun}>
                  הורד CSV
                </Button>
              </Stack>
            </Stack>

            {!currentRun ? (
              <Alert severity="info">לחצי “צור טבלת שמירות” כדי לייצר שיבוץ.</Alert>
            ) : (
              <>
                {currentRun.unfilled?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    לא היה מספיק כוח אדם/מנוחה כדי לאייש את כל העמדות. חסרים: {currentRun.unfilled.length}
                  </Alert>
                )}

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 1100 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, position: "sticky", right: 0, bgcolor: "white", zIndex: 1 }}>
                          עמדה
                        </TableCell>
                        {currentRun.blocks.map((b) => (
                          <TableCell key={b.id} sx={{ fontWeight: 900, minWidth: 170 }}>
                            {b.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {POSTS.map((post) => (
                        <TableRow key={post.id} hover>
                          <TableCell
                            sx={{
                              fontWeight: 900,
                              position: "sticky",
                              right: 0,
                              bgcolor: "white",
                              zIndex: 1,
                              minWidth: 160,
                            }}
                          >
                            {post.name}
                          </TableCell>

                          {currentRun.blocks.map((b) => {
                            const slots = (currentRun.assignments[b.id] || []).filter((s) => s.postId === post.id);
                            const names = slots.map((s) => s.personName).filter((n) => n && n !== "— חסר —");
                            const need = currentRun.demand?.[b.id]?.[post.id] ?? 0;
                            const missing = Math.max(0, need - names.length);

                            return (
                              <TableCell key={`${b.id}-${post.id}`} sx={{ verticalAlign: "top" }}>
                                <Box sx={{ whiteSpace: "pre-line" }}>{names.length ? names.join("\n") : "—"}</Box>
                                {missing > 0 && (
                                  <Box sx={{ mt: 0.75, color: "error.main", fontSize: 12, fontWeight: 800 }}>
                                    חסר: {missing}
                                  </Box>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                <Box sx={{ mt: 1, opacity: 0.75, fontSize: 13 }}>
                  נוצר בתאריך: {new Date(currentRun.createdAt).toLocaleString()}
                </Box>
              </>
            )}
          </Paper>

          <Box sx={{ height: 22 }} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
