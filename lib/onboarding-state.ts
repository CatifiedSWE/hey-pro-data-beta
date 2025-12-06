export type UserType = 'crew' | 'supplier' | 'existing' | 'client' | 'exploring';

export interface OnboardingState {
  currentStep: string;
  flow: UserType | null;
  history: string[]; // For back navigation
  formData: Record<string, any>;
  isSubmitting: boolean;
  error: string | null;
}

export interface StepConfig {
  id: string;
  type: 'hero' | 'question' | 'form' | 'success' | 'info' | 'summary' | 'upload' | 'share' | 'check_email';
  title?: string;
  subtitle?: string; // For supporting copy
  heading?: string; // For Hero
  subtext?: string; // For Hero
  options?: { label: string; value: string; next: string }[];
  fields?: FormField[];
  nextStep?: string; // Default next step
  buttonText?: string;
  progress?: number; // 0-100
  component?: string; // Custom component identifier if needed
  apiAction?: string; // 'submit' | 'check_email'
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'url' | 'file' | 'chips';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select or chips
  validation?: (value: any) => string | null;
}

export const FLOW_STEPS: Record<string, StepConfig> = {
  // Step 0: Landing
  landing: {
    id: 'landing',
    type: 'hero',
    heading: 'HEYPRODATA',
    title: 'How do you identify?',
    subtext: 'MENA’s crew infrastructure - showing who’s here, what they do and how to connect.',
    subtitle: 'HeyProData. For people who make things happen in film, media and events.',
    options: [
      { label: "I'm crew", value: 'crew', next: 'persona_selection' },
      { label: "I'm a supplier", value: 'supplier', next: 'persona_selection' },
      { label: "I'm an existing member", value: 'existing', next: 'persona_selection' },
      { label: "I want to submit a project", value: 'client', next: 'persona_selection' },
      { label: "Just exploring", value: 'exploring', next: 'persona_selection' }
    ]
  },

  // Persona Selection (Mandatory intermediary)
  persona_selection: {
    id: 'persona_selection',
    type: 'question',
    title: 'Hey, I’m HeyProData. Your space in production. Let’s put you on the map.',
    subtitle: 'Before we get into it, which one sounds like you today?',
    options: [
      { label: "I'm an existing member", value: 'existing', next: 'existing_start' },
      { label: "I'm new - I want to reserve my spot as crew/creative", value: 'crew', next: 'crew_intro' },
      { label: "I'm new - I want to apply as a supplier/vendor", value: 'supplier', next: 'supplier_intro' },
      { label: "I'm a client/agency - I need crew for my project", value: 'client', next: 'client_start' },
      { label: "Just exploring", value: 'exploring', next: 'exploring_start' }
    ]
  },

  // --- FLOW: EXISTING MEMBER ---
  existing_start: {
    id: 'existing_start',
    type: 'question',
    title: 'Nice. Existing member it is. What do you want to do right now?',
    options: [
      { label: 'Access activation link', value: 'activation', next: 'existing_email_check' },
      { label: 'Sign in to profile', value: 'signin', next: 'existing_signin' },
      { label: 'Check placement in the next onboarding batch', value: 'placement', next: 'existing_email_check' }
    ]
  },
  existing_email_check: {
    id: 'existing_email_check',
    type: 'form',
    title: 'What email did you use when you registered?',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true }
    ],
    buttonText: 'Continue',
    apiAction: 'check_email',
    nextStep: 'existing_result' // Dynamic based on API
  },
  existing_signin: {
    id: 'existing_signin',
    type: 'info',
    title: "Sure. I'll send you straight to sign-in.",
    buttonText: 'Go to sign-in',
    nextStep: 'REDIRECT_LOGIN' // Special action
  },
  existing_found: {
    id: 'existing_found',
    type: 'success',
    title: "Done. I’ve sent your activation link to your email. If you don’t see it in a few minutes, check spam or try another email.",
    buttonText: 'Back to Home',
    nextStep: 'landing'
  },
  existing_not_found: {
    id: 'existing_not_found',
    type: 'question',
    title: "I can’t see that email in the system. Want to try another email or join the next onboarding batch as a new member?",
    options: [
      { label: 'Try another email', value: 'retry', next: 'existing_email_check' },
      { label: 'Join as crew', value: 'join_crew', next: 'crew_intro' },
      { label: 'Join as supplier', value: 'join_supplier', next: 'supplier_intro' }
    ]
  },

  // --- FLOW: CREW ---
  crew_intro: {
    id: 'crew_intro',
    type: 'info',
    title: "Good. Let’s get your details in. This takes less than a minute.",
    buttonText: "Start",
    nextStep: 'crew_firstname',
    progress: 10
  },
  crew_firstname: {
    id: 'crew_firstname',
    type: 'form',
    title: "First name?",
    fields: [{ name: 'first_name', label: 'First name', type: 'text', required: true }],
    nextStep: 'crew_lastname',
    progress: 25
  },
  crew_lastname: {
    id: 'crew_lastname',
    type: 'form',
    title: "Surname?",
    fields: [{ name: 'last_name', label: 'Surname', type: 'text', required: true }],
    nextStep: 'crew_role',
    progress: 40
  },
  crew_role: {
    id: 'crew_role',
    type: 'form',
    title: "What’s your primary role in production?",
    fields: [
      { 
        name: 'role', 
        label: 'Role', 
        type: 'chips', 
        required: true,
        options: ['DOP', '1st AD', 'Sound Recordist', 'Camera', 'Grip']
      }
    ],
    nextStep: 'crew_country',
    progress: 55
  },
  crew_country: {
    id: 'crew_country',
    type: 'form',
    title: "Which country are you based in?",
    fields: [{ name: 'country', label: 'Country', type: 'text', required: true }], // Simplify as text for now or select
    nextStep: 'crew_link',
    progress: 70
  },
  crew_link: {
    id: 'crew_link',
    type: 'form',
    title: "Drop a link to your work. Website, reel, Linktree - whatever you use.",
    fields: [{ name: 'website', label: 'Link', type: 'url', required: false, placeholder: 'https://...' }],
    nextStep: 'crew_summary',
    progress: 85
  },
  crew_summary: {
    id: 'crew_summary',
    type: 'summary',
    title: "Here’s what I’ve got. All good?",
    buttonText: "Looks good",
    apiAction: 'submit',
    nextStep: 'crew_success',
    progress: 95
  },
  crew_success: {
    id: 'crew_success',
    type: 'success',
    title: "All set. You’re in the system. We’re onboarding in batches so things stay clean and organised - we’ll email you when your turn opens up.",
    options: [
      { label: 'Ask something else', value: 'ask', next: 'landing' }, // Loop back or to a help flow
      { label: 'Submit a project', value: 'project', next: 'client_start' },
      { label: 'Done for now', value: 'done', next: 'landing' },
      { label: 'Share HeyProData', value: 'share', next: 'share_universal' }
    ]
  },

  // --- FLOW: SUPPLIER ---
  supplier_intro: {
    id: 'supplier_intro',
    type: 'info',
    title: "Nice. Let’s add your company so people know how you provide for the industry.",
    buttonText: "Start",
    nextStep: 'supplier_company_name',
    progress: 10
  },
  supplier_company_name: {
    id: 'supplier_company_name',
    type: 'form',
    title: "Company name",
    fields: [{ name: 'company_name', label: 'Company name', type: 'text', required: true }],
    nextStep: 'supplier_service',
    progress: 20
  },
  supplier_service: {
    id: 'supplier_service',
    type: 'form',
    title: "Primary service",
    fields: [{ name: 'primary_service', label: 'Service', type: 'text', required: true }],
    nextStep: 'supplier_link',
    progress: 35
  },
  supplier_link: {
    id: 'supplier_link',
    type: 'form',
    title: "Company link",
    fields: [{ name: 'company_link', label: 'Link', type: 'url', required: false }],
    nextStep: 'supplier_trade_license',
    progress: 50
  },
  supplier_trade_license: {
    id: 'supplier_trade_license',
    type: 'upload',
    title: "Trade license upload",
    fields: [{ name: 'trade_license', label: 'Upload License', type: 'file', required: true }],
    nextStep: 'supplier_firstname',
    progress: 60
  },
  supplier_firstname: {
    id: 'supplier_firstname',
    type: 'form',
    title: "First name",
    fields: [{ name: 'first_name', label: 'First name', type: 'text', required: true }],
    nextStep: 'supplier_lastname',
    progress: 70
  },
  supplier_lastname: {
    id: 'supplier_lastname',
    type: 'form',
    title: "Surname",
    fields: [{ name: 'last_name', label: 'Surname', type: 'text', required: true }],
    nextStep: 'supplier_role',
    progress: 80
  },
  supplier_role: {
    id: 'supplier_role',
    type: 'form',
    title: "Role in company",
    fields: [{ name: 'role', label: 'Role', type: 'text', required: true }],
    nextStep: 'supplier_phone',
    progress: 90
  },
  supplier_phone: {
    id: 'supplier_phone',
    type: 'form',
    title: "Phone number",
    fields: [{ name: 'phone', label: 'Phone', type: 'tel', required: true }],
    nextStep: 'supplier_summary',
    progress: 95
  },
  supplier_summary: {
    id: 'supplier_summary',
    type: 'summary',
    title: "Here’s what I’ve got. All good?",
    buttonText: "Looks good",
    apiAction: 'submit',
    nextStep: 'supplier_success',
    progress: 98
  },
  supplier_success: {
    id: 'supplier_success',
    type: 'success',
    title: "Got it. You’re in the queue. We’re bringing suppliers in batch by batch so it stays tight and useful - we’ll email you when your batch opens.",
    options: [
        { label: 'Share HeyProData', value: 'share', next: 'share_universal' },
        { label: 'Done', value: 'done', next: 'landing' }
    ]
  },

  // --- FLOW: CLIENT (PROJECT) ---
  client_start: {
    id: 'client_start',
    type: 'info',
    title: "Amazing! Let’s get the basics down so we can share it with the right people.",
    subtitle: "Who do you need?",
    buttonText: "Start",
    nextStep: 'client_details',
    progress: 10
  },
  client_details: {
    id: 'client_details',
    type: 'form',
    title: "Tell me what you need: project, roles, dates, anything useful.",
    fields: [
      { name: 'project_details', label: 'Project Requirements', type: 'textarea', required: true },
    ],
    nextStep: 'client_contact',
    progress: 50
  },
  client_contact: {
    id: 'client_contact',
    type: 'form',
    title: "Your details so we can connect you.",
    fields: [
      { name: 'contact_name', label: 'Your Name', type: 'text', required: true },
      { name: 'company_name', label: 'Company (Optional)', type: 'text', required: false },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
    ],
    nextStep: 'client_summary',
    progress: 90
  },
  client_summary: {
    id: 'client_summary',
    type: 'summary',
    title: "Ready to submit?",
    buttonText: "Send Request",
    apiAction: 'submit',
    nextStep: 'client_success',
    progress: 100
  },
  client_success: {
    id: 'client_success',
    type: 'success',
    title: "Thanks. Your brief is in. We’ll share this with the network and you’ll hear from the right people directly.",
    buttonText: "Back to home",
    nextStep: 'landing'
  },

  // --- FLOW: EXPLORING ---
  exploring_start: {
    id: 'exploring_start',
    type: 'question',
    title: "Cool. Quick snapshot, then you can decide what to do next.",
    // We will render the "3 short overview blocks" as a custom component inside the card or just subtitle text if short.
    // The spec says "Show three short overview blocks". I'll put them in a custom component for this step.
    component: 'ExploringOverview', 
    options: [
      { label: 'How joining works', value: 'how_it_works', next: 'exploring_how' },
      { label: 'Submit a project', value: 'project', next: 'client_start' },
      { label: 'See what this is building toward', value: 'vision', next: 'exploring_vision' },
      { label: 'Share HeyProData', value: 'share', next: 'share_universal' }
    ]
  },
  exploring_how: {
    id: 'exploring_how',
    type: 'info',
    title: "How Joining Works",
    subtitle: "1. Create profile. 2. Get verified. 3. Connect.", // Simplified for JSON, will use full text in component
    component: 'HowItWorks',
    buttonText: "Got it",
    nextStep: 'exploring_start'
  },
  exploring_vision: {
    id: 'exploring_vision',
    type: 'question',
    title: "See what this is building toward",
    component: 'Vision',
    options: [
        { label: "Want to join now", value: 'join', next: 'persona_selection' },
        { label: "Just look around", value: 'look', next: 'landing' }
    ]
  },

  // --- SHARED ---
  share_universal: {
    id: 'share_universal',
    type: 'share',
    title: "Easy. Here’s a link you can share with anyone who works in production:",
    nextStep: 'landing' // Or back
  }
};
