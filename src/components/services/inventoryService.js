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
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
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
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', item.item_id);
      
      if (updateError) throw updateError;
      
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
    
    return true;
  } catch (error) {
    console.error(`Error updating inventory from order ${orderId}:`, error);
    throw error;
  }
};

// Adjust stock quantity
export const adjustStock = async (itemId, adjustment) => {
  try {
    // Get current stock
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', itemId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const previousStock = inventoryItem.current_stock;
    const newStock = previousStock + parseFloat(adjustment);
    
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
    const adjustmentType = adjustment > 0 ? 'Addition' : 'Reduction';
    const { error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        item_id: itemId,
        adjustment_type: adjustmentType,
        quantity: Math.abs(adjustment),
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