import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Videos table
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  embedUrl: text("embed_url"),
  isEmbedded: boolean("is_embedded").default(false),
  thumbnailPath: text("thumbnail_path"),
  category: text("category"),
  uploaderId: integer("uploader_id").notNull(),
  views: integer("views").notNull().default(0),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  duration: integer("duration"),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  views: true,
  uploadDate: true,
});

// Categories for videos
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Extended schemas with validation
export const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const videoUploadSchema = insertVideoSchema.extend({
  file: z.custom<File>((val) => val instanceof File, {
    message: "Please upload a valid video file",
  }).optional(),
});

export const embedVideoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  embedUrl: z.string().url({ message: "Please enter a valid URL" }),
  category: z.string().optional(),
  isEmbedded: z.literal(true),
});

// Theme customization schema
export const themeSchema = z.object({
  primaryColor: z.string().default('#3b82f6'),
  secondaryColor: z.string().default('#f97316'),
  accentColor: z.string().default('#8b5cf6'),
  logoText: z.string().default('VideoShare'),
  logoUrl: z.string().nullable().default(null),
  borderRadius: z.number().min(0).max(2).default(0.5),
  enableAds: z.boolean().default(false),
  darkMode: z.boolean().default(false),
});

export type ThemeSettings = z.infer<typeof themeSchema>;

// Default categories
export const DEFAULT_CATEGORIES = [
  "All",
  "Travel",
  "Sports",
  "Education",
  "Technology",
  "Entertainment",
  "Music",
];
