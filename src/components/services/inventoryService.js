import { supabase } from '../../lib/supabase';

// Fetch all inventory items
export const fetchAllItems = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Add status based on stock levels
    return data.map(item => ({
      ...item,
      status: getItemStatus(item)
    }));
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
};

// Fetch items by department
export const fetchItemsByDepartment = async (department) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('department', department)
      .order('name');
    
    if (error) throw error;
    
    // Add status based on stock levels
    return data.map(item => ({
      ...item,
      status: getItemStatus(item)
    }));
  } catch (error) {
    console.error(`Error fetching ${department} items:`, error);
    throw error;
  }
};

// Fetch all orders
export const fetchAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        order_items:purchase_order_items(*)
      `)
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Fetch orders by department
export const fetchOrdersByDepartment = async (department) => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        order_items:purchase_order_items(*)
      `)
      .eq('department', department)
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${department} orders:`, error);
    throw error;
  }
};

// Fetch all suppliers
export const fetchSuppliers = async () => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

// Add new inventory item
export const addItem = async (itemData) => {
    try {
        // Create a copy of the data for modifications
        const dataToInsert = { ...itemData };
        
        // If supplier_id is empty string, set it to null
        // This will allow the database to handle it properly
        if (dataToInsert.supplier_id === '') {
        dataToInsert.supplier_id = null;
        }
        
        const { data, error } = await supabase
        .from('inventory_items')
        .insert({
            name: dataToInsert.name,
            description: dataToInsert.description,
            category: dataToInsert.category,
            department: dataToInsert.department,
            current_stock: parseFloat(dataToInsert.current_stock),
            unit: dataToInsert.unit,
            unit_price: parseFloat(dataToInsert.unit_price),
            reorder_level: parseFloat(dataToInsert.reorder_level),
            supplier_id: dataToInsert.supplier_id, // Now null instead of empty string
            location: dataToInsert.location,
            notes: dataToInsert.notes
        })
        .select()
        .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding inventory item:', error);
        throw error;
    }
};

// Update inventory item
export const updateItem = async (itemId, itemData) => {
  try {
    // Create update object only with fields that are present
    const updateData = {};
    if (itemData.name !== undefined) updateData.name = itemData.name;
    if (itemData.description !== undefined) updateData.description = itemData.description;
    if (itemData.category !== undefined) updateData.category = itemData.category;
    if (itemData.department !== undefined) updateData.department = itemData.department;
    if (itemData.current_stock !== undefined) updateData.current_stock = parseFloat(itemData.current_stock);
    if (itemData.unit !== undefined) updateData.unit = itemData.unit;
    if (itemData.unit_price !== undefined) updateData.unit_price = parseFloat(itemData.unit_price);
    if (itemData.reorder_level !== undefined) updateData.reorder_level = parseFloat(itemData.reorder_level);
    if (itemData.supplier_id !== undefined) updateData.supplier_id = itemData.supplier_id;
    if (itemData.location !== undefined) updateData.location = itemData.location;
    if (itemData.notes !== undefined) updateData.notes = itemData.notes;
    
    // Set last_updated to current timestamp
    updateData.last_updated = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating item ${itemId}:`, error);
    throw error;
  }
};

// Delete inventory item
export const deleteItem = async (itemId) => {
  try {
    console.log('Attempting to delete item:', itemId);

    const { data, error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .select();

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    console.log('Delete successful, deleted data:', data);
    return true;
  } catch (error) {
    console.error(`Error deleting item ${itemId}:`, error);
    throw error;
  }
};

// Place new order
export const placeOrder = async (orderData) => {
  try {
    // Start a transaction with supabase
    // Since supabase doesn't support true transactions in the client library,
    // we'll do our best to handle errors and consistency

    // 1. First, create the order
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderNumber,
        supplier_id: orderData.supplier_id,
        supplier_name: orderData.supplier_name,
        department: orderData.department,
        order_date: new Date().toISOString(),
        expected_delivery: orderData.expected_delivery,
        status: orderData.status || 'Pending',
        total_amount: calculateOrderTotal(orderData.items),
        shipping_cost: orderData.shipping_cost || 0,
        tax_amount: orderData.tax_amount || 0,
        payment_status: 'Unpaid',
        created_by: orderData.created_by || 'System',
        notes: orderData.notes
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // 2. Then, create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.quantity) * parseFloat(item.unit_price)
    }));
    
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(orderItems);
    
    if (itemsError) throw itemsError;
    
    // 3. Update supplier's last_order_date
    const { error: supplierError } = await supabase
      .from('suppliers')
      .update({ last_order_date: new Date().toISOString() })
      .eq('id', orderData.supplier_id);
    
    if (supplierError) throw supplierError;
    
    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        order_items:purchase_order_items(*)
      `)
      .eq('id', order.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    return completeOrder;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: status,
        actual_delivery: status === 'Delivered' ? new Date().toISOString() : null
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // If status is 'Delivered', update inventory
    if (status === 'Delivered') {
      await updateInventoryFromOrder(orderId);
    }

    // If status is 'Completed', create expense entry in Finance Management
    if (status === 'Completed') {
      await createExpenseFromOrder(orderId, data);
    }

    return data;
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    throw error;
  }
};

// Update inventory when an order is delivered
const updateInventoryFromOrder = async (orderId) => {
  try {
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    const updatedItems = [];

    // Update inventory for each item
    for (const item of orderItems) {
      // Get current item
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', item.item_id)
        .single();

      if (fetchError) throw fetchError;

      // Update stock
      const newStock = inventoryItem.current_stock + item.quantity;
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', item.item_id)
        .select()
        .single();

      if (updateError) throw updateError;

      updatedItems.push(updatedItem);

      // Create stock adjustment record
      await supabase
        .from('stock_adjustments')
        .insert({
          item_id: item.item_id,
          adjustment_type: 'Addition',
          quantity: item.quantity,
          reason: `Order ${orderId} delivery`,
          previous_stock: inventoryItem.current_stock,
          new_stock: newStock,
          adjustment_date: new Date().toISOString()
        });
    }

    return { success: true, updatedItems };
  } catch (error) {
    console.error(`Error updating inventory from order ${orderId}:`, error);
    throw error;
  }
};

// Create expense entry when order is completed
const createExpenseFromOrder = async (orderId, orderData) => {
  try {
    // Map department to expense category
    const categoryMapping = {
      'feed': 'Feed',
      'milking': 'Utilities',
      'equipment': 'Maintenance',
      'health': 'Veterinary'
    };

    const category = categoryMapping[orderData.department] || 'Other';

    // Create expense data
    const expenseData = {
      date: orderData.actual_delivery || orderData.order_date || new Date().toISOString().split('T')[0],
      category: category,
      amount: parseFloat(orderData.total_amount || 0),
      vendor: orderData.supplier_name,
      description: `Purchase Order ${orderData.order_number} - ${orderData.department} department`,
      status: 'Paid', // Mark as paid since order is completed
      payment_method: 'Bank Transfer', // Default payment method for purchase orders
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into expenses table
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select();

    if (error) throw error;

    console.log(`Expense created for order ${orderId}:`, data[0]);
    return data[0];
  } catch (error) {
    console.error(`Error creating expense from order ${orderId}:`, error);
    // Don't throw - we don't want to fail the order completion if expense creation fails
    // Just log the error
    return null;
  }
};

// Adjust stock quantity
export const adjustStock = async (itemId, adjustment) => {
  try {
    // Get current stock
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('inventory_items')
      .select('current_stock, name')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const previousStock = inventoryItem.current_stock;
    const adjustmentValue = parseFloat(adjustment);
    const newStock = previousStock + adjustmentValue;

    // Validate that stock won't go negative
    if (newStock < 0) {
      throw new Error(`Cannot reduce stock below zero for ${inventoryItem.name}. Current stock: ${previousStock}, Adjustment: ${adjustmentValue}`);
    }

    // Update inventory item
    const { data, error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record stock adjustment
    const adjustmentType = adjustmentValue > 0 ? 'Addition' : 'Reduction';
    const { error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        item_id: itemId,
        adjustment_type: adjustmentType,
        quantity: Math.abs(adjustmentValue),
        reason: 'Manual adjustment',
        previous_stock: previousStock,
        new_stock: newStock,
        adjustment_date: new Date().toISOString()
      });

    if (adjustmentError) throw adjustmentError;

    return data;
  } catch (error) {
    console.error(`Error adjusting stock for item ${itemId}:`, error);
    throw error;
  }
};

// Fetch inventory statistics
export const fetchInventoryStats = async () => {
  try {
    // Most of this is now handled in the component logic
    // Let's simulate additional API stats that might be calculated server-side
    
    // In a real implementation, these would be calculated on the server
    // for better performance and accuracy.
    const date = new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 1).toISOString();
    
    // Get recent transactions
    const { data: recentTransactions, error: transError } = await supabase
      .from('stock_adjustments')
      .select(`
        id,
        item_id,
        adjustment_type,
        quantity,
        adjustment_date,
        reason,
        inventory_items:item_id (name)
      `)
      .order('adjustment_date', { ascending: false })
      .limit(20);
    
    if (transError) throw transError;
    
    // Get yearly order summary
    const { data: yearlyOrders, error: ordersError } = await supabase
      .from('purchase_orders')
      .select('id, total_amount, order_date')
      .gte('order_date', startOfYear);
    
    if (ordersError) throw ordersError;
    
    const totalOrdersAmount = yearlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const ordersCount = yearlyOrders.length;
    
    return {
      recentTransactions,
      yearlyOrdersTotal: totalOrdersAmount,
      yearlyOrdersCount: ordersCount
    };
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    throw error;
  }
};

// Helper function to determine item status based on stock levels
const getItemStatus = (item) => {
  if (item.current_stock <= 0) {
    return 'Out of Stock';
  } else if (item.current_stock <= item.reorder_level) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
};

// Helper function to calculate order total
const calculateOrderTotal = (items) => {
  return items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
  }, 0);
};

// Helper function to generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `PO-${year}${month}${day}-${random}`;
};

// Record inventory usage
export const recordInventoryUsage = async (usageData) => {
  try {
    // First, check if sufficient stock is available
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock, name')
      .eq('id', usageData.item_id)
      .single();

    if (itemError) throw itemError;

    const quantityUsed = parseFloat(usageData.quantity_used);
    const newStock = item.current_stock - quantityUsed;

    // Validate stock availability
    if (newStock < 0) {
      throw new Error(`Insufficient stock for ${item.name}. Available: ${item.current_stock}, Requested: ${quantityUsed}`);
    }

    // Record usage
    const { data, error } = await supabase
      .from('inventory_usage')
      .insert([{
        item_id: usageData.item_id,
        quantity_used: quantityUsed,
        usage_date: usageData.usage_date || new Date().toISOString().split('T')[0],
        used_by: usageData.used_by || 'System',
        purpose: usageData.purpose || 'Daily operations',
        department: usageData.department,
        notes: usageData.notes || null,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // Update inventory item stock
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', usageData.item_id);

    if (updateError) throw updateError;

    return data[0];
  } catch (error) {
    console.error('Error recording inventory usage:', error);
    throw error;
  }
};

// Fetch inventory usage records
export const fetchInventoryUsage = async (filters = {}) => {
  try {
    let query = supabase
      .from('inventory_usage')
      .select(`
        *,
        inventory_items:item_id (
          id,
          name,
          unit,
          department,
          category
        )
      `)
      .order('usage_date', { ascending: false });

    if (filters.startDate) {
      query = query.gte('usage_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('usage_date', filters.endDate);
    }

    if (filters.department && filters.department !== 'all') {
      query = query.eq('department', filters.department);
    }

    if (filters.item_id) {
      query = query.eq('item_id', filters.item_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching inventory usage:', error);
    throw error;
  }
};

// Get daily usage summary
export const getDailyUsageSummary = async (department = null) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    let query = supabase
      .from('inventory_usage')
      .select(`
        *,
        inventory_items:item_id (
          id,
          name,
          unit,
          department,
          category,
          unit_price
        )
      `)
      .gte('usage_date', startDate)
      .lte('usage_date', today);

    if (department && department !== 'all') {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate total usage value
    const totalValue = data.reduce((sum, record) => {
      const itemPrice = record.inventory_items?.unit_price || 0;
      return sum + (record.quantity_used * itemPrice);
    }, 0);

    // Group by date for trend
    const usageByDate = data.reduce((acc, record) => {
      const date = record.usage_date;
      if (!acc[date]) {
        acc[date] = { date, totalQuantity: 0, totalValue: 0, count: 0 };
      }
      const itemPrice = record.inventory_items?.unit_price || 0;
      acc[date].totalQuantity += record.quantity_used;
      acc[date].totalValue += record.quantity_used * itemPrice;
      acc[date].count += 1;
      return acc;
    }, {});

    const usageTrend = Object.values(usageByDate).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Group by item for top usage
    const usageByItem = data.reduce((acc, record) => {
      const itemId = record.item_id;
      const itemName = record.inventory_items?.name || 'Unknown';
      const itemUnit = record.inventory_items?.unit || 'units';
      const itemPrice = record.inventory_items?.unit_price || 0;

      if (!acc[itemId]) {
        acc[itemId] = {
          item_id: itemId,
          item_name: itemName,
          unit: itemUnit,
          totalQuantity: 0,
          totalValue: 0,
          count: 0
        };
      }
      acc[itemId].totalQuantity += record.quantity_used;
      acc[itemId].totalValue += record.quantity_used * itemPrice;
      acc[itemId].count += 1;
      return acc;
    }, {});

    const topUsageItems = Object.values(usageByItem)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Group by department
    const usageByDepartment = data.reduce((acc, record) => {
      const dept = record.department || 'unknown';
      const itemPrice = record.inventory_items?.unit_price || 0;

      if (!acc[dept]) {
        acc[dept] = { department: dept, totalValue: 0, count: 0 };
      }
      acc[dept].totalValue += record.quantity_used * itemPrice;
      acc[dept].count += 1;
      return acc;
    }, {});

    return {
      totalRecords: data.length,
      totalValue,
      usageTrend,
      topUsageItems,
      usageByDepartment: Object.values(usageByDepartment),
      recentUsage: data.slice(0, 10)
    };
  } catch (error) {
    console.error('Error fetching daily usage summary:', error);
    throw error;
  }
};

// Update inventory usage record
export const updateInventoryUsage = async (usageId, usageData) => {
  try {
    // Get the old usage record first
    const { data: oldUsage, error: fetchError } = await supabase
      .from('inventory_usage')
      .select('*, inventory_items:item_id(current_stock, name)')
      .eq('id', usageId)
      .single();

    if (fetchError) throw fetchError;

    const oldQuantity = oldUsage.quantity_used;
    const newQuantity = parseFloat(usageData.quantity_used);
    const quantityDiff = newQuantity - oldQuantity;

    // Get current stock
    const currentStock = oldUsage.inventory_items.current_stock;
    const newStock = currentStock - quantityDiff;

    // Validate stock availability
    if (newStock < 0) {
      throw new Error(`Insufficient stock for ${oldUsage.inventory_items.name}. Available: ${currentStock}, Additional needed: ${quantityDiff}`);
    }

    // Update usage record
    const { data, error } = await supabase
      .from('inventory_usage')
      .update({
        item_id: usageData.item_id || oldUsage.item_id,
        quantity_used: newQuantity,
        usage_date: usageData.usage_date,
        used_by: usageData.used_by,
        purpose: usageData.purpose,
        department: usageData.department,
        notes: usageData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', usageId)
      .select();

    if (error) throw error;

    // Update inventory stock if quantity changed
    if (quantityDiff !== 0) {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', oldUsage.item_id);

      if (updateError) throw updateError;
    }

    return data[0];
  } catch (error) {
    console.error(`Error updating inventory usage ${usageId}:`, error);
    throw error;
  }
};

// Delete inventory usage record
export const deleteInventoryUsage = async (usageId) => {
  try {
    // Get the usage record to restore stock
    const { data: usage, error: fetchError } = await supabase
      .from('inventory_usage')
      .select('*, inventory_items:item_id(current_stock)')
      .eq('id', usageId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the usage record
    const { error: deleteError } = await supabase
      .from('inventory_usage')
      .delete()
      .eq('id', usageId);

    if (deleteError) throw deleteError;

    // Restore the stock (add back the used quantity)
    const restoredStock = usage.inventory_items.current_stock + usage.quantity_used;

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_stock: restoredStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', usage.item_id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error(`Error deleting inventory usage ${usageId}:`, error);
    throw error;
  }
};