import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  User, 
  Search, 
  ChevronDown, 
  Home, 
  Users, 
  Droplet, 
  Thermometer, 
  DollarSign, 
  Clipboard, 
  Settings, 
  LogOut, 
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Mock data
const mockKpiData = {
  totalCows: 247,
  milkProduction: 1863,
  healthAlerts: 5,
  activeTasks: 12,
  revenue: 28650
};

const mockMilkProductionData = {
  '7days': [
    { day: 'Mon', production: 420 },
    { day: 'Tue', production: 430 },
    { day: 'Wed', production: 425 },
    { day: 'Thu', production: 428 },
    { day: 'Fri', production: 435 },
    { day: 'Sat', production: 440 },
    { day: 'Sun', production: 445 },
  ],
  'month': [
    { day: '1', production: 420 },
    { day: '5', production: 430 },
    { day: '10', production: 450 },
    { day: '15', production: 440 },
    { day: '20', production: 435 },
    { day: '25', production: 455 },
    { day: '30', production: 465 },
  ],
  '3months': [
    { month: 'Jan', production: 13500 },
    { month: 'Feb', production: 14200 },
    { month: 'Mar', production: 15500 },
    { month: 'Apr', production: 16100 },
  ]
};

const mockCowHealthData = [
  { name: 'Healthy', value: 210, color: '#4CAF50' },
  { name: 'Monitored', value: 32, color: '#FFA000' },
  { name: 'Treatment', value: 5, color: '#F44336' },
];

const mockRecentActivities = [
  { id: 1, type: 'health', text: 'Cow #A128 received vaccination', time: '15 min ago', details: 'Annual vaccination for BVD administered by Dr. Smith. Next vaccination scheduled for April 2024.' },
  { id: 2, type: 'milk', text: 'Morning collection complete: 427L', time: '2 hours ago', details: 'Quality parameters: Fat 3.8%, Protein 3.2%, Lactose 4.7%. Collected by John Doe.' },
  { id: 3, type: 'employee', text: 'John started his shift', time: '3 hours ago', details: 'Morning shift from 6:00 AM to 2:00 PM. Assigned to Barn 2 and milking parlor.' },
  { id: 4, type: 'cow', text: 'New cow registered: #B094', time: '5 hours ago', details: 'Jersey breed, 3 years old. Purchased from Smith Family Farm. Health check completed.' },
  { id: 5, type: 'health', text: 'Cow #C215 treatment for mastitis', time: '6 hours ago', details: 'Moderate case in right rear quarter. Treatment with antibiotics initiated. Follow-up scheduled in 7 days.' },
  { id: 6, type: 'milk', text: 'Evening collection complete: 385L', time: '14 hours ago', details: 'Quality parameters: Fat 3.7%, Protein 3.3%, Lactose 4.6%. Collected by Jane Smith.' },
  { id: 7, type: 'employee', text: 'Sarah completed training', time: '1 day ago', details: 'Completed milk quality testing training. Certification valid for 2 years.' },
  { id: 8, type: 'cow', text: 'Cow #D073 health check', time: '1 day ago', details: 'Regular checkup completed. All vitals normal. Vaccination due in 5 days.' }
];

// Main farm dashboard component
const FarmDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentWeather, setCurrentWeather] = useState({ temp: 24, condition: 'Sunny' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState('Last 7 days');
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [milkDataPeriod, setMilkDataPeriod] = useState('7days');

  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Date navigation
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (dateRange === 'Today') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (dateRange === 'Last 7 days') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (dateRange === 'This month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (dateRange === 'Last 30 days') {
      newDate.setDate(newDate.getDate() + (direction * 30));
    }
    
    setCurrentDate(newDate);
  };
  
  // Reset to today
  const resetToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format date range display
  const formatDateRangeDisplay = () => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    
    if (dateRange === 'Today') {
      return currentDate.toLocaleDateString('en-US', options);
    } else if (dateRange === 'Last 7 days') {
      const endDate = new Date(currentDate);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 6);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', options)}`;
    } else if (dateRange === 'This month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (dateRange === 'Last 30 days') {
      const endDate = new Date(currentDate);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 29);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', options)}`;
    }
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Filter activities for the modal
  const getFilteredActivities = () => {
    if (activityFilter === 'all') return mockRecentActivities;
    return mockRecentActivities.filter(activity => activity.type === activityFilter);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              {/* <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 mr-4">
                <Menu size={24} />
              </button> */}
              <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Dairy Farm Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={22} />
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    3
                  </span>
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                        <button className="text-xs text-green-600 hover:text-green-700">Mark all as read</button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <NotificationItem 
                        type="health"
                        text="Cow #D073 vaccination due today"
                        time="10 minutes ago"
                        isRead={false}
                      />
                      <NotificationItem 
                        type="system"
                        text="System maintenance scheduled for tonight at 2 AM"
                        time="1 hour ago"
                        isRead={false}
                      />
                      <NotificationItem 
                        type="milk"
                        text="Milk quality alert: Somatic cell count rising"
                        time="2 hours ago"
                        isRead={false}
                      />
                      <NotificationItem 
                        type="feed"
                        text="Feed inventory below reorder level"
                        time="Yesterday"
                        isRead={true}
                      />
                      <NotificationItem 
                        type="employee"
                        text="Staff meeting reminder: Today at 4 PM"
                        time="Yesterday"
                        isRead={true}
                      />
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <button className="text-xs text-center text-blue-600 hover:text-blue-700 w-full">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button 
                  className="flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-2">
                    <User size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-medium hidden md:block">John Farmer</span>
                  <ChevronDown size={16} className="ml-1 text-gray-500 hidden md:block" />
                </button>
                
                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">John Farmer</p>
                      <p className="text-xs text-gray-500 mt-1">john@dairyfarm.com</p>
                    </div>
                    <div className="py-1">
                      <ProfileMenuItem icon={<User size={16} />} text="Profile" />
                      <ProfileMenuItem icon={<Settings size={16} />} text="Settings" />
                      <ProfileMenuItem icon={<Bell size={16} />} text="Notifications" />
                    </div>
                    <div className="py-1 border-t border-gray-200">
                      <ProfileMenuItem icon={<LogOut size={16} />} text="Sign out" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {/* Date Range Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Farm Overview</h2>
            <div className="flex items-center space-x-2">
              <StyledDropdown 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: 'Today', label: 'Today' },
                  { value: 'Last 7 days', label: 'Last 7 days' },
                  { value: 'This month', label: 'This month' },
                  { value: 'Last 30 days', label: 'Last 30 days' },
                ]}
              />
              
              <div className="flex items-center bg-white rounded-md shadow-sm border border-gray-300 px-2">
                <button 
                  className="p-1 text-gray-500 hover:text-gray-700"
                  onClick={() => navigateDate(-1)}
                >
                  <ChevronDown className="rotate-90" size={16} />
                </button>
                <span className="mx-2 text-sm font-medium text-gray-700">{formatDateRangeDisplay()}</span>
                <button 
                  className="p-1 text-gray-500 hover:text-gray-700"
                  onClick={() => navigateDate(1)}
                >
                  <ChevronDown className="-rotate-90" size={16} />
                </button>
              </div>
              
              <button 
                className="p-2 text-sm text-gray-700 bg-white rounded-md shadow-sm border border-gray-300 hover:bg-gray-50 flex items-center"
                onClick={resetToToday}
              >
                <RefreshCw size={14} className="mr-1" />
                Today
              </button>
            </div>
          </div>
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <KpiCard
              title="Total Cows"
              value={mockKpiData.totalCows}
              icon={<Clipboard className="text-green-600" />}
              trend="+12% from last month"
              positive={true}
            />
            <KpiCard
              title="Milk Production"
              value={`${mockKpiData.milkProduction}L`}
              icon={<Droplet className="text-blue-600" />}
              trend="+5% from yesterday"
              positive={true}
            />
            <KpiCard
              title="Health Alerts"
              value={mockKpiData.healthAlerts}
              icon={<Thermometer className="text-red-500" />}
              trend="2 new alerts today"
              positive={false}
            />
            <KpiCard
              title="Active Tasks"
              value={mockKpiData.activeTasks}
              icon={<Clipboard className="text-amber-500" />}
              trend="3 tasks due today"
              positive={true}
            />
            <KpiCard
              title="Revenue (MTD)"
              value={`₹${mockKpiData.revenue}`}
              icon={<DollarSign className="text-green-700" />}
              trend="+8% from last month"
              positive={true}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Milk Production Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Milk Production</h2>
                <select 
                  className="border rounded-md px-3 py-1 text-sm bg-white"
                  value={milkDataPeriod}
                  onChange={(e) => setMilkDataPeriod(e.target.value)}
                >
                  <option value="7days">Last 7 days</option>
                  <option value="month">This month</option>
                  <option value="3months">Last 3 months</option>
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockMilkProductionData[milkDataPeriod]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                    <XAxis 
                      dataKey={milkDataPeriod === '3months' ? 'month' : 'day'} 
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                      formatter={(value) => [`${value}${milkDataPeriod === '3months' ? 'L (monthly)' : 'L (daily)'}`, 'Production']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="production"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cow Health Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cow Health Status</h2>
              <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Cow health chart would go here</p>
              </div>
            </div>
          </div>

          {/* Recent Activities and Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm p-6 col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
                <button 
                  className="text-green-600 text-sm font-medium hover:text-green-700"
                  onClick={() => setIsActivitiesModalOpen(true)}
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {mockRecentActivities.slice(0, 4).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Weather and Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Weather Conditions</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-800">{currentWeather.temp}°C</h3>
                      <p className="text-gray-600">{currentWeather.condition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Humidity: 62%</p>
                    <p className="text-sm text-gray-600">Wind: 8 km/h</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks for Today</h2>
                <div className="space-y-2">
                  <TaskItem title="Morning milk collection" completed={true} />
                  <TaskItem title="Veterinarian visit - Barn 2" completed={false} />
                  <TaskItem title="Feed inventory check" completed={false} />
                  <TaskItem title="Staff meeting - 3:00 PM" completed={false} />
                </div>
                <button 
                  className="mt-4 text-green-600 text-sm font-medium hover:text-green-700 flex items-center"
                  onClick={() => setIsAddTaskModalOpen(true)}
                >
                  <span>Add New Task</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* All Activities Modal */}
      {isActivitiesModalOpen && (
        <ActivitiesModal 
          activities={mockRecentActivities} 
          onClose={() => setIsActivitiesModalOpen(false)}
          filter={activityFilter}
          setFilter={setActivityFilter}
        />
      )}
      
      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} />
      )}
    </div>
  );
};

// Component for navigation item
const NavItem = ({ icon, label, active = false, collapsed = false }) => {
  return (
    <div
      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 
      ${active ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <div className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>{icon}</div>
      {!collapsed && <span className="font-medium">{label}</span>}
    </div>
  );
};

// Component for KPI card
const KpiCard = ({ title, value, icon, trend, positive = true }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-full bg-gray-50">{icon}</div>
      </div>
      <div className={`mt-4 text-xs flex items-center ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {positive ? (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        <span>{trend}</span>
      </div>
    </div>
  );
};

// Component for activity item
const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'health':
        return <Thermometer size={16} className="text-red-500" />;
      case 'milk':
        return <Droplet size={16} className="text-blue-500" />;
      case 'employee':
        return <Users size={16} className="text-purple-500" />;
      case 'cow':
        return <Clipboard size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start">
      <div className="p-2 bg-gray-100 rounded-full mr-4 mt-1">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1">
        <p className="text-gray-800">{activity.text}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
      </div>
    </div>
  );
};

// Component for expanded activity item (used in modal)
const ExpandedActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'health':
        return <Thermometer size={18} className="text-red-500" />;
      case 'milk':
        return <Droplet size={18} className="text-blue-500" />;
      case 'employee':
        return <Users size={18} className="text-purple-500" />;
      case 'cow':
        return <Clipboard size={18} className="text-green-500" />;
      default:
        return null;
    }
  };

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case 'health':
        return 'Health Event';
      case 'milk':
        return 'Milk Production';
      case 'employee':
        return 'Employee Activity';
      case 'cow':
        return 'Cow Management';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start">
        <div className="p-2 bg-gray-100 rounded-full mr-4 mt-1">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 mr-2">
              {getActivityTypeLabel(activity.type)}
            </span>
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
          <p className="text-gray-800 font-medium mt-1">{activity.text}</p>
          <p className="text-sm text-gray-600 mt-2">{activity.details}</p>
        </div>
      </div>
    </div>
  );
};

// Component for task item
const TaskItem = ({ title, completed }) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={completed}
        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
      />
      <span className={`ml-3 text-sm ${completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {title}
      </span>
    </div>
  );
};

// Component for notification item
const NotificationItem = ({ type, text, time, isRead }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'health':
        return <Thermometer size={16} className="text-red-500" />;
      case 'milk':
        return <Droplet size={16} className="text-blue-500" />;
      case 'employee':
        return <Users size={16} className="text-purple-500" />;
      case 'system':
        return <Settings size={16} className="text-gray-500" />;
      case 'feed':
        return <Clipboard size={16} className="text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`px-4 py-3 hover:bg-gray-50 ${isRead ? 'opacity-70' : ''}`}>
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-3 ${isRead ? 'bg-gray-100' : 'bg-blue-50'}`}>
          {getNotificationIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{text}</p>
          <p className="text-xs text-gray-500 mt-1">{time}</p>
        </div>
        {!isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
};

// Component for profile menu item
const ProfileMenuItem = ({ icon, text }) => {
  return (
    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
      <span className="mr-2 text-gray-500">{icon}</span>
      {text}
    </a>
  );
};

// Styled Dropdown Component
const StyledDropdown = ({ value, onChange, options }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown size={16} className="text-gray-500" />
      </div>
    </div>
  );
};

// Activities Modal Component
const ActivitiesModal = ({ activities, onClose, filter, setFilter }) => {
  // Filter activities based on selected filter
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-hidden m-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Farm Activities</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-100 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Filter Controls */}
          <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-gray-700 min-w-max">Filter by:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Activities
            </button>
            <button
              onClick={() => setFilter('health')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'health' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Health Events
            </button>
            <button
              onClick={() => setFilter('milk')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'milk' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Milk Production
            </button>
            <button
              onClick={() => setFilter('employee')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'employee' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Employee Activities
            </button>
            <button
              onClick={() => setFilter('cow')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'cow' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cow Management
            </button>
          </div>
          
          {/* Activity List */}
          <div className="max-h-96 overflow-y-auto pr-2">
            <div className="space-y-4">
              {filteredActivities.length > 0 ? (
                filteredActivities.map(activity => (
                  <ExpandedActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No activities found for this filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredActivities.length}</span> activities found
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Task Modal Component
const AddTaskModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
    priority: 'medium',
    assignedTo: '',
    taskType: 'general',
    reminder: false
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Task data:', formData);
    // Here you would add the task to your tasks list
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Add New Task</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-100 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter task description"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date*
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time
                </label>
                <input
                  type="time"
                  id="dueTime"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a person</option>
                  <option value="John">John Farmer</option>
                  <option value="Sarah">Sarah Smith</option>
                  <option value="David">David Johnson</option>
                  <option value="team">Farm Team</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
                Task Type
              </label>
              <select
                id="taskType"
                name="taskType"
                value={formData.taskType}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="general">General</option>
                <option value="milking">Milking</option>
                <option value="feeding">Feeding</option>
                <option value="health">Health Check</option>
                <option value="maintenance">Maintenance</option>
                <option value="administrative">Administrative</option>
              </select>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="reminder"
                  name="reminder"
                  type="checkbox"
                  checked={formData.reminder}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="reminder" className="font-medium text-gray-700">Set Reminder</label>
                <p className="text-gray-500">You will receive a notification before the task is due</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default FarmDashboard;