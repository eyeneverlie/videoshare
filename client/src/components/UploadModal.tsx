import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { insertVideoSchema, DEFAULT_CATEGORIES, embedVideoSchema } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon } from "lucide-react";

// Form validation schemas
const uploadFormSchema = insertVideoSchema.extend({
  file: z.instanceof(File, { message: "Please select a video file" })
    .refine(file => file.size <= 500 * 1024 * 1024, {
      message: "File size must be less than 500MB",
    })
    .refine(file => {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      return validTypes.includes(file.type);
    }, {
      message: "File must be MP4, WebM, or MOV format",
    }),
});

const embedFormSchema = embedVideoSchema;

type UploadFormValues = z.infer<typeof uploadFormSchema>;
type EmbedFormValues = z.infer<typeof embedFormSchema>;

interface UploadModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function UploadModal({ isOpen, setIsOpen }: UploadModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "embed">("upload");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize upload form
  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      fileName: "",
      filePath: "",
      uploaderId: user?.id || 0,
    },
  });

  // Initialize embed form
  const embedForm = useForm<EmbedFormValues>({
    resolver: zodResolver(embedFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      embedUrl: "",
      isEmbedded: true,
      uploaderId: user?.id || 0,
    },
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadForm.setValue("file", files[0], { shouldValidate: true });
      uploadForm.setValue("fileName", files[0].name);
      
      // Generate a thumbnail preview
      const videoUrl = URL.createObjectURL(files[0]);
      const video = document.createElement("video");
      video.src = videoUrl;
      video.currentTime = 2; // Seek to 2 seconds
      video.addEventListener("loadeddata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnailPreview(canvas.toDataURL());
        URL.revokeObjectURL(videoUrl);
      });
    }
  };

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: UploadFormValues) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", data.file);

      // Add video metadata as JSON
      const videoData = {
        title: data.title,
        description: data.description,
        category: data.category,
        fileName: data.fileName,
        uploaderId: user?.id,
      };
      formData.append("videoData", JSON.stringify(videoData));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      try {
        const response = await fetch("/api/videos", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to upload video");
        }

        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
        }, 1000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setIsOpen(false);
      uploadForm.reset();
      setThumbnailPreview("");
      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the video",
      });
    },
  });

  // Embed video mutation
  const embedVideoMutation = useMutation({
    mutationFn: async (data: EmbedFormValues) => {
      setIsUploading(true);
      
      try {
        const response = await fetch("/api/videos/embed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            uploaderId: user?.id,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to embed video");
        }

        return await response.json();
      } catch (error) {
        throw error;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
        }, 500);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setIsOpen(false);
      embedForm.reset();
      toast({
        title: "Success",
        description: "Video embedded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Embed failed",
        description: error.message || "An error occurred while embedding the video",
      });
    },
  });

  // Handle file form submission
  const onUploadSubmit = (data: UploadFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to upload videos.",
      });
      return;
    }
    
    uploadFileMutation.mutate(data);
  };

  // Handle embed form submission
  const onEmbedSubmit = (data: EmbedFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to embed videos.",
      });
      return;
    }
    
    embedVideoMutation.mutate(data);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        uploadForm.setValue("file", file, { shouldValidate: true });
        uploadForm.setValue("fileName", file.name);
        
        // Generate thumbnail preview
        const videoUrl = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.src = videoUrl;
        video.currentTime = 2; // Seek to 2 seconds
        video.addEventListener("loadeddata", () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailPreview(canvas.toDataURL());
          URL.revokeObjectURL(videoUrl);
        });
      }
    }
  };

  // Close modal handler
  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      uploadForm.reset();
      embedForm.reset();
      setThumbnailPreview("");
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Video</DialogTitle>
          <DialogDescription>
            Share videos with the community.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "embed")} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="upload" disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="embed" disabled={isUploading}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Embed URL
            </TabsTrigger>
          </TabsList>
          
          {/* Upload File Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-6">
                {!uploadForm.watch("file") ? (
                  <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="video/mp4,video/webm,video/quicktime"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        MP4, WebM, MOV up to 500MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading {uploadForm.watch("fileName")}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="mr-4 flex-shrink-0">
                            {thumbnailPreview ? (
                              <img
                                src={thumbnailPreview}
                                alt="Video thumbnail"
                                className="h-16 w-24 object-cover rounded-md"
                              />
                            ) : (
                              <div className="h-16 w-24 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No preview</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {uploadForm.watch("fileName")}
                            </p>
                            <button
                              type="button"
                              className="mt-1 text-sm text-primary hover:text-primary/90"
                              onClick={() => {
                                uploadForm.setValue("file", undefined as any);
                                uploadForm.setValue("fileName", "");
                                setThumbnailPreview("");
                              }}
                            >
                              Change file
                            </button>
                          </div>
                        </div>
                        
                        <FormField
                          control={uploadForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter video title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={uploadForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter video description"
                                  rows={3}
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={uploadForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DEFAULT_CATEGORIES.filter(cat => cat !== "All").map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !uploadForm.formState.isValid}
                  >
                    {isUploading 
                      ? "Uploading..." 
                      : uploadForm.watch("file") 
                        ? "Publish" 
                        : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Embed URL Tab */}
          <TabsContent value="embed" className="space-y-4">
            <Form {...embedForm}>
              <form onSubmit={embedForm.handleSubmit(onEmbedSubmit)} className="space-y-6">
                <FormField
                  control={embedForm.control}
                  name="embedUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={embedForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter video title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={embedForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter video description"
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={embedForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEFAULT_CATEGORIES.filter(cat => cat !== "All").map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !embedForm.formState.isValid}
                  >
                    {isUploading ? "Processing..." : "Add Embedded Video"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
