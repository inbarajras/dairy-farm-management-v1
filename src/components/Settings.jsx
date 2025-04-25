// import React, { useState } from 'react';
// import { 
//   Settings, 
//   Lock, 
//   Bell, 
//   Eye, 
//   Users, 
//   Globe, 
//   Database, 
//   Moon, 
//   Sun, 
//   Server, 
//   Shield, 
//   Save
// } from 'lucide-react';

// const SettingsPage = () => {
//   const [activeTab, setActiveTab] = useState('general');
//   const [darkMode, setDarkMode] = useState(false);
//   const [emailNotifications, setEmailNotifications] = useState(true);
//   const [smsNotifications, setSmsNotifications] = useState(false);
//   const [pushNotifications, setPushNotifications] = useState(true);
//   const [language, setLanguage] = useState('english');
//   const [dataRetention, setDataRetention] = useState('90');

//   // System settings states
//   const [backupFrequency, setBackupFrequency] = useState('daily');
//   const [autoUpdate, setAutoUpdate] = useState(true);
//   const [logLevel, setLogLevel] = useState('error');

//   // Handle form submission
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Here you would make an API call to save the settings
//     alert('Settings saved successfully!');
//   };

//   return (
//     <div className="h-full bg-gray-100">
//       <div className="px-6 py-6">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
//           <button 
//             onClick={handleSubmit}
//             className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//           >
//             <Save size={20} className="mr-2" />
//             Save Changes
//           </button>
//         </div>

//         {/* Tabs */}
//         <div className="mb-6">
//           <nav className="flex space-x-4 border-b border-gray-200">
//             <button
//               onClick={() => setActiveTab('general')}
//               className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
//                 activeTab === 'general'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               General
//             </button>
//             <button
//               onClick={() => setActiveTab('notifications')}
//               className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
//                 activeTab === 'notifications'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Notifications
//             </button>
//             <button
//               onClick={() => setActiveTab('security')}
//               className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
//                 activeTab === 'security'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Security
//             </button>
//             <button
//               onClick={() => setActiveTab('users')}
//               className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
//                 activeTab === 'users'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               User Management
//             </button>
//             <button
//               onClick={() => setActiveTab('system')}
//               className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
//                 activeTab === 'system'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               System
//             </button>
//           </nav>
//         </div>

//         {/* General Settings */}
//         {activeTab === 'general' && (
//           <div className="space-y-6">
//             <div className="bg-white shadow rounded-lg p-6">
//               <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                 <Settings size={20} className="mr-2" />
//                 General Settings
//               </h2>
              
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Farm Name
//                   </label>
//                   <input
//                     type="text"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     defaultValue="Green Valley Dairy Farm"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Farm ID
//                   </label>
//                   <input
//                     type="text"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     defaultValue="GVDF-1234"
//                     readOnly
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Contact Email
//                   </label>
//                   <input
//                     type="email"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     defaultValue="contact@greenvalleydairy.com"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Contact Phone
//                   </label>
//                   <input
//                     type="tel"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     defaultValue="(555) 123-4567"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Time Zone
//                   </label>
//                   <select
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     defaultValue="America/New_York"
//                   >
//                     <option value="America/New_York">Eastern Time (ET)</option>
//                     <option value="America/Chicago">Central Time (CT)</option>
//                     <option value="America/Denver">Mountain Time (MT)</option>
//                     <option value="America/Los_Angeles">Pacific Time (PT)</option>
//                   </select>
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Date Format
//                   </label>
//                   <select
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     defaultValue="MM/DD/YYYY"
//                   >
//                     <option value="MM/DD/YYYY">MM/DD/YYYY</option>
//                     <option value="DD/MM/YYYY">DD/MM/YYYY</option>
//                     <option value="YYYY/MM/DD">YYYY/MM/DD</option>
//                   </select>
//                 </div>
//               </div>
              
//               <div className="mt-6 border-t border-gray-200 pt-4">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="mr-3">
//                       {darkMode ? <Moon size={20} className="text-gray-600" /> : <Sun size={20} className="text-amber-500" />}
//                     </div>
//                     <div>
//                       <h3 className="text-sm font-medium text-gray-700">Dark Mode</h3>
//                       <p className="text-xs text-gray-500">Switch between light and dark theme</p>
//                     </div>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <label className="inline-flex relative items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         className="sr-only peer"
//                         checked={darkMode}
//                         onChange={() => setDarkMode(!darkMode)}
//                       />
//                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
//                     </label>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="mt-4 border-t border-gray-200 pt-4">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="mr-3">
//                       <Globe size={20} className="text-blue-500" />
//                     </div>
//                     <div>
//                       <h3 className="text-sm font-medium text-gray-700">Language</h3>
//                       <p className="text-xs text-gray-500">Select your preferred language</p>
//                     </div>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <select
//                       className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                       value={language}
//                       onChange={(e) => setLanguage(e.target.value)}
//                     >
//                       <option value="english">English</option>
//                       <option value="spanish">Spanish</option>
//                       <option value="french">French</option>
//                       <option value="german">German</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white shadow rounded-lg p-6">
//               <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                 <Database size={20} className="mr-2" />
//                 Data Management
//               </h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Data Retention Period</h3>
//                     <p className="text-xs text-gray-500">How long to keep historical data</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <select
//                       className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                       value={dataRetention}
//                       onChange={(e) => setDataRetention(e.target.value)}
//                     >
//                       <option value="30">30 days</option>
//                       <option value="60">60 days</option>
//                       <option value="90">90 days</option>
//                       <option value="180">180 days</option>
//                       <option value="365">1 year</option>
//                       <option value="unlimited">Unlimited</option>
//                     </select>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between pt-4 border-t border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Export Data</h3>
//                     <p className="text-xs text-gray-500">Download all farm data as CSV or Excel</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
//                       Export Data
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between pt-4 border-t border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-red-600">Delete All Data</h3>
//                     <p className="text-xs text-gray-500">Permanently delete all farm data</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
//                       Delete All Data
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Notifications Settings */}
//         {activeTab === 'notifications' && (
//           <div className="space-y-6">
//             <div className="bg-white shadow rounded-lg p-6">
//               <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                 <Bell size={20} className="mr-2" />
//                 Notification Preferences
//               </h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between pb-4 border-b border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
//                     <p className="text-xs text-gray-500">Receive notifications via email</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <label className="inline-flex relative items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         className="sr-only peer"
//                         checked={emailNotifications}
//                         onChange={() => setEmailNotifications(!emailNotifications)}
//                       />
//                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
//                     </label>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between py-4 border-b border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
//                     <p className="text-xs text-gray-500">Receive notifications via text message</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <label className="inline-flex relative items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         className="sr-only peer"
//                         checked={smsNotifications}
//                         onChange={() => setSmsNotifications(!smsNotifications)}
//                       />
//                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
//                     </label>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between py-4">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
//                     <p className="text-xs text-gray-500">Receive notifications on your device</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <label className="inline-flex relative items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         className="sr-only peer"
//                         checked={pushNotifications}
//                         onChange={() => setPushNotifications(!pushNotifications)}
//                       />
//                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
//                     </label>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="bg-white shadow rounded-lg p-6">
//               <h2 className="text-lg font-medium text-gray-800 mb-4">Alert Types</h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-center">
//                   <input
//                     id="health-alerts"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                     defaultChecked
//                   />
//                   <label htmlFor="health-alerts" className="ml-3">
//                     <span className="block text-sm font-medium text-gray-700">Health Alerts</span>
//                     <span className="block text-xs text-gray-500">Notifications about cow health issues</span>
//                   </label>
//                 </div>
                
//                 <div className="flex items-center">
//                   <input
//                     id="milk-production"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                     defaultChecked
//                   />
//                   <label htmlFor="milk-production" className="ml-3">
//                     <span className="block text-sm font-medium text-gray-700">Milk Production</span>
//                     <span className="block text-xs text-gray-500">Updates on milk production metrics</span>
//                   </label>
//                 </div>
                
//                 <div className="flex items-center">
//                   <input
//                     id="breeding-events"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                     defaultChecked
//                   />
//                   <label htmlFor="breeding-events" className="ml-3">
//                     <span className="block text-sm font-medium text-gray-700">Breeding Events</span>
//                     <span className="block text-xs text-gray-500">Alerts about breeding cycles and events</span>
//                   </label>
//                 </div>
                
//                 <div className="flex items-center">
//                   <input
//                     id="inventory-alerts"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                     defaultChecked
//                   />
//                   <label htmlFor="inventory-alerts" className="ml-3">
//                     <span className="block text-sm font-medium text-gray-700">Inventory Alerts</span>
//                     <span className="block text-xs text-gray-500">Low stock warnings for inventory items</span>
//                   </label>
//                 </div>
                
//                 <div className="flex items-center">
//                   <input
//                     id="financial-reports"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                     defaultChecked
//                   />
//                   <label htmlFor="financial-reports" className="ml-3">
//                     <span className="block text-sm font-medium text-gray-700">Financial Reports</span>
//                     <span className="block text-xs text-gray-500">Periodic financial updates</span>
//                   </label>
//                 </div>
                
//                 <div className="flex items-center">
//                   <input
//                     id="system-notifications"
//                     type="checkbox"
//                     className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                     defaultChecked
//                   />
//                   <label htmlFor="system-notifications" className="ml-3">
//                     <span className="block text-sm font-medium text-gray-700">System Notifications</span>
//                     <span className="block text-xs text-gray-500">System updates and maintenance alerts</span>
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Security Settings */}
//         {activeTab === 'security' && (
//           <div className="space-y-6">
//             <div className="bg-white shadow rounded-lg p-6">
//               <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                 <Lock size={20} className="mr-2" />
//                 Password Settings
//               </h2>
              
//               <form className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Current Password
//                   </label>
//                   <input
//                     type="password"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     placeholder="Enter your current password"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     New Password
//                   </label>
//                   <input
//                     type="password"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     placeholder="Enter new password"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Confirm New Password
//                   </label>
//                   <input
//                     type="password"
//                     className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                     placeholder="Confirm new password"
//                   />
//                 </div>
                
//                 <div>
//                   <button
//                     type="button"
//                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                   >
//                     Update Password
//                   </button>
//                 </div>
//               </form>
//             </div>
            
//             <div className="bg-white shadow rounded-lg p-6">
//               <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                 <Shield size={20} className="mr-2" />
//                 Security Settings
//               </h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between pb-4 border-b border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Two-Factor Authentication</h3>
//                     <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
//                       Enable
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between py-4 border-b border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Session Timeout</h3>
//                     <p className="text-xs text-gray-500">Automatically log out after period of inactivity</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <select
//                       className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//                       defaultValue="30"
//                     >
//                       <option value="15">15 minutes</option>
//                       <option value="30">30 minutes</option>
//                       <option value="60">1 hour</option>
//                       <option value="120">2 hours</option>
//                       <option value="never">Never</option>
//                     </select>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between py-4 border-b border-gray-200">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-700">Login History</h3>
//                     <p className="text-xs text-gray-500">View your recent login activity</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
//                       View History
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between py-4">
//                   <div>
//                     <h3 className="text-sm font-medium text-red-600">Deactivate Account</h3>
//                     <p className="text-xs text-gray-500">Temporarily disable your account</p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
//                       Deactivate
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* User Management */}
//         {activeTab === 'users' && (
//           <div className="space-y-6">
//             <div className="bg-white shadow rounded-lg p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-lg font-medium text-gray-800 flex items-center">
//                   <Users size={20} className="mr-2" />
//                   User Management
//                 </h2>
//                 <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
//                   Add New User
//                 </button>
//               </div>
              
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Name
//                       </th>
//                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Email
//                       </th>
//                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Role
//                       </th>
//                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Status
//                       </th>
//                       <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Actions
//                       </th>