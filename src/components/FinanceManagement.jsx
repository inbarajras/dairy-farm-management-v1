import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Download, DollarSign, CreditCard, Briefcase, Calendar, ChevronDown, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,Pie } from 'recharts';

// Mock data for finances
const mockFinancialData = {
  // Revenue data
  revenue: {
    monthly: [
      { month: 'Jan', income: 32500, expenses: 26800, profit: 5700 },
      { month: 'Feb', income: 30200, expenses: 25100, profit: 5100 },
      { month: 'Mar', income: 34800, expenses: 27500, profit: 7300 },
      { month: 'Apr', income: 34300, expenses: 28650, profit: 5650 }
    ],
    categories: [
      { name: 'Milk Sales', value: 28450, percentage: 83, color: '#2E7D32' },
      { name: 'Cattle Sales', value: 3200, percentage: 9, color: '#1565C0' },
      { name: 'Manure Sales', value: 1850, percentage: 5, color: '#FFA000' },
      { name: 'Other', value: 800, percentage: 3, color: '#6D4C41' }
    ],
    customers: [
      { id: 'C001', name: 'Dairy Processors Inc.', type: 'Wholesaler', totalPurchases: 21500, status: 'Active', lastOrder: '2023-04-22' },
      { id: 'C002', name: 'Fresh Foods Market', type: 'Retailer', totalPurchases: 4300, status: 'Active', lastOrder: '2023-04-25' },
      { id: 'C003', name: 'Organic Farms Co-op', type: 'Distributor', totalPurchases: 2650, status: 'Active', lastOrder: '2023-04-20' }
    ]
  },
  
  // Expenses data
  expenses: {
    monthly: [
      { month: 'Jan', feed: 12500, labor: 8700, utilities: 2100, veterinary: 1800, maintenance: 1700 },
      { month: 'Feb', feed: 11800, labor: 8500, utilities: 1950, veterinary: 1250, maintenance: 1600 },
      { month: 'Mar', feed: 13200, labor: 8900, utilities: 2050, veterinary: 1650, maintenance: 1700 },
      { month: 'Apr', feed: 13800, labor: 9100, utilities: 2150, veterinary: 1900, maintenance: 1700 }
    ],
    categories: [
      { name: 'Feed', value: 13800, percentage: 48, color: '#2E7D32' },
      { name: 'Labor', value: 9100, percentage: 32, color: '#1565C0' },
      { name: 'Utilities', value: 2150, percentage: 8, color: '#FFA000' },
      { name: 'Veterinary', value: 1900, percentage: 6, color: '#F44336' },
      { name: 'Maintenance', value: 1700, percentage: 6, color: '#9E9E9E' }
    ],
    recent: [
      { id: 'E001', date: '2023-04-26', category: 'Feed', amount: 3450, vendor: 'Quality Feed Supplies', status: 'Paid' },
      { id: 'E002', date: '2023-04-25', category: 'Veterinary', amount: 650, vendor: 'Animal Health Services', status: 'Paid' },
      { id: 'E003', date: '2023-04-22', category: 'Utilities', amount: 520, vendor: 'Power & Water Co.', status: 'Pending' },
      { id: 'E004', date: '2023-04-20', category: 'Maintenance', amount: 380, vendor: 'Farm Equipment Repairs', status: 'Paid' },
      { id: 'E005', date: '2023-04-18', category: 'Labor', amount: 2275, vendor: 'Weekly Payroll', status: 'Paid' }
    ]
  },
  
  // Payroll data
  payroll: {
    employees: [
      { id: 'E001', name: 'John Doe', position: 'Farm Manager', salary: 75000, hourlyRate: null, payPeriod: 'Monthly', lastPaid: '2023-04-01' },
      { id: 'E002', name: 'Jane Smith', position: 'Livestock Specialist', salary: 62000, hourlyRate: null, payPeriod: 'Monthly', lastPaid: '2023-04-01' },
      { id: 'E003', name: 'David Johnson', position: 'Milking Technician', salary: null, hourlyRate: 22, payPeriod: 'Bi-weekly', lastPaid: '2023-04-15' },
      { id: 'E004', name: 'Emily Williams', position: 'Administrative Assistant', salary: 48000, hourlyRate: null, payPeriod: 'Monthly', lastPaid: '2023-04-01' },
      { id: 'E005', name: 'Michael Brown', position: 'Farm Hand', salary: 45000, hourlyRate: null, payPeriod: 'Monthly', lastPaid: '2023-04-01' }
    ],
    paymentHistory: [
      { id: 'P001', date: '2023-04-01', type: 'Monthly Salary', amount: 24200, employees: 4, status: 'Completed' },
      { id: 'P002', date: '2023-04-15', type: 'Bi-weekly Wages', amount: 1760, employees: 1, status: 'Completed' },
      { id: 'P003', date: '2023-03-15', type: 'Bi-weekly Wages', amount: 1670, employees: 1, status: 'Completed' },
      { id: 'P004', date: '2023-03-01', type: 'Monthly Salary', amount: 24200, employees: 4, status: 'Completed' }
    ],
    upcoming: [
      { id: 'UP001', date: '2023-05-01', type: 'Monthly Salary', estimatedAmount: 24200, employees: 4 },
      { id: 'UP002', date: '2023-04-30', type: 'Bi-weekly Wages', estimatedAmount: 1760, employees: 1 }
    ]
  },
  
  // Invoices data
  invoices: {
    recent: [
      { id: 'INV001', date: '2023-04-25', customer: 'Dairy Processors Inc.', amount: 7650, status: 'Paid', dueDate: '2023-05-10' },
      { id: 'INV002', date: '2023-04-22', customer: 'Fresh Foods Market', amount: 1250, status: 'Pending', dueDate: '2023-05-07' },
      { id: 'INV003', date: '2023-04-18', customer: 'Organic Farms Co-op', amount: 920, status: 'Pending', dueDate: '2023-05-03' },
      { id: 'INV004', date: '2023-04-15', customer: 'Dairy Processors Inc.', amount: 7800, status: 'Paid', dueDate: '2023-04-30' },
      { id: 'INV005', date: '2023-04-10', customer: 'Fresh Foods Market', amount: 1320, status: 'Paid', dueDate: '2023-04-25' }
    ],
    aging: [
      { period: 'Current', amount: 9820, percentage: 68 },
      { period: '1-30 days', amount: 3450, percentage: 24 },
      { period: '31-60 days', amount: 850, percentage: 6 },
      { period: '61-90 days', amount: 300, percentage: 2 },
      { period: '90+ days', amount: 0, percentage: 0 }
    ]
  },
  
  // Financial stats/KPIs
  financialStats: {
    netProfit: {
      current: 5650,
      previous: 7300, 
      change: -22.6
    },
    revenue: {
      current: 34300,
      previous: 34800,
      change: -1.4
    },
    expenses: {
      current: 28650,
      previous: 27500,
      change: 4.2
    },
    cashflow: {
      current: 6850,
      previous: 8200,
      change: -16.5
    }
  }
};

// Status badge colors
const statusColors = {
  'Paid': 'bg-green-100 text-green-800',
  'Pending': 'bg-amber-100 text-amber-800',
  'Overdue': 'bg-red-100 text-red-800',
  'Completed': 'bg-green-100 text-green-800',
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-gray-100 text-gray-800'
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Main financial management component
const FinancesManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('month');
  const [financialData, setFinancialData] = useState(mockFinancialData);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  
  // Toggle add expense modal
  const toggleAddExpenseModal = () => {
    setIsAddExpenseModalOpen(!isAddExpenseModalOpen);
  };
  
  // Toggle add invoice modal
  const toggleAddInvoiceModal = () => {
    setIsAddInvoiceModalOpen(!isAddInvoiceModalOpen);
  };
  
  return (
    <div className="h-full bg-gray-100">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Financial Management</h1>
          <div className="flex space-x-3">
            <button 
              onClick={toggleAddExpenseModal}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus size={20} className="mr-2" />
              Record Expense
            </button>
            <button 
              onClick={toggleAddInvoiceModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus size={20} className="mr-2" />
              Create Invoice
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'revenue'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'expenses'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'payroll'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payroll
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'invoices'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
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
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-sm text-gray-600">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <span>to</span>
              <input
                type="date"
                className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Net Profit</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-1">{formatCurrency(financialData.financialStats.netProfit.current)}</p>
                  </div>
                  <div className={`p-2 rounded-full ${financialData.financialStats.netProfit.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {financialData.financialStats.netProfit.change >= 0 ? 
                      <TrendingUp size={20} /> : 
                      <TrendingDown size={20} />
                    }
                  </div>
                </div>
                <div className={`mt-4 text-xs flex items-center ${financialData.financialStats.netProfit.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.financialStats.netProfit.change >= 0 ? (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  <span>{Math.abs(financialData.financialStats.netProfit.change)}% from previous period</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Revenue</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-1">{formatCurrency(financialData.financialStats.revenue.current)}</p>
                  </div>
                  <div className={`p-2 rounded-full ${financialData.financialStats.revenue.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {financialData.financialStats.revenue.change >= 0 ? 
                      <TrendingUp size={20} /> : 
                      <TrendingDown size={20} />
                    }
                  </div>
                </div>
                <div className={`mt-4 text-xs flex items-center ${financialData.financialStats.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.financialStats.revenue.change >= 0 ? (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  <span>{Math.abs(financialData.financialStats.revenue.change)}% from previous period</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expenses</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-1">{formatCurrency(financialData.financialStats.expenses.current)}</p>
                  </div>
                  <div className={`p-2 rounded-full ${financialData.financialStats.expenses.change <= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {financialData.financialStats.expenses.change <= 0 ? 
                      <TrendingDown size={20} /> : 
                      <TrendingUp size={20} />
                    }
                  </div>
                </div>
                <div className={`mt-4 text-xs flex items-center ${financialData.financialStats.expenses.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.financialStats.expenses.change <= 0 ? (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  <span>{Math.abs(financialData.financialStats.expenses.change)}% from previous period</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cash Flow</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-1">{formatCurrency(financialData.financialStats.cashflow.current)}</p>
                  </div>
                  <div className={`p-2 rounded-full ${financialData.financialStats.cashflow.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {financialData.financialStats.cashflow.change >= 0 ? 
                      <TrendingUp size={20} /> : 
                      <TrendingDown size={20} />
                    }
                  </div>
                </div>
                <div className={`mt-4 text-xs flex items-center ${financialData.financialStats.cashflow.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.financialStats.cashflow.change >= 0 ? (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  <span>{Math.abs(financialData.financialStats.cashflow.change)}% from previous period</span>
                </div>
              </div>
            </div>
            
            {/* Financial Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Income vs Expenses Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Income vs Expenses</h2>
                  <select className="border rounded-md px-3 py-1 text-sm bg-white">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financialData.revenue.monthly}
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
              
              {/* Expense Breakdown Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Expense Breakdown</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">April 2023</span>
                  </div>
                </div>
                <div className="h-80 flex flex-col md:flex-row items-center justify-between">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialData.expenses.categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {financialData.expenses.categories.map((entry, index) => (
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
                      {financialData.expenses.categories.map((category, index) => (
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
            
            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Expenses */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Expenses</h2>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {financialData.expenses.recent.map(expense => (
                    <div key={expense.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <DollarSign size={16} className="text-red-500 mr-2" />
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
              
              {/* Recent Invoices */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Invoices</h2>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {financialData.invoices.recent.map(invoice => (
                    <div key={invoice.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <Briefcase size={16} className="text-blue-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-800">
                              {invoice.id}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {invoice.customer}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-800">{formatCurrency(invoice.amount)}</p>
                          <p className="text-xs text-gray-500 mt-1">Due: {formatDate(invoice.dueDate)}</p>
                          <span className={`mt-1 inline-flex px-2 py-1 text-xs rounded-full ${statusColors[invoice.status]}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div>
            {/* Revenue Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Revenue</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={financialData.revenue.monthly}
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
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialData.revenue.categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {financialData.revenue.categories.map((entry, index) => (
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
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Revenue (YTD)</p>
                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(131800)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Avg. Monthly Revenue</p>
                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(32950)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Projected Annual Revenue</p>
                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(395400)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Customer Overview */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Customers</h2>
                <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  Add Customer
                </button>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                      {financialData.revenue.customers.map(customer => (
                        <tr key={customer.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.id}</div>
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
                            <a href="#" className="text-green-600 hover:text-green-900 mr-4">View</a>
                            <a href="#" className="text-blue-600 hover:text-blue-900 mr-4">Edit</a>
                            <a href="#" className="text-indigo-600 hover:text-indigo-900">Invoice</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Revenue Trends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Seasonal Patterns</h3>
                  <div className="h-64 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-gray-500">Revenue seasonal pattern chart would go here</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Year-over-Year Comparison</h3>
                  <div className="h-64 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-gray-500">Year-over-year comparison chart would go here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            {/* Expense Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Expense Summary</h2>
                <button 
                  onClick={toggleAddExpenseModal}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus size={20} className="mr-2" />
                  Add Expense
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Expense Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={financialData.expenses.monthly}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        stackOffset="expand"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                        <Legend />
                        <Bar dataKey="feed" name="Feed" stackId="a" fill="#2E7D32" />
                        <Bar dataKey="labor" name="Labor" stackId="a" fill="#1565C0" />
                        <Bar dataKey="utilities" name="Utilities" stackId="a" fill="#FFA000" />
                        <Bar dataKey="veterinary" name="Veterinary" stackId="a" fill="#F44336" />
                        <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#9E9E9E" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Month Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialData.expenses.categories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {financialData.expenses.categories.map((entry, index) => (
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
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Expense Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Expenses (YTD)</p>
                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(108050)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Avg. Monthly Expenses</p>
                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(27012.5)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Projected Annual Expenses</p>
                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(324150)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expense List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Expense Transactions</h2>
                <div className="flex space-x-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                    {financialData.expenses.recent.map(expense => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expense.id}
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
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[expense.status]}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-green-600 hover:text-green-900 mr-4">View</a>
                          <a href="#" className="text-blue-600 hover:text-blue-900">Edit</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing 5 of 24 transactions
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-transparent bg-green-600 text-white rounded-md text-sm">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div>
            {/* Payroll Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Payroll Summary</h2>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <Plus size={20} className="mr-2" />
                  Process Payroll
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Monthly Payroll</p>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(25960)}</p>
                  <p className="text-xs text-gray-500 mt-1">5 employees</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Next Payment Date</p>
                  <p className="text-xl font-semibold text-gray-800">May 1, 2023</p>
                  <p className="text-xs text-gray-500 mt-1">Monthly salary payments</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Payroll YTD</p>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(77830)}</p>
                  <p className="text-xs text-gray-500 mt-1">Jan - Apr 2023</p>
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-gray-700 mb-3">Upcoming Payments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialData.payroll.upcoming.map(payment => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.employees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.estimatedAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-green-600 hover:text-green-900">Process Now</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Employee Payroll Information */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Employee Payroll Information</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500 ml-2">({employee.id})</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.position}
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
                          <a href="#" className="text-green-600 hover:text-green-900 mr-4">View History</a>
                          <a href="#" className="text-blue-600 hover:text-blue-900">Edit</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <Download size={16} className="mr-2" />
                  Export Report
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                    {financialData.payroll.paymentHistory.map(payment => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.employees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[payment.status]}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-blue-600 hover:text-blue-900">Details</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            {/* Invoice Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Invoice Summary</h2>
                <button 
                  onClick={toggleAddInvoiceModal}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus size={20} className="mr-2" />
                  Create Invoice
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Outstanding</p>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(9820)}</p>
                  <p className="text-xs text-gray-500 mt-1">3 unpaid invoices</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(0)}</p>
                  <p className="text-xs text-gray-500 mt-1">0 overdue invoices</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Paid This Month</p>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(9120)}</p>
                  <p className="text-xs text-gray-500 mt-1">2 paid invoices</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Invoiced This Month</p>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(18940)}</p>
                  <p className="text-xs text-gray-500 mt-1">5 invoices</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Aging Summary</h3>
                  <div className="space-y-4">
                    {financialData.invoices.aging.map(period => (
                      <div key={period.period}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{period.period}</span>
                          <span className="text-sm font-medium text-gray-700">{formatCurrency(period.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              period.period === 'Current' ? 'bg-green-600' : 
                              period.period === '1-30 days' ? 'bg-blue-600' : 
                              period.period === '31-60 days' ? 'bg-amber-500' : 
                              period.period === '61-90 days' ? 'bg-orange-500' : 
                              'bg-red-600'
                            }`} 
                            style={{ width: `${period.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice Status</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Paid', value: 9120, color: '#4CAF50' },
                            { name: 'Pending', value: 9820, color: '#FFC107' }
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
                          <Cell fill="#FFC107" />
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{ background: '#fff', border: '1px solid #f1f1f1', borderRadius: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Invoice List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Recent Invoices</h2>
                <div className="flex space-x-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice ID
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
                    {financialData.invoices.recent.map(invoice => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href="#" className="text-green-600 hover:text-green-900 mr-4">View</a>
                          <a href="#" className="text-blue-600 hover:text-blue-900 mr-4">Edit</a>
                          {invoice.status === 'Pending' && (
                            <a href="#" className="text-indigo-600 hover:text-indigo-900">Mark Paid</a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing 5 of 12 invoices
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-transparent bg-green-600 text-white rounded-md text-sm">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            {/* Report Generation */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Financial Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    id="reportType"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                
                <div className="md:col-span-2">
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Output Format
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
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
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Generate Report
                </button>
              </div>
            </div>
            
            {/* Saved Reports */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Saved Reports</h2>
              </div>
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
        )}
      </div>
      
      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <AddExpenseModal onClose={toggleAddExpenseModal} />
      )}
      
      {/* Add Invoice Modal */}
      {isAddInvoiceModalOpen && (
        <AddInvoiceModal onClose={toggleAddInvoiceModal} />
      )}
    </div>
  );
};

// Report Item Component
const ReportItem = ({ title, type, date, format, size }) => {
  return (
    <li className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
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
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-800">{title}</h3>
            <div className="mt-1 flex items-center text-xs text-gray-500">
              <span>{type}</span>
              <span className="mx-1">•</span>
              <span>{formatDate(date)}</span>
              <span className="mx-1">•</span>
              <span>{size}</span>
            </div>
          </div>
        </div>
        <div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
            <Download size={16} />
          </button>
        </div>
      </div>
    </li>
  );
};

// Add Expense Modal Component
const AddExpenseModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    vendor: '',
    description: '',
    paymentMethod: 'Cash',
    receipt: null
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
    // Here you would make an API call to add the expense
    onClose();
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Add Expense</h3>
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
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
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

// Add Invoice Modal Component
const AddInvoiceModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customer: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: '', amount: 0 }],
    notes: ''
  });
  
  // Calculate due date 15 days from now as default
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 15);
    setFormData({
      ...formData,
      dueDate: defaultDueDate.toISOString().split('T')[0]
    });
  }, []);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Calculate item amount if unit price or quantity changes
    if (field === 'unitPrice' || field === 'quantity') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = quantity * unitPrice;
    }
    
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // Add a new item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: '', amount: 0 }]
    });
  };
  
  // Remove an item
  const removeItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // Calculate total
  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
    // Here you would make an API call to create the invoice
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Create New Invoice</h3>
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
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <select
                  id="customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a customer</option>
                  <option value="Dairy Processors Inc.">Dairy Processors Inc.</option>
                  <option value="Fresh Foods Market">Fresh Foods Market</option>
                  <option value="Organic Farms Co-op">Organic Farms Co-op</option>
                </select>
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

export default FinancesManagement;