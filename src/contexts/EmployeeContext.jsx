// src/contexts/EmployeeContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../lib/supabase';

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('Employees')
          .select(`
            id,
            job_title,
            status,
            phone,
            department:Departments(name),
            user:Users(username, email)
          `)
          .eq('status', 'Active');
          
        if (error) throw error;
        
        // Transform the data to match the expected component format
        const transformedData = data.map(employee => ({
          id: employee.id,
          name: employee.user.username || 'Unknown',
          jobTitle: employee.job_title,
          department: employee.department.name || 'Unknown',
          email: employee.user.email,
          phone: employee.phone,
          status: employee.status
        }));
        
        setEmployees(transformedData);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Failed to load employees data.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEmployees();
  }, []);
  
  return (
    <EmployeeContext.Provider value={{ employees, loading, error }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = () => useContext(EmployeeContext);