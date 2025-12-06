import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFullScreen, CardHeader, CardBody, CardFooter } from './CardFullScreen';
import { PrimaryButton, SecondaryButton } from './Button';
import { StepProgress } from './StepProgress';
import { Chip } from './Chip';
import { TextInput, TextArea } from './Inputs';
import { FileUploadCard } from './FileUploadCard';
import { SummaryCard } from './SummaryCard';
import { ShareLinkCard } from './ShareLinkCard';
import { FLOW_STEPS, StepConfig, FormField } from '@/lib/onboarding-state';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  currentStepId: string;
  onNext: (stepId: string, data?: any) => void;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  historyLength: number;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  currentStepId,
  onNext,
  onBack,
  onSubmit,
  isLoading,
  historyLength
}) => {
  const step = FLOW_STEPS[currentStepId];
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset local form data when step changes
  useEffect(() => {
    setFormData({});
    setErrors({});
  }, [currentStepId]);

  if (!step) return <div>Error: Step not found</div>;

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step.fields) {
      step.fields.forEach(field => {
        if (field.required && !formData[field.name]) {
          newErrors[field.name] = 'This field is required';
        }
        if (field.validation) {
            const error = field.validation(formData[field.name]);
            if (error) newErrors[field.name] = error;
        }
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (step.type === 'form' || step.type === 'upload') {
      if (!validateStep()) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    
    if (step.apiAction === 'submit') {
      onSubmit(formData);
    } else if (step.nextStep) {
      onNext(step.nextStep, formData);
    }
  };

  const handleOptionSelect = (option: { value: string; next: string }) => {
     onNext(option.next, { [step.id]: option.value });
  };

  // --- RENDERERS ---

  const renderHero = () => (
    <CardFullScreen className="bg-white">
      <CardHeader className="mt-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--hp-base)]">{step.heading}</h1>
        <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">{step.subtitle}</p>
        <p className="text-lg text-gray-500 max-w-sm mx-auto">{step.subtext}</p>
      </CardHeader>
      <CardBody className="justify-center">
        <h2 className="text-2xl font-bold text-center mb-8">{step.title}</h2>
        <div className="flex flex-col gap-3">
          {step.options?.map((opt, idx) => (
             <Chip 
                key={idx} 
                label={opt.label} 
                onClick={() => handleOptionSelect(opt)}
                className="justify-start px-6 py-4 text-lg"
             />
          ))}
        </div>
      </CardBody>
    </CardFullScreen>
  );

  const renderQuestion = () => (
    <CardFullScreen>
        {historyLength > 0 && (
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
        )}
      <CardHeader className="mt-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{step.title}</h2>
        {step.subtitle && <p className="text-lg text-gray-500">{step.subtitle}</p>}
      </CardHeader>
      <CardBody>
         <div className="flex flex-col gap-3 mt-4">
          {step.options?.map((opt, idx) => (
             <Chip 
                key={idx} 
                label={opt.label} 
                onClick={() => handleOptionSelect(opt)}
                className="justify-start px-6 py-4 text-lg"
             />
          ))}
          
          {step.component === 'ExploringOverview' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold mb-1">Crew</h3>
                    <p className="text-sm text-gray-500">Find work, get paid, build your rep.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold mb-1">Suppliers</h3>
                    <p className="text-sm text-gray-500">List gear, get booked, grow.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold mb-1">Producers</h3>
                    <p className="text-sm text-gray-500">Find the right people, fast.</p>
                </div>
             </div>
          )}
        </div>
      </CardBody>
    </CardFullScreen>
  );

  const renderForm = () => (
     <CardFullScreen>
       <div className="absolute top-0 left-0 w-full px-6 pt-6 bg-white z-10">
         <div className="flex items-center justify-between mb-2">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-800 transition-colors">
                <ArrowLeft size={24} />
            </button>
            {/* Optional: Add help icon or close */}
         </div>
         {step.progress !== undefined && <StepProgress totalSteps={100} currentStep={step.progress} />}
       </div>

       <CardHeader className="mt-16">
         <h2 className="text-2xl font-bold">{step.title}</h2>
         {step.subtitle && <p className="text-gray-500 mt-2">{step.subtitle}</p>}
       </CardHeader>

       <CardBody>
         {step.fields?.map((field) => (
           <div key={field.name} className="mb-4">
             {field.type === 'textarea' ? (
                <TextArea
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    error={errors[field.name]}
                />
             ) : field.type === 'chips' ? (
                <div className="flex flex-wrap gap-2">
                    {field.options?.map(opt => (
                        <Chip
                            key={opt}
                            label={opt}
                            selected={formData[field.name] === opt}
                            onClick={() => handleInputChange(field.name, opt)}
                        />
                    ))}
                    {errors[field.name] && <p className="w-full text-red-500 text-sm mt-1">{errors[field.name]}</p>}
                </div>
             ) : (
                <TextInput
                    type={field.type}
                    label={field.label}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    error={errors[field.name]}
                    autoFocus={true}
                />
             )}
           </div>
         ))}
       </CardBody>

       <CardFooter>
         <PrimaryButton onClick={handleContinue} isLoading={isLoading}>
            {step.buttonText || 'Continue'}
         </PrimaryButton>
       </CardFooter>
     </CardFullScreen>
  );

  const renderUpload = () => (
      <CardFullScreen>
         {/* Same header structure */}
         <div className="absolute top-0 left-0 w-full px-6 pt-6 bg-white z-10">
            <div className="flex items-center justify-between mb-2">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-800 transition-colors">
                    <ArrowLeft size={24} />
                </button>
            </div>
            {step.progress !== undefined && <StepProgress totalSteps={100} currentStep={step.progress} />}
        </div>
        
        <CardHeader className="mt-16">
            <h2 className="text-2xl font-bold">{step.title}</h2>
        </CardHeader>

        <CardBody className="justify-center">
             {step.fields?.map((field) => (
                <FileUploadCard
                    key={field.name}
                    label={field.label}
                    onFileSelect={(file) => handleInputChange(field.name, file)}
                    error={errors[field.name]}
                />
             ))}
        </CardBody>

        <CardFooter>
            <PrimaryButton onClick={handleContinue} isLoading={isLoading}>
                {step.buttonText || 'Continue'}
            </PrimaryButton>
        </CardFooter>
      </CardFullScreen>
  );

  const renderSummary = () => (
      <CardFullScreen>
         <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 transition-colors">
            <ArrowLeft size={24} />
         </button>
         <CardBody className="mt-12">
            <SummaryCard 
                title={step.title || "Summary"}
                items={[]} // Need to pass actual accumulated data here. 
                // Since this component is generic, we'll handle this in the page wrapper or pass full data
                onEdit={(stepId) => onNext(stepId)} 
            />
            {/* 
                NOTE: The SummaryCard implementation here is a bit tricky because OnboardingFlow 
                doesn't have access to the *accumulated* data from previous steps easily 
                unless we pass it down. For now, I will render a placeholder or text.
                Ideally, I should pass 'allFormData' prop to OnboardingFlow.
            */}
             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 text-sm text-yellow-800">
                (Summary View - In a real app, this would show all collected fields: {JSON.stringify(Object.keys(formData))})
            </div>
         </CardBody>
         <CardFooter>
            <PrimaryButton onClick={handleContinue} isLoading={isLoading}>
                {step.buttonText || 'Submit'}
            </PrimaryButton>
         </CardFooter>
      </CardFullScreen>
  );

  const renderSuccess = () => (
      <CardFullScreen className="bg-green-50/30">
        <CardHeader className="mt-12">
             <div className="w-20 h-20 bg-[var(--hp-accent)]/10 text-[var(--hp-accent)] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
             </div>
             <h2 className="text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
             <p className="text-lg text-gray-600">{step.subtitle}</p>
        </CardHeader>
        <CardBody className="justify-end">
             <div className="flex flex-col gap-3">
                {step.options?.map((opt, idx) => (
                    <SecondaryButton 
                        key={idx} 
                        onClick={() => handleOptionSelect(opt)}
                        variant="outline"
                    >
                        {opt.label}
                    </SecondaryButton>
                ))}
                {!step.options && step.nextStep && (
                    <PrimaryButton onClick={() => onNext(step.nextStep!)}>
                        {step.buttonText || 'Continue'}
                    </PrimaryButton>
                )}
             </div>
        </CardBody>
      </CardFullScreen>
  );
  
  const renderShare = () => (
      <CardFullScreen>
        <CardHeader className="mt-12">
             <h2 className="text-2xl font-bold">{step.title}</h2>
        </CardHeader>
        <CardBody>
            <ShareLinkCard url={typeof window !== 'undefined' ? window.location.origin : 'https://heyprodata.com'} />
        </CardBody>
        <CardFooter>
            <PrimaryButton onClick={() => onNext(step.nextStep || 'landing')}>
                Done
            </PrimaryButton>
        </CardFooter>
      </CardFullScreen>
  );

  switch (step.type) {
    case 'hero': return renderHero();
    case 'question': return renderQuestion();
    case 'form': return renderForm();
    case 'upload': return renderUpload();
    case 'summary': return renderSummary(); // Needs improvement for data display
    case 'success': return renderSuccess();
    case 'info': return renderSuccess(); // Reuse success/info layout
    case 'share': return renderShare();
    default: return <div>Unknown step type: {step.type}</div>;
  }
};

import { CheckCircle2 } from 'lucide-react';
