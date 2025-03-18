import { Link } from "wouter";
import { Video } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  // Convert view count to a more readable format
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Format upload date
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Get uploader info
  const { data: uploader, isLoading: uploaderLoading } = useQuery<User>({
    queryKey: [`/api/users/${video.uploaderId}`],
    enabled: !!video.uploaderId,
  });

  // Calculate video duration display (in a real app, this would come from the backend)
  const videoDuration = video.duration 
    ? new Date(video.duration * 1000).toISOString().substr(14, 5) // MM:SS format
    : "00:00";

  return (
    <Link href={`/video/${video.id}`}>
      <div className="video-card group cursor-pointer">
        <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-100 relative">
          {/* Use a placeholder or video thumbnail */}
          <img 
            className="object-cover w-full h-full" 
            src={video.thumbnailPath || `https://picsum.photos/seed/${video.id}/800/450`} 
            alt={`${video.title} thumbnail`} 
          />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
            {videoDuration}
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {uploaderLoading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {uploader?.username.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-brand-blue">
                {video.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {uploader?.username || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {formatViews(video.views)} views • {formatDate(video.uploadDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
