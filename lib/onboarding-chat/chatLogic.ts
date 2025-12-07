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

  // --- EXISTING MEMBER FLOW ---
  if (currentFlow === 'EXISTING') {
      // Logic for existing member handling (Simplified for demo to prompt email)
      if (step === 0) {
          nextMessages.push({
              id: generateId(),
              type: 'bot',
              text: 'Enter your email address to proceed.',
              inputType: 'email'
          });
      } else if (step === 1) {
          const email = input as string;
          nextFormData.email = email;
          const { exists } = await checkEmail(email);
          
          if (exists) {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'We found you. Check your email for a secure access link.',
                  isIntro: true
              });
          } else {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'We couldn’t find that email. Try another or join as new?',
                  options: [
                      { label: 'Try another email', value: 'RETRY', icon: 'RefreshCcw' },
                      { label: 'Join as Crew', value: 'JOIN_CREW', icon: 'Clapperboard' },
                      { label: 'Join as Supplier', value: 'JOIN_SUPPLIER', icon: 'Truck' }
                  ],
                  inputType: 'options_only'
              });
          }
      } else if (step === 2) {
          if (selectionValue === 'RETRY') {
              nextMessages.push({
                  id: generateId(),
                  type: 'bot',
                  text: 'Okay, let’s try another one. What is the email?',
                  inputType: 'email'
              });
              nextStep = 1; // Reset to step 1 so next input is treated as email
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
        // Handle Confirmation
        if (selectionValue === 'EDIT') {
            nextMessages.push({
                id: generateId(),
                type: 'bot',
                text: 'To keep things simple, please refresh the page to start over with correct details.',
                options: [{ label: 'Restart', value: 'RESTART', icon: 'RotateCcw' }],
                inputType: 'options_only'
            });
        } else {
            // Default to SUBMIT behavior if 'Looks good' or undefined
            const success = await submitData('CREW', nextFormData);
            if (success) {
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
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Phone number?', inputType: 'phone' });
      } else if (step === 7) {
          nextFormData.phone = input as string;
          nextMessages.push({
              id: generateId(),
              type: 'bot',
              text: `Summary:\n${nextFormData.companyName} (${nextFormData.primaryService})\nContact: ${nextFormData.firstName} ${nextFormData.surname}`,
              options: [
                { label: 'Looks good', value: 'SUBMIT', icon: 'Check' },
                { label: 'Edit something', value: 'EDIT', icon: 'Edit2' }
              ],
              inputType: 'options_only'
          });
      } else if (step === 8) {
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
      } else if (step === 9) {
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
          nextMessages.push({ id: generateId(), type: 'bot', text: 'Phone?', inputType: 'phone' });
      } else if (step === 4) {
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
                  text: 'We are building the infrastructure for MENA\'s production industry. A verified, transparent network.'
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