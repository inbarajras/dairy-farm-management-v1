import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, Clock, Mail, Phone, MapPin, Users, Award, FileText, Briefcase, User,Download,DollarSign,Droplet,Thermometer, QrCode, Camera, Heart, Activity, AlertTriangle } from 'lucide-react';
import { fetchCows, addCow, updateCow, deleteCow, recordHealthEvent, recordMilkProduction, recordBreedingEvent,
  fetchRecentActivity,fetchBreedingEvents,fetchHealthHistory,fetchReproductiveStatus,
  fetchGrowthMilestones, recordGrowthMilestone
 } from './services/cowService';
import RecordGrowthMilestoneModal from './RecordGrowthMilestoneModal';
import GrowthChart from './GrowthChart';
import GrowthMilestoneSummary from './GrowthMilestoneSummary';
import NextMilestoneReminder from './NextMilestoneReminder';
import CowQRCode from './CowQRCode';
import QRScanner from './QRScanner';
import cowSample from '../assets/images/cow.jpg';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import {toast} from './utils/ToastContainer';
import { useRole } from '../contexts/RoleContext';
import UserRoleBadge from './UserRoleBadge';
import {
  statusColors,
  healthStatusColors,
  attendanceStatusColors,
  REFRESH_INTERVAL_MS,
  SUCCESS_MESSAGE_DURATION_MS,
  ERROR_MESSAGE_DURATION_MS,
  SHIFT_TYPES
} from './utils/cowConstants';
import { sortMilkProductionRecords } from './utils/cowSorting';

// Utility function to format dates
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Main cow management component
const CowManagement = () => {
  const { userRole, hasPermission = () => false } = useRole() || {};
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCow, setSelectedCow] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordHealthEventModalOpen, setIsRecordHealthEventModalOpen] = useState(false);
  const [isRecordMilkModalOpen, setIsRecordMilkModalOpen] = useState(false);
  const [isRecordBreedingEventModalOpen, setIsRecordBreedingEventModalOpen] = useState(false);
  const [isViewBreedingEventModalOpen, setIsViewBreedingEventModalOpen] = useState(false);
  const [selectedBreedingEvent, setSelectedBreedingEvent] = useState(null);
  const [isRecordGrowthMilestoneModalOpen, setIsRecordGrowthMilestoneModalOpen] = useState(false);
  const [cowToEdit, setCowToEdit] = useState(null);
  const [cowToDelete, setCowToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [growthMilestones, setGrowthMilestones] = useState([]);
  const [filters, setFilters] = useState({
    status: 'All',
    healthStatus: 'All',
    breed: 'All',
    milkingStatus: 'All',
    reproductiveStatus: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [view, setView] = useState('grid'); // 'grid' or 'table'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'milking', 'calves'
  const [breedingData, setBreedingData] = useState({}); // Store breeding events for each cow
  const [reproductiveStatuses, setReproductiveStatuses] = useState({}); // Store reproductive status for each cow
  const [initialCowProfileTab, setInitialCowProfileTab] = useState('overview'); // Initial tab for cow profile

  // Date range states
  const [dateRange, setDateRange] = useState('week'); // 'week', 'month', 'quarter', 'year', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // QR Code states
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedCowForQR, setSelectedCowForQR] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQuickRecordModal, setShowQuickRecordModal] = useState(false);
  const [scannedCowData, setScannedCowData] = useState(null);

  // Fetch cows on component mount
  useEffect(() => {
    const loadCows = async () => {
      try {
        setLoading(true);
        const data = await fetchCows();
        setCows(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load cows. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCows();
  }, []);

  // Refresh cow data function (can be called when data changes)
  const refreshCowData = useCallback(async () => {
    try {
      const data = await fetchCows();
      setCows(data);

      // If we have a selected cow, update it with fresh data
      if (selectedCow) {
        const updatedSelectedCow = data.find(cow => cow.id === selectedCow.id);
        if (updatedSelectedCow) {
          setSelectedCow(updatedSelectedCow);
        }
      }
    } catch (err) {
      console.error('Error refreshing cow data:', err);
      toast.error('Failed to refresh cow data.');
    }
  }, [selectedCow]);

  // Load breeding data when breeding tab is active
  useEffect(() => {
    const loadBreedingData = async () => {
      if (activeTab === 'breeding' && cows.length > 0) {
        try {
          const breedingDataMap = {};
          const reproductiveStatusMap = {};

          // Fetch breeding events and reproductive status for each cow
          await Promise.all(
            cows
              .filter(cow => cow.status !== 'Calf' && cow.status !== 'Sold' && cow.status !== 'Deceased')
              .map(async (cow) => {
                try {
                  const [events, status] = await Promise.all([
                    fetchBreedingEvents(cow.id),
                    fetchReproductiveStatus(cow.id)
                  ]);
                  breedingDataMap[cow.id] = events || [];
                  reproductiveStatusMap[cow.id] = status || null;
                } catch (error) {
                  console.error(`Error fetching breeding data for cow ${cow.id}:`, error);
                  breedingDataMap[cow.id] = [];
                  reproductiveStatusMap[cow.id] = null;
                }
              })
          );

          setBreedingData(breedingDataMap);
          setReproductiveStatuses(reproductiveStatusMap);
        } catch (error) {
          console.error('Error loading breeding data:', error);
        }
      }
    };

    loadBreedingData();
  }, [activeTab, cows]);

  // Add periodic refresh to catch updates from other components
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCowData();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshCowData]);

  const ensureValidCows = (cowsArray) => {
    if (!cowsArray || !Array.isArray(cowsArray)) {
      return [];
    }
    return cowsArray;
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Helper function to check milking status for filtering and display
  const getLatestMilkProduction = (cow) => {
    if (!cow?.milkProduction || cow.milkProduction.length === 0) {
      return 0;
    }

    // Get today's date and yesterday's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Group records by date and calculate daily totals
    const dailyTotals = cow.milkProduction.reduce((acc, record) => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + parseFloat(record.amount || 0);
      return acc;
    }, {});

    // Return today's total if available, otherwise yesterday's total
    if (dailyTotals[todayStr]) {
      return parseFloat(dailyTotals[todayStr].toFixed(1));
    }

    if (dailyTotals[yesterdayStr]) {
      return parseFloat(dailyTotals[yesterdayStr].toFixed(1));
    }

    return 0;
  };

  const checkCowMilkingStatus = (cow) => {
    // Skip check for non-milking cows
    if (cow?.status === 'Calf' || cow?.status === 'Heifer' || cow?.status === 'Dry') {
      return null;
    }
    
    if (cow?.milkProduction && cow.milkProduction.length > 0) {
      // Sort milk production records by date to ensure we get the latest one
      // Create a defensive copy and sort properly with enhanced logic
      const sortedProduction = [...cow.milkProduction].sort((a, b) => {
        // Ensure we're comparing dates correctly
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Check for invalid dates
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('Invalid date found in milk production records:', { a: a.date, b: b.date });
          return 0;
        }
        
        const dateComparison = dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        
        // If dates are the same, prioritize Evening shift over Morning shift
        if (dateComparison === 0) {
          const shiftA = a.shift || 'Morning';
          const shiftB = b.shift || 'Morning';
          
          // Evening has higher priority than Morning
          if (shiftA === 'Evening' && shiftB === 'Morning') {
            return -1; // a comes first (Evening before Morning)
          }
          if (shiftA === 'Morning' && shiftB === 'Evening') {
            return 1; // b comes first (Evening before Morning)
          }
          
          // If both are the same shift, maintain original order
          return 0;
        }
        
        return dateComparison;
      });
      
      const latest = sortedProduction[0];
      if (!latest || !latest.date) {
        return { milked: false, message: 'No milking date recorded' };
      }
      
      // Get today's date in the local timezone and normalize to YYYY-MM-DD
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
      
      // Normalize the latest milk production date to YYYY-MM-DD format
      let milkDateStr;
      try {
        const milkDate = new Date(latest.date);
        if (isNaN(milkDate.getTime())) {
          console.warn('Invalid milk production date:', latest.date);
          return { milked: false, message: 'Invalid milking date format' };
        }
        
        milkDateStr = milkDate.getFullYear() + '-' + 
                     String(milkDate.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(milkDate.getDate()).padStart(2, '0');
      } catch (error) {
        console.error('Error parsing milk production date:', latest.date, error);
        return { milked: false, message: 'Error parsing milking date' };
      }
      
      const isSameDay = todayStr === milkDateStr;
      const hasActualMilk = latest.amount && parseFloat(latest.amount) > 0;

      return {
        milked: isSameDay && hasActualMilk,
        message: (isSameDay && hasActualMilk) ? 'Milked today' : 'Not milked today',
        shift: latest.shift || 'Not specified',
        latestDate: milkDateStr,
        todayDate: todayStr
      };
    }

    return { milked: false, message: 'No milking records' };
  };

  // Filter cows based on search and filters (memoized for performance)
  const filteredCows = useMemo(() => {
    return ensureValidCows(cows).filter(cow => {
      // Only process if cow is a valid object
      if (!cow || typeof cow !== 'object') return false;

      // Tab-specific filtering
      if (activeTab === 'milking') {
        // Show only milking cows (Active or Dry status, excluding calves/heifers)
        if (!['Active', 'Dry'].includes(cow.status)) return false;
      } else if (activeTab === 'calves') {
        // Show only calves and heifers
        if (!['Calf', 'Heifer'].includes(cow.status)) return false;
      } else if (activeTab === 'dashboard') {
        // Dashboard doesn't use this filtered list
        return true;
      }

      // Search filter with safety checks
      const matchesSearch =
        searchQuery === '' ||
        (cow.name && cow.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cow.tagNumber && cow.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.breed.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus =
        filters.status === 'All' ||
        cow.status === filters.status;

      // Health status filter
      const matchesHealthStatus =
        filters.healthStatus === 'All' ||
        cow.healthStatus === filters.healthStatus;

      // Breed filter
      const matchesBreed =
        filters.breed === 'All' ||
        cow.breed === filters.breed;

      // Milking status filter
      let matchesMilkingStatus = true;
      if (filters.milkingStatus !== 'All') {
        const milkingStatus = checkCowMilkingStatus(cow);

        if (filters.milkingStatus === 'Milked') {
          matchesMilkingStatus = milkingStatus && milkingStatus.milked;
        } else if (filters.milkingStatus === 'NotMilked') {
          matchesMilkingStatus = !milkingStatus || !milkingStatus.milked;
        } else if (filters.milkingStatus === 'Morning' || filters.milkingStatus === 'Evening') {
          matchesMilkingStatus = milkingStatus && milkingStatus.milked && milkingStatus.shift === filters.milkingStatus;
        }
      }

      return matchesSearch && matchesStatus && matchesHealthStatus && matchesBreed && matchesMilkingStatus;
    }).sort((a, b) => {
      // Sort by purchase date (newest first) for milking and calves tabs
      if (activeTab === 'milking' || activeTab === 'calves') {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
        const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
      }
      return 0; // No sorting for other tabs
    });
  }, [cows, searchQuery, filters, activeTab]);

  // Pagination
  const indexOfLastCow = currentPage * itemsPerPage;
  const indexOfFirstCow = indexOfLastCow - itemsPerPage;
  const currentCows = filteredCows.slice(indexOfFirstCow, indexOfLastCow);
  const totalPages = Math.ceil(filteredCows.length / itemsPerPage);

  // Calculate date range based on selected filter
  const calculateDateRange = useCallback(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    let startDate = new Date(today);
    let endDate = new Date(today);

    switch (dateRange) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '14days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
        } else {
          startDate = new Date(today.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
        }
        if (customEndDate) {
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }, [dateRange, customStartDate, customEndDate]);

  // Get unique breeds for filter (memoized for performance)
  const uniqueBreeds = useMemo(() =>
    Array.from(new Set(cows.map(cow => cow.breed))),
    [cows]
  );

  // Get top milking cows for dashboard
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topMilkingCows = useMemo(() => {
    console.log('=== TOP MILKING COWS CALCULATION START ===');
    console.log('Total cows:', cows.length);
    console.log('Date range:', dateRange);
    console.log('Custom start:', customStartDate);
    console.log('Custom end:', customEndDate);

    const milkingCows = ensureValidCows(cows).filter(cow =>
      ['Active', 'Dry'].includes(cow.status) &&
      cow.milkProduction &&
      cow.milkProduction.length > 0
    );

    console.log('Milking cows with production:', milkingCows.length);

    // Log sample cow data to inspect structure
    if (milkingCows.length > 0) {
      console.log('Sample cow data:', {
        name: milkingCows[0].name,
        productionRecords: milkingCows[0].milkProduction.length,
        sampleRecord: milkingCows[0].milkProduction[0]
      });
    }

    const { startDate, endDate } = calculateDateRange();
    console.log('Date range calculated:', {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    const cowsWithMilk = milkingCows.map(cow => {
      // Calculate total milk production - FIRST CHECK ALL RECORDS WITHOUT DATE FILTER
      console.log(`\n${cow.name}:`, {
        totalRecords: cow.milkProduction.length,
        sampleRecords: cow.milkProduction.slice(0, 2)
      });

      // Calculate total from ALL records first to verify data
      const totalAllRecords = cow.milkProduction.reduce((sum, record) => {
        const amount = parseFloat(record.amount);
        console.log(`  Record: date=${record.date}, amount=${record.amount}, parsed=${amount}`);
        return sum + (amount || 0);
      }, 0);

      console.log(`  Total from ALL records: ${totalAllRecords}L`);

      // Now filter by date range
      const productionInRange = cow.milkProduction.filter(record => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      const totalMilk = productionInRange.reduce((sum, record) =>
        sum + (parseFloat(record.amount) || 0), 0
      );

      console.log(`  In range: ${productionInRange.length} records, Total: ${totalMilk}L`);

      // Calculate days in range for average
      const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const avgDailyMilk = productionInRange.length > 0 && daysInRange > 0
        ? totalMilk / daysInRange
        : 0;

      return {
        ...cow,
        totalMilkInRange: totalMilk,
        avgDailyMilk: avgDailyMilk,
        recordCount: productionInRange.length
      };
    });

    const sorted = cowsWithMilk
      .sort((a, b) => b.totalMilkInRange - a.totalMilkInRange)
      .slice(0, 10);

    console.log('Top 10 cows:', sorted.map(c => `${c.name}: ${c.totalMilkInRange}L`));
    console.log('=== TOP MILKING COWS CALCULATION END ===');

    return sorted;
  }, [cows, calculateDateRange]);

  // Open cow profile
  const openCowProfile = (cow, tab = 'overview') => {
    setSelectedCow(cow);
    setInitialCowProfileTab(tab);
  };

  // Close cow profile
  const closeCowProfile = () => {
    setSelectedCow(null);
  };

  // Toggle add modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  // Toggle edit modal
  const toggleEditModal = (cow = null, e) => {
    if (e) e.stopPropagation();
    setCowToEdit(cow);
    setIsEditModalOpen(!isEditModalOpen);
  };

  // Toggle delete modal
  const toggleDeleteModal = (cow = null, e) => {
    if (e) e.stopPropagation();
    setCowToDelete(cow);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  // Toggle record health event modal
  const toggleRecordHealthEventModal = () => {
    setIsRecordHealthEventModalOpen(!isRecordHealthEventModalOpen);
  };

  // Toggle record milk production modal
  const toggleRecordMilkModal = () => {
    setIsRecordMilkModalOpen(!isRecordMilkModalOpen);
  };

  // Toggle record breeding event modal
  const toggleRecordBreedingEventModal = () => {
    setIsRecordBreedingEventModalOpen(!isRecordBreedingEventModalOpen);
  };

  // View breeding event details
  const viewBreedingEvent = (event) => {
    setSelectedBreedingEvent(event);
    setIsViewBreedingEventModalOpen(true);
  };

  // Close view breeding event modal
  const closeViewBreedingEventModal = () => {
    setIsViewBreedingEventModalOpen(false);
    setSelectedBreedingEvent(null);
  };
  
  // Toggle record growth milestone modal
  const toggleRecordGrowthMilestoneModal = () => {
    setIsRecordGrowthMilestoneModalOpen(!isRecordGrowthMilestoneModalOpen);
  };

  // Add new cow
  const handleAddCow = async (newCowData) => {
    try {
      setLoading(true);
      const newCow = await addCow(newCowData);
      setCows([...cows, newCow]);
      toast.success('New cow added successfully!');
    } catch (err) {
      console.error("Error adding cow:", err);
      toast.error('Failed to add cow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Edit cow
  const handleEditCow = async (updatedCowData) => {
    try {
      setLoading(true);
      const updatedCow = await updateCow(updatedCowData.id, updatedCowData);
      
      // Ensure we preserve all fields when updating the state
      setCows(prevCows => prevCows.map(cow => 
        cow.id === updatedCow.id ? { ...cow, ...updatedCow } : cow
      ));
      
      if (selectedCow && selectedCow.id === updatedCow.id) {
        setSelectedCow(prev => ({ ...prev, ...updatedCow }));
      }

      toast.success('Cow updated successfully!');
    } catch (err) {
      console.error("Error updating cow:", err);
      toast.error('Failed to update cow. Please try again.');
    } finally{
      setLoading(false);
    }
  };

  // Delete cow
  const handleDeleteCow = async (cowId) => {
    try {
      setLoading(true);
      await deleteCow(cowId);
      setCows(cows.filter(cow => cow.id !== cowId));
      
      if (selectedCow && selectedCow.id === cowId) {
        setSelectedCow(null);
      }

      toast.success('Cow deleted successfully!');
    } catch (err) {
      console.error("Error deleting cow:", err);
      toast.error('Failed to delete cow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Record health event
  const handleRecordHealthEvent = async (cowId, eventData) => {
    try {
      setLoading(true);
      await recordHealthEvent(cowId, eventData);
      
      // Update local state with the new health status
      const updatedCows = cows.map(cow => {
        if (cow.id === cowId) {
          return {
            ...cow,
            lastHealthCheck: eventData.eventDate,
            healthStatus: eventData.status || cow.healthStatus
          };
        }
        return cow;
      });
      
      setCows(updatedCows);

      if (selectedCow && selectedCow.id === cowId) {
        setSelectedCow({
          ...selectedCow,
          lastHealthCheck: eventData.eventDate,
          healthStatus: eventData.status || selectedCow.healthStatus
        });
      }

      // Refresh cow data to get the latest information including new health event
      await refreshCowData();

      toast.success('Health event recorded successfully!');
      setIsRecordHealthEventModalOpen(false);
    } catch (err) {
      console.error("Error recording health event:", err);
      toast.error('Failed to record health event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Record milk production
  const handleRecordMilkProduction = async (cowId, recordData) => {
    try {
      setLoading(true);
      const result = await recordMilkProduction(cowId, recordData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }
      
      // Create the new milk record object
      const newMilkRecord = {
        date: recordData.date,
        amount: recordData.amount,
        shift: recordData.shift || 'Morning',
        quality: recordData.quality || 'Good',
        notes: recordData.notes || ''
      };
      
      // Update local state with the new milk production record
      const updatedCows = cows.map(cow => {
        if (cow.id === cowId) {
          // Add the new record and sort by date (newest first), then by shift priority (Evening > Morning) for same day
          const updatedMilkProduction = [...cow.milkProduction, newMilkRecord]
            .sort((a, b) => {
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              
              // Check for invalid dates
              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                console.warn('Invalid date found in milk production records:', { a: a.date, b: b.date });
                return 0;
              }
              
              const dateComparison = dateB.getTime() - dateA.getTime();
              
              // If dates are the same, prioritize Evening shift over Morning shift
              if (dateComparison === 0) {
                const shiftA = a.shift || 'Morning';
                const shiftB = b.shift || 'Morning';
                
                // Evening has higher priority than Morning
                if (shiftA === 'Evening' && shiftB === 'Morning') {
                  return -1; // a comes first (Evening before Morning)
                }
                if (shiftA === 'Morning' && shiftB === 'Evening') {
                  return 1; // b comes first (Evening before Morning)
                }
                
                // If both are the same shift, maintain original order
                return 0;
              }
              
              return dateComparison;
            });
          
          return {
            ...cow,
            milkProduction: updatedMilkProduction
          };
        }
        return cow;
      });
      
      setCows(updatedCows);
      
      if (selectedCow && selectedCow.id === cowId) {
        const updatedMilkProduction = [...selectedCow.milkProduction, newMilkRecord]
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            // Check for invalid dates
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              console.warn('Invalid date found in milk production records:', { a: a.date, b: b.date });
              return 0;
            }
            
            const dateComparison = dateB.getTime() - dateA.getTime();
            
            // If dates are the same, prioritize Evening shift over Morning shift
            if (dateComparison === 0) {
              const shiftA = a.shift || 'Morning';
              const shiftB = b.shift || 'Morning';
              
              // Evening has higher priority than Morning
              if (shiftA === 'Evening' && shiftB === 'Morning') {
                return -1; // a comes first (Evening before Morning)
              }
              if (shiftA === 'Morning' && shiftB === 'Evening') {
                return 1; // b comes first (Evening before Morning)
              }
              
              // If both are the same shift, maintain original order
              return 0;
            }
            
            return dateComparison;
          });
          
        setSelectedCow({
          ...selectedCow,
          milkProduction: updatedMilkProduction
        });
      }

      // Refresh cow data to get the latest milk production data
      await refreshCowData();

      setIsRecordMilkModalOpen(false);
      toast.success('Milk production recorded successfully!');
    } catch (err) {
      console.error("Error recording milk production:", err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Record breeding event
  const handleRecordBreedingEvent = async (cowId, eventData) => {
    try {
      setLoading(true);
      const newEvent = await recordBreedingEvent(cowId, eventData);
      
      // Refresh cow data to get the latest breeding events and reproductive status
      await refreshCowData();

      setIsRecordBreedingEventModalOpen(false);
      toast.success('Breeding event recorded successfully!');
    } catch (err) {
      console.error("Error recording breeding event:", err);
      toast.error('Failed to record breeding event. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Record growth milestone
  const handleRecordGrowthMilestone = async (cowId, milestoneData) => {
    try {
      setLoading(true);
      const newMilestone = await recordGrowthMilestone(cowId, milestoneData);
      
      // Refresh the growth milestones data
      const updatedMilestones = await fetchGrowthMilestones(cowId);
      setGrowthMilestones(updatedMilestones);
      
      // Update the cows list with new weight/growth data
      const updatedCows = cows.map(cow => {
        if (cow.id === cowId) {
          return {
            ...cow,
            currentWeight: parseFloat(milestoneData.weight),
            // If we have enough data to calculate growth rate, update it
            growthRate: updatedMilestones.length > 1 && 
              updatedMilestones[updatedMilestones.length - 1].growthRate || cow.growthRate
          };
        }
        return cow;
      });
      
      setCows(updatedCows);
      
      // Refresh cow data to get the latest weight and growth rate data
      await refreshCowData();

      setIsRecordGrowthMilestoneModalOpen(false);
      toast.success('Growth milestone recorded successfully!');
    } catch (err) {
      console.error("Error recording growth milestone:", err);
      toast.error('Failed to record growth milestone. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // QR Code handler functions
  const handleShowQRCode = (cow) => {
    setSelectedCowForQR(cow);
    setShowQRCode(true);
  };
  
  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setSelectedCowForQR(null);
  };
  
  const handleShowQRScanner = () => {
    setShowQRScanner(true);
  };
  
  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
  };
  
  const handleQRScan = (cowData) => {
    setScannedCowData(cowData);
    setShowQRScanner(false);
    
    // Find the cow in our local data
    const scannedCow = cows.find(cow => cow.id === cowData.id);
    if (scannedCow) {
      setSelectedCow(scannedCow);
      setShowQuickRecordModal(true);
    } else {
      toast.error('Cow not found in the system.');
    }
  };
  
  const handleQuickRecord = (recordType) => {
    setShowQuickRecordModal(false);
    
    if (recordType === 'milk') {
      setIsRecordMilkModalOpen(true);
    } else if (recordType === 'health') {
      setIsRecordHealthEventModalOpen(true);
    }
  };
  
  const handleCloseQuickRecord = () => {
    setShowQuickRecordModal(false);
    setScannedCowData(null);
  };

  // We're now using the global checkCowMilkingStatus function consistently
  

  if (loading && cows.length === 0) {
    return <LoadingSpinner message="Loading Cows" />;
  }

  if (error && cows.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-auto border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500"></div>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 mb-2">Unable to Load Data</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 overflow-y-auto">
      
      {selectedCow ? (
      <CowProfile
          cow={selectedCow}
          onClose={closeCowProfile}
          onEdit={() => toggleEditModal(selectedCow)}
          onRecordHealthEvent={toggleRecordHealthEventModal}
          toggleRecordMilkModal={toggleRecordMilkModal}
          toggleRecordBreedingEventModal={toggleRecordBreedingEventModal}
          toggleRecordGrowthMilestoneModal={toggleRecordGrowthMilestoneModal}
          hasPermission={hasPermission}
          viewBreedingEvent={viewBreedingEvent}
          initialTab={initialCowProfileTab}
        />
      ) : (
        <div className="px-4 py-6 sm:px-6 max-w-[1500px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700 mr-3">Cow Management</h1>
              <UserRoleBadge role={userRole} />
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleShowQRScanner}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              >
                <Camera size={20} className="mr-2" />
                Scan QR
              </button>
              {hasPermission('cow:create') && (
                <button 
                  onClick={toggleAddModal}
                  data-action="add-cow"
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Plus size={20} className="mr-2" />
                  Add New Cow
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 overflow-x-auto">
            <nav className="flex space-x-4 border-b border-gray-200 min-w-[600px]">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'dashboard'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('milking')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'milking'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Milking Cows
              </button>
              <button
                onClick={() => setActiveTab('breeding')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'breeding'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Breeding & Pregnancy
              </button>
              <button
                onClick={() => setActiveTab('calves')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'calves'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Calves
              </button>
            </nav>
          </div>

          {/* Date Range Selector - Show on dashboard tab */}
          {activeTab === 'dashboard' && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Date Range:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200 min-w-[140px]"
              >
                <option value="week">Last 7 days</option>
                <option value="14days">Last 14 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 90 days</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    min={customStartDate}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Search and Filters - Only show on milking and calves tabs */}
          {(activeTab === 'milking' || activeTab === 'calves') && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  placeholder="Search by name, tag or breed..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 col-span-3 md:grid-cols-4">
              <div>
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Calf">Calf</option>
                  <option value="Heifer">Heifer</option>
                  <option value="Active">Active</option>
                  <option value="Dry">Dry</option>
                  <option value="Sold">Sold</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>

              <div>
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  value={filters.healthStatus}
                  onChange={(e) => handleFilterChange('healthStatus', e.target.value)}
                >
                  <option value="All">All Health</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Monitored">Monitored</option>
                  <option value="Under treatment">Treatment</option>
                </select>
              </div>

              <div>
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  value={filters.breed}
                  onChange={(e) => handleFilterChange('breed', e.target.value)}
                >
                  <option value="All">All Breeds</option>
                  {uniqueBreeds.map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  value={filters.milkingStatus}
                  onChange={(e) => handleFilterChange('milkingStatus', e.target.value)}
                >
                  <option value="All">All Milking</option>
                  <option value="Milked">Milked Today</option>
                  <option value="NotMilked">Not Milked Today</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                </select>
              </div>
            </div>
          </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Cows</p>
                      <p className="text-2xl font-bold text-gray-800">{cows.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Milking Cows</p>
                      <p className="text-2xl font-bold text-green-600">
                        {cows.filter(c => ['Active', 'Dry'].includes(c.status)).length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Droplet size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Calves</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {cows.filter(c => ['Calf', 'Heifer'].includes(c.status)).length}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg Daily Milk</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {topMilkingCows.length > 0
                          ? `${(topMilkingCows.reduce((sum, c) => sum + c.avgDailyMilk, 0) / topMilkingCows.length).toFixed(1)}L`
                          : '0L'
                        }
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <Droplet size={24} className="text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Milking Cows */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Top 10 Milking Cows
                    {dateRange === 'week' && ' (Last 7 Days)'}
                    {dateRange === '14days' && ' (Last 14 Days)'}
                    {dateRange === 'month' && ' (Last 30 Days)'}
                    {dateRange === 'quarter' && ' (Last 90 Days)'}
                    {dateRange === 'year' && ' (This Year)'}
                    {dateRange === 'custom' && ' (Custom Range)'}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cow</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Period)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Daily</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topMilkingCows.length > 0 ? (
                        topMilkingCows.map((cow, index) => (
                          <tr key={cow.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                index === 2 ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-50 text-blue-600'
                              } font-bold`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{cow.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{cow.tagNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{cow.breed}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600">{cow.totalMilkInRange.toFixed(1)} L</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{cow.avgDailyMilk.toFixed(1)} L</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[cow.status]}`}>
                                {cow.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openCowProfile(cow)}
                                className="text-green-600 hover:text-green-900"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                            No milking data available for the selected date range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Milking Cows Tab and Calves Tab */}
          {(activeTab === 'milking' || activeTab === 'calves') && (
          <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstCow + 1}-{Math.min(indexOfLastCow, filteredCows.length)} of {filteredCows.length} cows
            </div>
            <div className="flex space-x-2">
              <button
                className={`p-2 rounded-md transition-all duration-300 ${view === 'grid' ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-600 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setView('grid')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                className={`p-2 rounded-md transition-all duration-300 ${view === 'table' ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-600 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setView('table')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentCows.map(cow => (
                <CowCard 
                  key={cow.id} 
                  cow={cow} 
                  onClick={() => openCowProfile(cow)}
                  onEdit={(e) => toggleEditModal(cow, e)}
                  onDelete={(e) => toggleDeleteModal(cow, e)}
                  checkCowMilkingStatus={checkCowMilkingStatus}
                  hasPermission={hasPermission}
                  onShowQRCode={handleShowQRCode}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Breed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Milk Production
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Milking Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCows.map(cow => (
                    <tr key={cow.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-200" onClick={() => openCowProfile(cow)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cow.tagNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.breed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.age}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${healthStatusColors[cow.healthStatus] || 'bg-gray-100 text-gray-800'}`}>
                          {cow.healthStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {`${getLatestMilkProduction(cow)}L/day`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const milkingStatus = checkCowMilkingStatus(cow);
                          if (!milkingStatus || cow?.status === 'Calf' || cow?.status === 'Heifer' || cow?.status === 'Dry') {
                            return <span className="text-sm text-gray-400">N/A</span>;
                          }
                          
                          return (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${
                              milkingStatus.milked 
                                ? milkingStatus.shift === 'Morning'
                                  ? 'bg-blue-100 text-blue-700' 
                                  : milkingStatus.shift === 'Evening'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 inline-block ${
                                milkingStatus.milked 
                                  ? milkingStatus.shift === 'Morning'
                                    ? 'bg-blue-500'
                                    : milkingStatus.shift === 'Evening'
                                      ? 'bg-purple-500'
                                      : 'bg-green-500'
                                  : 'bg-red-500'
                              }`}></div>
                              {milkingStatus.milked 
                                ? `Milked (${milkingStatus.shift})` 
                                : 'Not milked'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-purple-600 hover:text-purple-900 transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowQRCode(cow);
                            }}
                            title="Generate QR Code"
                          >
                            <QrCode size={16} />
                          </button>
                          {hasPermission('cow:update') && (
                            <button 
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                              onClick={(e) => toggleEditModal(cow, e)}
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {hasPermission('cow:delete') && (
                            <button 
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              onClick={(e) => toggleDeleteModal(cow, e)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md transition-all duration-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === page ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md transition-all duration-300 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          </>
          )}

          {/* Breeding & Pregnancy Tab */}
          {activeTab === 'breeding' && (() => {
            const today = new Date();

            // Calculate breeding statistics from real data
            const inseminatedCows = cows.filter(cow => {
              const events = breedingData[cow.id] || [];
              const lastInsemination = events.find(e =>
                (e.event_type === 'Insemination' || e.event_type === 'Artificial Insemination' || e.event_type === 'Natural Breeding') &&
                (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24) <= 90
              );
              const reproStatus = reproductiveStatuses[cow.id];
              return lastInsemination && reproStatus?.status !== 'Pregnant';
            });

            const pregnantCows = cows.filter(cow => {
              const reproStatus = reproductiveStatuses[cow.id];
              return reproStatus?.status === 'Pregnant' || reproStatus?.status === 'Confirmed';
            });

            const dueForCheck = cows.filter(cow => {
              const events = breedingData[cow.id] || [];
              const lastInsemination = events.find(e =>
                e.event_type === 'Insemination' || e.event_type === 'Artificial Insemination' || e.event_type === 'Natural Breeding'
              );
              if (!lastInsemination) return false;
              const daysSince = (new Date() - new Date(lastInsemination.date)) / (1000 * 60 * 60 * 24);
              const reproStatus = reproductiveStatuses[cow.id];
              return daysSince >= 30 && daysSince <= 45 && reproStatus?.status !== 'Pregnant';
            });

            const expectedCalvings = cows.filter(cow => {
              const reproStatus = reproductiveStatuses[cow.id];
              if (reproStatus?.status !== 'Pregnant' && reproStatus?.status !== 'Confirmed') return false;

              const events = breedingData[cow.id] || [];
              const confirmEvent = events.find(e =>
                e.event_type === 'Pregnancy Check' && (e.result === 'Confirmed' || e.result === 'Positive')
              );
              const inseminationEvent = events.find(e =>
                e.event_type === 'Insemination' || e.event_type === 'Artificial Insemination'
              );

              const eventDate = confirmEvent?.date || inseminationEvent?.date;
              if (!eventDate) return false;

              const daysPregnant = (today - new Date(eventDate)) / (1000 * 60 * 60 * 24);
              const daysUntilCalving = 283 - daysPregnant;
              return daysUntilCalving > 0 && daysUntilCalving <= 60;
            });

            return (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Inseminated Cows</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {inseminatedCows.length}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Heart size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pregnant Cows</p>
                      <p className="text-2xl font-bold text-green-600">
                        {pregnantCows.length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Activity size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Due for Pregnancy Check</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dueForCheck.length}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <AlertTriangle size={24} className="text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Expected Calvings</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {expectedCalvings.length}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Calendar size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Filter by:</span>
                <select
                  value={filters.reproductiveStatus}
                  onChange={(e) => setFilters({...filters, reproductiveStatus: e.target.value})}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px]"
                >
                  <option value="All">All Reproductive Status</option>
                  <option value="Open">Open</option>
                  <option value="Pregnant">Pregnant</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Bred">Bred</option>
                  <option value="Inseminated">Inseminated</option>
                  <option value="Heat">Heat/Estrus</option>
                </select>
              </div>

              {/* Breeding Status Table */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700">
                    Breeding Status Overview
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tag / Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Breed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reproductive Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Breeding Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Since Event
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cows
                        .filter(cow => {
                          // Filter out Calves, Sold, and Deceased
                          if (cow.status === 'Calf' || cow.status === 'Sold' || cow.status === 'Deceased') {
                            return false;
                          }

                          // Filter by reproductive status
                          if (filters.reproductiveStatus !== 'All') {
                            const reproStatus = reproductiveStatuses[cow.id];
                            const statusText = reproStatus?.status || 'Open';

                            // Handle Heat/Estrus
                            if (filters.reproductiveStatus === 'Heat') {
                              return statusText === 'Heat' || statusText === 'Estrus';
                            }

                            return statusText === filters.reproductiveStatus;
                          }

                          return true;
                        })
                        .map(cow => {
                          const events = breedingData[cow.id] || [];
                          const reproStatus = reproductiveStatuses[cow.id];

                          // Get last breeding event
                          const lastEvent = events.length > 0 ? events[0] : null;
                          const daysSinceEvent = lastEvent
                            ? Math.floor((today - new Date(lastEvent.date)) / (1000 * 60 * 60 * 24))
                            : null;

                          // Determine reproductive status
                          let statusText = reproStatus?.status || 'Open';
                          let statusColor = 'bg-purple-100 text-purple-800';

                          if (statusText === 'Pregnant' || statusText === 'Confirmed') {
                            statusColor = 'bg-green-100 text-green-800';
                          } else if (statusText === 'Bred' || statusText === 'Inseminated') {
                            statusColor = 'bg-blue-100 text-blue-800';
                          } else if (statusText === 'Heat' || statusText === 'Estrus') {
                            statusColor = 'bg-orange-100 text-orange-800';
                          }

                          return (
                          <tr
                            key={cow.id}
                            className="hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                            onClick={() => openCowProfile(cow, 'breeding')}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{cow.tagNumber}</span>
                                <span className="text-sm text-gray-500">{cow.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {cow.breed}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                cow.status === 'Active' ? 'bg-green-100 text-green-800' :
                                cow.status === 'Dry' ? 'bg-blue-100 text-blue-800' :
                                cow.status === 'Heifer' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {cow.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lastEvent ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{lastEvent.event_type}</span>
                                  <span className="text-xs text-gray-400">{new Date(lastEvent.date).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">No events</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {daysSinceEvent !== null ? (
                                <span className={`font-medium ${
                                  daysSinceEvent > 45 ? 'text-red-600' :
                                  daysSinceEvent > 30 ? 'text-orange-600' :
                                  'text-gray-900'
                                }`}>
                                  {daysSinceEvent} days
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCowProfile(cow, 'breeding');
                                }}
                                className="text-purple-600 hover:text-purple-900 mr-3"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddCowModal 
          onClose={toggleAddModal} 
          onAdd={handleAddCow}
        />
      )}

      {isEditModalOpen && (
        <EditCowModal 
          cow={cowToEdit} 
          onClose={toggleEditModal} 
          onEdit={handleEditCow}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal 
          cow={cowToDelete} 
          onClose={toggleDeleteModal} 
          onDelete={handleDeleteCow}
        />
      )}

      {isRecordHealthEventModalOpen && (
        <RecordHealthEventModal 
          cow={selectedCow} 
          onClose={toggleRecordHealthEventModal} 
          onSubmit={(id, record) => handleRecordHealthEvent(id, record)}
        />
      )}
      
      {isRecordMilkModalOpen && (
        <RecordMilkProductionModal 
          cow={selectedCow} 
          onClose={toggleRecordMilkModal} 
          onSubmit={(id,record) => handleRecordMilkProduction(id, record)}
        />
      )}

      {isRecordBreedingEventModalOpen && (
        <RecordBreedingEventModal
          cow={selectedCow}
          onClose={toggleRecordBreedingEventModal}
          onSubmit={(id,record) => handleRecordBreedingEvent(id, record)}
        />
      )}

      {isViewBreedingEventModalOpen && selectedBreedingEvent && (
        <ViewBreedingEventModal
          event={selectedBreedingEvent}
          cow={selectedCow}
          onClose={closeViewBreedingEventModal}
        />
      )}
      
      {isRecordGrowthMilestoneModalOpen && (
        <RecordGrowthMilestoneModal 
          cow={selectedCow} 
          onClose={toggleRecordGrowthMilestoneModal} 
          onSubmit={(id,record) => handleRecordGrowthMilestone(id, record)}
        />
      )}

      {/* QR Code Modals */}
      {showQRCode && selectedCowForQR && (
        <CowQRCode 
          cow={selectedCowForQR} 
          onClose={handleCloseQRCode}
        />
      )}

      {showQRScanner && (
        <QRScanner 
          onScan={handleQRScan}
          onClose={handleCloseQRScanner}
          onError={(error) => {
            toast.error(`Scanner error: ${error.message}`);
          }}
        />
      )}

      {showQuickRecordModal && selectedCow && (
        <QuickRecordModal 
          cow={selectedCow}
          onClose={handleCloseQuickRecord}
          onRecord={handleQuickRecord}
        />
      )}
    </div>
  );
};

// Cow Card Component
const CowCard = ({ cow, onClick, onEdit, onDelete, checkCowMilkingStatus, hasPermission, onShowQRCode }) => {
  // Calculate average daily milk production from recent records
  const getLatestMilkProduction = () => {
    if (!cow?.milkProduction || cow.milkProduction.length === 0) {
      return '0L/day';
    }

    // Get today's date and yesterday's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Group records by date and calculate daily totals
    const dailyTotals = cow.milkProduction.reduce((acc, record) => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + parseFloat(record.amount || 0);
      return acc;
    }, {});

    // Get the latest daily total (today or yesterday)
    let dailyTotal = 0;
    if (dailyTotals[todayStr]) {
      dailyTotal = dailyTotals[todayStr];
    } else if (dailyTotals[yesterdayStr]) {
      dailyTotal = dailyTotals[yesterdayStr];
    }

    // Format to 1 decimal place
    return `${dailyTotal.toFixed(1)}L/day`;
  };

  // Safe method to get last health check date
  const getLastHealthCheckDate = () => {
    if (cow?.lastHealthCheck) {
      const date = new Date(cow.lastHealthCheck);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'No data';
  };

  // Ensure alerts is always an array and filter out empty/null values
  const alerts = Array.isArray(cow?.alerts)
    ? cow.alerts.filter(alert => alert && alert.trim && alert.trim() !== '')
    : (cow?.alerts && cow?.alerts.trim && cow?.alerts.trim() !== '' ? [cow.alerts] : []);

  // Get milking status for today using the shared function from the parent component
  const milkingStatus = checkCowMilkingStatus(cow);

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onClick={onClick}
    >
      {/* Add color bar at top based on health status */}
      <div className={`h-2 bg-gradient-to-r ${
        cow?.healthStatus === 'Completed' ? 'from-green-500 to-green-500' :
        cow?.healthStatus === 'Monitored' ? 'from-yellow-500 to-yellow-400' :
        cow?.healthStatus === 'In progress' ? 'from-red-500 to-red-400' :
        'from-gray-500 to-gray-400'
      }`}></div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="mb-3 max-w-[70%]">
            <h3 className="text-lg font-semibold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 truncate">{cow?.name}</h3>
            <p className="text-sm text-gray-500 truncate">Tag: {cow?.tagNumber}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${healthStatusColors[cow?.healthStatus] || 'bg-gray-100 text-gray-800'}`}>
            {cow?.healthStatus}
          </span>
        </div>
        
        <div className="flex items-center mb-4">
          <img
            src={cow?.image || cow?.photo || cowSample}
            alt={cow?.name}
            className="w-16 h-16 object-cover rounded-full bg-gray-200 border-2 border-green-100 flex-shrink-0"
            onError={(e) => { e.target.src = cowSample; }}
          />
          <div className="ml-4 min-w-0">
            <p className="text-sm text-gray-600 truncate">{cow?.breed}</p>
            <p className="text-sm text-gray-600">{cow?.age}</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-600 min-w-0">
              <Droplet size={16} className="mr-1 flex-shrink-0" />
              <span className="truncate">{getLatestMilkProduction()}</span>
            </div>
            <div className="flex items-center text-gray-500 min-w-0 ml-2">
              <Calendar size={16} className="mr-1 flex-shrink-0" />
              <span className="truncate">Last: {getLastHealthCheckDate()}</span>
            </div>
          </div>
          
          {/* Daily Milking Status Indicator */}
          {milkingStatus && cow?.status !== 'Calf' && cow?.status !== 'Heifer' && cow?.status !== 'Dry' && (
            <div className={`mt-2 flex items-center text-sm rounded-md px-2 py-1 ${
              milkingStatus.milked 
                ? milkingStatus.shift === 'Morning'
                  ? 'bg-blue-50 text-blue-700' 
                  : milkingStatus.shift === 'Evening'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                milkingStatus.milked 
                  ? milkingStatus.shift === 'Morning'
                    ? 'bg-blue-500'
                    : milkingStatus.shift === 'Evening'
                      ? 'bg-purple-500'
                      : 'bg-green-500'
                  : 'bg-red-500'
              }`}></div>
              <span className="truncate font-medium">
                {milkingStatus.milked 
                  ? `Milked today (${milkingStatus.shift})` 
                  : 'Not milked today'}
              </span>
            </div>
          )}
          
          {alerts.length > 0 && (
            <div className="mt-2 flex items-start text-amber-600 text-sm">
              <svg className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="line-clamp-1">{alerts[0]}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-2 border-t flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          <button 
            className="p-1 text-purple-600 hover:text-purple-900 transition-colors duration-200 hover:bg-purple-50 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onShowQRCode(cow);
            }}
            title="Generate QR Code"
          >
            <QrCode size={16} />
          </button>
          {hasPermission('cow:update') && (
            <button 
              className="p-1 text-blue-600 hover:text-blue-900 transition-colors duration-200 hover:bg-blue-50 rounded-full"
              onClick={onEdit}
            >
              <Edit size={16} />
            </button>
          )}
          {hasPermission('cow:delete') && (
            <button 
              className="p-1 text-red-600 hover:text-red-900 transition-colors duration-200 hover:bg-red-50 rounded-full"
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Employee Profile Component
const CowProfile = ({ cow, onClose, onEdit, onRecordHealthEvent, toggleRecordMilkModal, toggleRecordBreedingEventModal, toggleRecordGrowthMilestoneModal, hasPermission, viewBreedingEvent, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [healthHistory, setHealthHistory] = useState([]);
  const [breedingEvents, setBreedingEvents] = useState([]);
  const [reproductiveStatus, setReproductiveStatus] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [growthMilestones, setGrowthMilestones] = useState([]);
  const [scheduledMilestone, setScheduledMilestone] = useState(null);
  const [milkDateRange, setMilkDateRange] = useState('7days'); // New state for milk production date range
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState({
    health: false,
    breeding: false,
    reproductive: false,
    activity: false,
    growth: false
  });
  const [error, setError] = useState(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  
  // Determine if cow is a calf based on age and status
  const isCalf = cow.status === 'Calf' || (cow.age && parseInt(cow.age) < 1);
  const isHeifer = cow.status === 'Heifer';
  
  // Safely check for milkProduction array and ensure it has data
  const hasMilkProductionData = cow?.milkProduction && Array.isArray(cow.milkProduction) && cow.milkProduction.length > 0;

  // Helper function to get date range based on selection
  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate;

    switch (milkDateRange) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '6months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate)
          };
        }
        // Fallback to 7 days if custom dates not set
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    return { start: startDate, end: now };
  };

  // Calculate daily totals and averages for the selected date range
  const calculateDailyStats = () => {
    if (!hasMilkProductionData) return { average: 0, highest: 0, latest: 0 };

    // Get records from selected date range
    const dateRange = getDateRangeFilter();
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    
    // Group by date and sum up both morning and evening production
    const dailyTotals = cow.milkProduction
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      })
      .reduce((acc, record) => {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        acc[dateStr] = (acc[dateStr] || 0) + (parseFloat(record.amount) || 0);
        return acc;
      }, {});
    
    // Convert to array of daily totals sorted by date
    const dailyAmounts = Object.entries(dailyTotals)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([_, amount]) => amount);
    
    return {
      average: dailyAmounts.length > 0 ? 
        parseFloat((dailyAmounts.reduce((sum, amount) => sum + amount, 0) / dailyAmounts.length).toFixed(1)) : 0,
      highest: dailyAmounts.length > 0 ? 
        parseFloat(Math.max(...dailyAmounts).toFixed(1)) : 0,
      latest: dailyAmounts.length > 0 ? 
        parseFloat(dailyAmounts[0].toFixed(1)) : 0
    };
  };
  
  const { average: avgMilkProduction, highest: highestMilkProduction, latest: latestMilkProduction } = calculateDailyStats();
  
  // Ensure alerts is always treated as an array
  const alerts = Array.isArray(cow.alerts) ? cow.alerts : 
                (cow.alerts ? [cow.alerts] : []);

  // Format date with safety check
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return 'Invalid Date';
    }
  };
  
  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return 'Unknown date';
    }
  };
  
  // Fetch health history when tab changes to health or when cow changes
  useEffect(() => {
    if (activeTab === 'health' && cow && cow.id) {
      loadHealthHistory();
    }
  }, [activeTab, cow?.id, cow?.lastHealthCheck]); // Added cow.lastHealthCheck to trigger reload

  const loadHealthHistory = async () => {
    if (!cow?.id) return;
    
    setLoading(prevState => ({ ...prevState, health: true }));
    try {
      const { data, error } = await supabase
        .from('health_events')
        .select('*')
        .eq('cow_id', cow.id)
        .order('event_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching health history:', error);
        setError(error.message);
      } else {
        // Transform data to match component structure
        const formattedData = data.map(record => ({
          id: record.id,
          eventDate: record.event_date,
          eventType: record.event_type,
          description: record.description,
          performedBy: record.performed_by,
          medications: record.medications || [],
          notes: record.notes,
          followUp: record.follow_up,
          status: record.status
        }));
        
        setHealthHistory(formattedData);
      }
    } catch (error) {
      console.error('Error in health history fetch:', error);
      setError(error.message);
    } finally {
      setLoading(prevState => ({ ...prevState, health: false }));
    }
  };
  
  // Fetch breeding events when tab changes to breeding
  useEffect(() => {
    if (activeTab === 'breeding' && cow && cow.id) {
      const loadBreedingData = async () => {
        try {
          setLoading(prev => ({ ...prev, breeding: true, reproductive: true }));
          
          // Fetch breeding events
          const eventsData = await fetchBreedingEvents(cow.id);
          setBreedingEvents(eventsData);
          
          // Fetch reproductive status
          const statusData = await fetchReproductiveStatus(cow.id);
          setReproductiveStatus(statusData);
        } catch (error) {
          console.error('Failed to load breeding data:', error);
        } finally {
          setLoading(prev => ({ ...prev, breeding: false, reproductive: false }));
        }
      };
      
      loadBreedingData();
    }
  }, [activeTab, cow]);
  
  // Fetch recent activities when tab changes to overview or when cow data updates
  useEffect(() => {
    if (activeTab === 'overview' && cow && cow.id) {
      const loadRecentActivities = async () => {
        try {
          setLoading(prev => ({ ...prev, activity: true }));
          const data = await fetchRecentActivity(cow.id);
          setRecentActivities(data);
        } catch (error) {
          console.error('Failed to load recent activities:', error);
        } finally {
          setLoading(prev => ({ ...prev, activity: false }));
        }
      };
      
      loadRecentActivities();
    }
  }, [activeTab, cow?.id, cow?.lastHealthCheck]); // Reload when cow updates

  // Fetch growth milestones when tab changes to growth or when cow weight updates
  useEffect(() => {
    if (activeTab === 'growth' && cow && cow.id && (isCalf || isHeifer)) {
      loadGrowthMilestones();
    }
  }, [activeTab, cow?.id, cow?.currentWeight, isCalf, isHeifer]); // Reload when weight changes

  const loadGrowthMilestones = async () => {
    if (!cow?.id) return;
    
    setLoading(prevState => ({ ...prevState, growth: true }));
    try {
      const data = await fetchGrowthMilestones(cow.id);
      setGrowthMilestones(data);
      
      // If we have growth data from the milestones but it's not in the cow object, update it
      if (data.length > 1) {
        const latestMilestone = data[data.length - 1];
        // Update both current weight and growth rate from real milestone data
        if ((latestMilestone.weight && latestMilestone.weight !== cow.currentWeight) ||
            (latestMilestone.growthRate && latestMilestone.growthRate !== cow.growthRate)) {
          
          const updatedCow = {
            ...cow,
            currentWeight: latestMilestone.weight || cow.currentWeight,
            growthRate: latestMilestone.growthRate || cow.growthRate
          };
          
          // Update the cow data
          onEdit(updatedCow);
        }
      }
    } catch (error) {
      console.error('Error fetching growth milestones:', error);
      setError(error.message);
    } finally {
      setLoading(prevState => ({ ...prevState, growth: false }));
    }
  };

  // Handle recording a new growth milestone
  const handleRecordGrowthMilestone = () => {
    toggleRecordGrowthMilestoneModal();
  };

  // Handle scheduling a new growth milestone
  const handleScheduleMilestone = (milestoneData) => {
    setScheduledMilestone(milestoneData);
    
    // In a real application, this would store the reminder in a database
    console.log('Scheduled next milestone check:', milestoneData);
    
    // Add an alert to the cow's profile
    const updatedCow = {
      ...cow,
      alerts: [...(cow.alerts || []), `Growth check scheduled for ${milestoneData.formattedDate}`]
    };
    
    // Update the cow data
    onEdit(updatedCow);
    
    toast.success(`Growth milestone check scheduled for ${milestoneData.formattedDate}`);
  };

  const toggleTransitionModal = () => {
    setShowTransitionModal(!showTransitionModal);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 min-h-full">
      {/* Header bar with gradient */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold truncate">
              {cow.name}
              {isCalf && <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-sm">Calf</span>}
              {isHeifer && <span className="ml-2 px-2 py-0.5 bg-pink-200 text-pink-800 rounded-full text-sm">Heifer</span>}
            </h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 mb-8 lg:mb-0 lg:pr-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="p-6 flex flex-col items-center">
                <div className="h-1 w-full bg-gradient-to-r from-green-400 to-blue-500 absolute top-0 left-0"></div>
                <img
                  src={cow.image || cow.photo || cowSample}
                  alt={cow.name}
                  className="w-32 h-32 object-cover rounded-full bg-gray-200 mb-4 border-4 border-green-100 shadow-md"
                  onError={(e) => { e.target.src = cowSample; }}
                />
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">{cow.name}</h2>
                <p className="text-gray-500">Tag: {cow.tagNumber}</p>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span className="text-gray-800 font-medium">{cow.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="text-gray-800 font-medium">{formatDate(cow.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="text-gray-800 font-medium">{cow.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[cow.status] || 'bg-gray-100 text-gray-800'}`}>
                      {cow.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span className="text-gray-800 font-medium">{cow.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${healthStatusColors[cow.healthStatus]}`}>
                      {cow.healthStatus}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 w-full flex flex-col space-y-2">
                  {hasPermission('cow:update') && (
                    <button 
                      onClick={onEdit}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20"
                    >
                      Edit Details
                    </button>
                  )}
                  {hasPermission('health:create') && (
                    <button 
                      onClick={onRecordHealthEvent}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20"
                    >
                      Record Health Event
                    </button>
                  )}
                  
                  {/* Add transition button for calves/heifers */}
                  {(isCalf || isHeifer) && hasPermission('cow:update') && (
                    <button 
                      onClick={toggleTransitionModal}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 hover:shadow-md hover:shadow-purple-500/20"
                    >
                      {isCalf ? "Transition to Heifer" : "Transition to Milking"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Alerts section */}
            {alerts.length > 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <h3 className="text-amber-800 font-medium flex items-center">
                  <svg className="h-5 w-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Alerts
                </h3>
                <ul className="mt-2 space-y-2">
                  {alerts.map((alert, index) => (
                    <li key={index} className="text-amber-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Main content area with tabs */}
          <div className="lg:w-2/3">
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex -mb-px space-x-4 px-6 whitespace-nowrap">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'overview'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  {/* Show milk tab only for adults */}
                  {!isCalf && !isHeifer && (
                    <button
                      onClick={() => setActiveTab('milk')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTab === 'milk'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Milk Production
                    </button>
                  )}
                  {/* Show growth tab for calves */}
                  {(isCalf || isHeifer) && (
                    <button
                      onClick={() => setActiveTab('growth')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTab === 'growth'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Growth
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('health')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'health'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Health Records
                  </button>
                  {/* Show breeding tab only for heifers and adults */}
                  {!isCalf && (
                    <button
                      onClick={() => setActiveTab('breeding')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTab === 'breeding'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Breeding
                    </button>
                  )}
                </nav>
              </div>
              
              <div className="py-6 px-4 sm:px-6 overflow-x-auto">
                {activeTab === 'overview' && (
                  <div>
                    {/* Customized metrics based on cow status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* For calves, show growth metrics */}
                      {(isCalf || isHeifer) ? (
                        <>
                          <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Current Weight</p>
                                <p className="text-2xl font-semibold text-gray-800 mt-1">
                                  {cow.currentWeight || cow.initialWeight || '0.0'} kg
                                </p>
                              </div>
                              <div className="p-2 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                              </div>
                            </div>
                            <div className="mt-4 text-xs flex items-center">
                              {cow.currentWeight && cow.initialWeight && parseFloat(cow.currentWeight) > parseFloat(cow.initialWeight) ? (
                                <>
                                  <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  <span className="text-green-600">Growing steadily</span>
                                </>
                              ) : cow.currentWeight && cow.initialWeight && parseFloat(cow.currentWeight) < parseFloat(cow.initialWeight) ? (
                                <>
                                  <svg className="w-4 h-4 mr-1 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                  <span className="text-red-600">Weight loss detected</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                  </svg>
                                  <span className="text-gray-500">No change detected</span>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        // For milking cows, show milk production metrics
                        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Daily Milk Production</p>
                              <p className="text-2xl font-semibold text-gray-800 mt-1">
                                {!isNaN(avgMilkProduction) ? avgMilkProduction.toFixed(1) : '0.0'}L/day
                              </p>
                            </div>
                            <div className="p-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600">
                              <Droplet className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-4 text-xs text-gray-600 flex flex-col">
                            <span className="flex items-center mb-1">
                              <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span>Highest: {highestMilkProduction.toFixed(1)}L/day</span>
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span>Latest: {latestMilkProduction.toFixed(1)}L/day</span>
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Health check info - common to all */}
                      <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Health Check</p>
                            <p className="text-2xl font-semibold text-gray-800 mt-1">{new Date(cow.lastHealthCheck).toLocaleDateString()}</p>
                          </div>
                          <div className="p-2 rounded-full bg-gradient-to-r from-red-50 to-red-100 text-red-600">
                            <Thermometer className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-600">
                          {cow.vaccinationStatus || 'Vaccinations up to date'}
                        </div>
                      </div>
                      
                      {/* Next action - customized by status */}
                      <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Next Action</p>
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                              {isCalf 
                                ? "Growth checkup" 
                                : isHeifer 
                                ? "Reproductive assessment"
                                : "Regular checkup"}
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600">
                            <Calendar className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-600">
                          Scheduled for {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Recent Activity</h3>
                      </div>
                      {loading.activity ? (
                        <div className="flex justify-center items-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                      ) : recentActivities.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {recentActivities.map((activity, index) => (
                            <ActivityItem 
                              key={index}
                              type={activity.type} 
                              description={activity.description} 
                              date={activity.date}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No recent activities found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tab content for Milk Production */}
                {activeTab === 'milk' && (
                  <div>
                    {/* Date Range Selector */}
                    <div className="bg-white shadow-md rounded-lg p-4 mb-6 border border-gray-200">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">View Period:</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setMilkDateRange('7days')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === '7days'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            7 Days
                          </button>
                          <button
                            onClick={() => setMilkDateRange('30days')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === '30days'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            30 Days
                          </button>
                          <button
                            onClick={() => setMilkDateRange('90days')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === '90days'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            90 Days
                          </button>
                          <button
                            onClick={() => setMilkDateRange('6months')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === '6months'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            6 Months
                          </button>
                          <button
                            onClick={() => setMilkDateRange('1year')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === '1year'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            1 Year
                          </button>
                          <button
                            onClick={() => setMilkDateRange('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === 'all'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            All Time
                          </button>
                          <button
                            onClick={() => setMilkDateRange('custom')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              milkDateRange === 'custom'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                      </div>

                      {/* Custom Date Range Inputs */}
                      {milkDateRange === 'custom' && (
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">From:</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">To:</label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Period Average</p>
                            <p className="text-2xl font-semibold text-gray-800 mt-1">
                              {avgMilkProduction.toFixed(1)}L
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Daily average for selected period</p>
                      </div>

                      <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Highest Production</p>
                            <p className="text-2xl font-semibold text-gray-800 mt-1">
                              {highestMilkProduction.toFixed(1)}L
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-gradient-to-r from-green-50 to-green-100 text-green-600">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Best daily total in period</p>
                      </div>

                      <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Latest Production</p>
                            <p className="text-2xl font-semibold text-gray-800 mt-1">
                              {latestMilkProduction.toFixed(1)}L
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600">
                            <Droplet className="h-5 w-5" />
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Most recent daily total</p>
                      </div>
                    </div>

                    {/* Milk Production Chart */}
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Daily Production Trend</h3>
                        <div className="text-sm text-gray-500">
                          {milkDateRange === '7days' && 'Last 7 Days'}
                          {milkDateRange === '30days' && 'Last 30 Days'}
                          {milkDateRange === '90days' && 'Last 90 Days'}
                          {milkDateRange === '6months' && 'Last 6 Months'}
                          {milkDateRange === '1year' && 'Last Year'}
                          {milkDateRange === 'all' && 'All Time'}
                          {milkDateRange === 'custom' && customStartDate && customEndDate && `${customStartDate} to ${customEndDate}`}
                          {milkDateRange === 'custom' && (!customStartDate || !customEndDate) && 'Custom Range (Select Dates)'}
                        </div>
                      </div>
                      <div className="h-64">
                        {hasMilkProductionData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={cow.milkProduction
                                .filter(record => {
                                  // Filter based on selected date range
                                  const recordDate = new Date(record.date);
                                  const dateRange = getDateRangeFilter();
                                  return recordDate >= dateRange.start && recordDate <= dateRange.end;
                                })
                                .reduce((acc, record) => {
                                  // Convert to date string for grouping
                                  const dateStr = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  
                                  // Find or create the accumulator entry
                                  const existingEntry = acc.find(entry => entry.date === dateStr);
                                  if (existingEntry) {
                                    // Add to existing date's total and update quality if needed
                                    existingEntry.amount += parseFloat(record.amount) || 0;
                                    if (record.quality === 'Premium' && existingEntry.quality !== 'Premium') {
                                      existingEntry.quality = 'Premium';
                                    }
                                  } else {
                                    // Create new entry for this date
                                    acc.push({
                                      date: dateStr,
                                      amount: parseFloat(record.amount) || 0,
                                      quality: record.quality || 'Standard'
                                    });
                                  }
                                  return acc;
                                }, [])
                                .map(entry => ({
                                  ...entry,
                                  amount: parseFloat(entry.amount.toFixed(1)) // Round to 1 decimal place
                                }))
                                .sort((a, b) => new Date(a.date) - new Date(b.date)) // Ensure data is sorted by date
                              }
                              margin={{ top: 5, right: 30, left: 20, bottom: 15 }}
                            >
                              <defs>
                                <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                              <XAxis 
                                dataKey="date" 
                                stroke="#9CA3AF" 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                              />
                              <YAxis 
                                stroke="#9CA3AF" 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                tickFormatter={(value) => `${value}L`}
                                domain={['dataMin - 1', 'dataMax + 2']}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                  border: '1px solid #EEE',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => [`${value}L/day`, 'Daily Total']}
                                labelFormatter={(label) => `Date: ${label}`}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="amount"
                                name="Daily Total"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fill="url(#milkGradient)"
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#3B82F6' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="amount"
                                name="Milk Production"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={{ 
                                  r: 4, 
                                  strokeWidth: 2, 
                                  stroke: '#3B82F6', 
                                  fill: 'white'
                                }}
                                activeDot={{ 
                                  r: 8, 
                                  strokeWidth: 0, 
                                  fill: '#3B82F6' 
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">No milk production data available</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Production Statistics - Update to reflect 7-day stats
                      {hasMilkProductionData && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200">
                            <p className="text-xs text-gray-500">7-Day Average</p>
                            <p className="text-lg font-bold text-blue-600">
                              {(cow.milkProduction.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0) / cow.milkProduction.length).toFixed(1)}L
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-green-50 to-green-100 border border-green-200">
                            <p className="text-xs text-gray-500">Highest</p>
                            <p className="text-lg font-bold text-green-600">
                              {Math.max(...cow.milkProduction.map(record => parseFloat(record.amount) || 0)).toFixed(1)}L
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-purple-50 to-purple-100 border border-purple-200">
                            <p className="text-xs text-gray-500">Latest</p>
                            <p className="text-lg font-bold text-purple-600">
                              {parseFloat(cow.milkProduction[0]?.amount || 0).toFixed(1)}L
                            </p>
                          </div>
                        </div>
                      )} */}
                    </div>
                    
                      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Production Records</h3>
                        {hasPermission('milk:create') && (
                          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
                          onClick={toggleRecordMilkModal}>
                            Record New
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount (L)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quality
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {hasMilkProductionData ? (
                            cow.milkProduction.map((record, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(record.date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {record.amount || 0} L
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {record.quality || 'Standard'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {record.notes || '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                No milk production records available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* New Growth & Development tab - shown only for calves and heifers */}
                {activeTab === 'growth' && (isCalf || isHeifer) && (
                  <div>
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600 mb-4">Growth Progress</h3>
                      <div className="h-64">
                        {/* Growth chart component */}
                        <GrowthChart milestones={growthMilestones} cowBreed={cow.breed} />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="text-center p-2 rounded-lg bg-gradient-to-b from-purple-50 to-purple-100 border border-purple-200">
                          <p className="text-xs text-gray-500">Birth Weight</p>
                          <p className="text-lg font-bold text-purple-600">
                            {cow.initialWeight || 'N/A'} kg
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Initial recording
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gradient-to-b from-green-50 to-green-100 border border-green-200">
                          <p className="text-xs text-gray-500">Current Weight</p>
                          <p className="text-lg font-bold text-green-600">
                            {cow.currentWeight || cow.initialWeight || 'N/A'} kg
                          </p>
                          {cow.currentWeight && cow.initialWeight && (
                            <p className="text-xs text-green-700 mt-1">
                              +{(cow.currentWeight - cow.initialWeight).toFixed(1)} kg total gain
                            </p>
                          )}
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200">
                          <p className="text-xs text-gray-500">Growth Rate</p>
                          <p className="text-lg font-bold text-blue-600">
                            {cow.growthRate || 'N/A'} kg/month
                          </p>
                          {growthMilestones && growthMilestones.length >= 2 && (
                            <div className="flex items-center justify-center text-xs mt-1">
                              <span className={cow.growthRate >= 0.7 ? "text-green-600" : "text-amber-600"}>
                                {cow.growthRate >= 0.7 ? "Healthy growth" : "Below target"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      <div className="lg:col-span-2">
                        <GrowthMilestoneSummary milestones={growthMilestones} cowBreed={cow.breed} />
                      </div>
                      <div>
                        <NextMilestoneReminder 
                          cow={cow} 
                          lastMilestone={growthMilestones && growthMilestones.length > 0 ? 
                            growthMilestones[growthMilestones.length - 1] : null} 
                          onSchedule={handleScheduleMilestone}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600">Development Milestones</h3>
                        {hasPermission('growth:create') && (
                          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 transition-opacity shadow-sm"
                          onClick={handleRecordGrowthMilestone}>
                            Record Milestone
                          </button>
                        )}
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-purple-50/40 via-gray-50 to-pink-50/30">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Milestone
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weight (kg)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {growthMilestones.length > 0 ? (
                            growthMilestones.map((milestone, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(milestone.date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {milestone.milestone}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {milestone.weight || 'N/A'} kg
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {milestone.notes || '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                No growth milestones recorded for this cow.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Tab content for Health */}
                {activeTab === 'health' && (
                  <div>
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Health Status</h3>
                        {hasPermission('health:create') && (
                          <button 
                            onClick={onRecordHealthEvent}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
                          >
                            Record Health Event
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Current Status</h4>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${healthStatusColors[cow.healthStatus]}`}>
                              {cow.healthStatus}
                            </span>
                          </div>
                          <p className="mt-4 text-sm text-gray-600">
                            Last health check: {formatDate(cow.lastHealthCheck)}
                          </p>
                          
                          <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Vaccination Status</h4>
                          <p className="text-sm text-gray-800">{cow.vaccinationStatus || 'Up to date'}</p>
                        </div>
                        
                        {/* <div className="border-l border-gray-200 pl-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Vital Signs (Last Check)</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Temperature:</span>
                              <span className="text-sm font-medium text-gray-800">38.5°C</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Heart Rate:</span>
                              <span className="text-sm font-medium text-gray-800">65 BPM</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Respiratory Rate:</span>
                              <span className="text-sm font-medium text-gray-800">22 breaths/min</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Weight:</span>
                              <span className="text-sm font-medium text-gray-800">580 kg</span>
                            </div>
                          </div>
                        </div> */}
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Health History</h3>
                      </div>
                      {loading.health ? (
                        <div className="flex justify-center items-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                      ) : healthHistory.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {healthHistory.map((record, index) => (
                            <HealthRecord 
                              key={record.id || index}
                              date={record.eventDate} 
                              type={record.eventType} 
                              description={record.description}
                              performedBy={record.performedBy}
                              medications={record.medications}
                              notes={record.notes}
                              followUp={record.followUp}
                              status={record.status}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No health records found for this cow.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tab content for Breeding */}
                {activeTab === 'breeding' && (
                <div>
                  <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-4">Breeding Information</h3>
                    <p className="text-gray-500 mb-4">Breeding history and reproductive information for {cow.name}.</p>
                    {loading.reproductive ? (
                      <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      </div>
                    ) : reproductiveStatus ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Reproductive Status</h4>
                          <p className="text-sm font-medium text-gray-800">{reproductiveStatus.status}</p>
                          
                          <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Last Heat</h4>
                          <p className="text-sm text-gray-800">
                            {reproductiveStatus.last_heat_date ? 
                              formatDate(reproductiveStatus.last_heat_date) : 'Not recorded'}
                          </p>
                          
                          <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Next Expected Heat</h4>
                          <p className="text-sm text-gray-800">
                            {reproductiveStatus.next_heat_date ? 
                              formatDate(reproductiveStatus.next_heat_date) : 'Not calculated'}
                          </p>
                        </div>
                        
                        <div className="border-l border-gray-200 pl-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Calving History</h4>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-800">
                              {reproductiveStatus.calving_count} previous calving{reproductiveStatus.calving_count !== 1 ? 's' : ''}
                            </div>
                            {reproductiveStatus.last_calving_date && (
                              <div className="text-sm text-gray-600">
                                Last calving: {formatDate(reproductiveStatus.last_calving_date)}
                              </div>
                            )}
                          </div>
                          
                          <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Breeding Plan</h4>
                          <p className="text-sm text-gray-800">{reproductiveStatus.breeding_plan || 'No breeding plan set'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        No reproductive information available for this cow.
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Breeding Events</h3>
                      {hasPermission('breeding:create') && (
                        <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        onClick={toggleRecordBreedingEventModal}>
                          Record New Event
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">  
                    {loading.breeding ? (
                      <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      </div>
                    ) : breedingEvents.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-green-50 to-blue-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Event Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Details
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Result
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Performed By
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {breedingEvents.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                <button
                                  onClick={() => viewBreedingEvent(event)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="View Details"
                                >
                                  View
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(event.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {event.event_type || event.eventType}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {event.details || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  event.result === 'Confirmed' || event.result === 'Positive' || event.result === 'Healthy' || event.result === 'Completed' || event.result === 'Successful' ?
                                    'bg-green-100 text-green-800' :
                                  event.result === 'Failed' || event.result === 'Negative' || event.result === 'Stillborn' || event.result === 'Unsuccessful' ?
                                    'bg-red-100 text-red-800' :
                                  event.result === 'Pending' ?
                                    'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.result || 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {event.performed_by || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={event.notes}>
                                {event.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        No breeding events recorded for this cow.
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Transition Modal */}
      {showTransitionModal && (
        <TransitionModal 
          cow={cow}
          isCalf={isCalf}
          onClose={toggleTransitionModal}
          onTransition={(data) => {
            onEdit({ ...cow, ...data }); // Update the cow with new status
            toggleTransitionModal();
          }}
        />
      )}
    </div>
  );
};

const TransitionModal = ({ cow, isCalf, onClose, onTransition }) => {
  const [formData, setFormData] = useState({
    status: isCalf ? 'Heifer' : 'Active',
    transitionDate: new Date().toISOString().split('T')[0],
    currentWeight: cow.currentWeight || cow.initialWeight || '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when it's changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.transitionDate) {
      newErrors.transitionDate = 'Transition date is required';
    }
    
    if (!formData.currentWeight) {
      newErrors.currentWeight = 'Current weight is required';
    } else if (isNaN(formData.currentWeight) || parseFloat(formData.currentWeight) <= 0) {
      newErrors.currentWeight = 'Please enter a valid weight';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Don't submit if validation fails
    }
    
    // Prepare data for transition
    const transitionData = {
      status: formData.status,
      currentWeight: parseFloat(formData.currentWeight),
      transitionDate: formData.transitionDate,
      notes: formData.notes || null,
      alerts: [...(cow.alerts || []), isCalf ? 'Transitioned to heifer' : 'Transitioned to milking cow']
    };
    
    onTransition(transitionData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto my-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 break-words">
            {isCalf ? "Transition to Heifer" : "Transition to Milking"}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <label htmlFor="transitionDate" className="block text-sm font-medium text-gray-700 mb-1">
                Transition Date *
              </label>
              <input
                type="date"
                id="transitionDate"
                name="transitionDate"
                value={formData.transitionDate}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.transitionDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300`}
              />
              {errors.transitionDate && (
                <p className="mt-1 text-xs text-red-500">{errors.transitionDate}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="currentWeight" className="block text-sm font-medium text-gray-700 mb-1">
                Current Weight (kg) *
              </label>
              <input
                type="number"
                id="currentWeight"
                name="currentWeight"
                value={formData.currentWeight}
                onChange={handleChange}
                step="0.1"
                className={`block w-full px-3 py-2 border ${errors.currentWeight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300`}
              />
              {errors.currentWeight && (
                <p className="mt-1 text-xs text-red-500">{errors.currentWeight}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                New Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
              >
                {isCalf ? (
                  <option value="Heifer">Heifer</option>
                ) : (
                  <option value="Active">Active (Milking)</option>
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                placeholder="Add any notes about this transition..."
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isCalf ? "Transition to Heifer" : "Transition to Milking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Activity Item Component for Profile
const ActivityItem = ({ type, description, date }) => {
  const getIcon = () => {
    switch (type) {
      case 'health':
        return <Thermometer size={16} className="text-red-600" />;
      case 'milk':
        return <Droplet size={16} className="text-blue-600" />;
      case 'breeding':
        return <Calendar size={16} className="text-purple-600" />;
      default:
        return <Calendar size={16} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="px-6 py-4 flex items-start hover:bg-gray-50 transition-colors duration-200">
      <div className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full mr-4 mt-1 shadow-sm">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-gray-800">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
};

// Health Record Component
const HealthRecord = ({ date, type, description, performedBy, medications, notes, followUp, status }) => {
  const medicationsList = Array.isArray(medications) ? medications : [];
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-800 font-medium">{type}</p>
            <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
              status === 'Completed' ? 'bg-green-100 text-green-800' :
              status === 'In progress' ? 'bg-amber-100 text-amber-800' :
              status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          
          {medicationsList.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-600">Medications:</p>
              <ul className="mt-1 space-y-1">
                {medications.map((med, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {med.name} ({med.dosage} - {med.method})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {notes && (
            <p className="text-xs text-gray-500 mt-2 italic">"{notes}"</p>
          )}
          
          {followUp && (
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <Calendar size={12} className="mr-1" />
              Follow-up: {formatDate(followUp)}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">Performed by: {performedBy}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{formatDate(date)}</p>
        </div>
      </div>
    </div>
  );
};


// Add Cow Modal Component
const AddCowModal = ({ onClose, onAdd }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    breed: 'Holstein',
    dateOfBirth: '',
    status: 'Calf', // Default to Calf when birthdate is recent
    healthStatus: 'Healthy',
    owner: '',
    purchaseDate: '',
    purchasePrice: '',
    initialWeight: '',
    currentWeight: '',
    notes: '',
    photo: null,
    // Calf-specific fields
    mother: '',
    father: '',
    birthType: 'Single' // Single, Twin, etc.
  });
  const [errors, setErrors] = useState({});
  const [availableBreeds, setAvailableBreeds] = useState([]);
  const [showCustomBreedInput, setShowCustomBreedInput] = useState(false);
  const [customBreed, setCustomBreed] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  // Load available breeds from database
  useEffect(() => {
    const loadBreeds = async () => {
      try {
        const { data, error } = await supabase
          .from('breeds')
          .select('name')
          .order('name');

        if (error) throw error;

        // Set default breeds if table is empty
        if (!data || data.length === 0) {
          setAvailableBreeds([
            'Holstein', 'Jersey', 'Brown Swiss', 'Ayrshire', 'Guernsey',
            'Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar'
          ]);
        } else {
          setAvailableBreeds(data.map(b => b.name));
        }
      } catch (error) {
        console.error('Error loading breeds:', error);
        // Fallback to default breeds
        setAvailableBreeds([
          'Holstein', 'Jersey', 'Brown Swiss', 'Ayrshire', 'Guernsey',
          'Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar'
        ]);
      }
    };

    loadBreeds();
  }, []);

  // Handle breed change
  const handleBreedChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomBreedInput(true);
      setFormData({ ...formData, breed: '' });
    } else {
      setShowCustomBreedInput(false);
      setFormData({ ...formData, breed: value });
    }
  };

  // Save custom breed to database
  const saveCustomBreed = async (breedName) => {
    try {
      const { data, error } = await supabase
        .from('breeds')
        .insert({ name: breedName })
        .select();

      if (error) {
        console.error('Error saving custom breed:', error);
        toast.error(`Failed to save breed to database: ${error.message}`);
        return;
      }

      // Add to available breeds list
      setAvailableBreeds(prev => [...prev, breedName].sort());
      toast.success(`Breed "${breedName}" added successfully!`);
    } catch (error) {
      console.error('Error saving custom breed:', error);
      toast.error('Failed to save custom breed, but will be used for this cow');
    }
  };

  // Handle custom breed submission
  const handleCustomBreedSubmit = () => {
    if (customBreed.trim()) {
      const trimmedBreed = customBreed.trim();
      setFormData({ ...formData, breed: trimmedBreed });
      saveCustomBreed(trimmedBreed);
      setShowCustomBreedInput(false);
      setCustomBreed('');
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field when it's changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Validate form data for current step
  const validateCurrentStep = () => {
    const newErrors = {};
    
    // Validation for step 1
    if (currentStep === 1) {
      if (!formData.tagNumber.trim()) {
        newErrors.tagNumber = 'Tag number is required';
      } else if (!/^[A-Za-z0-9-]+$/.test(formData.tagNumber.trim())) {
        newErrors.tagNumber = 'Tag number can only contain letters, numbers and hyphens';
      }
      
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      } else {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        if (birthDate > today) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
      }
      
      if (!formData.owner.trim()) {
        newErrors.owner = 'Owner is required';
      }
    }
    
    // Validation for step 2
    if (currentStep === 2) {
      if (formData.purchaseDate) {
        const purchaseDate = new Date(formData.purchaseDate);
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        
        if (purchaseDate < birthDate) {
          newErrors.purchaseDate = 'Purchase date cannot be before birth date';
        }
        
        if (purchaseDate > today) {
          newErrors.purchaseDate = 'Purchase date cannot be in the future';
        }
      }
      
      if (formData.purchasePrice && isNaN(formData.purchasePrice)) {
        newErrors.purchasePrice = 'Purchase price must be a number';
      }
      
      if (formData.initialWeight) {
        if (isNaN(formData.initialWeight)) {
          newErrors.initialWeight = 'Weight must be a number';
        } else if (parseFloat(formData.initialWeight) <= 0) {
          newErrors.initialWeight = 'Weight must be greater than 0';
        }
      }
      
      if (formData.currentWeight) {
        if (isNaN(formData.currentWeight)) {
          newErrors.currentWeight = 'Weight must be a number';
        } else if (parseFloat(formData.currentWeight) <= 0) {
          newErrors.currentWeight = 'Weight must be greater than 0';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Final validation before submission
    if (!validateCurrentStep()) {
      return;
    }

    let imageUrl = '/api/placeholder/160/160';

    // Upload image if provided
    if (formData.photo) {
      try {
        const fileExt = formData.photo.name.split('.').pop();
        const fileName = `${formData.tagNumber}_${Date.now()}.${fileExt}`;
        const filePath = fileName; // Don't use subfolder, just filename

        console.log('Uploading image:', { fileName, filePath, fileType: formData.photo.type });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cow-images')
          .upload(filePath, formData.photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error(`Image upload failed: ${uploadError.message}`);
        } else {
          console.log('Upload successful:', uploadData);
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('cow-images')
            .getPublicUrl(filePath);

          if (urlData && urlData.publicUrl) {
            imageUrl = urlData.publicUrl;
            console.log('Image URL:', imageUrl);
            toast.success('Image uploaded successfully!');
          }
        }
      } catch (error) {
        console.error('Error handling image upload:', error);
        toast.error(`Failed to upload image: ${error.message}`);
      }
    }

    // Create a new cow object
    const newCow = {
      tagNumber: formData.tagNumber,
      name: formData.name,
      breed: formData.breed,
      dateOfBirth: formData.dateOfBirth,
      age: calculateAge(formData.dateOfBirth),
      status: formData.status,
      owner: formData.owner,
      healthStatus: formData.healthStatus,
      milkProduction: [
        { date: new Date().toISOString().split('T')[0], amount: 0 }
      ],
      lastHealthCheck: new Date().toISOString().split('T')[0],
      vaccinationStatus: 'Up to date',
      alerts: [], // Initialize with empty array
      image: imageUrl,
      photo: imageUrl, // Also set photo field for compatibility
      notes: formData.notes,
      purchaseDate: formData.purchaseDate || null,
      purchasePrice: formData.purchasePrice || null,
      initialWeight: formData.initialWeight || null,
      currentWeight: formData.currentWeight || formData.initialWeight || null,
      mother: formData.mother || null,
      father: formData.father || null,
      birthType: formData.birthType || 'Single'
    };

    onAdd(newCow);
    onClose();
  };
  
  // Calculate age in years based on date of birth
  const calculateAge = (dateOfBirth) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years`;
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        photo: file
      });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Go to next step
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Go to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Add New Cow</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {/* Progress Steps */}
          <div className="px-6 pt-4 mb-8">
            <div className="flex items-center">
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 1 ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  1
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                  Basic Info
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 2 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 2 ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  2
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                  Additional Details
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 3 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 3 ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  3
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                  Review
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6 animate-fadeIn">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tagNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Number *
                    </label>
                    <input
                      type="text"
                      id="tagNumber"
                      name="tagNumber"
                      value={formData.tagNumber}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.tagNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    />
                    {errors.tagNumber && (
                      <p className="mt-1 text-xs text-red-500">{errors.tagNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                      Breed *
                    </label>
                    {!showCustomBreedInput ? (
                      <select
                        id="breed"
                        name="breed"
                        value={formData.breed}
                        onChange={handleBreedChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                      >
                        {availableBreeds.map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                        <option value="custom">+ Add Custom Breed</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customBreed}
                          onChange={(e) => setCustomBreed(e.target.value)}
                          placeholder="Enter breed name"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleCustomBreedSubmit()}
                        />
                        <button
                          type="button"
                          onClick={handleCustomBreedSubmit}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomBreedInput(false);
                            setCustomBreed('');
                            setFormData({ ...formData, breed: availableBreeds[0] || 'Holstein' });
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                      >
                      <option value="Calf">Calf</option>
                      <option value="Heifer">Heifer</option>
                      <option value="Active">Active</option>
                      <option value="Dry">Dry</option>
                      <option value="Sold">Sold</option>
                      <option value="Deceased">Deceased</option>
                    </select>
                  </div>
                  {formData.status === 'Calf' && (
                    <div className="space-y-6 mt-4">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="mother" className="block text-sm font-medium text-gray-700 mb-1">
                            Mother (Tag/Name)
                          </label>
                          <input
                            type="text"
                            id="mother"
                            name="mother"
                            value={formData.mother}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="father" className="block text-sm font-medium text-gray-700 mb-1">
                            Father (Tag/Name)
                          </label>
                          <input
                            type="text"
                            id="father"
                            name="father"
                            value={formData.father}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="birthType" className="block text-sm font-medium text-gray-700 mb-1">
                          Birth Type
                        </label>
                        <select
                          id="birthType"
                          name="birthType"
                          value={formData.birthType}
                          onChange={handleChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                        >
                          <option value="Single">Single</option>
                          <option value="Twin">Twin</option>
                          <option value="Triplet">Triplet</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div>
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
                      Owner *
                    </label>
                    <input
                      type="text"
                      id="owner"
                      name="owner"
                      value={formData.owner}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.owner ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    />
                    {errors.owner && (
                      <p className="mt-1 text-xs text-red-500">{errors.owner}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      Health Status *
                    </label>
                    <select
                      id="healthStatus"
                      name="healthStatus"
                      value={formData.healthStatus}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Monitored">Monitored</option>
                      <option value="Under treatment">Under treatment</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                    Photo
                  </label>
                  <div className="mt-1 flex items-center">
                    {formData.photo ? (
                      <div className="relative">
                        <img
                          src={imagePreview || URL.createObjectURL(formData.photo)}
                          alt="Cow"
                          className="h-24 w-24 object-cover rounded-md border-2 border-green-100 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({...formData, photo: null});
                            setImagePreview(null);
                          }}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 shadow-md transform transition-transform duration-300 hover:scale-110"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors duration-300">
                        <label htmlFor="file-upload" className="relative cursor-pointer">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="mt-2 block text-xs text-gray-600">
                              Upload
                            </span>
                          </div>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Additional Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      id="purchaseDate"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.purchaseDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    />
                    {errors.purchaseDate && (
                      <p className="mt-1 text-xs text-red-500">{errors.purchaseDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="purchasePrice"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        className={`block w-full pl-7 pr-12 py-2 border ${errors.purchasePrice ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    {errors.purchasePrice && (
                      <p className="mt-1 text-xs text-red-500">{errors.purchasePrice}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="initialWeight" className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="initialWeight"
                    name="initialWeight"
                    value={formData.initialWeight}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.initialWeight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    step="0.1"
                  />
                  {errors.initialWeight && (
                    <p className="mt-1 text-xs text-red-500">{errors.initialWeight}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="currentWeight" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="currentWeight"
                    name="currentWeight"
                    value={formData.currentWeight}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.currentWeight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    step="0.1"
                  />
                  {errors.currentWeight && (
                    <p className="mt-1 text-xs text-red-500">{errors.currentWeight}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    placeholder="Any additional information about this cow..."
                  ></textarea>
                </div>
              </div>
            )}
            
            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Review Information</h4>
                <p className="text-gray-600">Please review the information below before submitting.</p>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Tag Number</h5>
                      <p className="text-gray-800">{formData.tagNumber}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Name</h5>
                      <p className="text-gray-800">{formData.name}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Breed</h5>
                      <p className="text-gray-800">{formData.breed}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Date of Birth</h5>
                      <p className="text-gray-800">{formData.dateOfBirth}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Status</h5>
                      <p className="text-gray-800">{formData.status}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Owner</h5>
                      <p className="text-gray-800">{formData.owner}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Health Status</h5>
                      <p className="text-gray-800">{formData.healthStatus}</p>
                    </div>
                    {formData.purchaseDate && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Purchase Date</h5>
                        <p className="text-gray-800">{formData.purchaseDate}</p>
                      </div>
                    )}
                    {formData.purchasePrice && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Purchase Price</h5>
                        <p className="text-gray-800">₹{formData.purchasePrice}</p>
                      </div>
                    )}
                    {formData.initialWeight && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Initial Weight</h5>
                        <p className="text-gray-800">{formData.initialWeight} kg</p>
                      </div>
                    )}
                    {formData.currentWeight && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Current Weight</h5>
                        <p className="text-gray-800">{formData.currentWeight} kg</p>
                      </div>
                    )}
                    {formData.status === 'Calf' && formData.mother && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Mother</h5>
                        <p className="text-gray-800">{formData.mother}</p>
                      </div>
                    )}
                    {formData.status === 'Calf' && formData.father && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Father</h5>
                        <p className="text-gray-800">{formData.father}</p>
                      </div>
                    )}
                    {formData.status === 'Calf' && formData.birthType && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Birth Type</h5>
                        <p className="text-gray-800">{formData.birthType}</p>
                      </div>
                    )}
                  </div>

                  {formData.notes && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Notes</h5>
                      <p className="text-gray-800">{formData.notes}</p>
                    </div>
                  )}

                  {imagePreview && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Photo</h5>
                      <img
                        src={imagePreview}
                        alt="Cow Preview"
                        className="h-32 w-32 object-cover rounded-md mt-2 border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                >
                  Cancel
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                >
                  Add Cow
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// EditCowModal Component
const EditCowModal = ({ cow, onClose, onEdit }) => {
  const [formData, setFormData] = useState({
    id: cow.id || '',
    tagNumber: cow.tagNumber || '',
    name: cow.name || '',
    breed: cow.breed || 'Holstein',
    dateOfBirth: cow.dateOfBirth ? new Date(cow.dateOfBirth).toISOString().split('T')[0] : '',
    status: cow.status || 'Active',
    healthStatus: cow.healthStatus || 'Healthy',
    owner: cow.owner || '',
    lastHealthCheck: cow.lastHealthCheck ? new Date(cow.lastHealthCheck).toISOString().split('T')[0] : '',
    vaccinationStatus: cow.vaccinationStatus || 'Up to date',
    purchaseDate: cow.purchaseDate ? new Date(cow.purchaseDate).toISOString().split('T')[0] : '',
    purchasePrice: cow.purchasePrice || '',
    initialWeight: cow.initialWeight || '',
    currentWeight: cow.currentWeight || cow.initialWeight || '',
    notes: cow.notes || '',
    photo: cow.image && cow.image !== '/api/placeholder/160/160' ? cow.image : null,
    alerts: Array.isArray(cow.alerts) ? [...cow.alerts] : []
  });

  const [errors, setErrors] = useState({});
  const [availableBreeds, setAvailableBreeds] = useState([]);

  // Load available breeds from database
  useEffect(() => {
    const loadBreeds = async () => {
      try {
        const { data, error } = await supabase
          .from('breeds')
          .select('name')
          .order('name');

        if (error) throw error;

        const breedNames = data.map(b => b.name);
        setAvailableBreeds(breedNames);
      } catch (error) {
        console.error('Error loading breeds:', error);
        // Use default breeds if database fetch fails
        setAvailableBreeds(['Holstein', 'Jersey', 'Brown Swiss', 'Ayrshire', 'Guernsey', 'Gir', 'Sahiwal']);
      }
    };

    loadBreeds();
  }, []);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for this field when it's changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.tagNumber.trim()) {
      newErrors.tagNumber = 'Tag number is required';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.tagNumber.trim())) {
      newErrors.tagNumber = 'Tag number can only contain letters, numbers and hyphens';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    if (!formData.owner.trim()) {
      newErrors.owner = 'Owner is required';
    }
    
    // Validate purchase date if provided
    if (formData.purchaseDate) {
      const purchaseDate = new Date(formData.purchaseDate);
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      if (purchaseDate < birthDate) {
        newErrors.purchaseDate = 'Purchase date cannot be before birth date';
      }
      
      if (purchaseDate > today) {
        newErrors.purchaseDate = 'Purchase date cannot be in the future';
      }
    }
    
    // Validate numeric fields
    if (formData.purchasePrice && isNaN(formData.purchasePrice)) {
      newErrors.purchasePrice = 'Purchase price must be a number';
    }
    
    if (formData.initialWeight) {
      if (isNaN(formData.initialWeight)) {
        newErrors.initialWeight = 'Weight must be a number';
      } else if (parseFloat(formData.initialWeight) <= 0) {
        newErrors.initialWeight = 'Weight must be greater than 0';
      }
    }

    if (formData.currentWeight) {
      if (isNaN(formData.currentWeight)) {
        newErrors.currentWeight = 'Weight must be a number';
      } else if (parseFloat(formData.currentWeight) <= 0) {
        newErrors.currentWeight = 'Weight must be greater than 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop form submission if validation fails
    }
    
    // Create a clean copy of data to ensure it matches database schema
    const submissionData = {
      id: formData.id,
      tagNumber: formData.tagNumber,
      name: formData.name,
      breed: formData.breed,
      dateOfBirth: formData.dateOfBirth,
      status: formData.status,
      healthStatus: formData.healthStatus,
      owner: formData.owner,
      lastHealthCheck: formData.lastHealthCheck,
      vaccinationStatus: formData.vaccinationStatus,
      purchaseDate: formData.purchaseDate || null,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
      initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : null,
      currentWeight: formData.currentWeight ? parseFloat(formData.currentWeight) : (formData.initialWeight ? parseFloat(formData.initialWeight) : null),
      notes: formData.notes || null,
      photo: formData.photo,
      alerts: formData.alerts || []
    };
    
    console.log('Submitting updated cow data:', submissionData);
    
    // Pass the updated cow data to the parent component
    onEdit(submissionData);
    onClose();
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prevData => ({
        ...prevData,
        photo: e.target.files[0]
      }));
    }
  };
  
  // Get photo preview correctly for both File objects and URL strings
  const getPhotoPreview = () => {
    if (!formData.photo) return null;
    
    if (formData.photo instanceof File) {
      return URL.createObjectURL(formData.photo);
    }
    
    return formData.photo; // It's a URL string
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto my-8 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Edit Cow</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="px-6 py-4 space-y-6 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="tagNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Number *
                </label>
                <input
                  type="text"
                  id="tagNumber"
                  name="tagNumber"
                  value={formData.tagNumber}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.tagNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                />
                {errors.tagNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.tagNumber}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                  Breed *
                </label>
                <select
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                >
                  {availableBreeds.length > 0 ? (
                    availableBreeds.map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))
                  ) : (
                    <>
                      <option value="Holstein">Holstein</option>
                      <option value="Jersey">Jersey</option>
                      <option value="Brown Swiss">Brown Swiss</option>
                      <option value="Ayrshire">Ayrshire</option>
                      <option value="Guernsey">Guernsey</option>
                    </>
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  >
                  <option value="Calf">Calf</option>
                  <option value="Heifer">Heifer</option>
                  <option value="Active">Active</option>
                  <option value="Dry">Dry</option>
                  <option value="Sold">Sold</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
                  Owner *
                </label>
                <input
                  type="text"
                  id="owner"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.owner ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                />
                {errors.owner && (
                  <p className="mt-1 text-xs text-red-500">{errors.owner}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Health Status *
              </label>
              <select
                id="healthStatus"
                name="healthStatus"
                value={formData.healthStatus}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
              >
                <option value="Healthy">Healthy</option>
                <option value="Monitored">Monitored</option>
                <option value="Under treatment">Under treatment</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <div className="mt-1 flex items-center">
                {formData.photo ? (
                  <div className="relative">
                    <img 
                      src={getPhotoPreview()} 
                      alt="Cow" 
                      className="h-24 w-24 object-cover rounded-md border-2 border-green-100 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, photo: null}))}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 shadow-md transform transition-transform duration-300 hover:scale-110"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors duration-300">
                    <label htmlFor="file-upload" className="relative cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 block text-xs text-gray-600">
                          Upload
                        </span>
                      </div>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.purchaseDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                />
                {errors.purchaseDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.purchaseDate}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="purchasePrice"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className={`block w-full pl-7 pr-12 py-2 border ${errors.purchasePrice ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                {errors.purchasePrice && (
                  <p className="mt-1 text-xs text-red-500">{errors.purchasePrice}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="initialWeight" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Weight (kg)
              </label>
              <input
                type="number"
                id="initialWeight"
                name="initialWeight"
                value={formData.initialWeight}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.initialWeight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300`}
                step="0.1"
              />
              {errors.initialWeight && (
                <p className="mt-1 text-xs text-red-500">{errors.initialWeight}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <div className="mt-1 flex items-center">
                {getPhotoPreview() ? (
                  <div className="relative">
                    <img
                      src={getPhotoPreview()}
                      alt="Cow"
                      className="h-24 w-24 object-cover rounded-md border-2 border-green-100 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo: null })}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 shadow-md transform transition-transform duration-300 hover:scale-110"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors duration-300">
                    <label htmlFor="file-upload-edit" className="relative cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 block text-xs text-gray-600">
                          Upload
                        </span>
                      </div>
                      <input
                        id="file-upload-edit"
                        name="file-upload-edit"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                placeholder="Any additional information about this cow..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// DeleteConfirmationModal Component
const DeleteConfirmationModal = ({ cow, onClose, onDelete }) => {
  const handleDelete = () => {
    console.log('Deleting cow:', cow.id);
    
    if (onDelete) {
      onDelete(cow.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto my-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Confirm Deletion</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="ml-3 text-lg font-medium text-gray-900 break-words">Delete {cow.name} ({cow.tagNumber})</h4>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this cow? This action cannot be undone and all associated data will be permanently removed.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// RecordHealthEventModal Component
const RecordHealthEventModal = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    cowId: cow.id || '',
    eventType: 'Examination',
    eventDate: new Date().toISOString().split('T')[0],
    description: '',
    performedBy: '',
    medications: [{ name: '', dosage: '', method: '' }],
    notes: '',
    followUp: '',
    status: 'Completed'
  });
  
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
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would make an API call to record the health event
    console.log('Health event data:', formData);
    
    onSubmit(cow.id,formData);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-auto my-8 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-800">Record Health Event for {cow.name} ({cow.tagNumber})</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a person</option>
                  <option value="Dr. Smith">Dr. Smith</option>
                  <option value="Dr. Johnson">Dr. Johnson</option>
                  <option value="Mike Peterson">Mike Peterson</option>
                  <option value="Farm Staff">Farm Staff</option>
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
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="In progress">In progress</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Scheduled">Scheduled</option>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional information about this health event..."
              ></textarea>
            </div>
            
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Record Milk Production Modal Component
const RecordMilkProductionModal = ({ cow, onClose, onSubmit }) => {
  const [entries, setEntries] = useState([{
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    amount: '',
    quality: 'Good',
    fat: '',
    snf: '',
    notes: ''
  }]);
  const [sendWhatsAppNotification, setSendWhatsAppNotification] = useState(false);

  // Handle form field changes for a specific entry
  const handleEntryChange = (entryId, field, value) => {
    setEntries(entries.map(entry =>
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  };

  // Add a new entry row
  const addEntry = () => {
    setEntries([...entries, {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      amount: '',
      quality: 'Good',
      fat: '',
      snf: '',
      notes: ''
    }]);
  };

  // Remove an entry row
  const removeEntry = (entryId) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== entryId));
    }
  };

  const handleCheckboxChange = (e) => {
    setSendWhatsAppNotification(e.target.checked);
  };

  // WhatsApp notification service
  const sendWhatsAppNotificationService = async (recordData, cowData) => {
    try {
      console.log('Sending WhatsApp notification for milk record:', recordData);

      // In a real implementation, make an API call to your WhatsApp service (like Twilio)
      // Example:
      const message = `Hello ${cowData.owner}, your cow ${cowData.name} (${cowData.tagNumber}) has produced ${recordData.amount}L of milk on ${recordData.date}.`;

      // Mock API call for demonstration
      /*
      const response = await fetch('https://api.yourmessagingservice.com/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_AUTH_TOKEN'
        },
        body: JSON.stringify({
          to: `whatsapp:+15551234567`, // Get owner's phone number from database
          from: 'whatsapp:+15551234567',  // Your WhatsApp business number
          body: message
        })
      });

      const result = await response.json();
      */

      // For demo, log the notification details
      console.log('WhatsApp message:', message);
      console.log('WhatsApp notification would be sent to:', cowData.owner);

      // Return success
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      return { success: false, message: error.message };
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all entries
    const validEntries = entries.filter(entry => entry.amount && parseFloat(entry.amount) > 0);

    if (validEntries.length === 0) {
      toast.error('Please enter at least one valid milk production amount');
      return;
    }

    // Submit all valid entries
    for (const entry of validEntries) {
      const newRecord = {
        date: entry.date,
        shift: entry.shift,
        amount: parseFloat(entry.amount),
        quality: entry.quality,
        fat: entry.fat ? parseFloat(entry.fat) : null,
        snf: entry.snf ? parseFloat(entry.snf) : null,
        notes: entry.notes
      };

      await onSubmit(cow.id, newRecord);

      if (sendWhatsAppNotification) {
        await sendWhatsAppNotificationService(newRecord, cow);
      }
    }

    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-green-700 break-words">Record Milk Production - {cow.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 overflow-y-scroll max-h-[50vh]">
            <div className="space-y-4">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 px-2 sticky top-0 bg-white z-10 pb-2">
                <div className="col-span-2">Date *</div>
                <div className="col-span-1">Shift *</div>
                <div className="col-span-1">Qty (L) *</div>
                <div className="col-span-1">Quality</div>
                <div className="col-span-1">Fat %</div>
                <div className="col-span-1">SNF %</div>
                <div className="col-span-4">Notes</div>
                <div className="col-span-1">Action</div>
              </div>

              {/* Entry Rows */}
              {entries.map((entry, index) => (
              <div key={entry.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="col-span-2">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => handleEntryChange(entry.id, 'date', e.target.value)}
                    required
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="col-span-1">
                  <select
                    value={entry.shift}
                    onChange={(e) => handleEntryChange(entry.id, 'shift', e.target.value)}
                    required
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <input
                    type="number"
                    value={entry.amount}
                    onChange={(e) => handleEntryChange(entry.id, 'amount', e.target.value)}
                    required
                    min="0"
                    step="0.1"
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.0"
                  />
                </div>

                <div className="col-span-1">
                  <select
                    value={entry.quality}
                    onChange={(e) => handleEntryChange(entry.id, 'quality', e.target.value)}
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Excellent">Exc</option>
                    <option value="Good">Good</option>
                    <option value="Average">Avg</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <input
                    type="number"
                    value={entry.fat}
                    onChange={(e) => handleEntryChange(entry.id, 'fat', e.target.value)}
                    min="0"
                    step="0.1"
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.0"
                  />
                </div>

                <div className="col-span-1">
                  <input
                    type="number"
                    value={entry.snf}
                    onChange={(e) => handleEntryChange(entry.id, 'snf', e.target.value)}
                    min="0"
                    step="0.1"
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.0"
                  />
                </div>

                <div className="col-span-4">
                  <textarea
                    rows={2}
                    value={entry.notes}
                    onChange={(e) => handleEntryChange(entry.id, 'notes', e.target.value)}
                    className="block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Notes..."
                  ></textarea>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    disabled={entries.length === 1}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      entries.length === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                    title="Remove entry"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              ))}

              {/* Add Entry Button */}
              <button
                type="button"
                onClick={addEntry}
                className="w-full py-2 px-4 border-2 border-dashed border-blue-300 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Entry
              </button>
            </div>
          </div>

          <div className="flex items-center px-6 py-4 bg-gray-50 flex-shrink-0">
            <input
              id="sendWhatsAppNotification"
              name="sendWhatsAppNotification"
              type="checkbox"
              checked={sendWhatsAppNotification}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="sendWhatsAppNotification" className="ml-2 block text-sm text-gray-700">
              Send WhatsApp notification to cow owner
            </label>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
            <div className="text-sm text-gray-600">
              Total entries: <span className="font-semibold text-blue-600">{entries.filter(e => e.amount && parseFloat(e.amount) > 0).length}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
              >
                Save All Entries
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Record Breeding Event Modal Component
const RecordBreedingEventModal = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    eventType: 'Heat Detection',
    details: '',
    result: '',
    notes: '',
    performedBy: ''
  });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing event type, reset the result field to avoid invalid combinations
    if (name === 'eventType') {
      setFormData({
        ...formData,
        [name]: value,
        result: '' // Reset result when event type changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a new breeding event record
    const newEvent = {
      date: formData.date,
      eventType: formData.eventType,
      details: formData.details,
      result: formData.result,
      notes: formData.notes,
      performedBy: formData.performedBy
    };
    
    onSubmit(cow.id, newEvent);
    onClose();
  };
  
  // Get result options based on event type
  const getResultOptions = () => {
    switch(formData.eventType) {
      case 'Heat Detection':
        return ['Confirmed', 'No heat', 'Uncertain'];
      case 'Insemination':
        return ['Completed', 'Failed', 'Partial'];
      case 'Pregnancy Check':
        return ['Positive', 'Negative', 'Inconclusive'];
      case 'Calving':
        return ['Healthy', 'Complications', 'Stillborn'];
      default:
        return ['Successful', 'Unsuccessful', 'Partial Success'];
    }
  };

  // Get event-specific details placeholder
  const getDetailsPlaceholder = () => {
    switch(formData.eventType) {
      case 'Heat Detection':
        return 'E.g., Standing heat observed, mounting behavior';
      case 'Insemination':
        return 'E.g., Bull ID, semen source, technician name';
      case 'Pregnancy Check':
        return 'E.g., Ultrasound method, weeks of gestation';
      case 'Calving':
        return 'E.g., Calf gender, weight, ease of birth';
      default:
        return 'Enter details about this breeding event';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700">Record Breeding Event</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                />
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                >
                  <option value="Heat Detection">Heat Detection</option>
                  <option value="Insemination">Insemination</option>
                  <option value="Pregnancy Check">Pregnancy Check</option>
                  <option value="Calving">Calving</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By
                </label>
                <input
                  type="text"
                  id="performedBy"
                  name="performedBy"
                  value={formData.performedBy}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                  placeholder="E.g., Technician name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                Details *
              </label>
              <input
                type="text"
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                placeholder={getDetailsPlaceholder()}
              />
            </div>
            
            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">
                Result *
              </label>
              <select
                id="result"
                name="result"
                value={formData.result}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
              >
                <option value="">Select a result</option>
                {getResultOptions().map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                placeholder="Any additional notes about this breeding event..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick Record Modal Component for QR Scanned Cows
const QuickRecordModal = ({ cow, onClose, onRecord }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <QrCode className="mr-2 text-purple-600" size={20} />
            Quick Record for {cow?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4">
            <img
              src={cow?.image || cow?.photo || cowSample}
              alt={cow?.name}
              className="w-16 h-16 object-cover rounded-full bg-gray-200 border-2 border-purple-100 mr-4"
              onError={(e) => { e.target.src = cowSample; }}
            />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{cow?.name}</h4>
              <p className="text-sm text-gray-600">Tag: {cow?.tagNumber}</p>
              <p className="text-sm text-gray-600">{cow?.breed} • {cow?.status}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">What would you like to record for this cow?</p>
            
            <button
              onClick={() => onRecord('milk')}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              <Droplet className="mr-2" size={20} />
              Record Milk Production
            </button>
            
            <button
              onClick={() => onRecord('health')}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              <Thermometer className="mr-2" size={20} />
              Record Health Event
            </button>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// View Breeding Event Modal Component
const ViewBreedingEventModal = ({ event, cow, onClose }) => {
  // Calculate follow-up actions based on event type
  const getFollowUpActions = () => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const daysSinceEvent = Math.floor((today - eventDate) / (1000 * 60 * 60 * 24));

    const actions = [];

    const eventType = event.event_type || event.eventType;

    switch (eventType) {
      case 'Insemination':
      case 'Artificial Insemination':
        if (daysSinceEvent >= 21 && daysSinceEvent <= 30) {
          actions.push({
            action: 'Check for heat signs',
            dueDate: new Date(eventDate.getTime() + 21 * 24 * 60 * 60 * 1000),
            priority: 'High',
            status: daysSinceEvent > 24 ? 'Overdue' : 'Due Soon',
            description: 'Monitor for heat/estrus signs to confirm pregnancy or re-insemination'
          });
        }
        if (daysSinceEvent >= 30 && daysSinceEvent <= 45) {
          actions.push({
            action: 'Pregnancy Check',
            dueDate: new Date(eventDate.getTime() + 35 * 24 * 60 * 60 * 1000),
            priority: 'High',
            status: daysSinceEvent > 40 ? 'Overdue' : 'Due Soon',
            description: 'Schedule ultrasound or palpation to confirm pregnancy'
          });
        }
        if (event.result !== 'Confirmed' && daysSinceEvent >= 45) {
          actions.push({
            action: 'Re-insemination or breeding decision',
            dueDate: new Date(eventDate.getTime() + 45 * 24 * 60 * 60 * 1000),
            priority: 'Medium',
            status: 'Action Needed',
            description: 'If not pregnant, plan for next breeding cycle'
          });
        }
        if (event.result === 'Confirmed' && daysSinceEvent >= 200) {
          const expectedCalvingDate = new Date(eventDate.getTime() + 283 * 24 * 60 * 60 * 1000);
          actions.push({
            action: 'Prepare for Calving',
            dueDate: new Date(eventDate.getTime() + 260 * 24 * 60 * 60 * 1000),
            priority: 'High',
            status: daysSinceEvent >= 260 ? 'Due Soon' : 'Upcoming',
            description: `Expected calving date: ${expectedCalvingDate.toLocaleDateString()}. Prepare calving area and supplies`
          });
        }
        break;

      case 'Natural Breeding':
        if (daysSinceEvent >= 18 && daysSinceEvent <= 25) {
          actions.push({
            action: 'Monitor for heat return',
            dueDate: new Date(eventDate.getTime() + 21 * 24 * 60 * 60 * 1000),
            priority: 'Medium',
            status: 'Due Soon',
            description: 'Watch for signs of heat to determine if breeding was successful'
          });
        }
        if (daysSinceEvent >= 30) {
          actions.push({
            action: 'Pregnancy Check',
            dueDate: new Date(eventDate.getTime() + 35 * 24 * 60 * 60 * 1000),
            priority: 'High',
            status: daysSinceEvent > 40 ? 'Overdue' : 'Due Soon',
            description: 'Confirm pregnancy through veterinary examination'
          });
        }
        break;

      case 'Pregnancy Check':
        if (event.result === 'Confirmed' || event.result === 'Positive') {
          const expectedCalvingDate = new Date(eventDate.getTime() + (283 - daysSinceEvent) * 24 * 60 * 60 * 1000);
          const daysToCalving = Math.floor((expectedCalvingDate - today) / (1000 * 60 * 60 * 24));

          if (daysToCalving <= 60 && daysToCalving > 30) {
            actions.push({
              action: 'Dry off cow',
              dueDate: new Date(expectedCalvingDate.getTime() - 60 * 24 * 60 * 60 * 1000),
              priority: 'High',
              status: 'Upcoming',
              description: 'Stop milking 60 days before expected calving'
            });
          }

          if (daysToCalving <= 30) {
            actions.push({
              action: 'Monitor closely and prepare for calving',
              dueDate: expectedCalvingDate,
              priority: 'Critical',
              status: daysToCalving <= 7 ? 'Imminent' : 'Due Soon',
              description: `Expected calving in ${daysToCalving} days. Prepare maternity area`
            });
          }
        } else if (event.result === 'Failed' || event.result === 'Negative') {
          actions.push({
            action: 'Plan re-breeding',
            dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            priority: 'High',
            status: 'Action Needed',
            description: 'Monitor for next heat cycle and plan breeding'
          });
        }
        break;

      case 'Calving':
        if (daysSinceEvent <= 3) {
          actions.push({
            action: 'Monitor mother and calf',
            dueDate: new Date(eventDate.getTime() + 3 * 24 * 60 * 60 * 1000),
            priority: 'Critical',
            status: 'Active',
            description: 'Watch for complications, ensure calf is nursing'
          });
        }
        if (daysSinceEvent >= 3 && daysSinceEvent <= 7) {
          actions.push({
            action: 'Post-calving check-up',
            dueDate: new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            priority: 'High',
            status: 'Due Soon',
            description: 'Veterinary examination for mother, check calf health'
          });
        }
        if (daysSinceEvent >= 40 && daysSinceEvent <= 60) {
          actions.push({
            action: 'Breeding eligibility check',
            dueDate: new Date(eventDate.getTime() + 60 * 24 * 60 * 60 * 1000),
            priority: 'Medium',
            status: 'Upcoming',
            description: 'Assess if cow is ready for next breeding cycle'
          });
        }
        break;

      case 'Heat Detection':
        if (daysSinceEvent <= 1) {
          actions.push({
            action: 'Breeding decision',
            dueDate: new Date(eventDate.getTime() + 1 * 24 * 60 * 60 * 1000),
            priority: 'Critical',
            status: 'Urgent',
            description: 'Optimal breeding window is 12-18 hours from heat detection'
          });
        }
        break;

      case 'Abortion':
      case 'Stillborn':
        if (daysSinceEvent <= 7) {
          actions.push({
            action: 'Veterinary examination',
            dueDate: new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            priority: 'Critical',
            status: daysSinceEvent > 2 ? 'Overdue' : 'Urgent',
            description: 'Determine cause and check for infection or complications'
          });
        }
        if (daysSinceEvent >= 30) {
          actions.push({
            action: 'Health assessment for re-breeding',
            dueDate: new Date(eventDate.getTime() + 40 * 24 * 60 * 60 * 1000),
            priority: 'Medium',
            status: 'Action Needed',
            description: 'Veterinary clearance before attempting next breeding'
          });
        }
        break;

      default:
        actions.push({
          action: 'Follow-up monitoring',
          dueDate: new Date(eventDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          priority: 'Low',
          status: 'Optional',
          description: 'General monitoring and assessment'
        });
    }

    return actions;
  };

  const followUpActions = getFollowUpActions();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Due Soon':
      case 'Urgent':
        return 'bg-orange-100 text-orange-800';
      case 'Active':
      case 'Imminent':
        return 'bg-purple-100 text-purple-800';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'Action Needed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700">
                Breeding Event Details
              </h3>
              {cow && (
                <p className="text-sm text-gray-600 mt-1">
                  Cow: {cow.name} (Tag: {cow.tagNumber})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Event Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Event Information</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">Event Type</span>
                  <p className="text-sm font-semibold text-gray-900">{event.event_type || event.eventType}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Date</span>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(event.date)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Result/Status</span>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      event.result === 'Confirmed' || event.result === 'Positive' || event.result === 'Healthy' || event.result === 'Completed' || event.result === 'Successful' ?
                        'bg-green-100 text-green-800' :
                      event.result === 'Failed' || event.result === 'Negative' || event.result === 'Stillborn' || event.result === 'Unsuccessful' ?
                        'bg-red-100 text-red-800' :
                      event.result === 'Pending' ?
                        'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                      {event.result || 'Pending'}
                    </span>
                  </p>
                </div>
                {(event.performed_by || event.performedBy) && (
                  <div>
                    <span className="text-xs text-gray-500">Performed By</span>
                    <p className="text-sm font-semibold text-gray-900">{event.performed_by || event.performedBy}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Details</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {event.details || 'No additional details provided'}
              </p>
              {event.notes && (
                <div className="mt-3">
                  <span className="text-xs text-gray-500">Notes</span>
                  <p className="text-sm text-gray-700 mt-1">{event.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Actions */}
          {followUpActions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Recommended Follow-up Actions
              </h4>
              <div className="space-y-3">
                {followUpActions.map((action, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getPriorityColor(action.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900">{action.action}</h5>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(action.status)}`}>
                            {action.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Due: {action.dueDate.toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span className="font-medium">Priority: {action.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {followUpActions.length === 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">No pending follow-up actions at this time</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CowManagement;