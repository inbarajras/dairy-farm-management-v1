import React, { useState } from 'react';
import { 
  Plus,
  Clipboard, 
  Droplet, 
  Thermometer, 
  Package, 
  IndianRupee, 
  Users,
  Search
} from 'lucide-react';

const QuickActionButton = ({ 
  onAddCow, 
  onRecordMilk, 
  onRecordHealth, 
  onAddInventory, 
  onAddExpense, 
  onAddEmployee,
  onSearch
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Define our action buttons with direct modal opening actions
  const actionButtons = [
    { icon: <Clipboard size={20} />, tooltip: "Add New Cow", action: onAddCow, color: "bg-green-500" },
    { icon: <Droplet size={20} />, tooltip: "Record Milk Production", action: onRecordMilk, color: "bg-blue-500" },
    { icon: <Thermometer size={20} />, tooltip: "Record Health Event", action: onRecordHealth, color: "bg-purple-500" },
    { icon: <Package size={20} />, tooltip: "Add Inventory Item", action: onAddInventory, color: "bg-yellow-500" },
    { icon: <IndianRupee size={20} />, tooltip: "Add Expense", action: onAddExpense, color: "bg-red-500" },
    { icon: <Users size={20} />, tooltip: "Add Employee", action: onAddEmployee, color: "bg-indigo-500" }
  ];

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action buttons that appear on hover with a vertical layout */}
      <div 
        className={`mb-4 transition-all duration-300 ease-in-out flex flex-col-reverse items-end gap-3 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
      >
        {actionButtons.map((button, index) => (
          <div key={index} className="relative group">
            <button 
              className={`${button.color} rounded-full h-12 w-12 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
              onClick={button.action}
              aria-label={button.tooltip}
            >
              {button.icon}
            </button>
            
            {/* Tooltip that appears on hover, positioned to the left of the button */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {button.tooltip}
              {/* Arrow */}
              <div className="absolute right-0 top-1/2 -mt-1.5 -mr-1 border-l-4 border-l-gray-800 border-y-4 border-y-transparent"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main floating action button */}
      <button 
        className="h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
        aria-label="Quick Actions"
      >
        <Plus size={28} className="text-white" />
      </button>
    </div>
  );
};

export default QuickActionButton;
