'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // CRITICAL: Initialize session from recovery tokens BEFORE showing any UI
    const initializeRecoverySession = async () => {
      try {
        console.log('[Set Password] Checking for recovery tokens in URL...');
        
        // Extract tokens from URL hash (Supabase redirect format)
        // URL format: https://heyprodata.com/set-password#access_token=xxx&refresh_token=yyy&type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('[Set Password] Hash parameters:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type: type
        });

        // CRITICAL: Check if this is a valid recovery flow
        if (type !== 'recovery') {
          console.error('[Set Password] Invalid token type. Expected "recovery", got:', type);
          setValidToken(false);
          setError('Invalid or expired link. Please request a new password setup link.');
          setSessionInitialized(true);
          return;
        }

        // CRITICAL: Both tokens must be present for recovery
        if (!accessToken || !refreshToken) {
          console.error('[Set Password] Missing tokens in recovery URL');
          setValidToken(false);
          setError('Invalid or expired link. Please request a new password setup link.');
          setSessionInitialized(true);
          return;
        }

        // CRITICAL: Set the session using recovery tokens BEFORE proceeding
        console.log('[Set Password] Setting session with recovery tokens...');
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('[Set Password] Failed to set session:', sessionError);
          setValidToken(false);
          setError('Invalid or expired link. Please request a new password setup link.');
          setSessionInitialized(true);
          return;
        }

        if (!data.session) {
          console.error('[Set Password] Session not established despite no error');
          setValidToken(false);
          setError('Invalid or expired link. Please request a new password setup link.');
          setSessionInitialized(true);
          return;
        }

        console.log('[Set Password] ✅ Recovery session established successfully');
        console.log('[Set Password] User ID:', data.session.user.id);
        console.log('[Set Password] Session expires at:', new Date(data.session.expires_at! * 1000).toISOString());
        
        setValidToken(true);
        setSessionInitialized(true);

      } catch (err) {
        console.error('[Set Password] Exception during session initialization:', err);
        setValidToken(false);
        setError('An error occurred. Please request a new password setup link.');
        setSessionInitialized(true);
      }
    };

    initializeRecoverySession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*[0-9])/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Verify session is still valid before updating password
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please request a new password setup link.');
      }

      console.log('[Set Password] Updating password for user:', session.user.id);

      // Update the user's password
      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      if (!userData?.user) {
        throw new Error('Failed to update password. Please try again.');
      }

      console.log('[Set Password] ✅ Password updated successfully');

      // Mark onboarding as complete in user_profiles table
      console.log('[Set Password] Marking onboarding as complete for user:', userData.user.id);
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true })
        .eq('user_id', userData.user.id);

      if (profileError) {
        console.error('[Set Password] Failed to update onboarding status:', profileError);
        // Don't fail the whole operation if this fails
      } else {
        console.log('[Set Password] ✅ Onboarding marked as complete');
      }

      setSuccess(true);
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (err: any) {
      console.error('[Set Password] Error:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking token
  if (validToken === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-['Outfit']">
        <div className="w-16 h-16 border-8 border-slate-200 border-t-[#ff5168] rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold">Verifying link...</p>
      </div>
    );
  }

  // Invalid token state
  if (validToken === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-['Outfit']">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-2 border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertCircle className="text-red-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center mb-4 text-slate-800">Invalid Link</h1>
          <p className="text-center text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full bg-[#ff5168] text-white font-black text-lg py-4 rounded-2xl shadow-[0_5px_0_0_#d64154] hover:bg-[#e63e54] active:shadow-none active:translate-y-[5px] transition-all"
          >
            Back to Onboarding
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-['Outfit']">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-2 border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center mb-4 text-slate-800">Password Set!</h1>
          <p className="text-center text-slate-600 mb-6">Your password has been set successfully. Redirecting to your profile...</p>
          <div className="w-16 h-16 border-8 border-slate-200 border-t-[#25c9d0] rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Password setup form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-['Outfit']">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-2 border-slate-200">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#ff5168]/10 rounded-2xl flex items-center justify-center">
            <Lock className="text-[#ff5168]" size={32} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center mb-2 text-slate-800">Set Your Password</h1>
        <p className="text-center text-slate-500 mb-8 font-medium">Create a secure password for your account</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-lg font-semibold border-2 border-slate-200 rounded-xl focus:border-[#25c9d0] focus:bg-white bg-slate-50 outline-none transition-all text-slate-800"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-lg font-semibold border-2 border-slate-200 rounded-xl focus:border-[#25c9d0] focus:bg-white bg-slate-50 outline-none transition-all text-slate-800"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-bold text-slate-600 mb-2">PASSWORD REQUIREMENTS:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className={password.length >= 8 ? 'text-green-500' : 'text-slate-400'}>●</span>
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <span className={/(?=.*[a-z])/.test(password) ? 'text-green-500' : 'text-slate-400'}>●</span>
                One lowercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={/(?=.*[A-Z])/.test(password) ? 'text-green-500' : 'text-slate-400'}>●</span>
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={/(?=.*[0-9])/.test(password) ? 'text-green-500' : 'text-slate-400'}>●</span>
                One number
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-600 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-wider uppercase transition-all flex items-center justify-center gap-3 ${
              loading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#ff5168] text-white shadow-[0_5px_0_0_#d64154] hover:bg-[#e63e54] hover:shadow-[0_4px_0_0_#d64154] active:shadow-none active:translate-y-[5px]'
            }`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-400 rounded-full animate-spin"></div>
            ) : (
              'SET PASSWORD'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
