import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus,
  Clipboard, 
  Droplet, 
  Thermometer, 
  Package, 
  IndianRupee, 
  Users,
  Search,
  X
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
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
      ref={buttonRef}
    >
      {/* Action buttons that appear on click with a vertical layout */}
      <div 
        className={`mb-4 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px]' : 'max-h-0'} overflow-hidden`}
        style={{ 
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        <div className="flex flex-col-reverse items-end gap-3 mb-3">
          {actionButtons.map((button, index) => (
            <div key={index} className="relative group">
              <button 
                className={`${button.color} rounded-full h-12 w-12 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
                onClick={() => {
                  button.action();
                  setIsOpen(false); // Close menu after action
                }}
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
      </div>

      {/* Main floating action button */}
      <button 
        className={`h-14 w-14 rounded-full ${isOpen ? 'bg-gray-700' : 'bg-gradient-to-r from-green-600 to-blue-600'} text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Actions"
      >
        {isOpen ? <X size={24} className="text-white" /> : <Plus size={28} className="text-white" />}
      </button>
    </div>
  );
};

export default QuickActionButton;
