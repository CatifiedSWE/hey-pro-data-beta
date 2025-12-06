import { FormData, Persona } from './types';

export const submitData = async (userType: Persona, formData: FormData): Promise<boolean> => {
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

    return response.ok;
  } catch (error) {
    console.error('Submit error:', error);
    return false;
  }
};

export const checkEmail = async (email: string): Promise<{ exists: boolean }> => {
  try {
    const response = await fetch('/api/hpd/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      return { exists: data.exists };
    }
    return { exists: false };
  } catch (error) {
    console.error('Check email error:', error);
    return { exists: false };
  }
};