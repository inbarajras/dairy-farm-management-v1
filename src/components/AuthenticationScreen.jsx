import React, { useState, useEffect } from 'react';
import { User, Key, Lock, Eye, EyeOff } from 'lucide-react';

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
        alert(`${isLogin ? 'Login' : 'Registration'} successful!`);
        onAuthenticate();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-600 flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {otpSent ? 'Enter Verification Code' : (isLogin ? 'Sign in to your account' : 'Create a new account')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {otpSent 
              ? `We've sent a 6-digit code to ${formData.email}`
              : (isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Fill out the form below to get started')}
          </p>
        </div>

        {/* Main Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {otpSent ? (
            <div className="space-y-6">
              {/* OTP Input Group */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  One-Time Verification Code
                </label>
                <div className="flex justify-between items-center gap-2">
                  {formData.otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="block w-12 h-12 text-center text-xl font-semibold border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
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
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Verify & Sign In
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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
                      validationErrors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    placeholder="you@example.com"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* Full Name Input (Registration only) */}
              {!isLogin && (
                <div>
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
                        validationErrors.fullName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="John Doe"
                    />
                  </div>
                  {validationErrors.fullName && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.fullName}</p>
                  )}
                </div>
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
                      validationErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
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
                  <p className="mt-2 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Input (Registration only) */}
              {!isLogin && (
                <div>
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
                        validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="••••••••"
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>
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
                    <a href="#" className="font-medium text-green-600 hover:text-green-500">
                      Forgot your password?
                    </a>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {isLogin ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </div>
          )}

          {/* Toggle Login/Register */}
          {!otpSent && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="ml-1 font-medium text-green-600 hover:text-green-500"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthenticationScreen;