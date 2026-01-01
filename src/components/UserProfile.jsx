import React, { useState, useEffect } from 'react';
import { 
  User,
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Clock, 
  Calendar,
  Award,
  Shield,
  Key,
  Upload,
  Camera,
  Save,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import emp from '../assets/images/emp.jpg'
import { toast } from '../components/utils/CustomToast';
import UserRoleBadge from './UserRoleBadge';

const UserProfile = ({ userData: initialUserData }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [userAvatar, setUserAvatar] = useState(initialUserData?.profileImage || '/api/placeholder/150/150');
  
  // Set user data from props or use defaults
  const [userData, setUserData] = useState({
    firstName: initialUserData?.firstName || '',
    lastName: initialUserData?.lastName || '',
    email: initialUserData?.email || '',
    phone: initialUserData?.phone || '',
    address: initialUserData?.address || '',
    jobTitle: initialUserData?.jobTitle || '',
    department: initialUserData?.department || '',
    dateJoined: initialUserData?.dateJoined || new Date().toISOString(),
    workSchedule: initialUserData?.workSchedule || 'Full-time',
    bio: initialUserData?.bio || '',
    skills: initialUserData?.skills || [],
    certifications: initialUserData?.certifications || []
  });

  useEffect(() => {
    if (initialUserData) {
      setUserData({
        firstName: initialUserData.firstName || '',
        lastName: initialUserData.lastName || '',
        email: initialUserData.email || '',
        phone: initialUserData.phone || '',
        address: initialUserData.address || '',
        jobTitle: initialUserData.jobTitle || '',
        department: initialUserData.department || '',
        dateJoined: initialUserData.dateJoined || new Date().toISOString(),
        workSchedule: initialUserData.workSchedule || 'Full-time',
        bio: initialUserData.bio || '',
        skills: initialUserData.skills || [],
        certifications: initialUserData.certifications || []
      });
      setUserAvatar(initialUserData.profileImage || '/api/placeholder/150/150');
    }
  }, [initialUserData]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileReader = new FileReader();
      
      // Show preview immediately
      fileReader.onload = (e) => {
        setUserAvatar(e.target.result);
      };
      fileReader.readAsDataURL(file);
      
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${initialUserData.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-content')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data } = supabase.storage
          .from('user-content')
          .getPublicUrl(filePath);
          
        if (data && data.publicUrl) {
          // Update profile with new image URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ profile_image: data.publicUrl })
            .eq('id', initialUserData.id);
            
          if (updateError) throw updateError;
        }
        toast.success('Profile image updated successfully!');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  // Add or remove a skill
  const handleSkillChange = (action, index, value) => {
    let updatedSkills = [...userData.skills];
    
    if (action === 'add') {
      updatedSkills.push(value);
    } else if (action === 'remove') {
      updatedSkills.splice(index, 1);
    }

    setUserData({
      ...userData,
      skills: updatedSkills
    });
  };

  // Add, edit, or remove a certification
  const handleCertChange = (action, index, field, value) => {
    let updatedCerts = [...userData.certifications];
    
    if (action === 'add') {
      updatedCerts.push({ name: '', expiry: '' });
    } else if (action === 'update') {
      updatedCerts[index] = { 
        ...updatedCerts[index],
        [field]: value 
      };
    } else if (action === 'remove') {
      updatedCerts.splice(index, 1);
    }

    setUserData({
      ...userData,
      certifications: updatedCerts
    });
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Handle form submission to update user profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          display_name: `${userData.firstName} ${userData.lastName}`,
          phone: userData.phone,
          address: userData.address,
          job_title: userData.jobTitle,
          department: userData.department,
          bio: userData.bio,
          skills: userData.skills,
          certifications: userData.certifications,
          work_schedule: userData.workSchedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialUserData.id);
        
      if (error) throw error;
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30 overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-[1500px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Profile</h1>
          {/* <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSubmit}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
                >
                  Save Changes
                </button>
                <button 
                  onClick={toggleEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={toggleEdit}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
              >
                <Edit3 size={16} className="mr-2 inline" />
                Edit Profile
              </button>
            )}
          </div> */}
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-4 min-w-[300px]">
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'profile' 
                  ? 'border-green-500 text-green-600 bg-gradient-to-b from-white to-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
          {/* <button 
            onClick={() => setActiveTab('security')} 
            className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
              activeTab === 'security' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security
          </button>
          <button 
            onClick={() => setActiveTab('preferences')} 
            className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
              activeTab === 'preferences' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preferences
          </button>
          <button 
            onClick={() => setActiveTab('activity')} 
            className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
              activeTab === 'activity' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity
          </button> */}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img 
                      src={emp} 
                      alt="Profile" 
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow"
                    />
                    <div className="absolute top-0 right-0">
                      <UserRoleBadge className="shadow-sm" />
                    </div>
                    {isEditing && (
                      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-sm">
                        <Camera size={16} />
                        <input 
                          id="avatar-upload" 
                          type="file" 
                          className="hidden" 
                          onChange={handleImageUpload}
                          accept="image/*"
                        />
                      </label>
                    )}
                  </div>
                  
                  <h2 className="mt-4 text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 text-center">
                    {userData.firstName} {userData.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    {userData.jobTitle}
                  </p>
                  
                  <div className="mt-6 w-full border-t border-gray-200 pt-4">
                    <div className="flex items-start mb-3">
                      <Mail size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 break-words">{userData.email}</span>
                    </div>
                    <div className="flex items-start mb-3">
                      <Phone size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 break-words">{userData.phone}</span>
                    </div>
                    <div className="flex items-start mb-3">
                      <MapPin size={16} className="text-gray-400 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600 break-words">{userData.address}</span>
                    </div>
                    <div className="flex items-start mb-3">
                      <Briefcase size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 break-words">{userData.department}</span>
                    </div>
                    <div className="flex items-start mb-3">
                      <Clock size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 break-words">{userData.workSchedule}</span>
                    </div>
                    <div className="flex items-start">
                      <Calendar size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 break-words">Joined {formatDate(userData.dateJoined)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6 mb-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
                <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">About</h3>
                
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={userData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  ></textarea>
                ) : (
                  <p className="text-gray-600">{userData.bio}</p>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6 mb-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
                <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Personal Information</h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={userData.firstName}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={userData.lastName}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={userData.phone}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={userData.address}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">First Name</h4>
                      <p className="mt-1 text-gray-800">{userData.firstName}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Last Name</h4>
                      <p className="mt-1 text-gray-800">{userData.lastName}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Email</h4>
                      <p className="mt-1 text-gray-800">{userData.email}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Phone</h4>
                      <p className="mt-1 text-gray-800">{userData.phone}</p>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <h4 className="text-xs font-medium text-gray-500">Address</h4>
                      <p className="mt-1 text-gray-800">{userData.address}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6 mb-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
                <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Professional Information</h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={userData.jobTitle}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        name="department"
                        value={userData.department}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="Management">Management</option>
                        <option value="Animal Care">Animal Care</option>
                        <option value="Milk Production">Milk Production</option>
                        <option value="Administration">Administration</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Joined
                      </label>
                      <input
                        type="date"
                        name="dateJoined"
                        value={userData.dateJoined}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Schedule
                      </label>
                      <select
                        name="workSchedule"
                        value={userData.workSchedule}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Seasonal">Seasonal</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Job Title</h4>
                      <p className="mt-1 text-gray-800">{userData.jobTitle}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Department</h4>
                      <p className="mt-1 text-gray-800">{userData.department}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Date Joined</h4>
                      <p className="mt-1 text-gray-800">{formatDate(userData.dateJoined)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Work Schedule</h4>
                      <p className="mt-1 text-gray-800">{userData.workSchedule}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
                <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Skills & Certifications</h3>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {userData.skills.map((skill, index) => (
                      <div key={index} className="flex items-center bg-gradient-to-r from-green-50 to-blue-50 text-green-800 px-3 py-1 rounded-full text-sm mb-1">
                        <span className="break-words">{skill}</span>
                        {isEditing && (
                          <button 
                            onClick={() => handleSkillChange('remove', index)}
                            className="ml-1 text-green-600 hover:text-green-900 p-0.5"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <div className="flex mt-2">
                      <input
                        type="text"
                        placeholder="Add a skill"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                        id="new-skill"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSkill = document.getElementById('new-skill').value.trim();
                          if (newSkill) {
                            handleSkillChange('add', null, newSkill);
                            document.getElementById('new-skill').value = '';
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-lg text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Certifications</h4>
                  
                  <div className="space-y-4">
                    {userData.certifications.map((cert, index) => (
                      <div key={index} className={`p-3 ${isEditing ? 'border border-gray-200 rounded-lg' : ''} overflow-hidden`}>
                        {isEditing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-7">
                              <input
                                type="text"
                                value={cert.name}
                                onChange={(e) => handleCertChange('update', index, 'name', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                                placeholder="Certification name"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <input
                                type="date"
                                value={cert.expiry}
                                onChange={(e) => handleCertChange('update', index, 'expiry', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                              />
                            </div>
                            <div className="sm:col-span-1 flex items-center justify-center mt-2 sm:mt-0">
                              <button
                                type="button"
                                onClick={() => handleCertChange('remove', index)}
                                className="text-red-600 hover:text-red-900 transition-colors p-1" // Added padding for better touch target
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800 break-words">{cert.name}</p>
                            </div>
                            <div className="mt-1 sm:mt-0">
                              <span className="text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                                Expires: {formatDate(cert.expiry)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleCertChange('add')}
                      className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Certification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
              <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">
                <Key size={20} className="mr-2 inline" />
                Change Password
              </h3>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
                
                <div>
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
              <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">
                <Shield size={20} className="mr-2 inline" />
                Two-Factor Authentication
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
                </p>
                
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Enable Two-Factor Authentication
                </button>
              </div>
              
              <h4 className="text-sm font-medium text-gray-700 mb-2">Login Activity</h4>
              <div className="bg-gray-50 rounded-md p-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Rural County, USA</p>
                      <p className="text-xs text-gray-500">April 26, 2023 - 08:45 AM</p>
                    </div>
                    <div className="mt-1 sm:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current Session
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Rural County, USA</p>
                      <p className="text-xs text-gray-500">April 25, 2023 - 09:12 AM</p>
                    </div>
                    <div>
                      <button className="text-xs text-red-600 hover:text-red-900">
                        Logout Session
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Rural County, USA</p>
                      <p className="text-xs text-gray-500">April 24, 2023 - 07:53 AM</p>
                    </div>
                    <div>
                      <button className="text-xs text-red-600 hover:text-red-900">
                        Logout Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
              <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Theme</h4>
                    <p className="text-xs text-gray-500">Choose between light and dark theme</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      defaultValue="light"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Language</h4>
                    <p className="text-xs text-gray-500">Select your preferred language</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      defaultValue="english"
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Dashboard Layout</h4>
                    <p className="text-xs text-gray-500">Choose your preferred dashboard layout</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      defaultValue="standard"
                    >
                      <option value="standard">Standard</option>
                      <option value="compact">Compact</option>
                      <option value="expanded">Expanded</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Accessibility</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Font Size</h4>
                    <p className="text-xs text-gray-500">Adjust the text size</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      defaultValue="medium"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Reduced Motion</h4>
                    <p className="text-xs text-gray-500">Reduce animation and motion effects</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">High Contrast</h4>
                    <p className="text-xs text-gray-500">Increase contrast for better visibility</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 -mx-6 -mt-6 mb-6"></div>
              <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Recent Activity</h3>
                
              <div className="space-y-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                              <User className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-800">Updated profile picture</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime="2023-04-26T10:45:00">Today at 10:45 AM</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <Award className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-800">Completed Agricultural Safety certification</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime="2023-04-25T14:20:00">Yesterday at 2:20 PM</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center ring-8 ring-white">
                              <Briefcase className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-800">Completed weekly task: Milk production review</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime="2023-04-24T09:30:00">Apr 24 at 9:30 AM</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    
                    <li>
                      <div className="relative pb-8">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                              <Calendar className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-800">Scheduled team meeting: Q2 Planning</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime="2023-04-22T11:00:00">Apr 22 at 11:00 AM</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-center">
                  <button className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    View All Activity
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Login History</h3>
              
              <div className="overflow-hidden shadow-sm border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        April 26, 2023 - 08:45 AM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        192.168.1.1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rural County, USA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Chrome / Windows
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        April 25, 2023 - 09:12 AM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        192.168.1.1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rural County, USA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Chrome / Windows
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        April 24, 2023 - 07:53 AM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        192.168.1.1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rural County, USA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Chrome / Windows
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        April 23, 2023 - 06:47 PM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        98.76.54.32
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rural County, USA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Safari / iOS
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default UserProfile;