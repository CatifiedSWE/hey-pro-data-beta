'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import LocationAutocomplete from '@/components/LocationAutocomplete';

/**
 * Profile Creation Form page - As per AUTH_FLOW_TYPESCRIPT_GUIDE.md
 * Protected route for authenticated users without profiles
 */
export default function FormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    aliasFirstName: '',
    aliasSurname: '',
    country: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // On mount: Check authentication and profile
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        // Step 1: Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        setCurrentUser(session.user);
        
        // Step 2: Check if profile already exists
        const token = session.access_token;
        
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Profile already exists, redirect to slate
          router.push('/slate');
        }
        // Otherwise, show form
      } catch (error) {
        console.error('Form page auth check error:', error);
        router.push('/login');
      }
    };
    
    checkAuthAndProfile();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if form is valid (all required fields filled)
  const isFormValid = formData.firstName.trim() !== '' && 
                      formData.surname.trim() !== '' && 
                      formData.country !== '' && 
                      formData.city.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Get access token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        router.push('/login');
        return;
      }

      console.log('[Form] Submitting profile creation...');

      // Step 2: Submit to API
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          surname: formData.surname.trim(),
          alias_first_name: formData.aliasFirstName.trim() || null,
          alias_surname: formData.aliasSurname.trim() || null,
          country: formData.country,
          city: formData.city.trim()
        })
      });

      // Check if response is ok and has JSON content
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create profile');
        } else {
          setError(`Server error: ${response.status} ${response.statusText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Step 3: Handle response
      if (data.success) {
        console.log('[Form] Profile created successfully:', data);
        toast.success('Profile created successfully!');
        
        // Step 4: Refresh the session to ensure latest state
        console.log('[Form] Refreshing session...');
        await supabase.auth.refreshSession();
        
        // Step 5: Wait for database transaction to commit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 6: Verify profile exists before redirecting
        console.log('[Form] Verifying profile exists...');
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        const refreshedToken = refreshedSession?.access_token;
        
        if (refreshedToken) {
          const verifyResponse = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${refreshedToken}` }
          });
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success && verifyData.data) {
            console.log('[Form] Profile verified, redirecting to /slate');
            // Profile confirmed, safe to redirect
            router.push('/slate');
          } else {
            console.error('[Form] Profile verification failed:', verifyData);
            setError('Profile created but verification failed. Please refresh the page.');
            setLoading(false);
          }
        } else {
          console.error('[Form] No token after refresh');
          setError('Session error. Please try logging in again.');
          setLoading(false);
        }
      } else {
        console.error('[Form] Profile creation failed:', data);
        setError(data.error || 'Failed to create profile');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Form] Submission error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, #FA6E80 0deg, #6A89BE 144deg, #85AAB7 216deg, #31A7AC 360deg)'
        }}
      />

      {/* Form Container */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/logo/LogoIcon.svg"
            alt="HPD Logo" 
            width={80} 
            height={55}
            priority
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Legal Name Section */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Legal name</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FA6E80] text-black placeholder-gray-400 transition-colors"
              />
              <input
                type="text"
                placeholder="Surname"
                value={formData.surname}
                onChange={(e) => handleInputChange('surname', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FA6E80] text-black placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Alias Name Section */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">
              Alias name <span className="text-gray-500 font-normal text-sm">(optional)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Alias first name"
                value={formData.aliasFirstName}
                onChange={(e) => handleInputChange('aliasFirstName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FA6E80] text-black placeholder-gray-400 transition-colors"
              />
              <input
                type="text"
                placeholder="Alias surname"
                value={formData.aliasSurname}
                onChange={(e) => handleInputChange('aliasSurname', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FA6E80] text-black placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3">Location</h3>
            <div className="space-y-4">
              <LocationAutocomplete
                value={formData.country}
                onChange={(value) => handleInputChange('country', value)}
                placeholder="Country"
                type="country"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FA6E80] text-black placeholder-gray-400 transition-colors"
              />

              <LocationAutocomplete
                value={formData.city}
                onChange={(value) => handleInputChange('city', value)}
                placeholder="City"
                type="city"
                selectedCountry={formData.country}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FA6E80] text-black placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all transform hover:scale-[1.02] ${
              isFormValid && !loading
                ? 'bg-[#FA6E80] hover:bg-[#ff5a75] cursor-pointer shadow-lg' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {loading ? 'Creating profile...' : 'Create your profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
