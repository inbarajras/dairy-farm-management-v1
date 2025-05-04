import { supabase } from '../../lib/supabase';

// Date formatting utilities
export const formatMonth = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Handle both numeric and string months
  const monthIndex = isNaN(month) ? 
    months.findIndex(m => m.toLowerCase() === month.toLowerCase()) : 
    parseInt(month) - 1;
    
  return months[monthIndex] || month;
};

export const getCurrentMonth = () => {
  return (new Date().getMonth() + 1).toString();
};

export const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Expense Management
export const getMonthlyExpenseData = async (limit = 12) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get the start date for looking back 12 months
    const startDate = new Date(currentYear, currentMonth - 13, 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get all expenses within the date range
    const { data, error } = await supabase
      .from('expenses')
      .select('date, category, amount')
      .gte('date', startDateStr)
      .order('date', { ascending: true });
      
    if (error) throw error;
    
    // Group expenses by month and category
    const monthlyData = {};
    
    data.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: String(expenseDate.getMonth() + 1),
          year: expenseDate.getFullYear(),
          feed: 0,
          labor: 0,
          utilities: 0,
          veterinary: 0,
          maintenance: 0,
          other: 0,
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
          monthlyData[monthKey].other += parseFloat(expense.amount);
          break;
      }
    });
    
    // Convert to array sorted by date
    const result = Object.values(monthlyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return parseInt(a.month) - parseInt(b.month);
      })
      .slice(-limit);
    
    // Format month names
    return result.map(item => ({
      ...item,
      month: formatMonth(item.month)
    }));
  } catch (error) {
    console.error('Error fetching monthly expense data:', error);
    throw error;
  }
};

export const getRecentExpenses = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recent expenses:', error);
    throw error;
  }
};

export const addExpense = async (expenseData) => {
  try {
    // Handle file upload if a receipt is present
    let receipt_url = null;
    
    if (expenseData.receipt) {
      const file = expenseData.receipt;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;
      
      // Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(filePath);
        
      receipt_url = data.publicUrl;
    }
    
    // Format the expense data - remove receipt file object and add receipt_url
    const { receipt, ...restData } = expenseData;
    const formattedData = { 
      ...restData,
      receipt_url,  // Use receipt_url instead of receipt
      // Ensure amount is a number
      amount: parseFloat(expenseData.amount),
      // Add created_at and updated_at timestamps
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert into expenses table
    const { data, error } = await supabase
      .from('expenses')
      .insert([formattedData])
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Invoice Management
export const getRecentInvoices = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id (name)
      `)
      .order('date', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    // Format the data to match component expectations
    return data.map(invoice => ({
      ...invoice,
      customer: invoice.customers ? invoice.customers.name : 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    throw error;
  }
};


export const getInvoiceAging = async () => {
  try {
    const { data, error } = await supabase
      .from('invoice_aging')
      .select('*');
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching invoice aging data:', error);
    throw error;
  }
};

// Payroll Management - with employee relationship
export const getPayrollEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, job_title, salary, schedule')
      .eq('status', 'Active')
      .order('name');
      
    if (error) throw error;
    
    // Format for payroll display
    return data.map(employee => ({
      id: employee.id,
      name: employee.name,
      position: employee.job_title,
      salary: employee.salary,
      hourlyRate: employee.schedule.toLowerCase().includes('part-time') ? 
        parseFloat((employee.salary / 2080).toFixed(2)) : null,
      payPeriod: employee.schedule.toLowerCase().includes('part-time') ? 
        'Bi-weekly' : 'Monthly',
      // Calculate estimated last paid date (1st of current month)
      lastPaid: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    }));
  } catch (error) {
    console.error('Error fetching payroll employees:', error);
    throw error;
  }
};

export const getPayrollHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('payroll_history')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    throw error;
  }
};

export const getUpcomingPayroll = async () => {
  try {
    const { data, error } = await supabase
      .from('upcoming_payroll')
      .select('*')
      .order('date');
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching upcoming payroll:', error);
    throw error;
  }
};

export const getFinancialStats = async (month = getCurrentMonth(), year = getCurrentYear()) => {
  try {
    const { data, error } = await supabase
      .from('financial_stats')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .single();
      
    if (error) {
      // If error is "No rows found", return default values
      if (error.code === 'PGRST116') {
        return {
          month,
          year,
          net_profit: 0,
          revenue: 0,
          expenses: 0,
          cashflow: 0,
          previous_net_profit: 0,
          previous_revenue: 0,
          previous_expenses: 0,
          previous_cashflow: 0
        };
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching financial stats:', error);
    throw error;
  }
};

// Get monthly revenue data with zero data handling
export const getMonthlyRevenueData = async (limit = 12) => {
  try {
    const { data, error } = await supabase
      .from('revenue_data')
      .select('*')
      .order('year', { ascending: true })
      .order('month', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    // Return empty array if no data
    if (!data || data.length === 0) {
      return generateDefaultMonthlyData(limit);
    }
    
    // Map numeric month values to month names for chart display
    return data.map(item => ({
      ...item,
      month: formatMonth(item.month)
    }));
  } catch (error) {
    console.error('Error fetching monthly revenue data:', error);
    throw error;
  }
};

// Generate default monthly data when no data is available
const generateDefaultMonthlyData = (count = 12) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return Array.from({ length: count }, (_, i) => {
    // Calculate the month (going backwards from current month)
    const monthIndex = (currentMonth - i + 12) % 12;
    const year = currentYear - Math.floor((i - currentMonth) / 12);
    
    return {
      id: `default-${monthIndex}-${year}`,
      month: formatMonth(monthIndex + 1),
      year: year,
      income: 0,
      expenses: 0,
      profit: 0
    };
  }).reverse(); // Reverse to get chronological order
};

// Get revenue categories with default values
export const getRevenueCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('revenue_categories')
      .select('*');
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [
        { name: 'Milk Sales', value: 0, percentage: 0, color: '#2E7D32' },
        { name: 'Cattle Sales', value: 0, percentage: 0, color: '#1565C0' },
        { name: 'Manure Sales', value: 0, percentage: 0, color: '#FFA000' },
        { name: 'Other', value: 0, percentage: 0, color: '#6D4C41' }
      ];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching revenue categories:', error);
    throw error;
  }
};

const fetchInvoiceSummaryData = async () => {
  try {
    // Fetch all invoices to calculate summaries
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get current date for comparisons
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate summary data
    let outstanding = 0;
    let overdue = 0;
    let paid = 0;
    let paidThisMonth = 0;
    let issuedThisMonth = 0;
    
    let unpaidCount = 0;
    let overdueCount = 0;
    let paidCountThisMonth = 0;
    let issuedCountThisMonth = 0;
    
    // Process each invoice
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      const dueDate = new Date(invoice.due_date);
      
      // Check if issued this month
      if (invoiceDate.getMonth() === currentMonth && 
          invoiceDate.getFullYear() === currentYear) {
        issuedThisMonth += parseFloat(invoice.amount);
        issuedCountThisMonth++;
      }
      
      // Check status
      if (invoice.status === 'Paid') {
        paid += parseFloat(invoice.amount);
        
        // Check if paid this month
        if (invoiceDate.getMonth() === currentMonth && 
            invoiceDate.getFullYear() === currentYear) {
          paidThisMonth += parseFloat(invoice.amount);
          paidCountThisMonth++;
        }
      } else if (invoice.status === 'Pending') {
        outstanding += parseFloat(invoice.amount);
        unpaidCount++;
        
        // Check if overdue
        if (dueDate < now) {
          overdue += parseFloat(invoice.amount);
          overdueCount++;
        }
      }
    });
    
    // Get 5 recent invoices for the dashboard
    const recentInvoices = invoices.slice(0, 5).map(invoice => ({
      id: invoice.id,
      customer: invoice.customers?.name || 'Unknown Customer',
      amount: invoice.amount,
      dueDate: invoice.due_date,
      status: invoice.status
    }));
    
    return {
      outstanding,
      overdue,
      paid,
      paidThisMonth,
      issuedThisMonth,
      unpaidCount,
      overdueCount,
      paidCountThisMonth,
      issuedCountThisMonth,
      recent: recentInvoices
    };
  } catch (err) {
    console.error('Error fetching invoice summary:', err);
    return {
      outstanding: 0,
      overdue: 0,
      paid: 0,
      paidThisMonth: 0,
      issuedThisMonth: 0,
      unpaidCount: 0,
      overdueCount: 0,
      paidCountThisMonth: 0,
      issuedCountThisMonth: 0,
      recent: []
    };
  }
};

// Get full financial data for dashboard with robust error handling
export const getFinancialDashboardData = async () => {
  try {
    // Execute multiple queries in parallel with error handling for each
    const [
      statsResult,
      revenueMonthlyResult,
      revenueCategoriesResult,
      customersResult,
      expenseMonthlyResult,
      expenseCategoriesResult,
      recentExpensesResult,
      recentInvoicesResult,
      invoiceAgingResult,
      payrollEmployeesResult,
      payrollHistoryResult,
      upcomingPayrollResult
    ] = await Promise.allSettled([
      getFinancialStats(),
      getMonthlyRevenueData(),
      getRevenueCategories(),
      getCustomers(),
      getMonthlyExpenseData(),
      getExpenseCategories(),
      getRecentExpenses(),
      getRecentInvoices(),
      getInvoiceAging(),
      getPayrollEmployees(),
      getPayrollHistory(),
      getUpcomingPayroll()
    ]);
    
    // Extract data safely, providing defaults where needed
    const stats = statsResult.status === 'fulfilled' ? statsResult.value : getDefaultStats();
    const revenueMonthly = revenueMonthlyResult.status === 'fulfilled' ? revenueMonthlyResult.value : [];
    const revenueCategories = revenueCategoriesResult.status === 'fulfilled' ? revenueCategoriesResult.value : [];
    const customers = customersResult.status === 'fulfilled' ? customersResult.value : [];
    const expenseMonthly = expenseMonthlyResult.status === 'fulfilled' ? expenseMonthlyResult.value : [];
    const expenseCategories = expenseCategoriesResult.status === 'fulfilled' ? expenseCategoriesResult.value : [];
    const recentExpenses = recentExpensesResult.status === 'fulfilled' ? recentExpensesResult.value : [];
    const recentInvoices = recentInvoicesResult.status === 'fulfilled' ? recentInvoicesResult.value : [];
    const invoiceAging = invoiceAgingResult.status === 'fulfilled' ? invoiceAgingResult.value : [];
    const payrollEmployees = payrollEmployeesResult.status === 'fulfilled' ? payrollEmployeesResult.value : [];
    const payrollHistory = payrollHistoryResult.status === 'fulfilled' ? payrollHistoryResult.value : [];
    const upcomingPayroll = upcomingPayrollResult.status === 'fulfilled' ? upcomingPayrollResult.value : [];
    const invoiceSummary = await fetchInvoiceSummaryData();
    
    // Format data to match component structure
    return {
      financialStats: {
        invoices: invoiceSummary,
        netProfit: {
          current: stats.net_profit,
          previous: stats.previous_net_profit,
          change: calculatePercentageChange(stats.net_profit, stats.previous_net_profit)
        },
        revenue: {
          current: stats.revenue,
          previous: stats.previous_revenue,
          change: calculatePercentageChange(stats.revenue, stats.previous_revenue)
        },
        expenses: {
          current: stats.expenses,
          previous: stats.previous_expenses,
          change: calculatePercentageChange(stats.expenses, stats.previous_expenses)
        },
        cashflow: {
          current: stats.cashflow,
          previous: stats.previous_cashflow,
          change: calculatePercentageChange(stats.cashflow, stats.previous_cashflow)
        }
      },
      revenue: {
        monthly: revenueMonthly,
        categories: revenueCategories,
        customers: customers
      },
      expenses: {
        monthly: expenseMonthly,
        categories: expenseCategories,
        recent: recentExpenses
      },
      payroll: {
        employees: payrollEmployees,
        paymentHistory: payrollHistory,
        upcoming: upcomingPayroll
      }
    };
  } catch (error) {
    console.error('Error fetching financial dashboard data:', error);
    throw error;
  }
};

// Default stats when no data is available
const getDefaultStats = () => {
  return {
    net_profit: 0,
    revenue: 0,
    expenses: 0,
    cashflow: 0,
    previous_net_profit: 0,
    previous_revenue: 0,
    previous_expenses: 0,
    previous_cashflow: 0
  };
};

// Helper function to calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    if (current > 0) return 100; // If previous was 0 and now we have something, that's a 100% increase
    return 0; // If both are 0, there's no change
  }
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

export const getExpensesByPage = async (page = 1, limit = 10, search = '', startDate = null, endDate = null) => {
  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    
    // Start building the query
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' });
    
    // Add date range filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    // Add search filter if provided
    if (search) {
      query = query.or(`category.ilike.%${search}%,vendor.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Execute the query with pagination
    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching paginated expenses:', error);
    throw error;
  }
};

// Update an expense
export const updateExpense = async (expenseId, expenseData) => {
  try {
    // Handle file upload if a receipt is present
    let receipt_url = undefined; // Use undefined to avoid updating if no new file
    
    if (expenseData.receipt && expenseData.receipt instanceof File) {
      const file = expenseData.receipt;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;
      
      // Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(filePath);
        
      receipt_url = data.publicUrl;
    }
    
    // Format the expense data
    const { receipt, ...restData } = expenseData;
    const formattedData = { 
      ...restData,
      // Only include receipt_url if a new file was uploaded
      ...(receipt_url !== undefined && { receipt_url }),
      // Ensure amount is a number if it exists
      ...(expenseData.amount !== undefined && { amount: parseFloat(expenseData.amount) }),
      // Add updated_at timestamp
      updated_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('expenses')
      .update(formattedData)
      .eq('id', expenseId)
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (expenseId) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};
export const getExpenseCategories = async () => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
    
    // Get all expenses for the current year
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .gte('date', startOfYear);
      
    if (error) throw error;
    
    // Group by category
    const categories = {};
    let totalAmount = 0;
    
    data.forEach(expense => {
      const category = expense.category || 'Other';
      
      if (!categories[category]) {
        categories[category] = 0;
      }
      
      const amount = parseFloat(expense.amount);
      categories[category] += amount;
      totalAmount += amount;
    });
    
    // Assign colors to categories
    const categoryColors = {
      'Feed': '#2E7D32',
      'Labor': '#1565C0',
      'Utilities': '#FFA000',
      'Veterinary': '#F44336',
      'Maintenance': '#9E9E9E',
      'Supplies': '#6D4C41',
      'Equipment': '#5E35B1',
      'Other': '#607D8B'
    };
    
    // Format data for pie chart
    const result = Object.entries(categories).map(([name, value]) => {
      return {
        name,
        value,
        percentage: totalAmount ? Math.round((value / totalAmount) * 100) : 0,
        color: categoryColors[name] || '#607D8B'  // Default color if not defined
      };
    }).sort((a, b) => b.value - a.value);  // Sort by value descending
    
    return result;
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    
    // Return default values
    return [
      { name: 'Feed', value: 0, percentage: 0, color: '#2E7D32' },
      { name: 'Labor', value: 0, percentage: 0, color: '#1565C0' },
      { name: 'Utilities', value: 0, percentage: 0, color: '#FFA000' },
      { name: 'Veterinary', value: 0, percentage: 0, color: '#F44336' },
      { name: 'Maintenance', value: 0, percentage: 0, color: '#9E9E9E' }
    ];
  }
};

// Add these payroll-related functions to your financial service

// Fetch employee payroll history
export const getEmployeePayrollHistory = async (employeeId) => {
  try {
    const { data, error } = await supabase
      .from('employee_payroll_items')
      .select(`
        id,
        gross_pay,
        deductions,
        net_pay,
        hours_worked,
        pay_period_start,
        pay_period_end,
        payroll_payment_id,
        payroll_payments:payroll_payment_id (payment_date, status)
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Format data for easier consumption
    return data.map(item => ({
      id: item.id,
      payment_date: item.payroll_payments.payment_date,
      pay_period_start: item.pay_period_start,
      pay_period_end: item.pay_period_end,
      hours_worked: item.hours_worked,
      gross_pay: item.gross_pay,
      deductions: item.deductions,
      net_pay: item.net_pay,
      status: item.payroll_payments.status
    }));
  } catch (error) {
    console.error('Error fetching employee payroll history:', error);
    throw error;
  }
};

// Process employee payroll
export const processPayroll = async (payrollData) => {
  try {
    // Generate a payment ID (format: PAY-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const paymentId = `PAY-${dateStr}-${randomStr}`;
    
    // 1. Record the payroll batch
    const { data: paymentData, error: paymentError } = await supabase
      .from('payroll_payments')
      .insert({
        payment_id: paymentId,
        payment_date: payrollData.date,
        payment_type: payrollData.type,
        total_amount: payrollData.total_amount,
        notes: payrollData.notes,
        status: 'Completed'
      })
      .select();
    
    if (paymentError) throw paymentError;
    
    const payrollPaymentId = paymentData[0].id;
    
    // 2. Process individual employee payments
    const employeePayments = payrollData.employee_payments.map(payment => ({
      payroll_payment_id: payrollPaymentId,
      employee_id: payment.employee_id,
      salary_amount: payment.salary || null,
      hourly_rate: payment.hourly_rate || null,
      hours_worked: payment.hours_worked || 0,
      gross_pay: payment.gross_pay,
      deductions: payment.deductions,
      net_pay: payment.net_pay,
      pay_period_start: payment.pay_period_start,
      pay_period_end: payment.pay_period_end
    }));
    
    const { error: itemsError } = await supabase
      .from('employee_payroll_items')
      .insert(employeePayments);
    
    if (itemsError) throw itemsError;
    
    // 3. Update the last paid date for all employees in the employees table
    const employeeIds = payrollData.employee_payments.map(p => p.employee_id);
    
    const { error: updateError } = await supabase
      .from('employees')
      .update({ last_paid_date: payrollData.date })
      .in('id', employeeIds);
    
    if (updateError) throw updateError;
    
    return payrollPaymentId;
  } catch (error) {
    console.error('Error processing payroll:', error);
    throw error;
  }
};

// Update employee payroll information
export const updateEmployeePayrollInfo = async (employeeId, payrollInfo) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update({
        salary: payrollInfo.salary || null,
        hourly_rate: payrollInfo.hourlyRate || null,
        pay_schedule: payrollInfo.paySchedule,
        bank_account: payrollInfo.bankAccount || null,
        tax_withholding: payrollInfo.taxWithholding || 15
      })
      .eq('id', employeeId)
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error updating employee payroll info:', error);
    throw error;
  }
};

// Get payroll payment details
export const getPayrollDetails = async (paymentId) => {
  try {
    // Get the payment header
    const { data: payment, error: paymentError } = await supabase
      .from('payroll_payments')
      .select('*')
      .eq('id', paymentId)
      .single();
      
    if (paymentError) throw paymentError;
    
    // Get the payment items - update the query to use job_title instead of position
    const { data: items, error: itemsError } = await supabase
      .from('employee_payroll_items')
      .select(`
        *,
        employees:employee_id (id, name, job_title)
      `)
      .eq('payroll_payment_id', paymentId);
      
    if (itemsError) throw itemsError;
    
    // Map the items to use position as the property name to keep consistency with the UI
    const formattedItems = items.map(item => ({
      ...item,
      employees: item.employees ? {
        ...item.employees,
        position: item.employees.job_title // Add position alias for job_title
      } : null
    }));
    
    return {
      ...payment,
      items: formattedItems
    };
  } catch (error) {
    console.error('Error fetching payroll details:', error);
    throw error;
  }
};

// Void a payroll payment
export const voidPayrollPayment = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payroll_payments')
      .update({ status: 'Voided' })
      .eq('id', paymentId)
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error voiding payroll payment:', error);
    throw error;
  }
};

export const getInvoices = async (page = 1, limit = 10, query = '') => {
  try {
    // Build the base query with count option
    let queryBuilder = supabase
      .from('invoices')
      .select(`
        *,
        customers (id, name)
      `, { count: 'exact' });
    
    // Apply search filter if provided
    if (query) {
      queryBuilder = queryBuilder.or(`invoice_number.ilike.%${query}%,customers.name.ilike.%${query}%`);
    }
    
    // Get paginated data with count included
    const { data, error, count } = await queryBuilder
      .order('date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) throw error;
    
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Get invoice details by ID
export const getInvoiceById = async (id) => {
  try {
    // Get invoice header
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (id, name, email, phone, address)
      `)
      .eq('id', id)
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Get invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });
    
    if (itemsError) throw itemsError;
    
    return {
      ...invoice,
      items
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

// Add new invoice
export const addInvoice = async (invoiceData, invoiceItems) => {
  try {
    // Generate invoice number if not provided
    const invoiceNumber = invoiceData.invoiceNumber || generateInvoiceNumber();
    
    // 1. Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: invoiceData.customerId, // Ensure this is a UUID, not a customer name
        date: invoiceData.date,
        due_date: invoiceData.dueDate,
        amount: invoiceData.amount || invoiceItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
        status: 'Pending',
        notes: invoiceData.notes
      })
      .select();
    
    if (invoiceError) {
      console.error('Invoice insertion error:', invoiceError);
      throw invoiceError;
    }
    
    // 2. Insert invoice items
    const invoiceId = invoice[0].id;
    const formattedItems = invoiceItems.map(item => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.amount
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(formattedItems);
    
    if (itemsError) {
      // If items insertion fails, delete the invoice to maintain consistency
      await supabase.from('invoices').delete().eq('id', invoiceId);
      console.error('Invoice items insertion error:', itemsError);
      throw itemsError;
    }
    
    return invoice[0];
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// Update invoice status
export const updateInvoiceStatus = async (invoiceId, status) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', invoiceId)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

// Delete invoice
export const deleteInvoice = async (invoiceId) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Get invoice aging summary
export const getInvoiceAgingSummary = async () => {
  try {
    const { data, error } = await supabase
      .from('invoice_aging')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching invoice aging:', error);
    throw error;
  }
};

// Generate invoice number (format: INV-YYYYMMDD-XXXX)
export const generateInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${randomStr}`;
};

export const getCustomers = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Add a new customer
export const addCustomer = async (customerData) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customerData.name,
        type: customerData.type,
        contact_person: customerData.contactPerson,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        payment_terms: customerData.paymentTerms,
        status: 'Active',
        notes: customerData.notes
      })
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Update an existing customer
export const updateCustomer = async (customerId, customerData) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: customerData.name,
        type: customerData.type,
        contact_person: customerData.contact_person,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        payment_terms: customerData.payment_terms,
        status: customerData.status,
        notes: customerData.notes,
        updated_at: new Date()
      })
      .eq('id', customerId)
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (customerId) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};