import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/supabase';
import loginBgImage from '../assets/images/login-bg-1.png';

const AuthenticationScreen = ({ onAuthenticate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ['', '', '', '', '', '']
  });
  
  const [timer, setTimer] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

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
    if (timer > 0 && (otpSent || resetEmailSent)) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, otpSent, resetEmailSent]);

  // Handle successful authentication
  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        onAuthenticate();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authSuccess, onAuthenticate]);

  // Validate form before submission
  const validateForm = (isPasswordReset = false) => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Password validation (not required for password reset)
    if (!isPasswordReset && !formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle forgot password request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (validateForm(true)) {
      setIsLoading(true);
      try {
        // Get the current host URL dynamically to ensure it works in any environment
        const baseUrl = window.location.origin;
        
        // Using the correct Supabase method for password reset
        const { error } = await auth.resetPassword(
          formData.email, 
          { 
            redirectTo: `${baseUrl}/reset-password` 
          }
        );
  
        if (error) throw error;
        
        // Show success message and start timer
        setResetEmailSent(true);
        setTimer(60);
        setAuthError(null);
        
      } catch (error) {
        setAuthError(error.message || 'Failed to send password reset email');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    
    if (forgotPassword) {
      handleForgotPassword(e);
      return;
    }
    
    if (otpSent) {
      // Verify OTP
      const otpValue = formData.otp.join('');
      if (otpValue.length === 6) {
        setIsLoading(true);
        try {
          const { data, error } = await auth.verifyOTP(formData.email, otpValue);
          
          if (error) {
            throw error;
          }
          
          // If successful, set auth success state
          setAuthSuccess(true);
        } catch (error) {
          setAuthError(error.message || 'Failed to verify OTP');
        } finally {
          setIsLoading(false);
        }
      } else {
        setValidationErrors({ otp: 'Please enter a valid 6-digit OTP' });
      }
    } else {
      // Sign in directly without checking if user exists first
      if (validateForm()) {
        setIsLoading(true);
        
        try {
          // Sign in flow
          const { error } = await auth.signIn(formData.email, formData.password);
          
          if (error) {
              throw new Error("User doesn't exist. Please check with Admin.");
          } else {
            // If sign in was successful, set auth success
            setAuthSuccess(true);
          }
        } catch (error) {
          setAuthError(error.message || 'Authentication failed');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (timer === 0) {
      setIsLoading(true);
      try {
        const { error } = await auth.signInWithOtp({ 
          email: formData.email 
        });
        
        if (error) throw error;
        
        setTimer(60);
      } catch (error) {
        setAuthError(error.message || 'Failed to send OTP');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Resend password reset email
  const resendPasswordReset = async () => {
    if (timer === 0) {
      handleForgotPassword({ preventDefault: () => {} });
    }
  };

  // Go back to login form
  const handleBack = () => {
    if (forgotPassword) {
      setForgotPassword(false);
      setResetEmailSent(false);
    } else if (otpSent) {
      setOtpSent(false);
    }
    setAuthError(null);
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
      style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${loginBgImage})`  }}>
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h2>
              <p className="text-gray-600 text-center mb-4">You are being redirected to the dashboard</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1500 ease-out" style={{ width: '100%' }}></div>
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
            <div className="bg-gradient-to-br from-white/60 to-blue-50/60 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-blue-100/70 relative overflow-hidden">
              {/* Decorative gradient elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-400/20 to-blue-600/30 rounded-full blur-2xl"></div>
              
              {/* Logo and Header */}
              <div className="text-center relative z-10">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all duration-300">
                  <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C14.4853 15 16.5 12.9853 16.5 10.5C16.5 8.01472 14.4853 6 12 6C9.51472 6 7.5 8.01472 7.5 10.5C7.5 12.9853 9.51472 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.5 19C6.28565 17.7531 7.3845 16.7489 8.6837 16.0626C9.98291 15.3764 11.4391 15.0276 12.9161 15.0489C14.393 15.0702 15.8391 15.461 17.1149 16.1847C18.3907 16.9084 19.4527 17.9444 20.1929 19.2116" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <motion.h2 
                  className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {forgotPassword 
                    ? (resetEmailSent ? 'Check Your Email' : 'Reset Your Password') 
                    : otpSent 
                      ? 'Enter Verification Code' 
                      : 'Login to your account'
                  }
                </motion.h2>
                <motion.p 
                  className="mt-2 text-sm text-blue-100 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {forgotPassword
                    ? (resetEmailSent 
                      ? `We've sent password reset instructions to ${formData.email}`
                      : 'Enter your email address to receive password reset instructions')
                    : otpSent 
                      ? `We've sent a 6-digit code to ${formData.email}`
                      : 'Enter your credentials to access the Dairy Farm Management System'
                  }
                </motion.p>
              </div>

              <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
                {/* Show any auth errors */}
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{authError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {forgotPassword ? (
                    <motion.div 
                      key="forgot-password-form"
                      className="space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {!resetEmailSent ? (
                        <>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white drop-shadow-sm">
                              Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-blue-500" />
                              </div>
                              <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`block w-full pl-10 pr-3 py-3 border bg-blue-50/50 ${
                                  validationErrors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-blue-200'
                                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
                                placeholder="you@example.com"
                              />
                            </div>
                            {validationErrors.email && (
                              <p className="mt-1 text-sm text-red-300 font-medium">{validationErrors.email}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-sm">
                          <div className="flex justify-center mb-6">
                            <div className="rounded-full bg-blue-100 p-3">
                              <Mail size={24} className="text-blue-600" />
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">Check your email and click the link to reset your password.</p>
                          {timer > 0 ? (
                            <p className="text-gray-500">Resend email in {timer} seconds</p>
                          ) : (
                            <button 
                              type="button"
                              onClick={resendPasswordReset}
                              className="text-blue-600 font-medium hover:text-blue-500"
                            >
                              Resend reset instructions
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-8">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                          disabled={isLoading}
                        >
                          <ArrowLeft size={16} className="mr-1" />
                          Back to Login
                        </button>
                        {!resetEmailSent && (
                          <button
                            type="submit"
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </div>
                            ) : "Reset Password"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : otpSent ? (
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
                        <label htmlFor="otp" className="block text-sm font-medium text-white drop-shadow-sm mb-2">
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
                              className="block w-12 h-12 text-center text-xl font-semibold border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                            />
                          ))}
                        </div>
                        {validationErrors.otp && (
                          <p className="mt-2 text-sm text-red-300 font-medium">{validationErrors.otp}</p>
                        )}
                      </div>

                      {/* Timer and Resend */}
                      <div className="text-center text-sm">
                        <p className="text-blue-100 mb-2">Didn't receive the code?</p>
                        {timer > 0 ? (
                          <p className="text-blue-200">Resend code in {timer} seconds</p>
                        ) : (
                          <button 
                            type="button"
                            onClick={resendOtp}
                            className="text-blue-300 font-medium hover:text-white"
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
                          className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                          disabled={isLoading}
                        >
                          <ArrowLeft size={16} className="mr-1" />
                          Back
                        </button>
                        <button
                          type="submit"
                          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Verifying...
                            </div>
                          ) : "Verify & Login"}
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
                        <label htmlFor="email" className="block text-sm font-medium text-white drop-shadow-sm">
                          Email address
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-blue-500" />
                          </div>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`block w-full pl-10 pr-3 py-3 border bg-blue-50/50 ${
                              validationErrors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-blue-200'
                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
                            placeholder="you@example.com"
                          />
                        </div>
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-300 font-medium">{validationErrors.email}</p>
                        )}
                      </div>

                      {/* Password Input */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-white drop-shadow-sm">
                          Password
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-blue-500" />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`block w-full pl-10 pr-10 py-3 border bg-blue-50/50 ${
                              validationErrors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-blue-200'
                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
                            placeholder="••••••••"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-blue-400 hover:text-blue-600 focus:outline-none transition-colors"
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
                          <p className="mt-1 text-sm text-red-300 font-medium">{validationErrors.password}</p>
                        )}
                      </div>

                      {/* Remember me / Forgot password */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-blue-100">
                            Remember me
                          </label>
                        </div>

                        <div className="text-sm">
                          <button 
                            type="button" 
                            onClick={() => setForgotPassword(true)}
                            className="font-medium text-blue-300 hover:text-white transition-colors"
                          >
                            Forgot your password?
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/30"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Signing in...
                            </div>
                          ) : 'Sign in'}
                        </button>
                      </div>
                      
                      {/* Decorative element */}
                      <div className="absolute bottom-2 right-2 h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-xl"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
            Welcome to Your Dairy Farm Management System
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Modern solutions for efficient dairy farm operations. Manage your livestock, production, and analytics all in one place.
          </p>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-filter backdrop-blur-sm p-5 rounded-lg border border-blue-400/30 shadow-lg">
              <h3 className="font-bold text-xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
                Streamlined Operations
              </h3>
              <p className="text-blue-50">
                Track animal health, milk production, inventory and more
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-filter backdrop-blur-sm p-5 rounded-lg border border-blue-400/30 shadow-lg">
              <h3 className="font-bold text-xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
                Real-time Analytics
              </h3>
              <p className="text-blue-50">
                Make informed decisions with powerful data insights
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthenticationScreen;