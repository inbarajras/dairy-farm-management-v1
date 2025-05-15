import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { addDays, format } from 'date-fns';

const NextMilestoneReminder = ({ cow, lastMilestone, onSchedule }) => {
  const [selectedInterval, setSelectedInterval] = useState(null);
  
  if (!cow || !cow.dateOfBirth) {
    return null;
  }
  
  const calculateNextCheckDate = (interval) => {
    const today = new Date();
    let nextDate;
    
    switch(interval) {
      case 'twoWeeks':
        nextDate = addDays(today, 14);
        break;
      case 'oneMonth':
        nextDate = addDays(today, 30);
        break;
      case 'threeMonths':
        nextDate = addDays(today, 90);
        break;
      default:
        nextDate = addDays(today, 30);
    }
    
    return nextDate;
  };
  
  const handleSchedule = (interval) => {
    setSelectedInterval(interval);
    const nextDate = calculateNextCheckDate(interval);
    
    if (onSchedule) {
      onSchedule({
        interval,
        date: nextDate,
        formattedDate: format(nextDate, 'dd MMM yyyy')
      });
    }
  };
  
  const getRecommendedInterval = () => {
    // Age in days
    const birthDate = new Date(cow.dateOfBirth);
    const today = new Date();
    const ageInDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 60) {
      // Young calves grow quickly, check every 2 weeks
      return 'twoWeeks';
    } else if (ageInDays < 180) {
      // Check monthly for growing calves
      return 'oneMonth';
    } else {
      // Older heifers can be checked less frequently
      return 'threeMonths';
    }
  };
  
  const recommendedInterval = getRecommendedInterval();
  const recommendedDate = calculateNextCheckDate(recommendedInterval);
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 shadow-sm border border-purple-100 h-full">
      <h4 className="text-sm font-semibold text-purple-700 mb-2">Next Growth Check</h4>
      
      {selectedInterval ? (
        <div className="text-center py-2">
          <Calendar className="h-10 w-10 mx-auto text-purple-500 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Next check scheduled for:
          </p>
          <p className="text-lg font-bold text-purple-600 mt-1">
            {format(calculateNextCheckDate(selectedInterval), 'dd MMM yyyy')}
          </p>
          <button 
            onClick={() => setSelectedInterval(null)}
            className="text-xs py-1 px-3 mt-3 bg-white rounded-md shadow-sm border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-700">
            {lastMilestone 
              ? "Schedule your next weight measurement:"
              : "Record your first milestone to track growth progress."}
          </p>
          
          {lastMilestone && (
            <>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button 
                  className="text-xs py-1 px-2 bg-white rounded-md shadow-sm border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                  onClick={() => handleSchedule('twoWeeks')}
                >
                  2 weeks
                </button>
                <button 
                  className="text-xs py-1 px-2 bg-white rounded-md shadow-sm border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                  onClick={() => handleSchedule('oneMonth')}
                >
                  1 month
                </button>
                <button 
                  className="text-xs py-1 px-2 bg-white rounded-md shadow-sm border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                  onClick={() => handleSchedule('threeMonths')}
                >
                  3 months
                </button>
              </div>
              
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Recommended interval:</p>
                <p className="text-sm font-medium text-purple-600">
                  {recommendedInterval === 'twoWeeks' 
                    ? '2 weeks' 
                    : recommendedInterval === 'oneMonth'
                      ? '1 month'
                      : '3 months'
                  }
                  <span className="text-xs text-gray-500 ml-1">
                    ({format(recommendedDate, 'dd MMM yyyy')})
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NextMilestoneReminder;
