import { promises as fs } from 'fs';
import path from 'path';
import { SiteContent } from '@/types';

// Cache the data in production to avoid reading the file on every request.
let cachedData: SiteContent | null = null;

export async function getData(): Promise<SiteContent> {
  // In development, always re-read the file to reflect changes without restarting the server.
  if (process.env.NODE_ENV === 'production' && cachedData) {
    return cachedData;
  }
  
  const filePath = path.join(process.cwd(), 'data/content.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(jsonData);
  
  if (process.env.NODE_ENV === 'production') {
      cachedData = data;
  }

  return data;
}