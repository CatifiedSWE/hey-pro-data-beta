import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type SectionName = 'about' | 'skills' | 'credits' | 'languages' | 'contact_details' | 'available_to_travel';
type VisibilityMap = Record<SectionName, boolean>;

export function useSectionVisibility(userId?: string) {
  const [visibility, setVisibility] = useState<VisibilityMap>({
    about: true,
    skills: true,
    credits: true,
    languages: true,
    contact_details: true,
    available_to_travel: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisibility = useCallback(async () => {
    try {
      setLoading(true);
      const url = userId 
        ? `/api/profile/section-visibility?userId=${userId}`
        : '/api/profile/section-visibility';
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        setVisibility(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching section visibility:', err);
      setError(err.response?.data?.error || 'Failed to load visibility settings');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVisibility();
  }, [fetchVisibility]);

  const toggleVisibility = async (sectionName: SectionName) => {
    const newVisibility = !visibility[sectionName];
    
    // Optimistic update
    setVisibility(prev => ({
      ...prev,
      [sectionName]: newVisibility
    }));

    try {
      const response = await axios.patch('/api/profile/section-visibility', {
        section_name: sectionName,
        is_visible: newVisibility
      });

      if (response.data.success) {
        toast.success(`Section ${newVisibility ? 'shown' : 'hidden'} successfully`);
      } else {
        // Revert on error
        setVisibility(prev => ({
          ...prev,
          [sectionName]: !newVisibility
        }));
        toast.error('Failed to update visibility');
      }
    } catch (err: any) {
      console.error('Error updating visibility:', err);
      // Revert on error
      setVisibility(prev => ({
        ...prev,
        [sectionName]: !newVisibility
      }));
      toast.error(err.response?.data?.error || 'Failed to update visibility');
    }
  };

  return {
    visibility,
    loading,
    error,
    toggleVisibility,
    refetch: fetchVisibility
  };
}
