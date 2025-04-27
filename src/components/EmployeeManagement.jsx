import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, Clock, Mail, Phone, MapPin, Users, Award, FileText, Briefcase, User,Download,DollarSign, IndianRupee } from 'lucide-react';

// Mock data for employees
const mockEmployees = [
  {
    id: 'E001',
    name: 'John Doe',
    jobTitle: 'Farm Manager',
    department: 'Management',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: '123 Farm Lane, Rural County',
    dateJoined: '2018-03-15',
    status: 'Active',
    schedule: 'Full-time',
    image: '/api/placeholder/120/120',
    performanceRating: 4.8,
    skills: ['Management', 'Cattle handling', 'Equipment operation', 'Team leadership'],
    certifications: ['Farm Management Certification', 'Agricultural Safety'],
    attendanceRate: 98,
    salary: 75000,
    attendanceHistory: [
      { date: '2023-04-26', status: 'Present', hoursWorked: 9.5 },
      { date: '2023-04-25', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-24', status: 'Present', hoursWorked: 8.5 },
      { date: '2023-04-23', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-22', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-21', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-20', status: 'Present', hoursWorked: 8.5 }
    ]
  },
  {
    id: 'E002',
    name: 'Jane Smith',
    jobTitle: 'Livestock Specialist',
    department: 'Animal Care',
    email: 'jane.smith@example.com',
    phone: '(555) 234-5678',
    address: '456 County Road, Rural County',
    dateJoined: '2019-06-22',
    status: 'Active',
    schedule: 'Full-time',
    image: '/api/placeholder/120/120',
    performanceRating: 4.6,
    skills: ['Veterinary assistance', 'Animal health monitoring', 'Calving assistance', 'Record keeping'],
    certifications: ['Animal Husbandry Certification', 'First Aid for Animals'],
    attendanceRate: 97,
    salary: 62000,
    attendanceHistory: [
      { date: '2023-04-26', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-25', status: 'Present', hoursWorked: 8.5 },
      { date: '2023-04-24', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-23', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-22', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-21', status: 'Present', hoursWorked: 8.5 },
      { date: '2023-04-20', status: 'Present', hoursWorked: 8.0 }
    ]
  },
  {
    id: 'E003',
    name: 'David Johnson',
    jobTitle: 'Milking Technician',
    department: 'Milk Production',
    email: 'david.johnson@example.com',
    phone: '(555) 345-6789',
    address: '789 Meadow Drive, Rural County',
    dateJoined: '2020-02-10',
    status: 'Active',
    schedule: 'Part-time',
    image: '/api/placeholder/120/120',
    performanceRating: 4.2,
    skills: ['Milking equipment operation', 'Hygiene protocols', 'Quality testing', 'Equipment maintenance'],
    certifications: ['Dairy Safety and Hygiene'],
    attendanceRate: 95,
    salary: 42000,
    attendanceHistory: [
      { date: '2023-04-26', status: 'Present', hoursWorked: 6.0 },
      { date: '2023-04-25', status: 'Present', hoursWorked: 6.0 },
      { date: '2023-04-24', status: 'Absent', hoursWorked: 0 },
      { date: '2023-04-23', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-22', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-21', status: 'Present', hoursWorked: 6.0 },
      { date: '2023-04-20', status: 'Present', hoursWorked: 6.5 }
    ]
  },
  {
    id: 'E004',
    name: 'Emily Williams',
    jobTitle: 'Administrative Assistant',
    department: 'Administration',
    email: 'emily.williams@example.com',
    phone: '(555) 456-7890',
    address: '101 Oak Street, Rural County',
    dateJoined: '2021-05-05',
    status: 'Active',
    schedule: 'Full-time',
    image: '/api/placeholder/120/120',
    performanceRating: 4.5,
    skills: ['Office management', 'Data entry', 'Customer relations', 'Scheduling'],
    certifications: ['Office Administration'],
    attendanceRate: 99,
    salary: 48000,
    attendanceHistory: [
      { date: '2023-04-26', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-25', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-24', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-23', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-22', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-21', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-20', status: 'Present', hoursWorked: 8.0 }
    ]
  },
  {
    id: 'E005',
    name: 'Michael Brown',
    jobTitle: 'Farm Hand',
    department: 'Operations',
    email: 'michael.brown@example.com',
    phone: '(555) 567-8901',
    address: '234 Pine Road, Rural County',
    dateJoined: '2022-01-18',
    status: 'Active',
    schedule: 'Full-time',
    image: '/api/placeholder/120/120',
    performanceRating: 4.0,
    skills: ['Equipment operation', 'Maintenance', 'Feeding', 'General farm work'],
    certifications: ['Equipment Operation Safety'],
    attendanceRate: 96,
    salary: 45000,
    attendanceHistory: [
      { date: '2023-04-26', status: 'Present', hoursWorked: 8.5 },
      { date: '2023-04-25', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-24', status: 'Late', hoursWorked: 7.5 },
      { date: '2023-04-23', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-22', status: 'Weekend', hoursWorked: 0 },
      { date: '2023-04-21', status: 'Present', hoursWorked: 8.0 },
      { date: '2023-04-20', status: 'Present', hoursWorked: 8.5 }
    ]
  }
];

// Status badge colors
const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'On Leave': 'bg-amber-100 text-amber-800',
  'Terminated': 'bg-red-100 text-red-800'
};

// Attendance status colors
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
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Main employee management component
const EmployeeManagement = () => {
  const [employees, setEmployees] = useState(mockEmployees);
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
  const editEmployee = (updatedEmployee) => {
    // Update employees state with the edited employee
    setEmployees(employees.map(emp => 
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
    
    // Close the modal and show success message
    setIsEditModalOpen(false);
    setSuccessMessage('Employee updated successfully!');
    
    // Clear the success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };


  // Toggle attendance recording modal
const toggleAttendanceModal = (employee = null) => {
  setEmployeeForAttendance(employee);
  setIsAttendanceModalOpen(!isAttendanceModalOpen);
};

// Record attendance for an employee
const recordAttendance = (employeeId, attendanceRecord) => {
  // In a real application, you would make an API call to save the attendance record
  // For now, we'll update the employee's attendance history in our local state
  
  setEmployees(employees.map(emp => {
      if (emp.id === employeeId) {
        // Create a new array with the new attendance record at the beginning
        const updatedAttendanceHistory = [
          attendanceRecord,
          ...emp.attendanceHistory
        ];
        
        // Only keep the latest 7 records for our mock data
        if (updatedAttendanceHistory.length > 7) {
          updatedAttendanceHistory.pop();
        }
        
        return {
          ...emp,
          attendanceHistory: updatedAttendanceHistory
        };
      }
      return emp;
    }));
  
    // Close the modal and show success message
    setIsAttendanceModalOpen(false);
    setSuccessMessage('Attendance recorded successfully!');
    
    // Clear the success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Department filter
    const matchesDepartment = 
      filters.department === 'All' || 
      employee.department === filters.department;
    
    // Status filter
    const matchesStatus = 
      filters.status === 'All' || 
      employee.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Pagination
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Get unique departments for filter
  const uniqueDepartments = Array.from(new Set(employees.map(employee => employee.department)));

  // Open employee profile
  const openEmployeeProfile = (employee) => {
    setSelectedEmployee(employee);
  };

  // Close employee profile
  const closeEmployeeProfile = () => {
    setSelectedEmployee(null);
  };

  // Toggle add modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  return (
    <div className="h-full bg-gray-100">
      {selectedEmployee ? (
        <EmployeeProfile employee={selectedEmployee} onClose={closeEmployeeProfile} onEdit={toggleEditModal} onRecordAttendance={toggleAttendanceModal}/>
      ) : (
        <div className="px-6 py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Employee Management</h1>
            <button 
              onClick={toggleAddModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus size={20} className="mr-2" />
              Add Employee
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'employees'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'attendance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'shifts'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shifts
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'performance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance
              </button>
            </nav>
          </div>

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
                Showing {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>

              {/* Employees Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                {currentEmployees.map(employee => (
                  <EmployeeCard key={employee.id} employee={employee} onClick={() => openEmployeeProfile(employee)} onRecordAttendance={toggleAttendanceModal} />
                ))}
              </div>

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
                  <div className="flex space-x-2">
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
            <AttendanceTab employees={employees} />
          )}

          {/* Shifts Tab */}
          {activeTab === 'shifts' && (
            <ShiftsTab employees={employees} />
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <PerformanceTab employees={employees} />
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <AddEmployeeModal onClose={toggleAddModal} />
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && employeeToEdit && (
        <EditEmployeeModal
          employee={employeeToEdit}
          onClose={toggleEditModal}
          onSave={editEmployee}
        />
      )}

      {/* Record Attendance Modal */}
      {isAttendanceModalOpen && employeeForAttendance && (
        <RecordAttendanceModal
          employee={employeeForAttendance}
          onClose={toggleAttendanceModal}
          onSave={recordAttendance}
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

// Employee Card Component
const EmployeeCard = ({ employee, onClick, onRecordAttendance }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center mb-3">
          <img 
            src={employee.image} 
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
            Since {new Date(employee.dateJoined).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-4 pt-2 border-t flex justify-end space-x-4" onClick={(e) => e.stopPropagation()}>
          <button 
            className="p-1 text-green-600 hover:text-green-900 transition-colors duration-200 hover:bg-green-50 rounded-full"
            onClick={() => onRecordAttendance(employee)}
          >
            <Calendar size={16} />
            Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

// Employee Profile Component
const EmployeeProfile = ({ employee, onClose, onEdit, onRecordAttendance}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="bg-green-600 text-white">
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
              {employee.jobTitle}
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
                  src={employee.image} 
                  alt={employee.name} 
                  className="w-32 h-32 object-cover rounded-full bg-gray-200 mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-800">{employee.name}</h2>
                <p className="text-gray-500">{employee.jobTitle}</p>
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
                    <span className="text-gray-600">{employee.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-3" />
                    <span className="text-gray-600">Joined: {formatDate(employee.dateJoined)}</span>
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
            <div className="border-b border-gray-200">
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
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Performance Rating</p>
                          <p className="text-2xl font-semibold text-gray-800 mt-1">{employee.performanceRating}/5.0</p>
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
                          <p className="text-2xl font-semibold text-gray-800 mt-1">{employee.attendanceRate}%</p>
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
                        {employee.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Certifications</h4>
                      <div className="space-y-2">
                        {employee.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center">
                            <FileText size={16} className="text-gray-400 mr-2" />
                            <span className="text-gray-700">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <ActivityItem 
                        type="attendance" 
                        description="Completed 9.5 hours work day" 
                        date="Today"
                      />
                      <ActivityItem 
                        type="training" 
                        description="Completed equipment safety refresher" 
                        date="2 days ago"
                      />
                      <ActivityItem 
                        type="performance" 
                        description="Quarterly performance review" 
                        date="1 week ago"
                      />
                      <ActivityItem 
                        type="payroll" 
                        description="Monthly payroll processed" 
                        date="2 weeks ago"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div>
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800">Attendance Summary</h3>
                      <div className="flex items-center">
                        <button className="mr-2 p-1 rounded-full hover:bg-gray-100">
                          <ChevronLeft size={18} className="text-gray-500" />
                        </button>
                        <span className="text-sm font-medium">April 2023</span>
                        <button className="ml-2 p-1 rounded-full hover:bg-gray-100">
                          <ChevronRight size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Present Days</p>
                        <p className="text-2xl font-semibold text-gray-800">18</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Absent Days</p>
                        <p className="text-2xl font-semibold text-gray-800">1</p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Late Days</p>
                        <p className="text-2xl font-semibold text-gray-800">2</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Hours</p>
                        <p className="text-2xl font-semibold text-gray-800">165.5</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">Attendance Log</h3>
                      <button className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center">
                        <Download size={14} className="mr-1" />
                        Export
                      </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours Worked
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employee.attendanceHistory.map((record, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[record.status]}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.hoursWorked} hrs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div>
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center mb-3">
                          <div className="text-3xl font-bold text-gray-800 mr-3">{employee.performanceRating}</div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-5 h-5 ${star <= Math.floor(employee.performanceRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <div className="text-sm text-gray-500 ml-2">Overall Rating</div>
                        </div>
                        
                        <div className="space-y-3 mt-6">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Job Knowledge</span>
                              <span className="text-sm font-medium text-gray-700">4.7/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '94%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Work Quality</span>
                              <span className="text-sm font-medium text-gray-700">4.5/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Initiative</span>
                              <span className="text-sm font-medium text-gray-700">4.2/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '84%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Communication</span>
                              <span className="text-sm font-medium text-gray-700">4.0/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Teamwork</span>
                              <span className="text-sm font-medium text-gray-700">4.8/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '96%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Trends</h4>
                        <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                          <p className="text-gray-500">Performance trend chart would go here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">Performance Reviews</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <ReviewItem 
                        date="2023-01-15" 
                        reviewer="John Smith"
                        rating={4.8}
                        summary="Excellent performance and leadership skills. Consistently exceeds expectations."
                      />
                      <ReviewItem 
                        date="2022-07-10" 
                        reviewer="Sarah Johnson"
                        rating={4.6}
                        summary="Strong contributor to the team. Demonstrates exceptional knowledge and problem-solving abilities."
                      />
                      <ReviewItem 
                        date="2022-01-12" 
                        reviewer="John Smith"
                        rating={4.5}
                        summary="Reliable performer who consistently delivers quality work. Communicates effectively with team members."
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payroll Tab */}
              {activeTab === 'payroll' && (
                <div>
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Payroll Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="divide-y divide-gray-200">
                            <tr>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">Salary</td>
                              <td className="px-3 py-3 text-sm text-gray-900">{formatCurrency(employee.salary)}/year</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">Pay Period</td>
                              <td className="px-3 py-3 text-sm text-gray-900">Bi-weekly</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">Payment Method</td>
                              <td className="px-3 py-3 text-sm text-gray-900">Direct Deposit</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">Bank Account</td>
                              <td className="px-3 py-3 text-sm text-gray-900">****4567</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">Tax Withholding</td>
                              <td className="px-3 py-3 text-sm text-gray-900">Standard</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Year to Date Summary</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gross Pay:</span>
                            <span className="text-sm font-medium text-gray-800">{formatCurrency(employee.salary / 12 * 4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Federal Tax:</span>
                            <span className="text-sm font-medium text-gray-800">{formatCurrency((employee.salary / 12 * 4) * 0.15)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">State Tax:</span>
                            <span className="text-sm font-medium text-gray-800">{formatCurrency((employee.salary / 12 * 4) * 0.05)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Social Security:</span>
                            <span className="text-sm font-medium text-gray-800">{formatCurrency((employee.salary / 12 * 4) * 0.062)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Medicare:</span>
                            <span className="text-sm font-medium text-gray-800">{formatCurrency((employee.salary / 12 * 4) * 0.0145)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-sm font-medium text-gray-800">Net Pay:</span>
                            <span className="text-sm font-medium text-gray-800">{formatCurrency((employee.salary / 12 * 4) * 0.7235)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">Payment History</h3>
                      <button className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center">
                        <Download size={14} className="mr-1" />
                        Export
                      </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pay Period
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pay Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gross Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Apr 16 - Apr 30, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            May 05, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(employee.salary / 24)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency((employee.salary / 24) * 0.7235)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-green-600 hover:text-green-900">View</a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Apr 01 - Apr 15, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Apr 20, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(employee.salary / 24)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency((employee.salary / 24) * 0.7235)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-green-600 hover:text-green-900">View</a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Mar 16 - Mar 31, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Apr 05, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(employee.salary / 24)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency((employee.salary / 24) * 0.7235)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-green-600 hover:text-green-900">View</a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
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

// Attendance Tab Component
const AttendanceTab = ({ employees }) => {
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
                {employees.map(employee => {
                  const todayRecord = employee.attendanceHistory.find(
                    record => record.date === '2023-04-26'
                  );
                  
                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={employee.image} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.jobTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[todayRecord.status]}`}>
                          {todayRecord.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {todayRecord.status === 'Present' || todayRecord.status === 'Late' ? '8:00 AM' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {todayRecord.status === 'Present' || todayRecord.status === 'Late' ? '5:30 PM' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {todayRecord.hoursWorked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {todayRecord.status === 'Late' ? 'Arrived at 8:30 AM' : '-'}
                      </td>
                    </tr>
                  );
                })}
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
                  {employees.map(employee => {
                    // Get attendance records for each day
                    const mondayRecord = employee.attendanceHistory.find(
                        record => record.date === '2023-04-24'
                      );
                      const tuesdayRecord = employee.attendanceHistory.find(
                        record => record.date === '2023-04-25'
                      );
                      const wednesdayRecord = employee.attendanceHistory.find(
                        record => record.date === '2023-04-26'
                      );
                      
                      // Calculate total hours
                      const totalHours = [mondayRecord, tuesdayRecord, wednesdayRecord]
                        .reduce((sum, record) => sum + (record ? record.hoursWorked : 0), 0);
                      
                      return (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src={employee.image} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                <div className="text-sm text-gray-500">{employee.jobTitle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {mondayRecord && (
                              <div>
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[mondayRecord.status]}`}>
                                  {mondayRecord.status}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">{mondayRecord.hoursWorked} hrs</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {tuesdayRecord && (
                              <div>
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[tuesdayRecord.status]}`}>
                                  {tuesdayRecord.status}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">{tuesdayRecord.hoursWorked} hrs</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {wednesdayRecord && (
                              <div>
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceStatusColors[wednesdayRecord.status]}`}>
                                  {wednesdayRecord.status}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">{wednesdayRecord.hoursWorked} hrs</div>
                              </div>
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
                    })}
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
                            <img className="h-10 w-10 rounded-full" src={employee.image} alt="" />
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
                          <img className="h-10 w-10 rounded-full" src={employee.image} alt="" />
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
  const ShiftsTab = ({ employees }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('week');
    
    // Generate times for the schedule
    const timeSlots = Array.from({ length: 14 }, (_, i) => {
      const hour = i + 6; // Start from 6 AM
      return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
    });
    
    // Mock shifts data
    const shifts = [
      { 
        employeeId: 'E001', 
        name: 'John Doe',
        shifts: [
          { day: 'Monday', startTime: '08:00', endTime: '17:30', colorClass: 'bg-blue-100 border-blue-300' },
          { day: 'Tuesday', startTime: '08:00', endTime: '17:00', colorClass: 'bg-blue-100 border-blue-300' },
          { day: 'Wednesday', startTime: '08:00', endTime: '17:30', colorClass: 'bg-blue-100 border-blue-300' },
          { day: 'Thursday', startTime: '08:00', endTime: '17:00', colorClass: 'bg-blue-100 border-blue-300' },
          { day: 'Friday', startTime: '08:00', endTime: '17:00', colorClass: 'bg-blue-100 border-blue-300' }
        ]
      },
      { 
        employeeId: 'E002', 
        name: 'Jane Smith',
        shifts: [
          { day: 'Monday', startTime: '08:00', endTime: '16:30', colorClass: 'bg-green-100 border-green-300' },
          { day: 'Tuesday', startTime: '08:00', endTime: '16:30', colorClass: 'bg-green-100 border-green-300' },
          { day: 'Wednesday', startTime: '08:00', endTime: '16:30', colorClass: 'bg-green-100 border-green-300' },
          { day: 'Thursday', startTime: '08:00', endTime: '16:30', colorClass: 'bg-green-100 border-green-300' },
          { day: 'Friday', startTime: '08:00', endTime: '16:30', colorClass: 'bg-green-100 border-green-300' }
        ]
      },
      { 
        employeeId: 'E003', 
        name: 'David Johnson',
        shifts: [
          { day: 'Monday', startTime: '06:00', endTime: '12:00', colorClass: 'bg-purple-100 border-purple-300' },
          { day: 'Tuesday', startTime: '06:00', endTime: '12:00', colorClass: 'bg-purple-100 border-purple-300' },
          { day: 'Wednesday', startTime: '', endTime: '', colorClass: '' }, // Day off
          { day: 'Thursday', startTime: '06:00', endTime: '12:00', colorClass: 'bg-purple-100 border-purple-300' },
          { day: 'Friday', startTime: '06:00', endTime: '12:00', colorClass: 'bg-purple-100 border-purple-300' }
        ]
      },
      { 
        employeeId: 'E004', 
        name: 'Emily Williams',
        shifts: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00', colorClass: 'bg-amber-100 border-amber-300' },
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', colorClass: 'bg-amber-100 border-amber-300' },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00', colorClass: 'bg-amber-100 border-amber-300' },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', colorClass: 'bg-amber-100 border-amber-300' },
          { day: 'Friday', startTime: '09:00', endTime: '17:00', colorClass: 'bg-amber-100 border-amber-300' }
        ]
      },
      { 
        employeeId: 'E005', 
        name: 'Michael Brown',
        shifts: [
          { day: 'Monday', startTime: '07:00', endTime: '15:30', colorClass: 'bg-red-100 border-red-300' },
          { day: 'Tuesday', startTime: '07:00', endTime: '15:00', colorClass: 'bg-red-100 border-red-300' },
          { day: 'Wednesday', startTime: '07:00', endTime: '15:30', colorClass: 'bg-red-100 border-red-300' },
          { day: 'Thursday', startTime: '07:00', endTime: '15:00', colorClass: 'bg-red-100 border-red-300' },
          { day: 'Friday', startTime: '07:00', endTime: '15:30', colorClass: 'bg-red-100 border-red-300' }
        ]
      }
    ];
    
    // Days of the week
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Get shift for specific employee and day
    const getShift = (employeeId, day) => {
      const employee = shifts.find(e => e.employeeId === employeeId);
      if (!employee) return null;
      
      return employee.shifts.find(s => s.day === day);
    };
    
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
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
                {view === 'week' && 'Week of April 24 - 30, 2023'}
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
          
          {view === 'week' && (
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
                  {shifts.map(employee => (
                    <tr key={employee.employeeId}>
                      <td className="sticky left-0 bg-white border-b border-gray-200 px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              src={employees.find(e => e.id === employee.employeeId).image} 
                              alt="" 
                              className="h-10 w-10 rounded-full"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">
                              {employees.find(e => e.id === employee.employeeId).jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      {days.slice(0, 5).map(day => {
                        const shift = employee.shifts.find(s => s.day === day);
                        return (
                          <td key={day} className="border-b border-gray-200 px-6 py-4">
                            {shift && shift.startTime ? (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {view === 'month' && (
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
                  <span>Assigned to 2 employees</span>
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
                  <span>Assigned to 3 employees</span>
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
                  <span>Assigned to 0 employees</span>
                </div>
              </div>
              
              <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Add Shift Template
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Quick Assign</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                id="employee"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">Select an employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
                Shift Template
              </label>
              <select
                id="shift"
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
                  <label htmlFor="start-date" className="sr-only">Start Date</label>
                  <input
                    type="date"
                    id="start-date"
                    className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="sr-only">End Date</label>
                  <input
                    type="date"
                    id="end-date"
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
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <label key={day} className="inline-flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" checked={day !== 'Sat' && day !== 'Sun'} />
                    <span className="ml-2 text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Assign Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ employees }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Performance</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">4.4/5.0</p>
            </div>
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
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
              <p className="text-2xl font-semibold text-gray-800 mt-1">2</p>
            </div>
            <div className="p-2 rounded-full bg-amber-50 text-amber-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-700">Jane Smith</span>
              <span className="text-gray-500">Due in 5 days</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-700">Michael Brown</span>
              <span className="text-gray-500">Due in 12 days</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Performer</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">John Doe</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center">
            <span>Rating: 4.8/5.0</span>
            <span className="mx-2">•</span>
            <span>Farm Manager</span>
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
              {employees.sort((a, b) => b.performanceRating - a.performanceRating).map(employee => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={employee.image} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.jobTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{employee.performanceRating}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-4 h-4 ${star <= Math.floor(employee.performanceRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">
                        {employee.id === 'E001' ? '4.7' : 
                         employee.id === 'E002' ? '4.5' : 
                         employee.id === 'E003' ? '4.0' : 
                         employee.id === 'E004' ? '4.6' : '4.2'}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(employee.id === 'E001' ? 4.7 : 
                                            employee.id === 'E002' ? 4.5 : 
                                            employee.id === 'E003' ? 4.0 : 
                                            employee.id === 'E004' ? 4.6 : 4.2) * 20}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">
                        {employee.id === 'E001' ? '4.8' : 
                         employee.id === 'E002' ? '4.7' : 
                         employee.id === 'E003' ? '4.1' : 
                         employee.id === 'E004' ? '4.4' : '4.0'}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(employee.id === 'E001' ? 4.8 : 
                                            employee.id === 'E002' ? 4.7 : 
                                            employee.id === 'E003' ? 4.1 : 
                                            employee.id === 'E004' ? 4.4 : 4.0) * 20}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">
                        {employee.id === 'E001' ? '4.9' : 
                         employee.id === 'E002' ? '4.6' : 
                         employee.id === 'E003' ? '4.2' : 
                         employee.id === 'E004' ? '4.8' : '3.8'}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(employee.id === 'E001' ? 4.9 : 
                                            employee.id === 'E002' ? 4.6 : 
                                            employee.id === 'E003' ? 4.2 : 
                                            employee.id === 'E004' ? 4.8 : 3.8) * 20}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.id === 'E001' ? 'Jan 15, 2023' : 
                     employee.id === 'E002' ? 'Feb 10, 2023' : 
                     employee.id === 'E003' ? 'Mar 05, 2023' : 
                     employee.id === 'E004' ? 'Dec 20, 2022' : 'Mar 15, 2023'}
                  </td>
                </tr>
              ))}
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={employees[1].image} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{employees[1].name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Quarterly Review
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  May 01, 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  John Doe
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Scheduled
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-green-600 hover:text-green-900 mr-4">Edit</a>
                  <a href="#" className="text-red-600 hover:text-red-900">Cancel</a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={employees[4].image} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{employees[4].name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Quarterly Review
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  May 08, 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  John Doe
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Scheduled
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-green-600 hover:text-green-900 mr-4">Edit</a>
                  <a href="#" className="text-red-600 hover:text-red-900">Cancel</a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={employees[2].image} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{employees[2].name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Performance Improvement
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Apr 15, 2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Jane Smith
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Add Employee Modal Component
const AddEmployeeModal = ({ onClose }) => {
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
    console.log('Form data submitted:', formData);
    // Here you would make an API call to create the employee
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
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add Employee
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
                <img className="h-12 w-12 rounded-full" src={employee.image} alt={employee.name} />
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