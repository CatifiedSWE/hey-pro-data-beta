"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import ProjectCard from "@/components/modules/common/projectCard";
import { ProjectCardType } from "@/types";
import axiosInstance from "@/lib/axios";

interface ExplorePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ExplorePage({ searchParams }: ExplorePageProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProjectCardType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build query params from searchParams
  const buildQueryParams = useCallback((pageNum: number) => {
    const params = new URLSearchParams();
    params.append('page', pageNum.toString());
    params.append('limit', '20');
    
    // Add all search filters
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        params.append(key, value);
      }
    });
    
    return params.toString();
  }, [searchParams]);

  // Fetch profiles from API
  const fetchProfiles = useCallback(async (pageNum: number, append: boolean = true) => {
    try {
      setLoading(true);
      const queryString = buildQueryParams(pageNum);
      const response = await axiosInstance.get(`/explore?${queryString}`);
      
      if (response.data.success) {
        const newProfiles = response.data.data.profiles.map((profile: any) => ({
          id: profile.id,
          userId: profile.userId,
          name: profile.name || profile.displayName,
          banner: profile.banner || '',
          image: profile.avatar || '',
          bio: profile.bio || '',
          location: profile.location || 'Not specified',
          skills: profile.roles || []
        }));

        if (append) {
          setProfiles(prev => [...prev, ...newProfiles]);
        } else {
          setProfiles(newProfiles);
        }

        // Check if there are more profiles to load
        const pagination = response.data.data.pagination;
        setHasMore(pagination.hasNextPage);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [buildQueryParams]);

  // Load initial data
  useEffect(() => {
    setProfiles([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchProfiles(1, false);
  }, [searchParams, fetchProfiles]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    if (initialLoading || !hasMore || loading) return;

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const firstEntry = entries[0];
      if (firstEntry.isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProfiles(nextPage, true);
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [page, hasMore, loading, initialLoading, fetchProfiles]);

  const handleCardClick = (project: ProjectCardType) => {
    if (!project.userId) return;
    router.push(`/profile/${project.userId}`);
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {profiles.length > 0 ? (
          profiles.map((project, index) => (
            <ProjectCard 
              key={`${project.id}-${index}`}
              {...project} 
              onClick={() => handleCardClick(project)}
            />
          ))
        ) : initialLoading ? (
          <div className="col-span-full text-center text-gray-500 mt-10">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="ml-3">Loading profiles...</p>
            </div>
          </div>
        ) : (
          <div className="col-span-full text-center text-gray-500 mt-10">
            <p>No crew members found. Try adjusting your search filters.</p>
          </div>
        )}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && profiles.length > 0 && (
        <div 
          ref={loadMoreRef} 
          className="w-full flex justify-center py-8"
        >
          {loading && (
            <div className="flex items-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="ml-3">Loading more profiles...</p>
            </div>
          )}
        </div>
      )}

      {/* End of results message */}
      {!hasMore && profiles.length > 0 && (
        <div className="w-full text-center py-8 text-gray-500">
          <p>You've reached the end of the crew list</p>
        </div>
      )}
    </div>
  );
}
