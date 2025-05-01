import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, Clock, Mail, Phone, MapPin, Users, Award, FileText, Briefcase, User, Download, DollarSign, IndianRupee } from 'lucide-react';
import { 
  fetchEmployees, 
  fetchEmployeeById,
  addEmployee, 
  updateEmployee, 
  recordAttendance,
  getMonthlyAttendanceSummary,
  getAttendanceStatistics,
  getEmployeeShifts,
  getEmployeePerformance,
  getScheduledReviews,
  schedulePerformanceReview,assignShifts
} from './services/employeeService';
import { supabase } from '../lib/supabase';
import emp from './emp.jpg';

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
  const [successMessage, setSuccessMessage] = useState('');
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
          
          setAttendanceData({
            summary,
            statistics
          });
          
          setIsLoading(false);
        } else if (activeTab === 'shifts') {
          setIsLoading(true);
          
          // Get current date for week start
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
          const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
          const weekStart = new Date(today.setDate(diff));
          
          // Fetch shifts data
          const shifts = await getEmployeeShifts(weekStart);
          setShiftsData(shifts);
          
          setIsLoading(false);
        } else if (activeTab === 'performance') {
          setIsLoading(true);
          
          // Fetch performance data
          const performance = await getEmployeePerformance();
          const reviews = await getScheduledReviews();
          
          setPerformanceData(performance);
          setScheduledReviews(reviews);
          
          setIsLoading(false);
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
      const weekStart = new Date(targetDate.setDate(diff));
      
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
      setSuccessMessage('Employee updated successfully!');
      
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
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
      setSuccessMessage('Attendance recorded successfully!');
      
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
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
      setSuccessMessage('Employee added successfully!');
      
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
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
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
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
    <div className="h-full bg-gray-100">
      {selectedEmployee ? (
        <EmployeeProfile 
          employee={selectedEmployee} 
          onClose={closeEmployeeProfile} 
          onEdit={toggleEditModal} 
          onRecordAttendance={toggleAttendanceModal}
          isLoading={isLoading}
        />
      ) : (
        <div className="px-6 py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Employee Management</h1>
            <button 
              onClick={toggleAddModal}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <Plus size={20} className="mr-2" />
              Add Employee
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === 'employees'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === 'attendance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === 'shifts'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shifts
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === 'performance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance
              </button>
            </nav>
          </div>

          {/* Show error message if exists */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Search by name, job title or email..."
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                </div>

                <div>
                  <select
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <option value="All">All Departments</option>
                    {uniqueDepartments.map(department => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map(employee => (
                      <EmployeeCard 
                        key={employee.id} 
                        employee={{
                          ...employee,
                          name: employee.name,
                          jobTitle: employee.job_title,
                          dateJoined: employee.date_joined,
                          image: employee.image_url
                        }} 
                        onClick={() => openEmployeeProfile(employee)} 
                        onRecordAttendance={toggleAttendanceModal} 
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center bg-white rounded-lg shadow">
                      <p className="text-gray-500">No employees found matching your filters</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex space-x-2 overflow-x-auto">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === page ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <AttendanceTab 
              attendanceData={attendanceData} 
              employees={employees} 
              isLoading={isLoading} 
            />
          )}

          {/* Shifts Tab */}
          {activeTab === 'shifts' && (
            <ShiftsTab 
              shiftsData={shiftsData} 
              employees={employees} 
              isLoading={isLoading}
              onRefreshData={refreshShiftsData}
            />
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <PerformanceTab 
              performanceData={performanceData} 
              scheduledReviews={scheduledReviews}
              employees={employees}
              isLoading={isLoading} 
            />
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <AddEmployeeModal 
          onClose={toggleAddModal} 
          onSubmit={handleAddEmployee}
          isLoading={isLoading}
        />
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && employeeToEdit && (
        <EditEmployeeModal
          employee={employeeToEdit}
          onClose={toggleEditModal}
          onSave={handleEditEmployee}
          isLoading={isLoading}
        />
      )}

      {/* Record Attendance Modal */}
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

      {/* Success Message Notification */}
      {successMessage && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fadeIn">
          <p>{successMessage}</p>
        </div>
      )}
    </div>
  );
};

// Employee Card Component - unchanged except for adapted property names
const EmployeeCard = ({ employee, onClick, onRecordAttendance }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center mb-3">
          <img 
            src={emp} 
            alt={employee.name} 
            className="w-16 h-16 object-cover rounded-full bg-gray-200"
          />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">{employee.name}</h3>
            <p className="text-sm text-gray-500">{employee.jobTitle}</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center mb-2">
            <Briefcase size={16} className="text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{employee.department}</span>
          </div>
          <div className="flex items-center mb-2">
            <Mail size={16} className="text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{employee.email}</span>
          </div>
          <div className="flex items-center">
            <Phone size={16} className="text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{employee.phone}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[employee.status]}`}>
            {employee.status}
          </span>
          <span className="text-sm text-gray-500">
            Since {formatDate(employee.dateJoined)}
          </span>
        </div>
        <div className="mt-4 pt-2 border-t flex justify-end space-x-4" onClick={(e) => e.stopPropagation()}>
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
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-4 p-1 rounded-full hover:bg-green-500 transition-colors duration-200"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold">{employee.name}</h1>
            <span className="ml-4 px-3 py-1 bg-white text-green-600 rounded-full text-sm font-medium">
              {employee.job_title}
            </span>
          </div>
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Basic Info */}
          <div className="lg:w-1/3 mb-8 lg:mb-0 lg:pr-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 flex flex-col items-center">
                <img 
                  src={emp} 
                  alt={employee.name} 
                  className="w-32 h-32 object-cover rounded-full bg-gray-200 mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-800">{employee.name}</h2>
                <p className="text-gray-500">{employee.job_title}</p>
                <span className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${statusColors[employee.status]}`}>
                  {employee.status}
                </span>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center">
                    <Briefcase size={16} className="text-gray-400 mr-3" />
                    <span className="text-gray-600">{employee.department}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail size={16} className="text-gray-400 mr-3" />
                    <span className="text-gray-600">{employee.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-400 mr-3" />
                    <span className="text-gray-600">{employee.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="text-gray-400 mr-3" />
                    <span className="text-gray-600">{employee.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-3" />
                    <span className="text-gray-600">Joined: {formatDate(employee.date_joined)}</span>
                  </div>
                </div>
                
                <div className="mt-6 w-full flex flex-col space-y-2">
                  <button 
                    onClick={() => onEdit(employee)}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => onRecordAttendance(employee)}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'attendance'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'performance'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setActiveTab('payroll')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
            <div className="py-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <OverviewTab employee={employee} />
              )}
              
              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <AttendanceDetailsTab employee={employee} />
              )}
              
              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <PerformanceDetailsTab employee={employee} />
              )}
              
              {/* Payroll Tab */}
              {activeTab === 'payroll' && (
                <PayrollTab employee={employee} />
              )}
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
  // The skills and certifications are now arrays from Supabase
  const skills = employee.skills || [];
  const certifications = employee.certifications || [];
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Performance Rating</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">
                {employee.performance_rating ? `${employee.performance_rating}/5.0` : 'Not rated'}
              </p>
            </div>
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <Award size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{employee.attendance_rate || 100}%</p>
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
              <p className="text-2xl font-semibold text-gray-800 mt-1">{employee.schedule}</p>
            </div>
            <div className="p-2 rounded-full bg-purple-50 text-purple-600">
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
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
    </div>
  );
};

// Add the missing AttendanceDetailsTab component
const AttendanceDetailsTab = ({ employee }) => {
  const attendanceHistory = employee.attendanceHistory || [];

  return (
    <div className="space-y-6">
      {/* Attendance Summary Card */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Attendance Rate</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">{employee.attendance_rate || 100}%</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Hours This Month</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">
              {attendanceHistory.reduce((sum, record) => sum + (record.hours_worked || 0), 0)} hrs
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Last Absence</div>
            <div className="mt-1 text-lg font-semibold text-gray-800">
              {attendanceHistory.find(record => record.status === 'Absent')?.date || 'None recorded'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance History Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Attendance History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((record, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(record.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[record.status] || 'bg-gray-100 text-gray-800'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.hours_worked || 0} hrs
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Add the missing PerformanceDetailsTab component
const PerformanceDetailsTab = ({ employee }) => {
  return (
    <div className="space-y-6">
      {/* Performance Summary Card */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Summary</h3>
        <div className="flex items-center mb-6">
          <div className="mr-6">
            <div className="text-sm font-medium text-gray-500">Overall Rating</div>
            <div className="mt-1 text-2xl font-semibold text-gray-800">
              {employee.performance_rating ? `${employee.performance_rating}/5.0` : 'Not rated'}
            </div>
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= (employee.performance_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {employee.performance_rating >= 4.5 ? 'Outstanding performer' :
               employee.performance_rating >= 4.0 ? 'Exceeds expectations' :
               employee.performance_rating >= 3.0 ? 'Meets expectations' :
               employee.performance_rating >= 2.0 ? 'Needs improvement' :
               employee.performance_rating > 0 ? 'Unsatisfactory' : 'Not yet rated'
              }
            </div>
          </div>
        </div>
        
        {/* Skill Ratings */}
        <h4 className="text-sm font-medium text-gray-700 mb-3">Skill Ratings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Job Knowledge</span>
              <span className="text-sm font-medium text-gray-900">4.2/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '84%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Work Quality</span>
              <span className="text-sm font-medium text-gray-900">4.0/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Teamwork</span>
              <span className="text-sm font-medium text-gray-900">4.5/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Reliability</span>
              <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Reviews List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Performance Reviews</h3>
        </div>
        
        {/* Sample reviews - in a real app, these would come from the database */}
        <div className="divide-y divide-gray-200">
          <ReviewItem 
            date="2023-01-15" 
            reviewer="John Smith" 
            rating={4.7} 
            summary="Alex has been consistently exceeding expectations in their role. Excellent teamwork and problem-solving skills."
          />
          <ReviewItem 
            date="2022-07-10" 
            reviewer="Sarah Johnson" 
            rating={4.5} 
            summary="Great performance in all areas. Consistently delivers high-quality work and maintains positive relationships with colleagues."
          />
          <ReviewItem 
            date="2022-01-05" 
            reviewer="Michael Brown" 
            rating={4.2} 
            summary="Solid performer who has shown significant improvement in technical skills over the past period. Continue developing leadership capabilities."
          />
        </div>
      </div>
      
      {/* Goals & Development */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Goals & Development</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Goals</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Complete advanced training in animal husbandry by Q3</li>
              <li>Improve milk production efficiency by 5% through process optimization</li>
              <li>Lead the implementation of new health monitoring procedures</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Development Areas</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Technical knowledge of new milking equipment</li>
              <li>Leadership skills for team management</li>
              <li>Cross-training in feed management systems</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add the missing PayrollTab component
const PayrollTab = ({ employee }) => {
  return (
    <div className="space-y-6">
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
        
        <div className="overflow-x-auto">
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">April 1-30, 2023</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(employee.salary / 12)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency((employee.salary / 12) * 0.15)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency((employee.salary / 12) * 0.85)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900 mr-4"><Download size={16} className="inline" /> Slip</a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">March 1-31, 2023</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(employee.salary / 12)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency((employee.salary / 12) * 0.15)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency((employee.salary / 12) * 0.85)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900 mr-4"><Download size={16} className="inline" /> Slip</a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">February 1-28, 2023</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(employee.salary / 12)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency((employee.salary / 12) * 0.15)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency((employee.salary / 12) * 0.85)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900 mr-4"><Download size={16} className="inline" /> Slip</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(employee.salary * 0.9)}</div>
                    <div className="text-xs text-gray-500">From {formatDate('2022-04-01')} to {formatDate('2023-03-31')}</div>
                  </div>
                  <div className="text-sm text-green-600">+10% increase</div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(employee.salary * 0.85)}</div>
                    <div className="text-xs text-gray-500">From {formatDate('2021-04-01')} to {formatDate('2022-03-31')}</div>
                  </div>
                  <div className="text-sm text-green-600">+5.9% increase</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Attendance Tab Component
const AttendanceTab = ({ attendanceData = { summary: [], statistics: null }, employees = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('day');
  
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                view === 'day' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 ${
                view === 'week' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 ${
                view === 'month' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>
          
          <div className="flex items-center">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="mx-4 text-sm font-medium">
              {view === 'day' && formatDate(selectedDate)}
              {view === 'week' && 'Week of April 23, 2023'}
              {view === 'month' && 'April 2023'}
            </span>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
            <button className="ml-4 px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Today
            </button>
          </div>
        </div>
        
        {view === 'day' && (
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
                  if (!employee) return null;
                  
                  // Safely access attendanceHistory
                  const attendanceHistory = employee.attendanceHistory || [];
                  
                  // Find today's record or create a placeholder
                  const todayRecord = attendanceHistory.find(
                    record => record && record.date === '2023-04-26'
                  ) || { 
                    status: 'No Record', 
                    hoursWorked: 0,
                    notes: '-' 
                  };
                  
                  return (
                    <tr key={employee.id || Math.random()}>
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
                            <div className="text-sm font-medium text-gray-900">{employee.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{employee.jobTitle || employee.job_title || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attendanceStatusColors[todayRecord.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {todayRecord.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(todayRecord.status === 'Present' || todayRecord.status === 'Late') ? '8:00 AM' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(todayRecord.status === 'Present' || todayRecord.status === 'Late') ? '5:30 PM' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {todayRecord.hoursWorked || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {todayRecord.status === 'Late' ? 'Arrived at 8:30 AM' : todayRecord.notes || '-'}
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
          <h3 className="text-lg font-medium text-gray-800 mb-4">Weekly Attendance - Week of April 23, 2023</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monday<br/>Apr 24
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tuesday<br/>Apr 25
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wednesday<br/>Apr 26
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thursday<br/>Apr 27
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Friday<br/>Apr 28
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(employees) && employees.length > 0 ? (
                  employees.map(employee => {
                    if (!employee) return null;
                    
                    // Safely access attendanceHistory
                    const attendanceHistory = employee.attendanceHistory || [];
                    
                    // Get attendance records for each day with safe checks
                    const mondayRecord = attendanceHistory.find(
                      record => record && record.date === '2023-04-24'
                    );
                    const tuesdayRecord = attendanceHistory.find(
                      record => record && record.date === '2023-04-25'
                    );
                    const wednesdayRecord = attendanceHistory.find(
                      record => record && record.date === '2023-04-26'
                    );
                    
                    // Calculate total hours safely
                    const totalHours = [mondayRecord, tuesdayRecord, wednesdayRecord]
                      .reduce((sum, record) => sum + (record && record.hoursWorked ? record.hoursWorked : 0), 0);
                    
                    return (
                      <tr key={employee.id || Math.random()}>
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
                              <div className="text-sm font-medium text-gray-900">{employee.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{employee.jobTitle || employee.job_title || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {mondayRecord ? (
                            <div>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[mondayRecord.status] || 'bg-gray-100 text-gray-800'}`}>
                                {mondayRecord.status}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">{mondayRecord.hoursWorked || 0} hrs</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {tuesdayRecord ? (
                            <div>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[tuesdayRecord.status] || 'bg-gray-100 text-gray-800'}`}>
                                {tuesdayRecord.status}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">{tuesdayRecord.hoursWorked || 0} hrs</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {wednesdayRecord ? (
                            <div>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[wednesdayRecord.status] || 'bg-gray-100 text-gray-800'}`}>
                                {wednesdayRecord.status}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">{wednesdayRecord.hoursWorked || 0} hrs</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-xs text-gray-500">Scheduled</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-xs text-gray-500">Scheduled</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {totalHours} hrs
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
              <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly Attendance - April 2023</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Statistics</h4>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Total Working Days</dt>
                          <dd className="mt-1 text-sm text-gray-900">21</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Avg. Attendance Rate</dt>
                          <dd className="mt-1 text-sm text-gray-900">96.5%</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Total Present Days</dt>
                          <dd className="mt-1 text-sm text-gray-900">97</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Total Absent Days</dt>
                          <dd className="mt-1 text-sm text-gray-900">3</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Total Late Days</dt>
                          <dd className="mt-1 text-sm text-gray-900">5</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Avg. Working Hours</dt>
                          <dd className="mt-1 text-sm text-gray-900">8.2 hrs/day</dd>
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
                  {employees.map(employee => (
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
                        {employee.id === 'E001' ? '21' : 
                         employee.id === 'E002' ? '21' : 
                         employee.id === 'E003' ? '19' : 
                         employee.id === 'E004' ? '21' : '20'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.id === 'E001' ? '0' : 
                         employee.id === 'E002' ? '0' : 
                         employee.id === 'E003' ? '2' : 
                         employee.id === 'E004' ? '0' : '1'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.id === 'E001' ? '0' : 
                         employee.id === 'E002' ? '1' : 
                         employee.id === 'E003' ? '0' : 
                         employee.id === 'E004' ? '0' : '3'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.id === 'E001' ? '172.5' : 
                         employee.id === 'E002' ? '170.0' : 
                         employee.id === 'E003' ? '114.0' : 
                         employee.id === 'E004' ? '168.0' : '164.5'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">
                            {employee.attendanceRate}%
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${employee.attendanceRate >= 98 ? 'bg-green-600' : employee.attendanceRate >= 95 ? 'bg-green-500' : 'bg-amber-500'}`} 
                              style={{ width: `${employee.attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Record Attendance</h3>
            <div>
              <span className="text-sm text-gray-500">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
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
                {employees.map(employee => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="vacation">Vacation</option>
                        <option value="sick">Sick Leave</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="time"
                        defaultValue="08:00"
                        className="block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="time"
                        defaultValue="17:00"
                        className="block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="text"
                        placeholder="Optional notes..."
                        className="block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-green-600 hover:text-green-900 mr-4">Save</button>
                    </td>
                  </tr>
                ))}
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
        Sat: false,
        Sun: false
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
      const shifts = await getEmployeeShifts(view === 'month' ? monthStart : weekStart);
      setLocalShiftsData(shifts);
      
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
    
    // Handle shift assignment submission
    const handleAssignShift = async (e) => {
      e.preventDefault();
      
      // Validate inputs
      if (!assignData.employeeId) {
        setAssignMessage({ type: 'error', text: 'Please select an employee' });
        return;
      }
      
      if (!assignData.shiftTemplate) {
        setAssignMessage({ type: 'error', text: 'Please select a shift template' });
        return;
      }
      
      // Check if at least one day is selected
      const hasSelectedDay = Object.values(assignData.workingDays).some(value => value === true);
      if (!hasSelectedDay) {
        setAssignMessage({ type: 'error', text: 'Please select at least one working day' });
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
        
        // Map shift template to start/end times
        const shiftTimes = {
          'morning': { start_time: '06:00', end_time: '14:00', shift_type: 'Morning' },
          'day': { start_time: '08:00', end_time: '17:00', shift_type: 'Day' },
          'evening': { start_time: '14:00', end_time: '22:00', shift_type: 'Evening' }
        };
        
        const selectedShift = shiftTimes[assignData.shiftTemplate];
        
        // Call the updated assignShifts function
        await assignShifts(
          assignData.employeeId,
          selectedShift, 
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
            Sat: false,
            Sun: false
          }
        });
        
        setAssignMessage({ 
          type: 'success', 
          text: 'Successfully assigned shifts to the employee.' 
        });
        
        // Refresh shift data after a short delay
        setTimeout(() => {
          // Call the refresh function if provided
          if (onRefreshData) onRefreshData();
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
            startTime: formatTime(shift.start_time),
            endTime: formatTime(shift.end_time),
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
        default:
          return 'bg-blue-100 border-blue-300';
      }
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
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => handleViewChange('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                view === 'week' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 ${
                view === 'month' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
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
              className="ml-4 px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
                    {days.slice(0, 5).map(day => (
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
                        {days.slice(0, 5).map(day => {
                          const shift = employee.shifts.find(s => s.day === day);
                          return (
                            <td key={day} className="border-b border-gray-200 px-6 py-4">
                              {shift ? (
                                <div className={`px-2 py-2 rounded border ${shift.colorClass}`}>
                                  <div className="text-sm font-medium text-gray-900 text-center">
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                </div>
                              ) : (
                                <div className="px-2 py-2">
                                  <div className="text-sm text-gray-500 text-center">Off</div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500 border-b border-gray-200">
                        No shift data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-10">
              <p className="text-gray-500">Month view would display a calendar with all shifts for the month</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Shift Templates</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-800">Morning Shift</h4>
                  <div className="flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">6:00 AM - 2:00 PM</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span>Assigned to {formattedShifts.filter(e => e.shifts.some(s => s.startTime.includes('6:00'))).length} employees</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-800">Day Shift</h4>
                  <div className="flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">8:00 AM - 5:00 PM</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span>Assigned to {formattedShifts.filter(e => e.shifts.some(s => s.startTime.includes('8:00'))).length} employees</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-800">Evening Shift</h4>
                  <div className="flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">2:00 PM - 10:00 PM</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span>Assigned to {formattedShifts.filter(e => e.shifts.some(s => s.startTime.includes('2:00 PM'))).length} employees</span>
                </div>
              </div>
              
              <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Add Shift Template
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Quick Assign</h3>
          
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
              >
                <option value="">Select a shift</option>
                <option value="morning">Morning Shift (6:00 AM - 2:00 PM)</option>
                <option value="day">Day Shift (8:00 AM - 5:00 PM)</option>
                <option value="evening">Evening Shift (2:00 PM - 10:00 PM)</option>
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
            
            <div>
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
            </div>
            
            <button 
              type="submit"
              disabled={assignLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                assignLoading 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
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
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ performanceData = [], scheduledReviews = [], employees = [] }) => {
  // Add null checks for arrays and objects
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center py-12">
        <p className="text-gray-500">No employee data available to display performance metrics.</p>
      </div>
    );
  }

  // Calculate average performance rating
  const avgRating = employees.reduce((sum, emp) => {
    return sum + (emp.performance_rating || 0);
  }, 0) / (employees.filter(emp => emp.performance_rating).length || 1);

  // Find top performer
  const topPerformer = [...employees].sort((a, b) => 
    (b.performance_rating || 0) - (a.performance_rating || 0)
  )[0];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Performance</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{avgRating.toFixed(1)}/5.0</p>
            </div>
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">Team average</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Reviews</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{scheduledReviews.length}</p>
            </div>
            <div className="p-2 rounded-full bg-amber-50 text-amber-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {scheduledReviews.slice(0, 2).map((review, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-700">{review.employees?.name || 'Unknown'}</span>
                <span className="text-gray-500">
                  {(() => {
                    const reviewDate = new Date(review.review_date);
                    const today = new Date();
                    const diffTime = reviewDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return `Due in ${diffDays} days`;
                  })()}
                </span>
              </div>
            ))}
            {scheduledReviews.length === 0 && (
              <span className="text-xs text-gray-500">No upcoming reviews</span>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Performer</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{topPerformer?.name || "None"}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center">
            <span>Rating: {topPerformer?.performance_rating || "N/A"}/5.0</span>
            <span className="mx-2">•</span>
            <span>{topPerformer?.job_title || ""}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Team Performance Overview</h3>
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
                  Job Knowledge
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Quality
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teamwork
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Review
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees
                .filter(employee => employee && employee.id) // Filter out empty/incomplete records
                .sort((a, b) => (b.performance_rating || 0) - (a.performance_rating || 0))
                .map(employee => {
                  // Find employee's performance data - get the latest review
                  const employeeReview = performanceData
                    .filter(p => p.employee_id === employee.id)
                    .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))[0] || {};
                  
                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={employee.image_url || emp} 
                              alt="" 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.job_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {employee.performance_rating || "N/A"}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-4 h-4 ${star <= Math.floor(employee.performance_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">
                            {employeeReview.job_knowledge_rating || "N/A"}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(employeeReview.job_knowledge_rating || 0) * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">
                            {employeeReview.work_quality_rating || "N/A"}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(employeeReview.work_quality_rating || 0) * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">
                            {employeeReview.teamwork_rating || "N/A"}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(employeeReview.teamwork_rating || 0) * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employeeReview.review_date ? formatDate(employeeReview.review_date) : 'No review yet'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Schedule Performance Review</h3>
          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
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
              {scheduledReviews.length > 0 ? (
                scheduledReviews.map(review => (
                  <tr key={review.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={review.employees?.image_url || emp} 
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
                      {formatDate(review.review_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.reviewer?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        review.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {review.status === 'Completed' ? (
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      ) : (
                        <>
                          <a href="#" className="text-green-600 hover:text-green-900 mr-4">Edit</a>
                          <a href="#" className="text-red-600 hover:text-red-900">Cancel</a>
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Add New Employee</h3>
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
              
              <div className="mt-8 flex justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-700">Edit Employee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6">
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
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-700">Record Attendance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
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
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
  
export default EmployeeManagement;