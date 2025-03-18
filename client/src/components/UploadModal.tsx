import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { insertVideoSchema, DEFAULT_CATEGORIES } from "@shared/schema";
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
import { Upload } from "lucide-react";

// Form validation schema
const formSchema = insertVideoSchema.extend({
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

type FormValues = z.infer<typeof formSchema>;

interface UploadModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function UploadModal({ isOpen, setIsOpen }: UploadModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      fileName: "",
      filePath: "",
      uploaderId: user?.id || 0,
    },
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      form.setValue("file", files[0], { shouldValidate: true });
      form.setValue("fileName", files[0].name);
      
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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormValues) => {
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
      form.reset();
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

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to upload videos.",
      });
      return;
    }
    
    uploadMutation.mutate(data);
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
        form.setValue("file", file, { shouldValidate: true });
        form.setValue("fileName", file.name);
        
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
      form.reset();
      setThumbnailPreview("");
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
          <DialogDescription>
            Share your videos with the community.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!form.watch("file") ? (
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
                      className="relative cursor-pointer bg-white rounded-md font-medium text-brand-blue hover:text-blue-500 focus-within:outline-none"
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
                      <span>Uploading {form.watch("fileName")}</span>
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
                          {form.watch("fileName")}
                        </p>
                        <button
                          type="button"
                          className="mt-1 text-sm text-brand-blue hover:text-blue-700"
                          onClick={() => {
                            form.setValue("file", undefined as any);
                            form.setValue("fileName", "");
                            setThumbnailPreview("");
                          }}
                        >
                          Change file
                        </button>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter video description"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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
                disabled={isUploading || !form.formState.isValid}
              >
                {isUploading 
                  ? "Uploading..." 
                  : form.watch("file") 
                    ? "Publish" 
                    : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
