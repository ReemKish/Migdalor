import Layout from "./Layout.jsx";

import DailyOverview from "./DailyOverview";

import Dashboard from "./Dashboard";

import HackalonAssignment from "./HackalonAssignment";

import HackalonManageProblems from "./HackalonManageProblems";

import HackalonOverview from "./HackalonOverview";

import HackalonSchedule from "./HackalonSchedule";

import HackalonStatus from "./HackalonStatus";

import HackalonTeamArea from "./HackalonTeamArea";

import Home from "./Home";

import KeyAllocation from "./KeyAllocation";

import ManageCrews from "./ManageCrews";

import ManageKeys from "./ManageKeys";

import ManagePermissions from "./ManagePermissions";

import ManagePositions from "./ManagePositions";

import ManageSquads from "./ManageSquads";

import ManageUsers from "./ManageUsers";

import ManageZones from "./ManageZones";

import MyProfile from "./MyProfile";

import MySchedule from "./MySchedule";

import Onboarding from "./Onboarding";

import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import LoginPage from "./LoginPage.jsx";
import SignupPage from "./SignupPage.jsx";

const PAGES = {
    
    DailyOverview: DailyOverview,
    
    Dashboard: Dashboard,
    
    HackalonAssignment: HackalonAssignment,
    
    HackalonManageProblems: HackalonManageProblems,
    
    HackalonOverview: HackalonOverview,
    
    HackalonSchedule: HackalonSchedule,
    
    HackalonStatus: HackalonStatus,
    
    HackalonTeamArea: HackalonTeamArea,
    
    Home: Home,
    
    KeyAllocation: KeyAllocation,
    
    ManageCrews: ManageCrews,
    
    ManageKeys: ManageKeys,
    
    ManagePermissions: ManagePermissions,
    
    ManagePositions: ManagePositions,
    
    ManageSquads: ManageSquads,
    
    ManageUsers: ManageUsers,
    
    ManageZones: ManageZones,
    
    MyProfile: MyProfile,
    
    MySchedule: MySchedule,
    
    Onboarding: Onboarding,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<DailyOverview />} />
                
                
                <Route path="/DailyOverview" element={<DailyOverview />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/HackalonAssignment" element={<HackalonAssignment />} />
                
                <Route path="/HackalonManageProblems" element={<HackalonManageProblems />} />
                
                <Route path="/HackalonOverview" element={<HackalonOverview />} />
                
                <Route path="/HackalonSchedule" element={<HackalonSchedule />} />
                
                <Route path="/HackalonStatus" element={<HackalonStatus />} />
                
                <Route path="/HackalonTeamArea" element={<HackalonTeamArea />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/KeyAllocation" element={<KeyAllocation />} />
                
                <Route path="/ManageCrews" element={<ManageCrews />} />
                
                <Route path="/ManageKeys" element={<ManageKeys />} />
                
                <Route path="/ManagePermissions" element={<ManagePermissions />} />
                
                <Route path="/ManagePositions" element={<ManagePositions />} />
                
                <Route path="/ManageSquads" element={<ManageSquads />} />
                
                <Route path="/ManageUsers" element={<ManageUsers />} />
                
                <Route path="/ManageZones" element={<ManageZones />} />
                
                <Route path="/MyProfile" element={<MyProfile />} />
                
                <Route path="/MySchedule" element={<MySchedule />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />

                <Route path="/Signup" element={<SignupPage />} />

                <Route path="/Login" element={<LoginPage />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}