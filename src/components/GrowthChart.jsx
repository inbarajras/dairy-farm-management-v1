import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { format } from 'date-fns';

const GrowthChart = ({ milestones, cowBreed = 'Holstein' }) => {
  const [showPercentiles, setShowPercentiles] = useState(true);
  const [showProjection, setShowProjection] = useState(true);
  
  // Standard growth percentiles for different breeds
  const breedGrowthRates = {
    'Holstein': { birthWeight: 40, dailyGain: 0.8 },
    'Jersey': { birthWeight: 25, dailyGain: 0.6 },
    'Brown Swiss': { birthWeight: 35, dailyGain: 0.75 },
    'Ayrshire': { birthWeight: 30, dailyGain: 0.7 },
    'Guernsey': { birthWeight: 28, dailyGain: 0.65 },
    'Other': { birthWeight: 30, dailyGain: 0.7 }
  };
  
  // Get growth rate for this breed or use "Other" as default
  const growthRate = breedGrowthRates[cowBreed] || breedGrowthRates.Other;

  // Format data for the chart and calculate projections
  const chartData = useMemo(() => {
    if (!milestones || milestones.length === 0) return [];
    
    // Sort milestones by date
    const sortedMilestones = [...milestones]
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Process milestones with formatted dates and additional properties
    const processedData = sortedMilestones.map(milestone => {
      // Format the date for display
      const date = new Date(milestone.date);
      const formattedDate = format(date, 'MMM d, yyyy');
      
      return {
        date: formattedDate,
        rawDate: milestone.date, // Keep raw date for sorting
        weight: milestone.weight,
        ageInDays: milestone.ageInDays,
        milestone: milestone.milestone,
        growthRate: milestone.growthRate || 0
      };
    });
    
    // Add ideal weight curves for comparison
    if (processedData.length > 0) {
      // Get first and last data points for age range
      const firstAge = Math.min(...processedData.map(d => d.ageInDays));
      const lastAge = Math.max(...processedData.map(d => d.ageInDays));
      
      // Add projections for future growth if requested
      if (showProjection) {
        const lastDataPoint = processedData[processedData.length - 1];
        const projectionDays = 90; // Project 90 days into the future
        
        // Only add projections if we have at least one milestone
        if (lastDataPoint) {
          let lastDate = new Date(lastDataPoint.rawDate);
          let lastWeight = lastDataPoint.weight;
          let lastGrowthRate = lastDataPoint.growthRate || growthRate.dailyGain;
          
          // Add projection points
          for (let i = 30; i <= projectionDays; i += 30) {
            let projectionDate = new Date(lastDate);
            projectionDate.setDate(projectionDate.getDate() + i);
            
            const projectedWeight = lastWeight + (lastGrowthRate * i / 30);
            
            processedData.push({
              date: format(projectionDate, 'MMM d, yyyy'),
              rawDate: projectionDate.toISOString(),
              weight: null, // Actual weight is null
              projectedWeight: Math.round(projectedWeight * 10) / 10,
              ageInDays: lastDataPoint.ageInDays + i,
              milestone: `Projection (${i} days)`,
              isProjection: true
            });
          }
        }
      }
      
      // Add standard growth curves if requested
      if (showPercentiles) {
        // Add percentile data to each point
        processedData.forEach(point => {
          // Calculate expected weight based on breed standards
          const expectedWeight = growthRate.birthWeight + (growthRate.dailyGain * point.ageInDays);
          point.p50 = Math.round(expectedWeight * 10) / 10; // 50th percentile (median)
          point.p25 = Math.round(expectedWeight * 0.9 * 10) / 10; // 25th percentile
          point.p75 = Math.round(expectedWeight * 1.1 * 10) / 10; // 75th percentile
        });
      }
    }
    
    return processedData;
  }, [milestones, showPercentiles, showProjection, cowBreed, growthRate]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-r from-purple-50/40 via-gray-50 to-pink-50/30 rounded-lg">
        <p className="text-gray-500">No growth data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-end space-x-4 mb-2 text-xs">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showPercentiles}
            onChange={() => setShowPercentiles(!showPercentiles)}
            className="form-checkbox h-3 w-3 text-purple-600 transition duration-150 ease-in-out"
          />
          <span className="ml-1 text-gray-600">Show Standards</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showProjection}
            onChange={() => setShowProjection(!showProjection)}
            className="form-checkbox h-3 w-3 text-purple-600 transition duration-150 ease-in-out"
          />
          <span className="ml-1 text-gray-600">Show Projection</span>
        </label>
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 40, left: 20, bottom: 30 }}
          >
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
              </linearGradient>
              <pattern id="percentilePattern" patternUnits="userSpaceOnUse" width="4" height="4">
                <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{ stroke: '#8B5CF6', strokeWidth: 1, opacity: 0.3 }} />
              </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              stroke="#9CA3AF" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `${value}kg`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <YAxis 
              yAxisId={1}
              orientation="right"
              stroke="#EC4899" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `${value} kg/m`}
              domain={[0, 'dataMax + 0.5']}
            />
            
            {/* Render percentile bands if enabled */}
            {showPercentiles && (
              <>
                {/* 25-75 percentile area */}
                <ReferenceArea 
                  y1={(data) => data?.p25} 
                  y2={(data) => data?.p75}
                  stroke="none"
                  fill="url(#percentilePattern)"
                  fillOpacity={0.2}
                />
                {/* Median line (50th percentile) */}
                <Line 
                  type="monotone"
                  dataKey="p50"
                  name="Breed Standard"
                  stroke="#8B5CF6"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                  activeDot={false}
                />
              </>
            )}
            
            {/* Actual weight data */}
            <Line 
              type="monotone" 
              dataKey="weight" 
              name="Actual Weight" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#8B5CF6' }}
              dot={{ r: 4, strokeWidth: 2, stroke: '#8B5CF6', fill: 'white' }}
            />
            
            {/* Growth rate */}
            {chartData.length > 1 && (
              <Line 
                type="monotone" 
                dataKey="growthRate" 
                name="Growth Rate (kg/month)" 
                stroke="#EC4899" 
                strokeDasharray="5 5"
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#EC4899' }}
                dot={{ r: 3, strokeWidth: 2, stroke: '#EC4899', fill: 'white' }}
                yAxisId={1}
              />
            )}
            
            {/* Weight projection */}
            {showProjection && (
              <Line 
                type="monotone" 
                dataKey="projectedWeight" 
                name="Projected Weight" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 3, strokeWidth: 1, stroke: '#8B5CF6', fill: 'white' }}
                connectNulls={true}
              />
            )}
            
            <Tooltip 
              formatter={(value, name, props) => {
                if (!value) return ['-', name];
                
                if (name === 'Actual Weight') return [`${value} kg`, name];
                if (name === 'Projected Weight') return [`${value} kg`, name];
                if (name === 'Breed Standard') return [`${value} kg`, name];
                if (name === 'Growth Rate (kg/month)') return [`${value} kg/month`, name];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const milestone = chartData.find(item => item.date === label);
                return `${label} (${milestone?.milestone || ''})`;
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #EEE',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrowthChart;
