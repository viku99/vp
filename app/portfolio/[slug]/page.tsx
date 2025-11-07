import { getData } from '@/lib/data';
import ProjectDetailClient from './ProjectDetailClient';
import { notFound } from 'next/navigation';
import { SiteContent } from '@/types';

type Props = {
  params: { slug: string };
};

// Generate static pages for each project at build time
export async function generateStaticParams() {
  const content: SiteContent = await getData();
  return content.projects.map((project) => ({
    slug: project.id,
  }));
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = params;
  const content = await getData();
  
  const projectIndex = content.projects.findIndex(p => p.id === slug);
  const project = projectIndex !== -1 ? content.projects[projectIndex] : undefined;

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} projectIndex={projectIndex} />;
}
