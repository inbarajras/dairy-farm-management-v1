import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { auth } from '../lib/supabase';

const ResetPasswordPage = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get the token from URL
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      accessToken: params.get('access_token'),
      refreshToken: params.get('refresh_token'),
      type: params.get('type')
    };
  };
  
  const { accessToken, refreshToken, type } = getUrlParams();

  useEffect(() => {
    // Check if the tokens are present
    if (!accessToken && !refreshToken) {
      setError('Invalid password reset link. Please request a new one.');
      return;
    }
    
    // If we have tokens, set the session
    if (accessToken && refreshToken && type === 'recovery') {
      auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  }, [accessToken, refreshToken, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords
    if (!newPassword) {
      return setError('Please enter a new password');
    }
    
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await auth.updatePassword(newPassword);
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/'; // Redirect to home
        if (onComplete) onComplete(); // Call onComplete if provided
      }, 3000);
      
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md px-6 py-8">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {success ? 'Password Reset Successful!' : 'Reset Your Password'}
            </h2>
            {!success && (
              <p className="mt-2 text-gray-600">
                Please enter a new password for your account
              </p>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-md">
              <p className="text-sm text-green-700">
                Your password has been reset successfully! You will be redirected to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting Password...
                      </div>
                    ) : 'Reset Password'}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={handleBackToLogin}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;