import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, Menu, X, User, Search, ChevronDown, Home, Users, Droplet, Thermometer, DollarSign, Clipboard, Settings, LogOut, IndianRupee } from 'lucide-react';

// Mock data
const mockKpiData = {
  totalCows: 247,
  milkProduction: 1863,
  healthAlerts: 5,
  activeTasks: 12,
  revenue: 28650
};

const mockMilkProductionData = [
  { month: 'Jan', production: 1420 },
  { month: 'Feb', production: 1520 },
  { month: 'Mar', production: 1650 },
  { month: 'Apr', production: 1700 },
  { month: 'May', production: 1850 },
  { month: 'Jun', production: 1950 },
  { month: 'Jul', production: 1863 },
];

const mockCowHealthData = [
  { name: 'Healthy', value: 210, color: '#4CAF50' },
  { name: 'Monitored', value: 32, color: '#FFA000' },
  { name: 'Treatment', value: 5, color: '#F44336' },
];

const mockRecentActivities = [
  { id: 1, type: 'health', text: 'Cow #A128 received vaccination', time: '15 min ago' },
  { id: 2, type: 'milk', text: 'Morning collection complete: 427L', time: '2 hours ago' },
  { id: 3, type: 'employee', text: 'John started his shift', time: '3 hours ago' },
  { id: 4, type: 'cow', text: 'New cow registered: #B094', time: '5 hours ago' }
];

const FarmDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentWeather, setCurrentWeather] = useState({ temp: 24, condition: 'Sunny' });

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            {/* <div className="flex items-center">
              <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 mr-4">
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            </div> */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell size={22} />
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                  <User size={22} className="text-gray-500" />
                </div>
                <span className="text-sm font-medium">John Farmer</span>
                <ChevronDown size={16} className="ml-1 text-gray-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
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
              value={`${mockKpiData.revenue}`}
              icon={<IndianRupee className="text-green-700" />}
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
                <select className="border rounded-md px-3 py-1 text-sm bg-white">
                  <option>Last 7 days</option>
                  <option>This month</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockMilkProductionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                      formatter={(value) => [`${value}L`, 'Production']}
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
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={mockCowHealthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {mockCowHealthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} cows`, name]}
                      contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-6">
                {mockCowHealthData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities and Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm p-6 col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
                <button className="text-green-600 text-sm font-medium hover:text-green-700">View All</button>
              </div>
              <div className="space-y-4">
                {mockRecentActivities.map((activity) => (
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
                <button className="mt-4 text-green-600 text-sm font-medium hover:text-green-700 flex items-center">
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

export default FarmDashboard;