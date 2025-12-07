import ExplorePage from "@/components/modules/pages/explore-page";
import axios from "axios";
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchProfiles(searchParams: any) {
  try {
    // Build query string with random sorting by default
    const params = new URLSearchParams();
    
    // Add random seed based on session/time to get different results each load
    const randomSeed = Math.random().toString(36).substring(7);
    params.append('seed', randomSeed);
    params.append('page', '1');
    params.append('limit', '20');
    
    // Add any existing search params
    if (searchParams.keyword) params.append('keyword', searchParams.keyword as string);
    if (searchParams.role) params.append('role', searchParams.role as string);
    if (searchParams.location) params.append('location', searchParams.location as string);
    if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy as string);
    if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder as string);

    // Fetch from API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/explore?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch profiles:', response.statusText);
      return { profiles: [], pagination: { currentPage: 1, totalPages: 0, totalProfiles: 0, hasNextPage: false } };
    }

    const data = await response.json();
    return data.data || { profiles: [], pagination: { currentPage: 1, totalPages: 0, totalProfiles: 0, hasNextPage: false } };
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return { profiles: [], pagination: { currentPage: 1, totalPages: 0, totalProfiles: 0, hasNextPage: false } };
  }
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const initialData = await fetchProfiles(resolvedSearchParams);
  
  return (
    <div className="w-full">
      <ExplorePage 
        searchParams={resolvedSearchParams}
        initialProfiles={initialData.profiles}
        initialPagination={initialData.pagination}
      />
    </div>
  );
}
