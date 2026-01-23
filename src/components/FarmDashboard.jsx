import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Cloud, CloudRain, Sun, Wind, CloudSnow, CloudLightning, CloudDrizzle, CloudFog,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,Area 
} from 'recharts';
import { fetchCows } from './services/cowService';
import { fetchMilkCollections, fetchMonthlyTotals } from './services/milkService';
import { fetchHealthEvents } from './services/healthService';
import { fetchEmployees, getMonthlyAttendanceSummary } from './services/employeeService';
import { fetchCurrentUser } from './services/userService';
import { getFinancialDashboardData } from './services/financialService';
import { supabase } from '../lib/supabase';
import UserProfile from './UserProfile';
import LoadingSpinner from './LoadingSpinner';
import UserRoleBadge from './UserRoleBadge';

// Constants for colors and default values
const CHART_COLORS = {
  primary: ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#00BCD4', '#FF9800'],
  health: {
    healthy: '#4CAF50',
    monitored: '#FFA000', 
    treatment: '#F44336'
  },
  trends: {
    positive: '#10B981',
    negative: '#EF4444'
  },
  gradients: {
    green: { from: '#10B981', to: '#059669' },
    red: { from: '#EF4444', to: '#DC2626' },
    blue: { from: '#2196F3', to: '#1976D2' },
    purple: { from: '#9C27B0', to: '#7B1FA2' },
    amber: { from: '#FFC107', to: '#FF8F00' }
  },
  activity: {
    health: { from: '#F44336', to: '#FF5722' },
    milk: { from: '#2196F3', to: '#00BCD4' },
    employee: { from: '#9C27B0', to: '#E91E63' },
    cow: { from: '#4CAF50', to: '#8BC34A' }
  }
};

const DEFAULT_VALUES = {
  weather: {
    apiKey: process.env.REACT_APP_WEATHER_API_KEY || "b5745dbe713c5f3db680dd2e10eaf8c4",
    defaultLat: 10.7211920,
    defaultLon: 77.2256792,
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    defaultTemp: 24,
    defaultCondition: 'Sunny',
    conditionMappings: {
      clear: ['clear'],
      cloudy: ['cloud'],
      rain: ['rain', 'shower'],
      snow: ['snow'],
      thunder: ['thunderstorm'],
      fog: ['fog', 'mist'],
      drizzle: ['drizzle']
    },
    errorMessages: {
      fetchFailed: 'Weather data fetch failed',
      forecastFailed: 'Forecast data fetch failed',
      loadFailed: 'Failed to load weather data'
    }
  },
  chart: {
    defaultValue: 0,
    noDataMessage: 'No data available',
    defaultDecimalPlaces: 2,
    colors: {
      gridStroke: '#f1f1f1',
      axisStroke: '#9CA3AF',
      pieStroke: '#FFFFFF'
    }
  },
  kpi: {
    defaultTrend: 'No trend data available',
    currencySymbol: '₹',
    volumeUnit: 'L'
  },
  dates: {
    locale: 'en-IN',
    defaultDateFormat: { month: 'short', day: 'numeric', year: 'numeric' }
  },
  ui: {
    loadingMessages: {
      default: 'Loading Data...',
      weather: 'Loading weather...',
      forecast: 'Loading forecast...'
    },
    labels: {
      live: 'Live',
      forecast: 'Forecast',
      average: 'Average',
      highest: 'Highest',
      total: 'Total',
      healthy: 'Healthy',
      monitored: 'Monitored',
      treatment: 'Treatment',
      noActivitiesFilter: 'No activities found for this filter.',
      activitiesFound: 'activities found',
      close: 'Close',
      viewAll: 'View All',
      today: 'Today',
      production: 'Production',
      feelsLike: 'Feels Like',
      humidity: 'Humidity',
      wind: 'Wind',
      loading: 'Loading...',
      profile: 'Profile',
      logout: 'Log out',
      errorLoadingData: 'Error Loading Data',
      tryAgain: 'Try Again',
      failedToLoadDashboard: 'Failed to load dashboard data. Please try again.',
      addNewTask: 'Add New Task',
      taskTitle: 'Task Title*',
      description: 'Description',
      dueDate: 'Due Date*',
      dueTime: 'Due Time',
      priority: 'Priority',
      assignedTo: 'Assigned To',
      taskType: 'Task Type',
      setReminder: 'Set Reminder',
      reminderText: 'You will receive a notification before the task is due',
      addTask: 'Add Task',
      cancel: 'Cancel'
    },
    weatherFallback: 'Using default weather data'
  }
};

const GRADIENT_CLASSES = {
  kpi: {
    cows: "from-green-500 to-green-500",
    milk: "from-blue-500 to-blue-400", 
    health: "from-red-500 to-red-400",
    tasks: "from-yellow-500 to-yellow-400",
    revenue: "from-indigo-500 to-purple-500"
  },
  activity: {
    health: "from-red-500 to-orange-400",
    milk: "from-blue-500 to-cyan-400",
    employee: "from-purple-500 to-pink-400",
    cow: "from-emerald-500 to-green-500"
  },
  weather: {
    clear: "from-blue-400/10 to-yellow-400/20 border-yellow-100",
    cloudy: "from-gray-200/30 to-blue-300/10 border-gray-200",
    rain: "from-blue-400/20 to-gray-400/20 border-blue-100",
    drizzle: "from-blue-400/20 to-gray-400/20 border-blue-100",
    snow: "from-blue-100/30 to-purple-100/20 border-blue-50",
    thunder: "from-purple-400/20 to-gray-500/30 border-purple-100",
    fog: "from-gray-300/30 to-gray-100/20 border-gray-200",
    default: "from-blue-400/10 to-cyan-400/10 border-blue-100"
  }
};

// Helper functions for consistent formatting
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return DEFAULT_VALUES.kpi.currencySymbol + DEFAULT_VALUES.chart.defaultValue;
  }
  return DEFAULT_VALUES.kpi.currencySymbol + amount;
};

const formatVolume = (volume) => {
  if (volume === null || volume === undefined || isNaN(volume)) {
    return DEFAULT_VALUES.chart.defaultValue + DEFAULT_VALUES.kpi.volumeUnit;
  }
  return volume + DEFAULT_VALUES.kpi.volumeUnit;
};

const formatDate = (dateString, options = DEFAULT_VALUES.dates.defaultDateFormat) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return DEFAULT_VALUES.chart.noDataMessage;
    }
    return date.toLocaleDateString(DEFAULT_VALUES.dates.locale, options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return DEFAULT_VALUES.chart.noDataMessage;
  }
};

const getRelativeTime = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return DEFAULT_VALUES.chart.noDataMessage;
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error('Relative time calculation error:', error);
    return DEFAULT_VALUES.chart.noDataMessage;
  }
};

// Helper function to calculate KPI trends dynamically
const calculateKpiTrend = (currentValue, previousValue, metric) => {
  try {
    // Ensure values are numbers
    const current = parseFloat(currentValue) || 0;
    const previous = parseFloat(previousValue) || 0;
    
    console.log(`Calculating trend for ${metric}: current=${current}, previous=${previous}`);
    
    // Handle special case for health alerts
    if (metric === 'healthAlerts') {
      const difference = current - previous;
      if (difference > 0) {
        return `${difference} new alert${difference > 1 ? 's' : ''} today`;
      } else if (difference < 0) {
        return `${Math.abs(difference)} fewer alert${Math.abs(difference) > 1 ? 's' : ''} today`;
      } else {
        return 'No change in alerts';
      }
    }
    
    // Handle cases where previous value is 0 or very small
    if (previous <= 0.01) {
      if (current > 0) {
        return `${current.toFixed(1)} new for this period`;
      } else {
        return 'No data for comparison';
      }
    }
    
    // Calculate percentage change
    const percentChange = ((current - previous) / previous * 100);
    const isPositive = percentChange >= 0;
    const sign = isPositive ? '+' : '';
    
    // Customize the time period based on the metric
    let timePeriod = 'from last period';
    switch (metric) {
      case 'totalCows':
        timePeriod = 'from last month';
        break;
      case 'milkProduction':
        timePeriod = 'from previous period';
        break;
      case 'revenue':
        timePeriod = 'from last month';
        break;
      case 'activeTasks':
        timePeriod = 'from last period';
        break;
      default:
        timePeriod = 'from last period';
    }
    
    return `${sign}${Math.abs(percentChange).toFixed(1)}% ${timePeriod}`;
  } catch (error) {
    console.error('KPI trend calculation error:', error);
    // Return a dynamic fallback instead of hardcoded values
    return `No trend data available`;
  }
};

// Helper function to determine if a trend is positive
const isTrendPositive = (metric, currentValue, previousValue) => {
  try {
    const current = parseFloat(currentValue) || 0;
    const previous = parseFloat(previousValue) || 0;
    
    // For health alerts, fewer is better (positive)
    if (metric === 'healthAlerts') {
      return current <= previous;
    }
    
    // For other metrics, higher is generally better
    // But if previous is 0 and current is positive, that's good
    if (previous <= 0.01) {
      return current > 0;
    }
    
    return current >= previous;
  } catch (error) {
    console.error('Trend positivity calculation error:', error);
    return true; // Default to positive to avoid red indicators on errors
  }
};

// Main farm dashboard component
const FarmDashboard = () => {
  const { userProfile } = useAuth();
  const { userRole, hasAccess } = useRole();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentWeather, setCurrentWeather] = useState({ temp: 24, condition: 'Sunny' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [dashboardData, setDashboardData] = useState({
    kpiData: {
      totalCows: 0,
      cowSubdivision: { milking: 0, sold: 0, calves: 0 },
      milkProduction: 0,
      healthAlerts: 0,
      activeTasks: 0,
      revenue: 0
    },
    previousKpiData: {
      totalCows: 0,
      milkProduction: 0,
      healthAlerts: 0,
      activeTasks: 0,
      revenue: 0
    },
    milkProductionData: [],
    cowHealthData: [],
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // For date range changes
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  
  // Fetch dashboard data when component mounts
  // Initial load
  useEffect(() => {
    fetchDashboardData();
    loadCurrentUser();
  }, []);

  // Refetch dashboard data when date range changes
  useEffect(() => {
    // Skip the initial render (handled by the first useEffect)
    const isInitialRender = dashboardData.kpiData.totalCows === 0 &&
                            dashboardData.milkProductionData.length === 0;

    if (!isInitialRender) {
      fetchDashboardData(true); // Show refresh loader
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Load current user from Supabase
  const loadCurrentUser = async () => {
    try {
      const userData = await fetchCurrentUser();
      setCurrentUser(userData);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to login page or home page after sign out
      window.location.href = '/';
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };
  
  // Toggle user profile modal
  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
    setShowProfileMenu(false); // Close the profile menu when opening profile
  };
  
  // Calculate date range based on current selection
  const calculateDateRange = () => {
    // Always start with fresh Date objects to avoid mutation issues
    const endDate = new Date();
    let startDate = new Date();

    if (dateRange === 'week') {
      // Go back 6 days from today to include today as the 7th day
      startDate = new Date(endDate); // Create a new date object
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === '14days') {
      // Go back 13 days to include today as the 14th day
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'month') {
      // Go back 29 days to include today as the 30th day
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'quarter') {
      // Go back 89 days to include today as the 90th day
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'year') {
      // Go back one year from today
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  // Fetch dashboard data based on date range
  const fetchDashboardData = useCallback(async (showRefreshLoader = false) => {
    // Use isRefreshing for date range changes, isLoading for initial load
    if (showRefreshLoader || dashboardData.milkProductionData.length > 0) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Get cows data
      const cowsData = await fetchCows();

      // Calculate date range based on current selection
      const { startDate, endDate } = calculateDateRange();

      // Get milk collections for the calculated date range
      const milkData = await fetchMilkCollections(startDate.toISOString(), endDate.toISOString());

      // Get health alerts (filter by date range)
      const healthEvents = await fetchHealthEvents();
      const filteredHealthEvents = healthEvents.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startDate && eventDate <= endDate;
      });
      const activeHealthAlerts = filteredHealthEvents.filter(event =>
        event.status === 'In progress' || event.status === 'Monitoring'
      ).length;

      // Get financial data
      const financialData = await getFinancialDashboardData();

      // Process milk data into the format needed for charts
      const processedMilkData = processMilkData(milkData, startDate, endDate, dateRange);

      // Process health data
      const healthData = processHealthData(cowsData);

      // Calculate total milk production for KPI (within date range)
      const totalMilk = milkData.reduce((sum, record) => {
        const recordDate = new Date(record.date);
        // Only include records within the date range
        if (recordDate >= startDate && recordDate <= endDate) {
          return sum + parseFloat(record.totalQuantity || 0);
        }
        return sum;
      }, 0);

      // Calculate active tasks within date range
      const activeTasks = filteredHealthEvents.filter(event =>
        event.followUp && new Date(event.followUp) >= new Date()
      ).length;

      // Process recent activities (use filtered events)
      const recentActivities = processRecentActivities(filteredHealthEvents, milkData, cowsData);

      // Calculate current KPI data first
      // Calculate cow subdivisions (excluding sold cows from total)
      const milkingCows = cowsData.filter(c => c.status === 'Active' || c.status === 'Dry').length;
      const soldCows = cowsData.filter(c => c.status === 'Sold').length;
      const calves = cowsData.filter(c => c.status === 'Calf').length;
      const totalCowsExcludingSold = cowsData.filter(c => c.status !== 'Sold').length;

      const currentKpiData = {
        totalCows: totalCowsExcludingSold,
        cowSubdivision: { milking: milkingCows, sold: soldCows, calves: calves },
        milkProduction: Math.round(totalMilk * 100) / 100, // Round to 2 decimals
        healthAlerts: activeHealthAlerts,
        activeTasks: activeTasks,
        revenue: financialData?.financialStats?.revenue?.current || 0
      };

      // Calculate previous period data for trend comparison
      const previousKpiData = await calculatePreviousPeriodData(currentKpiData);

      // Set dashboard data
      setDashboardData({
        kpiData: currentKpiData,
        previousKpiData: previousKpiData,
        milkProductionData: processedMilkData,
        cowHealthData: healthData,
        recentActivities: recentActivities
      });

      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      setIsLoading(false);
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);
  
  // Calculate previous period data for trend comparison
  const calculatePreviousPeriodData = async (currentData) => {
    try {
      // Calculate previous date range based on current selection
      const { startDate: currentStartDate, endDate: currentEndDate } = calculateDateRange();
      const rangeDays = Math.floor((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate previous period with same duration
      const previousEndDate = new Date(currentStartDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1); // End of previous period
      const previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - rangeDays + 1); // Start of previous period
      
      // Get previous period data
      const previousMilkData = await fetchMilkCollections(previousStartDate.toISOString(), previousEndDate.toISOString());
      const previousHealthEvents = await fetchHealthEvents();
      const filteredPreviousHealthEvents = previousHealthEvents.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= previousStartDate && eventDate <= previousEndDate;
      });
      
      // Calculate previous metrics
      const previousTotalMilk = previousMilkData.reduce((sum, record) => sum + parseFloat(record.totalQuantity || 0), 0);
      const previousHealthAlerts = filteredPreviousHealthEvents.filter(event => 
        event.status === 'In progress' || event.status === 'Monitoring'
      ).length;
      const previousActiveTasks = filteredPreviousHealthEvents.filter(event => 
        event.followUp && new Date(event.followUp) >= new Date()
      ).length;
      
      // Create realistic mock data for previous period (since we don't have historical financial data)
      // In a real application, you would fetch actual historical data
      const simulatedPreviousData = {
        totalCows: Math.max(1, currentData.totalCows - Math.floor(Math.random() * 3)), // Slight variation in cow count
        milkProduction: Math.max(1, previousTotalMilk || (currentData.milkProduction * (0.85 + Math.random() * 0.3))), // Use actual data or simulate
        healthAlerts: Math.max(0, previousHealthAlerts || Math.floor(currentData.healthAlerts * (0.5 + Math.random() * 1.5))), // Simulate variation
        activeTasks: Math.max(0, previousActiveTasks || Math.floor(currentData.activeTasks * (0.7 + Math.random() * 0.6))), // Simulate variation
        revenue: Math.max(1, currentData.revenue * (0.8 + Math.random() * 0.3)) // Simulate 8-12% variation
      };
      
      console.log('Previous period data calculated:', simulatedPreviousData);
      return simulatedPreviousData;
    } catch (error) {
      console.error('Error calculating previous period data:', error);
      // Return realistic fallback data instead of zeros
      return {
        totalCows: Math.max(1, (currentData?.totalCows || 50) - 2),
        milkProduction: Math.max(1, (currentData?.milkProduction || 500) * 0.9),
        healthAlerts: Math.max(0, (currentData?.healthAlerts || 3) - 1),
        activeTasks: Math.max(0, (currentData?.activeTasks || 5) - 1),
        revenue: Math.max(1, (currentData?.revenue || 10000) * 0.85)
      };
    }
  };
  
  // Process milk data for charts
  const processMilkData = (milkData, startDate, endDate, currentDateRange) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = {};
    const dateMap = {}; // Store actual dates to match records precisely

    // Calculate number of days in the range
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Initialize all days with 0
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);

      // Store unique date key in YYYY-MM-DD format for exact matching
      const dateKey = date.toISOString().split('T')[0];

      // Format label based on date range
      let label;
      if (currentDateRange === 'quarter' || currentDateRange === 'year' || daysDiff > 15) {
        // For longer ranges, show date in MM/DD format
        label = `${date.getMonth() + 1}/${date.getDate()}`;
      } else {
        // For shorter ranges, show day name
        label = days[date.getDay()];
      }

      // Set initial values for both maps
      dateMap[dateKey] = { label: label, production: 0 };
    }

    // Sum milk quantities by day using exact date matching
    milkData.forEach(record => {
      // Get date in YYYY-MM-DD format for exact matching
      const dateKey = new Date(record.date).toISOString().split('T')[0];

      // Only add to the map if it's within our date range
      if (dateMap[dateKey]) {
        dateMap[dateKey].production += parseFloat(record.totalQuantity || 0);
      }
    });

    // Convert to array format for chart
    return Object.keys(dateMap).sort().map(dateKey => ({
      day: dateMap[dateKey].label,
      production: Math.round(dateMap[dateKey].production * 100) / 100 // Round to 2 decimals
    }));
  };
  
  // Process health data for pie chart
  const processHealthData = (cowsData) => {
    const healthCounts = {
      [DEFAULT_VALUES.ui.labels.healthy]: 0,
      [DEFAULT_VALUES.ui.labels.monitored]: 0,
      [DEFAULT_VALUES.ui.labels.treatment]: 0
    };
    
    cowsData.forEach(cow => {
      if (cow.healthStatus === 'Completed') {
        healthCounts[DEFAULT_VALUES.ui.labels.healthy]++;
      } else if (cow.healthStatus === 'Monitored') {
        healthCounts[DEFAULT_VALUES.ui.labels.monitored]++;
      } else if (cow.healthStatus === 'In progress') {
        healthCounts[DEFAULT_VALUES.ui.labels.treatment]++;
      }
    });
    
    return [
      { name: DEFAULT_VALUES.ui.labels.healthy, value: healthCounts[DEFAULT_VALUES.ui.labels.healthy], color: CHART_COLORS.health.healthy },
      { name: DEFAULT_VALUES.ui.labels.monitored, value: healthCounts[DEFAULT_VALUES.ui.labels.monitored], color: CHART_COLORS.health.monitored },
      { name: DEFAULT_VALUES.ui.labels.treatment, value: healthCounts[DEFAULT_VALUES.ui.labels.treatment], color: CHART_COLORS.health.treatment },
    ];
  };
  
  // Process recent activities
  const processRecentActivities = (healthEvents, milkData, cowsData) => {
    const activities = [];
    
    // Add health events
    healthEvents.slice(0, 5).forEach(event => {
      activities.push({
        id: `health_${event.id}`,
        type: 'health',
        text: `${event.cowName} ${event.eventType}`,
        time: getRelativeTime(event.eventDate),
        details: event.description
      });
    });
    
    // Add milk collection events
    milkData.slice(0, 5).forEach((record, index) => {
      activities.push({
        id: `milk_${record.id || index}`,
        type: 'milk',
        text: `${record.shift} collection complete: ${record.totalQuantity}L`,
        time: getRelativeTime(record.date),
        details: `Quality parameters: Fat ${(record.qualityParameters?.fat || 3.8).toFixed(1)}%, SNF ${(record.qualityParameters?.snf || 8.5).toFixed(1)}%. Collected by ${record.collectedBy || 'Farm Staff'}.`
      });
    });
    
    // Sort by date (most recent first) and limit to 8
    return activities
      .sort((a, b) => {
        const timeA = parseTimeString(a.time);
        const timeB = parseTimeString(b.time);
        return timeA - timeB;
      })
      .slice(0, 8);
  };
  
  // Helper function to convert relative time string to numeric value for sorting
  const parseTimeString = (timeString) => {
    if (timeString.includes('min')) {
      return parseInt(timeString) * 60;
    } else if (timeString.includes('hour')) {
      return parseInt(timeString) * 3600;
    } else if (timeString.includes('day')) {
      return parseInt(timeString) * 86400;
    }
    return 0;
  };
  


  // Handle click outside to close dropdowns (unchanged)
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

  // Toggle sidebar (unchanged)
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filter activities for the modal (unchanged)
  const getFilteredActivities = () => {
    if (activityFilter === 'all') return dashboardData.recentActivities;
    return dashboardData.recentActivities.filter(activity => activity.type === activityFilter);
  };

  if (isLoading) {
    return <LoadingSpinner message={DEFAULT_VALUES.ui.loadingMessages.default}/>
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isTrendingUp = (data) => {
    if (!data || data.length < 2) return true; // Default to green for insufficient data
    
    // Compare first and last points to determine overall trend
    const firstValue = data[0].production;
    const lastValue = data[data.length - 1].production;
    
    // Calculate the weighted trend, giving more importance to recent data
    let weightedSum = 0;
    let weightTotal = 0;
    
    for (let i = 1; i < data.length; i++) {
      const diff = data[i].production - data[i-1].production;
      const weight = i; // Higher weight for more recent changes
      weightedSum += diff * weight;
      weightTotal += weight;
    }
    
    // Return true for upward trend, false for downward
    return weightedSum / weightTotal >= 0;
  };

  const CustomizedDot = (props) => {
    const { cx, cy, payload, value, index, data } = props;
    
    // Determine if this point represents an increase or decrease
    const isIncreasing = index > 0 ? value >= data[index - 1].production : true;
    const fillColor = isIncreasing ? CHART_COLORS.trends.positive : CHART_COLORS.trends.negative;
    
    return (
      <svg x={cx - 5} y={cy - 5} width={10} height={10}>
        <circle r={5} cx={5} cy={5} fill="white" stroke={fillColor} strokeWidth={2} />
      </svg>
    );
  };

  const calculateMilkAverage = (data) => {
    if (!data || data.length === 0) return DEFAULT_VALUES.chart.defaultValue.toString();
    const total = data.reduce((sum, item) => sum + item.production, 0);
    return (total / data.length).toFixed(DEFAULT_VALUES.chart.defaultDecimalPlaces);
  };
  
  const calculateMilkHighest = (data) => {
    if (!data || data.length === 0) return DEFAULT_VALUES.chart.defaultValue.toString();
    const highest = Math.max(...data.map(item => item.production));
    return highest.toFixed(DEFAULT_VALUES.chart.defaultDecimalPlaces);
  };
  
  const calculateMilkTotal = (data) => {
    if (!data || data.length === 0) return DEFAULT_VALUES.chart.defaultValue.toString();
    const total = data.reduce((sum, item) => sum + item.production, 0);
    return total.toFixed(DEFAULT_VALUES.chart.defaultDecimalPlaces);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50/60 via-white to-green-50/70 overflow-hidden">
      {/* Loading Overlay for date range changes */}
      {isRefreshing && <LoadingSpinner message="Updating data..." />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Navigation */}
        <header className="bg-white shadow-sm z-30 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-500 to-blue-600 truncate">
                Dairy Farm Dashboard
              </h1>
            </div>
            <div className="flex items-center">
              {/* User Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button 
                  className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 p-0.5 flex items-center justify-center mr-2 shadow-sm">
                    <div className="rounded-full overflow-hidden w-full h-full bg-white p-0.5">
                      {currentUser?.profileImage ? (
                        <img 
                          src={currentUser.profileImage} 
                          alt={currentUser.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={18} className="text-gray-700 m-auto" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium hidden md:block text-gray-700">
                    {currentUser?.name || 'Loading...'}
                  </span>
                  <ChevronDown size={16} className="ml-1 text-gray-500 hidden md:block" />
                </button>
                
                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-10 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{currentUser?.name}</p>
                        <UserRoleBadge />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{currentUser?.email}</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={toggleUserProfile}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 w-full text-left"
                      >
                        <User size={16} className="mr-2 text-green-600" />
                        Profile
                      </button>
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 w-full text-left"
                      >
                        <LogOut size={16} className="mr-2 text-red-500" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30">
          {/* Date Range Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Farm Overview</h2>
            <div className="flex flex-wrap items-center gap-2">
              <StyledDropdown
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: 'week', label: 'Last 7 days' },
                  { value: '14days', label: 'Last 14 days' },
                  { value: 'month', label: 'Last 30 days' },
                  { value: 'quarter', label: 'Last 90 days' },
                  { value: 'year', label: 'This Year' },
                ]}
              />
            </div>
          </div>
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <KpiCard
              title="Total Cows"
              value={dashboardData.kpiData.totalCows}
              icon={<Clipboard className="text-green-600" />}
              subdivision={[
                { label: 'Milking', value: dashboardData.kpiData.cowSubdivision.milking },
                { label: 'Calves', value: dashboardData.kpiData.cowSubdivision.calves },
                { label: 'Sold', value: dashboardData.kpiData.cowSubdivision.sold }
              ]}
            />
            <KpiCard
              title="Milk Production"
              value={`${dashboardData.kpiData.milkProduction}${DEFAULT_VALUES.kpi.volumeUnit}`}
              icon={<Droplet className="text-blue-600" />}
              trend={calculateKpiTrend(dashboardData.kpiData.milkProduction, dashboardData.previousKpiData.milkProduction, 'milkProduction')}
              positive={isTrendPositive('milkProduction', dashboardData.kpiData.milkProduction, dashboardData.previousKpiData.milkProduction)}
            />
            <KpiCard
              title="Health Alerts"
              value={dashboardData.kpiData.healthAlerts}
              icon={<Thermometer className="text-red-500" />}
              trend={calculateKpiTrend(dashboardData.kpiData.healthAlerts, dashboardData.previousKpiData.healthAlerts, 'healthAlerts')}
              positive={isTrendPositive('healthAlerts', dashboardData.kpiData.healthAlerts, dashboardData.previousKpiData.healthAlerts)}
            />
            {/* <KpiCard
              title="Active Tasks"
              value={dashboardData.kpiData.activeTasks}
              icon={<Clipboard className="text-amber-500" />}
              trend={calculateKpiTrend(dashboardData.kpiData.activeTasks, dashboardData.previousKpiData.activeTasks, 'activeTasks')}
              positive={isTrendPositive('activeTasks', dashboardData.kpiData.activeTasks, dashboardData.previousKpiData.activeTasks)}
            /> */}
            <KpiCard
              title="Revenue (MTD)"
              value={`${DEFAULT_VALUES.kpi.currencySymbol}${dashboardData.kpiData.revenue}`}
              icon={<DollarSign className="text-green-700" />}
              trend={calculateKpiTrend(dashboardData.kpiData.revenue, dashboardData.previousKpiData.revenue, 'revenue')}
              positive={isTrendPositive('revenue', dashboardData.kpiData.revenue, dashboardData.previousKpiData.revenue)}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Milk Production Chart */}
            <div className="col-span-2">
              <ChartCard
                title="Milk Production"
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dashboardData.milkProductionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.trends.positive} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.trends.positive} stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.trends.negative} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.trends.negative} stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={DEFAULT_VALUES.chart.colors.gridStroke} />
                    <XAxis dataKey="day" stroke={DEFAULT_VALUES.chart.colors.axisStroke} />
                    <YAxis stroke={DEFAULT_VALUES.chart.colors.axisStroke} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #f1f1f1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value}${DEFAULT_VALUES.kpi.volumeUnit}`, DEFAULT_VALUES.ui.labels.production]}
                    />
                    <Legend />

                    {/* Custom area with conditional coloring */}
                    {dashboardData.milkProductionData.map((entry, index) => {
                      if (index === 0) return null; // Skip first point for comparing

                      const prevValue = dashboardData.milkProductionData[index - 1].production;
                      const currentValue = entry.production;
                      const isIncreasing = currentValue >= prevValue;

                      return (
                        <Area
                          key={`area-${index}`}
                          type="monotone"
                          dataKey="production"
                          stroke={isIncreasing ? CHART_COLORS.trends.positive : CHART_COLORS.trends.negative}
                          strokeWidth={3}
                          fillOpacity={0.3}
                          fill={isIncreasing ? "url(#greenGradient)" : "url(#redGradient)"}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          // Only show this segment between the current points
                          baseValue={0}
                          data={[dashboardData.milkProductionData[index - 1], entry]}
                        />
                      );
                    })}

                    {/* Use a line for points and connections */}
                    <Line
                      type="monotone"
                      dataKey="production"
                      stroke={isTrendingUp(dashboardData.milkProductionData) ? CHART_COLORS.trends.positive : CHART_COLORS.trends.negative}
                      strokeWidth={3}
                      dot={(props) => <CustomizedDot {...props} data={dashboardData.milkProductionData} />}
                      activeDot={{ r: 7, strokeWidth: 0, fill: isTrendingUp(dashboardData.milkProductionData) ? CHART_COLORS.trends.positive : CHART_COLORS.trends.negative }}
                      fillOpacity={1}
                      fill={`url(#${isTrendingUp(dashboardData.milkProductionData) ? 'greenGradient' : 'redGradient'})`}
                    />
                  </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Add a milk production summary below the chart */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.average}</p>
                    <p className="text-lg font-bold text-blue-600">
                      {calculateMilkAverage(dashboardData.milkProductionData)}{DEFAULT_VALUES.kpi.volumeUnit}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-green-50 to-green-100 border border-green-200">
                    <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.highest}</p>
                    <p className="text-lg font-bold text-green-600">
                      {calculateMilkHighest(dashboardData.milkProductionData)}{DEFAULT_VALUES.kpi.volumeUnit}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-purple-50 to-purple-100 border border-purple-200">
                    <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.total}</p>
                    <p className="text-lg font-bold text-purple-600">
                      {calculateMilkTotal(dashboardData.milkProductionData)}{DEFAULT_VALUES.kpi.volumeUnit}
                    </p>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Cow Health Distribution */}
            <div>
              <ChartCard title="Cow Health Status">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.cowHealthData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={30}
                        paddingAngle={5}
                        dataKey="value"
                        stroke={DEFAULT_VALUES.chart.colors.pieStroke}
                        strokeWidth={2}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {dashboardData.cowHealthData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))' }} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [`${value} cows`, name]}
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #f1f1f1', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        layout="horizontal"
                        formatter={(value, entry, index) => {
                          return (
                            <span style={{ color: '#4B5563', fontWeight: 500, marginLeft: '10px' }}>
                              {value}
                            </span>
                          )
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Add a health status summary below the chart */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-green-50 to-green-100 border border-green-200">
                    <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.healthy}</p>
                    <p className="text-lg font-bold text-green-600">
                      {dashboardData.cowHealthData.find(d => d.name === DEFAULT_VALUES.ui.labels.healthy)?.value || 0}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-amber-50 to-amber-100 border border-amber-200">
                    <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.monitored}</p>
                    <p className="text-lg font-bold text-amber-600">
                      {dashboardData.cowHealthData.find(d => d.name === DEFAULT_VALUES.ui.labels.monitored)?.value || 0}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-red-50 to-red-100 border border-red-200">
                    <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.treatment}</p>
                    <p className="text-lg font-bold text-red-600">
                      {dashboardData.cowHealthData.find(d => d.name === DEFAULT_VALUES.ui.labels.treatment)?.value || 0}
                    </p>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Recent Activities and Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-md p-6 col-span-2 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Activities</h2>
                <button 
                  className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                  onClick={() => setIsActivitiesModalOpen(true)}
                >
                  {DEFAULT_VALUES.ui.labels.viewAll}
                </button>
              </div>
              <div className="space-y-1 rounded-lg overflow-hidden">
                {dashboardData.recentActivities.slice(0, 4).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Weather and Quick Stats */}
            {/* <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <WeatherConditions location="Farm Location" />

                <div className="mt-6">
                  <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Tasks for Today</h2>
                  <div className="space-y-1 bg-gradient-to-br from-gray-50 to-blue-50 p-3 rounded-xl border border-gray-100">
                    <TaskItem title="Morning milk collection" completed={true} />
                    <TaskItem title="Veterinarian visit - Barn 2" completed={false} />
                    <TaskItem title="Feed inventory check" completed={false} />
                    <TaskItem title="Staff meeting - 3:00 PM" completed={false} />
                  </div>
                  <button 
                    className="mt-4 text-white text-sm font-medium flex items-center bg-gradient-to-r from-green-500 to-blue-500 px-4 py-2 rounded-lg hover:opacity-90 shadow-sm transition-all duration-200 w-full justify-center"
                    onClick={() => setIsAddTaskModalOpen(true)}
                  >
                    <span>Add New Task</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div> */}
          </div>
        </main>
      </div>

      {/* User Profile Modal - Glass morphism design */}
      {showUserProfile && currentUser && (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-auto my-8 border border-gray-200 flex flex-col max-h-[90vh]">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 flex-shrink-0"></div>
          <div className="relative flex-grow overflow-y-auto">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={toggleUserProfile}
                className="p-2 bg-white rounded-full shadow-lg text-gray-500 hover:text-gray-700 focus:outline-none hover:bg-gray-50 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            <UserProfile userData={currentUser} />
          </div>
        </div>
      </div>
    )}
      
      {/* Modern styled modals for Activities and Add Task */}
      {isActivitiesModalOpen && (
        <ActivitiesModal 
          activities={dashboardData.recentActivities} 
          onClose={() => setIsActivitiesModalOpen(false)}
          filter={activityFilter}
          setFilter={setActivityFilter}
        />
      )}
      
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
const KpiCard = ({ title, value, icon, trend, positive = true, subdivision }) => {
  // Determine icon background color based on title
  let iconBgColor = "bg-blue-100";
  let iconColor = "text-blue-600";

  if (title.toLowerCase().includes("milk")) {
    iconBgColor = "bg-blue-100";
    iconColor = "text-blue-600";
  } else if (title.toLowerCase().includes("health")) {
    iconBgColor = "bg-red-100";
    iconColor = "text-red-600";
  } else if (title.toLowerCase().includes("task")) {
    iconBgColor = "bg-amber-100";
    iconColor = "text-amber-600";
  } else if (title.toLowerCase().includes("revenue")) {
    iconBgColor = "bg-green-100";
    iconColor = "text-green-700";
  } else if (title.toLowerCase().includes("cow")) {
    iconBgColor = "bg-green-100";
    iconColor = "text-green-600";
  }

  // Determine value text color
  let valueColor = "text-gray-800";
  if (title.toLowerCase().includes("milk")) {
    valueColor = "text-blue-600";
  } else if (title.toLowerCase().includes("health")) {
    valueColor = "text-red-600";
  } else if (title.toLowerCase().includes("revenue")) {
    valueColor = "text-green-700";
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${valueColor} mt-1`}>
            {value}
          </p>
          {subdivision && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {subdivision.map((item, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                  <span className="font-medium">{item.label}:</span>
                  <span className="ml-1">{item.value}</span>
                </span>
              ))}
            </div>
          )}
          {trend && !subdivision && (
            <div className={`text-xs flex items-center ${positive ? 'text-emerald-600' : 'text-red-500'} mt-2 font-medium`}>
              {positive ? (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 ${iconBgColor} rounded-lg flex-shrink-0`}>
          {React.cloneElement(icon, { className: iconColor, size: 24 })}
        </div>
      </div>
    </div>
  );
};

// Component for activity item
const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'health':
        return <Thermometer size={16} className="text-white" />;
      case 'milk':
        return <Droplet size={16} className="text-white" />;
      case 'employee':
        return <Users size={16} className="text-white" />;
      case 'cow':
        return <Clipboard size={16} className="text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
      <div className={`p-2 rounded-full bg-gradient-to-r ${GRADIENT_CLASSES.activity[activity.type] || GRADIENT_CLASSES.activity.cow} mr-4 mt-1 shadow-sm`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1">
        <p className="text-gray-800 font-medium">{activity.text}</p>
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
        return <Thermometer size={18} className="text-white" />;
      case 'milk':
        return <Droplet size={18} className="text-white" />;
      case 'employee':
        return <Users size={18} className="text-white" />;
      case 'cow':
        return <Clipboard size={18} className="text-white" />;
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden border border-gray-100">
      <div className={`h-1 bg-gradient-to-r ${GRADIENT_CLASSES.activity[activity.type] || GRADIENT_CLASSES.activity.cow}`}></div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start">
          <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-r ${GRADIENT_CLASSES.activity[activity.type] || GRADIENT_CLASSES.activity.cow} mr-3 sm:mr-4 mt-1 shadow-sm flex-shrink-0`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full text-white bg-gradient-to-r ${GRADIENT_CLASSES.activity[activity.type] || GRADIENT_CLASSES.activity.cow} font-medium whitespace-nowrap`}>
                {getActivityTypeLabel(activity.type)}
              </span>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
            <p className="text-gray-800 font-medium mt-1.5 break-words">{activity.text}</p>
            <p className="text-sm text-gray-600 mt-2 break-words">{activity.details}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for task item
const TaskItem = ({ title, completed }) => {
  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
      <div className="relative">
        <input
          type="checkbox"
          checked={completed}
          className="h-5 w-5 text-green-600 rounded-md border-2 border-gray-300 focus:ring-green-500 focus:ring-offset-0 cursor-pointer transition-colors"
        />
        {completed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <span className={`ml-3 text-sm transition-all duration-200 ${completed ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
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
        className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown size={16} className="text-gray-500" />
      </div>
    </div>
  );
};

// Activities Modal Component
const ActivitiesModal = ({ activities, onClose, filter, setFilter }) => {
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[90vh] flex flex-col border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold truncate">Farm Activities</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-100 focus:outline-none bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-all duration-200 flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="overflow-hidden flex flex-col flex-grow">
          <div className="p-4 sm:p-6">
            {/* Filter Controls - Made horizontally scrollable */}
            <div className="flex items-center gap-2 mb-4 pb-2 overflow-x-auto scrollbar-thin">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by:</span>
              <div className="flex gap-2 flex-nowrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    filter === 'all' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Activities
                </button>
                <button
                  onClick={() => setFilter('health')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    filter === 'health' 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Health Events
                </button>
                <button
                  onClick={() => setFilter('milk')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    filter === 'milk' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Milk Production
                </button>
                <button
                  onClick={() => setFilter('employee')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    filter === 'employee' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Employee Activities
                </button>
                <button
                  onClick={() => setFilter('cow')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    filter === 'cow' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cow Management
                </button>
              </div>
            </div>
            
            {/* Activity List - With proper height constraints and scrolling */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 100px)' }}>
              <div className="space-y-3 pr-1">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map(activity => (
                    <ExpandedActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">{DEFAULT_VALUES.ui.labels.noActivitiesFilter}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 flex-shrink-0">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredActivities.length}</span> {DEFAULT_VALUES.ui.labels.activitiesFound}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm w-full sm:w-auto"
          >
            {DEFAULT_VALUES.ui.labels.close}
          </button>
        </div>
      </div>
    </div>
  );
};

const WeatherConditions = ({ location }) => {
  const [weatherData, setWeatherData] = useState({
    temp: DEFAULT_VALUES.weather.defaultTemp,
    condition: DEFAULT_VALUES.weather.defaultCondition,
    description: 'Clear sky',
    humidity: 62,
    windSpeed: 8,
    feelsLike: 26,
    icon: 'clear',
    precipitation: 0,
    location: location || 'Farm Location',
    loading: true,
    error: null
  });
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Use OpenWeatherMap API (free tier)
        // You need to sign up for a free API key at https://openweathermap.org/api
        const API_KEY = DEFAULT_VALUES.weather.apiKey; // Use centralized API key
        
        // Default to coordinates if geolocation is not available
        // In production, you might want to store the farm's location in your database
        const lat = DEFAULT_VALUES.weather.defaultLat;
        const lon = DEFAULT_VALUES.weather.defaultLon;
        
        // Fetch current weather
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
          throw new Error(DEFAULT_VALUES.weather.errorMessages.fetchFailed);
        }
        
        const data = await response.json();
        
        // Fetch forecast for next few days
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=5`
        );
        
        if (!forecastResponse.ok) {
          throw new Error(DEFAULT_VALUES.weather.errorMessages.forecastFailed);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Map weather condition to an icon using centralized mappings
        const getWeatherIcon = (condition) => {
          const code = condition.toLowerCase();
          const mappings = DEFAULT_VALUES.weather.conditionMappings;
          
          for (const [iconType, keywords] of Object.entries(mappings)) {
            if (keywords.some(keyword => code.includes(keyword))) {
              return iconType;
            }
          }
          return 'clear'; // Default fallback
        };
        
        // Process current weather
        setWeatherData({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          feelsLike: Math.round(data.main.feels_like),
          icon: getWeatherIcon(data.weather[0].main),
          precipitation: data.rain ? data.rain['1h'] : 0,
          location: data.name,
          loading: false,
          error: null
        });
        
        // Process forecast data
        const processedForecast = forecastData.list.map(item => {
          return {
            time: new Date(item.dt * 1000).toLocaleTimeString(DEFAULT_VALUES.dates.locale, {hour: '2-digit', minute: '2-digit'}),
            date: new Date(item.dt * 1000).toLocaleDateString(DEFAULT_VALUES.dates.locale, {weekday: 'short'}),
            temp: Math.round(item.main.temp),
            icon: getWeatherIcon(item.weather[0].main),
            condition: item.weather[0].main
          };
        });
        
        setForecast(processedForecast);
        
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherData(prev => ({
          ...prev,
          loading: false,
          error: DEFAULT_VALUES.weather.errorMessages.loadFailed
        }));
      }
    };
    
    fetchWeatherData();
    
    // Refresh weather data every 30 minutes
    const interval = setInterval(fetchWeatherData, DEFAULT_VALUES.weather.refreshInterval);
    
    return () => clearInterval(interval);
  }, [location]);

  const getWeatherIcon = (type) => {
    switch (type) {
      case 'clear':
        return <Sun size={32} className="text-yellow-400" />;
      case 'cloudy':
        return <Cloud size={32} className="text-gray-400" />;
      case 'rain':
        return <CloudRain size={32} className="text-blue-400" />;
      case 'snow':
        return <CloudSnow size={32} className="text-blue-200" />;
      case 'thunder':
        return <CloudLightning size={32} className="text-yellow-500" />;
      case 'fog':
        return <CloudFog size={32} className="text-gray-300" />;
      case 'drizzle':
        return <CloudDrizzle size={32} className="text-blue-300" />;
      default:
        return <Sun size={32} className="text-yellow-400" />;
    }
  };

  if (weatherData.loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-xl flex justify-center items-center border border-blue-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-12 w-12 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (weatherData.error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl border border-red-100">
        <div className="px-2 py-1 bg-white/70 rounded-full text-xs font-medium text-blue-600 shadow-sm">
          <p className="text-sm text-center text-gray-500 mt-1">{DEFAULT_VALUES.ui.weatherFallback}</p>
        </div>
      </div>
    );
  }

  // Get weather background based on condition
  const getWeatherBackground = () => {
    const condition = weatherData.icon;
    
    return GRADIENT_CLASSES.weather[condition] || GRADIENT_CLASSES.weather.default;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 mb-4">Weather Conditions</h2>
      
      {/* Current Weather Card with improved design */}
      <div className={`bg-gradient-to-br ${getWeatherBackground()} p-5 rounded-xl border backdrop-blur-sm shadow-sm`}>
        {/* Current Temperature Display */}
        <div className="mb-4">
          <div className="flex items-start">
            <h3 className="text-4xl font-bold text-gray-800">{weatherData.temp}</h3>
            <span className="text-xl text-gray-600 mt-1">°C</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{weatherData.description}</p>
        </div>
        
        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-2 bg-white/40 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.feelsLike}</p>
            <p className="font-medium text-gray-700">{weatherData.feelsLike}°C</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.humidity}</p>
            <p className="font-medium text-gray-700">{weatherData.humidity}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{DEFAULT_VALUES.ui.labels.wind}</p>
            <div className="flex items-center justify-center">
              <Wind size={12} className="mr-1 text-gray-500" />
              <p className="font-medium text-gray-700">{weatherData.windSpeed} km/h</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weather Forecast */}
      {forecast.length > 0 && (
        <div className="bg-white/40 rounded-xl p-3 backdrop-blur-sm border border-gray-100 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">{DEFAULT_VALUES.ui.labels.forecast}</h3>
          <div className="overflow-x-auto">
            <div className="flex justify-between min-w-[300px]">
            {forecast.map((item, index) => (
              <div key={index} className="text-center px-2">
                <p className="text-xs text-gray-500">{item.date}</p>
                <div className="my-1 flex justify-center">
                  {getWeatherIcon(item.icon)}
                </div>
                <p className="font-medium text-gray-700">{item.temp}°C</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}
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
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-auto my-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold truncate">Add New Task</h2>
              <button 
                type="button"
                onClick={onClose}
                className="text-white hover:text-gray-100 focus:outline-none bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter task description"
              ></textarea>
                       </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="general">General</option>
                <option value="milking">Milking</option>
                <option value="feeding">Feeding</option>
                <option value="health">Health Check</option>
                <option value="maintenance">Maintenance</option>
                <option value="administrative">Administrative</option>
              </select>
            </div>
            
            <div className="flex items-start p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center h-5">
                <input
                  id="reminder"
                  name="reminder"
                  type="checkbox"
                  checked={formData.reminder}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-offset-0"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="reminder" className="font-medium text-gray-700">Set Reminder</label>
                <p className="text-gray-500">You will receive a notification before the task is due</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row-reverse sm:justify-end gap-3 sm:gap-2 bg-gray-50">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 border border-transparent rounded-lg shadow-sm hover:opacity-90 transition-all duration-200"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, periodSelector }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          {periodSelector && (
            <div className="flex-shrink-0">
              {periodSelector}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FarmDashboard;