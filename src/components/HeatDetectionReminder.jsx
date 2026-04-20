import React from 'react';
import { Flame, Calendar } from 'lucide-react';

const HeatDetectionReminder = ({ cows, reproductiveStatuses, breedingData, onCowClick }) => {
  // Calculate days between two dates
  const daysBetween = (date1, date2) => {
    return Math.floor((new Date(date2) - new Date(date1)) / (1000 * 60 * 60 * 24));
  };

  // Get cows in heat or expected soon (2 days before to 3 days after expected heat)
  const heatAlerts = cows.filter(cow => {
    if (cow.status === 'Calf' || cow.status === 'Sold' || cow.status === 'Deceased' || cow.isPregnant) {
      return false;
    }

    const status = reproductiveStatuses[cow.id];
    if (!status?.next_heat_date) return false;

    const daysUntilHeat = daysBetween(new Date(), status.next_heat_date);

    // Show if: 2 days before to 3 days after expected heat
    return daysUntilHeat >= -2 && daysUntilHeat <= 3;
  }).map(cow => {
    const status = reproductiveStatuses[cow.id];
    const daysUntilHeat = daysBetween(new Date(), status.next_heat_date);

    return {
      ...cow,
      nextHeatDate: status.next_heat_date,
      daysUntilHeat,
      urgency: daysUntilHeat <= 0 ? 'high' : daysUntilHeat === 1 ? 'medium' : 'low'
    };
  }).sort((a, b) => a.daysUntilHeat - b.daysUntilHeat);

  if (heatAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg shadow-md">
      <div className="flex items-center mb-3">
        <Flame className="h-6 w-6 text-orange-600 mr-2" />
        <h4 className="font-semibold text-orange-900 text-lg">
          🔥 Heat Detection Alerts ({heatAlerts.length})
        </h4>
      </div>
      <p className="text-sm text-orange-800 mb-3">
        Cows in heat or expected within the next 2 days. Monitor closely for breeding opportunities.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {heatAlerts.map(cow => (
          <div
            key={cow.id}
            onClick={() => onCowClick && onCowClick(cow)}
            className={`bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all ${
              cow.urgency === 'high' ? 'border-l-4 border-red-500' :
              cow.urgency === 'medium' ? 'border-l-4 border-orange-500' :
              'border-l-4 border-yellow-500'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold text-gray-900">{cow.name}</span>
                <span className="text-xs text-gray-500 ml-2">#{cow.tagNumber}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                cow.urgency === 'high' ? 'bg-red-100 text-red-800' :
                cow.urgency === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {cow.daysUntilHeat === 0 ? 'Today' :
                 cow.daysUntilHeat < 0 ? `${Math.abs(cow.daysUntilHeat)}d overdue` :
                 `In ${cow.daysUntilHeat}d`}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Expected: {new Date(cow.nextHeatDate).toLocaleDateString()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Breed: {cow.breed}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
        💡 Tip: Best breeding window is 12-18 hours after first signs of heat. Watch for mounting behavior, mucus discharge, and restlessness.
      </div>
    </div>
  );
};

export default HeatDetectionReminder;
