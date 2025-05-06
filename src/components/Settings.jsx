import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User,
  Users,
  Bell, 
  Globe, 
  Shield, 
  Database, 
  HardDrive, 
  FileText, 
  Info, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Lock,Cpu
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchUsers, createUser, updateUser, deleteUser, resetUserPassword,updateUserStatus } from './services/userService';
import { fetchSystemSettings, updateSystemSettings } from './services/settingsService';

// Status colors (keep as is)
const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-red-100 text-red-800',
  'Pending': 'bg-yellow-100 text-yellow-800'
};

// Role colors (keep as is)
const roleColors = {
  'Administrator': 'bg-purple-100 text-purple-800',
  'Manager': 'bg-blue-100 text-blue-800',
  'Employee': 'bg-gray-100 text-gray-800'
};

// Settings module main component
const SettingsScreen = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [users, setUsers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    general: {},
    notifications: {},
    backup: {},
    security: {}
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load system settings
        const settings = await fetchSystemSettings();
        setSystemSettings(settings);
        
        // If on users tab, load users
        if (activeTab === 'users') {
          const usersData = await fetchUsers();
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Error loading settings data:', err);
        setError('Failed to load settings data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle add user modal
  const toggleAddUserModal = () => {
    setIsAddUserModalOpen(!isAddUserModalOpen);
  };

  // Toggle edit user modal
  const toggleEditUserModal = (user = null) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(!isEditUserModalOpen);
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle user creation
  const handleAddUser = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        status: userData.status,
        twoFactorEnabled: userData.twoFactorEnabled
      });
      
      // Refresh user list
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      setIsAddUserModalOpen(false);
      
      setSuccess('User created successfully');
    } catch (err) {
      setError(`Failed to create user: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Example usage of updateUser
  const handleUpdateUser = async (userId, userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await updateUser(userId, userData);
      
      // Refresh user list
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      setIsEditUserModalOpen(false);
      
      setSuccess('User updated successfully');
    } catch (err) {
      setError(`Failed to update user: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Example of handling user status change
  const handleStatusChange = async (userId, status) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await updateUserStatus(userId, status);
      
      // Refresh user list
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      
      setSuccess(`User status updated to ${status}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(`Failed to update user status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (minimum 8 characters):');
    
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await resetUserPassword(userId, newPassword);
      alert('Password has been reset successfully');
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    return (
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Handle settings change
  const handleSettingChange = (category, setting, value) => {
    setSystemSettings(prevSettings => ({
      ...prevSettings,
      [category]: {
        ...prevSettings[category],
        [setting]: value
      }
    }));
  };

  // Save settings
  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update each settings category
      for (const category of Object.keys(systemSettings)) {
        await updateSystemSettings(category, systemSettings[category]);
      }
      
      setShowSaveConfirmation(true);
      
      // Hide confirmation after 3 seconds
      setTimeout(() => {
        setShowSaveConfirmation(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Settings</h1>
          <div className="flex space-x-4">
            <button 
              onClick={saveSettings}
              disabled={isLoading}
              className={`flex items-center px-4 py-2 border ${isLoading ? 'bg-gray-300 border-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-blue-600 border-transparent hover:opacity-90'} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transition-all duration-300`}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={20} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={20} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {showSaveConfirmation && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-start">
            <Check size={20} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Settings saved successfully!</p>
              <p className="text-sm">Your changes have been applied to the system.</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Settings</h2>
              </div>
              <nav className="p-2">
                <SettingsNavItem 
                  icon={<SettingsIcon size={20} />} 
                  label="General Settings" 
                  active={activeTab === 'general'} 
                  onClick={() => handleTabChange('general')}
                />
                {/* <SettingsNavItem 
                  icon={<Bell size={20} />} 
                  label="Notifications" 
                  active={activeTab === 'notifications'} 
                  onClick={() => handleTabChange('notifications')}
                /> */}
                <SettingsNavItem 
                  icon={<Users size={20} />} 
                  label="User Management" 
                  active={activeTab === 'users'} 
                  onClick={() => handleTabChange('users')}
                />
                {/* <SettingsNavItem 
                  icon={<Shield size={20} />} 
                  label="Security" 
                  active={activeTab === 'security'} 
                  onClick={() => handleTabChange('security')}
                />
                <SettingsNavItem 
                  icon={<Database size={20} />} 
                  label="Backup & Restore" 
                  active={activeTab === 'backup'} 
                  onClick={() => handleTabChange('backup')}
                />
                <SettingsNavItem 
                  icon={<Cpu size={20} />} 
                  label="System" 
                  active={activeTab === 'system'} 
                  onClick={() => handleTabChange('system')}
                />
                <SettingsNavItem 
                  icon={<Info size={20} />} 
                  label="About" 
                  active={activeTab === 'about'} 
                  onClick={() => handleTabChange('about')}
                /> */}
              </nav>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
              {activeTab === 'general' && (
                <GeneralSettingsTab settings={systemSettings.general} onChange={handleSettingChange} />
              )}

              {activeTab === 'notifications' && (
                <NotificationsTab settings={systemSettings.notifications} onChange={handleSettingChange} />
              )}

              {activeTab === 'users' && (
                <UserManagementTab 
                  users={filteredUsers} 
                  searchQuery={searchQuery} 
                  onSearch={handleSearch} 
                  onAddUser={toggleAddUserModal} 
                  onEditUser={toggleEditUserModal}
                  onDeleteUser={handleDeleteUser}
                  onResetPassword={handleResetPassword}
                  formatDate={formatDate}
                  isLoading={isLoading}
                />
              )}

              {activeTab === 'security' && (
                <SecurityTab settings={systemSettings.security} onChange={handleSettingChange} />
              )}

              {activeTab === 'backup' && (
                <BackupTab settings={systemSettings.backup} onChange={handleSettingChange} formatDate={formatDate} />
              )}

              {activeTab === 'system' && (
                <SystemTab />
              )}

              {activeTab === 'about' && (
                <AboutTab />
              )}
            </div>
          </div>
        </div>
      </div>

      {isAddUserModalOpen && (
        <AddUserModal 
          onClose={toggleAddUserModal} 
          onSubmit={handleAddUser}
          isLoading={isLoading}
        />
      )}

      {isEditUserModalOpen && (
        <EditUserModal 
          user={selectedUser} 
          onClose={toggleEditUserModal} 
          onSubmit={userData => handleUpdateUser(selectedUser.id, userData)}
          onResetPassword={() => handleResetPassword(selectedUser.id)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// Settings Navigation Item
const SettingsNavItem = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 rounded-lg text-left mb-1 transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-green-600' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-green-600' : 'text-gray-500'}`}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
};

// General Settings Tab
const GeneralSettingsTab = ({ settings, onChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-6">General Settings</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">
              Farm Name
            </label>
            <input
              type="text"
              id="farmName"
              value={settings.farmName}
              onChange={(e) => onChange('general', 'farmName', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={settings.email}
              onChange={(e) => onChange('general', 'email', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={settings.phone}
              onChange={(e) => onChange('general', 'phone', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => onChange('general', 'timezone', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="America/Denver">Mountain Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={settings.address}
            onChange={(e) => onChange('general', 'address', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select
              id="dateFormat"
              value={settings.dateFormat}
              onChange={(e) => onChange('general', 'dateFormat', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => onChange('general', 'language', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Tab
const NotificationsTab = ({ settings, onChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Methods</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => onChange('notifications', 'emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-3 block text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Send notifications to the farm's email address
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="pushNotifications"
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => onChange('notifications', 'pushNotifications', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="pushNotifications" className="ml-3 block text-sm text-gray-700">
                  Push Notifications
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Send notifications to desktop and mobile devices
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="smsNotifications"
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => onChange('notifications', 'smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="smsNotifications" className="ml-3 block text-sm text-gray-700">
                  SMS Notifications
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Send text messages for critical alerts (additional charges may apply)
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Events</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="lowInventoryAlerts"
                  type="checkbox"
                  checked={settings.lowInventoryAlerts}
                  onChange={(e) => onChange('notifications', 'lowInventoryAlerts', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="lowInventoryAlerts" className="ml-3 block text-sm text-gray-700">
                  Low Inventory Alerts
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Notify when inventory items are below threshold
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="healthAlerts"
                  type="checkbox"
                  checked={settings.healthAlerts}
                  onChange={(e) => onChange('notifications', 'healthAlerts', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="healthAlerts" className="ml-3 block text-sm text-gray-700">
                  Animal Health Alerts
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Notify about health issues and scheduled checkups
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="milkProductionReports"
                  type="checkbox"
                  checked={settings.milkProductionReports}
                  onChange={(e) => onChange('notifications', 'milkProductionReports', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="milkProductionReports" className="ml-3 block text-sm text-gray-700">
                  Milk Production Reports
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Send daily and weekly production summaries
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="financialReports"
                  type="checkbox"
                  checked={settings.financialReports}
                  onChange={(e) => onChange('notifications', 'financialReports', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="financialReports" className="ml-3 block text-sm text-gray-700">
                  Financial Reports
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Send financial summaries and alerts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Tab
const UserManagementTab = ({ 
  users, 
  searchQuery, 
  onSearch, 
  onAddUser, 
  onEditUser, 
  onDeleteUser,
  onResetPassword,
  formatDate,
  isLoading 
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-6">User Management</h2>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={onSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <User size={16} className="text-gray-400" />
          </div>
        </div>
        
        <button 
          onClick={onAddUser}
          className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus size={16} className="mr-2" />
          Add User
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found matching your search criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    2FA
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            src={user.profileImage} 
                            alt={user.name} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.twoFactorEnabled ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <X size={16} className="text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => onEditUser(user)} 
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onResetPassword(user.id)} 
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                      >
                        Reset Password
                      </button>
                      <button 
                        onClick={() => onDeleteUser(user.id)} 
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// Security Tab
const SecurityTab = ({ settings, onChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Password Policies</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="passwordExpiryDays" className="block text-sm font-medium text-gray-700 mb-1">
                Password Expiry (days)
              </label>
              <input
                type="number"
                id="passwordExpiryDays"
                value={settings.passwordExpiryDays}
                onChange={(e) => onChange('security', 'passwordExpiryDays', parseInt(e.target.value))}
                min="0"
                max="365"
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Set to 0 for no expiration
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="requireStrongPasswords"
                  type="checkbox"
                  checked={settings.requireStrongPasswords}
                  onChange={(e) => onChange('security', 'requireStrongPasswords', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="requireStrongPasswords" className="ml-3 block text-sm text-gray-700">
                  Require Strong Passwords
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Minimum 8 characters with uppercase, lowercase, number, and special character
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Account Security</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="loginAttempts" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Failed Login Attempts
              </label>
              <select
                id="loginAttempts"
                value={settings.loginAttempts}
                onChange={(e) => onChange('security', 'loginAttempts', parseInt(e.target.value))}
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="3">3 attempts</option>
                <option value="5">5 attempts</option>
                <option value="10">10 attempts</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Account will be locked after this many failed attempts
              </p>
            </div>
            
            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <select
                id="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={(e) => onChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="120">2 hours</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Users will be logged out after period of inactivity
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="enableTwoFactor"
                  type="checkbox"
                  checked={settings.enableTwoFactor}
                  onChange={(e) => onChange('security', 'enableTwoFactor', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="enableTwoFactor" className="ml-3 block text-sm text-gray-700">
                  Enable Two-Factor Authentication
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Require 2FA for all administrator accounts
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="auditLogging"
                  type="checkbox"
                  checked={settings.auditLogging}
                  onChange={(e) => onChange('security', 'auditLogging', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="auditLogging" className="ml-3 block text-sm text-gray-700">
                  Enable Audit Logging
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Log all security events and user actions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backup & Restore Tab
const BackupTab = ({ settings, onChange, formatDate }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Backup & Restore</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Automatic Backups</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="automaticBackups"
                  type="checkbox"
                  checked={settings.automaticBackups}
                  onChange={(e) => onChange('backup', 'automaticBackups', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="automaticBackups" className="ml-3 block text-sm text-gray-700">
                  Enable Automatic Backups
                </label>
              </div>
              <div className="text-sm text-gray-500">
                System will create backups automatically
              </div>
            </div>
            
            <div>
              <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                Backup Frequency
              </label>
              <select
                id="backupFrequency"
                value={settings.backupFrequency}
                onChange={(e) => onChange('backup', 'backupFrequency', e.target.value)}
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                disabled={!settings.automaticBackups}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="backupTime" className="block text-sm font-medium text-gray-700 mb-1">
                Backup Time
              </label>
              <input
                type="time"
                id="backupTime"
                value={settings.backupTime}
                onChange={(e) => onChange('backup', 'backupTime', e.target.value)}
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                disabled={!settings.automaticBackups}
              />
            </div>
            
            <div>
              <label htmlFor="retentionPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                Retention Period (days)
              </label>
              <input
                type="number"
                id="retentionPeriod"
                value={settings.retentionPeriod}
                onChange={(e) => onChange('backup', 'retentionPeriod', parseInt(e.target.value))}
                min="1"
                max="365"
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                disabled={!settings.automaticBackups}
              />
              <p className="mt-1 text-xs text-gray-500">
                Older backups will be automatically deleted
              </p>
            </div>
            
            <div>
              <label htmlFor="backupLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Backup Location
              </label>
              <select
                id="backupLocation"
                value={settings.backupLocation}
                onChange={(e) => onChange('backup', 'backupLocation', e.target.value)}
                className="block w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                disabled={!settings.automaticBackups}
              >
                <option value="local">Local Storage</option>
                <option value="cloud">Cloud Storage</option>
                <option value="both">Both Local and Cloud</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Last Backup</h3>
            <p className="text-sm text-gray-900">{formatDate(settings.lastBackup)}</p>
          </div>
          
          <div className="flex space-x-4">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <HardDrive size={16} className="mr-2" />
              Manual Backup
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <RefreshCw size={16} className="mr-2" />
              Restore from Backup
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Backup History</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apr 26, 2023 02:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Automatic</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">256 MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cloud</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Restore</button>
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Download</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apr 25, 2023 02:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Automatic</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">255 MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cloud</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Restore</button>
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Download</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apr 24, 2023 02:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Automatic</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">253 MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cloud</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Restore</button>
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Download</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// System Tab
const SystemTab = () => {
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">System Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="flex items-center">
                <Database size={16} className="text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Database Size</span>
              </div>
              <div className="mt-1 text-sm text-gray-900 pl-6">1.2 GB</div>
            </div>
            
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="flex items-center">
                <HardDrive size={16} className="text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Disk Space</span>
              </div>
              <div className="mt-1 text-sm text-gray-900 pl-6">
                <div className="flex items-center justify-between mb-1">
                  <span>Used: 35.6 GB / 100 GB</span>
                  <span>64.4% Free</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '35.6%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="flex items-center">
                <FileText size={16} className="text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Log Files</span>
              </div>
              <div className="mt-1 text-sm text-gray-900 pl-6">523 MB</div>
            </div>
            
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <div className="flex items-center">
                <User size={16} className="text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Active Users</span>
              </div>
              <div className="mt-1 text-sm text-gray-900 pl-6">5 users (2 online now)</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Maintenance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700">Clear Cache</div>
                <div className="text-sm text-gray-500">Remove temporary files to free up disk space</div>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Clear Cache
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700">Optimize Database</div>
                <div className="text-sm text-gray-500">Improve performance by optimizing database tables</div>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Optimize
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700">Purge Old Logs</div>
                <div className="text-sm text-gray-500">Delete logs older than 30 days</div>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Purge Logs
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700">System Restart</div>
                <div className="text-sm text-gray-500">Restart the application (all users will be logged out)</div>
              </div>
              <button 
                onClick={() => setShowRestartConfirm(true)}
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
        
        {/* Confirmation Dialog */}
        {showRestartConfirm && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Restart System</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to restart the system? All users will be logged out and any unsaved data may be lost.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="button" 
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Restart
                  </button>
                  <button 
                    type="button" 
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowRestartConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// About Tab
const AboutTab = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">About</h2>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Application Information</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Application Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Server Requirements</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">1GB RAM, 10GB Storage, 1GHz CPU</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Mobile Support</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">iOS 13+, Android 9+</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

// Add User Modal Component
const AddUserModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Employee',
    status: 'Active',
    password: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    onSubmit(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Add New User</h3>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`block w-full px-3 py-2 border ${
                    formErrors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`block w-full px-3 py-2 border ${
                    formErrors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full px-3 py-2 border ${
                  formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`block w-full px-3 py-2 border ${
                    formErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Lock size={16} className="text-gray-400" />
                </div>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`block w-full px-3 py-2 border ${
                    formErrors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Lock size={16} className="text-gray-400" />
                </div>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                id="twoFactorEnabled"
                name="twoFactorEnabled"
                type="checkbox"
                checked={formData.twoFactorEnabled}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="twoFactorEnabled" className="ml-2 block text-sm text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Adding...
                </div>
              ) : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSubmit, onResetPassword, isLoading }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    onSubmit(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Edit User</h3>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center">
              <img 
                src={user.profileImage} 
                alt={user.name} 
                className="h-16 w-16 rounded-full mr-4"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">User ID: {user.id}</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full px-3 py-2 border ${
                  formErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full px-3 py-2 border ${
                  formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="twoFactorEnabled"
                name="twoFactorEnabled"
                type="checkbox"
                checked={formData.twoFactorEnabled}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="twoFactorEnabled" className="ml-2 block text-sm text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onResetPassword}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw size={16} className="mr-2" />
                Reset Password
              </button>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Saving...
                </div>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsScreen;