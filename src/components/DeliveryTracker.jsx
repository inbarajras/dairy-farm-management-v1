import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { fetchDeliverySchedule } from './services/cowService';

const DeliveryTracker = () => {
  const [deliveryData, setDeliveryData] = useState({
    expectedDeliveries: [],
    completedDeliveries: []
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('expected'); // 'expected' or 'completed'

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = async () => {
    try {
      setLoading(true);
      const data = await fetchDeliverySchedule();
      setDeliveryData(data);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter deliveries by selected month
  const filterByMonth = (deliveries, dateField) => {
    return deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery[dateField]);
      return (
        deliveryDate.getMonth() === selectedMonth.getMonth() &&
        deliveryDate.getFullYear() === selectedMonth.getFullYear()
      );
    });
  };

  // Group deliveries by month for the next 12 months
  const getMonthlyBreakdown = () => {
    const breakdown = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;

      const expectedCount = deliveryData.expectedDeliveries.filter(d => {
        const date = new Date(d.expected_delivery_date);
        return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
      }).length;

      const completedCount = deliveryData.completedDeliveries.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
      }).length;

      breakdown.push({
        month: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        monthDate: month,
        expectedCount,
        completedCount
      });
    }

    return breakdown;
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const monthlyBreakdown = getMonthlyBreakdown();
  const expectedThisMonth = filterByMonth(deliveryData.expectedDeliveries, 'expected_delivery_date');
  const completedThisMonth = filterByMonth(deliveryData.completedDeliveries, 'date');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Delivery Tracker</h2>
        <p className="text-purple-100">Track expected and completed deliveries</p>
      </div>

      {/* Monthly Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Deliveries</p>
              <p className="text-3xl font-bold text-gray-800">
                {deliveryData.expectedDeliveries.filter(d => getDaysUntil(d.expected_delivery_date) >= 0).length}
              </p>
            </div>
            <Clock className="h-12 w-12 text-orange-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-3xl font-bold text-gray-800">
                {deliveryData.expectedDeliveries.filter(d => getDaysUntil(d.expected_delivery_date) < 0).length}
              </p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed (Last 30 days)</p>
              <p className="text-3xl font-bold text-gray-800">
                {deliveryData.completedDeliveries.filter(d => {
                  const daysSince = getDaysUntil(d.date);
                  return daysSince >= -30 && daysSince <= 0;
                }).length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">12-Month Outlook</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Deliveries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed Deliveries
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyBreakdown.map((month, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    month.monthDate.getMonth() === selectedMonth.getMonth() &&
                    month.monthDate.getFullYear() === selectedMonth.getFullYear()
                      ? 'bg-purple-50'
                      : ''
                  }`}
                  onClick={() => setSelectedMonth(month.monthDate)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                      {month.expectedCount} cows
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {month.completedCount} cows
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Month Details */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('expected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'expected'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Expected ({expectedThisMonth.length})
              </button>
              <button
                onClick={() => setViewMode('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Completed ({completedThisMonth.length})
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {viewMode === 'expected' ? (
            expectedThisMonth.length > 0 ? (
              <div className="space-y-4">
                {expectedThisMonth.map((delivery) => {
                  const daysUntil = getDaysUntil(delivery.expected_delivery_date);
                  const isOverdue = daysUntil < 0;

                  return (
                    <div
                      key={delivery.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        isOverdue
                          ? 'bg-red-50 border-red-500'
                          : daysUntil <= 7
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {delivery.cows?.name || `Tag #${delivery.cows?.tag_number}`}
                          </h4>
                          <p className="text-sm text-gray-600">Breed: {delivery.cows?.breed}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Expected: {formatDate(delivery.expected_delivery_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isOverdue
                                ? 'bg-red-100 text-red-800'
                                : daysUntil <= 7
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isOverdue
                              ? `${Math.abs(daysUntil)} days overdue`
                              : daysUntil === 0
                              ? 'Due today'
                              : `${daysUntil} days left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expected deliveries for this month</p>
              </div>
            )
          ) : (
            completedThisMonth.length > 0 ? (
              <div className="space-y-4">
                {completedThisMonth.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-4 rounded-lg border-l-4 bg-green-50 border-green-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {delivery.cows?.name || `Tag #${delivery.cows?.tag_number}`}
                        </h4>
                        <p className="text-sm text-gray-600">Breed: {delivery.cows?.breed}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Calving Date: {formatDate(delivery.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Result: {delivery.result}
                        </p>
                      </div>
                      <div className="text-right">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed deliveries for this month</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracker;
