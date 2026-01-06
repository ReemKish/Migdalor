import { Route, BrowserRouter as Router, Routes } from 'react-router';
import LoginPage from './pages/LoginPage/LoginPage';
import LogoutPage from './pages/LogoutPage/LogoutPage';
import HomePage from './pages/HomePage/HomePage';
import KeysManagerPage from './pages/KeysManagerPage/KeysManagerPage';
import KeysAllocatorPage from './pages/KeysAllocatorPage/KeysAllocatorPage';
import SchedulePage from './pages/SchedulePage/SchedulePage';
import DashboardPage from './pages/DashboardPage/DashboardPage';

export default () => {
    return (
        <Router>
            <Routes>
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