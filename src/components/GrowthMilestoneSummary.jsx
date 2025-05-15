import React, { useMemo } from 'react';

const GrowthMilestoneSummary = ({ milestones, cowBreed }) => {
  // Different breed growth rates (approximate values in kg)
  const breedGrowthRates = {
    'Holstein': { birthWeight: 40, dailyGain: 0.8, weightAt12Months: 330 },
    'Jersey': { birthWeight: 25, dailyGain: 0.6, weightAt12Months: 250 },
    'Brown Swiss': { birthWeight: 35, dailyGain: 0.75, weightAt12Months: 310 },
    'Ayrshire': { birthWeight: 30, dailyGain: 0.7, weightAt12Months: 290 },
    'Guernsey': { birthWeight: 28, dailyGain: 0.65, weightAt12Months: 270 },
    'Other': { birthWeight: 30, dailyGain: 0.7, weightAt12Months: 290 }
  };

  const growthAnalysis = useMemo(() => {
    if (!milestones || milestones.length < 2) {
      return {
        complete: false,
        message: "Not enough data for growth analysis"
      };
    }

    // Sort milestones by date
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get most recent milestone
    const latestMilestone = sortedMilestones[sortedMilestones.length - 1];
    
    // Get breed standard
    const breedStandard = breedGrowthRates[cowBreed] || breedGrowthRates.Other;
    
    // Calculate expected weight at this age
    const expectedWeight = breedStandard.birthWeight + (breedStandard.dailyGain * latestMilestone.ageInDays);
    
    // Compare actual vs expected
    const weightDiff = latestMilestone.weight - expectedWeight;
    const weightPercentage = (latestMilestone.weight / expectedWeight) * 100;
    
    // Calculate average daily gain since birth
    const birthMilestone = sortedMilestones.find(m => m.milestone === 'Birth') || sortedMilestones[0];
    const daysSinceBirth = latestMilestone.ageInDays - (birthMilestone.ageInDays || 0);
    const weightGainSinceBirth = latestMilestone.weight - birthMilestone.weight;
    const avgDailyGain = daysSinceBirth > 0 ? weightGainSinceBirth / daysSinceBirth : 0;
    
    // Average growth rate between the last 2 measurements
    const previousMilestone = sortedMilestones[sortedMilestones.length - 2];
    const daysBetweenLastMilestones = latestMilestone.ageInDays - previousMilestone.ageInDays;
    const weightGainBetweenLastMilestones = latestMilestone.weight - previousMilestone.weight;
    const recentDailyGain = daysBetweenLastMilestones > 0 ? weightGainBetweenLastMilestones / daysBetweenLastMilestones : 0;
    
    // Expected puberty age based on weight and breed
    let expectedPuberty = null;
    if (weightPercentage < 100) {
      // If animal is below breed standard weight, may have delayed puberty
      expectedPuberty = {
        age: Math.max(12, 12 + ((100 - weightPercentage) / 10)), // Add delay based on how far below standard
        confidence: 'moderate'
      };
    } else {
      // If animal is at or above breed standard weight
      expectedPuberty = {
        age: 11 + ((weightPercentage - 100) / -20), // Earlier puberty if above standard (limited to 9-12 months)
        confidence: 'high'
      };
    }
    expectedPuberty.age = Math.max(9, Math.min(15, expectedPuberty.age)); // Cap between 9-15 months
    
    // Categorize growth status
    let growthStatus = '';
    let statusColor = '';
    if (weightPercentage >= 95 && weightPercentage <= 115) {
      growthStatus = 'Optimal';
      statusColor = 'text-green-600';
    } else if (weightPercentage >= 85 && weightPercentage < 95) {
      growthStatus = 'Slightly below target';
      statusColor = 'text-amber-600';
    } else if (weightPercentage > 115 && weightPercentage <= 125) {
      growthStatus = 'Slightly above target';
      statusColor = 'text-amber-600';
    } else if (weightPercentage < 85) {
      growthStatus = 'Significantly below target';
      statusColor = 'text-red-600';
    } else {
      growthStatus = 'Significantly above target';
      statusColor = 'text-red-600';
    }
    
    // Recommendations based on growth status
    let recommendations = [];
    if (weightPercentage < 90) {
      recommendations.push('Consider adjusting nutrition to increase caloric intake');
      recommendations.push('Check for potential health issues affecting growth');
    } else if (weightPercentage > 120) {
      recommendations.push('Monitor body condition to prevent excessive fat deposition');
      recommendations.push('Consider adjusting diet to moderate growth rate');
    }
    
    // If growth has slowed recently
    if (recentDailyGain < avgDailyGain * 0.7 && avgDailyGain > 0) {
      recommendations.push('Recent growth has slowed. Evaluate current feeding program.');
    }
    
    return {
      complete: true,
      latestAge: latestMilestone.ageInDays,
      latestWeight: latestMilestone.weight,
      expectedWeight: Math.round(expectedWeight * 10) / 10,
      weightDiff: Math.round(weightDiff * 10) / 10,
      weightPercentage: Math.round(weightPercentage),
      avgDailyGain: Math.round(avgDailyGain * 1000) / 1000,
      recentDailyGain: Math.round(recentDailyGain * 1000) / 1000,
      growthStatus,
      statusColor,
      expectedPuberty,
      recommendations
    };
  }, [milestones, cowBreed]);

  if (!growthAnalysis.complete) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <p className="text-gray-500 text-center">{growthAnalysis.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Growth Analysis</h4>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Current Growth Status</span>
            <span className={`text-sm font-medium ${growthAnalysis.statusColor}`}>
              {growthAnalysis.growthStatus}
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full">
            <div 
              className={`h-full rounded-full ${
                growthAnalysis.weightPercentage >= 95 && growthAnalysis.weightPercentage <= 115
                  ? 'bg-green-500'
                  : (growthAnalysis.weightPercentage >= 85 && growthAnalysis.weightPercentage < 95) || 
                    (growthAnalysis.weightPercentage > 115 && growthAnalysis.weightPercentage <= 125)
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, growthAnalysis.weightPercentage))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span className="font-medium">Target</span>
            <span>High</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Average Daily Gain</p>
            <p className="text-sm font-medium">
              {growthAnalysis.avgDailyGain.toFixed(2)} kg/day
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Recent Daily Gain</p>
            <p className="text-sm font-medium">
              {growthAnalysis.recentDailyGain.toFixed(2)} kg/day
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Current vs. Expected</p>
            <p className="text-sm font-medium">
              {growthAnalysis.weightDiff > 0 ? '+' : ''}{growthAnalysis.weightDiff} kg
              <span className="text-xs text-gray-500 ml-1">
                ({growthAnalysis.weightPercentage}%)
              </span>
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Est. Puberty Age</p>
            <p className="text-sm font-medium">
              ~{Math.round(growthAnalysis.expectedPuberty.age)} months
              <span className="text-xs text-gray-500 ml-1">
                ({growthAnalysis.expectedPuberty.confidence})
              </span>
            </p>
          </div>
        </div>
        
        {growthAnalysis.recommendations.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs font-semibold text-gray-700 mb-1">Recommendations</h5>
            <ul className="text-xs text-gray-700 space-y-1">
              {growthAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-1 h-1 rounded-full bg-purple-500 mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthMilestoneSummary;
