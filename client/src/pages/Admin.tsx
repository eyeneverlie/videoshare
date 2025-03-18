import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Video, User } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Trash2, Edit, Eye, Search } from "lucide-react";

export default function Admin() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/admin");
    } else if (!user.isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Fetch all videos
  const { 
    data: videos, 
    isLoading: videosLoading 
  } = useQuery<Video[]>({
    queryKey: ["/api/admin/videos"],
    enabled: !!user?.isAdmin,
  });

  // Fetch all users
  const { 
    data: users, 
    isLoading: usersLoading 
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: number) => {
      return apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success",
        description: "Video deleted successfully.",
      });
      setVideoToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete video.",
      });
    },
  });

  // Filter videos based on search query
  useEffect(() => {
    if (videos) {
      if (searchQuery.trim() === "") {
        setFilteredVideos(videos);
      } else {
        const query = searchQuery.toLowerCase();
        setFilteredVideos(
          videos.filter(
            (video) =>
              video.title.toLowerCase().includes(query) ||
              (video.description && video.description.toLowerCase().includes(query))
          )
        );
      }
    }
  }, [videos, searchQuery]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
            <p className="text-gray-600">
              Manage videos, users, and site settings.
            </p>
          </div>
          
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Video Management</h2>
                <div className="relative w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search videos..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Uploader ID</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videosLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading videos...
                        </TableCell>
                      </TableRow>
                    ) : filteredVideos && filteredVideos.length > 0 ? (
                      filteredVideos.map((video) => (
                        <TableRow key={video.id}>
                          <TableCell>{video.id}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {video.title}
                          </TableCell>
                          <TableCell>{video.category || "Uncategorized"}</TableCell>
                          <TableCell>{video.uploaderId}</TableCell>
                          <TableCell>{formatDate(video.uploadDate)}</TableCell>
                          <TableCell>{video.views}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/video/${video.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setVideoToDelete(video)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No videos found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : users && users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {user.isAdmin ? "Yes" : "No"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      {/* Delete Video Confirmation Dialog */}
      <Dialog open={!!videoToDelete} onOpenChange={() => setVideoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the video "{videoToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVideoToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => videoToDelete && deleteVideoMutation.mutate(videoToDelete.id)}
              disabled={deleteVideoMutation.isPending}
            >
              {deleteVideoMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
