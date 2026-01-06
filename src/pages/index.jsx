import { Route, BrowserRouter as Router, Routes } from 'react-router';
import LoginPage from './LoginPage';
import Home from '../components/Migdalor/Home/Home'
import KeysManager from '../components/Migdalor/KeysManager/KeysManager';
import Schedule from '../components/Migdalor/Schedule/Schedule';

function PagesContent() {
    return (
        <Routes>

            <Route path="/Login" element={<LoginPage />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/Keys" element={<KeysManager />} />
            <Route path="/Schedule" element={<Schedule />} />

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