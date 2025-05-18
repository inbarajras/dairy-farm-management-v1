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

// Function to get the last working day of a month (excluding weekends)
export const getLastWorkingDayOfMonth = (year, month) => {
  // Set date to the last day of the specified month
  const date = new Date(year, month + 1, 0);
  
  console.log(`getLastWorkingDayOfMonth called for ${month + 1}/${year}`);
  console.log(`Last day of month: ${date.toISOString().split('T')[0]}`);
  
  // Keep going back until we find a weekday (not Saturday or Sunday)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }
  
  console.log(`Last working day is: ${date.toISOString().split('T')[0]}`);
  
  return date;
};

// Function to get the next payroll date
export const getNextPayrollDate = () => {
  const today = new Date();
  // Always return the last working day of the current month
  return getLastWorkingDayOfMonth(today.getFullYear(), today.getMonth());
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
    console.log('Fetching recent invoices with limit:', limit);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id (name)
      `)
      .order('date', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    console.log('Raw recent invoices data:', data);
    
    // Format the data to match component expectations
    return data.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer: invoice.customers ? invoice.customers.name : 'Unknown',
      amount: invoice.amount,
      due_date: invoice.due_date,
      status: invoice.status
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
    console.log('Fetching payroll employees...');
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, job_title, salary, schedule')
      .eq('status', 'Active')
      .order('name');
      
    if (error) {
      console.error('Supabase error fetching employees:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No employees found in database');
      return [];
    }
    
    console.log('Raw employee data from DB:', data);
    
    // Format for payroll display
    const formattedEmployees = data.map(employee => {
      // Handle potential nulls or missing values with safe defaults
      const schedule = employee.schedule || '';
      const salary = employee.salary || 0;
      const isPartTime = schedule.toLowerCase().includes('part-time');
      
      return {
        id: employee.id || `emp-${Math.random().toString(36).substring(2, 9)}`,
        name: employee.name || 'Unnamed Employee',
        position: employee.job_title || 'Staff',
        salary: salary,
        hourlyRate: isPartTime ? parseFloat((salary / 2080).toFixed(2)) : null,
        payPeriod: isPartTime ? 'Bi-weekly' : 'Monthly'
      };
    });
    
    console.log('Formatted employee data:', formattedEmployees);
    return formattedEmployees;
  } catch (error) {
    console.error('Error fetching payroll employees:', error);
    // Return empty array instead of throwing to prevent UI breaking
    return [];
  }
};

export const getPayrollHistory = async () => {
  try {
    // Check if we should use payroll_payments (preferred) or the payroll_history view
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payroll_payments')
      .select('*')
      .order('payment_date', { ascending: false });
      
    if (!paymentsError && paymentsData && paymentsData.length > 0) {
    // Format from payroll_payments table to match expected structure
      return paymentsData.map(payment => ({
        id: payment.id,
        payment_id: payment.payment_id || payment.id,
        amount: payment.total_amount || payment.amount,
        total_amount: payment.total_amount || payment.amount,
        date: payment.payment_date || payment.date,
        payment_date: payment.payment_date || payment.date,
        type: payment.payment_type || 'Regular',
        payment_type: payment.payment_type || 'Regular',
        status: payment.status || 'Paid',
        employees: payment.employee_count || payment.employees || '-',
        employee_count: payment.employee_count || payment.employees || '-'
      }));
    }
    
    // Fallback to payroll_history view if needed
    const { data, error } = await supabase
      .from('payroll_history')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    // Normalize the data to have consistent property names
    return data.map(payment => ({
      id: payment.id,
      payment_id: payment.payment_id || payment.id,
      amount: payment.amount || 0,
      total_amount: payment.total_amount || payment.amount || 0,
      date: payment.date || payment.payment_date,
      payment_date: payment.payment_date || payment.date,
      type: payment.type || 'Regular',
      payment_type: payment.payment_type || payment.type || 'Regular',
      status: payment.status || 'Paid',
      employees: payment.employees || payment.employee_count || '-',
      employee_count: payment.employee_count || payment.employees || '-'
    }));
  } catch (error) {
    console.error('Error fetching payroll history:', error);
    throw error;
  }
};

export const getUpcomingPayroll = async () => {
  try {
    // Check if data exists in the database first
    const { data, error } = await supabase
      .from('upcoming_payroll')
      .select('*')
      .order('date');
      
    if (error) throw error;
    
    // If data exists, use it
    if (data && data.length > 0) {
      return data;
    }
    
    // Get current date
    const today = new Date();
    
    // Always set next payroll date to last working day of current month
    const currentMonthLastWorkingDay = getLastWorkingDayOfMonth(today.getFullYear(), today.getMonth());
    console.log("Next payroll date calculated as:", currentMonthLastWorkingDay.toISOString().split('T')[0]);
    
    // Calculate estimated payroll amount based on active employees
    // Fetch all employees to calculate an estimate
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('salary, hourly_rate')
      .eq('status', 'Active');
      
    if (empError) throw empError;
    
    let estimatedPayroll = 0;
    const employeesCount = employees ? employees.length : 0;
    
    if (employees && employees.length > 0) {
      estimatedPayroll = employees.reduce((sum, emp) => {
        if (emp.salary) {
          return sum + (emp.salary / 12); // Monthly salary
        } else if (emp.hourly_rate) {
          return sum + (emp.hourly_rate * 160); // Assuming 160 hours per month
        }
        return sum;
      }, 0);
    } else {
      estimatedPayroll = 42000; // Default value
    }
    
    return [{
      id: 'next-payroll',
      date: currentMonthLastWorkingDay.toISOString().split('T')[0],
      type: 'Monthly Salary',
      estimated_amount: estimatedPayroll,
      employees: employeesCount
    }];
  } catch (error) {
    console.error('Error fetching upcoming payroll:', error);
    throw error;
  }
};

// Function to update upcoming payroll information
export const updateUpcomingPayroll = async (payrollData) => {
  try {
    // Check if any record exists
    const { data: existingRecords, error: checkError } = await supabase
      .from('upcoming_payroll')
      .select('id')
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingRecords) {
      // Update existing record
      const { data, error } = await supabase
        .from('upcoming_payroll')
        .update({
          date: payrollData.date,
          type: payrollData.type,
          estimated_amount: parseFloat(payrollData.amount || 0)
        })
        .eq('id', existingRecords.id)
        .select();
        
      if (error) throw error;
      return data[0];
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('upcoming_payroll')
        .insert({
          date: payrollData.date,
          type: payrollData.type,
          estimated_amount: parseFloat(payrollData.amount || 0),
          notes: payrollData.notes || null,
          employees: payrollData.employees_count || 0
        })
        .select();
        
      if (error) throw error;
      return data[0];
    }
  } catch (error) {
    console.error('Error updating upcoming payroll:', error);
    throw error;
  }
};

export const getFinancialStats = async (month = getCurrentMonth(), year = getCurrentYear()) => {
  try {
    console.log(`Calculating financial stats for ${month}/${year}`);
    
    // Calculate start and end dates for current month
    const currentMonthStart = new Date(year, month - 1, 1);
    const currentMonthEnd = new Date(year, month, 0);
    
    // Format dates as ISO strings for Supabase queries
    const currentMonthStartStr = currentMonthStart.toISOString().split('T')[0];
    const currentMonthEndStr = currentMonthEnd.toISOString().split('T')[0];
    
    // Calculate start and end dates for previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthStart = new Date(prevYear, prevMonth - 1, 1);
    const prevMonthEnd = new Date(prevYear, prevMonth, 0);
    
    // Format previous month dates as ISO strings
    const prevMonthStartStr = prevMonthStart.toISOString().split('T')[0];
    const prevMonthEndStr = prevMonthEnd.toISOString().split('T')[0];
    
    console.log(`Current month period: ${currentMonthStartStr} to ${currentMonthEndStr}`);
    console.log(`Previous month period: ${prevMonthStartStr} to ${prevMonthEndStr}`);
    
    // Fetch current month's revenue (sum of paid invoices)
    const { data: currentRevenueData, error: currentRevenueError } = await supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'Paid')
      .gte('date', currentMonthStartStr)
      .lte('date', currentMonthEndStr);
    
    if (currentRevenueError) throw currentRevenueError;
    
    // Fetch previous month's revenue
    const { data: prevRevenueData, error: prevRevenueError } = await supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'Paid')
      .gte('date', prevMonthStartStr)
      .lte('date', prevMonthEndStr);
    
    if (prevRevenueError) throw prevRevenueError;
    
    // Fetch current month's expenses
    const { data: currentExpensesData, error: currentExpensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', currentMonthStartStr)
      .lte('date', currentMonthEndStr);
    
    if (currentExpensesError) throw currentExpensesError;
    
    // Fetch previous month's expenses
    const { data: prevExpensesData, error: prevExpensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', prevMonthStartStr)
      .lte('date', prevMonthEndStr);
    
    if (prevExpensesError) throw prevExpensesError;
    
    console.log(`Found ${currentRevenueData.length} revenue transactions for current month`);
    console.log(`Found ${prevRevenueData.length} revenue transactions for previous month`);
    console.log(`Found ${currentExpensesData.length} expense transactions for current month`);
    console.log(`Found ${prevExpensesData.length} expense transactions for previous month`);
    
    // Calculate totals
    const revenue = currentRevenueData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const previous_revenue = prevRevenueData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const expenses = currentExpensesData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const previous_expenses = prevExpensesData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Calculate net profit and cashflow
    const net_profit = revenue - expenses;
    const previous_net_profit = previous_revenue - previous_expenses;
    
    // For cashflow, we'll use the same calculation for now
    // In a more complex system, cashflow might include non-expense outflows and non-revenue inflows
    const cashflow = revenue - expenses;
    const previous_cashflow = previous_revenue - previous_expenses;
    
    console.log('Calculated financial metrics:');
    console.log(`Current revenue: ${revenue}, Previous: ${previous_revenue}`);
    console.log(`Current expenses: ${expenses}, Previous: ${previous_expenses}`);
    console.log(`Current net profit: ${net_profit}, Previous: ${previous_net_profit}`);
    console.log(`Current cashflow: ${cashflow}, Previous: ${previous_cashflow}`);
    
    // Return the calculated financial stats
    return {
      month,
      year,
      net_profit,
      revenue,
      expenses,
      cashflow,
      previous_net_profit,
      previous_revenue,
      previous_expenses,
      previous_cashflow
    };
  } catch (error) {
    console.error('Error calculating financial stats:', error);
    // Return default values in case of error
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
};

// Get monthly revenue data with zero data handling
export const getMonthlyRevenueData = async (limit = 12) => {
  try {
    console.log("Fetching monthly revenue data with limit:", limit);
    // Calculate date range for the last 12 months or specified limit
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (limit - 1), 1);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    // Fetch revenue data based on invoices
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('date, amount, status')
      .gte('date', formattedStartDate)
      .order('date', { ascending: true });
    
    if (invoiceError) throw invoiceError;
    
    // Fetch expenses for the same period for profit calculation
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('date, amount')
      .gte('date', formattedStartDate)
      .order('date', { ascending: true });
    
    if (expenseError) throw expenseError;
    
    // Group by month
    const monthlyData = {};
    
    // Process invoice data (revenue)
    invoiceData.forEach(invoice => {
      // Only count paid or completed invoices as revenue
      if (invoice.status !== 'Paid' && invoice.status !== 'Completed') return;
      
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: formatMonth(date.getMonth() + 1),
          year: date.getFullYear(),
          income: 0,
          expenses: 0,
          profit: 0
        };
      }
      
      monthlyData[monthKey].income += parseFloat(invoice.amount);
    });
    
    // Process expense data
    expenseData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: formatMonth(date.getMonth() + 1),
          year: date.getFullYear(),
          income: 0,
          expenses: 0,
          profit: 0
        };
      }
      
      monthlyData[monthKey].expenses += parseFloat(expense.amount);
    });
    
    // Calculate profit for each month
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].profit = monthlyData[key].income - monthlyData[key].expenses;
    });
    
    // Convert to array and sort by date
    const resultArray = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthToNum = month => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
      return monthToNum(a.month) - monthToNum(b.month);
    });
    
    console.log("Monthly revenue data generated:", resultArray);
    
    // If we don't have enough data, fill in with default values
    if (resultArray.length < limit) {
      const defaultData = generateDefaultMonthlyData(limit).filter(defaultItem => {
        // Only include default items for months not already in our result
        return !resultArray.some(item => 
          item.month === defaultItem.month && item.year === defaultItem.year);
      });
      
      // Combine real data with default data and sort again
      return [...resultArray, ...defaultData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthToNum = month => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
        return monthToNum(a.month) - monthToNum(b.month);
      }).slice(-limit); // Take only the latest months up to limit
    }
    
    return resultArray.slice(-limit); // Take only the latest months up to limit
  } catch (error) {
    console.error('Error fetching monthly revenue data:', error);
    return generateDefaultMonthlyData(limit);
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
      upcomingPayrollResult,
      payrollDistributionResult,
      payrollTrendsResult
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
      getUpcomingPayroll(),
      getPayrollCostDistribution(),
      getMonthlyPayrollTrends()
    ]);
    
    // Extract data safely, providing defaults where needed
    const stats = statsResult.status === 'fulfilled' ? statsResult.value : getDefaultStats();
    console.log('Financial stats processed:', stats);
    const revenueMonthly = revenueMonthlyResult.status === 'fulfilled' ? revenueMonthlyResult.value : [];
    const revenueCategories = revenueCategoriesResult.status === 'fulfilled' ? revenueCategoriesResult.value : [];
    const customers = customersResult.status === 'fulfilled' ? customersResult.value : [];
    const expenseMonthly = expenseMonthlyResult.status === 'fulfilled' ? expenseMonthlyResult.value : [];
    const expenseCategories = expenseCategoriesResult.status === 'fulfilled' ? expenseCategoriesResult.value : [];
    const recentExpenses = recentExpensesResult.status === 'fulfilled' ? recentExpensesResult.value : [];
    const recentInvoices = recentInvoicesResult.status === 'fulfilled' ? recentInvoicesResult.value : [];
    const invoiceAging = invoiceAgingResult.status === 'fulfilled' ? invoiceAgingResult.value : [];
    
    // Ensure we have valid data with defaults
    const payrollEmployees = payrollEmployeesResult.status === 'fulfilled' ? payrollEmployeesResult.value || [] : [];
    console.log('Payroll employees result:', payrollEmployeesResult);
    console.log('Payroll employees processed:', payrollEmployees);
    
    const payrollHistory = payrollHistoryResult.status === 'fulfilled' && payrollHistoryResult.value ? 
      payrollHistoryResult.value : [];
    const upcomingPayroll = upcomingPayrollResult.status === 'fulfilled' && upcomingPayrollResult.value ? 
      upcomingPayrollResult.value : [];
    const payrollDistribution = payrollDistributionResult.status === 'fulfilled' ? 
      payrollDistributionResult.value : getDefaultPayrollDistribution();
    console.log('Payroll distribution result:', payrollDistributionResult);
    console.log('Payroll distribution processed:', payrollDistribution);
    const payrollTrends = payrollTrendsResult.status === 'fulfilled' ? payrollTrendsResult.value : [];
    // Try to fetch employees directly if the result is empty
    let employeesData = payrollEmployees;
    if (!employeesData || employeesData.length === 0) {
      console.log('No employees from parallel fetch, trying direct fetch');
      try {
        employeesData = await getPayrollEmployees();
        console.log('Direct fetch employees result:', employeesData);
      } catch (err) {
        console.error('Direct employee fetch also failed:', err);
        employeesData = []; // Ensure we have an empty array at minimum
      }
    }
    
    const invoiceSummary = await fetchInvoiceSummaryData();
    
    console.log('Recent invoices data:', recentInvoices);
    console.log('Invoice summary data:', invoiceSummary);
    
    // Debug payroll dates
    console.log('Payroll history:', payrollHistory);
    console.log('Last payroll date:', payrollHistory && payrollHistory.length > 0 ? payrollHistory[0].payment_date : 'No history');
    console.log('Upcoming payroll:', upcomingPayroll);
    console.log('Next payroll date:', upcomingPayroll && upcomingPayroll.length > 0 ? upcomingPayroll[0].date : 'No upcoming');
    
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
      invoices: {
        recent: recentInvoices,
        aging: invoiceAging
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
        employees: employeesData,
        paymentHistory: payrollHistory,
        upcoming: upcomingPayroll,
        // Distribution data for pie chart
        distribution: payrollDistribution,
        // Monthly trends data for line chart
        trends: payrollTrends,
        // Calculate additional payroll metrics
        employeeCount: employeesData.length,
        // Calculate monthly cost from actual payroll payments within the current month
        monthlyCost: (() => {
          // If there are no payroll history records, fall back to estimate from employee data
          if (!payrollHistory || payrollHistory.length === 0) {
            return employeesData.reduce((sum, employee) => {
              // Calculate monthly cost based on salary or hourly rate
              if (employee.salary) {
                return sum + (employee.salary / 12);
              } else if (employee.hourlyRate) {
                // Estimate monthly hours at 160 (40 hours per week * 4 weeks)
                return sum + (employee.hourlyRate * 160);
              }
              return sum;
            }, 0);
          }
          
          // Get current month and year
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          // Calculate sum of payments made in the current month that are not voided
          return payrollHistory
            .filter(payment => {
              const paymentDate = new Date(payment.payment_date || payment.date);
              return paymentDate.getMonth() === currentMonth && 
                     paymentDate.getFullYear() === currentYear && 
                     payment.status !== 'Voided';
            })
            .reduce((sum, payment) => sum + (payment.amount || payment.total_amount || 0), 0);
        })(),
        // Get the last payroll information
        // Get the last non-voided payroll information
        lastPayrollAmount: payrollHistory && payrollHistory.length > 0 ? 
          payrollHistory.find(p => p.status !== 'Voided')?.amount || 0 : 0,
        lastPayrollDate: payrollHistory && payrollHistory.length > 0 ? 
          payrollHistory.find(p => p.status !== 'Voided')?.payment_date || null : null,
        // Calculate YTD payroll (excluding voided payments)
        ytdCost: payrollHistory ? payrollHistory
          .filter(payment => payment.status !== 'Voided')
          .reduce((sum, payment) => sum + (payment.amount || 0), 0) : 0,
        ytdPayments: payrollHistory ? 
          payrollHistory.filter(payment => payment.status !== 'Voided').length : 0,
        // Get next payroll information
        nextPayrollDate: upcomingPayroll && upcomingPayroll.length > 0 ? 
          upcomingPayroll[0].date : getLastWorkingDayOfMonth(new Date().getFullYear(), new Date().getMonth()).toISOString().split('T')[0],
        estimatedNextPayroll: upcomingPayroll && upcomingPayroll.length > 0 ? 
          upcomingPayroll[0].estimated_amount : 0
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
  // Ensure inputs are numbers
  current = parseFloat(current) || 0;
  previous = parseFloat(previous) || 0;
  
  // Handle edge cases
  if (previous === 0) {
    if (current === 0) {
      return 0; // No change if both are zero
    }
    return current > 0 ? 100 : -100; // 100% increase or decrease from zero
  }
  
  // Normal calculation with rounding to 1 decimal place
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return parseFloat(change.toFixed(1));
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
    // First, try to get data from employee_payroll_items
    const { data: payrollItems, error: payrollError } = await supabase
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
      
    if (!payrollError && payrollItems && payrollItems.length > 0) {
      console.log('Employee payroll items found:', payrollItems);
      
      // Format data for easier consumption
      return payrollItems.map(item => ({
        id: item.id,
        payment_date: item.payroll_payments?.payment_date || null,
        pay_period_start: item.pay_period_start,
        pay_period_end: item.pay_period_end,
        hours_worked: item.hours_worked || 0,
        gross_pay: item.gross_pay || 0,
        deductions: item.deductions || 0,
        net_pay: item.net_pay || 0,
        status: item.payroll_payments?.status || 'Paid'
      }));
    }
    
    // Fallback: try employee_payments view if no items found
    const { data: payments, error: paymentsError } = await supabase
      .from('employee_payments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('payment_date', { ascending: false });
      
    if (paymentsError) throw paymentsError;
    
    if (payments && payments.length > 0) {
      console.log('Employee payments found:', payments);
      return payments.map(payment => ({
        id: payment.id,
        payment_date: payment.payment_date,
        pay_period_start: payment.pay_period_start,
        pay_period_end: payment.pay_period_end,
        hours_worked: payment.hours_worked || 0,
        gross_pay: payment.gross_pay || payment.amount || 0,
        deductions: payment.deductions || 0,
        net_pay: payment.net_pay || payment.amount || 0,
        status: payment.status || 'Paid'
      }));
    }
    
    console.log('No payroll history found for employee:', employeeId);
    return [];
  } catch (error) {
    console.error('Error getting employee payroll history:', error);
    return [];
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
    console.log('Processing payroll with data:', payrollData);
    
    // 1. Record the payroll batch in payroll_payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('payroll_payments')
      .insert({
        payment_id: paymentId,
        payment_date: payrollData.payment_date,
        payment_type: payrollData.payment_type,
        total_amount: payrollData.total_amount,
        notes: payrollData.notes,
        status: 'Completed'
      })
      .select();
    
    if (paymentError) throw paymentError;
    
    const payrollPaymentId = paymentData[0].id;
    console.log(`Created payroll payment with ID: ${payrollPaymentId}`);
    
    // 2. Record individual employee payment items in employee_payroll_items
    if (payrollData.employees && payrollData.employees.length > 0) {
      const payrollItems = payrollData.employees.map(emp => {
        // Calculate pay period (for a monthly payment, it's typically the 1st to last day of month)
        const paymentDate = new Date(payrollData.payment_date);
        const payPeriodEnd = new Date(paymentDate);
        
        // For monthly payments, use first day of month to last day of month
        let payPeriodStart;
        if (payrollData.payment_type === 'Monthly Salary') {
          payPeriodStart = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
        } 
        // For bi-weekly, use 2 weeks before payment date
        else {
          payPeriodStart = new Date(paymentDate);
          payPeriodStart.setDate(payPeriodStart.getDate() - 14);
        }
        
        return {
          payroll_payment_id: payrollPaymentId,
          employee_id: emp.employee_id,
          salary_amount: emp.is_salaried ? emp.salary / 12 : null, // Monthly portion of annual salary
          hourly_rate: !emp.is_salaried ? emp.hourly_rate : null,
          hours_worked: emp.hours_worked || 0,
          gross_pay: emp.gross_pay,
          deductions: emp.deductions,
          net_pay: emp.net_pay,
          pay_period_start: payPeriodStart.toISOString().split('T')[0],
          pay_period_end: payPeriodEnd.toISOString().split('T')[0]
        };
      });
      
      console.log(`Inserting ${payrollItems.length} employee payroll items`);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('employee_payroll_items')
        .insert(payrollItems)
        .select();
      
      if (itemsError) {
        console.error('Error inserting employee payroll items:', itemsError);
        // If we fail to insert items, rollback the payment by setting status to 'Error'
        await supabase
          .from('payroll_payments')
          .update({ status: 'Error' })
          .eq('id', payrollPaymentId);
        
        throw itemsError;
      }
      
      console.log(`Successfully inserted ${itemsData.length} employee payroll items`);
    } else {
      console.warn('No employee data provided for payroll processing');
    }
    
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
        // hourly_rate: payrollInfo.hourlyRate || null,
        // pay_schedule: payrollInfo.paySchedule,
        bank_account: payrollInfo.bankAccount || null,
        // tax_withholding: payrollInfo.taxWithholding || 15
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
    console.log('Fetching payroll details for ID:', paymentId);
    
    // Determine which field to query based on the ID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId);
    const queryField = isUuid ? 'id' : 'payment_id';
    
    console.log(`Using query field: ${queryField} for paymentId: ${paymentId}`);
    
    // Get the payment header
    let { data: payment, error: paymentError } = await supabase
      .from('payroll_payments')
      .select('*')
      .eq(queryField, paymentId)
      .single();
      
    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      
      // If not found with one field, try the other field
      if (paymentError.code === 'PGRST116' || paymentError.code === '22P02') {
        const alternativeField = isUuid ? 'payment_id' : 'id';
        console.log(`Trying alternative field: ${alternativeField}`);
        
        const { data: altPayment, error: altError } = await supabase
          .from('payroll_payments')
          .select('*')
          .eq(alternativeField, paymentId)
          .single();
          
        if (altError) throw altError;
        
        if (altPayment) {
          payment = altPayment;
        } else {
          throw new Error('Payment not found with either ID or payment_id');
        }
      } else {
        throw paymentError;
      }
    }
    
    // Get the payment items - update the query to use job_title instead of position
    // For voided payments, ensure we still show the items
    const { data: items, error: itemsError } = await supabase
      .from('employee_payroll_items')
      .select(`
        *,
        employees:employee_id (id, name, job_title)
      `)
      .eq('payroll_payment_id', payment.id);
      
    if (itemsError) throw itemsError;
    
    console.log(`Found ${items.length} payment items for payment ID ${payment.id}`);
    
    if (items.length === 0 && payment.status === 'Voided') {
      console.log('This is a voided payment with no items. Attempting to retrieve the original items');
      
      // For voided payments with no items, try to fetch the original items
      // We need to find the items in a different way, perhaps by using the payment_id
      const { data: archivedItems, error: archivedItemsError } = await supabase
        .from('employee_payroll_items_archive')
        .select(`
          *,
          employees:employee_id (id, name, job_title)
        `)
        .eq('payroll_payment_id', payment.id);
      
      if (!archivedItemsError && archivedItems && archivedItems.length > 0) {
        console.log(`Found ${archivedItems.length} archived items for voided payment`);
        
        // Map the archived items
        const formattedArchivedItems = archivedItems.map(item => ({
          ...item,
          employees: item.employees ? {
            ...item.employees,
            position: item.employees.job_title // Add position alias for job_title
          } : null
        }));
        
        return {
          ...payment,
          items: formattedArchivedItems
        };
      }
      
      // If archive table doesn't exist or has no records, check if we need to query differently
      // Try to find payment items that might have been associated with this payment
      // This is a fallback for systems where items don't get removed on void
      const { data: alternativeItems, error: alternativeItemsError } = await supabase
        .from('employee_payroll_items')
        .select(`
          *,
          employees:employee_id (id, name, job_title)
        `)
        .eq('payroll_payment_id', payment.id);
      
      if (!alternativeItemsError && alternativeItems && alternativeItems.length > 0) {
        console.log(`Found ${alternativeItems.length} alternative items for voided payment`);
        
        // Map the alternative items
        const formattedAlternativeItems = alternativeItems.map(item => ({
          ...item,
          employees: item.employees ? {
            ...item.employees,
            position: item.employees.job_title // Add position alias for job_title
          } : null
        }));
        
        return {
          ...payment,
          items: formattedAlternativeItems
        };
      }
    }
    
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
    console.log('Voiding payroll payment with ID:', paymentId);
    
    // Determine which field to query based on the ID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId);
    const queryField = isUuid ? 'id' : 'payment_id';
    
    console.log(`Using query field: ${queryField} for paymentId: ${paymentId}`);
    
    // Before updating, get the payment to make sure we have the correct ID
    const { data: paymentData, error: fetchError } = await supabase
      .from('payroll_payments')
      .select('*')
      .eq(queryField, paymentId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching payment before voiding:', fetchError);
      throw fetchError;
    }
    
    // Get the payment ID and make sure it exists
    const actualPaymentId = paymentData.id;
    console.log('Actual payment ID for voiding:', actualPaymentId);
    
    // Update payment status to Voided
    const { data, error } = await supabase
      .from('payroll_payments')
      .update({ status: 'Voided' })
      .eq('id', actualPaymentId)
      .select();
      
    if (error) throw error;
    
    // We do NOT update or delete the employee_payroll_items entries
    // so the payment details can still be viewed even when voided
    
    console.log('Successfully voided payment:', data[0]);
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

export const getRevenueData = async (dateRange = 'month') => {
  try {
    // Calculate date range based on filter
    let startDate = null;
    const now = new Date();
    
    switch (dateRange) {
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
      default:
        // Default to last 12 months
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    // Fetch revenue data based on invoices
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('date, amount, status')
      .gte('date', formattedStartDate)
      .order('date', { ascending: true });
    
    if (invoiceError) throw invoiceError;
    
    // Fetch expenses for the same period for profit calculation
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('date, amount')
      .gte('date', formattedStartDate)
      .order('date', { ascending: true });
    
    if (expenseError) throw expenseError;
    
    // Group by month
    const monthlyData = {};
    
    // Process invoice data (revenue)
    invoiceData.forEach(invoice => {
      // Only count paid or completed invoices as revenue
      if (invoice.status !== 'Paid' && invoice.status !== 'Completed') return;
      
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: formatMonth(date.getMonth() + 1),
          year: date.getFullYear(),
          income: 0,
          expenses: 0,
          profit: 0
        };
      }
      
      monthlyData[monthKey].income += parseFloat(invoice.amount);
    });
    
    // Process expense data
    expenseData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: formatMonth(date.getMonth() + 1),
          year: date.getFullYear(),
          income: 0,
          expenses: 0,
          profit: 0
        };
      }
      
      monthlyData[monthKey].expenses += parseFloat(expense.amount);
    });
    
    // Calculate profit for each month
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].profit = monthlyData[key].income - monthlyData[key].expenses;
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return [];
  }
};

// Get revenue breakdown by category
export const getRevenueCategoriesData = async () => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
    
    // Fetch all invoices with their items
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        status,
        invoice_items (description, amount)
      `)
      .eq('status', 'Paid')
      .gte('date', startOfYear);
    
    if (invoicesError) throw invoicesError;
    
    // Group by categories based on descriptions (this assumes descriptions contain category information)
    const categoryMap = {
      'milk': 'Milk Sales',
      'dairy': 'Milk Sales',
      'cattle': 'Cattle Sales',
      'animal': 'Cattle Sales',
      'cow': 'Cattle Sales',
      'manure': 'Manure Sales',
      'fertilizer': 'Manure Sales'
    };
    
    const categories = {
      'Milk Sales': 0,
      'Cattle Sales': 0,
      'Manure Sales': 0,
      'Other': 0
    };
    
    let totalRevenue = 0;
    
    invoices.forEach(invoice => {
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        // If we have line items, categorize them
        invoice.invoice_items.forEach(item => {
          let categoryFound = false;
          const description = item.description.toLowerCase();
          
          // Try to match description to a category
          for (const [keyword, category] of Object.entries(categoryMap)) {
            if (description.includes(keyword)) {
              categories[category] += parseFloat(item.amount);
              categoryFound = true;
              break;
            }
          }
          
          // If no category match, put in "Other"
          if (!categoryFound) {
            categories['Other'] += parseFloat(item.amount);
          }
          
          totalRevenue += parseFloat(item.amount);
        });
      } else {
        // If no line items, just add the full amount to "Other"
        categories['Other'] += parseFloat(invoice.amount);
        totalRevenue += parseFloat(invoice.amount);
      }
    });
    
    // Format the data for charts
    const categoryColors = {
      'Milk Sales': '#2E7D32',
      'Cattle Sales': '#1565C0',
      'Manure Sales': '#FFA000',
      'Other': '#6D4C41'
    };
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0,
      color: categoryColors[name] || '#607D8B'
    })).sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error fetching revenue categories:', error);
    
    // Return default values
    return [
      { name: 'Milk Sales', value: 0, percentage: 0, color: '#2E7D32' },
      { name: 'Cattle Sales', value: 0, percentage: 0, color: '#1565C0' },
      { name: 'Manure Sales', value: 0, percentage: 0, color: '#FFA000' },
      { name: 'Other', value: 0, percentage: 0, color: '#6D4C41' }
    ];
  }
};

// Get revenue summary statistics
export const getRevenueSummary = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    
    // Fetch all paid invoices for the year
    const { data, error } = await supabase
      .from('invoices')
      .select('date, amount')
      .eq('status', 'Paid')
      .gte('date', startOfYear);
      
    if (error) throw error;
    
    // Calculate total YTD revenue
    let totalYTD = 0;
    let monthlyRevenue = Array(12).fill(0);
    
    data.forEach(invoice => {
      const invoiceAmount = parseFloat(invoice.amount);
      totalYTD += invoiceAmount;
      
      // Track monthly amounts for average calculation
      const month = new Date(invoice.date).getMonth();
      monthlyRevenue[month] += invoiceAmount;
    });
    
    // Calculate average monthly revenue (use only months that have passed)
    const monthsElapsed = currentMonth;
    const totalRevenue = monthlyRevenue.slice(0, monthsElapsed).reduce((sum, val) => sum + val, 0);
    const avgMonthly = monthsElapsed > 0 ? totalRevenue / monthsElapsed : 0;
    
    // Calculate projected annual revenue
    const projectedAnnual = monthsElapsed > 0 ? (avgMonthly * 12) : 0;
    
    return {
      totalYTD,
      avgMonthly,
      projectedAnnual
    };
  } catch (error) {
    console.error('Error calculating revenue summary:', error);
    return {
      totalYTD: 0,
      avgMonthly: 0,
      projectedAnnual: 0
    };
  }
};

// Get customers with revenue data
export const getCustomersWithRevenue = async (limit = 5) => {
  try {
    // Fetch customers with their invoices
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        type,
        status,
        invoices (id, date, amount, status)
      `)
      .order('name')
      .limit(limit);
      
    if (error) throw error;
    
    // Process customer data
    return data.map(customer => {
      const paidInvoices = (customer.invoices || [])
        .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Completed');
      
      const totalPurchases = paidInvoices.reduce((sum, invoice) => 
        sum + parseFloat(invoice.amount), 0);
      
      const lastOrder = paidInvoices.length > 0 
        ? new Date(Math.max(...paidInvoices.map(inv => new Date(inv.date).getTime())))
        : null;
      
      return {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        totalPurchases,
        lastOrder: lastOrder ? lastOrder.toISOString() : null,
        status: customer.status || 'Active'
      };
    }).sort((a, b) => b.totalPurchases - a.totalPurchases); // Sort by highest revenue
  } catch (error) {
    console.error('Error fetching customers with revenue:', error);
    return [];
  }
};

// Fetch employee salary history
export const getEmployeeSalaryHistory = async (employeeId) => {
  try {
    // Get salary history from employee_payroll_items
    const { data, error } = await supabase
      .from('employee_payroll_items')
      .select(`
        id,
        employee_id,
        salary_amount,
        gross_pay,
        pay_period_start,
        pay_period_end
      `)
      .eq('employee_id', employeeId)
      .order('pay_period_start', { ascending: false });
      
    if (error) throw error;
    
    // Transform the data to match the expected format in the UI
    const formattedData = data.map((item, index) => {
      // Calculate percentage change if possible
      let percentageChange = null;
      if (index < data.length - 1) {
        const currentAmount = item.salary_amount || item.gross_pay;
        const previousAmount = data[index + 1].salary_amount || data[index + 1].gross_pay;
        if (previousAmount && currentAmount > previousAmount) {
          percentageChange = parseFloat(((currentAmount - previousAmount) / previousAmount * 100).toFixed(1));
        }
      }
      
      return {
        id: item.id,
        employee_id: item.employee_id,
        salary_amount: item.salary_amount || item.gross_pay, // Use salary_amount if available, otherwise use gross_pay
        effective_from: item.pay_period_start,
        effective_to: item.pay_period_end,
        reason: "Regular payment", // Default reason since this table doesn't store reasons
        percentage_change: percentageChange
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching employee salary history:', error);
    throw error;
  }
};

// Get payroll cost distribution data for pie chart
export const getPayrollCostDistribution = async () => {
  try {
    // First, get data from employee_payroll_items to analyze actual payments
    const { data: payrollItems, error: itemsError } = await supabase
      .from('employee_payroll_items')
      .select(`
        id,
        salary_amount,
        hourly_rate,
        hours_worked,
        gross_pay,
        payroll_payment_id,
        payroll_payments:payroll_payment_id (status),
        employees:employee_id (schedule)
      `)
      .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString()); // Get data for current year
      
    if (itemsError) throw itemsError;
    
    // Default structure for the distribution
    let distribution = {
      'Salaries': 0,
      'Hourly Wages': 0,
      'Bonuses': 0,
      'Overtime': 0
    };
    
    // If we have payroll data, calculate the actual distribution
    if (payrollItems && payrollItems.length > 0) {
      let totalAmount = 0;
      
      // Process each payroll item, filtering out voided payments
      payrollItems.forEach(item => {
        // Skip items from voided payments
        if (item.payroll_payments && item.payroll_payments.status === 'Voided') return;
        
        const grossPay = parseFloat(item.gross_pay) || 0;
        totalAmount += grossPay;
        
        // Determine the category based on employee payment type
        if (item.salary_amount) {
          distribution['Salaries'] += grossPay;
        } else if (item.hourly_rate) {
          // Check if there was overtime (assuming standard 40-hour work week for simplicity)
          const standardHours = 80; // Bi-weekly standard
          const hoursWorked = parseFloat(item.hours_worked) || 0;
          
          if (hoursWorked <= standardHours) {
            distribution['Hourly Wages'] += grossPay;
          } else {
            // Split between regular hours and overtime
            const regularPay = item.hourly_rate * standardHours;
            const overtimePay = grossPay - regularPay;
            
            distribution['Hourly Wages'] += regularPay;
            distribution['Overtime'] += overtimePay;
          }
        }
      });
      
      // If we don't have bonus data in the provided structure, we can check for bonuses in a separate query
      const { data: bonuses, error: bonusError } = await supabase
        .from('employee_bonuses') // Assuming this table exists
        .select('amount')
        .gte('date', new Date(new Date().getFullYear(), 0, 1).toISOString());
        
      // If the table exists and we have data, add bonuses
      if (!bonusError && bonuses && bonuses.length > 0) {
        distribution['Bonuses'] = bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount || 0), 0);
        totalAmount += distribution['Bonuses'];
      }
      
      // If no data found in some categories, use estimated percentages
      if (totalAmount === 0) {
        return getDefaultPayrollDistribution();
      }
      
      // Convert to percentage
      Object.keys(distribution).forEach(key => {
        distribution[key] = Math.round((distribution[key] / totalAmount) * 100);
      });
    } else {
      // If no payroll data, return default distribution
      return getDefaultPayrollDistribution();
    }
    
    // Format for pie chart
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: getPayrollCategoryColor(name)
    }));
  } catch (error) {
    console.error('Error fetching payroll cost distribution:', error);
    // Return default distribution in case of error
    return getDefaultPayrollDistribution();
  }
};

// Helper function to get default payroll distribution
const getDefaultPayrollDistribution = () => {
  return [
    { name: 'Salaries', value: 75, color: '#4CAF50' },
    { name: 'Hourly Wages', value: 15, color: '#2196F3' },
    { name: 'Bonuses', value: 5, color: '#FFC107' },
    { name: 'Overtime', value: 5, color: '#F44336' }
  ];
};

// Helper function to get color for payroll category
const getPayrollCategoryColor = (category) => {
  const colors = {
    'Salaries': '#4CAF50',
    'Hourly Wages': '#2196F3',
    'Bonuses': '#FFC107',
    'Overtime': '#F44336'
  };
  
  return colors[category] || '#607D8B'; // Default color if category not found
};

// Get monthly payroll trends for line chart
export const getMonthlyPayrollTrends = async () => {
  try {
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Calculate start date (Jan 1st of current year)
    const startDate = new Date(currentYear, 0, 1).toISOString().split('T')[0];
    
    // Query payroll_payments to get monthly payment data
    // Include status field so we can filter out voided payments
    const { data: payments, error } = await supabase
      .from('payroll_payments')
      .select('payment_date, total_amount, status')
      .gte('payment_date', startDate)
      .order('payment_date');
      
    if (error) throw error;
    
    // Process into monthly buckets
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with zero values for the current year so far
    const currentMonth = new Date().getMonth(); // 0-indexed: Jan = 0, Feb = 1, etc.
    
    for (let i = 0; i <= currentMonth; i++) {
      monthlyData[i] = {
        month: months[i],
        amount: 0
      };
    }
    
    // Aggregate payments by month, excluding voided payments
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        // Skip voided payments
        if (payment.status === 'Voided') return;
        
        const paymentDate = new Date(payment.payment_date);
        const month = paymentDate.getMonth();
        const amount = parseFloat(payment.total_amount) || 0;
        
        if (monthlyData[month]) {
          monthlyData[month].amount += amount;
        }
      });
    }
    
    // Convert to array format for chart
    const result = Object.values(monthlyData);
    
    return result;
  } catch (error) {
    console.error('Error fetching monthly payroll trends:', error);
    return [];
  }
};

