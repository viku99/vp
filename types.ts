// 🏷️ Type Definitions
// This file contains TypeScript interfaces for all editable data in the app.
// It defines a single, unified `SiteContent` type to act as the source of truth.

export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  tools: string[];
  thumbnail?: string; // Thumbnail is optional, as video can be primary
  video?: string; // Simplified to a single URL for direct links or embeds
  description: string;
  images: string[];
}

export interface Testimonial {
  id:string;
  quote: string;
  name: string;
  title: string;
  image: string;
}

export interface AboutContent {
  bio: string;
  skills: string[];
}

export interface SiteContent {
  projects: Project[];
  testimonials: Testimonial[];
  about: AboutContent;
}