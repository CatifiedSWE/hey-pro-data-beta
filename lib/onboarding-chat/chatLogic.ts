import { ChatState, Message, Option, Persona, FormData } from './types';
import { submitData, checkEmail } from './mockBackend';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const INITIAL_STATE: ChatState = {
  messages: [
    {
      id: 'init-1',
      type: 'bot',
      text: 'Hey, I’m HeyProData. Your space in production.',
      isIntro: true, // Triggers Dark Mode Intro
      delay: 500
    },
    {
      id: 'init-2',
      type: 'bot',
      text: 'Before we get into it, which one sounds like you today?',
      delay: 1500,
      options: [
        { label: 'I’m an existing member', value: 'EXISTING', icon: 'UserCheck' },
        { label: 'I’m new - I want to reserve my spot as crew/creative', value: 'CREW', icon: 'Clapperboard' },
        { label: 'I’m new - I want to apply as a supplier/vendor', value: 'SUPPLIER', icon: 'Truck' },
        { label: 'I’m a client/agency - I need crew for my project', value: 'CLIENT', icon: 'Briefcase' },
        { label: 'Just exploring', value: 'EXPLORING', icon: 'Compass' }
      ],
      inputType: 'options_only'
    }
  ],
  isTyping: true,
  currentFlow: 'NONE',
  step: 0,
  formData: {}
};

// Returns the next state based on the current flow, step, and user input
export const processNextStep = async (
  currentState: ChatState, 
  input: string | File | null,
  selectionValue?: string
): Promise<Partial<ChatState>> => {
  
  const { currentFlow, step, formData } = currentState;
  const nextFormData = { ...formData };
  
  let nextStep = step + 1;
  let nextMessages: Message[] = [];
  let newFlow = currentFlow;

  // --- INITIAL SELECTION ---
  if (currentFlow === 'NONE') {
    if (!selectionValue) {
        // Fallback for off-script text at start
        return {
            messages: [
                ...currentState.messages,
                { id: generateId(), type: 'user', text: input as string },
                { 
                    id: generateId(), 
                    type: 'bot', 
                    text: 'And just so I can help properly, which one fits you best right now?',
                    options: INITIAL_STATE.messages[1].options,
                    inputType: 'options_only'
                }
            ]
        };
    }

    newFlow = selectionValue as Persona;
    nextStep = 0; // Reset step for the new flow

    // Initial response based on selection
    switch (newFlow) {
      case 'EXISTING':
        nextMessages.push({
          id: generateId(),
          type: 'bot',
          text: 'Nice. Existing member it is. What do you want to do right now?',
          options: [
            { label: 'Access activation link', value: 'ACTIVATION', icon: 'Link' },
            { label: 'Sign in to profile', value: 'SIGNIN', icon: 'LogIn' },
            { label: 'Check placement in next batch', value: 'BATCH', icon: 'ListOrdered' }
          ],
          inputType: 'options_only'
        });
        break;
      case 'CREW':
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'Good. Let’s get your details in. This takes less than a minute.',
            isIntro: true // Intro style transition
        });
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'First name?',
            inputType: 'text',
            delay: 1000
        });
        break;
      case 'SUPPLIER':
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'Nice. Let’s add your company so people know how you provide for the industry.',
            isIntro: true
        });
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'What’s the Company name?',
            inputType: 'text',
            delay: 1000
        });
        break;
      case 'CLIENT':
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'Amazing! Let’s get the basics down so we can share it with the right people.',
            isIntro: true
        });
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'Who do you need? (Tell us about the project requirement)',
            inputType: 'textarea',
            delay: 1000
        });
        break;
      case 'EXPLORING':
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'Cool. Quick snapshot, then you can decide what to do next.',
            isIntro: true
        });
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'HeyProData connects people by making them visible, circulating info to the network, and letting people reach out to each other.',
            delay: 1000
        });
        nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'What would you like to see?',
            options: [
                { label: 'How joining works', value: 'HOW_JOIN', icon: 'HelpCircle' },
                { label: 'Submit a project', value: 'SUBMIT_PROJ', icon: 'Send' },
                { label: 'See what this is building toward', value: 'VISION', icon: 'Eye' }
            ],
            inputType: 'options_only',
            delay: 2000
        });
        break;
    }

    return {
      currentFlow: newFlow,
      step: nextStep,
      messages: [...currentState.messages, ...nextMessages]
    };
  }

  // --- EXISTING MEMBER FLOW (PHASE 1: Gated System with 2 Options) ---
  if (currentFlow === 'EXISTING') {
      if (step === 0) {
          // User selected which action they want - store it
          if (selectionValue === 'ACTIVATION') {
              nextFormData.action = 'ACTIVATION';
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "Got it. Enter your email and I'll send you a secure link to set your password.",
                  inputType: 'email'
              });
          } else if (selectionValue === 'SIGNIN') {
              nextFormData.action = 'SIGNIN';
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "Perfect. What's your email address?",
                  inputType: 'email'
              });
          } else if (selectionValue === 'BATCH') {
              nextFormData.action = 'BATCH';
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Enter your email to check your placement status.',
                  inputType: 'email'
              });
          }
      } else if (step === 1) {
          // Email received - check user status
          const email = input as string;
          nextFormData.email = email;
          const action = nextFormData.action;
          
          // Call check-user API
          const checkResponse = await fetch('/api/auth/check-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          
          const checkResult = await checkResponse.json();
          
          // --- ACTIVATION LINK PATH ---
          if (action === 'ACTIVATION') {
              if (!checkResult.exists) {
                  // User DOESN'T exist - route to waitlist
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: "You're not in the system yet. No worries - let me get your details and we'll review your application.",
                      isIntro: true
                  });
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'Which one sounds like you?',
                      options: [
                          { label: "I'm crew/creative", value: 'JOIN_CREW', icon: 'Clapperboard' },
                          { label: "I'm a supplier/vendor", value: 'JOIN_SUPPLIER', icon: 'Truck' },
                          { label: 'Try different email', value: 'RETRY', icon: 'RefreshCcw' }
                      ],
                      inputType: 'options_only',
                      delay: 1000
                  });
              } else if (checkResult.exists && checkResult.hasCompletedOnboarding) {
                  // User exists AND has completed onboarding - tell them to sign in
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: "It seems you already exist in our system and have completed onboarding. Please use the 'Sign in to profile' option instead.",
                      isIntro: true
                  });
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'What would you like to do?',
                      options: [
                          { label: 'Sign in to profile', value: 'SWITCH_TO_SIGNIN', icon: 'LogIn' },
                          { label: 'Try different email', value: 'RETRY', icon: 'Mail' },
                          { label: 'Done', value: 'DONE', icon: 'Check' }
                      ],
                      inputType: 'options_only',
                      delay: 1000
                  });
              } else if (checkResult.exists && !checkResult.hasCompletedOnboarding) {
                  // User exists but hasn't completed onboarding - send password setup link
                  const setupResponse = await fetch('/api/auth/send-password-setup-link', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                  });
                  
                  const setupResult = await setupResponse.json();
                  
                  if (setupResult.success) {
                      nextMessages.push({
                          id: generateId(),
                          type: 'bot',
                          text: "Great! We've sent a password setup link to your email.",
                          isIntro: true
                      });
                      nextMessages.push({
                          id: generateId(),
                          type: 'bot',
                          text: 'Check your inbox (and spam folder) and click the link to set your password.',
                          delay: 1000
                      });
                      nextMessages.push({
                          id: generateId(),
                          type: 'bot',
                          text: 'Need help?',
                          options: [
                              { label: 'Resend link', value: 'RESEND_SETUP', icon: 'RefreshCcw' },
                              { label: 'Try different email', value: 'RETRY', icon: 'Mail' },
                              { label: 'Done', value: 'DONE', icon: 'Check' }
                          ],
                          inputType: 'options_only',
                          delay: 2000
                      });
                  } else {
                      // Error sending link
                      nextMessages.push({
                          id: generateId(),
                          type: 'bot',
                          text: setupResult.error || "Sorry, there was an issue sending the password setup link. Please try again.",
                          isIntro: true
                      });
                      nextMessages.push({
                          id: generateId(),
                          type: 'bot',
                          text: 'What would you like to do?',
                          options: [
                              { label: 'Try again', value: 'RETRY', icon: 'RefreshCcw' },
                              { label: 'Done', value: 'DONE', icon: 'Check' }
                          ],
                          inputType: 'options_only',
                          delay: 1000
                      });
                  }
              }
          }
          
          // --- SIGN IN TO PROFILE PATH ---
          else if (action === 'SIGNIN') {
              if (!checkResult.exists) {
                  // User DOESN'T exist - route to waitlist
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: "You're not in the system yet. No worries - let me get your details and we'll review your application.",
                      isIntro: true
                  });
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'Which one sounds like you?',
                      options: [
                          { label: "I'm crew/creative", value: 'JOIN_CREW', icon: 'Clapperboard' },
                          { label: "I'm a supplier/vendor", value: 'JOIN_SUPPLIER', icon: 'Truck' },
                          { label: 'Try different email', value: 'RETRY', icon: 'RefreshCcw' }
                      ],
                      inputType: 'options_only',
                      delay: 1000
                  });
              } else if (checkResult.exists && !checkResult.hasCompletedOnboarding) {
                  // User exists but hasn't completed onboarding
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: "I can see you're in the system, but you haven't completed your onboarding yet. Please use the 'Access activation link' option to set up your password first.",
                      isIntro: true
                  });
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'What would you like to do?',
                      options: [
                          { label: 'Access activation link', value: 'SWITCH_TO_ACTIVATION', icon: 'Link' },
                          { label: 'Try different email', value: 'RETRY', icon: 'Mail' },
                          { label: 'Done', value: 'DONE', icon: 'Check' }
                      ],
                      inputType: 'options_only',
                      delay: 1000
                  });
              } else if (checkResult.exists && checkResult.hasCompletedOnboarding) {
                  // User exists AND has completed onboarding - ask for password
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'Welcome back! Please enter your password to continue.',
                      inputType: 'password'
                  });
              }
          }
          
          // --- BATCH CHECK PATH (keeping for now, but ignoring) ---
          else if (action === 'BATCH') {
              // This is ignored for now as per user request
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "This feature is coming soon. Please use one of the other options.",
                  isIntro: true
              });
          }
      } else if (step === 2) {
          const action = nextFormData.action;
          
          // Handle password input for SIGNIN flow
          if (action === 'SIGNIN' && !selectionValue) {
              const password = input as string;
              const email = nextFormData.email;
              
              // Verify password
              const verifyResponse = await fetch('/api/auth/verify-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
              });
              
              const verifyResult = await verifyResponse.json();
              
              if (verifyResult.success) {
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'Perfect! Signing you in...',
                      isIntro: true
                  });
                  
                  // Redirect to profile after a short delay
                  setTimeout(() => {
                      if (typeof window !== 'undefined') {
                          window.location.href = '/profile';
                      }
                  }, 1500);
              } else {
                  // Password incorrect - allow retry
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: verifyResult.error || 'Incorrect password. Please try again.',
                      isIntro: true
                  });
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'What would you like to do?',
                      options: [
                          { label: 'Try again', value: 'RETRY_PASSWORD', icon: 'RefreshCcw' },
                          { label: 'Try different email', value: 'RETRY_EMAIL', icon: 'Mail' },
                          { label: 'Done', value: 'DONE', icon: 'Check' }
                      ],
                      inputType: 'options_only',
                      delay: 1000
                  });
                  nextStep = 3; // Move to step 3 for retry handling
              }
              return {
                  formData: nextFormData,
                  step: nextStep,
                  messages: [...currentState.messages, ...nextMessages]
              };
          }
          
          if (selectionValue === 'RETRY') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Okay, let’s try another one. What is the email?',
                  inputType: 'email'
              });
              nextStep = 1; // Reset to step 1 so next input is treated as email
          } else if (selectionValue === 'SWITCH_TO_SIGNIN') {
              // User wants to switch to sign in
              nextFormData.action = 'SIGNIN';
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Welcome back! Please enter your password to continue.',
                  inputType: 'password'
              });
          } else if (selectionValue === 'SWITCH_TO_ACTIVATION') {
              // User wants to switch to activation
              nextFormData.action = 'ACTIVATION';
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "Got it. Enter your email and I'll send you a secure link to set your password.",
                  inputType: 'email'
              });
              nextStep = 1; // Go back to email input
          } else if (selectionValue === 'RESEND_SETUP') {
              // Resend password setup link
              const resendResponse = await fetch('/api/auth/send-password-setup-link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: nextFormData.email })
              });
              
              const resendResult = await resendResponse.json();
              
              if (resendResult.success) {
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: 'Setup link resent! Check your email.',
                      isIntro: true
                  });
              } else if (resendResult.alreadyOnboarded) {
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: "You've already completed onboarding. Please use the sign-in page instead.",
                      isIntro: true
                  });
              } else {
                  nextMessages.push({
                      id: generateId(),
                      type: 'bot',
                      text: resendResult.error || 'Failed to resend link. Please try again.',
                      isIntro: true
                  });
              }
              nextStep = step; // Stay on current step
          } else if (selectionValue === 'JOIN_CREW') {
              return {
                  currentFlow: 'CREW',
                  step: 0,
                  messages: [
                      ...currentState.messages,
                      { id: generateId(), type: 'bot', text: 'Good. Let’s get your details in. This takes less than a minute.', isIntro: true },
                      { id: generateId(), type: 'bot', text: 'First name?', inputType: 'text', delay: 1000 }
                  ]
              };
          } else if (selectionValue === 'JOIN_SUPPLIER') {
              return {
                  currentFlow: 'SUPPLIER',
                  step: 0,
                  messages: [
                      ...currentState.messages,
                      { id: generateId(), type: 'bot', text: 'Nice. Let’s add your company so people know how you provide for the industry.', isIntro: true },
                      { id: generateId(), type: 'bot', text: 'What’s the Company name?', inputType: 'text', delay: 1000 }
                  ]
              };
          } else if (selectionValue === 'DONE') {
              // End conversation
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'All set. See you soon!',
                  isIntro: true
              });
          }
      } else if (step === 3) {
          // Handle retry options after failed password attempt
          if (selectionValue === 'RETRY_PASSWORD') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Please enter your password to continue.',
                  inputType: 'password'
              });
              nextStep = 2; // Go back to password input
          } else if (selectionValue === 'RETRY_EMAIL') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'What is your email address?',
                  inputType: 'email'
              });
              nextStep = 1; // Go back to email input
          } else if (selectionValue === 'DONE') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'All set. See you soon!',
                  isIntro: true
              });
          }
      }
  }

  // --- CREW FLOW ---
  if (currentFlow === 'CREW') {
    // 0: Initial prompt already sent
    if (step === 0) {
        // Just received First Name
        nextFormData.firstName = input as string;
        nextMessages.push({ id: generateId(), type: 'bot', text: 'Surname?', inputType: 'text' });
    } else if (step === 1) {
        nextFormData.surname = input as string;
        nextMessages.push({ id: generateId(), type: 'bot', text: 'Primary role in production?', inputType: 'text' });
    } else if (step === 2) {
        nextFormData.role = input as string;
        nextMessages.push({ id: generateId(), type: 'bot', text: 'Country?', inputType: 'text' });
    } else if (step === 3) {
        nextFormData.country = input as string;
        nextMessages.push({ id: generateId(), type: 'bot', text: 'Work link / Portfolio? (Optional but encouraged)', inputType: 'url' });
    } else if (step === 4) {
        nextFormData.workLink = input as string;
        nextMessages.push({ id: generateId(), type: 'bot', text: 'And finally, your email?', inputType: 'email' });
    } else if (step === 5) {
        nextFormData.email = input as string;
        
        // Check if email exists (registered user)
        const emailCheckResult = await checkEmail(nextFormData.email);
        
        if (emailCheckResult.exists && emailCheckResult.isRegistered) {
            // Email is registered - show login prompt
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: `This email is already registered! Please login to access your profile.`,
                options: [
                    { label: 'Go to Login', value: 'GO_TO_LOGIN', icon: 'LogIn' },
                    { label: 'Try different email', value: 'RETRY_EMAIL', icon: 'Mail' }
                ],
                inputType: 'options_only'
            });
        } else {
            // Email is available - proceed to confirmation
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: `Please confirm:\n${nextFormData.firstName} ${nextFormData.surname}\n${nextFormData.role}\n${nextFormData.country}\n${nextFormData.email}`,
                options: [
                    { label: 'Looks good', value: 'SUBMIT', icon: 'Check' },
                    { label: 'Edit something', value: 'EDIT', icon: 'Edit2' }
                ],
                inputType: 'options_only'
            });
        }
    } else if (step === 6) {
        // Handle Confirmation or Email retry
        if (selectionValue === 'GO_TO_LOGIN') {
            // Instead of redirecting to login, prompt them to use "I am an existing user" flow
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: "To sign in, please refresh the page and select 'I'm an existing member' → 'Sign in to profile'.",
                isIntro: true
            });
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'Need help?',
                options: [
                    { label: 'Restart now', value: 'RESTART', icon: 'RotateCcw' }
                ],
                inputType: 'options_only',
                delay: 1000
            });
        } else if (selectionValue === 'RETRY_EMAIL') {
            // Go back to email input
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: "No problem. What's your email?",
                inputType: 'email'
            });
            nextStep = 5; // Go back to email step
        } else if (selectionValue === 'EDIT') {
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'To keep things simple, please refresh the page to start over with correct details.',
                options: [{ label: 'Restart', value: 'RESTART', icon: 'RotateCcw' }],
                inputType: 'options_only'
            });
        } else {
            // Default to SUBMIT behavior if 'Looks good' or undefined
            const result = await submitData('CREW', nextFormData);
            if (result.success) {
                nextMessages.push({
                    id: generateId(),
                    type: 'bot',
                    text: 'All set. You’re in the system.',
                    isIntro: true
                });
                nextMessages.push({
                    id: generateId(),
                    type: 'bot',
                    text: 'We’re onboarding in batches so things stay clean and organised - we’ll email you when your turn opens up.'
                });
                nextMessages.push({
                    id: generateId(),
                    type: 'bot',
                    text: 'Share HeyProData?',
                    options: [{ label: 'Share', value: 'SHARE', icon: 'Share2' }],
                    inputType: 'options_only',
                    delay: 1000
                });
            } else {
                 nextMessages.push({
                    id: generateId(),
                    type: 'bot',
                    text: 'Something glitched while saving this. Try once more? If it keeps happening, send us an email on support@heyprodata.com.'
                });
                nextStep = step; // Stay on submit step
            }
        }
    } else if (step === 7) {
         if (selectionValue === 'RESTART') {
             window.location.reload();
         } else {
             // Share flow
             nextMessages.push({
                 id: generateId(),
                 type: 'bot',
                 text: 'Easy. Here’s a link you can share with anyone who works in production:',
                 inputType: 'share_card'
             });
         }
    }
  }

  // --- SUPPLIER FLOW ---
  if (currentFlow === 'SUPPLIER') {
      if (step === 0) {
          nextFormData.companyName = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Primary service?', inputType: 'text' });
      } else if (step === 1) {
          nextFormData.primaryService = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Company website/link? (Optional)', inputType: 'url' });
      } else if (step === 2) {
          nextFormData.companyLink = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Please upload your Trade License.', inputType: 'file' });
      } else if (step === 3) {
          nextFormData.tradeLicense = input as File;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Got it. Now, who is the contact person? First Name?', inputType: 'text' });
      } else if (step === 4) {
          nextFormData.firstName = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Surname?', inputType: 'text' });
      } else if (step === 5) {
          nextFormData.surname = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Your role in the company?', inputType: 'text' });
      } else if (step === 6) {
          nextFormData.role = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Email address?', inputType: 'email' });
      } else if (step === 7) {
          nextFormData.email = input as string;
          
          // Check if email exists (registered user)
          const emailCheckResult = await checkEmail(nextFormData.email);
          
          if (emailCheckResult.exists && emailCheckResult.isRegistered) {
              // Email is registered - show login prompt
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: `This email is already registered! Please login to access your profile.`,
                  options: [
                      { label: 'Go to Login', value: 'GO_TO_LOGIN', icon: 'LogIn' },
                      { label: 'Try different email', value: 'RETRY_EMAIL', icon: 'Mail' }
                  ],
                  inputType: 'options_only'
              });
          } else {
              // Email is available - proceed to phone
              nextMessages.push({ id: generateId(), type: 'bot', text: 'Phone number?', inputType: 'phone' });
          }
      } else if (step === 8) {
          // Handle email retry or phone input
          if (selectionValue === 'GO_TO_LOGIN') {
              // Instead of redirecting to login, prompt them to use "I am an existing user" flow
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "To sign in, please refresh the page and select 'I'm an existing member' → 'Sign in to profile'.",
                  isIntro: true
              });
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Need help?',
                  options: [
                      { label: 'Restart now', value: 'RESTART', icon: 'RotateCcw' }
                  ],
                  inputType: 'options_only',
                  delay: 1000
              });
          } else if (selectionValue === 'RETRY_EMAIL') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "No problem. What's your email?",
                  inputType: 'email'
              });
              nextStep = 7; // Go back to email step
          } else {
              // Normal flow - phone input received
              nextFormData.phone = input as string;
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: `Summary:\n${nextFormData.companyName} (${nextFormData.primaryService})\nContact: ${nextFormData.firstName} ${nextFormData.surname}\n${nextFormData.email}`,
                  options: [
                    { label: 'Looks good', value: 'SUBMIT', icon: 'Check' },
                    { label: 'Edit something', value: 'EDIT', icon: 'Edit2' }
                  ],
                  inputType: 'options_only'
              });
          }
      } else if (step === 9) {
          if (selectionValue === 'EDIT') {
               nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'To keep things simple, please refresh the page to start over with correct details.',
                options: [{ label: 'Restart', value: 'RESTART', icon: 'RotateCcw' }],
                inputType: 'options_only'
               });
          } else {
            await submitData('SUPPLIER', nextFormData);
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'Got it. You’re in the queue.',
                isIntro: true
            });
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'We’re bringing suppliers in batch by batch so it stays tight and useful - we’ll email you when your batch opens.'
            });
             nextMessages.push({
                    id: generateId(),
                    type: 'bot',
                    text: 'Share HeyProData?',
                    options: [{ label: 'Share', value: 'SHARE', icon: 'Share2' }],
                    inputType: 'options_only',
                    delay: 1000
                });
          }
      } else if (step === 10) {
           if (selectionValue === 'RESTART') {
               window.location.reload();
           } else {
               nextMessages.push({
                 id: generateId(),
                 type: 'bot',
                 text: 'Easy. Here’s a link you can share with anyone who works in production:',
                 inputType: 'share_card'
             });
           }
      }
  }

  // --- CLIENT FLOW ---
  if (currentFlow === 'CLIENT') {
      if (step === 0) {
          nextFormData.projectDetails = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Your Name?', inputType: 'text' });
      } else if (step === 1) {
          nextFormData.firstName = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Company?', inputType: 'text' });
      } else if (step === 2) {
          nextFormData.projectCompanyName = input as string;
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Email?', inputType: 'email' });
      } else if (step === 3) {
          nextFormData.email = input as string;
          
          // Check if email exists (registered user)
          const emailCheckResult = await checkEmail(nextFormData.email);
          
          if (emailCheckResult.exists && emailCheckResult.isRegistered) {
              // Email is registered - show login prompt
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: `This email is already registered! Please login to access your profile.`,
                  options: [
                      { label: 'Go to Login', value: 'GO_TO_LOGIN', icon: 'LogIn' },
                      { label: 'Try different email', value: 'RETRY_EMAIL', icon: 'Mail' }
                  ],
                  inputType: 'options_only'
              });
          } else {
              // Email is available - proceed
              nextMessages.push({ id: generateId(), type: 'bot', text: 'Phone?', inputType: 'phone' });
          }
      } else if (step === 4) {
          // Handle email retry or phone input
          if (selectionValue === 'GO_TO_LOGIN') {
              // Instead of redirecting to login, prompt them to use "I am an existing user" flow
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "To sign in, please refresh the page and select 'I'm an existing member' → 'Sign in to profile'.",
                  isIntro: true
              });
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Need help?',
                  options: [
                      { label: 'Restart now', value: 'RESTART', icon: 'RotateCcw' }
                  ],
                  inputType: 'options_only',
                  delay: 1000
              });
          } else if (selectionValue === 'RETRY_EMAIL') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "No problem. What's your email?",
                  inputType: 'email'
              });
              nextStep = 3; // Go back to email step
          } else {
              // Normal flow - phone input received
              nextFormData.phone = input as string;
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Ready to submit?',
                  options: [
                    { label: 'Send Brief', value: 'SUBMIT', icon: 'Send' }
                  ],
                  inputType: 'options_only'
              });
          }
      } else if (step === 5) {
          await submitData('CLIENT', nextFormData);
          nextMessages.push({
              id: generateId(),
              type: 'bot',
              text: 'Thanks. Your brief is in.',
              isIntro: true
          });
           nextMessages.push({
              id: generateId(),
              type: 'bot',
              text: 'We’ll share this with the network and you’ll hear from the right people directly.'
          });
          nextMessages.push({
              id: generateId(),
              type: 'bot',
              text: 'Want a copy via email?',
              options: [{ label: 'Yes, please', value: 'SHARE', icon: 'Check' }, {label: 'No thanks', value: 'NO', icon: 'X'}],
              inputType: 'options_only'
          });
      } else if (step === 6) {
          // Just showing share link for all paths in this demo
          nextMessages.push({
              id: generateId(),
              type: 'bot',
              text: 'You can also just tell them: HeyProData. For people who make things happen in film, media and events.',
              options: [{ label: 'Share HeyProData', value: 'SHARE_LINK', icon: 'Share2' }],
              inputType: 'options_only'
          });
      }
      else if (step === 7 && selectionValue === 'SHARE_LINK') {
          nextMessages.push({
             id: generateId(),
             type: 'bot',
             text: 'Easy. Here’s a link you can share with anyone who works in production:',
             inputType: 'share_card'
         });
      }
  }
  
  // --- JUST EXPLORING ---
  if (currentFlow === 'EXPLORING') {
      if (step === 0) {
          // User selected an option from the menu
          if (selectionValue === 'HOW_JOIN') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'To join, you simply submit your profile as Crew or Supplier. We verify it, then add you to the active directory.'
              });
          } else if (selectionValue === 'SUBMIT_PROJ') {
              // Redirect to Client flow
              return {
                  currentFlow: 'CLIENT',
                  step: 0,
                  messages: [
                      ...currentState.messages,
                      { id: generateId(), type: 'bot', text: 'Amazing! Let’s get the basics down so we can share it with the right people.', isIntro: true},
                      { id: generateId(), type: 'bot', text: 'Who do you need? (Tell us about the project requirement)', inputType: 'textarea', delay: 500 }
                  ]
              };
          } else if (selectionValue === 'VISION') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: "We are building the infrastructure for MENA's production industry. A verified, transparent network."
              });
          }
          
          nextMessages.push({
            id: generateId(),
            type: 'bot',
            text: 'Share HeyProData?',
            options: [{ label: 'Share', value: 'SHARE', icon: 'Share2' }, {label: 'Back to start', value: 'RESTART', icon: 'RotateCcw'}],
            inputType: 'options_only',
            delay: 1500
          });
      } else if (step === 1) {
          if (selectionValue === 'RESTART') {
              window.location.reload(); // Simple restart
          } else if (selectionValue === 'SHARE') {
               nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'Easy. Here’s a link you can share with anyone who works in production:',
                inputType: 'share_card'
            });
          }
      }
  }

  return {
    formData: nextFormData,
    step: nextStep,
    messages: nextMessages.length > 0 ? [...currentState.messages, ...nextMessages] : currentState.messages
  };
};