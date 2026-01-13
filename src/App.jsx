import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage/LoginPage';
import LogoutPage from './pages/LogoutPage/LogoutPage';
import HomePage from './pages/HomePage/HomePage';
import KeysManagerPage from './pages/KeysManagerPage/KeysManagerPage';
import KeysAllocatorPage from './pages/KeysAllocatorPage/KeysAllocatorPage';
import SchedulePage from './pages/SchedulePage/SchedulePage';
import DashboardPage from './pages/DashboardPage/DashboardPage';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient'
 
function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

function authenticatedRoute(session, loading, component) {
    if (loading) {
        return <h1>Loading...</h1>
    } 

    return session ? component : <Navigate to="/Login" replace />
}

export default () => {
    const { session, loading } = useSession();

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/Login" replace/>} />
                <Route path="/Login" element={<LoginPage />} />
                <Route path="/Home" element={<HomePage />} />
                <Route path="/ManageKeys" element={<KeysManagerPage />} />
                <Route path="/Schedule" element={<SchedulePage />} />
                <Route path="/Logout" element={<LogoutPage />} />
                <Route path="/AllocateKeys" element={<KeysAllocatorPage />} />
                <Route path="/Dashboard" element={<DashboardPage />} />
            </Routes>
        </Router>
    );
}
