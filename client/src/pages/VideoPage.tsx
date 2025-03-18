import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Video, User } from "@shared/schema";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function VideoPage() {
  const [match, params] = useRoute("/video/:id");
  const videoId = match ? parseInt(params.id) : -1;

  // Fetch video details
  const { 
    data: video, 
    isLoading: videoLoading, 
    error: videoError 
  } = useQuery<Video>({
    queryKey: [`/api/videos/${videoId}`],
    enabled: videoId > 0,
  });

  // Fetch uploader info if we have a video
  const { 
    data: uploader, 
    isLoading: uploaderLoading 
  } = useQuery<User>({
    queryKey: [`/api/users/${video?.uploaderId}`],
    enabled: !!video?.uploaderId,
  });

  // Format view count to a more readable format
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!match) {
    return <div>Video not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-slate-50">
        <div className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/">
              <Button variant="ghost" className="text-white mb-4 px-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            <div className="lg:flex lg:items-start lg:space-x-6">
              {/* Video Player */}
              <div className="lg:w-3/4">
                {videoLoading ? (
                  <Skeleton className="aspect-video w-full rounded-lg" />
                ) : videoError ? (
                  <div className="aspect-video w-full flex items-center justify-center bg-slate-800 rounded-lg">
                    <p>Error loading video</p>
                  </div>
                ) : video ? (
                  <VideoPlayer video={video} />
                ) : null}
              </div>
              
              {/* Video Info */}
              <div className="mt-6 lg:mt-0 lg:w-1/4">
                {videoLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : video ? (
                  <>
                    <h1 className="text-xl font-bold mb-2">{video.title}</h1>
                    <div className="text-slate-300 text-sm mb-4">
                      {formatViews(video.views)} views • {formatDate(video.uploadDate)}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-6">
                      <Button variant="ghost" size="sm" className="flex items-center text-slate-300 hover:text-white">
                        <ThumbsUp className="h-5 w-5 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center text-slate-300 hover:text-white">
                        <ThumbsDown className="h-5 w-5 mr-1" />
                        Dislike
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center text-slate-300 hover:text-white">
                        <Share2 className="h-5 w-5 mr-1" />
                        Share
                      </Button>
                    </div>
                    
                    <div className="border-t border-slate-700 pt-4">
                      <div className="flex items-center mb-4">
                        {uploaderLoading ? (
                          <Skeleton className="h-10 w-10 rounded-full mr-3" />
                        ) : (
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>
                              {uploader?.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <h3 className="font-medium">
                            {uploader?.username || "User"}
                          </h3>
                          <div className="text-sm text-slate-400">
                            {video.category || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-4">
                        {video.description || "No description provided"}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
