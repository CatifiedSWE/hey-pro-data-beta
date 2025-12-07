import { FormData, Persona } from './types';

export const submitData = async (userType: Persona, formData: FormData): Promise<{
  success: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}> => {
  try {
    const response = await fetch('/api/hpd/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_type: userType.toLowerCase(),
        submitted_fields: formData,
        session_id: crypto.randomUUID()
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // If user is authenticated and completed onboarding, redirect to profile
      if (data.isAuthenticated && data.onboardingComplete) {
        // Small delay to let user see success message, then redirect
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/profile';
          }
        }, 2000);
      }
      
      return {
        success: true,
        isAuthenticated: data.isAuthenticated || false,
        onboardingComplete: data.onboardingComplete || false
      };
    }
    
    return { success: false, isAuthenticated: false, onboardingComplete: false };
  } catch (error) {
    console.error('Submit error:', error);
    return { success: false, isAuthenticated: false, onboardingComplete: false };
  }
};

export const checkEmail = async (email: string): Promise<{ 
  exists: boolean;
  isRegistered: boolean;
  hasCompletedOnboarding: boolean;
  message?: string;
}> => {
  try {
    const response = await fetch('/api/hpd/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        exists: data.exists || false,
        isRegistered: data.isRegistered || false,
        hasCompletedOnboarding: data.hasCompletedOnboarding || false,
        message: data.message
      };
    }
    return { exists: false, isRegistered: false, hasCompletedOnboarding: false };
  } catch (error) {
    console.error('Check email error:', error);
    return { exists: false, isRegistered: false, hasCompletedOnboarding: false };
  }
};