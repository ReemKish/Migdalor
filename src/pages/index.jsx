import { Route, BrowserRouter as Router, Routes } from 'react-router';
import LoginPage from './LoginPage';
import LogoutPage from './LogoutPage';

function PagesContent() {
    return (
            <Routes>            
                
                <Route path="/Login" element={<LoginPage />} />
                <Route path="/Logout" element={<LogoutPage />} />
            </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}