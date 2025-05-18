// This function updates the revenue_data table with calculated monthly data
import { supabase } from '../../lib/supabase';

export const updateRevenueData = async () => {
  try {
    // Get data for all months in the current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
    
    // Fetch all invoices for the year
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('date, amount, status')
      .gte('date', startOfYear)
      .order('date', { ascending: true });
    
    if (invoiceError) throw invoiceError;
    
    // Fetch expenses for the same period
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('date, amount')
      .gte('date', startOfYear)
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
          month: String(date.getMonth() + 1),
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
          month: String(date.getMonth() + 1),
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
    
    // Upsert data into revenue_data table
    const upsertData = Object.values(monthlyData).map(item => ({
      month: item.month,
      year: item.year,
      income: item.income,
      expenses: item.expenses,
      profit: item.profit
    }));
    
    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from('revenue_data')
        .upsert(upsertData, { 
          onConflict: 'month,year',
          returning: false 
        });
        
      if (upsertError) throw upsertError;
      console.log(`Updated ${upsertData.length} months of revenue data`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating revenue data:', error);
    return false;
  }
};

// This function updates the revenue_categories table with calculated category data
export const updateRevenueCategories = async () => {
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
    
    // Group by categories based on descriptions
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
    
    // Format the data for insertion
    const categoryColors = {
      'Milk Sales': '#2E7D32',
      'Cattle Sales': '#1565C0',
      'Manure Sales': '#FFA000',
      'Other': '#6D4C41'
    };
    
    // First, delete existing categories
    const { error: deleteError } = await supabase
      .from('revenue_categories')
      .delete()
      .gte('created_at', startOfYear);
    
    if (deleteError) throw deleteError;
    
    // Then insert new category data
    const categoryData = Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0,
      color: categoryColors[name] || '#607D8B'
    }));
    
    if (categoryData.length > 0) {
      const { error: insertError } = await supabase
        .from('revenue_categories')
        .insert(categoryData);
        
      if (insertError) throw insertError;
      console.log(`Inserted ${categoryData.length} revenue categories`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating revenue categories:', error);
    return false;
  }
};

// Initialize both revenue tables with data if they're empty
export const initializeRevenueTables = async () => {
  try {
    
    // Check if revenue_data table has records
    const { data: revenueData, error: revenueDataError } = await supabase
      .from('revenue_data')
      .select('count', { count: 'exact', head: true });
    
    if (revenueDataError) throw revenueDataError;
    
    // Check if revenue_categories table has records
    const { data: revenueCategories, error: revenueCategoriesError } = await supabase
      .from('revenue_categories')
      .select('count', { count: 'exact', head: true });
    
    if (revenueCategoriesError) throw revenueCategoriesError;
    
    // Update tables if they're empty
    let updated = false;
    
    if (!revenueData || revenueData.count === 0) {
      await updateRevenueData();
      updated = true;
    }
    
    if (!revenueCategories || revenueCategories.count === 0) {
      await updateRevenueCategories();
      updated = true;
    }
    
    return updated;
  } catch (error) {
    console.error('Error initializing revenue tables:', error);
    return false;
  }
};
