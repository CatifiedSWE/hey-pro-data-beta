export type Persona = 
  | 'EXISTING'
  | 'CREW'
  | 'SUPPLIER'
  | 'CLIENT'
  | 'EXPLORING'
  | 'NONE';

export type MessageType = 'bot' | 'user';

export type InputType = 
  | 'text'
  | 'email'
  | 'password'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'file'
  | 'options_only'
  | 'share_card';

export interface Option {
  label: string;
  value: string;
  icon?: string;
  description?: string;
  action?: () => void;
}

export interface Message {
  id: string;
  type: MessageType;
  text: string;
  options?: Option[]; 
  inputType?: InputType; 
  isFileUpload?: boolean;
  delay?: number; 
  isIntro?: boolean;
}

export interface OnboardingFormData {
  firstName?: string;
  surname?: string;
  role?: string;
  country?: string;
  workLink?: string;
  email?: string;
  companyName?: string;
  primaryService?: string;
  companyLink?: string;
  tradeLicense?: File | null;
  tradeLicenseUrl?: string;
  phone?: string;
  projectDetails?: string;
  projectCompanyName?: string;
  contact_name?: string;
  action?: string;
  website?: string;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  currentFlow: Persona;
  step: number;
  formData: OnboardingFormData;
}