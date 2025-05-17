import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Download, DollarSign, CreditCard, Briefcase, Calendar, ChevronDown, TrendingUp, TrendingDown, PieChart, IndianRupee,X,AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Pie } from 'recharts';
import { getFinancialDashboardData, addCustomer, addExpense, addInvoice,
   processPayroll, updateExpense, deleteExpense, getExpensesByPage, getEmployeePayrollHistory,
   updateEmployeePayrollInfo, getPayrollDetails, voidPayrollPayment, getInvoices, getInvoiceById, 
   updateInvoiceStatus, deleteInvoice, getInvoiceAgingSummary, generateInvoiceNumber, getCustomers, updateCustomer,
   deleteCustomer, getRevenueData, getRevenueCategoriesData, getRevenueSummary, getCustomersWithRevenue, 
   updateUpcomingPayroll } from './services/financialService';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';


const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-gray-100 text-gray-800',
  'On Leave': 'bg-black-100 text-black-800',
  'Terminated': 'bg-red-100 text-red-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Paid': 'bg-green-100 text-green-800',
  'Overdue': 'bg-red-100 text-red-800',
  'Completed': 'bg-blue-100 text-blue-800',
  'Processing': 'bg-purple-100 text-purple-800',
  'Cancelled': 'bg-gray-100 text-gray-800'
};

// Formatting utility functions
// Format currency values with dollar sign and commas
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format dates from ISO to readable format
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Main component - updated to use Supabase
const FinancesManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('month');
  const [financialData, setFinancialData] = useState({
    invoices: { recent: [] },
    financialStats: {
      invoices: {},
      netProfit: { current: 0, previous: 0, change: 0 },
      revenue: { current: 0, previous: 0, change: 0 },
      expenses: { current: 0, previous: 0, change: 0 },
      cashflow: { current: 0, previous: 0, change: 0 }
    },
    expenses: { recent: [], categories: [] },
    revenue: { monthly: [], categories: [] },
    payroll: { 
      paymentHistory: [],
      employees: [] // Make sure employees array is initialized
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isProcessPayrollModalOpen, setIsProcessPayrollModalOpen] = useState(false);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expensePage, setExpensePage] = useState(1);
  const [expensesPerPage] = useState(10);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesList, setExpensesList] = useState([]);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseLoading, setIsExpenseLoading] = useState(false);
  const [expenseSummary, setExpenseSummary] = useState({
    totalYTD: 0,
    avgMonthly: 0,
    projectedAnnual: 0
  });
  const [expenseTrends, setExpenseTrends] = useState([]);
  const [expenseDateRange, setExpenseDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({  
    startDate: '',
    endDate: ''
  });
  const [isViewPayrollHistoryModalOpen, setIsViewPayrollHistoryModalOpen] = useState(false);
  const [isEditEmployeePayrollModalOpen, setIsEditEmployeePayrollModalOpen] = useState(false);
  const [isPayrollDetailsModalOpen, setIsPayrollDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPayrollPayment, setSelectedPayrollPayment] = useState(null);
  const [employeePayrollHistory, setEmployeePayrollHistory] = useState([]);
  const [payrollDetails, setPayrollDetails] = useState(null);
  const [isLoadingPayrollHistory, setIsLoadingPayrollHistory] = useState(false);
  const [isLoadingPayrollDetails, setIsLoadingPayrollDetails] = useState(false);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPerPage] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [invoicesList, setInvoicesList] = useState([]);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceDetailsLoading, setIsInvoiceDetailsLoading] = useState(false);
  const [agingSummary, setAgingSummary] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isViewCustomerModalOpen, setIsViewCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [revenueDateRange, setRevenueDateRange] = useState('month');
  const [revenueData, setRevenueData] = useState([]);
  const [revenueCategories, setRevenueCategories] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState({
    totalYTD: 0,
    avgMonthly: 0,
    projectedAnnual: 0
  });
  const [topCustomers, setTopCustomers] = useState([]);
  const [isRevenueLoading, setIsRevenueLoading] = useState(false);
  const [invoicesSummary, setInvoicesSummary] = useState({
    outstanding: 0,
    outstandingCount: 0,
    overdue: 0,
    overdueCount: 0,
    paidThisMonth: 0,
    paidCountThisMonth: 0,
    issuedThisMonth: 0,
    issuedCountThisMonth: 0,
    revenueCategories: [],
    invoiceStatusData: [
      { name: 'Paid', value: 0, color: '#4CAF50' },
      { name: 'Pending', value: 0, color: '#FFC107' },
      { name: 'Overdue', value: 0, color: '#F44336' }
    ]
  });
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);


  const toggleViewPayrollHistoryModal = async (employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      await fetchEmployeePayrollHistory(employee.id);
    }
    setIsViewPayrollHistoryModalOpen(!isViewPayrollHistoryModalOpen);
  };
  
  const toggleEditEmployeePayrollModal = (employee = null) => {
    setSelectedEmployee(employee);
    setIsEditEmployeePayrollModalOpen(!isEditEmployeePayrollModalOpen);
  };
  
  const togglePayrollDetailsModal = async (paymentId = null) => {
    try {
      if (paymentId) {
        setSelectedPayrollPayment(paymentId);
        setError(null);
        await fetchPayrollDetails(paymentId);
      }
      setIsPayrollDetailsModalOpen(!isPayrollDetailsModalOpen);
    } catch (err) {
      console.error('Error toggling payroll details modal:', err);
      setError('Failed to load payroll payment details');
      // Still show the modal, but it will display the error
      setIsPayrollDetailsModalOpen(!isPayrollDetailsModalOpen);
    }
  };

  const toggleViewCustomerModal = (customer = null) => {
    setSelectedCustomer(customer);
    setIsViewCustomerModalOpen(!isViewCustomerModalOpen);
  };
  
  const toggleEditCustomerModal = (customer = null) => {
    setSelectedCustomer(customer);
    setIsEditCustomerModalOpen(!isEditCustomerModalOpen);
  };
  
  // Function to fetch customers
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const data = await getCustomers();
      setCustomers(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      return [];
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  // Handle customer creation/update
  const handleCustomerSubmit = async (customerData) => {
    try {
      setIsLoading(true);
      await addCustomer(customerData);
      
      // Refresh customer list
      await fetchCustomers();
      
      return true;
    } catch (err) {
      console.error('Error submitting customer:', err);
      setError('Failed to add customer. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle customer update
  const handleCustomerUpdate = async (customerId, customerData) => {
    try {
      setIsLoading(true);
      await updateCustomer(customerId, customerData);
      
      // Refresh customer list
      await fetchCustomers();
      
      toggleEditCustomerModal();
      return true;
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('Failed to update customer. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle customer deletion
  const handleCustomerDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will affect any related invoices.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteCustomer(customerId);
      
      // Refresh customer list
      await fetchCustomers();
      
      return true;
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch employee payroll history
  const fetchEmployeePayrollHistory = async (employeeId) => {
    try {
      setIsLoadingPayrollHistory(true);
      setError(null);
      const data = await getEmployeePayrollHistory(employeeId);
      setEmployeePayrollHistory(data || []);
    } catch (err) {
      console.error('Error fetching employee payroll history:', err);
      setError('Failed to load employee payroll history. Please try again.');
      // Set empty array to prevent null reference errors
      setEmployeePayrollHistory([]);
    } finally {
      setIsLoadingPayrollHistory(false);
    }
  };
  
  // Function to fetch payroll payment details
  const fetchPayrollDetails = async (paymentId) => {
    try {
      setIsLoadingPayrollDetails(true);
      setError(null);
      console.log(`Fetching payroll details for payment: ${paymentId}`);
      const data = await getPayrollDetails(paymentId);
      console.log('Payroll details received:', data);
      setPayrollDetails(data || null);
    } catch (err) {
      console.error('Error fetching payroll details:', err);
      setError(`Failed to load payroll details: ${err.message || 'Unknown error'}`);
      // Set null to prevent reference errors
      setPayrollDetails(null);
    } finally {
      setIsLoadingPayrollDetails(false);
    }
  };
  
  // Handle edit employee payroll info
  const handleEditEmployeePayroll = async (employeeId, payrollInfo) => {
    try {
      setIsLoading(true);
      await updateEmployeePayrollInfo(employeeId, payrollInfo);
      
      // Refresh data
      const data = await getFinancialDashboardData();
      setFinancialData(data);
      
      // Close modal
      toggleEditEmployeePayrollModal();
      return true;
    } catch (err) {
      console.error('Error updating employee payroll:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle void payment
  const handleVoidPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to void this payment? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      console.log(`Voiding payment with ID: ${paymentId}`);
      await voidPayrollPayment(paymentId);
      
      // Refresh data
      const data = await getFinancialDashboardData();
      setFinancialData(data);
      
      // Close details modal if open
      if (isPayrollDetailsModalOpen) {
        togglePayrollDetailsModal();
      }
      
      return true;
    } catch (err) {
      console.error('Error voiding payment:', err);
      setError(`Failed to void payment: ${err.message || 'Unknown error'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenseSummary = async (dateFilter = expenseDateRange, customDates = customDateRange) => {
    try {
      // Calculate date range based on filter
      let startDate = null;
      let endDate = null;
      
      const now = new Date();
      
      switch (dateFilter) {
        case 'month':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          // Current quarter
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          break;
        case 'year':
          // Current year
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          // Custom date range
          if (customDates.startDate) 
            startDate = new Date(customDates.startDate);
          break;
        default:
          // Default to current year
          startDate = new Date(now.getFullYear(), 0, 1);
      }
      
      // Format date to ISO string for API
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
      
      // Fetch expenses for the period
      const { data: periodData, error: periodError } = await supabase
        .from('expenses')
        .select('amount, date')
        .gte('date', formattedStartDate);
        
      if (periodError) throw periodError;
      
      // Calculate total for the period
      const totalForPeriod = periodData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      
      // For average and projection, use different logic based on date range
      let avgMonthly = 0;
      let projectedAnnual = 0;
      
      if (dateFilter === 'month') {
        // For monthly view, calculate daily average and project to month
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = Math.min(now.getDate(), daysInMonth);
        avgMonthly = totalForPeriod;
        projectedAnnual = totalForPeriod * 12;
      } else if (dateFilter === 'quarter') {
        // For quarterly view
        const monthsElapsed = now.getMonth() % 3 + 1;
        avgMonthly = monthsElapsed > 0 ? totalForPeriod / monthsElapsed : 0;
        projectedAnnual = avgMonthly * 12;
      } else {
        // Year or custom
        // Get current month (1-based)
        const currentMonth = now.getMonth() + 1;
        // Calculate average monthly expenses
        avgMonthly = currentMonth > 0 ? totalForPeriod / currentMonth : 0;
        // Calculate projected annual expenses
        projectedAnnual = currentMonth > 0 ? (totalForPeriod / currentMonth) * 12 : 0;
      }
      
      setExpenseSummary({
        totalYTD: totalForPeriod,
        avgMonthly,
        projectedAnnual
      });
    } catch (err) {
      console.error('Error fetching expense summary:', err);
      setExpenseSummary({
        totalYTD: 0,
        avgMonthly: 0,
        projectedAnnual: 0
      });
    }
  };

  const fetchExpenseTrends = async (dateFilter = expenseDateRange, customDates = customDateRange) => {
    try {
      // Calculate date range based on filter
      let startDate = null;
      let endDate = null;
      
      const now = new Date();
      
      switch (dateFilter) {
        case 'month':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          // Current quarter
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
          break;
        case 'year':
          // Current year
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          // Custom date range
          if (customDates.startDate) 
            startDate = new Date(customDates.startDate);
          if (customDates.endDate) 
            endDate = new Date(customDates.endDate);
          break;
        default:
          // Default to last 12 months if no valid filter
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      // Format dates to ISO string for API
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
      const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;
      
      console.log(`Fetching expense trends from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Get all expenses within the date range
      const { data: expenseData, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate)
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      console.log('Raw expense data:', expenseData);
      
      // Group expenses by month and category
      const monthlyData = {};
      
      expenseData.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1),
            feed: 0,
            labor: 0,
            utilities: 0,
            veterinary: 0,
            maintenance: 0
          };
        }
        
        // Categorize the expense
        switch (expense.category) {
          case 'Feed':
            monthlyData[monthKey].feed += parseFloat(expense.amount);
            break;
          case 'Labor':
            monthlyData[monthKey].labor += parseFloat(expense.amount);
            break;
          case 'Utilities':
            monthlyData[monthKey].utilities += parseFloat(expense.amount);
            break;
          case 'Veterinary':
            monthlyData[monthKey].veterinary += parseFloat(expense.amount);
            break;
          case 'Maintenance':
            monthlyData[monthKey].maintenance += parseFloat(expense.amount);
            break;
          default:
            // For other categories, you might want to add them to a miscellaneous category
            break;
        }
      });
      
      // Convert to array sorted by month and format month names
      const formattedData = Object.values(monthlyData)
        .sort((a, b) => a.month - b.month)
        .map(item => ({
          ...item,
          month: new Date(item.month).toLocaleString('default', { month: 'short' }),
          year: new Date(item.month).getFullYear()
        }));
      
      console.log('Aggregated expense trends:', formattedData);
      setExpenseTrends(formattedData);
    } catch (err) {
      console.error('Error fetching expense trends:', err);
      setExpenseTrends([]);
    }
  };
  
  // Fetch data from Supabase on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getFinancialDashboardData();
        console.log('Financial dashboard data received:', data);
        console.log('Payroll employees data:', data.payroll.employees);
        setFinancialData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading financial data:', err);
        setError('Failed to load financial data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle modals
  const toggleAddExpenseModal = () => setIsAddExpenseModalOpen(!isAddExpenseModalOpen);
  const toggleAddInvoiceModal = () => setIsAddInvoiceModalOpen(!isAddInvoiceModalOpen);
  const toggleAddCustomerModal = () => setIsAddCustomerModalOpen(!isAddCustomerModalOpen);
  const toggleProcessPayrollModal = () => setIsProcessPayrollModalOpen(!isProcessPayrollModalOpen);
  const toggleEditExpenseModal = (expense = null) => {
    setSelectedExpense(expense);
    setIsEditExpenseModalOpen(!isEditExpenseModalOpen);
  };
  
  // Function to fetch employee data
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await getFinancialDashboardData();
      console.log('Refreshed financial data with employees:', data.payroll.employees);
      setFinancialData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading employee data:', err);
      setError('Failed to load employee data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle payroll processing
  const handleProcessPayroll = async (payrollData) => {
    try {
      setIsLoading(true);
      await processPayroll(payrollData);
      
      // Refresh data after successful submission
      const data = await getFinancialDashboardData();
      setFinancialData(data);
      
      return true;
    } catch (err) {
      console.error('Error processing payroll:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async (page = 1, query = '', dateFilter = expenseDateRange) => {
    try {
      setIsExpenseLoading(true);
      
      // Calculate date range based on filter
      let startDate = null;
      let endDate = null;
      
      const now = new Date();
      
      switch (dateFilter) {
        case 'month':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          // Current quarter
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
          break;
        case 'year':
          // Current year
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          // Custom date range
          if (customDateRange.startDate) 
            startDate = new Date(customDateRange.startDate);
          if (customDateRange.endDate) 
            endDate = new Date(customDateRange.endDate);
          break;
        default:
          startDate = null;
          endDate = null;
      }
      
      // Format dates to ISO string for API
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
      const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;
      
      // Call the API with date filters
      const { data, count } = await getExpensesByPage(
        page, 
        expensesPerPage, 
        query,
        formattedStartDate,
        formattedEndDate
      );
      
      setExpensesList(data);
      setTotalExpenses(count);
      setExpensePage(page);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expense data. Please try again.');
    } finally {
      setIsExpenseLoading(false);
    }
  };

  const fetchInvoicesSummaryData = async () => {
    try {
      setIsLoading(true);
      
      // Get current date
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Calculate start of month for filtering
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      
      // Fetch all invoices
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, customers(name, type)');
      
      if (invoicesError) throw invoicesError;
      
      // Calculate various metrics
      let outstanding = 0;
      let outstandingCount = 0;
      let overdue = 0;
      let overdueCount = 0;
      let paidThisMonth = 0;
      let paidCountThisMonth = 0;
      let issuedThisMonth = 0;
      let issuedCountThisMonth = 0;
      
      // For revenue breakdown by product/service
      let revenueByProduct = {};
      
      // For invoice status chart
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;
      let cancelledAmount = 0;
      
      allInvoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.date);
        const dueDate = new Date(invoice.due_date);
        const amount = parseFloat(invoice.amount);
        
        // Check if invoice is from current month
        const isCurrentMonth = invoiceDate.getMonth() === currentMonth && 
                               invoiceDate.getFullYear() === currentYear;
        
        // Calculate metrics based on status and date
        if (invoice.status === 'Pending') {
          outstanding += amount;
          outstandingCount++;
          pendingAmount += amount;
          
          if (dueDate.getTime() < today.getTime()) {
            overdue += amount;
            overdueCount++;
            overdueAmount += amount;
            pendingAmount -= amount; // Move from pending to overdue
          }
        } else if (invoice.status === 'Paid') {
          paidAmount += amount;
          if (isCurrentMonth) {
            paidThisMonth += amount;
            paidCountThisMonth++;
          }
        } else if (invoice.status === 'Overdue') {
          overdue += amount;
          overdueCount++;
          overdueAmount += amount;
        } else if (invoice.status === 'Cancelled') {
          cancelledAmount += amount;
        }
        
        // Check if invoice was issued this month
        if (isCurrentMonth) {
          issuedThisMonth += amount;
          issuedCountThisMonth++;
        }
        
        // Process invoice items for revenue breakdown
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach(item => {
            const category = item.category || 'Other';
            if (!revenueByProduct[category]) {
              revenueByProduct[category] = 0;
            }
            revenueByProduct[category] += parseFloat(item.amount || 0);
          });
        }
      });
      
      // Transform revenueByProduct into an array for the chart
      const revenueCategories = Object.entries(revenueByProduct).map(([name, value], index) => {
        // Generate a color based on index
        const colors = ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#00BCD4', '#FF9800'];
        const color = colors[index % colors.length];
        
        return { name, value, color };
      });
      
      // Calculate percentages for chart
      const totalRevenue = revenueCategories.reduce((sum, item) => sum + item.value, 0);
      revenueCategories.forEach(item => {
        item.percentage = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
      });
      
      // Sort by value in descending order
      revenueCategories.sort((a, b) => b.value - a.value);
      
      // Create invoice status data for pie chart
      const invoiceStatusData = [
        { name: 'Paid', value: paidAmount, color: '#4CAF50' },
        { name: 'Pending', value: pendingAmount, color: '#FFC107' },
        { name: 'Overdue', value: overdueAmount, color: '#F44336' },
        { name: 'Cancelled', value: cancelledAmount, color: '#9E9E9E' }
      ].filter(item => item.value > 0); // Only include non-zero values
      
      return {
        outstanding,
        outstandingCount,
        overdue,
        overdueCount,
        paidThisMonth,
        paidCountThisMonth,
        issuedThisMonth,
        issuedCountThisMonth,
        revenueCategories,
        invoiceStatusData
      };
    } catch (error) {
      console.error('Error fetching invoice summary:', error);
      return {
        outstanding: 0,
        outstandingCount: 0,
        overdue: 0,
        overdueCount: 0,
        paidThisMonth: 0,
        paidCountThisMonth: 0,
        issuedThisMonth: 0,
        issuedCountThisMonth: 0,
        revenueCategories: [],
        invoiceStatusData: [
          { name: 'Paid', value: 0, color: '#4CAF50' },
          { name: 'Pending', value: 0, color: '#FFC107' },
          { name: 'Overdue', value: 0, color: '#F44336' }
        ]
      };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses(expensePage, expenseSearchQuery, expenseDateRange);
      fetchExpenseSummary(expenseDateRange, customDateRange);
      fetchExpenseTrends(expenseDateRange, customDateRange);
    }
  }, [activeTab, expensePage, expenseSearchQuery, expenseDateRange, customDateRange.startDate, customDateRange.endDate]);

  useEffect(() => {
    if (activeTab === 'invoices') {
      const loadInvoiceData = async () => {
        await fetchInvoices(invoicesPage, invoiceSearchQuery);
        await fetchAgingSummary();
        await fetchCustomers();
        
        // Fetch summary data for KPI cards
        const summaryData = await fetchInvoicesSummaryData();
        setInvoicesSummary(summaryData);
      };
      
      loadInvoiceData();
    }
  }, [activeTab, invoicesPage, invoiceSearchQuery]);

  useEffect(() => {
    if (activeTab === 'income') {
      fetchRevenueData(revenueDateRange);
    }
  }, [activeTab, revenueDateRange]);

  const fetchRevenueData = async (dateRangeFilter, customDate = null) => {
    try {
      setIsRevenueLoading(true);
      
      // Use the provided date or current date
      const effectiveDate = customDate || new Date();
      
      // Fetch all necessary data in parallel
      const [revenueResult, categoriesResult, summaryResult, customersResult] = await Promise.all([
        getRevenueData(dateRangeFilter, effectiveDate),
        getRevenueCategoriesData(effectiveDate),
        getRevenueSummary(effectiveDate),
        getCustomersWithRevenue(10, effectiveDate)
      ]);
      
      setRevenueData(revenueResult);
      setRevenueCategories(categoriesResult);
      setRevenueSummary(summaryResult);
      setTopCustomers(customersResult);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError('Failed to load revenue data. Please try again.');
    } finally {
      setIsRevenueLoading(false);
    }
  };
  
  // Handle revenue date range change
  const handleRevenueDateRangeChange = (e) => {
    const value = e.target.value;
    setRevenueDateRange(value);
    fetchRevenueData(value);
  };

  const revenueByCustomerType = useMemo(() => {
    // Group customers by type and calculate total revenue for each type
    const customerTypes = {};
    let totalRevenue = 0;
    
    topCustomers.forEach(customer => {
      const type = customer.type || 'Other';
      if (!customerTypes[type]) {
        customerTypes[type] = 0;
      }
      customerTypes[type] += customer.totalPurchases;
      totalRevenue += customer.totalPurchases;
    });
    
    // Calculate percentages and format for chart
    return Object.entries(customerTypes)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [topCustomers]);
  // Handle expense submission from modal
  const handleExpenseSubmit = async (expenseData) => {
    try {
      setIsLoading(true);
      
      // Add the expense to the database
      const newExpense = await addExpense(expenseData);
      
      // Update the financial data state
      setFinancialData(prevData => ({
        ...prevData,
        expenses: {
          ...prevData.expenses,
          recent: [newExpense, ...prevData.expenses.recent.slice(0, 4)]
        }
      }));
      
      // If on expenses tab, refresh the expenses list
      if (activeTab === 'expenses') {
        fetchExpenses(expensePage, expenseSearchQuery);
      }
      
      // Close the modal
      toggleAddExpenseModal();
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setExpenseDateRange(value);
    
    // Reset custom date range if not on custom
    if (value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
      // Fetch expenses with the new date range
      fetchExpenses(1, expenseSearchQuery, value);
      fetchExpenseSummary(value, { startDate: '', endDate: '' });
      fetchExpenseTrends(value, { startDate: '', endDate: '' });
    }
  };
  
  // 4. Add handler for custom date range inputs
  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => {
      const updated = { ...prev, [field]: value };
      
      // If both dates are set, fetch data
      if (updated.startDate && updated.endDate) {
        fetchExpenses(1, expenseSearchQuery, 'custom', updated);
        fetchExpenseSummary('custom', updated);
        fetchExpenseTrends('custom', updated);
      }
      
      return updated;
    });
  };
  
  // Handle expense update
  const handleExpenseUpdate = async (expenseId, expenseData) => {
    try {
      setIsLoading(true);
      
      // Update the expense in the database
      const updatedExpense = await updateExpense(expenseId, expenseData);
      
      // Update the financial data state
      setFinancialData(prevData => {
        const updatedRecent = prevData.expenses.recent.map(expense => 
          expense.id === expenseId ? updatedExpense : expense
        );
        
        return {
          ...prevData,
          expenses: {
            ...prevData.expenses,
            recent: updatedRecent
          }
        };
      });
      
      // If on expenses tab, refresh the expenses list
      if (activeTab === 'expenses') {
        fetchExpenses(expensePage, expenseSearchQuery);
      }
      
      // Close the edit modal
      toggleEditExpenseModal();
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle expense deletion
  const handleExpenseDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Delete the expense from the database
      await deleteExpense(expenseId);
      
      // Update the financial data state
      setFinancialData(prevData => {
        const filteredRecent = prevData.expenses.recent.filter(expense => 
          expense.id !== expenseId
        );
        
        return {
          ...prevData,
          expenses: {
            ...prevData.expenses,
            recent: filteredRecent
          }
        };
      });
      
      // If on expenses tab, refresh the expenses list
      if (activeTab === 'expenses') {
        fetchExpenses(expensePage, expenseSearchQuery);
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading state
  if (isLoading && !financialData) {
    return <LoadingSpinner message='Loading financial data...'/>;
  }

  const handleExpenseSearch = (e) => {
    const query = e.target.value;
    setExpenseSearchQuery(query);
    // Reset to first page when searching
    setExpensePage(1);
    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchExpenses(1, query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Handle expense status change
  const handleExpenseStatusChange = async (expenseId, newStatus) => {
    try {
      setIsLoading(true);
      
      await updateExpense(expenseId, { status: newStatus });
      
      // Update the financial data state
      setFinancialData(prevData => {
        const updatedRecent = prevData.expenses.recent.map(expense => 
          expense.id === expenseId ? { ...expense, status: newStatus } : expense
        );
        
        return {
          ...prevData,
          expenses: {
            ...prevData.expenses,
            recent: updatedRecent
          }
        };
      });
      
      // If on expenses tab, refresh the expenses list
      if (activeTab === 'expenses') {
        fetchExpenses(expensePage, expenseSearchQuery);
      }
    } catch (err) {
      console.error('Error updating expense status:', err);
      setError('Failed to update expense status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async (page = 1, query = '') => {
    try {
      setIsInvoiceLoading(true);
      const { data, count } = await getInvoices(page, invoicesPerPage, query);
      
      // Initialize with empty array if data is null or undefined
      setInvoicesList(data || []);
      setTotalInvoices(count || 0);
      setInvoicesPage(page);
      return { data, count };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to fetch invoices. Please try again.');
      // Initialize with empty arrays on error
      setInvoicesList([]);
      setTotalInvoices(0);
      return { data: [], count: 0 };
    } finally {
      setIsInvoiceLoading(false);
    }
  };
  
  const fetchAgingSummary = async () => {
    try {
      const data = await getInvoiceAgingSummary();
      setAgingSummary(data);
    } catch (err) {
      console.error('Error fetching aging summary:', err);
    }
  };

  const getDateRangeLabel = (range) => {
    const now = new Date();
    
    switch(range) {
      case 'month':
        return now.toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${currentQuarter} ${now.getFullYear()}`;
      case 'year':
        return now.getFullYear().toString();
      default:
        return 'All Time';
    }
  };
  
  const handleInvoiceSearch = (e) => {
    const query = e.target.value;
    setInvoiceSearchQuery(query);
    // Reset to first page when searching
    setInvoicesPage(1);
    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchInvoices(1, query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Toggle view invoice modal
  const toggleViewInvoiceModal = async (invoice = null) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      try {
        setIsInvoiceDetailsLoading(true);
        const data = await getInvoiceById(invoice.id);
        setSelectedInvoice(data);
      } catch (err) {
        console.error('Error fetching invoice details:', err);
      } finally {
        setIsInvoiceDetailsLoading(false);
      }
    }
    setIsViewInvoiceModalOpen(!isViewInvoiceModalOpen);
  };
  
  // Handle invoice status change
  const handleInvoiceStatusChange = async (invoiceId, newStatus) => {
    try {
      setIsLoading(true);
      await updateInvoiceStatus(invoiceId, newStatus);
      
      // Refresh invoices list
      await fetchInvoices(invoicesPage, invoiceSearchQuery);
      
      // If we're viewing the invoice, refresh the selected invoice data
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        const updatedInvoice = await getInvoiceById(invoiceId);
        setSelectedInvoice(updatedInvoice);
      }
      
      // Update the financial dashboard data
      const data = await getFinancialDashboardData();
      setFinancialData(data);
      
      return true;
    } catch (err) {
      console.error('Error updating invoice status:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle invoice submission from modal
  const handleInvoiceSubmit = async (invoiceData, invoiceItems) => {
    try {
      setIsLoading(true);
      
      // Generate an invoice number if needed
      const invoiceNumber = generateInvoiceNumber();
      
      // Format data for the API
      const formattedData = {
        ...invoiceData,
        invoiceNumber,
        customerId: invoiceData.customerId // Ensure this is passed correctly
      };
      
      // Call the API
      await addInvoice(formattedData, invoiceItems);
      
      // Refresh the invoices list
      await fetchInvoices(invoicesPage, invoiceSearchQuery);
      
      // Update the financial dashboard data
      const data = await getFinancialDashboardData();
      setFinancialData(data);
      
      return true;
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Failed to create invoice. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle invoice deletion
  const handleInvoiceDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteInvoice(invoiceId);
      
      // Refresh invoices list
      await fetchInvoices(invoicesPage, invoiceSearchQuery);
      
      // Close the details modal if it's open
      if (isViewInvoiceModalOpen && selectedInvoice?.id === invoiceId) {
        toggleViewInvoiceModal();
      }
      
      // Update the financial dashboard data
      const data = await getFinancialDashboardData();
      setFinancialData(data);
      
      return true;
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  
  // Update the InvoiceModal to use the real API
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
    
  //   try {
  //     // Format items correctly
  //     const formattedItems = formData.items.map(item => ({
  //       description: item.description,
  //       quantity: parseFloat(item.quantity),
  //       unitPrice: parseFloat(item.unitPrice),
  //       amount: parseFloat(item.amount)
  //     }));
      
  //     const success = await handleInvoiceSubmit(formData, formattedItems);
  //     if (success) {
  //       onClose();
  //     }
  //   } catch (err) {
  //     console.error('Error creating invoice:', err);
  //   }
  // };
  
  // Update Expenses Tab JSX to use the new state and handlers
    const renderExpensesTab = () => {
    return (
      <div>
        {/* Expense Summary */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Expense Summary</h2>
              <button 
                onClick={toggleAddExpenseModal}
                data-action="add-expense"
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus size={20} className="mr-2" />
                Add Expense
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 w-full">
              <div className="w-full">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Expense Trends</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={expenseTrends.length > 0 ? expenseTrends : []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), '']}
                        contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                      />
                      <Legend />
                      <Bar dataKey="feed" name="Feed" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="labor" name="Labor" fill="#1565C0" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="utilities" name="Utilities" fill="#FFA000" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="veterinary" name="Veterinary" fill="#F44336" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="maintenance" name="Maintenance" fill="#9E9E9E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Expense Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500">Total Expenses (YTD)</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                      {formatCurrency(expenseSummary.totalYTD)}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500">Avg. Monthly Expenses</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500">
                      {formatCurrency(expenseSummary.avgMonthly)}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500">Projected Annual Expenses</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500">
                      {formatCurrency(expenseSummary.projectedAnnual)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expense List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Expense Transactions</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={expenseSearchQuery}
                  onChange={handleExpenseSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search expenses..."
                />
              </div>
              <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>
          
          {isExpenseLoading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
                <p className="text-gray-600">Loading expenses...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                  {expensesList.length > 0 ? (
                    expensesList.map(expense => (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expense.id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={expense.status}
                            onChange={(e) => handleExpenseStatusChange(expense.id, e.target.value)}
                            className={`px-2 py-1 text-xs inline-flex rounded-full leading-5 font-semibold ${statusColors[expense.status]} border-0 bg-transparent focus:ring-0 cursor-pointer`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => toggleEditExpenseModal(expense)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleExpenseDelete(expense.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        {expenseSearchQuery ? 'No expenses match your search.' : 'No expenses found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {expensesList.length ? (expensePage - 1) * expensesPerPage + 1 : 0} to {Math.min(expensePage * expensesPerPage, totalExpenses)} of {totalExpenses} expenses
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => fetchExpenses(expensePage - 1, expenseSearchQuery)}
                disabled={expensePage === 1}
                className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                  expensePage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button 
                onClick={() => fetchExpenses(expensePage + 1, expenseSearchQuery)}
                disabled={expensePage * expensesPerPage >= totalExpenses}
                className={`px-3 py-1 border rounded-md text-sm ${
                  expensePage * expensesPerPage >= totalExpenses ? 
                    'border-gray-300 text-gray-400 cursor-not-allowed' : 
                    'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:opacity-90 border-transparent'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeTab = () => {
    return (
      <div>
        {isRevenueLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Loading revenue data..." />
          </div>
        ) : (
          <>
            {/* Revenue Overview */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-6">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Revenue Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Revenue</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={revenueData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value), '']}
                            contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="income" name="Revenue" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="profit" name="Profit" stroke="#FFC107" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue Breakdown</h3>
                <div className="space-y-3">
                  {invoicesSummary.revenueCategories && invoicesSummary.revenueCategories.length > 0 ? (
                    invoicesSummary.revenueCategories.map((category, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div 
                            className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                            style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No revenue data available</div>
                  )}
                </div>
              </div>
            </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                      <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500">Total Revenue (YTD)</p>
                        <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500">
                          {formatCurrency(revenueSummary.totalYTD)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500">Avg. Monthly Revenue</p>
                        <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
                          {formatCurrency(revenueSummary.avgMonthly)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                      <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500">Projected Annual Revenue</p>
                        <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500">
                          {formatCurrency(revenueSummary.projectedAnnual)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Customer Overview */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Top Revenue Customers</h2>
                <button 
                  onClick={toggleAddCustomerModal}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Plus size={20} className="mr-2" />
                  Add Customer
                </button>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Purchases
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Order
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
                      {topCustomers.length > 0 ? (
                        topCustomers.map(customer => (
                          <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.id.substring(0, 8)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(customer.totalPurchases)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(customer.lastOrder)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[customer.status]}`}>
                                {customer.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => toggleViewCustomerModal(customer)} 
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => toggleEditCustomerModal(customer)} 
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => toggleAddInvoiceModal()} 
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            No customers found. Add a customer to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Revenue Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Seasonal Patterns</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                        <Line type="monotone" dataKey="income" name="Revenue" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Revenue vs Expenses</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
      
            {/* Top Revenue Sources */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mt-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Top Revenue Sources</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">By Product</h3>
                    <ul className="space-y-3">
                      {revenueCategories.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">{item.name}</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">By Customer Type</h3>
                    <ul className="space-y-3">
                      {revenueByCustomerType.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">{item.name}</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="h-2 rounded-full bg-gradient-to-r from-yellow-700 to-yellow-500" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

    // Update renderInvoicesTab function with consistent styling
  
    const renderInvoicesTab = () => {
      return (
        <div>
          {/* Invoice Summary */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
            <div className="px-6 py-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Invoice Summary</h2>
                <button 
                  onClick={toggleAddInvoiceModal}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Plus size={20} className="mr-2" />
                  Create Invoice
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mt-1">
                      {formatCurrency(invoicesSummary.outstanding)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{invoicesSummary.outstandingCount} unpaid invoices</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-gray-500">Overdue</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500 mt-1">
                      {formatCurrency(invoicesSummary.overdue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{invoicesSummary.overdueCount} overdue invoices</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-gray-500">Paid This Month</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mt-1">
                      {formatCurrency(invoicesSummary.paidThisMonth)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{invoicesSummary.paidCountThisMonth} paid invoices</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-pink-500 to-pink-400"></div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-gray-500">Invoiced This Month</p>
                    <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-500 mt-1">
                      {formatCurrency(invoicesSummary.issuedThisMonth)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{invoicesSummary.issuedCountThisMonth} invoices</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Aging Summary</h3>
                  <div className="space-y-4">
                  {agingSummary.length > 0 ? (
                    agingSummary.map(period => (
                      <div key={period.id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{period.period}</span>
                          <span className="text-sm font-medium text-gray-700">{formatCurrency(period.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              period.period === 'Current' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                              period.period === '1-30 days' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                              period.period === '31-60 days' ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                              period.period === '61-90 days' ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 
                              'bg-gradient-to-r from-red-500 to-red-600'
                            }`} 
                            style={{ width: `${period.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No aging data available</div>
                  )}
                </div>
              </div>
              
              {/* <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoicesSummary.invoiceStatusData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(invoicesSummary.invoiceStatusData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), '']}
                        contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div> */}
            </div>
          </div>
        </div>
  
        {/* Customer Management */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Customer Management</h2>
            <button 
              onClick={toggleAddCustomerModal}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Add Customer
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Terms
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
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.contact_person}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.payment_terms}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[customer.status]}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => toggleViewCustomerModal(customer)} 
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => toggleEditCustomerModal(customer)} 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              // Pre-select this customer when opening the invoice modal
                              setSelectedCustomer(customer);
                              toggleAddInvoiceModal();
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Invoice
                          </button>
                          <button 
                            onClick={() => handleCustomerDelete(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        No customers found. Add a customer to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Invoice List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Invoices</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={invoiceSearchQuery}
                  onChange={handleInvoiceSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search invoices..."
                />
              </div>
              <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>
          
          {isInvoiceLoading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
                <p className="text-gray-600">Loading invoices...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
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
                  {Array.isArray(invoicesList) && invoicesList.length > 0 ? (
                    invoicesList.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoice_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.customers?.name || 'Unknown Customer'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={invoice.status}
                            onChange={(e) => handleInvoiceStatusChange(invoice.id, e.target.value)}
                            className={`px-2 py-1 text-xs inline-flex rounded-full leading-5 font-semibold ${statusColors[invoice.status]} border-0 bg-transparent focus:ring-0 cursor-pointer`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => toggleViewInvoiceModal(invoice)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            View
                          </button>
                          {invoice.status === 'Pending' && (
                            <button 
                              onClick={() => handleInvoiceStatusChange(invoice.id, 'Paid')}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button 
                            onClick={() => handleInvoiceDelete(invoice.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        {invoiceSearchQuery 
                          ? 'No invoices match your search.' 
                          : 'No invoices found. Click "Create Invoice" to add one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {Array.isArray(invoicesList) && invoicesList.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {invoicesList.length ? (invoicesPage - 1) * invoicesPerPage + 1 : 0} to {Math.min(invoicesPage * invoicesPerPage, totalInvoices)} of {totalInvoices} invoices
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fetchInvoices(invoicesPage - 1, invoiceSearchQuery)}
                  disabled={invoicesPage === 1}
                  className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                    invoicesPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button 
                  onClick={() => fetchInvoices(invoicesPage + 1, invoiceSearchQuery)}
                  disabled={invoicesPage * invoicesPerPage >= totalInvoices}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    invoicesPage * invoicesPerPage >= totalInvoices ? 
                      'border-gray-300 text-gray-400 cursor-not-allowed' : 
                      'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:opacity-90 border-transparent'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Error state
  if (error) {
    return (
      <div className="h-full bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-800 text-center mb-2">Error</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1500px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Financial Management</h1>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={toggleAddExpenseModal}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <IndianRupee size={18} className="mr-2" />
              Record Expense
            </button>
            <button 
              onClick={toggleAddInvoiceModal}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Create Invoice
            </button>
          </div>
        </div>
        
        <div className="mb-6 overflow-x-auto">
          <nav className="flex space-x-4 border-b border-gray-200 min-w-[600px]">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600 bg-gradient-to-b from-white to-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'expenses'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'income'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'invoices'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'payroll'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payroll
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>
        
        {/* Date Range Filter */}
        {(activeTab === 'expenses' || activeTab === 'income') && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">Date Range:</span>
            <select
              value={activeTab === 'income' ? revenueDateRange : expenseDateRange}
              onChange={activeTab === 'income' ? handleRevenueDateRangeChange : handleDateRangeChange}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200 min-w-[120px]"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              {activeTab === 'income' && <option value="all">All Time</option>}
              {activeTab === 'expenses' && <option value="custom">Custom Range</option>}
            </select>
            
            {activeTab === 'expenses' && expenseDateRange === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
                <button 
                  onClick={() => fetchExpenses(1, expenseSearchQuery, 'custom')}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Financial KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Net Profit</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mt-1 mb-3">
                          {formatCurrency(financialData?.financialStats?.netProfit?.current)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                        {financialData?.financialStats?.netProfit?.change >= 0 ? 
                          <TrendingUp size={20} className="text-white" /> : 
                          <TrendingDown size={20} className="text-white" />
                        }
                      </div>
                    </div>
                    <div className={`mt-2 text-xs flex items-center ${financialData?.financialStats?.netProfit?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialData?.financialStats?.netProfit?.change >= 0 ? (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{Math.abs(financialData?.financialStats?.netProfit?.change || 0)}% from previous period</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Revenue</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mt-1 mb-3">
                          {formatCurrency(financialData?.financialStats?.revenue?.current)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                        {financialData?.financialStats?.revenue?.change >= 0 ? 
                          <TrendingUp size={20} className="text-white" /> : 
                          <TrendingDown size={20} className="text-white" />
                        }
                      </div>
                    </div>
                    <div className={`mt-2 text-xs flex items-center ${financialData?.financialStats?.revenue?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialData?.financialStats?.revenue?.change >= 0 ? (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{Math.abs(financialData?.financialStats?.revenue?.change || 0)}% from previous period</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-red-400"></div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Expenses</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500 mt-1 mb-3">
                          {formatCurrency(financialData?.financialStats?.expenses?.current)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-400">
                        {financialData?.financialStats?.expenses?.change <= 0 ? 
                          <TrendingDown size={20} className="text-white" /> : 
                          <TrendingUp size={20} className="text-white" />
                        }
                      </div>
                    </div>
                    <div className={`mt-2 text-xs flex items-center ${financialData?.financialStats?.expenses?.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialData?.financialStats?.expenses?.change <= 0 ? (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                      <span>{Math.abs(financialData?.financialStats?.expenses?.change || 0)}% from previous period</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cash Flow</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500 mt-1 mb-3">
                          {formatCurrency(financialData?.financialStats?.cashflow?.current)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400">
                        {financialData?.financialStats?.cashflow?.change >= 0 ? 
                          <TrendingUp size={20} className="text-white" /> : 
                          <TrendingDown size={20} className="text-white" />
                        }
                      </div>
                    </div>
                    <div className={`mt-2 text-xs flex items-center ${financialData?.financialStats?.cashflow?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialData?.financialStats?.cashflow?.change >= 0 ? (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{Math.abs(financialData?.financialStats?.cashflow?.change || 0)}% from previous period</span>
                    </div>
                  </div>
                </div>
              </div>
            
            {/* Financial Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Income vs Expenses</h2>
                  <select className="border rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="h-80 overflow-x-auto">
                  <div className="min-w-[400px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financialData?.revenue?.monthly}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), '']}
                        contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#FFC107" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Expense Breakdown</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">April 2023</span>
                  </div>
                </div>
                <div className="h-80 flex flex-col md:flex-row items-center justify-between">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialData?.expenses?.categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {financialData?.expenses?.categories?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2">
                    <ul className="space-y-2">
                      {financialData?.expenses?.categories?.map((category, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                            <span className="text-sm text-gray-700">{category.name}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(category.value)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
            
            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Expenses</h2>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {financialData?.expenses?.recent?.map(expense => (
                    <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <IndianRupee size={16} className="text-red-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-800">
                              {expense.category}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {expense.vendor}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-800">{formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(expense.date)}</p>
                          <span className={`mt-1 inline-flex px-2 py-1 text-xs rounded-full ${statusColors[expense.status]}`}>
                            {expense.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Invoices</h2>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {isLoading ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading invoices...</p>
                    </div>
                  ) : financialData?.invoices?.recent && financialData.invoices.recent.length > 0 ? (
                    financialData.invoices.recent.map(invoice => (
                      <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Briefcase size={16} className="text-blue-500 mr-2" />
                              <h3 className="text-sm font-medium text-gray-800">
                                {invoice.invoice_number || invoice.id}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {invoice.customer}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-800">{formatCurrency(invoice.amount)}</p>
                            <p className="text-xs text-gray-500 mt-1">Due: {formatDate(invoice.due_date || invoice.dueDate)}</p>
                            <span className={`mt-1 inline-flex px-2 py-1 text-xs rounded-full ${statusColors[invoice.status]}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      No recent invoices to display
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Revenue Tab */}
        {activeTab === 'income' && renderIncomeTab()}
        
        {/* Expenses Tab */}
        {activeTab === 'expenses' && renderExpensesTab()}
        
        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div>
            {/* Payroll Summary */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Payroll Summary</h2>
                  <button 
                    onClick={toggleProcessPayrollModal}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Plus size={20} className="mr-2" />
                    Process Payroll
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">Monthly Payroll</p>
                      <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mt-1">
                        {formatCurrency(financialData?.payroll?.monthlyCost || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{financialData?.payroll?.employeeCount || 0} employees</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                    <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">Last Payroll</p>
                      <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mt-1">
                        {formatCurrency(financialData?.payroll?.lastPayrollAmount || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(financialData?.payroll?.lastPayrollDate || new Date())}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                    <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">YTD Payroll</p>
                      <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500 mt-1">
                        {formatCurrency(financialData?.payroll?.ytdCost || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{financialData?.payroll?.ytdPayments || 0} payments</p>
                    </div>
                  </div>
                  
                  {/* <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                    <div className="p-5">
                        <p className="text-sm font-medium text-gray-500">Next Payroll Due</p>
                      <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-500 mt-1">
                        {formatDate(financialData?.payroll?.nextPayrollDate || new Date())}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Estimated: {formatCurrency(financialData?.payroll?.estimatedNextPayroll || 0)}</p>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
            
            {/* Employee Payroll Information */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                  Employee Payroll Information
                </h2>
                <div className="flex items-center">
                  {isLoadingEmployees && <LoadingSpinner size="sm" message="" />}
                  <div className="relative ml-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Search employees..."
                    />
                  </div>
                </div>
              </div>
              
              {isLoadingEmployees ? (
                <div className="py-12">
                  <LoadingSpinner message="Loading employee data..." />
                </div>
              ) : !financialData.payroll.employees || financialData.payroll.employees.length === 0 ? (
                <EmptyEmployeeSection onRetry={fetchEmployees} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pay Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pay Period
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Paid
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financialData.payroll.employees.map(employee => (
                        <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500 ml-2">({employee.id})</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.position || employee.job_title || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.salary ? 
                              formatCurrency(employee.salary) + '/year' : 
                              formatCurrency(employee.hourlyRate) + '/hour'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.payPeriod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(employee.lastPaid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => toggleViewPayrollHistoryModal(employee)}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              View History
                            </button>
                            <button 
                              onClick={() => toggleEditEmployeePayrollModal(employee)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Payment History</h2>
                <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <Download size={16} className="mr-2" />
                  Export Report
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employees
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
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
                    {financialData.payroll.paymentHistory && financialData.payroll.paymentHistory.length > 0 ? (
                      financialData.payroll.paymentHistory.map(payment => (
                        <tr key={payment.id || payment.payment_id || `payment-${Math.random()}`} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.payment_id || payment.id || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.payment_date || payment.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.payment_type || payment.type || "Regular"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.employee_count || payment.employees || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.total_amount || payment.amount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[payment.status || "Paid"]}`}>
                              {payment.status || "Paid"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => togglePayrollDetailsModal(payment.payment_id || payment.id)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Details
                            </button>
                            {(payment.status !== 'Voided' && payment.status !== 'void') && (
                              <button 
                                onClick={() => handleVoidPayment(payment.payment_id || payment.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Void
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No payment history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {financialData.payroll.paymentHistory && financialData.payroll.paymentHistory.length > 0 ? (
                    `Showing 1 to ${financialData.payroll.paymentHistory.length} of ${financialData.payroll.paymentHistory.length} payments`
                  ) : (
                    'No payments to display'
                  )}
                </div>
                <div className="flex space-x-2">
                  <button 
                    disabled={true}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-400 cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={true}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-400 cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
            
            {/* Payroll Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Payroll Cost Distribution</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Salaries', value: 75, color: '#4CAF50' },
                            { name: 'Hourly Wages', value: 15, color: '#2196F3' },
                            { name: 'Bonuses', value: 5, color: '#FFC107' },
                            { name: 'Overtime', value: 5, color: '#F44336' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#4CAF50" />
                          <Cell fill="#2196F3" />
                          <Cell fill="#FFC107" />
                          <Cell fill="#F44336" />
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Monthly Payroll Trends</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', amount: 42000 },
                          { month: 'Feb', amount: 42000 },
                          { month: 'Mar', amount: 44500 },
                          { month: 'Apr', amount: 44500 },
                          { month: 'May', amount: 48000 },
                          { month: 'Jun', amount: 48000 }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name="Payroll Cost" 
                          stroke="#4CAF50" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invoices Tab */}
        {activeTab === 'invoices' && renderInvoicesTab()}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
          {/* Report Generation Panel */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
            <div className="px-6 py-6">
              <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Generate Financial Reports</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                      Report Type
                    </label>
                    <select
                      id="reportType"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    >
                      <option value="incomeStatement">Income Statement</option>
                      <option value="balanceSheet">Balance Sheet</option>
                      <option value="cashFlow">Cash Flow Statement</option>
                      <option value="expenseReport">Expense Report</option>
                      <option value="revenueReport">Revenue Report</option>
                      <option value="taxReport">Tax Report</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <select
                      id="dateRange"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    >
                      <option value="currentMonth">Current Month</option>
                      <option value="previousMonth">Previous Month</option>
                      <option value="currentQuarter">Current Quarter</option>
                      <option value="previousQuarter">Previous Quarter</option>
                      <option value="ytd">Year to Date</option>
                      <option value="lastYear">Last Year</option>
                      <option value="custom">Custom Range...</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Output Format
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center">
                      <input
                        id="pdf"
                        name="format"
                        type="radio"
                        defaultChecked
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <label htmlFor="pdf" className="ml-2 block text-sm text-gray-700">
                        PDF
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="excel"
                        name="format"
                        type="radio"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <label htmlFor="excel" className="ml-2 block text-sm text-gray-700">
                        Excel
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="csv"
                        name="format"
                        type="radio"
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
                <button className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
            
            {/* Financial Metrics Summary */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-6">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Key Financial Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">Profit Margin</h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-2xl font-bold text-gray-900">24.8%</span>
                      <span className="ml-2 flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        2.3%
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">vs previous period</div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">Return on Investment</h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-2xl font-bold text-gray-900">18.5%</span>
                      <span className="ml-2 flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        1.4%
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Annual return</div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">Operating Expense Ratio</h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-2xl font-bold text-gray-900">32.6%</span>
                      <span className="ml-2 flex items-center text-sm text-red-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        0.8%
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">vs previous period</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Saved Reports */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Saved Reports</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  <ReportItem 
                    title="Monthly Income Statement - April 2023"
                    type="Income Statement"
                    date="2023-04-27"
                    format="PDF"
                    size="1.2 MB"
                  />
                  <ReportItem 
                    title="Q1 2023 Balance Sheet"
                    type="Balance Sheet"
                    date="2023-04-15"
                    format="Excel"
                    size="780 KB"
                  />
                  <ReportItem 
                    title="Q1 2023 Expense Report"
                    type="Expense Report"
                    date="2023-04-10"
                    format="PDF"
                    size="950 KB"
                  />
                  <ReportItem 
                    title="Monthly Income Statement - March 2023"
                    type="Income Statement"
                    date="2023-03-31"
                    format="PDF"
                    size="1.1 MB"
                  />
                  <ReportItem 
                    title="Tax Documentation - 2022"
                    type="Tax Report"
                    date="2023-03-15"
                    format="PDF"
                    size="3.4 MB"
                  />
                </ul>
              </div>
            </div>
            
            {/* Schedule Reports */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Scheduled Reports</h2>
                  <button className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center">
                    <Plus size={16} className="mr-1" />
                    New Schedule
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Frequency
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recipients
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Next Delivery
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Monthly Financial Summary
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Monthly
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          3 recipients
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          June 1, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Weekly Cash Flow Report
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Weekly
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2 recipients
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          May 13, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Quarterly Tax Summary
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Quarterly
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          1 recipient
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          July 1, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </div>
            
            {/* Report Templates */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="px-6 py-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Report Templates</h2>
                  <button className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center">
                    <Plus size={16} className="mr-1" />
                    Create Template
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h3 className="text-sm font-medium text-gray-900">Monthly Financial Summary</h3>
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">Default</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">A comprehensive monthly summary of income, expenses, and profit</p>
                    <div className="mt-3 flex justify-end">
                      <button className="text-sm text-green-600 hover:text-green-500">Use Template</button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900">Cash Flow Analysis</h3>
                      <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">Custom</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Detailed analysis of cash inflows and outflows with projections</p>
                    <div className="mt-3 flex justify-end">
                      <button className="text-sm text-green-600 hover:text-green-500">Use Template</button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900">Expense Breakdown</h3>
                      <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">Custom</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Category-wise breakdown of all expenses with comparative analysis</p>
                    <div className="mt-3 flex justify-end">
                      <button className="text-sm text-green-600 hover:text-green-500">Use Template</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {isAddExpenseModalOpen && (
        <AddExpenseModal 
          onClose={toggleAddExpenseModal} 
          onSubmit={handleExpenseSubmit}
        />
      )}
      
      {isEditExpenseModalOpen && selectedExpense && (
        <EditExpenseModal 
          expense={selectedExpense}
          onClose={toggleEditExpenseModal} 
          onSubmit={(data) => handleExpenseUpdate(selectedExpense.id, data)}
        />
      )}
      
      {isAddCustomerModalOpen && (
        <AddCustomerModal 
          onClose={toggleAddCustomerModal} 
          onSubmit={handleCustomerSubmit}
        />
      )}
      
      {isAddInvoiceModalOpen && (
        <AddInvoiceModal 
          onClose={toggleAddInvoiceModal} 
          onSubmit={handleInvoiceSubmit} 
          customers={customers || []}
          toggleAddCustomerModal={toggleAddCustomerModal}
          selectedCustomer={selectedCustomer}
        />
      )}
      
      {isProcessPayrollModalOpen && (
        <ProcessPayrollModal 
          onClose={toggleProcessPayrollModal} 
          onSubmit={handleProcessPayroll}
          employees={financialData?.payroll?.employees || []}
        />
      )}
      
      {isViewPayrollHistoryModalOpen && selectedEmployee && (
        <ViewPayrollHistoryModal 
          employee={selectedEmployee}
          payrollHistory={employeePayrollHistory}
          isLoading={isLoadingPayrollHistory}
          onClose={() => toggleViewPayrollHistoryModal()}
        />
      )}

      {isEditEmployeePayrollModalOpen && selectedEmployee && (
        <EditEmployeePayrollModal 
          employee={selectedEmployee}
          onClose={() => toggleEditEmployeePayrollModal()}
          onSubmit={(data) => handleEditEmployeePayroll(selectedEmployee.id, data)}
        />
      )}

      {isPayrollDetailsModalOpen && (
        <PayrollDetailsModal 
          payrollData={payrollDetails}
          isLoading={isLoadingPayrollDetails}
          error={error}
          onClose={() => togglePayrollDetailsModal()}
          onVoid={handleVoidPayment}
        />
      )}
      {isViewInvoiceModalOpen && selectedInvoice && (
        <ViewInvoiceModal 
          invoice={selectedInvoice}
          isLoading={isInvoiceDetailsLoading}
          onClose={() => toggleViewInvoiceModal()}
          onStatusChange={handleInvoiceStatusChange}
          onDelete={handleInvoiceDelete}
        />
      )}

      {isViewCustomerModalOpen && selectedCustomer && (
        <ViewCustomerModal 
          customer={selectedCustomer}
          onClose={() => toggleViewCustomerModal()}
        />
      )}

      {isEditCustomerModalOpen && selectedCustomer && (
        <EditCustomerModal 
          customer={selectedCustomer}
          onClose={() => toggleEditCustomerModal()}
          onSubmit={handleCustomerUpdate}
        />
      )}
    </div>
  );
};

// View Payroll History Modal
const ViewPayrollHistoryModal = ({ employee, payrollHistory, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 my-8 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Payroll History - {employee.name}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        {isLoading ? (
          <LoadingSpinner message='Loading Data...'/>
        ) : (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-md font-semibold text-gray-800">{employee.position || employee.job_title || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Pay Rate</p>
                  <p className="text-md font-semibold text-gray-800">
                    {employee.salary ? 
                      formatCurrency(employee.salary) + '/year' : 
                      formatCurrency(employee.hourlyRate) + '/hour'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Last Payment</p>
                  <p className="text-md font-semibold text-gray-800">{formatDate(employee.lastPaid)}</p>
                </div>
              </div>
              </div>
            
            <h4 className="text-md font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Payment History</h4>
            {payrollHistory.length > 0 ? (
              <div className="border rounded-xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pay Period
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Pay
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollHistory.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.pay_period_start)} - {formatDate(payment.pay_period_end)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.hours_worked > 0 ? payment.hours_worked : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.gross_pay || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.deductions || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.net_pay || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === 'Completed' || payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                            payment.status === 'Voided' || payment.status === 'void' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status || 'Paid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-xl border border-gray-100">
                No payment history found for this employee.
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit Employee Payroll Modal
const EditEmployeePayrollModal = ({ employee, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    salary: employee.salary || 0,
    hourlyRate: employee.hourlyRate || 0,
    paySchedule: employee.payPeriod || 'Monthly',
    bankAccount: employee.bankAccount || '',
    taxWithholding: employee.taxWithholding || 15
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'taxWithholding' ? parseFloat(value) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const success = await onSubmit(formData);
      if (!success) {
        setError('Failed to update payroll information. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Edit Payroll Information - {employee.name}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <div className="mt-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="salary"
                        name="paymentType"
                        type="radio"
                        checked={!formData.hourlyRate}
                        onChange={() => setFormData({...formData, hourlyRate: 0})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <label htmlFor="salary" className="ml-2 block text-sm text-gray-700">
                        Salary
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="hourly"
                        name="paymentType"
                        type="radio"
                        checked={!!formData.hourlyRate}
                        onChange={() => setFormData({...formData, salary: 0, hourlyRate: 15})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <label htmlFor="hourly" className="ml-2 block text-sm text-gray-700">
                        Hourly
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="paySchedule" className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Schedule
                </label>
                <select
                  id="paySchedule"
                  name="paySchedule"
                  value={formData.paySchedule}
                  onChange={handleChange}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
            </div>
            
            {formData.hourlyRate ? (
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="hourlyRate"
                    id="hourlyRate"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">/ hour</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Salary
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="salary"
                    id="salary"
                    min="0"
                    step="0.01"
                    value={formData.salary}
                    onChange={handleChange}
                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">/ year</span>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account (Last 4 digits)
              </label>
              <input
                type="text"
                name="bankAccount"
                id="bankAccount"
                maxLength="4"
                pattern="[0-9]{4}"
                value={formData.bankAccount}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="1234"
              />
              <p className="mt-1 text-xs text-gray-500">
                For security, only enter the last 4 digits of the account number.
              </p>
            </div>
            
            <div>
              <label htmlFor="taxWithholding" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Withholding Rate (%)
              </label>
              <input
                type="number"
                name="taxWithholding"
                id="taxWithholding"
                min="0"
                max="50"
                step="0.1"
                value={formData.taxWithholding}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payroll Details Modal
const PayrollDetailsModal = ({ payrollData, isLoading, onClose, onVoid }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-screen overflow-y-auto border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Payroll Payment Details - {payrollData.payment_id}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        {isLoading ? (
          <LoadingSpinner message='Loading Data...'/>
        ) : (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Payment Date</p>
                  <p className="text-md font-semibold text-gray-800">{formatDate(payrollData.payment_date)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Payment Type</p>
                  <p className="text-md font-semibold text-gray-800">{payrollData.payment_type}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-md font-semibold text-gray-800">{formatCurrency(payrollData.total_amount)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`text-md font-semibold ${
                    payrollData.status === 'Completed' ? 'text-green-600' :
                    payrollData.status === 'Voided' ? 'text-red-600' :
                    'text-gray-800'
                  }`}>
                    {payrollData.status}
                  </p>
                </div>
              </div>
            </div>
            
            {payrollData.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 p-4">
                  <p className="text-sm text-gray-800">{payrollData.notes}</p>
                </div>
              </div>
            )}
            
            <h4 className="text-md font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Payment Items</h4>
            <div className="border rounded-xl overflow-hidden shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.employees.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.employees.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.pay_period_start)} - {formatDate(item.pay_period_end)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.hours_worked > 0 ? item.hours_worked : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.gross_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.net_pay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between mt-6">
              <div>
                {payrollData.status === 'Completed' && (
                  <button
                    onClick={() => onVoid(payrollData.id)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all duration-300"
                  >
                    Void Payment
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Report Item Component
const ReportItem = ({ title, type, date, format, size }) => {
  return (
    <li className="px-4 sm:px-6 py-4 hover:bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {format === 'PDF' ? (
              <div className="w-10 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded">
                <span className="text-xs font-medium">PDF</span>
              </div>
            ) : format === 'Excel' ? (
              <div className="w-10 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded">
                <span className="text-xs font-medium">XLS</span>
              </div>
            ) : (
              <div className="w-10 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded">
                <span className="text-xs font-medium">CSV</span>
              </div>
            )}
          </div>
          <div className="ml-4 overflow-hidden">
            <h3 className="text-sm font-medium text-gray-800 break-words">{title}</h3>
            <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 gap-x-1">
              <span>{type}</span>
              <span className="hidden sm:inline">•</span>
              <span>{formatDate(date)}</span>
              <span className="hidden sm:inline">•</span>
              <span>{size}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <Download size={16} />
          </button>
        </div>
      </div>
    </li>
  );
};

// Add Customer Modal Component
const AddCustomerModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Wholesaler',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'Net 30',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
    
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
      setIsSubmitting(true);
      const success = await onSubmit(formData);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to add customer. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An error occurred while adding the customer.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Add New Customer</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
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
                Customer Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer</option>
                <option value="Distributor">Distributor</option>
                <option value="Processor">Processor</option>
                <option value="Direct Consumer">Direct Consumer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms *
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Net 15">Net 15 (Due in 15 days)</option>
                <option value="Net 30">Net 30 (Due in 30 days)</option>
                <option value="Net 45">Net 45 (Due in 45 days)</option>
                <option value="Net 60">Net 60 (Due in 60 days)</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Custom">Custom</option>
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
                placeholder="Additional information about this customer..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Expense Modal Component
const AddExpenseModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    vendor: '',
    description: '',
    payment_method: 'Cash',
    status: 'Pending',
    receipt: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
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
      setIsSubmitting(true);
      setError(null);
      
      // Send data to parent component's onSubmit handler
      await onSubmit(formData);
      
      // Close modal on success
      onClose();
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        receipt: e.target.files[0]
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8 mx-auto max-h-[85vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium text-gray-800">Add Expense</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                <option value="Feed">Feed</option>
                <option value="Labor">Labor</option>
                <option value="Utilities">Utilities</option>
                <option value="Veterinary">Veterinary</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Supplies">Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Additional details about this expense..."
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
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
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (Optional)
            </label>
            <div className="mt-1 flex items-center">
              {formData.receipt ? (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {formData.receipt.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, receipt: null})}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                </label>
              )}
            </div>
          </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditExpenseModal = ({ expense, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: expense.date,
    category: expense.category,
    amount: expense.amount,
    vendor: expense.vendor,
    description: expense.description || '',
    payment_method: expense.payment_method,
    status: expense.status,
    receipt: null,
    receipt_url: expense.receipt_url || null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
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
      setIsSubmitting(true);
      setError(null);
      await onSubmit(formData);
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        receipt: e.target.files[0],
        receipt_url: null // Clear existing URL as we'll upload a new one
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Edit Expense</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                <option value="Feed">Feed</option>
                <option value="Labor">Labor</option>
                <option value="Utilities">Utilities</option>
                <option value="Veterinary">Veterinary</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Supplies">Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Additional details about this expense..."
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
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
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (Optional)
            </label>
            <div className="mt-1">
              {formData.receipt ? (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {formData.receipt.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      receipt: null,
                      receipt_url: expense.receipt_url // Restore original URL
                    })}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : formData.receipt_url ? (
                <div className="flex items-center">
                  <a 
                    href={formData.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 mr-2"
                  >
                    View current receipt
                  </a>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, receipt_url: null})}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="file-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    id="file-upload-edit" 
                    name="file-upload-edit" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProcessPayrollModal = ({ onClose, onSubmit, employees }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Monthly Salary',
    notes: '',
    selectedEmployees: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize with all employees selected
  useEffect(() => {
    if (employees && employees.length > 0) {
      // Filter employees based on payment type
      const eligibleEmployees = employees.filter(emp => {
        if (formData.type === 'Monthly Salary') {
          return emp.salary > 0;
        } else {
          return emp.hourlyRate > 0;
        }
      });
      
      // Prepare employee payment records
      const empPayments = eligibleEmployees.map(emp => {
        const isSalaried = emp.salary > 0;
        const monthlyPay = isSalaried ? emp.salary / 12 : 0;
        const hourlyPay = !isSalaried ? emp.hourlyRate : 0;
        const hoursWorked = !isSalaried ? 80 : 0; // Default bi-weekly hours
        const grossPay = isSalaried ? monthlyPay : hourlyPay * hoursWorked;
        const taxRate = emp.taxWithholding || 15;
        const deductions = grossPay * (taxRate / 100);
        
        return {
          employee_id: emp.id,
          name: emp.name,
          position: emp.position,
          is_salaried: isSalaried,
          salary: emp.salary || 0,
          hourly_rate: emp.hourlyRate || 0,
          hours_worked: hoursWorked,
          gross_pay: grossPay,
          deductions: deductions,
          net_pay: grossPay - deductions
        };
      });
      
      setFormData(prev => ({...prev, selectedEmployees: empPayments}));
    }
  }, [employees, formData.type]);
  
  // Calculate total amount
  const totalAmount = formData.selectedEmployees.reduce((sum, emp) => sum + emp.gross_pay, 0);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  };
  
  // Handle changes to employee payroll details
  const handleEmployeeChange = (empId, field, value) => {
    setFormData(prev => {
      const updatedEmployees = prev.selectedEmployees.map(emp => {
        if (emp.employee_id === empId) {
          const updatedEmp = { ...emp, [field]: value };
          
          // Recalculate values if necessary
          if (field === 'hours_worked' || field === 'hourly_rate') {
            updatedEmp.gross_pay = updatedEmp.hourly_rate * updatedEmp.hours_worked;
            updatedEmp.deductions = updatedEmp.gross_pay * (emp.tax_rate || 15) / 100;
            updatedEmp.net_pay = updatedEmp.gross_pay - updatedEmp.deductions;
          } else if (field === 'gross_pay') {
            updatedEmp.deductions = value * (emp.tax_rate || 15) / 100;
            updatedEmp.net_pay = value - updatedEmp.deductions;
          } else if (field === 'deductions') {
            updatedEmp.net_pay = updatedEmp.gross_pay - value;
          }
          
          return updatedEmp;
        }
        return emp;
      });
      
      return { ...prev, selectedEmployees: updatedEmployees };
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedEmployees.length === 0) {
      setError('No eligible employees selected for payment.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const payrollData = {
        payment_date: formData.date,
        payment_type: formData.type,
        notes: formData.notes,
        employees: formData.selectedEmployees,
        total_amount: totalAmount
      };

      const success = await onSubmit(payrollData);
      
      if (success) {
        onClose();
      } else {
        setError('Failed to process payroll. Please try again.');
      }
    } catch (err) {
      console.error('Error in payroll submission:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 my-8 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Process Payroll
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Monthly Salary">Monthly Salary</option>
                  <option value="Bi-weekly Wages">Bi-weekly Wages</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="totalAmount"
                    name="totalAmount"
                    value={formatCurrency(totalAmount).replace('$', '')}
                    readOnly
                    className="block w-full pl-7 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm focus:outline-none sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional notes for this payroll..."
              ></textarea>
            </div>
            
            <div>
              <h4 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-2">Employee Payments</h4>
              <div className="border rounded-xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      {formData.type === 'Bi-weekly Wages' && (
                        <>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours
                          </th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                        </>
                      )}
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Pay
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.selectedEmployees.length > 0 ? (
                      formData.selectedEmployees.map((emp) => (
                        <tr key={emp.employee_id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {emp.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {emp.position}
                          </td>
                          {formData.type === 'Bi-weekly Wages' && (
                            <>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={emp.hours_worked}
                                  onChange={(e) => handleEmployeeChange(
                                    emp.employee_id, 
                                    'hours_worked', 
                                    parseFloat(e.target.value)
                                  )}
                                  min="0"
                                  step="0.5"
                                  className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-gray-500 mr-1">$</span>
                                  <input
                                    type="number"
                                    value={emp.hourly_rate}
                                    onChange={(e) => handleEmployeeChange(
                                      emp.employee_id, 
                                      'hourly_rate', 
                                      parseFloat(e.target.value)
                                    )}
                                    min="0"
                                    step="0.01"
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                  />
                                </div>
                              </td>
                            </>
                          )}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">$</span>
                              <input
                                type="number"
                                value={emp.gross_pay.toFixed(2)}
                                onChange={(e) => handleEmployeeChange(
                                  emp.employee_id, 
                                  'gross_pay', 
                                  parseFloat(e.target.value)
                                )}
                                min="0"
                                step="0.01"
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">$</span>
                              <input
                                type="number"
                                value={emp.deductions.toFixed(2)}
                                onChange={(e) => handleEmployeeChange(
                                  emp.employee_id, 
                                  'deductions', 
                                  parseFloat(e.target.value)
                                )}
                                min="0"
                                step="0.01"
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(emp.net_pay)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={formData.type === 'Bi-weekly Wages' ? 7 : 5} className="px-3 py-4 text-center text-sm text-gray-500">
                          No eligible employees for {formData.type}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity"
              disabled={isSubmitting || formData.selectedEmployees.length === 0}
            >
              {isSubmitting ? 'Processing...' : 'Process Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Invoice Modal Component
const AddInvoiceModal = ({ onClose, onSubmit, customers = [], toggleAddCustomerModal, selectedCustomer = null }) => {
  const [formData, setFormData] = useState({
    customer: '', // This will store the customer ID, not the name
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: '', amount: 0 }],
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Set default due date on component mount
  useEffect(() => {
    // Calculate due date 15 days from now as default
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 15);
    setFormData(prevData => ({
      ...prevData,
      dueDate: defaultDueDate.toISOString().split('T')[0]
    }));
  }, []);

  // Add item to invoice
  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: '', quantity: 1, unitPrice: '', amount: 0 }
      ]
    });
  };
  
  // Remove item from invoice
  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };
  
  // Handle item field changes and calculate amounts
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate amount if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].unitPrice) || 0;
      updatedItems[index].amount = quantity * unitPrice;
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // Calculate total amount of all items
  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Rest of the component remains the same
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Format items correctly
      const formattedItems = formData.items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        amount: parseFloat(item.amount)
      }));
      
      // Calculate total amount
      const totalAmount = formattedItems.reduce((sum, item) => sum + item.amount, 0);
      
      // Prepare the invoice data with proper customer ID
      const invoiceData = {
        customerId: formData.customer, // This is the customer ID
        date: formData.date,
        dueDate: formData.dueDate,
        amount: totalAmount,
        notes: formData.notes
      };
      
      const success = await onSubmit(invoiceData, formattedItems);
      if (success) {
        onClose();
      } else {
        setError('Failed to create invoice. Please try again.');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(`An error occurred: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 mx-auto max-h-[85vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium text-gray-800">Create New Invoice</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <div className="flex">
                <select
                  id="customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button" 
                  onClick={toggleAddCustomerModal} 
                  className="ml-2 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Invoice Items *</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-green-600 hover:text-green-500 font-medium flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add Item
                </button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="relative px-4 py-3 w-10">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            required
                            className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            min="1"
                            className="block w-20 border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="relative rounded-md">
                            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              required
                              min="0"
                              step="0.01"
                              className="block w-24 pl-5 border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(calculateTotal())}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Additional notes or payment instructions..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3 sticky bottom-0 bg-white z-10">
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
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Invoice Modal component
const ViewInvoiceModal = ({ invoice, isLoading, onClose, onStatusChange, onDelete }) => {
  if (!invoice) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-gray-100 my-8 mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Invoice Details - {invoice.invoice_number}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        {isLoading ? (
          <LoadingSpinner message='Loading Data...'/>
        ) : (
          <div className="px-6 py-4 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Customer Information</h4>
                <p className="text-sm text-gray-600 mt-2">{invoice.customers?.name}</p>
                <p className="text-sm text-gray-600">{invoice.customers?.email}</p>
                <p className="text-sm text-gray-600">{invoice.customers?.phone}</p>
                <p className="text-sm text-gray-600 break-words max-w-xs">{invoice.customers?.address}</p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <h4 className="text-lg font-medium text-gray-900">Invoice Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div className="text-sm text-gray-600">Invoice Number:</div>
                  <div className="text-sm font-medium text-gray-900 break-words">{invoice.invoice_number}</div>
                  
                  <div className="text-sm text-gray-600">Date:</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(invoice.date)}</div>
                  
                  <div className="text-sm text-gray-600">Due Date:</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(invoice.due_date)}</div>
                  
                  <div className="text-sm text-gray-600">Status:</div>
                  <div>
                    <select
                      value={invoice.status}
                      onChange={(e) => onStatusChange(invoice.id, e.target.value)}
                      className={`px-2 py-1 text-xs inline-flex rounded-full leading-5 font-semibold ${statusColors[invoice.status]} border-0 bg-transparent focus:ring-0 cursor-pointer`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Invoice Items</h4>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items && invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Total:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            </div>
            
            {invoice.notes && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {invoice.notes}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-t border-gray-200 pt-4">
              <div>
                <button
                  onClick={() => onDelete(invoice.id)}
                  className="px-4 py-2 w-full sm:w-auto border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all duration-300"
                >
                  Delete Invoice
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {invoice.status === 'Pending' && (
                  <button
                    onClick={() => onStatusChange(invoice.id, 'Paid')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-sm"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ViewCustomerModal = ({ customer, onClose }) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Customer Details
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 p-4">
              <h4 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-3">General Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm">{customer.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[customer.status]}`}>
                    {customer.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Terms</p>
                  <p className="text-sm">{customer.payment_terms}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 p-4">
              <h4 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Contact Person</p>
                  <p className="text-sm">{customer.contact_person || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm">{customer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm">{customer.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 p-4">
            <h4 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-3">Business Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Purchases</p>
                <p className="text-sm font-medium">{formatCurrency(customer.total_purchases || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Order</p>
                <p className="text-sm">{customer.last_order ? formatDate(customer.last_order) : 'No orders'}</p>
              </div>
            </div>
          </div>
          
          {customer.notes && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 p-4">
              <h4 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-2">Notes</h4>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const EditCustomerModal = ({ customer, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    type: customer?.type || 'Wholesaler',
    contact_person: customer?.contact_person || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    payment_terms: customer?.payment_terms || 'Net 30',
    status: customer?.status || 'Active',
    notes: customer?.notes || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
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
      setIsSubmitting(true);
      setError(null);
      
      const success = await onSubmit(customer.id, formData);
      if (success) {
        onClose();
      } else {
        setError('Failed to update customer. Please try again.');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Edit Customer</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer</option>
                <option value="Distributor">Distributor</option>
                <option value="Processor">Processor</option>
                <option value="Direct Consumer">Direct Consumer</option>
                <option value="Other">Other</option>
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
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
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms *
              </label>
              <select
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Net 15">Net 15 (Due in 15 days)</option>
                <option value="Net 30">Net 30 (Due in 30 days)</option>
                <option value="Net 45">Net 45 (Due in 45 days)</option>
                <option value="Net 60">Net 60 (Due in 60 days)</option>
                <option value="Due on Receipt">Due on Receipt</option>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Additional information about this customer..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Component to handle empty employee data
const EmptyEmployeeSection = ({ onRetry }) => {
  return (
    <div className="px-6 py-8 text-center">
      <div className="mb-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">No Employee Data Available</h3>
      <p className="text-sm text-gray-600 mb-6">
        Could not retrieve employee payroll information from the database.
      </p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        Retry Loading
      </button>
    </div>
  );
};

export default FinancesManagement;