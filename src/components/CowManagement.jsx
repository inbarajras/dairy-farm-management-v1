import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, Clock, Mail, Phone, MapPin, Users, Award, FileText, Briefcase, User,Download,DollarSign,Droplet,Thermometer, QrCode, Camera } from 'lucide-react';
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

// Status badge colors
const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'Dry': 'bg-blue-100 text-blue-800',
  'Sold': 'bg-black-100 text-balck-800',
  'Deceased': 'bg-red-100 text-red-800',
  'Calf': 'bg-purple-100 text-purple-800',
  'Heifer': 'bg-pink-100 text-pink-800'
};

// Health status colors
const healthStatusColors = {
  'Healthy': 'bg-green-100 text-green-800',
  'Monitored': 'bg-yellow-100 text-yellow-800',
  'Under treatment': 'bg-red-100 text-red-800'
};

// Attendance status colors
const attendanceStatusColors = {
  'Present': 'bg-green-100 text-green-800',
  'Absent': 'bg-red-100 text-red-800',
  'Late': 'bg-yellow-100 text-yellow-800',
  'Weekend': 'bg-gray-100 text-gray-800',
  'Holiday': 'bg-blue-100 text-blue-800',
  'Vacation': 'bg-purple-100 text-purple-800'
};

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
  const [isRecordGrowthMilestoneModalOpen, setIsRecordGrowthMilestoneModalOpen] = useState(false);
  const [cowToEdit, setCowToEdit] = useState(null);
  const [cowToDelete, setCowToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [growthMilestones, setGrowthMilestones] = useState([]);
  const [filters, setFilters] = useState({
    status: 'All',
    healthStatus: 'All',
    breed: 'All',
    milkingStatus: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [view, setView] = useState('grid'); // 'grid' or 'table'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
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
        setErrorMessage('Failed to load cows. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCows();
  }, []);

  // Refresh cow data function (can be called when data changes)
  const refreshCowData = async () => {
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
      setErrorMessage('Failed to refresh cow data.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Add periodic refresh every 5 minutes to catch updates from other components
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshCowData();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [loading]);

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

    // Get today's date and format it to match the records
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Filter records for today
    const todayRecords = cow.milkProduction.filter(record => record.date === todayStr);
    
    if (todayRecords.length > 0) {
      // Sum up all of today's records
      return todayRecords.reduce((sum, record) => sum + record.amount, 0);
    }

    // If no records for today, check yesterday's records
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayRecords = cow.milkProduction.filter(record => record.date === yesterdayStr);

    if (yesterdayRecords.length > 0) {
      return yesterdayRecords.reduce((sum, record) => sum + record.amount, 0);
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
        
      return { 
        milked: isSameDay,
        message: isSameDay ? 'Milked today' : 'Not milked today',
        shift: latest.shift || 'Not specified',
        latestDate: milkDateStr,
        todayDate: todayStr
      };
    }
    
    return { milked: false, message: 'No milking records' };
  };

  // Filter cows based on search and filters
  const filteredCows = ensureValidCows(cows).filter(cow => {
    // Only process if cow is a valid object
    if (!cow || typeof cow !== 'object') return false;
    
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
  });

  // Pagination
  const indexOfLastCow = currentPage * itemsPerPage;
  const indexOfFirstCow = indexOfLastCow - itemsPerPage;
  const currentCows = filteredCows.slice(indexOfFirstCow, indexOfLastCow);
  const totalPages = Math.ceil(filteredCows.length / itemsPerPage);

  // Get unique breeds for filter
  const uniqueBreeds = Array.from(new Set(cows.map(cow => cow.breed)));

  // Open cow profile
  const openCowProfile = (cow) => {
    setSelectedCow(cow);
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
      setSuccessMessage('New cow added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error adding cow:", err);
      setErrorMessage('Failed to add cow. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
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
      
      setSuccessMessage('Cow updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error updating cow:", err);
      setErrorMessage('Failed to update cow. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
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
      
      setSuccessMessage('Cow deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error deleting cow:", err);
      setErrorMessage('Failed to delete cow. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
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
      
      setSuccessMessage('Health event recorded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error recording health event:", err);
      setErrorMessage('Failed to record health event. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Record milk production
  const handleRecordMilkProduction = async (cowId, recordData) => {
    try {
      setLoading(true);
      console.log('Recording milk production:', recordData);
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
      
      // If this was for the selected cow, refresh the cow data
      if (selectedCow && selectedCow.id === cowId) {
        // We'll need to refresh the selectedCow data to reflect new updates
        // No need to directly manipulate the breeding events or reproductive status here
        // as they will be fetched when the tab is active in the EmployeeProfile component
        
        // Optionally, refresh the entire cow data if needed
        const updatedCowData = await fetchCows().then(cows => 
          cows.find(cow => cow.id === cowId)
        );
        
        if (updatedCowData) {
          setSelectedCow(updatedCowData);
        }
      }
      
      setSuccessMessage('Breeding event recorded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error recording breeding event:", err);
      setErrorMessage('Failed to record breeding event. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
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
      
      // If this was for the selected cow, refresh the cow data
      if (selectedCow && selectedCow.id === cowId) {
        const updatedCowData = updatedCows.find(cow => cow.id === cowId);
        if (updatedCowData) {
          setSelectedCow(updatedCowData);
        }
      }
      
      setSuccessMessage('Growth milestone recorded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error recording growth milestone:", err);
      setErrorMessage('Failed to record growth milestone. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
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
      setErrorMessage('Cow not found in the system.');
      setTimeout(() => setErrorMessage(''), 3000);
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
      {/* Success and error messages */}
      {successMessage && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fadeIn">
          <p>{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fadeIn">
          <p>{errorMessage}</p>
        </div>
      )}
      
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
            setErrorMessage(`Scanner error: ${error.message}`);
            setTimeout(() => setErrorMessage(''), 3000);
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

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get today's total production (morning + evening)
    const todayRecords = cow.milkProduction.filter(record => record.date === todayStr);
    const todayTotal = todayRecords.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);

    // Get yesterday's total production (morning + evening)
    const yesterdayRecords = cow.milkProduction.filter(record => record.date === yesterdayStr);
    const yesterdayTotal = yesterdayRecords.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);

    // Use today's total if available, otherwise use yesterday's total
    const dailyTotal = todayTotal > 0 ? todayTotal : (yesterdayTotal > 0 ? yesterdayTotal : 0);

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

  // Ensure alerts is always an array
  const alerts = Array.isArray(cow?.alerts) ? cow.alerts : 
                (cow?.alerts ? [cow.alerts] : []);

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
            src={cowSample}  
            alt={cow?.name}
            className="w-16 h-16 object-cover rounded-full bg-gray-200 border-2 border-green-100 flex-shrink-0"
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
const CowProfile = ({ cow, onClose, onEdit, onRecordHealthEvent, toggleRecordMilkModal, toggleRecordBreedingEventModal, toggleRecordGrowthMilestoneModal, hasPermission }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthHistory, setHealthHistory] = useState([]);
  const [breedingEvents, setBreedingEvents] = useState([]);
  const [reproductiveStatus, setReproductiveStatus] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [growthMilestones, setGrowthMilestones] = useState([]);
  const [scheduledMilestone, setScheduledMilestone] = useState(null);
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
  
  // Calculate average milk production with comprehensive safety check
  const avgMilkProduction = hasMilkProductionData
    ? cow.milkProduction.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0) / cow.milkProduction.length
    : 0;
  
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
  
  // Fetch health history when tab changes to health
  useEffect(() => {
    if (activeTab === 'health' && cow && cow.id && !healthHistory.length) {
      loadHealthHistory();
    }
  }, [activeTab, cow, healthHistory.length]);

  const loadHealthHistory = async () => {
    if (!cow?.id || healthHistory.length > 0) return;
    
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
  
  // Fetch recent activities when tab changes to overview
  useEffect(() => {
    if ((activeTab === 'overview' && cow && cow.id && !recentActivities.length)) {
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
  }, [activeTab, cow, recentActivities.length]);

  // Fetch growth milestones when tab changes to growth
  useEffect(() => {
    if (activeTab === 'growth' && cow && cow.id && !growthMilestones.length && (isCalf || isHeifer)) {
      loadGrowthMilestones();
    }
  }, [activeTab, cow, growthMilestones.length, isCalf, isHeifer]);

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
                  src={cowSample} 
                  alt={cow.name}
                  className="w-32 h-32 object-cover rounded-full bg-gray-200 mb-4 border-4 border-green-100 shadow-md"
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
                              <p className="text-sm font-medium text-gray-500">Avg. Milk Production</p>
                              <p className="text-2xl font-semibold text-gray-800 mt-1">
                                {!isNaN(avgMilkProduction) ? avgMilkProduction.toFixed(1) : '0.0'}L
                              </p>
                            </div>
                            <div className="p-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600">
                              <Droplet className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-4 text-xs text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            <span>+3% from last week</span>
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
                    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-4">Daily Milk Production (Last 7 Days)</h3>
                      <div className="h-64">
                        {hasMilkProductionData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={cow.milkProduction
                                .filter(record => {
                                  // Filter to show only the last 7 days of records
                                  const recordDate = new Date(record.date);
                                  const sevenDaysAgo = new Date();
                                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                  return recordDate >= sevenDaysAgo;
                                })
                                .map(record => ({
                                  date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                  amount: parseFloat(record.amount) || 0,
                                  quality: record.quality || 'Standard'
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
                                formatter={(value, name) => [`${value}L`, 'Production']}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="amount"
                                name="Milk Production"
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
                      
                      {/* Production Statistics - Update to reflect 7-day stats */}
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
                      )}
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
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {breedingEvents.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(event.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {event.eventType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {event.details}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  event.result === 'Confirmed' || event.result === 'Positive' || event.result === 'Healthy' || event.result === 'Completed' || event.result === 'Successful' ? 
                                    'bg-green-100 text-green-800' : 
                                  event.result === 'Failed' || event.result === 'Negative' || event.result === 'Stillborn' || event.result === 'Unsuccessful' ? 
                                    'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.result}
                                </span>
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!validateCurrentStep()) {
      return;
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
      image: '/api/placeholder/160/160', // Use placeholder for demo
      notes: formData.notes,
      purchaseDate: formData.purchaseDate || null,
      purchasePrice: formData.purchasePrice || null,
      initialWeight: formData.initialWeight || null,
      currentWeight: formData.currentWeight || formData.initialWeight || null
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
      setFormData({
        ...formData,
        photo: e.target.files[0]
      });
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
          
          <form onSubmit={handleSubmit} className="px-6 pb-6 animate-fadeIn">
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
                    <select
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    >
                      <option value="Holstein">Holstein</option>
                      <option value="Jersey">Jersey</option>
                      <option value="Brown Swiss">Brown Swiss</option>
                      <option value="Ayrshire">Ayrshire</option>
                      <option value="Guernsey">Guernsey</option>
                      <option value="Other">Other</option>
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
                          src={URL.createObjectURL(formData.photo)} 
                          alt="Cow" 
                          className="h-24 w-24 object-cover rounded-md border-2 border-green-100 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, photo: null})}
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
                        <span className="text-gray-500 sm:text-sm">$</span>
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
                        <p className="text-gray-800">${formData.purchasePrice}</p>
                      </div>
                    )}
                    {formData.initialWeight && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Initial Weight</h5>
                        <p className="text-gray-800">{formData.initialWeight} kg</p>
                      </div>
                    )}
                  </div>
                  
                  {formData.notes && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Notes</h5>
                      <p className="text-gray-800">{formData.notes}</p>
                    </div>
                  )}
                  
                  {formData.photo && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Photo</h5>
                      <img 
                        src={URL.createObjectURL(formData.photo)} 
                        alt="Cow" 
                        className="h-24 w-24 object-cover rounded-md mt-2 border border-gray-200 shadow-sm"
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
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                >
                  Add Cow
                </button>
              )}
            </div>
          </form>
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
                  <option value="Holstein">Holstein</option>
                  <option value="Jersey">Jersey</option>
                  <option value="Brown Swiss">Brown Swiss</option>
                  <option value="Ayrshire">Ayrshire</option>
                  <option value="Guernsey">Guernsey</option>
                  <option value="Other">Other</option>
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
                    <span className="text-gray-500 sm:text-sm">$</span>
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
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    amount: '',
    quality: 'Good',
    notes: '',
    sendWhatsAppNotification: false
  });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // WhatsApp notification service
  const sendWhatsAppNotification = async (recordData, cowData) => {
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a new milk production record
    const newRecord = {
      date: formData.date,
      shift: formData.shift,
      amount: parseFloat(formData.amount),
      quality: formData.quality,
      notes: formData.notes
    };
    
    onSubmit(cow.id,newRecord);

    if (formData.sendWhatsAppNotification) {
      const notificationResult = sendWhatsAppNotification(formData, cow);
      
      if (notificationResult.success) {
        console.log('Notification sent successfully');
      } else {
        console.error('Failed to send notification:', notificationResult.message);
      }
    }

    toast.success(formData.sendWhatsAppNotification 
      ? 'Milk record added and notification sent!'
      : 'Milk record added successfully!');

    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto my-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-green-700 break-words">Record Milk Production</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-auto max-h-[70vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                />
              </div>
              
              <div>
                <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
                  Shift *
                </label>
                <select
                  id="shift"
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (L) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                placeholder="Enter amount in liters"
              />
            </div>
            
            <div>
              <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
                Quality
              </label>
              <select
                id="quality"
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                placeholder="Any additional notes about this collection..."
              ></textarea>
            </div>
          </div>
          <div className="flex items-center px-6 py-4">
            <input
              id="sendWhatsAppNotification"
              name="sendWhatsAppNotification"
              type="checkbox"
              checked={formData.sendWhatsAppNotification}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="sendWhatsAppNotification" className="ml-2 block text-sm text-gray-700">
              Send WhatsApp notification to cow owner
            </label>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3">
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
              Save
            </button>
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
              src={cowSample} 
              alt={cow?.name}
              className="w-16 h-16 object-cover rounded-full bg-gray-200 border-2 border-purple-100 mr-4"
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

export default CowManagement;