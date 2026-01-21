import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, 
  Calendar, Clock, Mail, Phone, MapPin, Users, Award, FileText, Briefcase, 
  UserX, Download, AlertTriangle,X, IndianRupee,UserCheck,TrendingUp,AlertCircle,Info } from 'lucide-react';
import {
  fetchEmployees,
  fetchEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  recordAttendance,
  getMonthlyAttendanceSummary,
  getAttendanceStatistics,
  getEmployeeShifts,
  getEmployeePerformance,
  getScheduledReviews,
  schedulePerformanceReview,
  assignShifts,
  getPerformanceReviews,
  updatePerformanceReview,
  createPerformanceReview,
  deletePerformanceReview,
  getEmployeePerformanceReviews,
  updateEmployeeAttendanceRate
} from './services/employeeService';
import { getEmployeePayrollHistory, getEmployeeSalaryHistory } from './services/financialService';
import { getShiftTemplates, addShiftTemplate, updateShiftTemplate, deleteShiftTemplate } from './services/shiftTemplateService';
import generatePayslipPDF from '../utils/pdfGenerator';
import emp from '../assets/images/emp.jpg';
import LoadingSpinner from './LoadingSpinner';
import { toast } from './utils/ToastContainer';

// Status badge colors - unchanged
const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'On Leave': 'bg-amber-100 text-amber-800',
  'Terminated': 'bg-red-100 text-red-800'
};

// Attendance status colors - unchanged
const attendanceStatusColors = {
  'Present': 'bg-green-100 text-green-800',
  'Absent': 'bg-red-100 text-red-800',
  'Late': 'bg-amber-100 text-amber-800',
  'Weekend': 'bg-gray-100 text-gray-800',
  'Holiday': 'bg-blue-100 text-blue-800',
  'Vacation': 'bg-purple-100 text-purple-800'
};

// Utility function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Utility function to format currency
const formatCurrency = (amount) => {
  if (!amount) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Main employee management component
const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: 'All',
    status: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('employees');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [employeeForAttendance, setEmployeeForAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For attendance tab
  const [attendanceData, setAttendanceData] = useState({
    summary: [],
    statistics: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 0
    }
  });
  
  // For shifts tab
  const [shiftsData, setShiftsData] = useState([]);
  
  // For performance tab
  const [performanceData, setPerformanceData] = useState([]);
  const [scheduledReviews, setScheduledReviews] = useState([]);
  
  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);
  
  // Load additional data when tab changes
  useEffect(() => {
    const loadTabData = async () => {
      try {
        if (activeTab === 'attendance') {
          setIsLoading(true);
        
          // Get current month and year
          const today = new Date();
          const month = today.getMonth() + 1; // JavaScript months are 0-indexed
          const year = today.getFullYear();
          
          // Fetch attendance data
          const summary = await getMonthlyAttendanceSummary(month, year);
          const statistics = await getAttendanceStatistics(month, year);
          
          // Fetch today's attendance data specifically for the KPI cards
          const todayStr = new Date().toISOString().split('T')[0];
          const todayAttendance = summary.filter(record => record.date === todayStr);
          
          // Calculate today's statistics
          const presentToday = todayAttendance.filter(record => record.status === 'Present').length;
          const absentToday = todayAttendance.filter(record => record.status === 'Absent').length;
          const lateToday = todayAttendance.filter(record => record.status === 'Late').length;
          
          // Calculate attendance rate for today
          const totalToday = presentToday + absentToday + lateToday;
          const attendanceRateToday = totalToday > 0 
            ? ((presentToday + lateToday) / totalToday * 100).toFixed(1)
            : "0.0";
          
          // Store the raw attendance records as summary and the statistics separately
          setAttendanceData({
            summary, // This should be an array of attendance records
            statistics: {
              ...statistics,
              presentToday,
              absentToday,
              lateToday,
              attendanceRateToday: parseFloat(attendanceRateToday)
            }
          });
          
          setIsLoading(false);
        } else if (activeTab === 'shifts') {
          setIsLoading(true);

          // Get current date for week start
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
          const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
          const weekStart = new Date(today);
          weekStart.setDate(diff);

          // Fetch shifts data
          const shifts = await getEmployeeShifts(weekStart);
          setShiftsData(shifts);

          setIsLoading(false);
        } else if (activeTab === 'performance') {
          // Load performance data
          const [reviews, scheduled] = await Promise.all([
            getPerformanceReviews(),
            getPerformanceReviews() // You can filter this in the backend for scheduled reviews
          ]);
          setPerformanceData(reviews);
          setScheduledReviews(scheduled);
        }
      } catch (err) {
        console.error('Error loading tab data:', err);
        setError(`Failed to load data for ${activeTab} tab. Please try again.`);
        setIsLoading(false);
      }
    };
    
    if (activeTab !== 'employees') {
      loadTabData();
    }
  }, [activeTab]);

  const refreshPerformanceData = async () => {
    setIsLoading(true);
    try {
      // Fetch performance reviews and scheduled reviews
      const [perfData, reviewsData] = await Promise.all([
        getPerformanceReviews(),
        getScheduledReviews()
      ]);
      
      // Update state with new data
      setPerformanceData(perfData || []);
      setScheduledReviews(reviewsData || []);
      
      // Also refresh employee data to get updated performance ratings
      await loadEmployees();
      
      setError(null);
    } catch (err) {
      console.error("Error refreshing performance data:", err);
      setError("Failed to load performance data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load all employees
  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchEmployees();
      setEmployees(data);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees. Please refresh the page to try again.');
      setIsLoading(false);
    }
  };

  const refreshShiftsData = async (date = new Date()) => {
    if (activeTab === 'shifts') {
      setIsLoading(true);

      // Get current date for week start if none provided
      const targetDate = date || new Date();
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
      const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
      const weekStart = new Date(targetDate);
      weekStart.setDate(diff);

      // Fetch shifts data
      try {
        const shifts = await getEmployeeShifts(weekStart);
        setShiftsData(shifts);
      } catch (err) {
        console.error('Error refreshing shifts data:', err);
        setError('Failed to refresh shifts data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
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
  
  // Toggle edit modal
  const toggleEditModal = (employee = null) => {
    setEmployeeToEdit(employee);
    setIsEditModalOpen(!isEditModalOpen);
  };
  
  // Edit employee
  const handleEditEmployee = async (updatedEmployee) => {
    try {
      setIsLoading(true);
      
      // Update employee in database
      await updateEmployee(updatedEmployee.id, updatedEmployee);
      
      // Refresh employees list
      await loadEmployees();
      
      // Close the modal and show success message
      setIsEditModalOpen(false);
      toast.success('Employee updated successfully!');
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle attendance recording modal
  const toggleAttendanceModal = (employee = null) => {
    setEmployeeForAttendance(employee);
    setIsAttendanceModalOpen(!isAttendanceModalOpen);
  };
  
  // Record attendance for an employee
  const handleRecordAttendance = async (employeeId, attendanceData) => {
    try {
      setIsLoading(true);
      
      // Record attendance in database
      await recordAttendance({
        employeeId,
        ...attendanceData
      });
      
      // If we're on the attendance tab, refresh data
      if (activeTab === 'attendance') {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const summary = await getMonthlyAttendanceSummary(month, year);
        const statistics = await getAttendanceStatistics(month, year);
        
        setAttendanceData({
          summary,
          statistics
        });
      }
      
      // Refresh employees list to get updated attendance rates
      await loadEmployees();
      
      // Close the modal and show success message
      setIsAttendanceModalOpen(false);
      toast.success('Attendance recorded successfully!');
    } catch (err) {
      console.error('Error recording attendance:', err);
      setError('Failed to record attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add new employee
  const handleAddEmployee = async (employeeData) => {
    try {
      setIsLoading(true);
      
      // Add employee to database
      await addEmployee(employeeData);
      
      // Refresh employees list
      await loadEmployees();
      
      // Close the modal and show success message
      setIsAddModalOpen(false);
      toast.success('Employee added successfully!');
    } catch (err) {
      console.error('Error adding employee:', err);
      setError('Failed to add employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open employee profile
  const openEmployeeProfile = async (employee) => {
    try {
      setIsLoading(true);
      
      // Fetch complete employee data including attendance history
      const completeEmployee = await fetchEmployeeById(employee.id);
      setSelectedEmployee(completeEmployee);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading employee profile:', err);
      setError('Failed to load employee profile. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Close employee profile
  const closeEmployeeProfile = () => {
    setSelectedEmployee(null);
  };
  
  // Toggle add modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };
  
  // Filter employees based on search and filters
  const filteredEmployees = employees ? employees.filter(employee => {
    // Only filter if employee exists
    if (!employee) return false;
    
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      (employee.name && employee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (employee.job_title && employee.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (employee.email && employee.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Department filter
    const matchesDepartment = 
      filters.department === 'All' || 
      employee.department === filters.department;
    
    // Status filter
    const matchesStatus = 
      filters.status === 'All' || 
      employee.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  }) : [];
  
  // Pagination
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  
  // Get unique departments for filter
  const uniqueDepartments = Array.from(new Set(employees.map(employee => employee.department)));
  
  // Display loading state
  if (isLoading && !selectedEmployee && employees.length === 0) {
    return <LoadingSpinner message="Loading Employees" />;
  }
  
  // Display error state
  if (error && !selectedEmployee && employees.length === 0) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadEmployees}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 overflow-y-auto">
      {selectedEmployee ? (
        <EmployeeProfile 
          employee={selectedEmployee} 
          onClose={closeEmployeeProfile} 
          onEdit={toggleEditModal} 
          onRecordAttendance={toggleAttendanceModal}
          isLoading={isLoading}
        />
      ) : (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {/* Header with gradient text */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Employee Management</h1>
            <button 
              onClick={toggleAddModal}
              data-action="add-employee"
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Add Employee
            </button>
          </div>

          {/* Tabs with consistent styling */}
          <div className="mb-6 overflow-x-auto">
            <nav className="flex space-x-4 border-b border-gray-200 min-w-[500px]">
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'employees'
                    ? 'border-green-500 text-green-600 bg-gradient-to-b from-white to-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'attendance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'shifts'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shifts
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'performance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance
              </button>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button 
                      onClick={() => setError(null)} 
                      className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab Content */}
          {activeTab === 'employees' && (
            <div>
              {/* Search and Filters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div className="col-span-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                      placeholder="Search by name, job title or email..."
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                </div>

                <div className="col-span-1">
                  <select
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <option value="All">All Departments</option>
                    {uniqueDepartments.map(department => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <select
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Count */}
              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredEmployees.length > 0 ? indexOfFirstEmployee + 1 : 0}-{Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>

              {/* Employees Grid with loading state */}
              {isLoading && employees.length > 0 ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map(employee => (
                      <EmployeeCard 
                        key={employee.id} 
                        employee={{
                          ...employee,
                          name: employee.name,
                          jobTitle: employee.job_title,
                          dateJoined: employee.date_joined,
                          image: emp
                        }} 
                        onClick={() => openEmployeeProfile(employee)} 
                        onRecordAttendance={toggleAttendanceModal} 
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center bg-white rounded-lg shadow-md border border-gray-100">
                      <p className="text-gray-500">No employees found matching your filters</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 overflow-x-auto py-2">
                  <div className="flex space-x-2 min-w-max">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show first page, last page, current page and neighbors
                      let pageToShow;
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageToShow = i + 1;
                      } else if (currentPage <= 3) {
                        // Near start, show first 5
                        pageToShow = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // Near end, show last 5
                        pageToShow = totalPages - 4 + i;
                      } else {
                        // In middle, show current and neighbors
                        pageToShow = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageToShow}
                          onClick={() => setCurrentPage(pageToShow)}
                          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${
                            currentPage === pageToShow 
                              ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' 
                              : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                          }`}
                        >
                          {pageToShow}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other tabs content */}
          {activeTab === 'attendance' && (
            <AttendanceTab 
              attendanceData={attendanceData.summary}
              statistics={attendanceData.statistics}
              employees={employees} 
              isLoading={isLoading} 
            />
          )}

          {activeTab === 'shifts' && (
            <ShiftsTab 
              shiftsData={shiftsData} 
              employees={employees} 
              isLoading={isLoading}
              onRefreshData={refreshShiftsData}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceTab 
              performanceData={performanceData} 
              scheduledReviews={scheduledReviews}
              employees={employees}
              isLoading={isLoading} 
              onRefreshData={refreshPerformanceData}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddEmployeeModal 
          onClose={toggleAddModal} 
          onSubmit={handleAddEmployee}
          isLoading={isLoading}
        />
      )}

      {isEditModalOpen && employeeToEdit && (
        <EditEmployeeModal
          employee={employeeToEdit}
          onClose={toggleEditModal}
          onSave={handleEditEmployee}
          isLoading={isLoading}
        />
      )}

      {isAttendanceModalOpen && employeeForAttendance && (
        <RecordAttendanceModal
          employee={{
            ...employeeForAttendance,
            name: employeeForAttendance.name,
            jobTitle: employeeForAttendance.job_title || employeeForAttendance.jobTitle,
            image: employeeForAttendance.image_url || employeeForAttendance.image
          }}
          onClose={toggleAttendanceModal}
          onSave={handleRecordAttendance}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// Employee Card Component - unchanged except for adapted property names
const EmployeeCard = ({ employee, onClick, onRecordAttendance }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${
        employee.status === 'Active' ? 'from-green-500 to-green-600' :
        employee.status === 'On Leave' ? 'from-amber-500 to-amber-400' :
        employee.status === 'Terminated' ? 'from-red-500 to-red-400' :
        'from-gray-500 to-gray-400'
      }`}></div>
      
      <div className="p-4">
        <div className="flex items-center mb-3">
          <img 
            src={employee.image} 
            alt={employee.name} 
            className="w-16 h-16 object-cover rounded-full bg-gray-200 border-2 border-blue-100 flex-shrink-0"
          />
          <div className="ml-4 overflow-hidden">
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 truncate">{employee.name}</h3>
            <p className="text-sm text-gray-600 truncate">{employee.jobTitle}</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center mb-2 overflow-hidden">
            <Briefcase size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">{employee.department}</span>
          </div>
          <div className="flex items-center mb-2 overflow-hidden">
            <Mail size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">{employee.email}</span>
          </div>
          <div className="flex items-center overflow-hidden">
            <Phone size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">{employee.phone}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t flex flex-wrap justify-between items-center gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[employee.status]}`}>
            {employee.status}
          </span>
          <span className="text-sm text-gray-500 truncate">
            Since {formatDate(employee.dateJoined)}
          </span>
        </div>
        <div className="mt-4 pt-2 border-t flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button 
            className="p-1 text-green-600 hover:text-green-900 transition-colors duration-200 hover:bg-green-50 rounded-full flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onRecordAttendance(employee);
            }}
          >
            <Calendar size={16} className="mr-1" />
            <span className="text-sm">Attendance</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Employee Profile Component
const EmployeeProfile = ({ employee, onClose, onEdit, onRecordAttendance, isLoading }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return <LoadingSpinner message={`Loading ${employee.name}'s Profile`} />;
  }
  
  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-4 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700 truncate">{employee.name}</h1>
            <span className="ml-2 md:ml-4 px-2 md:px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 rounded-full text-xs md:text-sm font-medium whitespace-nowrap">
              {employee.job_title}
            </span>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Basic Info */}
          <div className="lg:w-1/3 mb-6 lg:mb-0 lg:pr-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-4 md:p-6 flex flex-col items-center">
                <img 
                  src={emp} 
                  alt={employee.name} 
                  className="w-24 md:w-32 h-24 md:h-32 object-cover rounded-full bg-gray-200 mb-4 border-4 border-green-100"
                />
                <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 text-center">{employee.name}</h2>
                <p className="text-gray-600 text-center">{employee.job_title}</p>
                <span className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${statusColors[employee.status]}`}>
                  {employee.status}
                </span>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-start">
                    <Briefcase size={16} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-words">{employee.department}</span>
                  </div>
                  <div className="flex items-start">
                    <Mail size={16} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-words">{employee.email}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone size={16} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-words">{employee.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin size={16} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-words">{employee.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-start">
                    <Calendar size={16} className="text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-words">Joined: {formatDate(employee.date_joined)}</span>
                  </div>
                </div>
                
                <div className="mt-6 w-full flex flex-col space-y-2">
                  <button 
                    onClick={() => onEdit(employee)}
                    className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => onRecordAttendance(employee)}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                  >
                    Record Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Tabs & Details */}
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex -mb-px px-4 md:px-6 space-x-4 md:space-x-8 min-w-[400px]">
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
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'attendance'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'performance'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveTab('payroll')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                      activeTab === 'payroll'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Payroll
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="p-4 md:p-6 overflow-x-auto">
                {activeTab === 'overview' && (
                  <OverviewTab employee={employee} />
                )}
                
                {activeTab === 'attendance' && (
                  <AttendanceDetailsTab employee={employee} />
                )}
                
                {activeTab === 'performance' && (
                  <PerformanceDetailsTab employee={employee} />
                )}
                
                {activeTab === 'payroll' && (
                  <PayrollTab employee={employee} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Item Component for Profile
const ActivityItem = ({ type, description, date }) => {
  const getIcon = () => {
    switch (type) {
      case 'attendance':
        return <Calendar size={16} className="text-blue-500" />;
      case 'training':
        return <FileText size={16} className="text-purple-500" />;
      case 'performance':
        return <Award size={16} className="text-amber-500" />;
      case 'payroll':
        return <IndianRupee size={16} className="text-green-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="px-6 py-4 flex items-start">
      <div className="p-2 bg-gray-100 rounded-full mr-4 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-gray-800">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
};

// Review Item Component
const ReviewItem = ({ date, reviewer, rating, summary }) => {
  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-800 mr-2">{reviewer}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 text-xs text-gray-500">{rating}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{summary}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{formatDate(date)}</p>
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ employee }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    rating: employee.performance_rating || 0
  });
  const [attendanceMetrics, setAttendanceMetrics] = useState({
    attendanceRate: employee.attendance_rate || 0
  });
  const skills = employee.skills 
    ? (Array.isArray(employee.skills) ? employee.skills : [employee.skills]) 
    : [];
  
  const certifications = employee.certifications 
    ? (Array.isArray(employee.certifications) ? employee.certifications : [employee.certifications]) 
    : [];
  
  // Load recent activity and calculate metrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get performance reviews for this employee - existing code
        const performanceReviews = await getEmployeePerformanceReviews(employee.id);
        
        // Calculate actual performance rating
        if (performanceReviews && performanceReviews.length > 0) {
          const completedReviews = performanceReviews.filter(review => 
            review.status === 'Completed' && review.rating
          );
          
          if (completedReviews.length > 0) {
            const sum = completedReviews.reduce((total, review) => 
              total + parseFloat(review.rating || 0), 0);
            const avgRating = (sum / completedReviews.length).toFixed(1);
            setPerformanceMetrics({ rating: avgRating });
          }
        }
        
        // Calculate attendance rate from attendance history
        if (employee.attendanceHistory && Array.isArray(employee.attendanceHistory)) {
          const presentDays = employee.attendanceHistory.filter(record => 
            record && (record.status === 'Present' || record.status === 'Late')).length;
          
          const totalDays = employee.attendanceHistory.length;
          
          if (totalDays > 0) {
            const attendanceRate = ((presentDays / totalDays) * 100).toFixed(1);
            setAttendanceMetrics({ attendanceRate });
          }
        }
        
        // Format activities - existing code
        const attendanceRecords = employee.attendanceHistory || [];
        
        // Format attendance activities
        const attendanceActivities = (attendanceRecords || [])
          .slice(0, 3)
          .map(record => ({
            id: `attendance-${record.id || Math.random()}`,
            type: 'attendance',
            description: `${record.status} on ${formatDate(record.date)}${record.notes ? `: ${record.notes}` : ''}`,
            date: record.date,
            timestamp: new Date(record.date).getTime()
          }));
        
        // Format performance review activities
        const reviewActivities = (performanceReviews || [])
          .slice(0, 3)
          .map(review => ({
            id: `review-${review.id}`,
            type: 'performance',
            description: `${review.review_type} review ${review.status.toLowerCase()}${review.status === 'Completed' ? ` with rating ${review.rating}/5` : ''}`,
            date: review.status === 'Completed' ? review.completion_date : review.scheduled_date,
            timestamp: new Date(review.status === 'Completed' ? review.completion_date : review.scheduled_date).getTime()
          }));
        
        // Combine and sort activities by date (newest first)
        const combinedActivities = [...attendanceActivities, ...reviewActivities]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);
        
        setRecentActivity(combinedActivities);
      } catch (err) {
        console.error('Error fetching employee data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (employee?.id) {
      fetchData();
    }
  }, [employee?.id]);
  
  // In the return statement, update the performance rating display:
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Performance Rating</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">
                {performanceMetrics.rating > 0 ? `${performanceMetrics.rating}/5.0` : 'Not rated'}
              </p>
            </div>
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-5 h-5 ${star <= Math.floor(performanceMetrics.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{attendanceMetrics.attendanceRate}%</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <Calendar size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Schedule</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{employee.schedule || 'Full-time'}</p>
            </div>
            <div className="p-2 rounded-full bg-purple-50 text-purple-600">
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Skills & Certifications</h3>
          </div>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Skills</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {skills.length > 0 ? skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {skill}
                </span>
              )) : (
                <span className="text-sm text-gray-500">No skills listed</span>
              )}
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mb-3">Certifications</h4>
            <div className="space-y-2">
              {certifications.length > 0 ? certifications.map((cert, index) => (
                <div key={index} className="flex items-center">
                  <FileText size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{cert}</span>
                </div>
              )) : (
                <span className="text-sm text-gray-500">No certifications listed</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <ActivityItem
                  key={activity.id}
                  type={activity.type}
                  description={activity.description}
                  date={formatDate(activity.date)}
                />
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No recent activity found
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Employee Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm text-gray-800">{employee.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-sm text-gray-800">{employee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm text-gray-800">{employee.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-800">{employee.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Employment Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Employee ID</p>
                  <p className="text-sm text-gray-800">{employee.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm text-gray-800">{employee.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date Joined</p>
                  <p className="text-sm text-gray-800">{formatDate(employee.date_joined)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employment Type</p>
                  <p className="text-sm text-gray-800">{employee.schedule || 'Full-time'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AttendanceDetailsTab Component - Updated to use real DB data
const AttendanceDetailsTab = ({ employee }) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch employee's attendance history
    const fetchAttendanceHistory = async () => {
      try {
        setIsLoading(true);
        // If you have a function to get attendance for a specific employee
        // If not, this could be filtered from employee.attendanceHistory
        if (employee.attendanceHistory) {
          setAttendanceHistory(employee.attendanceHistory || []);
        } else {
          // Use the monthly attendance summary and filter for this employee
          const today = new Date();
          const month = today.getMonth() + 1;
          const year = today.getFullYear();
          
          const summary = await getMonthlyAttendanceSummary(month, year);
          const employeeAttendance = summary.filter(record => record.employee_id === employee.id);
          setAttendanceHistory(employeeAttendance || []);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (employee?.id) {
      fetchAttendanceHistory();
    }
  }, [employee?.id]);
  
  // Calculate attendance metrics
  const calculateAttendanceMetrics = () => {
    if (!attendanceHistory || !Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return {
        attendanceRate: employee.attendance_rate || '100',
        totalHours: 0,
        lastAbsence: 'None recorded',
        presentDays: 0,
        absentDays: 0
      };
    }
    
    const presentDays = attendanceHistory.filter(record => 
      record && (record.status === 'Present' || record.status === 'Late')).length;
    const absentDays = attendanceHistory.filter(record => 
      record && record.status === 'Absent').length;
    const totalDays = attendanceHistory.length;
    
    // Calculate attendance rate with safeguards
    const attendanceRate = totalDays > 0 
      ? ((presentDays / totalDays) * 100).toFixed(1)
      : employee.attendance_rate || '100';
    
    // Calculate total hours with better error handling
    const totalHours = attendanceHistory.reduce((sum, record) => {
      const hours = parseFloat(record.hours_worked || 0);
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    
    // Find last absence with proper sorting
    const absences = attendanceHistory.filter(record => record && record.status === 'Absent');
    const lastAbsence = absences.length > 0 
      ? [...absences].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date 
      : 'None recorded';
    
    return {
      attendanceRate,
      totalHours,
      lastAbsence,
      presentDays,
      absentDays
    };
  };
  
  const metrics = calculateAttendanceMetrics();
  
  if (isLoading) {
    <LoadingSpinner message="Loading Attendance Data" />
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Attendance Summary Card */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Attendance Rate</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">{metrics.attendanceRate}%</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Hours Worked</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">
              {metrics.totalHours} hrs
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Last Absence</div>
            <div className="mt-1 text-lg font-semibold text-gray-800">
              {metrics.lastAbsence !== 'None recorded' ? formatDate(metrics.lastAbsence) : 'None recorded'}
            </div>
          </div>
        </div>
        
        {/* Additional stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600">Present days: {metrics.presentDays}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-600">Absent days: {metrics.absentDays}</span>
          </div>
        </div>
      </div>
      
      {/* Attendance History Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Attendance History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceHistory.length > 0 ? (
                attendanceHistory
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record, index) => (
                  <tr key={record.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attendanceStatusColors[record.status] || 'bg-gray-100 text-gray-800'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.clock_in || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.clock_out || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.hours_worked || 0} hrs
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Attendance Trends */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Attendance Trends</h3>
        <div className="text-center text-gray-500 py-4">
          {attendanceHistory.length > 0 ? (
            <div>
              <p className="mb-4">Monthly attendance visualization would go here</p>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-800">{metrics.attendanceRate}%</p>
                  <p className="text-sm text-gray-500">Average Attendance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-800">
                    {(metrics.totalHours / Math.max(1, metrics.presentDays)).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">Avg Hours/Day</p>
                </div>
              </div>
            </div>
          ) : (
            <p>Not enough data to display attendance trends</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Add the missing PerformanceDetailsTab component
const PerformanceDetailsTab = ({ employee }) => {
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch employee's performance reviews
    const fetchEmployeePerformance = async () => {
      try {
        setIsLoading(true);
        const reviews = await getEmployeePerformanceReviews(employee.id);
        setPerformanceReviews(reviews || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (employee?.id) {
      fetchEmployeePerformance();
    }
  }, [employee?.id]);
  
  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    const completedReviews = performanceReviews.filter(review => 
      review.status === 'Completed' && review.rating
    );
    
    if (completedReviews.length === 0) {
      return employee.performance_rating || 0;
    }
    
    const sum = completedReviews.reduce((total, review) => 
      total + parseFloat(review.rating || 0), 0);
    return (sum / completedReviews.length).toFixed(1);
  };
  
  const avgRating = calculateAverageRating();
  
  // Get latest completed review
  const getLatestReview = () => {
    return performanceReviews
      .filter(review => review.status === 'Completed')
      .sort((a, b) => new Date(b.completion_date || b.scheduled_date) - 
                       new Date(a.completion_date || a.scheduled_date))[0];
  };
  
  // Get performance level description based on rating
  const getPerformanceLevel = (rating) => {
    if (rating >= 4.5) return 'Outstanding performer';
    if (rating >= 4.0) return 'Exceeds expectations';
    if (rating >= 3.0) return 'Meets expectations';
    if (rating >= 2.0) return 'Needs improvement';
    if (rating > 0) return 'Unsatisfactory';
    return 'Not yet rated';
  };
  
  if (isLoading) {
    <LoadingSpinner message="Loading Performance Data" />
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Performance Summary Card */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Summary</h3>
        <div className="flex items-center mb-6">
          <div className="mr-6">
            <div className="text-sm font-medium text-gray-500">Overall Rating</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">
              {avgRating > 0 ? `${avgRating}/5.0` : 'Not rated'}
            </div>
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= Math.floor(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {getPerformanceLevel(parseFloat(avgRating))}
            </div>
          </div>
        </div>
        
        {/* Average metrics from all reviews */}
        <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Latest Review</span>
              <span className="text-sm font-medium text-gray-900">
                {getLatestReview()?.completion_date ? formatDate(getLatestReview().completion_date) : 'None'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${getLatestReview()?.rating ? (getLatestReview().rating / 5) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Reviews Completed</span>
              <span className="text-sm font-medium text-gray-900">
                {performanceReviews.filter(r => r.status === 'Completed').length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Reviews List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Performance Reviews</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {performanceReviews.length > 0 ? (
            performanceReviews.map(review => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-800 mr-2">
                        {review.review_type} Review
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs leading-none rounded-full 
                        ${review.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          review.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                          review.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {review.status}
                      </span>
                      {review.status === 'Completed' && (
                        <div className="flex ml-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= Math.floor(review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-xs text-gray-500">{review.rating || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                    {review.summary && (
                      <p className="text-sm text-gray-600 mt-2">{review.summary}</p>
                    )}
                    <div className="mt-1 text-xs text-gray-500">
                      Reviewer: {review.reviewer ? review.reviewer.name : 'Unassigned'}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {review.status === 'Completed' 
                        ? `Completed: ${formatDate(review.completion_date)}` 
                        : `Scheduled: ${formatDate(review.scheduled_date)}`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No performance reviews found for this employee
            </div>
          )}
        </div>
      </div>
      
      {/* Goals & Development - This could be updated later with actual goals data */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Goals & Development</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Goals</h4>
            <p className="text-sm text-gray-500 italic">
              {performanceReviews.length > 0 
                ? 'Goals are based on latest performance review'
                : 'No goals have been set yet'}
            </p>
            {getLatestReview()?.summary && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">{getLatestReview().summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated PayrollTab component with real data fetching
const PayrollTab = ({ employee }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalaryHistoryLoading, setIsSalaryHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salaryHistoryError, setSalaryHistoryError] = useState(null);
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState({ show: false, type: '', text: '' });
  
  useEffect(() => {
    const fetchPayrollHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getEmployeePayrollHistory(employee.id);
        setPaymentHistory(data);
      } catch (err) {
        console.error('Error fetching employee payroll history:', err);
        setError('Failed to load payroll history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchSalaryHistory = async () => {
      try {
        setIsSalaryHistoryLoading(true);
        const data = await getEmployeeSalaryHistory(employee.id);
        setSalaryHistory(data);
      } catch (err) {
        console.error('Error fetching employee salary history:', err);
        setSalaryHistoryError('Failed to load salary history. Please try again later.');
      } finally {
        setIsSalaryHistoryLoading(false);
      }
    };
    
    fetchPayrollHistory();
    fetchSalaryHistory();
  }, [employee.id]);
  
  // Handle payslip download
  const handlePayslipDownload = async (payment) => {
    try {
      setDownloadingPayslip(true);
      setDownloadMessage({ show: true, type: 'info', text: 'Generating payslip...' });
      
      await generatePayslipPDF(payment, employee);
      
      setDownloadMessage({ show: true, type: 'success', text: 'Payslip downloaded successfully!' });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setDownloadMessage({ show: false, type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Error generating payslip:', err);
      let errorMessage = 'Failed to generate payslip. Please try again.';
      
      // More specific error messages based on the error
      if (err.message && err.message.includes('missing required fields')) {
        errorMessage = 'Payslip could not be generated due to missing payment data.';
      } else if (err.message && err.message.includes('Missing required payment')) {
        errorMessage = 'Employee payment details are incomplete.';
      }
      
      setDownloadMessage({ show: true, type: 'error', text: errorMessage });
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setDownloadMessage({ show: false, type: '', text: '' });
      }, 5000);
    } finally {
      setDownloadingPayslip(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Download notification message */}
      {downloadMessage.show && (
        <div className={`p-4 rounded-md ${
          downloadMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          downloadMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {downloadMessage.type === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {downloadMessage.type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 000 2h2a1 1 0 000-2H9z" clipRule="evenodd" />
                <path d="M10 6a1 1 0 011 1v3a1 1 0 11-2 0V7a1 1 0 011-1z" />
              </svg>
            )}
            {downloadMessage.type === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            )}
            <span>{downloadMessage.text}</span>
          </div>
        </div>
      )}
    
      {/* Payroll Summary Card */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Payroll Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Annual Salary</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">{formatCurrency(employee.salary)}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Monthly Salary</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">{formatCurrency(employee.salary / 12)}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Last Pay Increase</div>
            <div className="mt-1 text-lg font-semibold text-gray-800">{employee.last_pay_increase_date || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      {/* Payment History */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Payment History</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
            <p className="text-gray-500">Loading payment history...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {paymentHistory.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.pay_period_start)} - {formatDate(payment.pay_period_end)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(payment.gross_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(payment.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.net_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'Voided' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handlePayslipDownload(payment)}
                          disabled={downloadingPayslip}
                          className={`text-blue-600 hover:text-blue-900 mr-4 flex items-center ${downloadingPayslip ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {downloadingPayslip ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download size={16} className="mr-1" /> Payslip
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No payment history found for this employee.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Compensation History */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Compensation History</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">Current Salary</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(employee.salary)}</span>
              </div>
              <div className="text-sm text-gray-500">Effective from {formatDate(employee.date_joined)}</div>
            </div>
            
            <div className="pt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Salary History</h4>
              {isSalaryHistoryLoading ? (
                <div className="py-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading salary history...</p>
                </div>
              ) : salaryHistoryError ? (
                <div className="py-4 text-center">
                  <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-sm">{salaryHistoryError}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salaryHistory.length > 0 ? (
                    salaryHistory.map((history) => (
                      <div key={history.id} className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(history.salary_amount)}</div>
                          <div className="text-xs text-gray-500">
                            From {formatDate(history.effective_from)} to {history.effective_to ? formatDate(history.effective_to) : 'Present'}
                          </div>
                          {history.reason && <div className="text-xs text-gray-500 mt-1">Reason: {history.reason}</div>}
                        </div>
                        {history.percentage_change > 0 && (
                          <div className="text-sm text-green-600">+{history.percentage_change}% increase</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 py-2">No salary history records found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Attendance Tab Component
const AttendanceTab = ({ attendanceData = [], statistics = {}, employees = [], isLoading = false }) => {
  const [view, setView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceForms, setAttendanceForms] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState({ type: '', text: '' });
  
  // Initialize attendance forms when employees or date changes
  useEffect(() => {
    if (Array.isArray(employees) && employees.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Create initial form state for each employee
      const initialForms = {};
      employees.forEach(employee => {
        // Find if attendance is already recorded for today
        const todayAttendance = Array.isArray(attendanceData) && 
          attendanceData.find(record => record.employee_id === employee.id && record.date === todayStr);
        
        initialForms[employee.id] = {
          status: todayAttendance?.status || 'Present',
          clockIn: todayAttendance?.clock_in || '08:00',
          clockOut: todayAttendance?.clock_out || '17:00',
          notes: todayAttendance?.notes || '',
          isRecorded: !!todayAttendance,
          recordId: todayAttendance?.id || null
        };
      });
      
      setAttendanceForms(initialForms);
    }
  }, [employees, attendanceData]);
  
  // Handle form field changes
  const handleAttendanceChange = (employeeId, field, value) => {
    setAttendanceForms(prevForms => ({
      ...prevForms,
      [employeeId]: {
        ...prevForms[employeeId],
        [field]: value
      }
    }));
    
    // If changing status, update clock times for special cases
    if (field === 'status' && value !== 'Present' && value !== 'Late') {
      setAttendanceForms(prevForms => ({
        ...prevForms,
        [employeeId]: {
          ...prevForms[employeeId],
          clockIn: '',
          clockOut: '',
        }
      }));
    }
  };
  
  // Calculate hours worked based on clock in/out
  const calculateHoursWorked = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;
    
    try {
      const [inHours, inMinutes] = clockIn.split(':').map(Number);
      const [outHours, outMinutes] = clockOut.split(':').map(Number);
      
      let hours = outHours - inHours;
      let minutes = outMinutes - inMinutes;
      
      if (minutes < 0) {
        hours -= 1;
        minutes += 60;
      }
      
      return parseFloat((hours + (minutes / 60)).toFixed(1));
    } catch (error) {
      console.error('Error calculating hours worked:', error);
      return 0;
    }
  };
  
  // Handle saving attendance for a single employee
  const handleSaveAttendance = async (employeeId) => {
    try {
      setSavingAttendance(true);
      setAttendanceMessage({ type: '', text: '' });
      
      const form = attendanceForms[employeeId];
      if (!form) {
        throw new Error("Form data not found for employee");
      }
      
      const today = new Date().toISOString().split('T')[0];
      const hoursWorked = (form.status === 'Present' || form.status === 'Late') ? 
        calculateHoursWorked(form.clockIn, form.clockOut) : 0;
      
      const attendanceRecord = {
        employeeId: employeeId,
        date: today,
        status: form.status,
        hours_worked: hoursWorked,
        notes: form.notes
      };
      
      if (form.recordId) {
        attendanceRecord.id = form.recordId;
      }
      
      // Call the recordAttendance function
      const result = await recordAttendance(attendanceRecord);
      
      // Update the form state to show as recorded
      setAttendanceForms(prevForms => ({
        ...prevForms,
        [employeeId]: {
          ...prevForms[employeeId],
          isRecorded: true,
          recordId: result.id
        }
      }));
      
      setAttendanceMessage({ 
        type: 'success', 
        text: `Attendance ${form.isRecorded ? 'updated' : 'recorded'} for ${employees.find(e => e.id === employeeId)?.name}`
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setAttendanceMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      // Get form here to avoid reference error
      const form = attendanceForms[employeeId];
      setAttendanceMessage({ 
        type: 'error', 
        text: `Failed to ${form?.isRecorded ? 'update' : 'record'} attendance. Please try again.`
      });
    } finally {
      setSavingAttendance(false);
    }
  };
  
  // Handle batch save of all attendance records
  const handleBatchSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      setAttendanceMessage({ type: '', text: '' });
      
      const today = new Date().toISOString().split('T')[0];
      const savePromises = [];
      
      // Prepare all attendance records that have been changed
      for (const [employeeId, form] of Object.entries(attendanceForms)) {
        const hoursWorked = (form.status === 'Present' || form.status === 'Late') ? 
          calculateHoursWorked(form.clockIn, form.clockOut) : 0;
        
        const attendanceRecord = {
          employeeId: employeeId,
          date: today,
          status: form.status,
          hours_worked: hoursWorked,
          notes: form.notes,
          id: form.recordId // Include ID for updates if it exists
        };
        
        savePromises.push(recordAttendance(attendanceRecord));
      }
      
      // Wait for all save operations to complete
      const results = await Promise.all(savePromises);
      
      // Update all forms as recorded
      const updatedForms = { ...attendanceForms };
      results.forEach((result, index) => {
        const employeeId = Object.keys(attendanceForms)[index];
        if (employeeId) {
          updatedForms[employeeId].isRecorded = true;
          updatedForms[employeeId].recordId = result.id;
        }
      });
      
      setAttendanceForms(updatedForms);
      
      setAttendanceMessage({ 
        type: 'success', 
        text: 'All attendance records have been saved successfully'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setAttendanceMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Error saving batch attendance:', error);
      setAttendanceMessage({ 
        type: 'error', 
        text: 'Failed to save attendance records. Please try again.'
      });
    } finally {
      setSavingAttendance(false);
    }
  };
  
  // Process attendance data for display
  const processAttendanceData = () => {
    // Ensure attendanceData is an array before processing
    const validAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];
    console.log("Processing attendance data:", validAttendanceData);
    
    if (validAttendanceData.length === 0) {
      return {
        daily: {},
        weekly: {},
        monthly: {
          summary: [],
          statistics: statistics || {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            attendanceRate: 0
          }
        }
      };
    }
    
    // Process for daily view (filter by selected date)
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dailyAttendance = {};
    
    // Group daily attendance by employee
    validAttendanceData
      .filter(record => record && record.date === selectedDateStr)
      .forEach(record => {
        // Store all fields from the record including clock times
        dailyAttendance[record.employee_id] = {
          ...record,
          // Set defaults for optional fields
          clock_in: record.clock_in || '08:00',
          clock_out: record.clock_out || '17:00',
          hours_worked: record.hours_worked || 8,
          notes: record.notes || ''
        };
      });
    
    // Process for weekly view
    const weeklyAttendance = {};
    
    // Get the Monday of the current week
    const dayOfWeek = selectedDate.getDay() || 7; // Convert Sunday (0) to 7
    const mondayDate = new Date(selectedDate);
    mondayDate.setDate(selectedDate.getDate() - dayOfWeek + 1);
    
    // Get array of dates for the week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    
    // Group weekly attendance by employee and date
    validAttendanceData.forEach(record => {
      if (record && weekDates.includes(record.date)) {
        if (!weeklyAttendance[record.employee_id]) {
          weeklyAttendance[record.employee_id] = {
            employee: record.employees,
            days: {}
          };
        }
        weeklyAttendance[record.employee_id].days[record.date] = record;
      }
    });
    
    // Process for monthly view
    const monthYear = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate monthly statistics
    const monthRecords = validAttendanceData.filter(record => record && record.date && record.date.startsWith(monthYear));
    
    const statusCounts = monthRecords.reduce((acc, record) => {
      acc.total++;
      if (record.status) {
        const status = record.status.toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    }, { total: 0, present: 0, absent: 0, late: 0 });
    
    // Calculate attendance rate with proper error handling
    const presentAndLate = (statusCounts.present || 0) + (statusCounts.late || 0);
    const attendanceRate = statusCounts.total > 0
      ? ((presentAndLate / statusCounts.total) * 100).toFixed(1)
      : "0.0";
    
    // Group monthly attendance by employee
    const monthlySummary = [];
    const employeeMonthStats = {};
    
    monthRecords.forEach(record => {
      if (!record || !record.employee_id) return;
      
      const empId = record.employee_id;
      
      if (!employeeMonthStats[empId]) {
        employeeMonthStats[empId] = {
          id: empId,
          name: record.employees?.name || 'Unknown',
          jobTitle: record.employees?.job_title || 'Unknown',
          imageUrl: emp,
          present: 0,
          absent: 0,
          late: 0,
          totalHours: 0,
          attendanceRate: 0
        };
      }
      
      if (record.status) {
        const status = record.status.toLowerCase();
        employeeMonthStats[empId][status] = (employeeMonthStats[empId][status] || 0) + 1;
      }
      employeeMonthStats[empId].totalHours += record.hours_worked || 0;
    });
    
    // Calculate attendance rates and prepare summary
    Object.values(employeeMonthStats).forEach(empStats => {
      const totalDays = empStats.present + empStats.absent + empStats.late;
      empStats.attendanceRate = totalDays 
        ? ((empStats.present + empStats.late) / totalDays * 100).toFixed(1)
        : 0;
      
      monthlySummary.push(empStats);
    });
    
    return {
      daily: dailyAttendance,
      weekly: weeklyAttendance,
      monthly: {
        summary: monthlySummary,
        statistics: {
          total: statusCounts.total,
          present: statusCounts.present || 0,
          absent: statusCounts.absent || 0,
          late: statusCounts.late || 0,
          attendanceRate: parseFloat(attendanceRate)
        }
      }
    };
  };

  const processedData = processAttendanceData();
  
  // Helper function to format time display
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '—';
    
    try {
      // Handle different time formats
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      } else if (timeString.length === 4) {
        // Handle military time format like "0800"
        const hours = parseInt(timeString.substring(0, 2), 10);
        const minutes = parseInt(timeString.substring(2), 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      return timeString;
    } catch (error) {
      return timeString;
    }
  };
  
  // Handle date navigation
  const navigatePrevious = () => {
    const newDate = new Date(selectedDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };
  
  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate week date range for display
  const weekDateRange = () => {
    const dayOfWeek = selectedDate.getDay() || 7; // Convert Sunday (0) to 7
    const mondayDate = new Date(selectedDate);
    mondayDate.setDate(selectedDate.getDate() - dayOfWeek + 1);
    
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    
    const options = { month: 'long', day: 'numeric' };
    return `${mondayDate.toLocaleDateString('en-US', options)} - ${sundayDate.toLocaleDateString('en-US', options)}, ${mondayDate.getFullYear()}`;
  };
  
  // Get date for weekday column headers
  const getWeekDayDate = (dayOffset) => {
    const dayOfWeek = selectedDate.getDay() || 7; // Convert Sunday (0) to 7
    const mondayDate = new Date(selectedDate);
    mondayDate.setDate(selectedDate.getDate() - dayOfWeek + 1);
    
    const date = new Date(mondayDate);
    date.setDate(mondayDate.getDate() + dayOffset);
    
    return {
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOffset],
      date: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      isoDate: date.toISOString().split('T')[0]
    };
  };
  
  // Handle form submission for recording attendance
  const handleRecordAttendance = async (employeeId) => {
    // Implement the form submission logic here
    // For now, this is a placeholder
    console.log("Recording attendance for:", employeeId);
  };

  return (
    <div>
      {/* Updated KPI Cards with real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Present Today Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Present Today</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mt-1">
                  {statistics.presentToday || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <UserCheck size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              <span>{statistics.attendanceRateToday || 0}% today's attendance rate</span>
            </div>
          </div>
        </div>
        
        {/* Absent Today Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Absent Today</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500 mt-1">
                  {statistics.absentToday || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                <UserX size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600 flex items-center">
              <AlertTriangle size={14} className="mr-1" />
              <span>{statistics.absentToday > 0 ? 'Action may be required' : 'No absences today'}</span>
            </div>
          </div>
        </div>
        
        {/* Late Arrivals Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Late Arrivals</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500 mt-1">
                  {statistics.lateToday || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400">
                <Clock size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-yellow-600 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              <span>{statistics.lateToday > 0 ? 'Review needed' : 'No late arrivals'}</span>
            </div>
          </div>
        </div>
        
        {/* Total Employees Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mt-1">
                  {employees.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Users size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <Info size={14} className="mr-1" />
              <span>Monthly avg: {statistics.attendanceRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar navigation with improved styling */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                view === 'day' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md ml-2 transition-all duration-300 ${
                view === 'week' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md ml-2 transition-all duration-300 ${
                view === 'month' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={navigatePrevious}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="mx-4 text-sm font-medium text-gray-700">
              {view === 'day' && formatDate(selectedDate)}
              {view === 'week' && weekDateRange()}
              {view === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={navigateNext}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <ChevronRight size={20} />
            </button>
            <button 
              onClick={goToToday}
              className="ml-4 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
            >
              Today
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : view === 'day' && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Attendance - {formatDate(selectedDate)}</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(employees) && employees.length > 0 ? (
                  employees.map(employee => {
                    // Find attendance record for this employee on the selected date
                    const record = processedData.daily[employee.id];
                    console.log(processedData);
                    
                    return (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={emp} 
                                alt={employee.name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.job_title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record ? (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === 'Present' ? 'bg-green-100 text-green-800' : 
                              record.status === 'Absent' ? 'bg-red-100 text-red-800' : 
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {record.status}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not recorded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record ? formatTimeDisplay(record.clock_in) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record ? formatTimeDisplay(record.clock_out) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record ? record.hours_worked : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record?.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No employee data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {view === 'week' && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Weekly Attendance - {weekDateRange()}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    {Array.from({ length: 7 }, (_, i) => {
                      const dateObj = getWeekDayDate(i);
                      return (
                        <th key={i} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {dateObj.day}<br/>{dateObj.month} {dateObj.date}
                        </th>
                      );
                    })}
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(employees) && employees.length > 0 ? (
                    employees.map(employee => {
                      // Get this employee's weekly attendance
                      const weekData = processedData.weekly[employee.id] || { days: {} };
                      
                      // Calculate total hours
                      let totalHours = 0;
                      Object.values(weekData.days || {}).forEach(day => {
                        totalHours += day.hours_worked || 0;
                      });
                      
                      return (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img 
                                  className="h-10 w-10 rounded-full" 
                                  src={emp} 
                                  alt={employee.name} 
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                <div className="text-sm text-gray-500">{employee.job_title}</div>
                              </div>
                            </div>
                          </td>
                          {Array.from({ length: 7 }, (_, i) => {
                            const dateObj = getWeekDayDate(i);
                            const dayRecord = weekData.days?.[dateObj.isoDate];
                            
                            return (
                              <td key={i} className="px-6 py-4 text-center">
                                {dayRecord ? (
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    dayRecord.status === 'Present' ? 'bg-green-100 text-green-800' : 
                                    dayRecord.status === 'Absent' ? 'bg-red-100 text-red-800' : 
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {dayRecord.status}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {totalHours > 0 ? `${totalHours}h` : '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        No employee data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {view === 'month' && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Monthly Attendance - {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Statistics</h4>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Total Working Days</dt>
                        <dd className="mt-1 text-sm text-gray-900">{processedData.monthly.statistics.total}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Avg. Attendance Rate</dt>
                        <dd className="mt-1 text-sm text-gray-900">{processedData.monthly.statistics.attendanceRate}%</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Total Present Days</dt>
                        <dd className="mt-1 text-sm text-gray-900">{processedData.monthly.statistics.present}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Total Absent Days</dt>
                        <dd className="mt-1 text-sm text-gray-900">{processedData.monthly.statistics.absent}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Total Late Days</dt>
                        <dd className="mt-1 text-sm text-gray-900">{processedData.monthly.statistics.late}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Avg. Working Hours</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {processedData.monthly.statistics.total ? 
                            (processedData.monthly.summary.reduce((acc, emp) => acc + emp.totalHours, 0) / 
                              processedData.monthly.statistics.total).toFixed(1) + ' hrs/day' : 
                            '0 hrs/day'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Trends</h4>
                <div className="h-64 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  <p className="text-gray-500">Attendance trend chart would go here</p>
                </div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mt-6 mb-2">Employee Attendance Summary</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.monthly.summary.length > 0 ? (
                  processedData.monthly.summary.map(employee => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={emp} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.jobTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.late}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.totalHours.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">
                            {employee.attendanceRate}%
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                employee.attendanceRate >= 98 ? 'bg-green-600' : 
                                employee.attendanceRate >= 95 ? 'bg-green-500' : 
                                'bg-amber-500'
                              }`} 
                              style={{ width: `${employee.attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No attendance data available for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 p-6 mt-6">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mt-6 mb-5"></div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Record Attendance</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            
            <button 
              onClick={handleBatchSaveAttendance}
              disabled={savingAttendance}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                savingAttendance ? 'bg-green-400' : 'bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90'
              } focus:outline-none transition-all duration-300`}
            >
              {savingAttendance ? 'Saving...' : 'Save All Records'}
            </button>
          </div>
        </div>
        
        {/* Success/Error message */}
        {attendanceMessage.text && (
          <div className={`mb-4 p-3 rounded-md ${
            attendanceMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {attendanceMessage.text}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(employees) && employees.length > 0 ? (
                employees.map(employee => {
                  const form = attendanceForms[employee.id] || {
                    status: 'Present',
                    clockIn: '08:00',
                    clockOut: '17:00',
                    notes: '',
                    isRecorded: false
                  };
                  
                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={emp} 
                              alt={employee.name} 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.job_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={form.status}
                          onChange={(e) => handleAttendanceChange(employee.id, 'status', e.target.value)}
                          className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                          <option value="Vacation">Vacation</option>
                          <option value="Sick">Sick Leave</option>
                          <option value="Holiday">Holiday</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="time"
                          value={form.clockIn}
                          onChange={(e) => handleAttendanceChange(employee.id, 'clockIn', e.target.value)}
                          disabled={form.status !== 'Present' && form.status !== 'Late'}
                          className={`block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            form.status !== 'Present' && form.status !== 'Late' ? 'bg-gray-100' : ''
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="time"
                          value={form.clockOut}
                          onChange={(e) => handleAttendanceChange(employee.id, 'clockOut', e.target.value)}
                          disabled={form.status !== 'Present' && form.status !== 'Late'}
                          className={`block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            form.status !== 'Present' && form.status !== 'Late' ? 'bg-gray-100' : ''
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="text"
                          value={form.notes}
                          onChange={(e) => handleAttendanceChange(employee.id, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                          className="block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleSaveAttendance(employee.id)}
                          disabled={savingAttendance}
                          className={`text-${form.isRecorded ? 'blue' : 'green'}-600 hover:text-${form.isRecorded ? 'blue' : 'green'}-900`}
                        >
                          {form.isRecorded ? 'Update' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No employee data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
  
  // Shifts Tab Component
  const ShiftsTab = ({ shiftsData = [], employees = [], onRefreshData = null }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('week');
    const [isLoading, setIsLoading] = useState(false);
    const [localShiftsData, setLocalShiftsData] = useState(shiftsData);
    
    // Modal states for templates
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState(null);
    
    // Shift templates state
    const [shiftTemplates, setShiftTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(true);
    
    // Quick Assign state
    const [assignData, setAssignData] = useState({
      employeeId: '',
      shiftTemplate: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      workingDays: {
        Mon: true,
        Tue: true,
        Wed: true, 
        Thu: true,
        Fri: true,
        Sat: true,
        Sun: true
      }
    });
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignMessage, setAssignMessage] = useState({ type: '', text: '' });
    
    // Days of the week
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
    // Load shifts data when date changes
    useEffect(() => {
      loadShiftsForDate(currentDate);
    }, [currentDate, view]);
    
    // Update local shifts when props change
    useEffect(() => {
      setLocalShiftsData(shiftsData);
    }, [shiftsData]);
    
    // Load shift templates from the database
    useEffect(() => {
      const loadShiftTemplates = async () => {
        try {
          setTemplatesLoading(true);
          const templates = await getShiftTemplates();
          setShiftTemplates(templates);
          setTemplatesLoading(false);
        } catch (error) {
          console.error('Error loading shift templates:', error);
          setTemplatesLoading(false);
        }
      };
      
      loadShiftTemplates();
    }, []);
    
    // Load shifts data for the selected date
    const loadShiftsForDate = async (date) => {
      try {
        setIsLoading(true);
        
        // Calculate week start based on the selected date
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
        const weekStart = new Date(new Date(date).setDate(diff));
        
        // For month view, get the first day of the month
        const monthStart = view === 'month' 
          ? new Date(date.getFullYear(), date.getMonth(), 1)
          : null;
        
        // Fetch shifts data for the selected period
        if (typeof onRefreshData === 'function') {
          await onRefreshData(view === 'month' ? monthStart : weekStart);
        }
        
      } catch (err) {
        console.error('Error loading shifts for selected date:', err);
      } finally {
        setIsLoading(false);
      }
    };
      
    // Handle form field changes for Quick Assign
    const handleAssignChange = (e) => {
      const { name, value, type, checked } = e.target;
      
      if (name.startsWith('day-')) {
        // Handle checkbox changes for working days
        const day = name.split('-')[1]; // Extract day abbreviation (Mon, Tue, etc.)
        setAssignData(prev => ({
          ...prev,
          workingDays: {
            ...prev.workingDays,
            [day]: checked
          }
        }));
      } else {
        // Handle other form fields
        setAssignData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    };
    
    // Add or edit shift template
    const handleTemplateSubmit = async (template) => {
      try {
        if (template.id) {
          // Edit existing template
          await updateShiftTemplate(template.id, template);
          setShiftTemplates(prev => 
            prev.map(t => t.id === template.id ? template : t)
          );
        } else {
          // Add new template - remove empty id field to let Supabase generate a UUID
          const templateData = {...template};
          delete templateData.id;
          
          const newTemplate = await addShiftTemplate(templateData);
          setShiftTemplates(prev => [...prev, newTemplate]);
        }
        setShowTemplateModal(false);
        setTemplateToEdit(null);
      } catch (error) {
        console.error('Error saving shift template:', error);
        toast.error('Failed to save shift template. Please try again.');
      }
    };
    
    // Delete shift template
    const handleDeleteTemplate = async (templateId) => {
      try {
        await deleteShiftTemplate(templateId);
        setShiftTemplates(prev => prev.filter(t => t.id !== templateId));
      } catch (error) {
        console.error('Error deleting shift template:', error);
        toast.error('Failed to delete shift template. Please try again.');
      }
    };
    
    // Edit shift template
    const handleEditTemplate = (template) => {
      setTemplateToEdit(template);
      setShowTemplateModal(true);
    };
      
    // Handle shift assignment submission
    const handleAssignShift = async (e) => {
      e.preventDefault();
      
      // Reset messages at the beginning
      setAssignMessage({ type: '', text: '' });
      
      // Validate inputs
      if (!assignData.employeeId) {
        setAssignMessage({ type: 'error', text: 'Please select an employee' });
        return;
      }
      
      if (!assignData.shiftTemplate) {
        setAssignMessage({ type: 'error', text: 'Please select a shift template' });
        return;
      }
      
      // Check date range validity
      if (new Date(assignData.startDate) > new Date(assignData.endDate)) {
        setAssignMessage({ type: 'error', text: 'End date must be after start date' });
        return;
      }
      
      try {
        setAssignLoading(true);
        setAssignMessage({ type: '', text: '' });
        
        // Find the selected template
        const selectedTemplate = shiftTemplates.find(template => template.id === assignData.shiftTemplate);
        
        if (!selectedTemplate) {
          throw new Error('Selected shift template not found');
        }
        
        // Call the updated assignShifts function
        await assignShifts(
          assignData.employeeId,
          {
            start_time: selectedTemplate.start_time,
            end_time: selectedTemplate.end_time,
            shift_type: selectedTemplate.name.split(' ')[0] // Use first word of the template name as type
          }, 
          {
            startDate: assignData.startDate,
            endDate: assignData.endDate,
            workingDays: assignData.workingDays
          }
        );
        
        // Reset form and show success message
        setAssignData({
          employeeId: '',
          shiftTemplate: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          workingDays: {
            Mon: true,
            Tue: true,
            Wed: true, 
            Thu: true,
            Fri: true,
            Sat: true,
            Sun: true
          }
        });
        
        setAssignMessage({ 
          type: 'success', 
          text: 'Successfully assigned shifts to the employee.' 
        });
        
        // Refresh shift data after a short delay
        setTimeout(() => {
          // Call the refresh function if provided
          if (onRefreshData) onRefreshData(currentDate);
        }, 1500);
        
      } catch (error) {
        console.error('Error assigning shifts:', error);
        setAssignMessage({ 
          type: 'error', 
          text: error.message || 'Failed to assign shifts. Please try again.' 
        });
      } finally {
        setAssignLoading(false);
      }
    };
    
    // Helper function to format shifts for display
    const formatShiftsForDisplay = () => {
      if (!localShiftsData || !Array.isArray(localShiftsData) || localShiftsData.length === 0) {
        return [];
      }
      
      // Group shifts by employee
      const employeeShifts = {};
      
      localShiftsData.forEach(shiftRecord => {
        if (!shiftRecord || !shiftRecord.employee_id || !shiftRecord.shifts) return;
        
        const employeeId = shiftRecord.employee_id;
        
        if (!employeeShifts[employeeId]) {
          // Find employee details from the joined data or employees array
          const employee = shiftRecord.employees || 
                          employees.find(e => e.id === employeeId) || 
                          { name: 'Unknown', job_title: 'Unknown' };
          
          employeeShifts[employeeId] = {
            employeeId,
            name: employee.name,
            jobTitle: employee.job_title,
            shifts: []
          };
        }
        
        // Add each shift from the JSONB array to employee's shifts
        shiftRecord.shifts.forEach(shift => {
          employeeShifts[employeeId].shifts.push({
            day: shift.day,
            date: shift.date,
            startTime: formatTime(shift.start_time),
            endTime: formatTime(shift.end_time),
            shift_type: shift.shift_type,
            colorClass: getShiftColorClass(shift.shift_type)
          });
        });
      });
      
      return Object.values(employeeShifts);
    };
    
    // Helper function to format time 
    const formatTime = (timeString) => {
      if (!timeString) return '';
      
      // Handle different time formats
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      return timeString;
    };
    
    // Helper function to determine shift color based on shift type
    const getShiftColorClass = (shiftType) => {
      switch (shiftType?.toLowerCase()) {
        case 'morning':
          return 'bg-blue-100 border-blue-300';
        case 'day':
          return 'bg-green-100 border-green-300';
        case 'evening':
          return 'bg-purple-100 border-purple-300';
        case 'night':
          return 'bg-gray-100 border-gray-300';
        case 'off':
          return 'bg-gray-50 border-gray-200'; // Light styling for off days
        default:
          return 'bg-blue-100 border-blue-300';
      }
    };
    
    // Get calendar dates for month view
    const getMonthCalendarDates = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // First day of month
      const firstDay = new Date(year, month, 1);
      // Last day of month
      const lastDay = new Date(year, month + 1, 0);
      
      // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
      let firstDayOfWeek = firstDay.getDay();
      // Adjust for Monday as first day of week
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      
      // Create array of date objects for the calendar
      const calendarDates = [];
      
      // Add days from previous month to fill the first row
      const daysFromPrevMonth = firstDayOfWeek;
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const day = new Date(year, month, -i);
        calendarDates.push({
          date: day,
          isCurrentMonth: false,
          isToday: isSameDay(day, new Date())
        });
      }
      
      // Add days from current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const day = new Date(year, month, i);
        calendarDates.push({
          date: day,
          isCurrentMonth: true,
          isToday: isSameDay(day, new Date())
        });
      }
      
      // Add days from next month to complete the grid (6 rows of 7 days)
      const totalDaysNeeded = 42; // 6 rows of 7 days
      const remainingDays = totalDaysNeeded - calendarDates.length;
      for (let i = 1; i <= remainingDays; i++) {
        const day = new Date(year, month + 1, i);
        calendarDates.push({
          date: day,
          isCurrentMonth: false,
          isToday: isSameDay(day, new Date())
        });
      }
      
      return calendarDates;
    };
    
    // Helper to check if two dates are the same day
    const isSameDay = (date1, date2) => {
      return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
    };
    
    // Get all shifts for display
    const formattedShifts = formatShiftsForDisplay();
    
    // Navigate to previous week/month
    const navigatePrevious = () => {
      const newDate = new Date(currentDate);
      if (view === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentDate(newDate);
    };
    
    // Navigate to next week/month
    const navigateNext = () => {
      const newDate = new Date(currentDate);
      if (view === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
    };
    
    // Handler for when view changes (week/month)
    const handleViewChange = (newView) => {
      setView(newView);
      // Reset to current date when switching views to prevent confusion
      if (newView !== view) {
        setCurrentDate(new Date());
      }
    };
      
    // Format date range for display
    const getDateRangeDisplay = () => {
      if (view === 'week') {
        // Calculate the Monday of the current week
        const dayOfWeek = currentDate.getDay() || 7; // Convert Sunday (0) to 7
        const mondayDate = new Date(currentDate);
        mondayDate.setDate(currentDate.getDate() - dayOfWeek + 1);
        
        // Calculate the Sunday of the current week
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        
        // Format dates
        const options = { month: 'long', day: 'numeric' };
        const mondayDisplay = mondayDate.toLocaleDateString('en-US', options);
        const sundayDisplay = sundayDate.toLocaleDateString('en-US', options);
        const year = mondayDate.getFullYear();
        
        return `${mondayDisplay} - ${sundayDisplay}, ${year}`;
      } else {
        // Month view
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    };
    
    // Get shifts for a specific employee on a specific date
    const getEmployeeShiftsForDate = (employeeId, dateStr) => {
      // Find the employee in formatted shifts
      const employee = formattedShifts.find(emp => emp.employeeId === employeeId);
      if (!employee) return [];
      
      // Find shifts for this date
      return employee.shifts.filter(shift => shift.date === dateStr);
    };
    
    // If no shifts or employees, show a placeholder message
    if ((!formattedShifts || formattedShifts.length === 0) && (!employees || employees.length === 0)) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center py-12">
          <p className="text-gray-500">No shift data available to display.</p>
        </div>
      );
    }
    
    return (
      <div>
         <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 p-6 mb-6">
         <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6"></div>
         <div className="pt-5 flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => handleViewChange('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                view === 'week' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-all duration-300`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 ${
                view === 'month' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-all duration-300`}
            >
              Month
            </button>
          </div>
          
          <div className="flex items-center">
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={navigatePrevious}
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="mx-4 text-sm font-medium">
              {getDateRangeDisplay()}
            </span>
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={navigateNext}
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
            <button 
              className="ml-4 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all duration-300"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </button>
          </div>
        </div>
          
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : view === 'week' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white border-b border-gray-200 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    {days.map(day => (
                      <th key={day} className="border-b border-gray-200 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {formattedShifts.length > 0 ? (
                    formattedShifts.map(employee => (
                      <tr key={employee.employeeId}>
                        <td className="sticky left-0 bg-white border-b border-gray-200 px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                src={emp} 
                                alt={employee.name} 
                                className="h-10 w-10 rounded-full"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">
                                {employee.jobTitle}
                              </div>
                            </div>
                          </div>
                        </td>
                        {days.map(day => {
                          const shift = employee.shifts.find(s => s.day === day);
                          return (
                            <td key={day} className="border-b border-gray-200 px-6 py-4">
                              {shift && shift.shift_type !== 'Off' ? (
                                <div className={`px-2 py-2 rounded border ${shift.colorClass}`}>
                                  <div className="text-sm font-medium text-gray-900 text-center">
                                    {`${shift.startTime} - ${shift.endTime}`}
                                  </div>
                                </div>
                              ) : (
                                <div className="px-2 py-2">
                                  {/* Empty cell - no shift or off day */}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={days.length + 1} className="px-6 py-8 text-center text-gray-500 border-b border-gray-200">
                        No shift data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Month view
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {getMonthCalendarDates().map((dateInfo, index) => {
                  const dateStr = dateInfo.date.toISOString().split('T')[0];
                  
                  return (
                    <div 
                      key={index} 
                      className={`min-h-[120px] p-2 ${
                        dateInfo.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                      } ${dateInfo.isToday ? 'bg-yellow-50' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${dateInfo.isToday ? 'text-blue-600' : ''}`}>
                          {dateInfo.date.getDate()}
                        </span>
                      </div>
                      
                      <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '100px' }}>
                        {employees.map(employee => {
                          const empShifts = formattedShifts
                            .find(emp => emp.employeeId === employee.id)?.shifts
                            .filter(shift => shift.date === dateStr && shift.shift_type !== 'Off') || [];
                          
                          return empShifts.length > 0 ? (
                            <div 
                              key={employee.id} 
                              className={`px-1 py-0.5 text-xs rounded truncate ${
                                empShifts[0].colorClass
                              }`}
                              title={`${employee.name}: ${empShifts[0].startTime} - ${empShifts[0].endTime}`}
                            >
                              {employee.name.split(' ')[0]}: {empShifts[0].startTime}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shift Templates Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6"></div>
          <div className="pt-5 flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">
                Shift Templates
              </h3>
              <button 
                onClick={() => {setTemplateToEdit(null); setShowTemplateModal(true);}}
                className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-md hover:opacity-90 transition-all duration-300 shadow-sm"
              >
                Add Template
              </button>
            </div>
            <div className="space-y-4">
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : shiftTemplates.length > 0 ? (
                shiftTemplates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-200 transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-800">{template.name}</h4>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditTemplate(template)}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatTime(template.start_time)} - {formatTime(template.end_time)}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span>Assigned to {formattedShifts.filter(e => 
                        e.shifts.some(s => 
                          s.startTime === formatTime(template.start_time) && 
                          s.endTime === formatTime(template.end_time)
                        )
                      ).length} employees</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No shift templates found. Click "Add Template" to create your first shift template.
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Assign Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6"></div>
              <div className="pt-5">
              <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700 mb-4">
                Quick Assign
              </h3>
            
            {/* Show success/error message */}
            {assignMessage.text && (
              <div className={`mb-4 p-3 rounded-md ${
                assignMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {assignMessage.text}
              </div>
            )}
            
            <form onSubmit={handleAssignShift} className="space-y-4">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={assignData.employeeId}
                  onChange={handleAssignChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                >
                  <option value="">Select an employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="shiftTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Template
                </label>
                <select
                  id="shiftTemplate"
                  name="shiftTemplate"
                  value={assignData.shiftTemplate}
                  onChange={handleAssignChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  disabled={templatesLoading || assignLoading}
                >
                  <option value="">
                    {templatesLoading ? 'Loading templates...' : 'Select a shift'}
                  </option>
                  {!templatesLoading && shiftTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({formatTime(template.start_time)} - {formatTime(template.end_time)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="sr-only">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={assignData.startDate}
                      onChange={handleAssignChange}
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="sr-only">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={assignData.endDate}
                      onChange={handleAssignChange}
                      className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* <div>
                <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayAbbreviations.map(day => (
                    <label key={day} className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        name={`day-${day}`}
                        checked={assignData.workingDays[day]} 
                        onChange={handleAssignChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
                      />
                      <span className="ml-2 text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div> */}
              
              <button 
                type="submit"
                disabled={assignLoading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  assignLoading 
                    ? 'bg-green-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90'
                } transition-all duration-300 focus:outline-none`}
              >
                {assignLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : 'Assign Shift'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Shift Template Modal */}
        {showTemplateModal && (
          <ShiftTemplateModal 
            template={templateToEdit} 
            onClose={() => {setShowTemplateModal(false); setTemplateToEdit(null);}}
            onSubmit={handleTemplateSubmit}
          />
        )}
      </div>
      </div>
    );
  };


  const ShiftTemplateModal = ({ template = null, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      id: template?.id || '',
      name: template?.name || '',
      start_time: template?.start_time || '08:00',
      end_time: template?.end_time || '17:00',
      color_class: template?.color_class || 'bg-blue-100 border-blue-300',
      is_default: template?.is_default || false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      
      try {
        // Create a copy of the form data
        const templateData = {...formData};
        
        // Remove the empty id when creating a new template
        if (!template && templateData.id === '') {
          delete templateData.id;
        }
        
        await onSubmit(templateData);
      } catch (err) {
        setError('Failed to save template. Please try again.');
        console.error('Template submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              {template ? 'Edit Shift Template' : 'Add Shift Template'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Morning Shift"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all duration-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {template ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  template ? 'Update Template' : 'Create Template'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

// Performance Tab Component
const PerformanceTab = ({ 
  performanceData = [], 
  scheduledReviews = [], 
  employees = [], 
  isLoading = false,
  onRefreshData
}) => {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Status colors for reviews
  const reviewStatusColors = {
    'Scheduled': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-amber-100 text-amber-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  
  // Calculate average performance rating from actual performance data
  const calculateAvgRating = () => {
    // Filter only completed reviews with valid ratings
    const completedReviews = performanceData.filter(
      review => review && review.status === 'Completed' && review.rating
    );
    
    if (completedReviews.length === 0) return 0;
    
    // Calculate average rating - ensure proper numeric conversion
    const totalRating = completedReviews.reduce((sum, review) => {
      const rating = parseFloat(review.rating || 0);
      return sum + (isNaN(rating) ? 0 : rating);
    }, 0);
    
    return parseFloat((totalRating / completedReviews.length).toFixed(1));
  };
  
  // Get upcoming reviews from scheduled reviews data
  const getUpcomingReviews = () => {
    return scheduledReviews
      .filter(review => review.status === 'Scheduled' || review.status === 'In Progress')
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  };
  
  // Find top performer based on completed reviews
  const findTopPerformer = () => {
    // Group reviews by employee and calculate average rating per employee
    const employeeRatings = {};
    
    performanceData
      .filter(review => review && review.status === 'Completed' && review.rating && review.employee_id)
      .forEach(review => {
        if (!employeeRatings[review.employee_id]) {
          employeeRatings[review.employee_id] = {
            totalRating: 0,
            count: 0,
            avgRating: 0
          };
        }
        
        employeeRatings[review.employee_id].totalRating += parseFloat(review.rating);
        employeeRatings[review.employee_id].count++;
        employeeRatings[review.employee_id].avgRating = 
          employeeRatings[review.employee_id].totalRating / employeeRatings[review.employee_id].count;
      });
    
    // Find employee with highest rating
    let topEmployeeId = null;
    let topRating = 0;
    
    Object.entries(employeeRatings).forEach(([employeeId, data]) => {
      if (data.avgRating > topRating) {
        topRating = data.avgRating;
        topEmployeeId = employeeId;
      }
    });
    
    // Find full employee data
    if (topEmployeeId) {
      const topEmployee = employees.find(emp => emp.id === topEmployeeId);
      if (topEmployee) {
        return {
          ...topEmployee,
          performance_rating: topRating.toFixed(1)
        };
      }
    }
    
    return null;
  };
  
  // Calculate metrics
  const avgRating = calculateAvgRating();
  const upcomingReviews = getUpcomingReviews();
  const topPerformer = findTopPerformer();

  // Handle opening the modal to create a new review
  const handleNewReview = () => {
    setCurrentReview(null);
    setReviewModalOpen(true);
  };
  
  // Handle opening the modal to edit an existing review
  const handleEditReview = (review) => {
    setCurrentReview(review);
    setReviewModalOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleOpenDeleteConfirm = (review) => {
    setReviewToDelete(review);
    setConfirmDeleteOpen(true);
  };
  
  // Cancel delete action
  const handleCancelDelete = () => {
    setReviewToDelete(null);
    setConfirmDeleteOpen(false);
  };
  
  // Handle submitting review form (create or update)
  const handleSubmitReview = async (formData, reviewId) => {
    setReviewsLoading(true);
    try {
      // Create a clean copy of the data
      const cleanData = { ...formData };
      
      // Handle date fields
      if (!cleanData.completion_date) {
        delete cleanData.completion_date; // Remove empty completion date
      }
      
      if (!cleanData.scheduled_date) {
        cleanData.scheduled_date = new Date().toISOString().split('T')[0]; // Default to today if empty
      }
      
      // Handle rating field
      if (cleanData.status === 'Completed') {
        // Ensure rating is a number for completed reviews
        if (!cleanData.rating || cleanData.rating === '') {
          cleanData.rating = 3.0; // Default rating for completed reviews
        } else {
          // Ensure rating is a number
          cleanData.rating = parseFloat(cleanData.rating);
        }
      } else {
        // Remove rating for non-completed reviews
        delete cleanData.rating;
      }
      
      if (reviewId) {
        // Update existing review
        await updatePerformanceReview(reviewId, cleanData);
        setMessage({ type: 'success', text: 'Performance review updated successfully' });
      } else {
        // Create new review
        await createPerformanceReview(cleanData);
        setMessage({ type: 'success', text: 'Performance review scheduled successfully' });
      }
      
      // Close modal and reset current review
      setReviewModalOpen(false);
      setCurrentReview(null);
      
      // Trigger refresh of performance data
      if (typeof onRefreshData === 'function') {
        await onRefreshData(); // Wait for data to be refreshed
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving performance review:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to save performance review: ${error.message || 'Unknown error'}`
      });
    } finally {
      setReviewsLoading(false);
    }
  };
  
  // Handle deleting a review
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    setReviewsLoading(true);
    try {
      await deletePerformanceReview(reviewToDelete.id);
      
      // Close modal and refresh data
      setConfirmDeleteOpen(false);
      setReviewToDelete(null);
      
      setMessage({ type: 'success', text: 'Performance review deleted successfully' });
      
      // Trigger refresh of performance data
      if (typeof onRefreshData === 'function') {
        onRefreshData();
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting performance review:', error);
      setMessage({ type: 'error', text: 'Failed to delete performance review. Please try again.' });
    } finally {
      setReviewsLoading(false);
    }
  };
  
  // Add null checks for arrays and objects
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center py-12">
        <p className="text-gray-500">No employee data available to display performance metrics.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Success/error message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Performance</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mt-1">
                  {typeof avgRating === 'number' ? `${avgRating.toFixed(1)}` : '0'}/5.0
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <Award size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= Math.round(avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">Team average</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Reviews</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500 mt-1">
                  {upcomingReviews.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400">
                <Calendar size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              {upcomingReviews.slice(0, 2).map((review, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-700">{review.employees?.name || 'Unknown'}</span>
                  <span className="text-gray-500">
                    {formatDate(review.scheduled_date)}
                  </span>
                </div>
              ))}
              {upcomingReviews.length === 0 && (
                <span className="text-xs text-gray-500">No upcoming reviews</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Performer</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mt-1">
                  {topPerformer?.name || "None"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Award size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600 flex items-center">
              <span>Rating: {topPerformer?.performance_rating || "N/A"}/5.0</span>
              <span className="mx-2">•</span>
              <span>{topPerformer?.job_title || ""}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 mb-6">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="p-6">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700 mb-4">Team Performance Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Review
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData
                .filter(review => review && review.employees && review.employee_id)
                .map(review => {
                  const employee = employees.find(e => e.id === review.employee_id) || review.employees;
                  
                  return (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={emp} 
                              alt="" 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{review.employees?.name || employee?.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.employees?.job_title || employee?.job_title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {review.rating || "N/A"}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-4 h-4 ${star <= Math.floor(review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.review_type || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          review.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          review.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                          review.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {review.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.reviewer?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.completion_date ? formatDate(review.completion_date) : 
                        review.scheduled_date ? formatDate(review.scheduled_date) : 'No review yet'}
                      </td>
                    </tr>
                  );
                })}
              {performanceData.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Schedule Performance Review</h3>
            <button 
              onClick={handleNewReview}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none transition-all duration-300 shadow-sm"
              disabled={isLoading || reviewsLoading}
            >
              New Review
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  </td>
                </tr>
              ) : scheduledReviews.length > 0 ? (
                scheduledReviews.map(review => (
                  <tr key={review.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={emp} 
                            alt="" 
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {review.employees?.name || 'Unknown Employee'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.review_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(review.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.reviewer?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reviewStatusColors[review.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {review.status === 'Completed' ? (
                        <button 
                          onClick={() => handleEditReview(review)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={reviewsLoading}
                        >
                          View
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEditReview(review)}
                            className="text-green-600 hover:text-green-900 mr-4"
                            disabled={reviewsLoading}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteConfirm(review)}
                            className="text-red-600 hover:text-red-900"
                            disabled={reviewsLoading}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No scheduled reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      
      {/* Performance Review Modal */}
      <PerformanceReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        review={currentReview}
        employees={employees}
        onSubmit={handleSubmitReview}
        isLoading={reviewsLoading}
      />
      
      {/* Delete Confirmation Dialog */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 my-8 mx-auto">
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-500 -mt-6 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Performance Review</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to cancel this performance review? This action cannot be undone.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                disabled={reviewsLoading}
              >
                No, Keep Review
              </button>
              <button
                onClick={handleDeleteReview}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 transition-all duration-300"
                disabled={reviewsLoading}
              >
                {reviewsLoading ? 'Cancelling...' : 'Yes, Cancel Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Employee Modal Component
const AddEmployeeModal = ({ onClose, onSubmit, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    jobTitle: '',
    department: 'Management',
    dateJoined: '',
    salary: '',
    schedule: 'Full-time',
    photo: null
  });
  
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
    onSubmit(formData);
    onClose();
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
    setCurrentStep(currentStep + 1);
  };
  
  // Go to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 my-8 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Add New Employee</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 1 ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  1
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                  Personal Info
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 2 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 2 ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  2
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                  Job Details
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 3 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 3 ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  3
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                  Review
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
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
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
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
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    ></textarea>
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
                            alt="Employee" 
                            className="h-24 w-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, photo: null})}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md">
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
              
              {/* Step 2: Job Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    >
                      <option value="Management">Management</option>
                      <option value="Animal Care">Animal Care</option>
                      <option value="Milk Production">Milk Production</option>
                      <option value="Administration">Administration</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateJoined" className="block text-sm font-medium text-gray-700 mb-1">
                      Date Joined *
                    </label>
                    <input
                      type="date"
                      id="dateJoined"
                      name="dateJoined"
                      value={formData.dateJoined}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Salary *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="salary"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        required
                        className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Schedule *
                    </label>
                    <select
                      id="schedule"
                      name="schedule"
                      value={formData.schedule}
                      onChange={handleChange}
                      required
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Seasonal">Seasonal</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-800">Review Information</h4>
                  <p className="text-gray-600">Please review the information below before submitting.</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Full Name</h5>
                        <p className="text-gray-800">{formData.firstName} {formData.lastName}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Email</h5>
                        <p className="text-gray-800">{formData.email}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Phone</h5>
                        <p className="text-gray-800">{formData.phone}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Job Title</h5>
                        <p className="text-gray-800">{formData.jobTitle}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Department</h5>
                        <p className="text-gray-800">{formData.department}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Date Joined</h5>
                        <p className="text-gray-800">{formData.dateJoined}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Annual Salary</h5>
                        <p className="text-gray-800">${formData.salary}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Work Schedule</h5>
                        <p className="text-gray-800">{formData.schedule}</p>
                      </div>
                    </div>
                    
                    {formData.address && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Address</h5>
                        <p className="text-gray-800">{formData.address}</p>
                      </div>
                    )}
                    
                    {formData.photo && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Photo</h5>
                        <img 
                          src={URL.createObjectURL(formData.photo)} 
                          alt="Employee" 
                          className="h-24 w-24 object-cover rounded-md mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white z-10">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : 'Add Employee'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

const EditEmployeeModal = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...employee,
    firstName: employee.name.split(' ')[0],
    lastName: employee.name.split(' ')[1] || '',
  });
  
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
    
    // Combine first and last name
    const updatedEmployee = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
    };
    
    // Remove the firstName and lastName fields as they're not part of the original data structure
    delete updatedEmployee.firstName;
    delete updatedEmployee.lastName;
    
    onSave(updatedEmployee);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 mx-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-700">Edit Employee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-4 sm:px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
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
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
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
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Management">Management</option>
                <option value="Animal Care">Animal Care</option>
                <option value="Milk Production">Milk Production</option>
                <option value="Administration">Administration</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              ></textarea>
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
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule *
                </label>
                <select
                  id="schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Salary (₹) *
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                min="0"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none transition-all duration-300"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add this component inside the EmployeeManagement.jsx file
const RecordAttendanceModal = ({ employee, onClose, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    employeeId: employee.id,
    date: today,
    status: 'Present',
    clockIn: '08:00',
    clockOut: '17:00',
    notes: '',
    hoursWorked: 8
  });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Automatically calculate hours worked when clock in/out changes
    if (name === 'clockIn' || name === 'clockOut') {
      const clockIn = name === 'clockIn' ? value : formData.clockIn;
      const clockOut = name === 'clockOut' ? value : formData.clockOut;
      
      if (clockIn && clockOut) {
        const [inHours, inMinutes] = clockIn.split(':').map(Number);
        const [outHours, outMinutes] = clockOut.split(':').map(Number);
        
        let hours = outHours - inHours;
        let minutes = outMinutes - inMinutes;
        
        if (minutes < 0) {
          hours -= 1;
          minutes += 60;
        }
        
        const totalHours = hours + (minutes / 60);
        
        setFormData(prev => ({
          ...prev,
          hoursWorked: totalHours.toFixed(1)
        }));
      }
    }
    
    // If status is not Present or Late, clear clock in/out times
    if (name === 'status' && value !== 'Present' && value !== 'Late') {
      setFormData(prev => ({
        ...prev,
        clockIn: '',
        clockOut: '',
        hoursWorked: 0
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create attendance record
    const attendanceRecord = {
      date: formData.date,
      status: formData.status,
      hoursWorked: parseFloat(formData.hoursWorked),
      notes: formData.notes,
    };
    
    onSave(employee.id, attendanceRecord);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8 mx-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-700">Record Attendance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                <img className="h-12 w-12 rounded-full" src={emp} alt={employee.name} />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">{employee.name}</h4>
                <p className="text-sm text-gray-500">{employee.jobTitle}</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                max={today}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick">Sick Leave</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
            
            {(formData.status === 'Present' || formData.status === 'Late') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clockIn" className="block text-sm font-medium text-gray-700 mb-1">
                    Clock In
                  </label>
                  <input
                    type="time"
                    id="clockIn"
                    name="clockIn"
                    value={formData.clockIn}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="clockOut" className="block text-sm font-medium text-gray-700 mb-1">
                    Clock Out
                  </label>
                  <input
                    type="time"
                    id="clockOut"
                    name="clockOut"
                    value={formData.clockOut}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-700 mb-1">
                Hours Worked
              </label>
              <input
                type="number"
                id="hoursWorked"
                name="hoursWorked"
                value={formData.hoursWorked}
                onChange={handleChange}
                min="0"
                step="0.1"
                disabled={formData.status !== 'Present' && formData.status !== 'Late'}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional notes..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PerformanceReviewModal = ({ 
  isOpen, 
  onClose, 
  review = null, 
  employees = [], 
  onSubmit, 
  isLoading = false 
}) => {
  const isEditing = Boolean(review?.id);
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize form data based on whether we're editing or creating
  const [formData, setFormData] = useState(() => {
    if (review) {
      // When editing, populate form with review data
      return {
        employee_id: review.employee_id || '',
        reviewer_id: review.reviewer_id || '',
        scheduled_date: review.scheduled_date || today,
        completion_date: review.completion_date || '',
        review_type: review.review_type || 'Annual',
        status: review.status || 'Scheduled',
        rating: review.rating || '',
        summary: review.summary || ''
      };
    } else {
      // Default values for new review
      return {
        employee_id: '',
        reviewer_id: '',
        scheduled_date: today,
        completion_date: '',
        review_type: 'Annual',
        status: 'Scheduled',
        rating: '',
        summary: ''
      };
    }
  });

  // Reset form data when review changes (e.g., when switching between different reviews to edit)
  useEffect(() => {
    if (isOpen) {
      if (review) {
        setFormData({
          employee_id: review.employee_id || '',
          reviewer_id: review.reviewer_id || '',
          scheduled_date: review.scheduled_date || today,
          completion_date: review.completion_date || '',
          review_type: review.review_type || 'Annual',
          status: review.status || 'Scheduled',
          rating: review.rating || '',
          summary: review.summary || ''
        });
      } else {
        setFormData({
          employee_id: '',
          reviewer_id: '',
          scheduled_date: today,
          completion_date: '',
          review_type: 'Annual',
          status: 'Scheduled',
          rating: '',
          summary: ''
        });
      }
    }
  }, [review, isOpen, today]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // If status is changed to "Completed", automatically set completion date to today
    if (name === 'status' && value === 'Completed' && !formData.completion_date) {
      setFormData(prevState => ({
        ...prevState,
        completion_date: today
      }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a clean copy of form data for submission
    const cleanData = { ...formData };
    
    // Handle empty fields
    if (cleanData.reviewer_id === '') {
      delete cleanData.reviewer_id;
    }
    
    if (cleanData.completion_date === '') {
      delete cleanData.completion_date;
    }
    
    // Handle rating based on status
    if (cleanData.status === 'Completed') {
      if (!cleanData.rating || cleanData.rating === '') {
        cleanData.rating = 3.0;
      } else {
        cleanData.rating = parseFloat(cleanData.rating);
      }
    } else {
      delete cleanData.rating;
    }
    
    onSubmit(cleanData, isEditing ? review.id : null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            {isEditing ? 'Edit Performance Review' : 'Schedule Performance Review'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1">
                Employee *
              </label>
              <select
                id="employee_id"
                name="employee_id"
                value={formData.employee_id || ''}
                onChange={handleChange}
                disabled={isEditing}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="reviewer_id" className="block text-sm font-medium text-gray-700 mb-1">
                Reviewer
              </label>
              <select
                id="reviewer_id"
                name="reviewer_id"
                value={formData.reviewer_id || ''}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Select Reviewer</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="review_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Review Type *
                </label>
                <select
                  id="review_type"
                  name="review_type"
                  value={formData.review_type}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Annual">Annual</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Special">Special</option>
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  id="scheduled_date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              {(formData.status === 'Completed' || review?.completion_date) && (
                <div>
                  <label htmlFor="completion_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    id="completion_date"
                    name="completion_date"
                    value={formData.completion_date || ''}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
            
            {formData.status === 'Completed' && (
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  value={formData.rating || ''}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  step="0.1"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                rows={4}
                value={formData.summary}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Review notes, feedback, and goals..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all duration-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Review' : 'Schedule Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
  
export default EmployeeManagement;