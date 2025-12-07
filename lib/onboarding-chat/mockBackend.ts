import { OnboardingFormData, Persona } from './types';
import { OnboardingStorage } from '../onboarding-storage';
import { submitToN8n } from '../n8n-webhooks';

export const submitData = async (userType: Persona, formData: OnboardingFormData): Promise<{
  success: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
}> => {
  try {
    // Load data from localStorage (accumulated throughout the flow)
    const storedData = OnboardingStorage.load();
    
    // Merge with formData (formData takes precedence)
    const completeData = { ...storedData, ...formData };
    
    console.log('[Submit] Submitting data for:', userType, completeData);

    // Map Persona to category for webhooks
    const categoryMap: Partial<Record<Persona, 'crew' | 'vendor' | 'agency'>> = {
      'CREW': 'crew',
      'SUPPLIER': 'vendor',
      'CLIENT': 'agency',
      'EXISTING': 'crew', // fallback
      'EXPLORING': 'crew', // fallback
      'NONE': 'crew' // fallback
    };
    
    const category = categoryMap[userType] || 'crew';
    
    // Step 1: Submit to n8n webhook (Phase 2 - New)
    const webhookResult = await submitToN8n(category, completeData);
    
    if (!webhookResult.success) {
      console.error('[Submit] Webhook submission failed:', webhookResult.error);
      // Continue anyway - don't block submission
    }

    // Step 2: Submit to original API (existing functionality)
    const response = await fetch('/api/hpd/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_type: userType.toLowerCase(),
        submitted_fields: completeData,
        session_id: crypto.randomUUID()
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Step 3: Send confirmation email (Phase 2 - New)
      if (completeData.email) {
        const userName = completeData.firstName || completeData.companyName || completeData.contact_name || 'there';
        
        try {
          const emailResponse = await fetch('/api/onboarding/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: completeData.email,
              category,
              name: userName
            })
          });
          
          const emailResult = await emailResponse.json();
          console.log('[Submit] Confirmation email:', emailResult.success ? 'sent' : 'failed');
        } catch (emailError) {
          console.error('[Submit] Email sending failed:', emailError);
          // Don't block submission on email failure
        }
      }
      
      // Step 4: Clear localStorage after successful submission
      OnboardingStorage.clear();
      console.log('[Submit] Submission complete, localStorage cleared');
      
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