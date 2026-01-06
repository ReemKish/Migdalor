
import { base44 } from '@/api/base44Client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { Briefcase, Calendar, ChevronDown, Image, Key, LayoutDashboard, MapPin, Settings, Shield, Target, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await base44.auth.me();
        setUser(user);
        
        // Redirect to onboarding if not completed
        if (!user.onboarding_completed && currentPageName !== 'Onboarding') {
          window.location.href = createPageUrl('Onboarding');
        }

        // Load user permissions based on positions
        if (user.positions && user.positions.length > 0) {
          const allPermissions = await base44.entities.Positionpermission.list();
          console.log('🔍 All permissions:', allPermissions);
          console.log('👤 User positions:', user.positions);
          
          const userPositionPerms = allPermissions.filter(p => 
            user.positions.includes(p.position_name)
          );
          console.log('✅ Matched permissions:', userPositionPerms);
          
          // Merge all permissions
          const mergedPerms = {
            has_classroom_management_access: userPositionPerms.some(p => p.has_classroom_management_access),
            pages_access: [...new Set(userPositionPerms.flatMap(p => p.pages_access || []))]
          };
          console.log('📋 Final permissions:', mergedPerms);
          
          setUserPermissions(mergedPerms);
        } else {
          console.log('⚠️ No positions found for user');
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [currentPageName]);

  // Show loading while checking onboarding status
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  // Hide navigation for onboarding and MyProfile pages
  if (currentPageName === 'Onboarding' || currentPageName === 'MyProfile') {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const isAdmin = user?.role === 'admin';

  // Check if we're in the "User Management" area
  const isUserManagementArea = currentPageName === 'ManageUsers' || currentPageName === 'ManagePermissions' || currentPageName === 'ManagePositions';
  const isHackalonArea = ['HackalonSchedule', 'HackalonOverview', 'HackalonAssignment', 'HackalonTeamArea', 'HackalonManageProblems', 'HackalonStatus'].includes(currentPageName);

  // Redirect to HackalonSchedule when clicking on any Hackalon nav item if not already in Hackalon area
  if (isHackalonArea && currentPageName !== 'HackalonSchedule' && !window.location.search) {
    // This allows direct navigation to specific Hackalon pages via URL
  }

  // Classroom Management Navigation
  const allNavItems = [
    { name: 'לוח בקרה', icon: LayoutDashboard, page: 'Dashboard', tooltip: 'לוח בקרה' },
    { name: 'תמונת מצב', icon: Image, page: 'DailyOverview', tooltip: 'תמונת מצב' },
    { name: 'לוח הזמנים שלי', icon: Calendar, page: 'MySchedule', tooltip: 'לוח זמנים' },
    { name: 'הקצאת מפתחות', icon: Target, page: 'KeyAllocation', tooltip: 'הקצאה' },
    { name: 'מפתחות', icon: Key, page: 'ManageKeys', tooltip: 'מפתחות' },
  ];

  // Filter nav items based on permissions
  const getFilteredNavItems = () => {
    if (isAdmin) {
      return allNavItems;
    }
    
    if (!userPermissions?.has_classroom_management_access) {
      return [];
    }
    
    // If user has classroom management access, show all non-admin items
    // Or filter by specific pages if pages_access is defined and not empty
    if (userPermissions.pages_access && userPermissions.pages_access.length > 0) {
      return allNavItems.filter(item => {
        if (item.adminOnly) return false;
        return userPermissions.pages_access.includes(item.page);
      });
    } else {
      // Show all non-admin items if pages_access is not specified
      return allNavItems.filter(item => !item.adminOnly);
    }
  };

  const adminNavItems = isAdmin ? allNavItems : [];
  const userNavItems = getFilteredNavItems();

  // User Management Navigation (for admins only)
  const userManagementNavItems = [
    { name: 'משתמשים', icon: Users, page: 'ManageUsers', tooltip: 'ניהול משתמשים' },
    { name: 'תפקידים', icon: Briefcase, page: 'ManagePositions', tooltip: 'ניהול תפקידים' },
    { name: 'הרשאות', icon: Shield, page: 'ManagePermissions', tooltip: 'ניהול הרשאות תפקידים' },
  ];

  // HackAlon Navigation - Default page is HackalonSchedule
  const allHackalonNavItems = [
    { name: 'לוח זמנים', icon: Calendar, page: 'HackalonSchedule', tooltip: 'לוח זמנים ואירועים' },
    { name: 'אזור הצוות', icon: Users, page: 'HackalonTeamArea', tooltip: 'אזור הצוות שלי' },
    { name: 'סקירה', icon: LayoutDashboard, page: 'HackalonOverview', tooltip: 'סקירה כללית' },
    { name: 'תמונת מצב', icon: Image, page: 'HackalonStatus', tooltip: 'מעקב אחר העלאות'},
    { name: 'שיבוץ צוערים', icon: Users, page: 'HackalonAssignment', tooltip: 'שיבוץ למדורים וצוותים', adminOnly: true },
    { name: 'ניהול בעיות', icon: Settings, page: 'HackalonManageProblems', tooltip: 'הגדרת בעיות לצוותים', adminOnly: true },
  ];

  // Filter HackAlon nav items based on permissions
  const getFilteredHackalonItems = () => {
    if (isAdmin) {
      return allHackalonNavItems;
    }

    const allowedPositions = ['מפק״ץ', 'מנהל האקתון'];
    const hasAllowedPosition = user?.positions?.some(pos => allowedPositions.includes(pos));

    return allHackalonNavItems.filter(item => {
      // Always show non-admin items
      if (!item.adminOnly) {
        // For Overview and Status pages, check special permissions
        if (item.page === 'HackalonOverview' || item.page === 'HackalonStatus') {
          return hasAllowedPosition;
        }
        return true;
      }

      // For admin-only items, check permissions
      if (!userPermissions?.pages_access) return false;
      return userPermissions.pages_access.includes(item.page);
    });
  };

  const hackalonNavItems = getFilteredHackalonItems();

  const allManagementItems = [
    { name: 'פלוגות', page: 'ManageCrews', icon: Shield },
    { name: 'צוותים', page: 'ManageSquads', icon: Users },
    { name: 'אזורים', page: 'ManageZones', icon: MapPin, adminOnly: true },
  ];

  // Filter management items based on permissions
  const managementItems = isAdmin 
    ? allManagementItems
    : allManagementItems.filter(item => {
        if (item.adminOnly) return false;
        if (!userPermissions?.has_classroom_management_access) return false;
        // If pages_access exists and has items, filter by it; otherwise show all non-admin items
        if (userPermissions.pages_access && userPermissions.pages_access.length > 0) {
          return userPermissions.pages_access.includes(item.page);
        }
        return true;
      });

  const managementPages = managementItems.map(item => item.page);

  const navItems = isUserManagementArea ? userManagementNavItems : 
                       isHackalonArea ? hackalonNavItems :
                       (isAdmin ? adminNavItems : userNavItems);
  const isManagementPage = managementPages.includes(currentPageName);
  
  // Show management dropdown only in classroom area
  const showManagementDropdown = !isUserManagementArea && !isHackalonArea;

  // Hide navigation for Home page
  if (currentPageName === 'Home') {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b00a201212578d09f8396/9732960ed_8.png" 
                alt="מגדלור לוגו" 
                className="w-12 h-12 object-contain" 
              />
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all group relative ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                    title={item.tooltip}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:block text-sm font-medium">{item.name}</span>
                    {/* Mobile tooltip */}
                    <span className="sm:hidden absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.tooltip}
                    </span>
                  </Link>
                );
              })}
              
              {/* Management Dropdown - Only show in classroom area */}
              {showManagementDropdown && (
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all group relative ${
                      isManagementPage
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                    title="ניהול"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:flex items-center gap-1 text-sm font-medium">
                      ניהול
                      <ChevronDown className="w-3 h-3" />
                    </span>
                    {/* Mobile tooltip */}
                    <span className="sm:hidden absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      ניהול
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {managementItems.map((item) => (
                    <DropdownMenuItem key={item.page} asChild>
                      <Link 
                        to={createPageUrl(item.page)}
                        className={`cursor-pointer flex items-center gap-2 ${currentPageName === item.page ? 'bg-slate-100' : ''}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              )}


            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
