import { useState, useEffect } from 'react';
import { toast } from './utils/CustomToast';
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  AlertTriangle, 
  X, 
  DollarSign, 
  AlertCircle, 
  ShoppingCart, 
  Archive, 
  BarChart2, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp
} from 'react-feather';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

import { 
  fetchAllItems, 
  fetchItemsByDepartment, 
  fetchAllOrders, 
  fetchOrdersByDepartment, 
  fetchSuppliers, 
  addItem, 
  updateItem, 
  deleteItem, 
  placeOrder, 
  updateOrderStatus,
  adjustStock,
  fetchInventoryStats
} from './services/inventoryService';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

// Status colors for consistency
const statusColors = {
  'In Stock': 'bg-green-100 text-green-800',
  'Low Stock': 'bg-amber-100 text-amber-800',
  'Out of Stock': 'bg-red-100 text-red-800',
  'Ordered': 'bg-blue-100 text-blue-800',
  'Delivered': 'bg-purple-100 text-purple-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-gray-100 text-gray-800'
};

// Color scheme for pie charts
const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#607D8B', '#795548'];

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const handleDownload = (data, filename, fileType) => {
  let content = '';
  let mimeType = '';
  
  // Format based on file type
  if (fileType === 'csv') {
    mimeType = 'text/csv;charset=utf-8;';
    
    // For CSV, create headers and data rows
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      content = [headers, ...rows].join('\n');
    }
  } else if (fileType === 'json') {
    mimeType = 'application/json;charset=utf-8;';
    content = JSON.stringify(data, null, 2);
  } else if (fileType === 'txt') {
    mimeType = 'text/plain;charset=utf-8;';
    content = JSON.stringify(data, null, 2);
  }
  
  // Create a blob and download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Create download link and trigger click
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Main component
const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDepartment, setActiveDepartment] = useState('feed');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isViewItemModalOpen, setIsViewItemModalOpen] = useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState('month');
  const [inventoryData, setInventoryData] = useState({
    items: [],
    orders: [],
    suppliers: [],
    stats: {
      totalValue: 0,
      lowStockItems: 0,
      pendingOrders: 0,
      recentActivity: []
    },
    totalItems: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    inventoryByDepartment: [],
    valueByDepartment: [],
    stockTrend: [],
    ordersByMonth: []
  });
  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState(false);
  
  // Fetch inventory data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);
  
  // Fetch data when department or tab changes
  useEffect(() => {
    if (activeTab === 'items') {
      fetchItemsByDepartment(activeDepartment)
        .then(items => setInventoryData(prev => ({ ...prev, items })))
        .catch(err => setError('Failed to fetch items: ' + err.message));
    } else if (activeTab === 'orders') {
      fetchOrdersByDepartment(activeDepartment)
        .then(orders => setInventoryData(prev => ({ ...prev, orders })))
        .catch(err => setError('Failed to fetch orders: ' + err.message));
    } else if (activeTab === 'suppliers') {
      fetchSuppliers()
        .then(suppliers => setInventoryData(prev => ({ ...prev, suppliers })))
        .catch(err => setError('Failed to fetch suppliers: ' + err.message));
    }
  }, [activeTab, activeDepartment]);
  
  // Fetch all inventory data and stats
  const fetchInventoryData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch items, orders, suppliers, and generate stats
      const [items, orders, suppliers, stats] = await Promise.all([
        fetchAllItems(),
        fetchAllOrders(),
        fetchSuppliers(),
        fetchInventoryStats()
      ]);
      
      // Calculate statistics
      const calculatedStats = calculateStats(items, orders);
      
      // Prepare chart data
      const charts = prepareChartData(items, orders);
      
      // Update state
      setInventoryData({
        items,
        orders,
        suppliers,
        stats: { ...calculatedStats, ...stats },
        totalItems: items.length
      });
      
      setChartData(charts);
      setIsLoading(false);
    } catch (err) {
      setError('Error loading inventory data: ' + err.message);
      setIsLoading(false);
    }
  };
  
  // Calculate dashboard statistics
  const calculateStats = (items, orders) => {
    // Calculate total inventory value
    const totalValue = items.reduce((total, item) => {
      return total + (item.current_stock * item.unit_price);
    }, 0);
    
    // Count low stock items
    const lowStockItems = items.filter(item => {
      return item.current_stock <= item.reorder_level;
    }).length;
    
    // Count pending orders
    const pendingOrders = orders.filter(order => {
      return order.status === 'Pending' || order.status === 'Ordered';
    }).length;
    
    // Generate recent activities from orders
    const recentActivity = orders
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        type: 'order',
        description: `${order.status} order for ${order.department}`,
        date: order.order_date,
        amount: order.total_amount
      }));
    
    return {
      totalValue,
      lowStockItems,
      pendingOrders,
      recentActivity
    };
  };
  
  // Prepare chart data for dashboard
  const prepareChartData = (items, orders) => {
    // Items by department
    const inventoryByDepartment = [
      { name: 'Feed', value: items.filter(item => item.department === 'feed').length },
      { name: 'Milking', value: items.filter(item => item.department === 'milking').length },
      { name: 'Equipment', value: items.filter(item => item.department === 'equipment').length },
      { name: 'Health', value: items.filter(item => item.department === 'health').length }
    ];
    
    // Value by department
    const valueByDepartment = [
      { 
        name: 'Feed', 
        value: items
          .filter(item => item.department === 'feed')
          .reduce((total, item) => total + (item.current_stock * item.unit_price), 0) 
      },
      { 
        name: 'Milking', 
        value: items
          .filter(item => item.department === 'milking')
          .reduce((total, item) => total + (item.current_stock * item.unit_price), 0) 
      },
      { 
        name: 'Equipment', 
        value: items
          .filter(item => item.department === 'equipment')
          .reduce((total, item) => total + (item.current_stock * item.unit_price), 0) 
      },
      { 
        name: 'Health', 
        value: items
          .filter(item => item.department === 'health')
          .reduce((total, item) => total + (item.current_stock * item.unit_price), 0) 
      }
    ];
    
    // Orders by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ordersByMonth = monthNames.map(month => {
      return { month, count: 0, value: 0 };
    });
    
    orders.forEach(order => {
      const date = new Date(order.order_date);
      const monthIndex = date.getMonth();
      
      ordersByMonth[monthIndex].count += 1;
      ordersByMonth[monthIndex].value += order.total_amount;
    });
    
    return {
      inventoryByDepartment,
      valueByDepartment,
      ordersByMonth
    };
  };
  
  // Determine item status based on stock levels
  const getItemStatus = (item) => {
    if (!item) return 'Unknown';
    
    if (item.current_stock <= 0) {
      return 'Out of Stock';
    } else if (item.current_stock <= item.reorder_level) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };
  
  // Toggle modals
  const toggleAddItemModal = () => setIsAddItemModalOpen(!isAddItemModalOpen);
  
  const toggleEditItemModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
    } else {
      setSelectedItem(null);
    }
    setIsEditItemModalOpen(!isEditItemModalOpen);
  };
  
  const toggleViewItemModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
    } else {
      setSelectedItem(null);
    }
    setIsViewItemModalOpen(!isViewItemModalOpen);
  };
  
  const toggleDeleteItemModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
    } else {
      setSelectedItem(null);
    }
    setIsDeleteItemModalOpen(!isDeleteItemModalOpen);
  };
  
  const togglePlaceOrderModal = () => setIsPlaceOrderModalOpen(!isPlaceOrderModalOpen);
  const toggleViewOrderModal = (order = null) => {
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
    setIsOrderDetailsModalOpen(!isOrderDetailsModalOpen);
  };
  
  const toggleEditOrderModal = (order = null) => {
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
    // You can reuse order details modal with edit mode or create a separate modal
    toggleOrderDetailsModal(order);
  };
  
  const toggleDeleteOrderModal = (order = null) => {
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
    // Create a separate state or modal for delete confirmation
    setIsDeleteOrderModalOpen(!isDeleteOrderModalOpen);
  };
  
  const toggleOrderDetailsModal = (order = null) => {
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
    }
    setIsOrderDetailsModalOpen(!isOrderDetailsModalOpen);
  };
  
  const toggleSupplierModal = (supplier = null) => {
    if (supplier) {
      setSelectedSupplier(supplier);
    } else {
      setSelectedSupplier(null);
    }
    setIsSupplierModalOpen(!isSupplierModalOpen);
  };
  
  // Add item handler
  const handleAddItem = async (itemData) => {
    try {
      setIsLoading(true);
      await addItem(itemData);
      await fetchInventoryData();
      setIsAddItemModalOpen(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Failed to add item: ' + err.message);
      setIsLoading(false);
      return false;
    }
  };
  
  // Update item handler
  const handleUpdateItem = async (itemId, itemData) => {
    try {
      setIsLoading(true);
      
      // Create a sanitized copy of the data before sending to the API
      const sanitizedData = { ...itemData };
      
      // Convert empty strings to null for UUID fields (like supplier_id)
      if (sanitizedData.supplier_id === '') {
        sanitizedData.supplier_id = null;
      }
      
      await updateItem(itemId, sanitizedData);
      
      // Update local state
      setInventoryData(prev => {
        const updatedItems = prev.items.map(item => 
          item.id === itemId ? { ...item, ...sanitizedData } : item
        );
        
        return {
          ...prev,
          items: updatedItems
        };
      });
      
      setIsEditItemModalOpen(false);
      setIsLoading(false);
      toast.success("Item updated successfully");
      return true;
    } catch (err) {
      setError('Failed to update item: ' + err.message);
      setIsLoading(false);
      return false;
    }
  };
  
  // Delete item handler
  const handleDeleteItem = async (itemId) => {
    try {
      setIsLoading(true);
      await deleteItem(itemId);
      
      // Update local state
      setInventoryData(prev => {
        const filteredItems = prev.items.filter(item => item.id !== itemId);
        
        return {
          ...prev,
          items: filteredItems,
          totalItems: filteredItems.length
        };
      });
      
      setIsDeleteItemModalOpen(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Failed to delete item: ' + err.message);
      setIsLoading(false);
      return false;
    }
  };
  
  // Place order handler
  const handlePlaceOrder = async (orderData) => {
    try {
      setIsLoading(true);
      
      // Call the placeOrder function from inventoryService
      const newOrder = await placeOrder(orderData);
      
      // Update the inventory data with the new order
      setInventoryData(prev => ({
        ...prev,
        orders: [newOrder, ...prev.orders],
        stats: {
          ...prev.stats,
          pendingOrders: prev.stats.pendingOrders + 1
        }
      }));
      
      // Show success message or notification
      toast.success("Order placed successfully");
      setIsLoading(false);
      setIsPlaceOrderModalOpen(false);
      
      // Refresh all inventory data
      fetchInventoryData();
      
      return true;
    } catch (error) {
      setError(`Error placing order: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };
  
  // Update order status
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      setIsLoading(true);
      await updateOrderStatus(orderId, status);
      
      // If order is delivered, update stock
      if (status === 'Delivered') {
        await updateStockFromOrder(orderId);
      }
      
      // Update local state
      setInventoryData(prev => {
        const updatedOrders = prev.orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        );
        
        return {
          ...prev,
          orders: updatedOrders
        };
      });
      
      setIsOrderDetailsModalOpen(false);
      setIsLoading(false);
      await fetchInventoryData(); // Refresh all data
      return true;
    } catch (err) {
      setError('Failed to update order status: ' + err.message);
      setIsLoading(false);
      return false;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setIsLoading(true);
      
      // Call API to delete the order
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Update local state by removing the deleted order
      setInventoryData(prev => {
        const deletedOrder = prev.orders.find(order => order.id === orderId);
        const isPendingOrder = deletedOrder && (deletedOrder.status === 'Pending' || deletedOrder.status === 'Ordered');
        
        return {
          ...prev,
          orders: prev.orders.filter(order => order.id !== orderId),
          stats: {
            ...prev.stats,
            pendingOrders: isPendingOrder ? prev.stats.pendingOrders - 1 : prev.stats.pendingOrders
          }
        };
      });
      
      toast.success("Order deleted successfully");
      setIsLoading(false);
      setIsDeleteOrderModalOpen(false);
      return true;
    } catch (error) {
      setError(`Error deleting order: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };
  
  // Update stock levels when an order is delivered
  const updateStockFromOrder = async (orderId) => {
    // This would typically be handled by your API/backend
    // For now, just refresh data
    await fetchInventoryData();
  };
  
  // Handle stock adjustment
  const handleStockAdjustment = async (itemId, adjustment) => {
    try {
      setIsLoading(true);
      await adjustStock(itemId, adjustment);
      
      // Update local state
      setInventoryData(prev => {
        const updatedItems = prev.items.map(item => {
          if (item.id === itemId) {
            const newStock = item.current_stock + adjustment;
            return { 
              ...item, 
              current_stock: newStock,
              status: getItemStatus({ ...item, current_stock: newStock })
            };
          }
          return item;
        });
        
        return {
          ...prev,
          items: updatedItems
        };
      });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Failed to adjust stock: ' + err.message);
      setIsLoading(false);
      return false;
    }
  };
  
  // Search function
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  // Filter items based on search and filters
  const filterItems = (items) => {
    return items.filter(item => {
      // Filter by search query
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());
        
      // Filter by status
      const matchesStatus = 
        filterStatus === 'All' ||
        item.status === filterStatus;
        
      return matchesSearch && matchesStatus;
    });
  };
  
  // Filter orders based on search and filters
  const filterOrders = (orders) => {
    return orders.filter(order => {
      // Filter by search query
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesSearch;
    });
  };
  
  // Calculate pagination for items list
  const filteredItems = filterItems(inventoryData.items);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalItemPages = Math.ceil(filteredItems.length / itemsPerPage);
  
  // Calculate pagination for orders list
  const filteredOrders = filterOrders(inventoryData.orders);
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage);
  
  // Helper functions
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  // Handle supplier add/edit
const handleSupplierSubmit = async (supplierData) => {
  try {
    setIsLoading(true);
    
    if (supplierData.id) {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: supplierData.name,
          contact_person: supplierData.contact_person,
          phone: supplierData.phone,
          email: supplierData.email,
          address: supplierData.address,
          city: supplierData.city,
          state: supplierData.state,
          postal_code: supplierData.postal_code,
          category: supplierData.category,
          payment_terms: supplierData.payment_terms,
          notes: supplierData.notes
        })
        .eq('id', supplierData.id);
      
      if (error) throw error;
    } else {
      // Add new supplier
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierData.name,
          contact_person: supplierData.contact_person,
          phone: supplierData.phone,
          email: supplierData.email,
          address: supplierData.address,
          city: supplierData.city,
          state: supplierData.state,
          postal_code: supplierData.postal_code,
          category: supplierData.category,
          payment_terms: supplierData.payment_terms,
          notes: supplierData.notes
        });
      
      if (error) throw error;
    }
    
    // Refresh the suppliers list
    await fetchInventoryData();
    
    setIsSupplierModalOpen(false);
    setIsLoading(false);
    return true;
  } catch (err) {
    setError(`Failed to ${supplierData.id ? 'update' : 'add'} supplier: ` + err.message);
    setIsLoading(false);
    return false;
  }
};
  // Loading state
  if (isLoading && !inventoryData.items.length) {
    return <LoadingSpinner message='Loading inventory data...'></LoadingSpinner>;
  }
  
return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1500px] mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">
            Inventory Management
            </h1>
            <div className="flex flex-wrap gap-2">
            <button 
                onClick={toggleAddItemModal}
                data-action="add-inventory"
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
                <Plus size={20} className="mr-2" />
                Add Item
            </button>
            <button 
                onClick={togglePlaceOrderModal}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center"
            >
                <ShoppingCart size={12} className="mr-2" />
                Place Order
            </button>
            </div>
        </div>
        
        <div className="mb-6 overflow-x-auto">
            <nav className="flex space-x-4 border-b border-gray-200 min-w-[500px]">
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
                onClick={() => setActiveTab('items')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'items'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                Inventory Items
            </button>
            <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'orders'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                Orders
            </button>
            <button
                onClick={() => setActiveTab('suppliers')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px whitespace-nowrap transition-all duration-300 ${
                activeTab === 'suppliers'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                Suppliers
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
        
        {(activeTab === 'items' || activeTab === 'orders') && (
            <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-[500px]">
              <button
                onClick={() => setActiveDepartment('feed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  activeDepartment === 'feed' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                Feed Department
              </button>
            <button
                onClick={() => setActiveDepartment('milking')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeDepartment === 'milking' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
            >
                Milking Department
            </button>
            <button
                onClick={() => setActiveDepartment('equipment')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeDepartment === 'equipment' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
            >
                Equipment Department
            </button>
            <button
                onClick={() => setActiveDepartment('health')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeDepartment === 'health' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
            >
                Health Department
            </button>
            </div>
            </div>
        )}
        
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
        
        {activeTab === 'dashboard' && (
            <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="p-5">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Inventory Value</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mt-1 mb-3">
                        {formatCurrency(inventoryData.stats.totalValue)}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                        <DollarSign size={20} className="text-white" />
                    </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 flex items-center">
                    <span>
                        Across {inventoryData.totalItems} items
                    </span>
                    </div>
                </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
                <div className="p-5">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500 mt-1 mb-3">
                        {inventoryData.stats.lowStockItems}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                        <AlertCircle size={20} className="text-white" />
                    </div>
                    </div>
                    <div className="mt-2 text-xs text-red-600 flex items-center">
                    <span>
                        Needs reordering soon
                    </span>
                    </div>
                </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="p-5">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mt-1 mb-3">
                        {inventoryData.stats.pendingOrders}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                        <ShoppingCart size={20} className="text-white" />
                    </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600 flex items-center">
                    <span>
                        Awaiting delivery
                    </span>
                    </div>
                </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                <div className="p-5">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Departments</p>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-500 mt-1 mb-3">4</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                        <Archive size={20} className="text-white" />
                    </div>
                    </div>
                    <div className="mt-2 text-xs text-purple-600 flex items-center">
                    <span>
                        Feed, Milking, Equipment, Health
                    </span>
                    </div>
                </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">
                    Stock Value by Department
                    </h2>
                    <div className="h-60 sm:h-72 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                        data={chartData.valueByDepartment}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        barSize={40}
                        >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis 
                            tickFormatter={(value) => 
                            new Intl.NumberFormat('en-IN', { 
                                style: 'currency', 
                                currency: 'INR',
                                notation: 'compact',
                                compactDisplay: 'short'
                            }).format(value)
                            }
                        />
                        <Tooltip 
                            formatter={(value) => [formatCurrency(value), 'Value']}
                            contentStyle={{ 
                            background: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #f1f1f1', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Bar 
                            dataKey="value" 
                            fill="#4CAF50" 
                            radius={[4, 4, 0, 0]} 
                            name="Department Value"
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">
                    Orders by Month
                    </h2>
                    <div className="h-60 sm:h-72 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                        data={chartData.ordersByMonth}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        barSize={20}
                        >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#82ca9d"
                            tickFormatter={(value) => 
                            new Intl.NumberFormat('en-IN', { 
                                style: 'currency', 
                                currency: 'INR',
                                notation: 'compact',
                                compactDisplay: 'short'
                            }).format(value)
                            }
                        />
                        <Tooltip 
                            formatter={(value, name) => {
                            if (name === "Orders") return [value, name];
                            return [formatCurrency(value), "Value"];
                            }}
                            contentStyle={{ 
                            background: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #f1f1f1', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend />
                        <Bar 
                            dataKey="count" 
                            name="Orders"
                            fill="#8884d8" 
                            yAxisId="left"
                            radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                            dataKey="value" 
                            name="Value"
                            fill="#82ca9d" 
                            yAxisId="right"
                            radius={[4, 4, 0, 0]} 
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="p-6">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">
                    Items by Department
                    </h2>
                    <div className="h-60 sm:h-72 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={chartData.inventoryByDepartment}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.inventoryByDepartment.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                            />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value, name, props) => [`${value} items`, name]}
                            contentStyle={{ 
                            background: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #f1f1f1', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                </div>
                </div>
                
                <div className="col-span-2 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                    Recent Orders & Activities
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {inventoryData.stats.recentActivity.length > 0 ? (
                    inventoryData.stats.recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex justify-between items-start">
                            <div>
                            <div className="flex items-center">
                                <ShoppingCart size={16} className="text-blue-500 mr-2" />
                                <h3 className="text-sm font-medium text-gray-800">
                                {activity.description}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                {activity.type === 'order' ? 'Order' : 'Activity'}
                            </p>
                            </div>
                            <div className="text-right">
                            <p className="text-sm text-gray-600">{formatDate(activity.date)}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {formatCurrency(activity.amount)}
                            </p>
                            </div>
                        </div>
                        </div>
                    ))
                    ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                        No recent activity available.
                    </div>
                    )}
                </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
                <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">Low Stock Items</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                    {inventoryData.stats.lowStockItems} items are low or out of stock. Place orders to replenish inventory.
                    </p>
                    <button 
                    onClick={() => {
                        setActiveTab('items');
                        setFilterStatus('Low Stock');
                    }}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 flex items-center justify-center"
                    >
                    <AlertCircle size={16} className="mr-2" />
                    View Low Stock Items
                    </button>
                </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">Orders Management</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                    {inventoryData.stats.pendingOrders} orders are currently pending delivery. Review and update their status.
                    </p>
                    <button 
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 flex items-center justify-center"
                    >
                    <ShoppingCart size={16} className="mr-2" />
                    Manage Orders
                    </button>
                </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-1 bg-gradient-to-r from-green-400 to-green-500"></div>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500">Inventory Reports</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                    Generate and download detailed inventory reports for analysis and planning.
                    </p>
                    <button 
                    onClick={() => setActiveTab('reports')}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 flex items-center justify-center"
                    >
                    <BarChart2 size={16} className="mr-2" />
                    View Reports
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}
        
        {activeTab === 'items' && (
            <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                placeholder="Search by name, description or category..."
                value={searchQuery}
                onChange={handleSearch}
                />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center w-full sm:w-auto">
                <Filter className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
                >
                    <option value="All">All Status</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                </select>
                </div>
                
                <button 
                onClick={() => handleDownload(filteredItems, `inventory-${activeDepartment}-${new Date().toISOString().split('T')[0]}.csv`, 'csv')}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
                >
                <Download size={16} className="mr-2" />
                Export
                </button>
            </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                        currentItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.current_stock} {item.unit}</div>
                            <div className="text-xs text-gray-500">Reorder at: {item.reorder_level}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.current_stock * item.unit_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[item.status]}`}>
                                {item.status}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.last_updated)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                                <button 
                                onClick={() => toggleViewItemModal(item)}
                                className="text-green-600 hover:text-green-900"
                                >
                                View
                                </button>
                                <button 
                                onClick={() => toggleEditItemModal(item)}
                                className="text-blue-600 hover:text-blue-900"
                                >
                                Edit
                                </button>
                                <button 
                                onClick={() => toggleDeleteItemModal(item)}
                                className="text-red-600 hover:text-red-900"
                                >
                                Delete
                                </button>
                            </div>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                            No items found matching your criteria.
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
            
            {totalItemPages > 1 && (
                <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                    <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                    >
                    <ChevronLeft size={16} />
                    </button>
                    
                    {Array.from({ length: totalItemPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${
                        currentPage === page 
                            ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                        }`}
                    >
                        {page}
                    </button>
                    ))}
                    
                    <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalItemPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === totalItemPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                    >
                    <ChevronRight size={16} />
                    </button>
                </div>
                </div>
            )}
            </div>
        )}
        
        {activeTab === 'orders' && (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    placeholder="Search orders by ID or supplier name..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
                </div>
                
                <div className="flex items-center space-x-4">
                {/* Add Create Order button here */}
                <button 
                    onClick={togglePlaceOrderModal}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                    <Plus size={20} className="mr-2" />
                    Create Order
                </button>
                <button 
                    onClick={() => handleDownload(filteredOrders, `orders-${activeDepartment}-${new Date().toISOString().split('T')[0]}.csv`, 'csv')}
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
                >
                    <Download size={16} className="mr-2" />
                    Export
                </button>
            </div>
        </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Delivery
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
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
                    {currentOrders.length > 0 ? (
                        currentOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.supplier_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {capitalizeFirstLetter(order.department)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(order.order_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(order.expected_delivery)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                                {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={() => toggleViewOrderModal(order)}
                                    className="text-green-600 hover:text-green-900"
                                >
                                    View
                                </button>
                                <button 
                                    onClick={() => toggleEditOrderModal(order)}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => toggleDeleteOrderModal(order)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    Delete
                                </button>
                                </div>
                            </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                No orders found matching your criteria.
                            </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                
                {totalOrderPages > 1 && (
                    <div className="flex justify-center mt-6">
                    <div className="flex space-x-2">
                        <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                        >
                        <ChevronLeft size={16} />
                        </button>
                        
                        {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${
                            currentPage === page 
                                ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                            }`}
                        >
                            {page}
                        </button>
                        ))}
                        
                        <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalOrderPages}
                        className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === totalOrderPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                        >
                        <ChevronRight size={16} />
                        </button>
                    </div>
                    </div>
                )}
                </div>
            )}
            
            {activeTab === 'suppliers' && (
                <div>
                <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-grow max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    </div>
                    <button 
                    onClick={() => toggleSupplierModal()}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                    >
                    <Plus size={20} className="mr-2" />
                    Add Supplier
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventoryData.suppliers.length > 0 ? (
                    inventoryData.suppliers
                        .filter(supplier => 
                        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        supplier.category?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(supplier => (
                        <div
                            key={supplier.id}
                            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                        >
                            <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
                            <div className="p-6">
                                <div className="flex flex-wrap justify-between gap-2 mb-3">
                                <h3 className="text-lg font-medium text-gray-900 break-words pr-2">{supplier.name}</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                    {supplier.category}
                                </span>
                                </div>
                                <div className="mt-4 space-y-3">
                                <div className="flex items-start">
                                <span className="text-gray-500 w-28 flex-shrink-0">Contact Person</span>
                                <span className="text-gray-900">{supplier.contact_person || 'N/A'}</span>
                                </div>
                                <div className="flex items-start">
                                <span className="text-gray-500 w-28 flex-shrink-0">Phone</span>
                                <span className="text-gray-900">{supplier.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-start">
                                <span className="text-gray-500 w-28 flex-shrink-0">Email</span>
                                <span className="text-gray-900">{supplier.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-start">
                                <span className="text-gray-500 w-28 flex-shrink-0">Address</span>
                                <span className="text-gray-900">{supplier.address || 'N/A'}</span>
                                </div>
                                {supplier.last_order_date && (
                                <div className="flex items-start">
                                    <span className="text-gray-500 w-28 flex-shrink-0">Last Order</span>
                                    <span className="text-gray-900">{formatDate(supplier.last_order_date)}</span>
                                </div>
                                )}
                            </div>
                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <button
                                onClick={() => {
                                    setActiveTab('orders');
                                    setSearchQuery(supplier.name);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-900"
                                >
                                View Orders
                                </button>
                                <button
                                onClick={() => toggleSupplierModal(supplier)}
                                className="text-sm text-green-600 hover:text-green-900"
                                >
                                Edit
                                </button>
                            </div>
                            </div>
                        </div>
                        ))
                    ) : (
                    <div className="col-span-full bg-white rounded-xl p-8 text-center text-gray-500">
                        No suppliers found. Add your first supplier to get started.
                    </div>
                    )}
                </div>
                </div>
            )}
            
            {activeTab === 'reports' && (
                <div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                        Generate Inventory Reports
                    </h2>
                    </div>
                    <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200">
                        <h3 className="font-medium text-lg text-gray-900 mb-2">Stock Level Report</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Generate a report showing current stock levels and value for all inventory items.
                        </p>
                        <div className="mt-4 flex justify-end">
                            <button 
                            onClick={() => handleDownload(inventoryData.items, `stock-levels-${new Date().toISOString().split('T')[0]}.csv`, 'csv')}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center"
                            >
                            <Download size={16} className="mr-2" />
                            Download Report
                            </button>
                        </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200">
                        <h3 className="font-medium text-lg text-gray-900 mb-2">Low Stock Items</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Generate a report showing items that are currently low in stock or out of stock.
                        </p>
                        <div className="mt-4 flex justify-end">
                            <button 
                            onClick={() => {
                                const lowStockItems = inventoryData.items.filter(item => 
                                item.current_stock <= item.reorder_level
                                );
                                handleDownload(lowStockItems, `low-stock-${new Date().toISOString().split('T')[0]}.csv`, 'csv');
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center"
                            >
                            <Download size={16} className="mr-2" />
                            Download Report
                            </button>
                        </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200">
                        <h3 className="font-medium text-lg text-gray-900 mb-2">Order History Report</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Generate a report of all orders placed within a specified time period.
                        </p>
                        <div className="mt-4 flex justify-end">
                            <button 
                            onClick={() => handleDownload(inventoryData.orders, `orders-history-${new Date().toISOString().split('T')[0]}.csv`, 'csv')}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center"
                            >
                            <Download size={16} className="mr-2" />
                            Download Report
                            </button>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                        Department Summary
                    </h2>
                    </div>
                    <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
                            <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Items
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Value
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Low Stock Items
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pending Orders
                            </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {chartData.valueByDepartment.map((dept, index) => {
                            // Calculate department statistics
                            const departmentItems = inventoryData.items.filter(item => 
                                item.department?.toLowerCase() === dept.name.toLowerCase()
                            );
                            
                            const lowStockItemsCount = departmentItems.filter(item => 
                                item.current_stock <= item.reorder_level
                            ).length;
                            
                            const pendingOrdersCount = inventoryData.orders.filter(order => 
                                order.department?.toLowerCase() === dept.name.toLowerCase() &&
                                (order.status === 'Pending' || order.status === 'Ordered')
                            ).length;
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {dept.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {departmentItems.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(dept.value)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    lowStockItemsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {lowStockItemsCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    pendingOrdersCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {pendingOrdersCount}
                                    </span>
                                </td>
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                    </div>
                    </div>
                </div>
                </div>
            )}
            
            {/* Add Item Modal */}
            {isAddItemModalOpen && (
                <AddItemModal 
                onClose={toggleAddItemModal}
                onSubmit={handleAddItem}
                isLoading={isLoading}
                departments={['feed', 'milking', 'equipment', 'health']}
                activeDepartment={activeDepartment}
                />
            )}
            
            {/* Edit Item Modal */}
            {isEditItemModalOpen && selectedItem && (
                <EditItemModal 
                item={selectedItem}
                onClose={toggleEditItemModal}
                onSubmit={(data) => handleUpdateItem(selectedItem.id, data)}
                isLoading={isLoading}
                departments={['feed', 'milking', 'equipment', 'health']}
                />
            )}
            
            {/* View Item Modal */}
            {isViewItemModalOpen && selectedItem && (
                <ViewItemModal 
                item={selectedItem}
                onClose={toggleViewItemModal}
                onEdit={() => {
                    toggleViewItemModal();
                    toggleEditItemModal(selectedItem);
                }}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                />
            )}
            
            {/* Delete Item Modal */}
            {isDeleteItemModalOpen && selectedItem && (
                <DeleteItemModal 
                item={selectedItem}
                onClose={toggleDeleteItemModal}
                onConfirm={() => handleDeleteItem(selectedItem.id)}
                isLoading={isLoading}
                />
            )}
            
            {/* Place Order Modal */}
            {isPlaceOrderModalOpen && (
                <PlaceOrderModal 
                onClose={togglePlaceOrderModal}
                onSubmit={handlePlaceOrder}
                isLoading={isLoading}
                departments={['feed', 'milking', 'equipment', 'health']}
                activeDepartment={activeDepartment}
                suppliers={inventoryData.suppliers}
                inventoryItems={inventoryData.items}
                />
            )}
            
            {/* Supplier Modal */}
            {isSupplierModalOpen && (
            <SupplierModal 
                supplier={selectedSupplier}
                onClose={toggleSupplierModal}
                onSubmit={handleSupplierSubmit}
                isLoading={isLoading}
            />
            )}
            {isOrderDetailsModalOpen && selectedOrder && (
            <OrderDetailsModal 
                order={selectedOrder}
                onClose={toggleViewOrderModal}
                onUpdateStatus={handleUpdateOrderStatus}
            />
            )}
            {/* Place Order Modal */}
            {isPlaceOrderModalOpen && (
            <PlaceOrderModal 
                onClose={togglePlaceOrderModal}
                onSubmit={handlePlaceOrder}
                isLoading={isLoading}
                departments={['feed', 'milking', 'equipment', 'health']}
                activeDepartment={activeDepartment}
                suppliers={inventoryData.suppliers}
                inventoryItems={inventoryData.items}
            />
            )}
            {/* Delete Order Modal */}
            {isDeleteOrderModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8 mx-auto">
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h3 className="text-lg font-medium">Delete Order</h3>
                    <button onClick={() => setIsDeleteOrderModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X size={24} />
                    </button>
                </div>
                <div className="px-6 py-4">
                    <div className="flex items-center justify-center mb-5">
                    <div className="flex-shrink-0 h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    </div>
                    <p className="text-center text-gray-700 mb-2">
                    Are you sure you want to delete this order?
                    </p>
                    <p className="text-center text-gray-500 text-sm mb-6">
                    Order #{selectedOrder.order_number} from {selectedOrder.supplier_name}
                    </p>
                    
                    <div className="bg-gray-50 rounded-md p-4 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-500">Date:</div>
                        <div className="text-gray-800">{formatDate(selectedOrder.order_date)}</div>
                        
                        <div className="text-gray-500">Status:</div>
                        <div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColors[selectedOrder.status]}`}>
                            {selectedOrder.status}
                        </span>
                        </div>
                        
                        <div className="text-gray-500">Amount:</div>
                        <div className="text-gray-800 font-semibold">{formatCurrency(selectedOrder.total_amount)}</div>
                    </div>
                    </div>
                    
                    <p className="text-xs text-red-500 mb-2">
                    This action cannot be undone. All order items will be removed.
                    </p>
                </div>
                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                    <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={() => setIsDeleteOrderModalOpen(false)}
                    >
                    Cancel
                    </button>
                    <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    disabled={isLoading}
                    >
                    {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
                </div>
            </div>
            )}
            </div>
        </div>
        );
};

const AddItemModal = ({ onClose, onSubmit, isLoading, departments, activeDepartment }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        department: activeDepartment || 'feed',
        current_stock: 0,
        unit: 'kg',
        unit_price: 0,
        reorder_level: 0,
        supplier_id: '',
        location: ''
    });
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Create a copy of formData with proper handling of supplier_id
        const submissionData = {
          ...formData,
          supplier_id: formData.supplier_id === '' ? null : formData.supplier_id
        };
        
        const success = await onSubmit(submissionData);
        if (success) {
          onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8 mx-auto max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
            <h3 className="text-lg font-medium">Add New Inventory Item</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
            </button>
            </div>
            <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Item name"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Item description"
                    rows="3"
                />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Category"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    >
                    {departments.map(dept => (
                        <option key={dept} value={dept}>
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </option>
                    ))}
                    </select>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <input
                    type="number"
                    name="current_stock"
                    value={formData.current_stock}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="units">Units</option>
                    <option value="pcs">Pieces</option>
                    </select>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                    <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Storage location"
                />
                </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={onClose}
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                disabled={isLoading}
                >
                {isLoading ? 'Saving...' : 'Add Item'}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
};

const SupplierModal = ({ supplier, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    state: supplier?.state || '',
    postal_code: supplier?.postal_code || '',
    category: supplier?.category || '',
    payment_terms: supplier?.payment_terms || '',
    notes: supplier?.notes || ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create sanitized data to be submitted
    const submissionData = { ...formData };
    
    // Convert empty strings to null for UUID fields
    if (submissionData.supplier_id === '') {
      submissionData.supplier_id = null;
    }
    
    const success = await onSubmit(submissionData);
    if (success) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 mx-auto max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4 flex-shrink-0">
            <h3 className="text-lg font-medium">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
        </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Company name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Primary contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Supplier category"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Street address"
                rows="2"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Postal code"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <input
                type="text"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. Net 30 days"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Additional notes"
                rows="2"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end space-x-3 flex-shrink-0">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (supplier ? 'Updating...' : 'Adding...') : (supplier ? 'Update Supplier' : 'Add Supplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PlaceOrderModal = ({ 
    onClose, 
    onSubmit, 
    isLoading, 
    departments, 
    activeDepartment, 
    suppliers, 
    inventoryItems 
  }) => {
    const [formData, setFormData] = useState({
      supplier_id: '',
      supplier_name: '',
      department: activeDepartment || 'feed',
      expected_delivery: '',
      status: 'Pending',
      notes: '',
      items: [{ item_id: '', item_name: '', quantity: 1, unit: 'kg', unit_price: 0 }]
    });
    
    useEffect(() => {
      if (suppliers.length > 0 && !formData.supplier_id) {
        const defaultSupplier = suppliers[0];
        setFormData(prev => ({
          ...prev,
          supplier_id: defaultSupplier.id,
          supplier_name: defaultSupplier.name
        }));
      }
    }, [suppliers, formData.supplier_id]);
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    const handleSupplierChange = (e) => {
      const supplierId = e.target.value;
      const supplier = suppliers.find(s => s.id === supplierId);
      setFormData(prev => ({
        ...prev,
        supplier_id: supplierId,
        supplier_name: supplier ? supplier.name : ''
      }));
    };
    
    const handleItemChange = (index, field, value) => {
      const updatedItems = [...formData.items];
      updatedItems[index][field] = value;
      
      // If item_id changed, update item_name and other details
      if (field === 'item_id') {
        const selectedItem = inventoryItems.filter(item => item.department === formData.department)
          .find(item => item.id === value);
        
        if (selectedItem) {
          updatedItems[index].item_name = selectedItem.name;
          updatedItems[index].unit = selectedItem.unit;
          updatedItems[index].unit_price = selectedItem.unit_price;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    };
    
    const addItemRow = () => {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items, 
          { item_id: '', item_name: '', quantity: 1, unit: 'kg', unit_price: 0 }
        ]
      }));
    };
    
    const removeItemRow = (index) => {
      if (formData.items.length <= 1) return;
      
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    };
    
    const calculateTotal = () => {
      return formData.items.reduce((total, item) => {
        return total + (parseFloat(item.quantity) * parseFloat(item.unit_price));
      }, 0);
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      const orderData = {
        ...formData,
        total_amount: calculateTotal()
      };
      const success = await onSubmit(orderData);
      if (success) {
        onClose();
      }
    };
    
    // Filter items by department
    const filteredItems = inventoryItems.filter(item => item.department === formData.department);
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl border border-gray-100 my-8 mx-auto max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b px-6 py-4 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 flex-shrink-0">
            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-600">Place New Order</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                <X size={24} />
            </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                <div className="px-6 py-4 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleSupplierChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select a supplier (optional)</option>
                    {suppliers?.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    name="expected_delivery"
                    value={formData.expected_delivery}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                  </select>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-3">Order Items</label>
                <div className="space-y-4 overflow-x-auto">
                    <div className="min-w-[650px]"> {/* Minimum width to ensure it doesn't get too squished */}
                    {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3">
                        <div className="col-span-5">
                        <label className="block text-xs text-gray-500 mb-1">Item</label>
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          required
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="">Select an item</option>
                          {filteredItems.map(invItem => (
                            <option key={invItem.id} value={invItem.id}>
                              {invItem.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          min="1"
                          step="0.01"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          required
                          className="w-full p-2 border border-gray-100 bg-gray-50 rounded-lg text-gray-500"
                          readOnly
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Unit Price (₹)</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          disabled={formData.items.length <= 1}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
                <button
                    type="button"
                    onClick={addItemRow}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all"
                >
                    <Plus size={16} className="mr-2" />
                    Add Another Item
                </button>
                </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Any additional notes about this order"
                  rows="2"
                />
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end">
                  <div className="text-right bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Order Value</p>
                    <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-600">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(calculateTotal())}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 flex-shrink-0">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 rounded-lg hover:opacity-90 transition-all shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? 
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Placing Order...
                  </div> : 
                  <div className="flex items-center">
                    <ShoppingCart size={16} className="mr-2" />
                    Place Order
                  </div>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

const DeleteItemModal = ({ item, onClose, onConfirm, isLoading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8 mx-auto max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium">Delete Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-center mb-5">
            <div className="flex-shrink-0 h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-center text-gray-700 mb-6">
            Are you sure you want to delete <span className="font-semibold">{item.name}</span>?
            <br />
            This action cannot be undone.
          </p>
          
          {/* Show item details */}
          <div className="bg-gray-50 rounded-md p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Category:</div>
              <div className="text-gray-800">{item.category || 'N/A'}</div>
              
              <div className="text-gray-500">Current Stock:</div>
              <div className="text-gray-800">{item.current_stock} {item.unit}</div>
              
              <div className="text-gray-500">Department:</div>
              <div className="text-gray-800">{item.department.charAt(0).toUpperCase() + item.department.slice(1)}</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
const ViewItemModal = ({ item, onClose, onEdit, formatCurrency, formatDate }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8 mx-auto max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium">{item.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {item.description && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-sm text-gray-800">{item.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
              <p className="text-sm text-gray-800">{item.category || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Department</h4>
              <p className="text-sm text-gray-800">{item.department ? item.department.charAt(0).toUpperCase() + item.department.slice(1) : 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Current Stock</h4>
              <p className="text-sm text-gray-800">{item.current_stock} {item.unit}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Unit Price</h4>
              <p className="text-sm text-gray-800">{formatCurrency(item.unit_price)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Total Value</h4>
              <p className="text-sm font-semibold text-gray-800">{formatCurrency(item.current_stock * item.unit_price)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Reorder Level</h4>
              <p className="text-sm text-gray-800">{item.reorder_level} {item.unit}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
              <p className="text-sm text-gray-800">{item.location || 'N/A'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
            <p className="text-sm text-gray-800">{formatDate(item.last_updated)}</p>
          </div>
          
          {item.notes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
              <p className="text-sm text-gray-800">{item.notes}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};
const EditItemModal = ({ item, onClose, onSubmit, isLoading, departments }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    department: item.department || 'feed',
    current_stock: item.current_stock || 0,
    unit: item.unit || 'kg',
    unit_price: item.unit_price || 0,
    reorder_level: item.reorder_level || 0,
    supplier_id: item.supplier_id || '',
    location: item.location || '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8 mx-auto max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium">Edit {item.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Item description"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                <input
                  type="number"
                  name="current_stock"
                  value={formData.current_stock}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Liter (l)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="units">Units</option>
                  <option value="pcs">Pieces</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Storage location"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// Order Details Modal for viewing and changing status
const OrderDetailsModal = ({ order, onClose, onUpdateStatus }) => {
    const [status, setStatus] = useState(order.status);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Add this helper function inside the modal
    const capitalizeFirstLetter = (string) => {
      if (!string) return '';
      return string.charAt(0).toUpperCase() + string.slice(1);
    };
  
  const handleStatusChange = async () => {
    if (status === order.status) return;
    
    setIsUpdating(true);
    const success = await onUpdateStatus(order.id, status);
    setIsUpdating(false);
    
    if (success) {
      onClose();
    }
  };
  
  const calculateTotal = () => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((sum, item) => sum + item.total_price, 0);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 mx-auto max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4 flex-shrink-0">
        <h3 className="text-lg font-medium">Order Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
        </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between mb-6 gap-4">
            <div>
            <p className="text-sm font-medium text-gray-500">Order Number</p>
            <p className="text-lg font-medium break-all">{order.order_number}</p>
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <div className="flex items-center mt-1">
                <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                >
                  <option value="Pending">Pending</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
                {status !== order.status && (
                <button 
                    onClick={handleStatusChange}
                    className="ml-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm whitespace-nowrap"
                    disabled={isUpdating}
                >
                    {isUpdating ? 'Updating...' : 'Update'}
                </button>
                )}
            </div>
            </div>
        </div>
          
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Supplier</p>
              <p className="text-base mt-1">{order.supplier_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-base mt-1">{capitalizeFirstLetter(order.department)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Order Date</p>
              <p className="text-base mt-1">{formatDate(order.order_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expected Delivery</p>
              <p className="text-base mt-1">{formatDate(order.expected_delivery)}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-3">Order Items</h4>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.order_items && order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      Total
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(calculateTotal())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            </div>
          </div>
          
          {order.notes && (
            <div>
              <p className="text-sm font-medium text-gray-500">Notes</p>
              <p className="text-base mt-1 bg-gray-50 rounded-md p-3">{order.notes}</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end space-x-3 flex-shrink-0">
        <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
          {order.status !== 'Cancelled' && order.status !== 'Completed' && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              onClick={() => {
                const newStatus = order.status === 'Ordered' ? 'Delivered' : 'Ordered';
                setStatus(newStatus);
                handleStatusChange();
              }}
            >
              {order.status === 'Pending' || order.status === 'Ordered' ? 'Mark as Delivered' : 'Mark as Completed'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default InventoryManagement;

