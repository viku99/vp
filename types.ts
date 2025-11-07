// 🏷️ Type Definitions
// This file contains TypeScript interfaces for all editable data in the app.
// It defines a single, unified `SiteContent` type to act as the source of truth.

export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  tools: string[];
  thumbnail?: string;
  video?: string;
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
