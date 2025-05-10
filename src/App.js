import React, { useState, useEffect } from 'react';
import { Home, Users, Clipboard, Droplet, Thermometer, DollarSign, Settings, LogOut, X, Menu, IndianRupee } from 'lucide-react';

import AuthenticationScreen from './components/AuthenticationScreen';
import FarmDashboard from './components/FarmDashboard';
import CowManagement from './components/CowManagement';
import MilkProduction from './components/MilkProduction';
import HealthManagement from './components/HealthManagement';
import EmployeeManagement from './components/EmployeeManagement';
import FinancesManagement from './components/FinanceManagement';
import SettingsScreen from './components/Settings';
import ResetPasswordPage from '../src/pages/ResetPasswordPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(null);

  // Check for URL path on initial load and when URL changes
  useEffect(() => {
    const checkUrlPath = () => {
      const pathname = window.location.pathname;
      
      // Handle reset-password path
      if (pathname === '/reset-password') {
        setCurrentPage('reset-password');
      } else {
        setCurrentPage(null);
      }
    };

    // Check on initial load
    checkUrlPath();

    // Add event listener for URL changes
    window.addEventListener('popstate', checkUrlPath);

    // Cleanup listener
    return () => window.removeEventListener('popstate', checkUrlPath);
  }, []);

  // Handle authentication
  const handleAuthentication = () => {
    console.log('LoggedIn');
    setIsAuthenticated(true);
    setCurrentPage(null); // Reset to main app after authentication
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Render module based on active state
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <FarmDashboard />;
      case 'cows':
        return <CowManagement />;
      case 'milk':
        return <MilkProduction />;
      case 'health':
        return <HealthManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'finances':
        return <FinancesManagement/>;
      case 'settings':
        return <SettingsScreen/>;
      default:
        return <FarmDashboard />;
    }
  };

  // Handle special pages like reset password
  if (currentPage === 'reset-password') {
    return <ResetPasswordPage onComplete={() => setCurrentPage(null)} />;
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <AuthenticationScreen onAuthenticate={handleAuthentication} />;
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-md z-20 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b">
          <button onClick={toggleSidebar} className={`text-gray-500 hover:text-gray-700 ${!sidebarOpen && 'hidden'}`}>
            <X size={20} />
          </button>
          <button onClick={toggleSidebar} className={`flex flex-col flex-grow p-2 space-y-2 overflow-y-auto ${sidebarOpen && 'hidden'}`}>
          <Menu size={24} />
          </button>
        </div>
        <div className="flex flex-col flex-grow p-4 space-y-4 overflow-y-auto">
          <NavItem 
            icon={<Home size={20} />} 
            label="Dashboard" 
            active={activeModule === 'dashboard'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('dashboard')}
          />
          <NavItem 
            icon={<Clipboard size={20} />} 
            label="Cow Management" 
            active={activeModule === 'cows'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('cows')}
          />
          <NavItem 
            icon={<Droplet size={20} />} 
            label="Milk Production" 
            active={activeModule === 'milk'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('milk')}
          />
          <NavItem 
            icon={<Thermometer size={20} />} 
            label="Health Records" 
            active={activeModule === 'health'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('health')}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Employees" 
            active={activeModule === 'employees'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('employees')}
          />
          <NavItem 
            icon={<IndianRupee size={20} />} 
            label="Finances" 
            active={activeModule === 'finances'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('finances')}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeModule === 'settings'} 
            collapsed={!sidebarOpen} 
            onClick={() => setActiveModule('settings')}
          />
        </div>
        <div className="p-4 border-t">
          <NavItem 
            icon={<LogOut size={20} />} 
            label="Logout" 
            collapsed={!sidebarOpen} 
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Render the active module */}
        <div className="flex-1 overflow-y-auto">
          {renderModule()}
        </div>
      </div>
    </div>
  );
};

// Component for navigation item
const NavItem = ({ icon, label, active = false, collapsed = false, onClick }) => {
  return (
    <div
      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 
      ${active ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <div className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{icon}</div>
      {!collapsed && <span className="font-medium">{label}</span>}
    </div>
  );
};

export default App;