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
import { Notebook, Settings, Sparkles, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData?.user) return;

      setAuthUserId(authData.user.id);

      const { data, error: error2 } = await supabase
        .from("users")
        // Select from 'roles', using the relationship called 'user_roles'
        .select(
          `
            full_name,
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
          site_roles: data.roles?.map((r) => r.name) ?? [],
        };
        setUser(userData);
        setNewName(data.full_name);
      } else {
        console.error("Error fetching user data:", error2);
      }
    };

    fetchUser();
  }, []);

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

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!user) return <p>Loading...</p>;

  const isAdmin = user.site_roles.includes("Admin");

  const siteSections = [
    { title: "לוח בקרה", path: "/Dashboard" },
    { title: 'לו"ז', path: "/Schedule" },
    { title: "ניהול מפתחות", path: "/ManageKeys" },
    { title: "הקצאת מפתחות", path: "/AllocateKeys" },
  ];

  return (
    <Box minHeight="100vh" dir="rtl" bgcolor="#f8fafc">
      {/* Top Bar */}
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
        {/* Greeting */}
        <Box textAlign="center" mb={6}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
          >
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

        {/* Username Edit */}
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

        {/* Future Section */}
        <Box mt={8}>
          <Typography variant="h5" fontWeight={700} mb={3}>
            🚀 תוספות עתידיות
          </Typography>
          <Grid container spacing={3}>
            {[
              { title: "משימות", icon: Sparkles },
              { title: "יומן", icon: Notebook },
            ].map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Card sx={{ p: 3, opacity: 0.7, border: "1px dashed #c7d2fe" }}>
                  <item.icon />
                  <Typography fontWeight={700}>{item.title}</Typography>
                  <Typography color="#64748b">בקרוב...</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
