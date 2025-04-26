import React, { useState, useEffect } from 'react';
import { User, Key, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthenticationScreen = ({onAuthenticate}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    otp: ['', '', '', '', '', '']
  });
  
  const [timer, setTimer] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [authSuccess, setAuthSuccess] = useState(false);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (e, index) => {
    const { value } = e.target;
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...formData.otp];
      newOtp[index] = value;
      setFormData({
        ...formData,
        otp: newOtp
      });
      
      // Auto focus on next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle OTP input key press for backspace navigation
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Paste OTP from clipboard
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (/^\d+$/.test(pasteData) && pasteData.length <= 6) {
      const otpArray = pasteData.split('').slice(0, 6);
      const newOtp = [...formData.otp];
      
      otpArray.forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      
      setFormData({
        ...formData,
        otp: newOtp
      });
    }
  };

  // Start countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (timer > 0 && otpSent) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, otpSent]);

  // Handle successful authentication
  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        onAuthenticate();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authSuccess, onAuthenticate]);

  // Toggle login/register form
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setOtpSent(false);
    setValidationErrors({});
    setFormData({
      ...formData,
      confirmPassword: '',
      fullName: '',
      otp: ['', '', '', '', '', '']
    });
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    // Registration validation
    if (!isLogin) {
      if (!formData.fullName) {
        errors.fullName = 'Full name is required';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.confirmPassword !== formData.password) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (otpSent) {
      // Verify OTP
      const otpValue = formData.otp.join('');
      if (otpValue.length === 6) {
        console.log('Verifying OTP:', otpValue);
        // Here you would make an API call to verify the OTP
        // For demo, we'll simulate success
        setAuthSuccess(true);
      } else {
        setValidationErrors({ otp: 'Please enter a valid 6-digit OTP' });
      }
    } else {
      // Send OTP if validation passes
      if (validateForm()) {
        console.log('Sending OTP to:', formData.email);
        // Here you would make an API call to send the OTP
        // For demo, we'll simulate OTP sent
        setOtpSent(true);
        setTimer(60); // Start 60 second timer for resend
      }
    }
  };

  // Resend OTP
  const resendOtp = () => {
    if (timer === 0) {
      console.log('Resending OTP to:', formData.email);
      // Here you would make an API call to resend the OTP
      setTimer(60);
    }
  };

  // Go back to login/register form
  const handleBack = () => {
    setOtpSent(false);
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      x: 50,
      transition: { 
        ease: "easeInOut" 
      }
    }
  };

  const successVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-end bg-cover bg-center" 
      style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}>
      <AnimatePresence mode="wait">
        {authSuccess ? (
          <motion.div 
            key="success" 
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            initial="hidden"
            animate="visible"
            variants={successVariants}
          >
            <div className="bg-white rounded-xl p-8 flex flex-col items-center max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Successful!</h2>
              <p className="text-gray-600 text-center mb-4">You are being redirected to the dashboard</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full transition-all duration-1500 ease-out" style={{ width: '100%' }}></div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="auth-card"
            className="w-full max-w-md px-6 py-8 sm:px-0"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
          >
            <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-100">
              {/* Logo and Header */}
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <motion.h2 
                  className="text-2xl font-bold text-gray-800"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {otpSent ? 'Enter Verification Code' : (isLogin ? 'Sign in to your account' : 'Create a new account')}
                </motion.h2>
                <motion.p 
                  className="mt-2 text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {otpSent 
                    ? `We've sent a 6-digit code to ${formData.email}`
                    : (isLogin 
                      ? 'Enter your credentials to access the Dairy Farm Management System' 
                      : 'Fill out the form below to get started with your account')}
                </motion.p>
              </div>

              {/* Main Form */}
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {otpSent ? (
                    <motion.div 
                      key="otp-form"
                      className="space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* OTP Input Group */}
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                          One-Time Verification Code
                        </label>
                        <div className="flex justify-between items-center gap-2">
                          {formData.otp.map((digit, index) => (
                            <motion.input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handleOtpChange(e, index)}
                              onKeyDown={(e) => handleOtpKeyDown(e, index)}
                              onPaste={index === 0 ? handlePaste : undefined}
                              className="block w-12 h-12 text-center text-xl font-semibold border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                            />
                          ))}
                        </div>
                        {validationErrors.otp && (
                          <p className="mt-2 text-sm text-red-600">{validationErrors.otp}</p>
                        )}
                      </div>

                      {/* Timer and Resend */}
                      <div className="text-center text-sm">
                        <p className="text-gray-600 mb-2">Didn't receive the code?</p>
                        {timer > 0 ? (
                          <p className="text-gray-500">Resend code in {timer} seconds</p>
                        ) : (
                          <button 
                            type="button"
                            onClick={resendOtp}
                            className="text-green-600 font-medium hover:text-green-500"
                          >
                            Resend verification code
                          </button>
                        )}
                      </div>

                      {/* Back and Submit Buttons */}
                      <div className="flex items-center justify-between mt-8">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                        >
                          <ArrowLeft size={16} className="mr-1" />
                          Back
                        </button>
                        <button
                          type="submit"
                          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                        >
                          Verify & Continue
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="login-form"
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Email Input */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email address
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-gray-400" />
                          </div>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`block w-full pl-10 pr-3 py-2 border ${
                              validationErrors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200`}
                            placeholder="you@example.com"
                          />
                        </div>
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                        )}
                      </div>

                      {/* Full Name Input (Registration only) */}
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                            Full Name
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User size={18} className="text-gray-400" />
                            </div>
                            <input
                              id="fullName"
                              name="fullName"
                              type="text"
                              autoComplete="name"
                              value={formData.fullName}
                              onChange={handleChange}
                              className={`block w-full pl-10 pr-3 py-2 border ${
                                validationErrors.fullName ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200`}
                              placeholder="John Doe"
                            />
                          </div>
                          {validationErrors.fullName && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                          )}
                        </motion.div>
                      )}

                      {/* Password Input */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            value={formData.password}
                            onChange={handleChange}
                            className={`block w-full pl-10 pr-10 py-2 border ${
                              validationErrors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200`}
                            placeholder="••••••••"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                              {showPassword ? (
                                <EyeOff size={18} aria-hidden="true" />
                              ) : (
                                <Eye size={18} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </div>
                        {validationErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                        )}
                      </div>

                      {/* Confirm Password Input (Registration only) */}
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Key size={18} className="text-gray-400" />
                            </div>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={`block w-full pl-10 pr-3 py-2 border ${
                                validationErrors.confirmPassword ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-200`}
                              placeholder="••••••••"
                            />
                          </div>
                          {validationErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                          )}
                        </motion.div>
                      )}

                      {/* Remember me / Forgot password */}
                      {isLogin && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="remember-me"
                              name="remember-me"
                              type="checkbox"
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                              Remember me
                            </label>
                          </div>

                          <div className="text-sm">
                            <a href="#" className="font-medium text-green-600 hover:text-green-500 transition-colors">
                              Forgot your password?
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div>
                        <button
                          type="submit"
                          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                          {isLogin ? 'Sign in' : 'Create account'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Toggle Login/Register */}
                {!otpSent && (
                  <motion.div 
                    className="text-center mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm text-gray-600">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                      <button
                        type="button"
                        onClick={toggleAuthMode}
                        className="ml-1 font-medium text-green-600 hover:text-green-500 transition-colors"
                      >
                        {isLogin ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  </motion.div>
                )}
              </form>
            </div>
            
            {/* Dairy Farm Logo/Branding on bottom right */}
            <motion.div 
              className="mt-6 text-right px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-white font-bold text-xl">Dairy Farm Management</h2>
              <p className="text-gray-200 text-sm">Efficient Solutions for Modern Agriculture</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Left side welcome information */}
      <motion.div 
        className="hidden lg:flex items-center justify-center w-1/2 h-full pl-12 pb-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="text-white max-w-lg">
          <h1 className="text-5xl font-bold mb-4">Welcome to Your Dairy Farm Management System</h1>
          <p className="text-xl opacity-90 mb-6">Modern solutions for efficient dairy farm operations. Manage your livestock, production, and analytics all in one place.</p>
          <div className="flex space-x-4">
            <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-1">Streamlined Operations</h3>
              <p className="opacity-80">Track animal health, milk production, inventory and more</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-1">Real-time Analytics</h3>
              <p className="opacity-80">Make informed decisions with powerful data insights</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthenticationScreen;