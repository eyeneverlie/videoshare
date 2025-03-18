import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoCard from "./VideoCard";
import { Video } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoGridProps {
  category?: string;
  searchQuery?: string;
}

export default function VideoGrid({ category, searchQuery }: VideoGridProps) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const videosPerPage = 8;

  // Build query string
  const queryString = new URLSearchParams();
  if (category && category !== "All") {
    queryString.append("category", category);
  }
  if (searchQuery) {
    queryString.append("search", searchQuery);
  }
  
  const apiUrl = `/api/videos${queryString.toString() ? `?${queryString.toString()}` : ''}`;

  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: [apiUrl],
  });

  // Reset page when category or search changes
  useEffect(() => {
    setPage(1);
  }, [category, searchQuery]);

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load videos. Please try again later.",
    });
  }

  // Paginate videos
  const displayedVideos = videos ? videos.slice(0, page * videosPerPage) : [];
  const hasMore = videos ? videos.length > page * videosPerPage : false;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="flex space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No videos to display
  if (videos && videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No videos found</h3>
        <p className="mt-2 text-sm text-gray-500">
          {searchQuery 
            ? `No videos matching "${searchQuery}"` 
            : category 
              ? `No videos in the ${category} category` 
              : "No videos uploaded yet"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-800 font-medium"
          >
            Load More
          </Button>
        </div>
      )}
    </>
  );
}
