import { Route, BrowserRouter as Router, Routes } from 'react-router';
import LoginPage from './LoginPage';

function PagesContent() {
    return (
            <Routes>            
                
                <Route path="/Login" element={<LoginPage />} />
                
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