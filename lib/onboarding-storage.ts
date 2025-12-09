/**
 * Local Storage Manager for Onboarding
 * Manages form data persistence across browser sessions for waitlist submissions
 */

// Container types for different user categories
export type CrewContainer = {
  category: 'crew';
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  country: string;
  website?: string;
};

export type VendorContainer = {
  category: 'vendor';
  company_name: string;
  primary_service: string;
  company_link?: string;
  trade_license_url?: string; // Public URL after upload
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  email: string;
};

export type AgencyContainer = {
  category: 'agency';
  contact_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  project_details: string;
};

export type OnboardingContainer = CrewContainer | VendorContainer | AgencyContainer;

/**
 * Local Storage Manager Class
 * Provides methods to save, load, and clear onboarding data
 */
export class OnboardingStorage {
  private static STORAGE_KEY = 'heyprodata_onboarding';

  /**
   * Save data to localStorage
   * Merges with existing data
   */
  static save(data: Partial<OnboardingContainer>): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.load();
      const merged = { ...existing, ...data };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      console.log('[OnboardingStorage] Data saved:', merged);
    } catch (error) {
      console.error('[OnboardingStorage] Error saving data:', error);
    }
  }

  /**
   * Load data from localStorage
   */
  static load(): Partial<OnboardingContainer> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[OnboardingStorage] Error loading data:', error);
      return {};
    }
  }

  /**
   * Clear all onboarding data from localStorage
   */
  static clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[OnboardingStorage] Data cleared');
    } catch (error) {
      console.error('[OnboardingStorage] Error clearing data:', error);
    }
  }

  /**
   * Get the category of the current onboarding flow
   */
  static getCategory(): 'crew' | 'vendor' | 'agency' | null {
    const data = this.load();
    return (data as any).category || null;
  }

  /**
   * Check if there's any data in localStorage
   */
  static hasData(): boolean {
    const data = this.load();
    return Object.keys(data).length > 0;
  }

  /**
   * Get all data as a specific type
   */
  static getAsType<T extends OnboardingContainer>(): Partial<T> {
    return this.load() as Partial<T>;
  }
}
