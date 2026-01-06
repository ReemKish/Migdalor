import { Route, BrowserRouter as Router, Routes } from 'react-router';
import LoginPage from './pages/LoginPage/LoginPage';
import LogoutPage from './pages/LogoutPage/LogoutPage';
import HomePage from './pages/HomePage/HomePage';
import KeysManagerPage from './pages/KeysManagerPage/KeysManagerPage';
import KeysAllocatorPage from './pages/KeysAllocatorPage/KeysAllocatorPage';
import SchedulePage from './pages/SchedulePage/SchedulePage';

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
            </Routes>
        </Router>
    );
}