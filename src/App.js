import React, { useState, useEffect } from 'react';
import { Home, Users, Clipboard, Droplet, Thermometer, DollarSign, Settings, LogOut, X, Menu, IndianRupee, Package, Leaf, AlertTriangle } from 'lucide-react';

import AuthenticationScreen from './components/AuthenticationScreen';
import FarmDashboard from './components/FarmDashboard';
import CowManagement from './components/CowManagement';
import MilkProduction from './components/MilkProduction';
import HealthManagement from './components/HealthManagement';
import EmployeeManagement from './components/EmployeeManagement';
import FinancesManagement from './components/FinanceManagement';
import InventoryManagement from './components/InventoryManagement';
import SettingsScreen from './components/Settings';
import ResetPasswordPage from '../src/pages/ResetPasswordPage';
import ToastContainer from './components/utils/CustomToast';
import QuickActionButton from './components/QuickActionButton';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProvider, useRole } from './contexts/RoleContext';

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
    <AlertTriangle size={64} className="text-yellow-500 mb-4" />
    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
    <p className="text-gray-600 text-center max-w-md mb-4">You don't have permission to access this page. Please contact your administrator if you believe this is an error.</p>
  </div>
);

// Main App wrapper with context providers
const AppWithProviders = () => {
  return (
    <AuthProvider>
      <RoleProvider>
        <AppContent />
      </RoleProvider>
    </AuthProvider>
  );
};

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(null);
  const { hasAccess, userRole, loading } = useRole();
  
  // Refs for modal actions
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

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

  // Quick action handlers
  const handleAddCow = () => {
    // Create a reference to the CowManagement component 
    const cowManagementRef = React.createRef();
    setActiveModule('cows');
    
    // Use setTimeout to ensure the component is mounted before trying to access its methods
    setTimeout(() => {
      // Directly open the add cow modal by accessing the component's toggleAddModal method
      document.querySelector('button[data-action="add-cow"]')?.click();
    }, 100);
  };

  const handleRecordMilk = () => {
    setActiveModule('milk');
    
    // Use setTimeout to ensure the component is mounted
    setTimeout(() => {
      // Directly open the add milk record modal
      document.querySelector('button[data-action="record-milk"]')?.click();
    }, 100);
  };

  const handleRecordHealth = () => {
    setActiveModule('health');
    
    // Use setTimeout to ensure the component is mounted
    setTimeout(() => {
      // Directly open the add health event modal
      document.querySelector('button[data-action="add-health-event"]')?.click();
    }, 100);
  };

  const handleAddInventory = () => {
    setActiveModule('inventory');
    
    // Use setTimeout to ensure the component is mounted
    setTimeout(() => {
      // Directly open the add inventory item modal
      document.querySelector('button[data-action="add-inventory"]')?.click();
    }, 100);
  };

  const handleAddExpense = () => {
    setActiveModule('finances');
    
    // Use setTimeout to ensure the component is mounted
    setTimeout(() => {
      // Directly open the add expense modal
      document.querySelector('button[data-action="add-expense"]')?.click();
    }, 100);
  };

  const handleAddEmployee = () => {
    setActiveModule('employees');
    
    // Use setTimeout to ensure the component is mounted
    setTimeout(() => {
      // Directly open the add employee modal
      document.querySelector('button[data-action="add-employee"]')?.click();
    }, 100);
  };

  const handleGlobalSearch = () => {
    setShowGlobalSearch(true);
    // In a real implementation, this would show a global search modal
    alert("Global search feature is coming soon!");
  };

  // Render module based on active state
  const renderModule = () => {
    // Check if user has access to the active module
    if (!hasAccess(activeModule)) {
      return <AccessDenied />;
    }

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
      case 'inventory':
        return <InventoryManagement />;
      case 'finances':
        return <FinancesManagement/>;
      case 'settings':
        return <SettingsScreen/>;
      default:
        // If default is dashboard and user doesn't have access, show cows management
        return hasAccess('dashboard') ? <FarmDashboard /> : <CowManagement />;
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

  // Display loading state while role information is being fetched
  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      <ToastContainer />
      
      {/* Improved Sidebar with enhanced styling */}
      <div className={`bg-white shadow-lg z-20 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        {/* Enhanced header with better alignment and gradient */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-blue-600 text-white py-4 px-5 flex items-center justify-between shadow-md">
          {sidebarOpen ? (
            <div className="flex items-center flex-grow">
              <svg viewBox="0 0 24 24" className="h-7 w-7 mr-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="font-semibold text-lg">Dairy Farm</span>
            </div>
          ) : (
            <svg viewBox="0 0 24 24" className="h-7 w-7 mx-auto text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          )}
          <button 
            onClick={toggleSidebar} 
            className="text-white hover:text-green-200 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1.5"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        {/* Improved navigation area with subtle background */}
        <div className="flex flex-col flex-grow p-4 space-y-1.5 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
          {/* Show Dashboard only to Admins */}
          {hasAccess('dashboard') && (
            <NavItem 
              icon={<Home size={20} />} 
              label="Dashboard" 
              active={activeModule === 'dashboard'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('dashboard')}
            />
          )}
          
          {/* Cow Management - ALL roles */}
          {hasAccess('cows') && (
            <NavItem 
              icon={<Clipboard size={20} />} 
              label="Cow Management" 
              active={activeModule === 'cows'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('cows')}
            />
          )}
          
          {/* Milk Production - ALL roles */}
          {hasAccess('milk') && (
            <NavItem 
              icon={<Droplet size={20} />} 
              label="Milk Production" 
              active={activeModule === 'milk'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('milk')}
            />
          )}
          
          {/* Health Records - Admin, Manager */}
          {hasAccess('health') && (
            <NavItem 
              icon={<Thermometer size={20} />} 
              label="Health Records" 
              active={activeModule === 'health'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('health')}
            />
          )}
          
          {/* Inventory - Admin, Manager */}
          {hasAccess('inventory') && (
            <NavItem 
              icon={<Package size={20} />} 
              label="Inventory" 
              active={activeModule === 'inventory'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('inventory')}
            />
          )}
          
          {/* Employees - Admin, Manager */}
          {hasAccess('employees') && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Employees" 
              active={activeModule === 'employees'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('employees')}
            />
          )}
          
          {/* Finances - Admin only */}
          {hasAccess('finances') && (
            <NavItem 
              icon={<IndianRupee size={20} />} 
              label="Finances" 
              active={activeModule === 'finances'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('finances')}
            />
          )}
          
          {/* Settings - Admin only */}
          {hasAccess('settings') && (
            <NavItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeModule === 'settings'} 
              collapsed={!sidebarOpen} 
              onClick={() => setActiveModule('settings')}
            />
          )}
        </div>

        {/* Enhanced footer with stronger gradient */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-t border-gray-200">
          <NavItem 
            icon={<LogOut size={20} />} 
            label="Logout" 
            collapsed={!sidebarOpen} 
            onClick={handleLogout}
            special={true}
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

      {/* Quick Action Button */}
      <QuickActionButton 
        onAddCow={handleAddCow}
        onRecordMilk={handleRecordMilk}
        onRecordHealth={handleRecordHealth}
        onAddInventory={handleAddInventory}
        onAddExpense={handleAddExpense}
        onAddEmployee={handleAddEmployee}
        onSearch={handleGlobalSearch}
      />
    </div>
  );
};

// Enhanced NavItem with improved gradient styling
const NavItem = ({ icon, label, active = false, collapsed = false, onClick, special = false }) => {
  return (
    <div
      className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 
      ${active 
        ? 'bg-gradient-to-r from-green-100 to-blue-50 text-green-700 font-medium shadow-sm border-l-4 border-green-500' 
        : special
          ? 'text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-700'
          : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-blue-50/50 hover:text-gray-800'}`}
      onClick={onClick}
    >
      <div className={`${collapsed ? 'mx-auto' : 'mr-3'} ${active ? 'text-green-600' : ''}`}>{icon}</div>
      {!collapsed && <span className={`font-medium ${active ? 'text-green-700' : ''}`}>{label}</span>}
    </div>
  );
};

export default AppWithProviders;