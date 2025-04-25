import React, { useState, useEffect } from 'react';
import { Home, Users, Clipboard, Droplet, Thermometer, DollarSign, Settings, LogOut,X } from 'lucide-react';

// Import all components
import AuthenticationScreen from './components/AuthenticationScreen';
import FarmDashboard from './components/FarmDashboard';
import CowManagement from './components/CowManagement';
import MilkProduction from './components/MilkProduction';
import HealthManagement from './components/HealthManagement';
import EmployeeManagement from './components/EmployeeManagement';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle authentication
  const handleAuthentication = () => {
    console.log('LoggedIn');
    setIsAuthenticated(true);
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
        return <div className="p-6"><h1 className="text-2xl font-semibold text-gray-800">Financial Management</h1><p className="text-gray-600 mt-4">Financial management module coming soon!</p></div>;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-semibold text-gray-800">Settings</h1><p className="text-gray-600 mt-4">Settings module coming soon!</p></div>;
      default:
        return <FarmDashboard />;
    }
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <AuthenticationScreen onAuthenticate={handleAuthentication} />;
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-md z-20 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">CF</div>
            {sidebarOpen && <span className="ml-3 font-medium text-lg">CowFarm</span>}
          </div>
          <button onClick={toggleSidebar} className={`text-gray-500 hover:text-gray-700 ${!sidebarOpen && 'hidden'}`}>
            <X size={20} />
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
            icon={<DollarSign size={20} />} 
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