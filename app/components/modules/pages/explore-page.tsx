"use client";
import { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectCard from "@/components/modules/common/projectCard";
import ViewProfileModal from "@/components/modules/common/ViewProfileModal";
import { ProjectCardType } from "@/types";
import { ArrowUpDown, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

interface ExplorePageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
  initialProfiles?: (ProjectCardType & { userId?: string })[];
  initialPagination?: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
  };
  projectsCardData?: (ProjectCardType & { userId?: string })[];
}

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest';

export default function ExplorePage({
  searchParams,
  initialProfiles = [],
  initialPagination = { currentPage: 1, totalPages: 0, totalProfiles: 0, hasNextPage: false },
  projectsCardData,
}: ExplorePageProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<(ProjectCardType & { userId?: string })[]>(
    projectsCardData || initialProfiles
  );
  const [page, setPage] = useState(initialPagination.currentPage);
  const [hasNextPage, setHasNextPage] = useState(initialPagination.hasNextPage);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Intersection Observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Load more profiles when scrolling to bottom
  const loadMoreProfiles = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', (page + 1).toString());
      params.append('limit', '20');
      
      // Apply current sorting
      if (sortBy === 'name-asc') {
        params.append('sortBy', 'alias_first_name');
        params.append('sortOrder', 'asc');
      } else if (sortBy === 'name-desc') {
        params.append('sortBy', 'alias_first_name');
        params.append('sortOrder', 'desc');
      } else if (sortBy === 'newest') {
        params.append('sortBy', 'created_at');
        params.append('sortOrder', 'desc');
      } else if (sortBy === 'oldest') {
        params.append('sortBy', 'created_at');
        params.append('sortOrder', 'asc');
      }

      // Add search params
      if (searchParams?.keyword) params.append('keyword', searchParams.keyword as string);
      if (searchParams?.role) params.append('role', searchParams.role as string);
      if (searchParams?.location) params.append('location', searchParams.location as string);

      const response = await axios.get(`/api/explore?${params.toString()}`);
      
      if (response.data.success) {
        const newProfiles = response.data.data.profiles;
        setProfiles(prev => [...prev, ...newProfiles]);
        setPage(response.data.data.pagination.currentPage);
        setHasNextPage(response.data.data.pagination.hasNextPage);
      }
    } catch (error) {
      console.error('Error loading more profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasNextPage, isLoading, sortBy, searchParams]);

  // Trigger load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      loadMoreProfiles();
    }
  }, [inView, hasNextPage, isLoading, loadMoreProfiles]);

  // Handle sort change - refetch all profiles with new sorting
  const handleSortChange = async (newSort: SortOption) => {
    setSortBy(newSort);
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '20');
      
      // Apply new sorting
      if (newSort === 'name-asc') {
        params.append('sortBy', 'alias_first_name');
        params.append('sortOrder', 'asc');
      } else if (newSort === 'name-desc') {
        params.append('sortBy', 'alias_first_name');
        params.append('sortOrder', 'desc');
      } else if (newSort === 'newest') {
        params.append('sortBy', 'created_at');
        params.append('sortOrder', 'desc');
      } else if (newSort === 'oldest') {
        params.append('sortBy', 'created_at');
        params.append('sortOrder', 'asc');
      }

      // Add search params
      if (searchParams?.keyword) params.append('keyword', searchParams.keyword as string);
      if (searchParams?.role) params.append('role', searchParams.role as string);
      if (searchParams?.location) params.append('location', searchParams.location as string);

      const response = await axios.get(`/api/explore?${params.toString()}`);
      
      if (response.data.success) {
        setProfiles(response.data.data.profiles);
        setPage(response.data.data.pagination.currentPage);
        setHasNextPage(response.data.data.pagination.hasNextPage);
      }
    } catch (error) {
      console.error('Error sorting profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset when search params change
  useEffect(() => {
    setProfiles(initialProfiles);
    setPage(initialPagination.currentPage);
    setHasNextPage(initialPagination.hasNextPage);
  }, [searchParams?.keyword, searchParams?.role, searchParams?.location]);

  const handleProfileClick = (userId: string | undefined) => {
    if (userId) {
      setSelectedUserId(userId);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };
  
  return (
    <>
      <div className="w-full flex flex-col items-center gap-4">
        {/* Sorting Controls - Above profile grid */}
        <div className="w-full max-w-[615px] flex justify-end items-center gap-2 px-2 md:px-0 mb-2">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4" />
            Sort by:
          </span>
          <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
            <SelectTrigger className="w-[180px] bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Select sorting" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="newest" className="cursor-pointer hover:bg-gray-100">Newest First</SelectItem>
              <SelectItem value="oldest" className="cursor-pointer hover:bg-gray-100">Oldest First</SelectItem>
              <SelectItem value="name-asc" className="cursor-pointer hover:bg-gray-100">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc" className="cursor-pointer hover:bg-gray-100">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-[10px] p-2 md:p-0 max-w-[615px] w-full justify-items-stretch auto-rows-max">
          {profiles.length > 0 ? (
            profiles.map((project) => (
              <ProjectCard 
                key={project.id || project.name} 
                {...project} 
                onClick={() => handleProfileClick(project.userId)}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 mt-10">
              <p>No profiles found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Loading indicator for infinite scroll */}
        {hasNextPage && (
          <div ref={ref} className="w-full flex justify-center py-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more profiles...</span>
              </div>
            ) : (
              <div className="h-8" /> // Invisible trigger element
            )}
          </div>
        )}

        {/* End of results message */}
        {!hasNextPage && profiles.length > 0 && (
          <div className="w-full text-center py-8 text-sm text-gray-500">
            You've reached the end of the crew directory
          </div>
        )}
      </div>

      {/* Profile View Modal */}
      <ViewProfileModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userId={selectedUserId}
      />
    </>
  );
}
