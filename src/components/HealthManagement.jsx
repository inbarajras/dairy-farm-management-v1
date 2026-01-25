import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Calendar, Clipboard, AlertTriangle, ChevronLeft, ChevronRight, Thermometer, Heart, AlertCircle, MoreHorizontal, Download, RefreshCw,X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  fetchHealthEvents,
  fetchVaccinationSchedule,
  fetchMedications,
  generateHealthStats,
  addHealthEvent,
  updateHealthEvent,
  deleteHealthEvent,
  fetchCowsForSelection,
  addMedication
} from './services/healthService';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import {toast} from './utils/ToastContainer';
import WeeklyInspection from './WeeklyInspection';

// Status badge colors - no change
const statusColors = {
  'Completed': 'bg-green-100 text-green-800',
  'In progress': 'bg-blue-100 text-blue-800',
  'Scheduled': 'bg-amber-100 text-amber-800',
  'Monitoring': 'bg-purple-100 text-purple-800',
  'Overdue': 'bg-red-100 text-red-800'
};

// Utility functions - no change
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const getStatusWithDate = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (due < today) {
    return 'Overdue';
  }
  return 'Scheduled';
};

// Main health management component
const HealthManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [healthData, setHealthData] = useState({
    healthEvents: [],
    vaccinationSchedule: [],
    healthStats: {
      activeCases: 0,
      scheduledCheckups: 0,
      treatedLastMonth: 0,
      totalVaccinations: 0,
      commonIssues: [],
      monthlyData: []
    },
    medications: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    upcomingTasks: [],
    recentEvents: [],
    healthTrend: { percentage: 0, direction: 'stable' }
  });
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  
  // Load health data
  useEffect(() => {
    const loadHealthData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch health events
        const events = await fetchHealthEvents();
        
        // Fetch vaccination schedule
        const vaccinations = await fetchVaccinationSchedule();
        
        // Generate health stats
        const stats = await generateHealthStats();
        
        // Fetch medications
        const medications = await fetchMedications();
        
        // Update state with all data
        setHealthData({
          healthEvents: events,
          vaccinationSchedule: vaccinations,
          healthStats: stats,
          medications: medications
        });
        
        // Load dashboard data with real-time data
        await loadDashboardData(events, vaccinations);
      } catch (err) {
        console.error('Error loading health data:', err);
        setError('Failed to load health data. Please refresh the page to try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHealthData();
  }, []);
  

  const loadDashboardData = async (events = [], vaccinations = []) => {
    try {
      // Get today's date for filtering
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate upcoming tasks (events with follow-up)
      const upcomingTasks = events
        .filter(event => event.followUp && new Date(event.followUp) >= today)
        .sort((a, b) => new Date(a.followUp) - new Date(b.followUp))
        .slice(0, 5)
        .map(task => ({
          id: task.id,
          type: task.eventType,
          date: new Date(task.followUp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          description: task.description || '',
          cowName: task.cowName || 'Unknown',
          cowTag: task.cowTag || 'N/A'
        }));
      
      // Get recent events (most recent first)
      const recentEvents = [...events]
        .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
        .slice(0, 5);
      
      // Calculate health trend
      // Compare current month with previous month
      const currentMonthEvents = events.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate.getMonth() === today.getMonth() && 
               eventDate.getFullYear() === today.getFullYear();
      });
      
      const lastMonthDate = new Date(today);
      lastMonthDate.setMonth(today.getMonth() - 1);
      
      const lastMonthEvents = events.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate.getMonth() === lastMonthDate.getMonth() && 
               eventDate.getFullYear() === lastMonthDate.getFullYear();
      });
      
      let healthTrend = { percentage: 0, direction: 'stable' };
      if (lastMonthEvents.length > 0) {
        const change = ((currentMonthEvents.length - lastMonthEvents.length) / lastMonthEvents.length) * 100;
        healthTrend = {
          percentage: Math.abs(Math.round(change)),
          direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable'
        };
      }
      
      // Set dashboard data state
      setDashboardStats({
        upcomingTasks,
        recentEvents,
        healthTrend
      });
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Filter health events based on search and filters
  const filteredEvents = healthData.healthEvents.filter(event => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      event.cowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.cowTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filterStatus === 'All' || 
      event.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort by date (most recent first)
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.eventDate) - new Date(a.eventDate)
  );
  
  // Pagination
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  
  // Toggle add event modal
  const toggleAddEvent = () => {
    setIsAddEventOpen(!isAddEventOpen);
  };
  
  // Handle adding a new health event
  const handleAddHealthEvent = async (eventData) => {
    try {
      await addHealthEvent(eventData);
      
      // Refresh health events list and vaccination schedule
      const events = await fetchHealthEvents();
      const vaccinations = await fetchVaccinationSchedule();
      
      setHealthData(prev => ({
        ...prev,
        healthEvents: events,
        vaccinationSchedule: vaccinations
      }));
      
      // Update dashboard with fresh data
      await loadDashboardData(events, vaccinations);
      
      // Close modal
      setIsAddEventOpen(false);
      toast.success('Health Event Added Successfully!');
    } catch (err) {
      console.error('Error adding health event:', err);
      toast.error('Failed to add health event. Please try again.');
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setIsViewEventModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditEventOpen(true);
  };

  const handleUpdateEvent = async (eventId, updatedData) => {
    try {
      await updateHealthEvent(eventId, updatedData);
      
      // Refresh health events list and vaccination schedule
      const events = await fetchHealthEvents();
      const vaccinations = await fetchVaccinationSchedule();
      
      // Update state
      setHealthData(prev => ({
        ...prev,
        healthEvents: events,
        vaccinationSchedule: vaccinations
      }));
      
      // Update dashboard with fresh data
      await loadDashboardData(events, vaccinations);
      
      // Close modal
      setIsEditEventOpen(false);
      toast.success('Health Event Updated..')
    } catch (err) {
      console.error('Error updating health event:', err);
      toast.error('Failed to update health event. Please try again.');
    }
  };

  // Show delete confirmation
const handleDeleteConfirmation = (event) => {
  setEventToDelete(event);
  setIsDeleteConfirmOpen(true);
};

// Handle actual deletion
const handleDeleteEvent = async () => {
  if (!eventToDelete) return;
  
  try {
    await deleteHealthEvent(eventToDelete.id);
    
    // Refresh health events list and vaccination schedule
    const events = await fetchHealthEvents();
    const vaccinations = await fetchVaccinationSchedule();
    
    // Update state
    setHealthData(prev => ({
      ...prev,
      healthEvents: events,
      vaccinationSchedule: vaccinations
    }));
    
    // Update dashboard with fresh data
    await loadDashboardData(events, vaccinations);
    
    // Close modal and reset
    setIsDeleteConfirmOpen(false);
    setEventToDelete(null);
    toast.success('Deleted Health Event..')
  } catch (err) {
    console.error('Error deleting health event:', err);
    toast.error('Failed to delete health event. Please try again.');
  }
};

  // Prepare chart data for health issues
  const healthIssuesData = healthData.healthStats.commonIssues;
  const COLORS = ['#2E7D32', '#1565C0', '#FFA000', '#6D4C41', '#9E9E9E'];
  
  // Show loading state
  if (isLoading) {
    return <LoadingSpinner message='Loading health data...'></LoadingSpinner>;
  }
  
  // Show error state
  if (error) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
            <h3 className="text-lg font-medium">Error Loading Health Data</h3>
            <p className="mt-2">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw size={16} className="inline-block mr-2" />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-gradient-to-br from-blue-50/50 via-white to-green-50/40 overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto">
        {/* Modern Header with Icon */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 rounded-2xl shadow-lg">
                <Heart size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-blue-600 to-purple-600">
                  Health Management
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Monitor and track animal health status</p>
              </div>
            </div>
            <button
              onClick={toggleAddEvent}
              className="group flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all duration-300">
              <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Record Health Event
            </button>
          </div>
        </div>
        
        {/* Updated tab navigation with consistent styling */}
        <div className="mb-6 overflow-x-auto">
          <nav className="flex space-x-4 border-b border-gray-200 min-w-[500px]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600 bg-gradient-to-b from-white to-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'events'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Health Events
            </button>
            <button
              onClick={() => setActiveTab('weekly-inspection')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'weekly-inspection'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Weekly Inspection
            </button>
            <button
              onClick={() => setActiveTab('vaccinations')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'vaccinations'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vaccinations
            </button>
            {/* <button
              onClick={() => setActiveTab('medications')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'medications'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medications
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button> */}
          </nav>
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Enhanced KPI cards with modern gradients and animations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Active Cases Card */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-red-200">
                <div className="h-1.5 bg-gradient-to-r from-red-400 via-pink-500 to-red-600"></div>
                <div className="p-6 bg-gradient-to-br from-red-50/30 to-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={16} className="text-red-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Cases</p>
                      </div>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        {healthData.healthStats.activeCases}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 via-pink-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <AlertCircle size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-red-100">
                    <div className={`w-2 h-2 rounded-full ${healthData.healthStats.activeCases > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className={`text-xs font-medium ${healthData.healthStats.activeCases > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {healthData.healthStats.activeCases > 0 ? '⚠️ Requires attention' : '✓ All clear'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scheduled Checkups Card */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-green-200">
                <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"></div>
                <div className="p-6 bg-gradient-to-br from-green-50/30 to-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={16} className="text-green-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled Checkups</p>
                      </div>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {healthData.healthStats.scheduledCheckups}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Calendar size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-green-100">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-green-600 truncate">
                      {dashboardStats.upcomingTasks && dashboardStats.upcomingTasks.length > 0
                        ? `📅 Next: ${dashboardStats.upcomingTasks[0]?.date || 'Coming soon'}`
                        : 'No upcoming checkups'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Treated This Month Card */}
              <div className="group bg-yellow-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-yellow-200">
                <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer size={16} className="text-yellow-600" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Treated This Month</p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-700 mt-2">
                        {healthData.healthStats.treatedLastMonth}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Thermometer size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-yellow-100">
                    <svg className="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={dashboardStats.healthTrend.direction === 'decrease'
                            ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                      />
                    </svg>
                    <span className="text-xs font-medium text-yellow-700">
                      {dashboardStats.healthTrend.percentage > 0
                        ? `${dashboardStats.healthTrend.direction === 'decrease' ? '↓' : '↑'} ${dashboardStats.healthTrend.percentage}% vs last month`
                        : '→ No change'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vaccinations YTD Card */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-blue-200">
                <div className="h-1.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600"></div>
                <div className="p-6 bg-gradient-to-br from-blue-50/30 to-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart size={16} className="text-blue-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vaccinations YTD</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {healthData.healthStats.totalVaccinations}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Heart size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-blue-100">
                    <div className={`w-2 h-2 rounded-full ${healthData.healthStats.totalVaccinations > 50 ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className={`text-xs font-medium ${healthData.healthStats.totalVaccinations > 50 ? 'text-green-600' : 'text-amber-600'}`}>
                      {healthData.healthStats.totalVaccinations > 50 ? '✓ Good coverage' : '⚠️ Needs attention'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Charts section with modern styling */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Treatment History Chart */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-orange-100">
                <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-green-500"></div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                      <Clipboard size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-orange-700">
                        Treatment History
                      </h2>
                      <p className="text-xs text-gray-500">Monthly treatments and checkups overview</p>
                    </div>
                  </div>
                    <div className="h-64 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={healthData.healthStats.monthlyData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          barSize={28}
                        >
                          <defs>
                            <linearGradient id="colorTreatments" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FB8C00" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#FFA726" stopOpacity={0.7}/>
                            </linearGradient>
                            <linearGradient id="colorCheckups" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#388E3C" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#66BB6A" stopOpacity={0.7}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <YAxis
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(251, 140, 0, 0.1)' }}
                            contentStyle={{
                              border: 'none',
                              borderRadius: '0.75rem',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              background: 'white'
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="circle"
                          />
                          <Bar dataKey="treatments" name="Treatments" fill="url(#colorTreatments)" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="checkups" name="Checkups" fill="url(#colorCheckups)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                </div>
              </div>

              {/* Common Health Issues Chart */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-purple-100">
                <div className="h-1.5 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"></div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                      <AlertTriangle size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-purple-700">
                        Common Health Issues
                      </h2>
                      <p className="text-xs text-gray-500">Distribution of health concerns</p>
                    </div>
                  </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {COLORS.map((color, index) => (
                              <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                                <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={healthIssuesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="count"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {healthIssuesData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`url(#pieGradient${index % COLORS.length})`}
                                stroke="white"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [`${value} cases`, name]}
                            contentStyle={{
                              background: 'white',
                              border: 'none',
                              borderRadius: '0.75rem',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Recent Activities Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Health Events Card */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-blue-100">
                <div className="h-1.5 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-600"></div>
                <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                        <Clipboard size={18} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-blue-700">
                          Recent Health Events
                        </h2>
                        <p className="text-xs text-gray-500">Latest health records</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="group/btn flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200"
                    >
                      View All
                      <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                  <div className="divide-y divide-blue-50">
                    {healthData.healthEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 group/item">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-semibold text-gray-800 truncate">{event.cowName}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">({event.cowTag})</span>
                              </div>
                              <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full flex-shrink-0 ${statusColors[event.status]}`}>
                                {event.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              <span className="font-medium text-blue-600">{event.eventType}</span> - {event.description}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-gray-700">{formatDate(event.eventDate)}</p>
                            <p className="text-xs text-gray-500 mt-1">By: {event.performedBy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

              {/* Upcoming Vaccinations Card */}
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-green-100">
                <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"></div>
                <div className="px-6 py-4 border-b border-green-100 bg-green-50/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                        <Calendar size={18} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-green-700">
                          Upcoming Vaccinations
                        </h2>
                        <p className="text-xs text-gray-500">Scheduled immunizations</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('vaccinations')}
                      className="group/btn flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-green-600 hover:text-green-700 bg-white hover:bg-green-50 rounded-lg transition-all duration-200 border border-green-200"
                    >
                      View All
                      <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                  <div className="divide-y divide-green-50">
                    {healthData.vaccinationSchedule.slice(0, 3).map(vac => (
                      <div key={vac.id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent transition-all duration-200 group/item">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-semibold text-gray-800 truncate">{vac.cowName}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">({vac.cowTag})</span>
                              </div>
                              <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full flex-shrink-0 ${statusColors[getStatusWithDate(vac.dueDate)]}`}>
                                {getStatusWithDate(vac.dueDate)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-green-600">{vac.vaccinationType}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-gray-700">{formatDate(vac.dueDate)}</p>
                            <p className="text-xs text-gray-500 mt-1">Assigned: {vac.assignedTo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-6 py-4">
                      <button
                        className="group/add w-full py-2.5 px-4 border-2 border-dashed border-green-200 hover:border-green-400 rounded-xl text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50/50 transition-all duration-200 flex items-center justify-center gap-2"
                        onClick={() => setActiveTab('vaccinations')}
                      >
                        <Plus size={18} className="group-hover/add:rotate-90 transition-transform duration-300" />
                        Schedule New Vaccination
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Events Tab */}
        {activeTab === 'events' && (
          <div>
            {/* Search and filter bar with updated styling */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  placeholder="Search by cow name, tag, or event type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="In progress">In Progress</option>
                    <option value="Monitoring">Monitoring</option>
                  </select>
                </div>
                
                {/* <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300">
                  <Download size={16} className="mr-2" />
                  Export
                </button> */}
              </div>
            </div>
            
            {/* Health events table with updated styling */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cow
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow Up
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEvents.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{event.cowName}</div>
                          <div className="text-sm text-gray-500 ml-2">({event.cowTag})</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.eventType}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.eventDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.performedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[event.status]}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.followUp ? formatDate(event.followUp) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleViewEvent(event)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleEditEvent(event)}
                            className="text-green-600 hover:text-green-900 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteConfirmation(event)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${
                        currentPage === page 
                          ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Vaccinations Tab */}
        {/* Weekly Inspection Tab */}
        {activeTab === 'weekly-inspection' && (
          <WeeklyInspection />
        )}

        {activeTab === 'vaccinations' && (
          <VaccinationsTab vaccinationSchedule={healthData.vaccinationSchedule} />
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <MedicationsTab medications={healthData.medications} />
        )}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsTab healthData={healthData} />
        )}
      </div>
      
      {/* Modals */}
      {isAddEventOpen && (
          <AddHealthEventModal 
            onClose={toggleAddEvent} 
            onSubmit={handleAddHealthEvent}
          />
        )}

      {isViewEventModalOpen && selectedEvent && (
        <ViewHealthEventModal
          event={selectedEvent}
          onClose={() => setIsViewEventModalOpen(false)}
        />
      )}
      
      {isEditEventOpen && selectedEvent && (
        <EditHealthEventModal
          event={selectedEvent}
          onClose={() => setIsEditEventOpen(false)}
          onUpdate={handleUpdateEvent}
        />
      )}
      
      {isDeleteConfirmOpen && eventToDelete && (
        <DeleteConfirmationModal
          event={eventToDelete}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setEventToDelete(null);
          }}
          onConfirm={handleDeleteEvent}
        />
      )}
    </div>
  );
};

// Vaccinations Tab Component
const VaccinationsTab = ({ vaccinationSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('calendar');
  const [filteredVaccinations, setFilteredVaccinations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddVaccineModalOpen, setIsAddVaccineModalOpen] = useState(false);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  
  // Update the complete vaccination function to maintain consistency
  const handleCompleteVaccination = async (vac) => {
    try {
      setIsLoading(true);
      
      // 1. Update the vaccination_schedule entry
      const { error: vacUpdateError } = await supabase
        .from('vaccination_schedule')
        .update({ 
          status: 'Completed'
          // Remove completed_date since it doesn't exist in your schema
        })
        .eq('id', vac.id);
      
      if (vacUpdateError) throw vacUpdateError;
      
      // 2. Create a completed health event for this vaccination
      const healthEventData = {
        cow_id: vac.cowId,
        event_type: 'Vaccination',
        event_date: new Date().toISOString().split('T')[0],
        description: `Completed ${vac.vaccinationType} vaccination`,
        performed_by: vac.assignedTo || 'Farm Staff',
        status: 'Completed'
        // Removed vaccination_id since it doesn't exist in your schema
      };
      
      const { error: healthEventError } = await supabase
        .from('health_events')
        .insert(healthEventData);
      
      if (healthEventError) throw healthEventError;
      
      // 3. Update any existing "Scheduled" health events for this vaccination
      // Use cow_id and description/vaccination_type instead of vaccination_id
      const { error: updateRelatedError } = await supabase
        .from('health_events')
        .update({ status: 'Completed' })
        .eq('cow_id', vac.cowId)
        .eq('description', vac.vaccinationType)
        .eq('status', 'Scheduled');
      
      if (updateRelatedError) throw updateRelatedError;
      
      // 4. Refresh data after successful operations
      const updatedSchedule = await fetchVaccinationSchedule();
      
      // 5. Update filtered list for UI
      setFilteredVaccinations(prevVacs => 
        prevVacs.filter(v => v.id !== vac.id)
      );
      
      toast.success('Vaccination marked as complete');
    } catch (error) {
      console.error('Error completing vaccination:', error);
      toast.error('Failed to complete vaccination. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRescheduleVaccination = async (vacId, newDate) => {
    try {
      setIsLoading(true);
      
      // Get the vaccination details first to use cow_id and type for related health events
      const { data: vacDetails, error: vacDetailsError } = await supabase
        .from('vaccination_schedule')
        .select('*')
        .eq('id', vacId)
        .single();
      
      if (vacDetailsError) throw vacDetailsError;
      
      // 1. Update the vaccination_schedule entry
      const { error: vacUpdateError } = await supabase
        .from('vaccination_schedule')
        .update({ 
          due_date: newDate,
          status: 'Rescheduled'
        })
        .eq('id', vacId);
      
      if (vacUpdateError) throw vacUpdateError;
      
      // 2. Update any related health events using cow_id and description/type
      const { error: healthEventError } = await supabase
        .from('health_events')
        .update({ 
          follow_up: newDate,
          status: 'Scheduled',
          notes: (prevNotes) => `${prevNotes || ''}${prevNotes ? '\n' : ''}Rescheduled from ${new Date().toISOString().split('T')[0]} to ${newDate}`
        })
        .eq('cow_id', vacDetails.cow_id)
        .eq('description', vacDetails.vaccination_type)
        .eq('status', 'Scheduled');
      
      if (healthEventError) throw healthEventError;
      
      // 3. Refresh data
      const updatedSchedule = await fetchVaccinationSchedule();
      
      // 4. Update filtered list for UI
      setFilteredVaccinations(prevVacs => 
        prevVacs.map(vac => vac.id === vacId ? {...vac, dueDate: newDate, status: 'Rescheduled'} : vac)
      );
      
      toast.success('Vaccination rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling vaccination:', error);
      toast.error('Failed to reschedule vaccination. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter vaccinations based on view
    if (view === 'calendar') {
      // For calendar view, show all vaccinations
      setFilteredVaccinations(vaccinationSchedule);
    } else if (view === 'upcoming') {
      // For upcoming view, show only upcoming vaccinations
      const today = new Date();
      setFilteredVaccinations(
        vaccinationSchedule.filter(vac => new Date(vac.dueDate) >= today)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      );
    } else if (view === 'overdue') {
      // For overdue view, show only overdue vaccinations
      const today = new Date();
      setFilteredVaccinations(
        vaccinationSchedule.filter(vac => new Date(vac.dueDate) < today)
      );
    }
  }, [view, vaccinationSchedule]);
  
  // Generate days for the month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  // Get vaccinations for a specific day
  const getVaccinationsForDay = (day) => {
    // Create date with local timezone, set to midnight
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Format date as YYYY-MM-DD using local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    return vaccinationSchedule.filter(vac => vac.dueDate === dateString);
  };
  
  // Get status class for day
  const getDayStatusClass = (day) => {
    const vaccinations = getVaccinationsForDay(day);
    
    if (vaccinations.length > 0) {
      return 'bg-green-100 text-green-800 font-semibold';
    }
    return '';
  };

  const toggleAddVaccineModal = () => {
    setIsAddVaccineModalOpen(!isAddVaccineModalOpen);
  };


  const handleAddVaccination = async (formData) => {
    try {
      setIsLoading(true);
      
      // This will now create entries in both tables with the corrected function
      const result = await addVaccination(formData);
      
      // Refresh vaccination schedule
      const updatedSchedule = await fetchVaccinationSchedule();
      
      // Refresh health events
      const events = await fetchHealthEvents();
      
      // Update parent component's data through props or context
      // For now just update filtered vaccinations
      if (view === 'upcoming') {
        const today = new Date();
        setFilteredVaccinations(
          updatedSchedule
            .filter(vac => new Date(vac.dueDate) >= today)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        );
      } else {
        setFilteredVaccinations(updatedSchedule);
      }
      
      // Close modal
      setIsAddVaccineModalOpen(false);
      
      // Show success message
      toast.success('Vaccination scheduled successfully');
    } catch (error) {
      console.error('Error scheduling vaccination:', error);
      // Explicitly show the error message
      toast.error(`Failed to schedule vaccination: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className='p-6'>
          <div className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center mb-4 sm:mb-0 overflow-x-auto pb-2">
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                  view === 'calendar' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } whitespace-nowrap`}
              >
                Calendar
              </button>
              <button
                onClick={() => setView('upcoming')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 transition-all duration-300 ${
                  view === 'upcoming' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } whitespace-nowrap`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setView('overdue')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 transition-all duration-300 ${
                  view === 'overdue' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } whitespace-nowrap`}
              >
                Overdue
              </button>
            </div>
            
            <div className="flex items-center sm:ml-auto">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
              <span className="mx-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronRight size={18} className="text-gray-500" />
              </button>
              <button 
                onClick={handleToday}
                className="ml-4 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 whitespace-nowrap"
              >
                Today
              </button>
            </div>
          </div>
          
          {view === 'calendar' && (
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden min-w-[700px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 py-2 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Blank days - empty cells to align with the first day of month */}
                {blankDays.map((_, index) => (
                  <div key={`blank-${index}`} className="bg-white p-2 min-h-[80px]"></div>
                ))}
                
                {/* Days of the month */}
                {days.map(day => {
                  // Create date object for this day (from local timezone)
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  
                  // Format date as YYYY-MM-DD using local timezone
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(day).padStart(2, '0');
                  const dateString = `${year}-${month}-${dayStr}`;
                  
                  const vaccinations = vaccinationSchedule.filter(vac => vac.dueDate === dateString);
                  
                  const isToday = new Date().getDate() === day && 
                                new Date().getMonth() === currentDate.getMonth() && 
                                new Date().getFullYear() === currentDate.getFullYear();
                                
                  return (
                    <div 
                      key={day} 
                      className={`bg-white p-2 min-h-[80px] border-t relative ${
                        isToday ? 'bg-blue-50 border-t-2 border-t-blue-500' : ''
                      } ${vaccinations.length > 0 ? 'bg-green-50' : ''}`}
                    >
                      <div className={`flex justify-between items-center mb-1 ${isToday ? 'font-semibold' : ''}`}>
                        <span className={`text-sm ${vaccinations.length > 0 ? 'font-semibold text-green-800' : ''}`}>
                          {day}
                        </span>
                        {vaccinations.length > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                            {vaccinations.length}
                          </span>
                        )}
                      </div>
                      
                      {vaccinations.length > 0 && (
                        <div className="space-y-1">
                          {vaccinations.slice(0, 2).map(vac => (
                            <div 
                              key={vac.id} 
                              className="text-xs p-1 rounded bg-green-50 border-l-2 border-green-400 cursor-pointer hover:bg-green-100 transition-colors duration-200 truncate"
                              title={`${vac.cowName || 'Unknown'} - ${vac.vaccinationType}`}
                            >
                              {vac.cowName || 'Unknown'} - {vac.vaccinationType}
                            </div>
                          ))}
                          {vaccinations.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{vaccinations.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Full Vaccination List */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mt-6 mb-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">All Vaccinations</h2>
                  <div className="flex items-center">
                    {/* <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                        placeholder="Search vaccinations..."
                        onChange={(e) => {
                          // Add search functionality if needed
                        }}
                      />
                    </div> */}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cow</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vaccinationSchedule.length > 0 ? (
                        vaccinationSchedule.map(vac => (
                          <tr key={vac.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">{vac.cowName || 'Unknown'}</div>
                                <div className="text-sm text-gray-500 ml-2">({vac.cowTag || 'N/A'})</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vac.vaccinationType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(vac.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[getStatusWithDate(vac.dueDate)]}`}>
                                {getStatusWithDate(vac.dueDate)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vac.assignedTo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => handleCompleteVaccination(vac)}
                                  disabled={isLoading}
                                  className="text-green-600 hover:text-green-900 transition-colors duration-200"
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => {
                                    const newDate = prompt('Enter new date (YYYY-MM-DD):', vac.dueDate);
                                    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
                                      handleRescheduleVaccination(vac.id, newDate);
                                    } else if (newDate) {
                                      toast.warning('Please use format YYYY-MM-DD');
                                    }
                                  }}
                                  disabled={isLoading}
                                  className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                >
                                  Reschedule
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-gray-500">No vaccinations scheduled</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {(view === 'upcoming' || view === 'overdue') && (
            <div>
              <div className="space-y-4">
                {filteredVaccinations.length > 0 ? (
                  filteredVaccinations.map(vac => (
                    <div key={vac.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors duration-200 border-gray-200 shadow-sm hover:shadow-md">
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{vac.cowName} ({vac.cowTag})</span>
                          <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[getStatusWithDate(vac.dueDate)]}`}>
                            {getStatusWithDate(vac.dueDate)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{vac.vaccinationType}</p>
                        <p className="text-xs text-gray-500 mt-1">Assigned to: {vac.assignedTo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(vac.dueDate)}</p>
                        <div className="mt-2 space-x-2">
                          <button 
                            onClick={() => handleCompleteVaccination(vac)}
                            disabled={isLoading}
                            className={`px-3 py-1 text-xs text-white bg-gradient-to-r from-green-600 to-green-700 rounded-md hover:opacity-90 shadow-sm transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isLoading ? 'Processing...' : 'Complete'}
                          </button>
                          <button 
                            onClick={() => {
                              const newDate = prompt('Enter new date (YYYY-MM-DD):', vac.dueDate);
                              if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
                                handleRescheduleVaccination(vac.id, newDate);
                              } else if (newDate) {
                                toast.warning('Please use format YYYY-MM-DD');
                              }
                            }}
                            disabled={isLoading}
                            className={`px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Reschedule
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-gradient-to-r from-blue-50/20 via-gray-50/20 to-green-50/30 rounded-lg border border-gray-200">
                    <div className="p-4 rounded-full bg-gray-50 inline-flex mb-4 border border-gray-100 shadow-sm">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">No {view} vaccinations found</p>
                    <p className="text-sm text-gray-500">All vaccinations are on schedule.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Schedule Vaccination</h3>
        </div>
        <div className="p-6">
          <button 
            onClick={toggleAddVaccineModal}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" />
            Schedule New Vaccination
          </button>
        </div>
      </div>
      {/* Add Vaccination Modal */}
      {isAddVaccineModalOpen && (
        <AddVaccinationModal 
          onClose={toggleAddVaccineModal} 
          onSubmit={handleAddVaccination} 
          isLoading={isLoading} 
        />
      )}
    </div>
  );
};

const AddVaccinationModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    cowId: '',
    vaccinationType: '',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
    notes: ''
  });
  const [cows, setCows] = useState([]);
  const [isLoadingCows, setIsLoadingCows] = useState(true);
  const [error, setError] = useState(null);
  
  // Load cows for selection
  useEffect(() => {
    const loadCows = async () => {
      try {
        const cowsList = await fetchCowsForSelection();
        setCows(cowsList);
      } catch (err) {
        console.error('Error loading cows:', err);
        setError('Failed to load cow list');
      } finally {
        setIsLoadingCows(false);
      }
    };
    
    loadCows();
  }, []);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await onSubmit(formData);
    } catch (err) {
      setError('Failed to schedule vaccination');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 my-4 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 sticky top-0 z-10"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-1 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 break-words pr-8">Schedule New Vaccination</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6">
            <div>
              <label htmlFor="cowId" className="block text-sm font-medium text-gray-700 mb-1">
                Cow *
              </label>
              {isLoadingCows ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded-lg"></div>
              ) : (
                <select
                  id="cowId"
                  name="cowId"
                  value={formData.cowId}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a cow</option>
                  {cows.map(cow => (
                    <option key={cow.id} value={cow.id}>
                      {cow.name} ({cow.tag_number})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div>
              <label htmlFor="vaccinationType" className="block text-sm font-medium text-gray-700 mb-1">
                Vaccination Type *
              </label>
              <select
                id="vaccinationType"
                name="vaccinationType"
                value={formData.vaccinationType}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Select a vaccination type</option>
                <option value="Annual Booster">Annual Booster</option>
                <option value="BVD Vaccine">BVD Vaccine</option>
                <option value="Respiratory Vaccine">Respiratory Vaccine</option>
                <option value="Brucellosis Vaccine">Brucellosis Vaccine</option>
                <option value="Blackleg Vaccine">Blackleg Vaccine</option>
                <option value="Anthrax Vaccine">Anthrax Vaccine</option>
                <option value="Leptospirosis Vaccine">Leptospirosis Vaccine</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To *
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Select a person</option>
                <option value="Dr. Smith">Dr. Smith</option>
                <option value="Dr. Johnson">Dr. Johnson</option>
                <option value="Farm Staff">Farm Staff</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional information..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-gray-50 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : 'Schedule Vaccination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const addVaccination = async (vaccinationData) => {
  try {
    // Begin by creating an entry in the vaccination_schedule table
    const { data: vacScheduleData, error: vacScheduleError } = await supabase
      .from('vaccination_schedule')
      .insert({
        cow_id: vaccinationData.cowId,
        vaccination_type: vaccinationData.vaccinationType,
        due_date: vaccinationData.dueDate,
        assigned_to: vaccinationData.assignedTo,
        notes: vaccinationData.notes,
        status: 'Scheduled'
      })
      .select()
      .single();
    
    if (vacScheduleError) throw vacScheduleError;
    
    // Also create an entry in health_events for future reference and follow-up
    const healthEventData = {
      cow_id: vaccinationData.cowId,
      event_type: 'Vaccination',
      event_date: new Date().toISOString().split('T')[0], // Today as creation date
      description: vaccinationData.vaccinationType,
      performed_by: vaccinationData.assignedTo,
      notes: vaccinationData.notes,
      follow_up: vaccinationData.dueDate, // Due date becomes follow-up date
      status: 'Scheduled'
      // Removed vaccination_id since it doesn't exist in your schema
    };
    
    const { data: healthEventDatas, error: healthEventError } = await supabase
      .from('health_events')
      .insert(healthEventData)
      .select()
      .single();
    
    if (healthEventError) throw healthEventError;
    
    return { vacScheduleData, healthEventData };
  } catch (error) {
    console.error('Error adding vaccination:', error);
    throw error;
  }
};

// Update vaccination status
export const updateVaccination = async (vaccinationId, updateData) => {
  try {
    // Convert data to the database schema
    const dbRecord = {
      due_date: updateData.dueDate,
      status: updateData.status,
      completed_date: updateData.completedDate || null
    };
    
    const { data, error } = await supabase
      .from('vaccination_schedule')
      .update(dbRecord)
      .eq('id', vaccinationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating vaccination:', error);
    throw error;
  }
};

// Medications Tab Component
const MedicationsTab = ({ medications }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [stockAlert, setStockAlert] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter medications based on search and filters
  const filteredMedications = medications.filter(med => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const matchesType = 
      filterType === 'All' || 
      med.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get unique medication types for filter
  const uniqueTypes = Array.from(new Set(medications.map(med => med.type)));

  // Check if a medication is low in stock
  const isLowStock = (stock) => stock < 10;

  // Check if a medication is about to expire
  const isNearExpiry = (expirationDate) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = Math.abs(expiry - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30; // Within 30 days of expiry
  };

  // Toggle add medication modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  return (
    <div>
      {/* Stock Alerts */}
      {stockAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-4 mb-6 hover:shadow-md transition-all duration-300">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Inventory Alerts</h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mastitis Treatment is running low (12 tubes left)</li>
                  <li>Broad Spectrum Antibiotic will expire soon (Aug 10, 2023)</li>
                </ul>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button 
                    type="button" 
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600 transition-all duration-300"
                  >
                    Order Supplies
                  </button>
                  <button
                    type="button"
                    className="ml-3 px-3 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600 transition-all duration-300"
                    onClick={() => setStockAlert(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <option value="All">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={toggleAddModal}
            data-action="add-health-event"
            className="flex items-center px-4 py-2 text-white rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm whitespace-nowrap"
          >
            <Plus size={16} className="mr-2 flex-shrink-0" />
            Add Medication
          </button>
        </div>
      </div>
      
      {/* Medications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredMedications.map(med => (
          <div 
            key={med.id} 
            className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 border-l-4 ${
              isLowStock(med.stock) ? 'border-l-red-500' : 
              isNearExpiry(med.expirationDate) ? 'border-l-amber-500' : 
              'border-l-green-500'
            }`}
          >
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">{med.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{med.type}</p>
                </div>
                <div className="relative">
                  <button className="p-1 rounded-full hover:bg-gray-100 focus:outline-none transition-colors duration-200">
                    <MoreHorizontal size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                  <p className="text-xs text-gray-500">Current Stock</p>
                  <p className={`text-lg font-medium ${isLowStock(med.stock) ? 'text-red-600' : 'text-gray-900'}`}>
                    {med.stock} {med.unit}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                  <p className="text-xs text-gray-500">Expiration Date</p>
                  <p className={`text-lg font-medium ${isNearExpiry(med.expirationDate) ? 'text-amber-600' : 'text-gray-900'}`}>
                    {new Date(med.expirationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-gray-600">
                Supplier: {med.supplier}
              </p>
              
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 rounded-md shadow-sm transition-all duration-300">
                  Update Stock
                </button>
                <button className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200">
                  Usage History
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Order History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Order History</h2>
          <button className="text-sm text-green-600 hover:text-green-500 font-medium transition-colors duration-200">
            View All Orders
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order No.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ORD-2023-042
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Apr 15, 2023
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                VetSupply Inc.
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                5 items
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $1,245.00
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ORD-2023-038
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Mar 28, 2023
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                AnimalHealth Co.
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                3 items
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $720.50
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ORD-2023-031
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Mar 10, 2023
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                FarmMed Ltd.
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                2 items
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $350.25
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
      
      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <AddMedicationModal onClose={toggleAddModal} />
      )}
    </div>
  );
};

// Reports Tab Component
const ReportsTab = ({ healthData }) => {
  const [reportType, setReportType] = useState('healthSummary');
  const [dateRange, setDateRange] = useState('lastMonth');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Handle report generation
  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Report generated successfully!');
    }, 1500);
  };
  
  return (
    <div>
      {/* Report Generator Form */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Generate Reports</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="healthSummary">Health Summary Report</option>
                <option value="vaccinationStatus">Vaccination Status Report</option>
                <option value="treatmentHistory">Treatment History Report</option>
                <option value="medicationUsage">Medication Usage Report</option>
                <option value="diseaseIncidence">Disease Incidence Report</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="lastWeek">Last 7 days</option>
                <option value="lastMonth">Last 30 days</option>
                <option value="lastQuarter">Last Quarter</option>
                <option value="lastYear">Last Year</option>
                <option value="custom">Custom range...</option>
              </select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </>
            )}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Format
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    id="pdf"
                    name="format"
                    type="radio"
                    checked={format === 'pdf'}
                    onChange={() => setFormat('pdf')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="pdf" className="ml-2 block text-sm text-gray-700">
                    PDF
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="xlsx"
                    name="format"
                    type="radio"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="xlsx" className="ml-2 block text-sm text-gray-700">
                    Excel
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="csv"
                    name="format"
                    type="radio"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="csv" className="ml-2 block text-sm text-gray-700">
                    CSV
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Reports</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          <ReportItem 
            title="Monthly Health Summary - April 2023"
            type="Health Summary"
            date="2023-04-26"
            format="PDF"
            size="1.3 MB"
          />
          <ReportItem 
            title="Vaccination Status Report - Q1 2023"
            type="Vaccination Status"
            date="2023-04-15"
            format="Excel"
            size="875 KB"
          />
          <ReportItem 
            title="Treatment History Report - March 2023"
            type="Treatment History"
            date="2023-04-02"
            format="PDF"
            size="1.1 MB"
          />
          <ReportItem 
            title="Medication Usage Report - Q1 2023"
            type="Medication Usage"
            date="2023-03-31"
            format="PDF"
            size="1.2 MB"
          />
          <ReportItem 
            title="Disease Incidence Report - Q1 2023"
            type="Disease Incidence"
            date="2023-03-30"
            format="Excel"
            size="952 KB"
          />
        </ul>
      </div>
    </div>
  );
};

// Update Report Item Component for consistency
const ReportItem = ({ title, type, date, format, size }) => {
  return (
    <li className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {format === 'PDF' ? (
              <div className="w-10 h-12 bg-gradient-to-b from-red-50 to-red-100 border border-red-200 text-red-600 flex items-center justify-center rounded-lg shadow-sm">
                <span className="text-xs font-medium">PDF</span>
              </div>
            ) : format === 'Excel' ? (
              <div className="w-10 h-12 bg-gradient-to-b from-green-50 to-green-100 border border-green-200 text-green-600 flex items-center justify-center rounded-lg shadow-sm">
                <span className="text-xs font-medium">XLS</span>
              </div>
            ) : (
              <div className="w-10 h-12 bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center rounded-lg shadow-sm">
                <span className="text-xs font-medium">CSV</span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-800">{title}</h3>
            <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 gap-1">
              <span className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-full px-2 py-0.5">
                {type}
              </span>
              <span className="mx-1">•</span>
              <span>{formatDate(date)}</span>
              <span className="mx-1">•</span>
              <span>{size}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 rounded-lg shadow-sm transition-all duration-300">
            <Download size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
};

// Add Health Event Modal Component
const AddHealthEventModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    cowId: '',
    eventType: 'Examination',
    eventDate: new Date().toISOString().split('T')[0],
    description: '',
    performedBy: '',
    medications: [{ name: '', dosage: '', method: '' }],
    notes: '',
    followUp: '',
    status: 'Completed'
  });
  const [cows, setCows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Load cows for selection
  useEffect(() => {
    const loadCows = async () => {
      try {
        const cowsList = await fetchCowsForSelection();
        setCows(cowsList);
      } catch (err) {
        console.error('Error loading cows:', err);
        setError('Failed to load cow list');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCows();
  }, []);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle medication field changes
  const handleMedicationChange = (index, field, value) => {
    const updatedMeds = [...formData.medications];
    updatedMeds[index][field] = value;
    
    setFormData({
      ...formData,
      medications: updatedMeds
    });
  };
  
  // Add a new medication field
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', method: '' }]
    });
  };
  
  // Remove a medication field
  const removeMedication = (index) => {
    const updatedMeds = [...formData.medications];
    updatedMeds.splice(index, 1);
    
    setFormData({
      ...formData,
      medications: updatedMeds
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError('Failed to save health event');
    } finally{
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full flex flex-col max-h-[85vh] border border-gray-100 my-4 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 sticky top-0 z-10"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-1 bg-white z-10 flex-shrink-0">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 break-words pr-8">Record Health Event</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="px-6 py-4 space-y-6 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="cowId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cow *
                </label>
                {isLoading ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded-lg"></div>
                ) : (
                  <select
                    id="cowId"
                    name="cowId"
                    value={formData.cowId}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">Select a cow</option>
                    {cows.map(cow => (
                      <option key={cow.id} value={cow.id}>
                        {cow.name} ({cow.tag_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Examination">Examination</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Hoof Trimming">Hoof Trimming</option>
                  <option value="Regular Checkup">Regular Checkup</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By *
                </label>
                <select
                  id="performedBy"
                  name="performedBy"
                  value={formData.performedBy}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a person</option>
                  <option value="Dr. Smith">Dr. Smith</option>
                  <option value="Dr. Johnson">Dr. Johnson</option>
                  <option value="Mike Peterson">Mike Peterson</option>
                  <option value="Farm Staff">Farm Staff</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Brief description of the health event"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medications Used
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-500"
                >
                  <Plus size={16} className="mr-1" />
                  Add Medication
                </button>
              </div>
              
              {/* Make medication fields responsive with horizontal scrolling on small screens */}
              <div className="overflow-x-auto pb-2">
                {formData.medications.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 border-b pb-4 last:border-0 min-w-[600px]">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="e.g. Antibiotic"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="e.g. 10ml"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="flex-grow">
                        <label className="block text-xs text-gray-500 mb-1">
                          Administration Method
                        </label>
                        <select
                          value={med.method}
                          onChange={(e) => handleMedicationChange(index, 'method', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        >
                          <option value="">Select method</option>
                          <option value="Injection">Injection</option>
                          <option value="Oral">Oral</option>
                          <option value="Topical">Topical</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      {formData.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="ml-2 p-2 text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional information about this health event..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="followUp" className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  id="followUp"
                  name="followUp"
                  value={formData.followUp}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
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
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="In progress">In progress</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewHealthEventModal = ({ event, onClose }) => {
  if (!event) return null;
  const medications = Array.isArray(event.medications) ? event.medications : [];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 my-4 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 sticky top-0 z-10"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-1 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 break-words pr-8">Health Event Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Cow</h4>
              <p className="mt-1 text-base font-medium">
                {event.cowName} <span className="text-gray-500">({event.cowTag})</span>
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
              <p className="mt-1 text-base font-medium">{event.eventType}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-base">{event.description}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date</h4>
              <p className="mt-1 text-base">{formatDate(event.eventDate)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <div className="mt-1">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[event.status]}`}>
                  {event.status}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Performed By</h4>
              <p className="mt-1 text-base">{event.performedBy}</p>
            </div>
          </div>
          
          {/* Medications Used */}
          {medications.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Medications Used</h4>
              <div className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-2 border-b border-gray-200 pb-2">
                  <div className="text-xs font-medium text-gray-500">Medication</div>
                  <div className="text-xs font-medium text-gray-500">Dosage</div>
                  <div className="text-xs font-medium text-gray-500">Method</div>
                </div>
                {event.medications.map((med, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0 border-gray-100">
                    <div>{med.name || "-"}</div>
                    <div>{med.dosage || "-"}</div>
                    <div>{med.method || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes */}
          {event.notes && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
              <p className="mt-1 text-sm p-3 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                {event.notes}
              </p>
            </div>
          )}
          
          {/* Follow-up */}
          {event.followUp && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Follow-up Date</h4>
              <p className="mt-1 text-base">{formatDate(event.followUp)}</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const EditHealthEventModal = ({ event, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    cowId: event.cowId || '',
    eventType: event.eventType || 'Examination',
    eventDate: event.eventDate || new Date().toISOString().split('T')[0],
    description: event.description || '',
    performedBy: event.performedBy || '',
    medications: Array.isArray(event.medications) && event.medications.length > 0 ? 
      event.medications : [{ name: '', dosage: '', method: '' }],
    notes: event.notes || '',
    followUp: event.followUp || '',
    status: event.status || 'Completed'
  });
  const [cows, setCows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Load cows for selection (same as AddHealthEventModal)
  useEffect(() => {
    const loadCows = async () => {
      try {
        const cowsList = await fetchCowsForSelection();
        setCows(cowsList);
      } catch (err) {
        console.error('Error loading cows:', err);
        setError('Failed to load cow list');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCows();
  }, []);
  
  // Handle form field changes (same as AddHealthEventModal)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle medication field changes (same as AddHealthEventModal)
  const handleMedicationChange = (index, field, value) => {
    const updatedMeds = [...formData.medications];
    updatedMeds[index][field] = value;
    
    setFormData({
      ...formData,
      medications: updatedMeds
    });
  };
  
  // Add a new medication field (same as AddHealthEventModal)
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', method: '' }]
    });
  };
  
  // Remove a medication field (same as AddHealthEventModal)
  const removeMedication = (index) => {
    const updatedMeds = [...formData.medications];
    updatedMeds.splice(index, 1);
    
    setFormData({
      ...formData,
      medications: updatedMeds
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await onUpdate(event.id, formData);
      onClose();
    } catch (err) {
      setError('Failed to update health event');
      setIsSubmitting(false);
    }
  };
  
  // Return the same modal structure as AddHealthEventModal but with different title
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-100 my-4 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 sticky top-0 z-10"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-1 bg-white z-10 flex-shrink-0">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 break-words pr-8">Edit Health Event</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="px-6 py-4 space-y-6 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="cowId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cow *
                </label>
                {isLoading ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded-lg"></div>
                ) : (
                  <select
                    id="cowId"
                    name="cowId"
                    value={formData.cowId}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">Select a cow</option>
                    {cows.map(cow => (
                      <option key={cow.id} value={cow.id}>
                        {cow.name} ({cow.tag_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Examination">Examination</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Hoof Trimming">Hoof Trimming</option>
                  <option value="Regular Checkup">Regular Checkup</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By *
                </label>
                <select
                  id="performedBy"
                  name="performedBy"
                  value={formData.performedBy}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a person</option>
                  <option value="Dr. Smith">Dr. Smith</option>
                  <option value="Dr. Johnson">Dr. Johnson</option>
                  <option value="Mike Peterson">Mike Peterson</option>
                  <option value="Farm Staff">Farm Staff</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Brief description of the health event"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medications Used
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-500"
                >
                  <Plus size={16} className="mr-1" />
                  Add Medication
                </button>
              </div>
              
              {formData.medications.map((med, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-4 border-b pb-4 last:border-0">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="e.g. Antibiotic"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="e.g. 10ml"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="flex-grow">
                      <label className="block text-xs text-gray-500 mb-1">
                        Administration Method
                      </label>
                      <select
                        value={med.method}
                        onChange={(e) => handleMedicationChange(index, 'method', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="">Select method</option>
                        <option value="Injection">Injection</option>
                        <option value="Oral">Oral</option>
                        <option value="Topical">Topical</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="ml-2 p-2 text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional information about this health event..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="followUp" className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  id="followUp"
                  name="followUp"
                  value={formData.followUp}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
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
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="In progress">In progress</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add this modal component
const DeleteConfirmationModal = ({ event, onClose, onConfirm }) => {
  if (!event) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 my-4 mx-auto">
        <div className="h-1 bg-gradient-to-r from-red-400 to-red-500"></div>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          
          <p className="text-center text-gray-700 mb-2">
            Are you sure you want to delete this health event?
          </p>
          
          <p className="text-center text-sm text-gray-500 mb-4 break-words">
            <span className="font-medium">{event.eventType}</span> for <span className="font-medium">{event.cowName}</span> on {formatDate(event.eventDate)}
          </p>
          
          <p className="text-center text-sm text-red-600 font-medium mb-2">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Medication Modal Component
const AddMedicationModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Antibiotic',
    stock: '',
    unit: 'doses',
    expirationDate: '',
    supplier: '',
    reorderLevel: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      console.log('Form data submitted:', formData);
      setIsSubmitting(false); // Add this line to reset isSubmitting when done
      onClose();
    }, 1000);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 my-4 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 sticky top-0 z-10"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-1 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 break-words pr-8">Add New Medication</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Antibiotic">Antibiotic</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Pain relief">Pain relief</option>
                <option value="Topical">Topical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="doses">doses</option>
                  <option value="bottles">bottles</option>
                  <option value="tubes">tubes</option>
                  <option value="containers">containers</option>
                  <option value="packages">packages</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  id="reorderLevel"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional information..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-gray-50 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthManagement;