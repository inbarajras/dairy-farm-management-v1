import React, { useState, useEffect, useMemo } from 'react';

// Record Growth Milestone Modal Component
const RecordGrowthMilestoneModal = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    milestone: '',
    weight: '',
    notes: '',
    performedBy: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ageInDays, setAgeInDays] = useState(0);
  
  // Generate milestone suggestion based on cow's age
  useEffect(() => {
    if (cow && cow.dateOfBirth) {
      const birthDate = new Date(cow.dateOfBirth);
      const measurementDate = new Date(formData.date);
      const calculatedAgeInDays = Math.floor((measurementDate - birthDate) / (1000 * 60 * 60 * 24));
      setAgeInDays(calculatedAgeInDays);
      
      // Generate a suggested milestone name based on age
      const suggestedMilestone = generateMilestoneName(calculatedAgeInDays);
      setFormData(prev => ({ ...prev, milestone: suggestedMilestone }));
    }
  }, [cow, formData.date]);
  
  const generateMilestoneName = (ageInDays) => {
    if (ageInDays < 7) return 'First Week';
    if (ageInDays < 30) return 'First Month';
    
    const months = Math.floor(ageInDays / 30);
    if (months === 1) return '1 Month';
    if (months < 12) return `${months} Months`;
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) return `${years} Year${years > 1 ? 's' : ''}`;
    return `${years} Year${years > 1 ? 's' : ''}, ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''}`;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when input changes
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Calculate recommended weight range based on breed and age
  const weightRecommendation = useMemo(() => {
    if (!cow || !cow.breed || !ageInDays) return null;
    
    // Different breed growth rates (approximate values in kg)
    const breedGrowthRates = {
      'Holstein': { birthWeight: 40, dailyGain: 0.8 },
      'Jersey': { birthWeight: 25, dailyGain: 0.6 },
      'Brown Swiss': { birthWeight: 35, dailyGain: 0.75 },
      'Ayrshire': { birthWeight: 30, dailyGain: 0.7 },
      'Guernsey': { birthWeight: 28, dailyGain: 0.65 },
      'Other': { birthWeight: 30, dailyGain: 0.7 }
    };
    
    // Get growth rate for this breed or use "Other" as default
    const growthRate = breedGrowthRates[cow.breed] || breedGrowthRates.Other;
    
    // Calculate expected weight based on age
    const expectedWeight = growthRate.birthWeight + (growthRate.dailyGain * ageInDays);
    const minWeight = expectedWeight * 0.85; // 15% below expected
    const maxWeight = expectedWeight * 1.15; // 15% above expected
    
    return {
      min: Math.round(minWeight * 10) / 10, // Round to 1 decimal place
      expected: Math.round(expectedWeight * 10) / 10,
      max: Math.round(maxWeight * 10) / 10
    };
  }, [cow, ageInDays]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.milestone) errors.milestone = 'Milestone description is required';
    if (!formData.weight) errors.weight = 'Weight is required';
    else if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      errors.weight = 'Weight must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const milestoneData = {
        ...formData,
        weight: parseFloat(formData.weight)
      };
      
      await onSubmit(cow.id, milestoneData);
      onClose();
    } catch (error) {
      console.error('Error submitting growth milestone:', error);
      setFormErrors({ submit: 'Failed to record milestone. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto my-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 break-words">
            Record Growth Milestone for {cow?.name || 'Cow'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                max={new Date().toISOString().split('T')[0]}
              />
              {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
            </div>
            
            <div>
              <label htmlFor="milestone" className="block text-sm font-medium text-gray-700 mb-1">
                Milestone
              </label>
              <input
                type="text"
                id="milestone"
                name="milestone"
                placeholder="e.g. 3 Months, Weaning, etc."
                value={formData.milestone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
              {formErrors.milestone && <p className="text-red-500 text-xs mt-1">{formErrors.milestone}</p>}
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  placeholder="Enter weight in kg"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  step="0.01"
                  min="0"
                />
                {weightRecommendation && (
                  <div className="mt-2 text-xs">
                    <div className="flex items-center">
                      <span className="text-gray-600">Recommended range for {cow.breed} at this age:</span>
                    </div>
                    <div className="mt-1 bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-purple-700">{weightRecommendation.min} kg</span>
                        <span className="font-medium text-pink-800">{weightRecommendation.expected} kg</span>
                        <span className="text-purple-700">{weightRecommendation.max} kg</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div className="relative w-full h-full">
                          {formData.weight && (
                            <div 
                              className={`absolute top-0 h-full ${
                                parseFloat(formData.weight) < weightRecommendation.min ? 'bg-amber-400' :
                                parseFloat(formData.weight) > weightRecommendation.max ? 'bg-amber-400' :
                                'bg-green-500'
                              }`}
                              style={{
                                left: `${Math.max(0, Math.min(100, ((parseFloat(formData.weight) - weightRecommendation.min) / 
                                  (weightRecommendation.max - weightRecommendation.min)) * 100))}%`,
                                width: '4px'
                              }}
                            ></div>
                          )}
                          <div className="absolute top-0 left-0 w-full flex">
                            <div className="h-full bg-purple-200" style={{ width: '15%' }}></div>
                            <div className="h-full bg-gradient-to-r from-purple-300 to-pink-300" style={{ width: '70%' }}></div>
                            <div className="h-full bg-purple-200" style={{ width: '15%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low</span>
                        <span className="font-medium">Expected</span>
                        <span>High</span>
                      </div>
                      {formData.weight && (
                        <div className="mt-1 text-center">
                          {parseFloat(formData.weight) < weightRecommendation.min && (
                            <p className="text-amber-600">Weight is below recommended range for this age</p>
                          )}
                          {parseFloat(formData.weight) > weightRecommendation.max && (
                            <p className="text-amber-600">Weight is above recommended range for this age</p>
                          )}
                          {parseFloat(formData.weight) >= weightRecommendation.min && 
                           parseFloat(formData.weight) <= weightRecommendation.max && (
                            <p className="text-green-600">Weight is within healthy range</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {formErrors.weight && <p className="text-red-500 text-xs mt-1">{formErrors.weight}</p>}
            </div>
            
            <div>
              <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Measured By
              </label>
              <input
                type="text"
                id="performedBy"
                name="performedBy"
                placeholder="Name of person who took the measurement"
                value={formData.performedBy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Enter any additional notes about this milestone"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {formErrors.submit}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordGrowthMilestoneModal;
