'use client';

import React, { useState, useReducer } from 'react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { FLOW_STEPS, OnboardingState } from '@/lib/onboarding-state';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

// --- REDUCER ---
type Action =
  | { type: 'NEXT_STEP'; stepId: string; data?: any }
  | { type: 'BACK_STEP' }
  | { type: 'SET_SUBMITTING'; isLoading: boolean }
  | { type: 'ERROR'; message: string };

const initialState: OnboardingState = {
  currentStep: 'landing',
  flow: null,
  history: [],
  formData: {},
  isSubmitting: false,
  error: null,
};

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: action.stepId,
        formData: { ...state.formData, ...action.data },
        error: null,
      };
    case 'BACK_STEP':
      const newHistory = [...state.history];
      const prevStep = newHistory.pop();
      return {
        ...state,
        history: newHistory,
        currentStep: prevStep || 'landing',
        error: null,
      };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isLoading };
    case 'ERROR':
      return { ...state, error: action.message };
    default:
      return state;
  }
}

export default function OnboardingPage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleNext = (stepId: string, data?: any) => {
    dispatch({ type: 'NEXT_STEP', stepId, data });
  };

  const handleBack = () => {
    if (state.history.length === 0) return;
    dispatch({ type: 'BACK_STEP' });
  };

  const handleSubmit = async (currentStepData: any) => {
    dispatch({ type: 'SET_SUBMITTING', isLoading: true });
    
    // Merge final data
    const finalData = { ...state.formData, ...currentStepData };
    
    // Determine user type from flow or data
    let userType = 'crew'; // default
    if (finalData.landing === 'crew' || finalData.persona_selection === 'crew') userType = 'crew';
    else if (finalData.landing === 'supplier' || finalData.persona_selection === 'supplier') userType = 'supplier';
    else if (finalData.landing === 'client' || finalData.persona_selection === 'client') userType = 'client';
    
    try {
      const response = await fetch('/app/api/hpd/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_type: userType,
            submitted_fields: finalData,
            session_id: crypto.randomUUID()
        }),
      });

      if (!response.ok) throw new Error('Submission failed');
      
      const step = FLOW_STEPS[state.currentStep];
      if (step.nextStep) {
          handleNext(step.nextStep);
      }
    } catch (err) {
      console.error(err);
      dispatch({ type: 'ERROR', message: "Something glitched. Try again?" });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isLoading: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-lg relative">
         <AnimatePresence mode="wait">
            <motion.div
                key={state.currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                <OnboardingFlow
                    currentStepId={state.currentStep}
                    onNext={handleNext}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                    isLoading={state.isSubmitting}
                    historyLength={state.history.length}
                />
            </motion.div>
         </AnimatePresence>
      </div>
      
      {/* Background decoration or branding if needed */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-300 pointer-events-none">
        HeyProData Onboarding
      </div>
    </div>
  );
}
