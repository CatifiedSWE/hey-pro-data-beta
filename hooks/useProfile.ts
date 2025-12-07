import { useState, useEffect, useCallback } from 'react';
import apiCalling from '@/lib/apiCalling';
import { getAccessToken } from '@/lib/supabase/client';

export interface WorkIdentities {
  freelance: boolean;
  employee: {
    enabled: boolean;
    company: string;
    designation: string;
  };
  businessOwner: {
    enabled: boolean;
    designation: string;
    businessName: string;
    businessType: string;
  };
}

export interface ProfileData {
  user_id: string;
  first_name?: string;
  surname?: string;
  alias_first_name?: string;
  alias_surname?: string;
  profile_photo_url?: string;
  banner_url?: string; // Changed from banner_photo_url
  about?: string; // About section - separate from bio
  bio?: string; // Bio section - separate from about
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  portfolio_url?: string;
  imdb_url?: string;
  day_rate?: number;
  day_rate_currency?: string;
  work_identities?: WorkIdentities;
  visible_in_explore?: boolean;
  is_profile_complete?: boolean;
  profile_completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LinkData {
  id: string;
  user_id: string;
  label: string;
  url: string;
  sort_order: number;
}

export interface RecommendationData {
  id: string;
  user_id: string;
  recommender_name?: string;
  recommender_title?: string;
  recommender_photo_url?: string;
  recommendation_text?: string;
  created_at?: string;
}

export interface RoleData {
  id: string;
  user_id: string;
  role_name: string;
  sort_order: number;
  created_at?: string;
}

export interface VisaData {
  id?: string;
  user_id?: string;
  nationality?: string;
  passport_expiry_date?: string;
  visa_type?: string;
  visa_issued_by?: string;
  visa_expiry_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LanguageData {
  id: string;
  user_id: string;
  language_name: string;
  proficiency_level?: string;
  can_speak?: boolean;
  can_write?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface TravelCountryData {
  id: string;
  user_id: string;
  country_name: string;
  country_code: string;
  sort_order?: number;
  created_at?: string;
}

export interface HighlightData {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SkillData {
  id: string;
  user_id: string;
  skill_name: string;
  department?: string;
  role?: string;
  description?: string;
  proficiency_level?: string;
  experience_level?: string;
  day_rate?: number;
  day_rate_currency?: string;
  is_public?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface CreditData {
  id: string;
  user_id: string;
  credit_title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  sort_order?: number;
  production_type?: string;
  role?: string;
  project_title?: string;
  brand_client?: string;
  local_company?: string;
  international_company?: string;
  country?: string;
  release_year?: string;
  is_unreleased?: boolean;
  headline_stats?: string;
  awards?: Array<{ title: string; detail?: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilityData {
  id: string;
  user_id: string;
  availability_date: string;
  status: 'available' | 'hold' | 'na';
  created_at?: string;
}

/**
 * Calculate profile completion percentage locally (optimistic update)
 * Mirrors the backend calculation logic for immediate UI feedback
 * 
 * REFORMED Weighted Scoring System (Total: 100%):
 * - Basic Information (25%): first_name, surname, bio, country, city (5% each)
 * - Profile Photos (10%): profile_photo_url (5%), banner_url (5%)
 * - Contact Details (10%): email (5%), phone + country_code (5%)
 * - Professional Role (10%): At least 1 role = 10%
 * - Skills (10%): At least 1 skill = 10%
 * - Social Link (10%): At least 1 link = 10%
 * - Language (10%): At least 1 language = 10%
 * - Availability (10%): Availability status set = 10%
 * - Work History (5%): At least 1 credit = 5% (lowest priority)
 */
const calculateLocalCompletion = (
  profileData: ProfileData | null,
  rolesData: RoleData[],
  linksData: LinkData[],
  skillsData: SkillData[],
  creditsData: CreditData[],
  languagesData: LanguageData[]
): number => {
  let score = 0;

  if (!profileData) return 0;

  // === BASIC INFORMATION (25%) ===
  // 5% each for: first_name, surname, bio, country, city
  if (profileData.first_name && profileData.first_name.trim().length > 0) score += 5;
  if (profileData.surname && profileData.surname.trim().length > 0) score += 5;
  if (profileData.bio && profileData.bio.trim().length > 20) score += 5;
  if (profileData.country && profileData.country.trim().length > 0) score += 5;
  if (profileData.city && profileData.city.trim().length > 0) score += 5;

  // === PROFILE PHOTOS (10%) ===
  // 5% for profile photo, 5% for banner
  if (profileData.profile_photo_url) score += 5;
  if (profileData.banner_url) score += 5;

  // === CONTACT DETAILS (10%) ===
  // 5% for email, 5% for phone with country code
  if (profileData.email && profileData.email.trim().length > 0) score += 5;
  if (profileData.phone && profileData.phone.trim().length > 0 && profileData.country_code) score += 5;

  // === PROFESSIONAL ROLE (10%) ===
  // At least 1 role = 10% (full points)
  if (rolesData.length >= 1) score += 10;

  // === SKILLS (10%) ===
  // At least 1 skill = 10% (full points)
  if (skillsData.length >= 1) score += 10;

  // === SOCIAL LINK (10%) ===
  // At least 1 link = 10% (full points)
  if (linksData.length >= 1) score += 10;

  // === LANGUAGE (10%) ===
  // At least 1 language = 10% (full points)
  if (languagesData.length >= 1) score += 10;

  // === AVAILABILITY (10%) ===
  // Availability status set = 10% (full points)
  if (profileData.availability !== null && profileData.availability !== undefined) score += 10;

  // === WORK HISTORY/CREDITS (5%) ===
  // At least 1 credit = 5% (lowest priority, full points)
  if (creditsData.length >= 1) score += 5;

  return Math.min(score, 100);
};

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [visa, setVisa] = useState<VisaData | null>(null);
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [travelCountries, setTravelCountries] = useState<TravelCountryData[]>([]);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [credits, setCredits] = useState<CreditData[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCalling({
        method: 'get',
        route: '/profile'
      });

      if (response.status && response.data?.data) {
        setProfile(response.data.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError('Failed to fetch profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch links
  const fetchLinks = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/links'
      });

      if (response.status && response.data?.data) {
        setLinks(response.data.data);
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    }
  }, []);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/recommendations'
      });

      if (response.status && response.data?.data) {
        setRecommendations(response.data.data);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  }, []);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/roles'
      });

      if (response.status && response.data?.data) {
        setRoles(response.data.data);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, []);

  // Update profile (OPTIMIZED - with optimistic update and completion calculation)
  const updateProfile = useCallback(async (data: Partial<ProfileData>) => {
    // Store original profile for rollback
    const originalProfile = profile;
    
    try {
      // Optimistic update - update UI immediately
      if (profile) {
        const updatedProfile = { ...profile, ...data };
        
        // Calculate new completion percentage optimistically
        const newCompletion = calculateLocalCompletion(
          updatedProfile,
          roles,
          links,
          skills,
          credits,
          languages
        );
        
        setProfile({
          ...updatedProfile,
          profile_completion_percentage: newCompletion,
          is_profile_complete: newCompletion >= 100
        });
      }
      
      const response = await apiCalling({
        method: 'patch',
        route: '/profile',
        data
      });

      if (response.status && response.data?.data) {
        // Use server-calculated values (more accurate)
        setProfile(response.data.data);
        return { success: true, message: 'Profile updated successfully' };
      } else {
        // Rollback on failure
        setProfile(originalProfile);
        return { success: false, message: response.message || 'Failed to update profile' };
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      // Rollback on error
      setProfile(originalProfile);
      return { success: false, message: 'Failed to update profile' };
    }
  }, [profile, roles, links, skills, credits, languages]);

  // Add link (OPTIMIZED - with optimistic update and completion calculation)
  const addLink = useCallback(async (label: string, url: string, sort_order = 0) => {
    const originalLinks = links;
    const originalProfile = profile;
    
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/profile/links',
        data: { label, url, sort_order }
      });

      if (response.status && response.data?.data) {
        // Update with actual data from server
        const newLinks = [...links, response.data.data];
        setLinks(newLinks);
        
        // Update completion percentage optimistically
        if (profile) {
          const newCompletion = calculateLocalCompletion(
            profile,
            roles,
            newLinks,
            skills,
            credits,
            languages
          );
          setProfile({
            ...profile,
            profile_completion_percentage: newCompletion,
            is_profile_complete: newCompletion >= 100
          });
        }
        
        return { success: true, message: 'Link added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add link' };
      }
    } catch (err) {
      console.error('Error adding link:', err);
      setLinks(originalLinks);
      setProfile(originalProfile);
      return { success: false, message: 'Failed to add link' };
    }
  }, [links, profile, roles, skills, credits, languages]);

  // Update link (OPTIMIZED - with optimistic update)
  const updateLink = useCallback(async (id: string, label?: string, url?: string, sort_order?: number) => {
    const originalLinks = links;
    
    try {
      // Optimistic update
      setLinks(prevLinks => prevLinks.map(link => 
        link.id === id 
          ? { ...link, ...(label !== undefined && { label }), ...(url !== undefined && { url }), ...(sort_order !== undefined && { sort_order }) }
          : link
      ));
      
      const response = await apiCalling({
        method: 'post',
        route: '/profile/links',
        data: { id, label, url, sort_order }
      });

      if (response.status) {
        return { success: true, message: 'Link updated successfully' };
      } else {
        setLinks(originalLinks);
        return { success: false, message: response.message || 'Failed to update link' };
      }
    } catch (err) {
      console.error('Error updating link:', err);
      setLinks(originalLinks);
      return { success: false, message: 'Failed to update link' };
    }
  }, [links]);

  // Delete link (OPTIMIZED - with optimistic update)
  const deleteLink = useCallback(async (id: string) => {
    const originalLinks = links;
    
    try {
      // Optimistic update - remove immediately
      setLinks(prevLinks => prevLinks.filter(link => link.id !== id));
      
      const response = await apiCalling({
        method: 'delete',
        route: `/profile/links?id=${id}`
      });

      if (response.status) {
        return { success: true, message: 'Link deleted successfully' };
      } else {
        setLinks(originalLinks);
        return { success: false, message: response.message || 'Failed to delete link' };
      }
    } catch (err) {
      console.error('Error deleting link:', err);
      setLinks(originalLinks);
      return { success: false, message: 'Failed to delete link' };
    }
  }, [links]);

  // Add role (OPTIMIZED - with optimistic update)
  const addRole = useCallback(async (role_name: string, sort_order = 0) => {
    const originalRoles = roles;
    
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/profile/roles',
        data: { role_name, sort_order }
      });

      if (response.status && response.data?.data) {
        setRoles(prevRoles => [...prevRoles, response.data.data]);
        return { success: true, message: 'Role added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add role' };
      }
    } catch (err) {
      console.error('Error adding role:', err);
      setRoles(originalRoles);
      return { success: false, message: 'Failed to add role' };
    }
  }, [roles]);

  // Delete role (OPTIMIZED - with optimistic update)
  const deleteRole = useCallback(async (id: string) => {
    const originalRoles = roles;
    
    try {
      // Optimistic update
      setRoles(prevRoles => prevRoles.filter(role => role.id !== id));
      
      const response = await apiCalling({
        method: 'delete',
        route: `/profile/roles?id=${id}`
      });

      if (response.status) {
        return { success: true, message: 'Role deleted successfully' };
      } else {
        setRoles(originalRoles);
        return { success: false, message: response.message || 'Failed to delete role' };
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setRoles(originalRoles);
      return { success: false, message: 'Failed to delete role' };
    }
  }, [roles]);

  // ========== VISA METHODS ==========
  // Fetch visa
  const fetchVisa = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/visa'
      });

      if (response.status && response.data?.data) {
        setVisa(response.data.data);
      } else {
        setVisa(null);
      }
    } catch (err) {
      console.error('Error fetching visa:', err);
    }
  }, []);

  // Update visa (OPTIMIZED - with optimistic update)
  const updateVisa = useCallback(async (data: Partial<VisaData>) => {
    const originalVisa = visa;
    
    try {
      // Optimistic update
      setVisa(visa ? { ...visa, ...data } : data as VisaData);
      
      const response = await apiCalling({
        method: 'patch',
        route: '/profile/visa',
        data
      });

      if (response.status) {
        return { success: true, message: 'Visa information updated successfully' };
      } else {
        setVisa(originalVisa);
        return { success: false, message: response.message || 'Failed to update visa information' };
      }
    } catch (err) {
      console.error('Error updating visa:', err);
      setVisa(originalVisa);
      return { success: false, message: 'Failed to update visa information' };
    }
  }, [visa]);

  // ========== LANGUAGE METHODS ==========
  // Fetch languages
  const fetchLanguages = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/languages'
      });

      if (response.status && response.data?.data) {
        setLanguages(response.data.data);
      } else {
        setLanguages([]);
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
    }
  }, []);

  // Add language (OPTIMIZED - with optimistic update)
  const addLanguage = useCallback(async (language_name: string, can_speak = false, can_write = false, proficiency_level?: string, sort_order = 0) => {
    const originalLanguages = languages;
    
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/profile/languages',
        data: { language_name, can_speak, can_write, proficiency_level, sort_order }
      });

      if (response.status && response.data?.data) {
        setLanguages(prevLanguages => [...prevLanguages, response.data.data]);
        return { success: true, message: 'Language added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add language' };
      }
    } catch (err) {
      console.error('Error adding language:', err);
      setLanguages(originalLanguages);
      return { success: false, message: 'Failed to add language' };
    }
  }, [languages]);

  // Delete language (OPTIMIZED - with optimistic update)
  const deleteLanguage = useCallback(async (id: string) => {
    const originalLanguages = languages;
    
    try {
      // Optimistic update
      setLanguages(prevLanguages => prevLanguages.filter(lang => lang.id !== id));
      
      const response = await apiCalling({
        method: 'delete',
        route: `/profile/languages?id=${id}`
      });

      if (response.status) {
        return { success: true, message: 'Language deleted successfully' };
      } else {
        setLanguages(originalLanguages);
        return { success: false, message: response.message || 'Failed to delete language' };
      }
    } catch (err) {
      console.error('Error deleting language:', err);
      setLanguages(originalLanguages);
      return { success: false, message: 'Failed to delete language' };
    }
  }, [languages]);

  // ========== TRAVEL COUNTRY METHODS ==========
  // Fetch travel countries
  const fetchTravelCountries = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/travel-countries'
      });

      if (response.status && response.data?.data) {
        setTravelCountries(response.data.data);
      } else {
        setTravelCountries([]);
      }
    } catch (err) {
      console.error('Error fetching travel countries:', err);
    }
  }, []);

  // Add travel country (no auto-refetch - caller should refetch manually)
  const addTravelCountry = useCallback(async (country_name: string, country_code?: string, sort_order = 0) => {
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/profile/travel-countries',
        data: { country_name, country_code: country_code || country_name.substring(0, 2).toUpperCase(), sort_order }
      });

      if (response.status) {
        return { success: true, message: 'Travel country added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add travel country' };
      }
    } catch (err) {
      console.error('Error adding travel country:', err);
      return { success: false, message: 'Failed to add travel country' };
    }
  }, []);

  // Add travel countries in batch (no auto-refetch - caller should refetch manually)
  const addTravelCountriesBatch = useCallback(async (countries: Array<{ country_name: string; country_code: string }>) => {
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/profile/travel-countries',
        data: countries
      });

      if (response.status) {
        return { success: true, message: response.data?.message || 'Travel countries added successfully', data: response.data?.data };
      } else {
        return { success: false, message: response.message || 'Failed to add travel countries' };
      }
    } catch (err) {
      console.error('Error adding travel countries in batch:', err);
      return { success: false, message: 'Failed to add travel countries' };
    }
  }, []);

  // Delete travel country (no auto-refetch - caller should refetch manually)
  const deleteTravelCountry = useCallback(async (id: string) => {
    try {
      const response = await apiCalling({
        method: 'delete',
        route: `/profile/travel-countries?id=${id}`
      });

      if (response.status) {
        return { success: true, message: 'Travel country deleted successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to delete travel country' };
      }
    } catch (err) {
      console.error('Error deleting travel country:', err);
      return { success: false, message: 'Failed to delete travel country' };
    }
  }, []);

  // Delete travel countries in batch (no auto-refetch - caller should refetch manually)
  const deleteTravelCountriesBatch = useCallback(async (ids: string[]) => {
    try {
      const response = await apiCalling({
        method: 'delete',
        route: `/profile/travel-countries?ids=${ids.join(',')}`
      });

      if (response.status) {
        return { success: true, message: response.data?.message || 'Travel countries deleted successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to delete travel countries' };
      }
    } catch (err) {
      console.error('Error deleting travel countries in batch:', err);
      return { success: false, message: 'Failed to delete travel countries' };
    }
  }, []);

  // ========== HIGHLIGHT METHODS ==========
  // Fetch highlights
  const fetchHighlights = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/highlights'
      });

      if (response.status && response.data?.data) {
        setHighlights(response.data.data);
      } else {
        setHighlights([]);
      }
    } catch (err) {
      console.error('Error fetching highlights:', err);
    }
  }, []);

  // Add highlight (OPTIMIZED - with optimistic update)
  const addHighlight = useCallback(async (title: string, description: string, image_url?: string, sort_order = 0) => {
    const originalHighlights = highlights;
    
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/profile/highlights',
        data: { title, description, image_url, sort_order }
      });

      if (response.status && response.data?.data) {
        setHighlights(prevHighlights => [...prevHighlights, response.data.data]);
        return { success: true, message: 'Highlight added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add highlight' };
      }
    } catch (err) {
      console.error('Error adding highlight:', err);
      setHighlights(originalHighlights);
      return { success: false, message: 'Failed to add highlight' };
    }
  }, [highlights]);

  // Update highlight (OPTIMIZED - with optimistic update)
  const updateHighlight = useCallback(async (id: string, data: Partial<HighlightData>) => {
    const originalHighlights = highlights;
    
    try {
      // Optimistic update
      setHighlights(prevHighlights => prevHighlights.map(h => 
        h.id === id ? { ...h, ...data } : h
      ));
      
      const response = await apiCalling({
        method: 'patch',
        route: '/profile/highlights',
        data: { id, ...data }
      });

      if (response.status) {
        return { success: true, message: 'Highlight updated successfully' };
      } else {
        setHighlights(originalHighlights);
        return { success: false, message: response.message || 'Failed to update highlight' };
      }
    } catch (err) {
      console.error('Error updating highlight:', err);
      setHighlights(originalHighlights);
      return { success: false, message: 'Failed to update highlight' };
    }
  }, [highlights]);

  // Delete highlight (OPTIMIZED - with optimistic update)
  const deleteHighlight = useCallback(async (id: string) => {
    const originalHighlights = highlights;
    
    try {
      // Optimistic update
      setHighlights(prevHighlights => prevHighlights.filter(h => h.id !== id));
      
      const response = await apiCalling({
        method: 'delete',
        route: `/profile/highlights?id=${id}`
      });

      if (response.status) {
        return { success: true, message: 'Highlight deleted successfully' };
      } else {
        setHighlights(originalHighlights);
        return { success: false, message: response.message || 'Failed to delete highlight' };
      }
    } catch (err) {
      console.error('Error deleting highlight:', err);
      setHighlights(originalHighlights);
      return { success: false, message: 'Failed to delete highlight' };
    }
  }, [highlights]);

  // ========== SKILL METHODS ==========
  // Fetch skills
  const fetchSkills = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/skills'
      });

      if (response.status && response.data?.data) {
        setSkills(response.data.data);
      } else {
        setSkills([]);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  }, []);

  // Add skill (OPTIMIZED - with optimistic update)
  const addSkill = useCallback(async (data: Partial<SkillData>) => {
    const originalSkills = skills;
    
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/skills',
        data
      });

      if (response.status && response.data?.data) {
        setSkills(prevSkills => [...prevSkills, response.data.data]);
        return { success: true, message: 'Skill added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add skill' };
      }
    } catch (err) {
      console.error('Error adding skill:', err);
      setSkills(originalSkills);
      return { success: false, message: 'Failed to add skill' };
    }
  }, [skills]);

  // Update skill (OPTIMIZED - with optimistic update)
  const updateSkill = useCallback(async (id: string, data: Partial<SkillData>) => {
    const originalSkills = skills;
    
    try {
      // Optimistic update
      setSkills(prevSkills => prevSkills.map(skill => 
        skill.id === id ? { ...skill, ...data } : skill
      ));
      
      const response = await apiCalling({
        method: 'patch',
        route: `/skills/${id}`,
        data
      });

      if (response.status) {
        return { success: true, message: 'Skill updated successfully' };
      } else {
        setSkills(originalSkills);
        return { success: false, message: response.message || 'Failed to update skill' };
      }
    } catch (err) {
      console.error('Error updating skill:', err);
      setSkills(originalSkills);
      return { success: false, message: 'Failed to update skill' };
    }
  }, [skills]);

  // Delete skill (OPTIMIZED - with optimistic update)
  const deleteSkill = useCallback(async (id: string) => {
    const originalSkills = skills;
    
    try {
      // Optimistic update
      setSkills(prevSkills => prevSkills.filter(skill => skill.id !== id));
      
      const response = await apiCalling({
        method: 'delete',
        route: `/skills/${id}`
      });

      if (response.status) {
        return { success: true, message: 'Skill deleted successfully' };
      } else {
        setSkills(originalSkills);
        return { success: false, message: response.message || 'Failed to delete skill' };
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      setSkills(originalSkills);
      return { success: false, message: 'Failed to delete skill' };
    }
  }, [skills]);

  // Upload profile photo or banner (OPTIMIZED)
  const uploadPhoto = useCallback(async (file: File, type: 'profile' | 'banner') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Get the access token from Supabase session
      const token = await getAccessToken();
      
      if (!token) {
        return { success: false, message: 'Not authenticated. Please log in again.' };
      }

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        // Optimistic update - update profile state immediately
        if (profile) {
          if (type === 'profile') {
            setProfile({ ...profile, profile_photo_url: data.data.url });
          } else {
            setProfile({ ...profile, banner_url: data.data.url });
          }
        }
        return { success: true, url: data.data.url };
      } else {
        return { success: false, message: data.error || 'Failed to upload photo' };
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      return { success: false, message: 'Failed to upload photo' };
    }
  }, [profile]);

  // ========== CREDITS METHODS ==========
  // Fetch credits (use if you need to refresh only credits)
  const fetchCredits = useCallback(async () => {
    try {
      const response = await apiCalling({
        method: 'get',
        route: '/profile/credits'
      });

      if (response.status && response.data?.data) {
        setCredits(response.data.data);
      } else {
        setCredits([]);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  }, []);

  // ========== AVAILABILITY METHODS ==========
  // Fetch availability for a specific month
  const fetchAvailability = useCallback(async (month?: string) => {
    try {
      const url = month ? `/availability?month=${month}` : '/availability';
      const response = await apiCalling({
        method: 'get',
        route: url
      });

      if (response.status && response.data?.data) {
        setAvailability(response.data.data);
      } else {
        setAvailability([]);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  }, []);

  // Update availability for a specific date
  const updateAvailability = useCallback(async (availability_date: string, status: 'available' | 'hold' | 'na') => {
    try {
      const response = await apiCalling({
        method: 'post',
        route: '/availability',
        data: { availability_date, status }
      });

      if (response.status && response.data?.data) {
        // Update local state optimistically
        setAvailability(prev => {
          const exists = prev.find(a => a.availability_date === availability_date);
          if (exists) {
            return prev.map(a => a.availability_date === availability_date ? response.data.data : a);
          } else {
            return [...prev, response.data.data];
          }
        });
        return { success: true, message: 'Availability updated successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to update availability' };
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      return { success: false, message: 'Failed to update availability' };
    }
  }, []);

  // Fetch complete profile data (OPTIMIZED - single API call instead of 11)
  const fetchCompleteProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCalling({
        method: 'get',
        route: '/profile/complete'
      });

      if (response.status && response.data?.data) {
        const data = response.data.data;
        
        // Update all state from single response
        setProfile(data.profile || null);
        setLinks(data.links || []);
        setRecommendations(data.recommendations || []);
        setRoles(data.roles || []);
        setVisa(data.visa || null);
        setLanguages(data.languages || []);
        setTravelCountries(data.travelCountries || []);
        setHighlights(data.highlights || []);
        setSkills(data.skills || []);
        setCredits(data.credits || []);
        setAvailability(data.availability || []);
      } else {
        setError(response.message || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Failed to fetch complete profile');
      console.error('Error fetching complete profile:', err);
    } finally {
      setLoading(false);
    }
  }, []); // FIXED: Empty dependency array - function is stable

  // Initial load - NOW USING SINGLE AGGREGATED ENDPOINT
  // Reduces 11 API calls to 1 call (91% reduction)
  useEffect(() => {
    fetchCompleteProfile();
  }, []); // FIXED: Empty dependency array since fetchCompleteProfile is stable

  // Auto-recalculate profile completion for existing users
  // This ensures old users get the new calculation on profile load
  useEffect(() => {
    if (!profile || loading) return;
    
    // Calculate what the completion SHOULD be with new logic
    const calculatedCompletion = calculateLocalCompletion(
      profile,
      roles,
      links,
      skills,
      credits,
      languages
    );
    
    // If stored completion differs from calculated, update it in the background
    const storedCompletion = profile.profile_completion_percentage || 0;
    const difference = Math.abs(calculatedCompletion - storedCompletion);
    
    // Only recalculate if there's a significant difference (>1% to avoid rounding issues)
    if (difference > 1) {
      console.log(`[Profile Completion] Auto-recalculating for user (stored: ${storedCompletion}%, calculated: ${calculatedCompletion}%)`);
      
      // Update in background without blocking UI
      apiCalling({
        method: 'post',
        route: '/profile/recalculate-completion'
      }).then((response) => {
        if (response.status && response.data?.data) {
          // Update local state with new completion
          setProfile(prev => prev ? {
            ...prev,
            profile_completion_percentage: response.data.data.completionPercentage,
            is_profile_complete: response.data.data.isComplete
          } : null);
        }
      }).catch((err) => {
        console.error('[Profile Completion] Failed to recalculate:', err);
      });
    }
  }, [profile, roles, links, skills, credits, languages, loading]);

  return {
    // Profile data
    profile,
    links,
    recommendations,
    roles,
    visa,
    languages,
    travelCountries,
    highlights,
    skills,
    credits,
    availability,
    loading,
    error,
    
    // Profile methods
    updateProfile,
    refetch: fetchCompleteProfile, // OPTIMIZED - now refetches complete profile in 1 call
    fetchCompleteProfile, // New optimized method
    
    // Link methods
    addLink,
    updateLink,
    deleteLink,
    fetchLinks,
    
    // Recommendation methods
    fetchRecommendations,
    
    // Role methods
    addRole,
    deleteRole,
    
    // Visa methods
    fetchVisa,
    updateVisa,
    
    // Language methods
    fetchLanguages,
    addLanguage,
    deleteLanguage,
    
    // Travel country methods
    fetchTravelCountries,
    addTravelCountry,
    addTravelCountriesBatch,
    deleteTravelCountry,
    deleteTravelCountriesBatch,
    
    // Highlight methods
    fetchHighlights,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    
    // Skill methods
    fetchSkills,
    addSkill,
    updateSkill,
    deleteSkill,
    
    // Credits methods
    fetchCredits,
    
    // Availability methods
    fetchAvailability,
    updateAvailability,
    
    // Upload methods
    uploadPhoto,
  };
};
