import {
  Box,
  Button,
  Card,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Key,
  CheckCircle,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BAHAD_GROUP_KEY_ID } from 'lib/consts';
import { supabase } from 'lib/supabaseClient';

export default function KeyRequestsPage() {
  // מקבלים את מצב העיצוב מה-Layout
  const { isDark } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWednesday, setSelectedWednesday] = useState('');
  const [wednesdayOffset, setWednesdayOffset] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (wednesdayOffset >= 0) {
      const targetWednesday = getNextWednesday(wednesdayOffset);
      setSelectedWednesday(targetWednesday.toISOString().split('T')[0]);
    }
  }, [wednesdayOffset]);

  const getNextWednesday = (weeksFromNow) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (14 + (weeksFromNow * 7))); // Start from 2 weeks, add 7 days per offset

    // Get the day of week (0 = Sunday, 3 = Wednesday)
    const dayOfWeek = targetDate.getDay();

    // Calculate days until Wednesday
    let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    if (daysUntilWednesday === 0 && targetDate.getDay() !== 3) {
      daysUntilWednesday = 7;
    }

    const nextWednesday = new Date(targetDate);
    nextWednesday.setDate(targetDate.getDate() + daysUntilWednesday);

    return nextWednesday;
  };

  const handleNextWednesday = () => {
    setWednesdayOffset(prev => prev + 1);
  };

  const handlePreviousWednesday = () => {
    if (wednesdayOffset > 0) {
      setWednesdayOffset(prev => prev - 1);
    }
  };

  const fetchAncestorGroup = async (startGroupId, targetTypeName) => {
    try {
      const { data, error } = await supabase
        .rpc('get_parent_group_by_type', {
          start_group_id: startGroupId,
          target_type_name: targetTypeName
        });

      if (error) {
        console.error("RPC Error:", error.message);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error("Unexpected Error:", err);
      return null;
    }
  };

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('keys_request')
      .select('*, requester (id, name)')
      .order('range_start', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      const requestsWithBattalion = await Promise.all(
        data.map(async (req) => {
          const { data: battalionData } = await supabase.rpc('get_parent_group_by_type', {
            start_group_id: req.requester.id,
            target_type_name: 'Battalion',
          });

          return {
            ...req,
            battalion_name: battalionData?.[0]?.name || 'N/A',
          };
        })
      );

      setRequests(requestsWithBattalion);
    }
    setLoading(false);
  }

  async function handleDistributeEqually() {
    const confirm = window.confirm("האם לחלק מפתחות על בסיס הכמויות המבוקשות ולהקצות לרמת הגדוד?");
    if (!confirm) return;

    setLoading(true);

    try {
      const { data: availableKeys, error: keyErr } = await supabase
        .from('keysmanager_keys')
        .select('*')
        .eq('assigned_group_id', BAHAD_GROUP_KEY_ID);

      if (keyErr) throw keyErr;

      let smallKeys = availableKeys.filter(k => k.room_type_id === 1);
      let largeKeys = availableKeys.filter(k => k.room_type_id === 2);

      const pending = requests.filter(r =>
        r.status === 'pending' &&
        r.range_start === selectedWednesday
      );

      if (!pending.length) {
        alert("אין בקשות ממתינות.");
        return;
      }

      const updates = [];
      const battalionMap = {};
      const requestUpdates = [];

      for (const req of pending) {
        if (!battalionMap[req.requester.id]) {
          const ancestor = await fetchAncestorGroup(req.requester.id, "Battalion");
          battalionMap[req.requester.id] = ancestor ? ancestor.id : req.requester.id;
        }
        const targetGroupId = battalionMap[req.requester.id];

        const needsSmall = (req.single_team_amount || 0) + (req.two_team_amount || 0);
        const needsLarge = (req.company_amount || 0);

        let assignedSmall = 0;
        let assignedLarge = 0;

        for (let i = 0; i < needsSmall; i++) {
          if (smallKeys.length > 0) {
            const key = smallKeys.shift();
            updates.push({
              id: key.id,
              assigned_group_id: targetGroupId,
              created_at: key.created_at,
              status: key.status,
              room_number: key.room_number,
              has_computers: key.has_computers
            });
            assignedSmall++;
          }
        }

        for (let i = 0; i < needsLarge; i++) {
          if (largeKeys.length > 0) {
            const key = largeKeys.shift();
            updates.push({
              id: key.id,
              assigned_group_id: targetGroupId,
              created_at: key.created_at,
              status: key.status,
              room_number: key.room_number,
              has_computers: key.has_computers
            });
            assignedLarge++;
          }
        }

        // Calculate missing rooms
        const missingSmall = needsSmall - assignedSmall;
        const missingLarge = needsLarge - assignedLarge;
        const totalMissing = missingSmall + missingLarge;

        requestUpdates.push({
          id: req.id,
          status: 'approved',
          missing_rooms: totalMissing,
          missing_small_rooms: missingSmall,
          missing_large_rooms: missingLarge
        });
      }

      if (updates.length > 0) {
        const { error: upsertErr } = await supabase
          .from('keysmanager_keys')
          .upsert(updates);
        if (upsertErr) throw upsertErr;
      }

      for (const reqUpdate of requestUpdates) {
        await supabase
          .from('keys_request')
          .update({
            status: reqUpdate.status,
            missing_rooms: reqUpdate.missing_rooms,
            missing_small_rooms: reqUpdate.missing_small_rooms,
            missing_large_rooms: reqUpdate.missing_large_rooms
          })
          .eq('id', reqUpdate.id);
      }

      alert(`הוקצו ${updates.length} מפתחות בהצלחה.`);
      fetchRequests();

    } catch (err) {
      console.error(err);
      alert("שגיאה בחלוקה: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: isDark ? 'white' : '#1e293b',
                textAlign: 'right',
                direction: 'rtl'
              }}
            >
              ניהול בקשות מפתחות   
              <Key size={32} style={{ color: '#10b981' }} />

            </Typography>
          </Box>
          <Typography
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
              textAlign: 'right',
              direction: 'rtl'
            }}
          >
            ניהול וחלוקת בקשות למפתחות כיתות
          </Typography>
        </Box>

        {/* Wednesday Navigation and Action Row */}
        <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Wednesday Navigator */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.1)',
            minWidth: 400
          }}>
            <Box
              onClick={handlePreviousWednesday}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                cursor: wednesdayOffset > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                bgcolor: wednesdayOffset > 0
                  ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')
                  : 'transparent',
                opacity: wednesdayOffset > 0 ? 1 : 0.3,
                '&:hover': wednesdayOffset > 0 ? {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
                } : {}
              }}
            >
              <ArrowRight size={20} style={{ color: '#6366f1' }} />
            </Box>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <Calendar size={20} style={{ color: '#6366f1' }} />
              <Typography
                sx={{
                  color: '#6366f1',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  direction: 'rtl'
                }}
              >
                {selectedWednesday && new Date(selectedWednesday).toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Typography>
            </Box>

            <Box
              onClick={handleNextWednesday}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
                }
              }}
            >
              <ArrowLeft size={20} style={{ color: '#6366f1' }} />
            </Box>
          </Box>

          <Button
            onClick={handleDistributeEqually}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle size={20} />}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
              },
              '&:disabled': {
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            {loading ? 'מעבד...' : 'חלק באופן שווה ואשר הכל'}
          </Button>
        </Box>
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          sx={{
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'
                  }}>
                    מבקש
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    width: '80px'
                  }}>
                    יחיד
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    width: '100px'
                  }}>
                    שני צוותים
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    width: '80px'
                  }}>
                    פלוגה
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    width: '80px'
                  }}>
                    סה"כ
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0'
                  }}>
                    תאריך יעד
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    width: '100px'
                  }}>
                    כיתות חסרות
                  </TableCell>
                  <TableCell sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: 600,
                    textAlign: 'right',
                    direction: 'rtl',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    width: '120px'
                  }}>
                    סטטוס
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests
                  .filter(req => req.range_start === selectedWednesday)
                  .map((req) => (
                    <TableRow
                      key={req.id}
                      sx={{
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                        }
                      }}
                    >
                      <TableCell sx={{
                        color: isDark ? 'white' : '#1e293b',
                        textAlign: 'right',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {req.battalion_name}
                      </TableCell>
                      <TableCell sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                        textAlign: 'center',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {req.single_team_amount}
                      </TableCell>
                      <TableCell sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                        textAlign: 'center',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {req.two_team_amount}
                      </TableCell>
                      <TableCell sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                        textAlign: 'center',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {req.company_amount}
                      </TableCell>
                      <TableCell sx={{
                        color: isDark ? 'white' : '#1e293b',
                        fontWeight: 600,
                        textAlign: 'center',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {req.company_amount + req.two_team_amount + req.single_team_amount}
                      </TableCell>
                      <TableCell sx={{
                        color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                        textAlign: 'right',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {new Date(req.range_start).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell sx={{
                        textAlign: 'center',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        {req.missing_rooms > 0 ? (
                          <Chip
                            label={req.missing_rooms}
                            size="small"
                            sx={{
                              bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              fontWeight: 600,
                              borderRadius: '8px',
                            }}
                          />
                        ) : (
                          <Typography sx={{
                            color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8',
                            fontSize: '0.875rem'
                          }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{
                        textAlign: 'right',
                        direction: 'rtl',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
                      }}>
                        <Chip
                          icon={req.status === 'pending' ? <Clock size={16} /> : <CheckCircle size={16} />}
                          label={req.status === 'pending' ? 'ממתין' : 'אושר'}
                          sx={{
                            bgcolor: req.status === 'pending'
                              ? isDark ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)'
                              : isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            color: req.status === 'pending' ? '#fb923c' : '#10b981',
                            fontWeight: 600,
                            borderRadius: '8px',
                            '& .MuiChip-icon': {
                              color: req.status === 'pending' ? '#fb923c' : '#10b981',
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {requests.length === 0 && !loading && (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <Key size={48} style={{
                color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                marginBottom: '16px'
              }} />
              <Typography
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
                  fontSize: '1.125rem',
                  textAlign: 'center',
                  direction: 'rtl'
                }}
              >
                אין בקשות זמינות
              </Typography>
            </Box>
          )}
        </Card>
      </motion.div>
    </Container>
  );
}