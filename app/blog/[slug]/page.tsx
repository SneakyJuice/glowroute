import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { supabase } from '@/lib/supabase';
import ClinicCard from '@/components/ClinicCard';

export async function generateStaticParams() {
  // This would be populated by the generate-content script
  return [];
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  try {
    const { content, frontmatter } = await compileMDX<{
      title: string;
      description: string;
    }>({
      source: await fetchPostContent(params.slug),
      options: { parseFrontmatter: true }
    });

    // Extract clinic names from content (simplified - would use proper parsing in production)
    const clinicNames = extractClinicNames(content);
    const clinics = await fetchClinics(clinicNames);

    return (
      <article className="prose mx-auto py-8">
        <h1>{frontmatter.title}</h1>
        <p className="text-lg text-gray-600">{frontmatter.description}</p>
        
        {content}
        
        <div className="mt-12">
          <h2>Featured Clinics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map(clinic => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        </div>
        
        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h3>Ready to book your treatment?</h3>
          <p>Find the perfect med spa for your needs on GlowRoute.</p>
          <a href="/search" className="btn btn-primary">Browse All Clinics</a>
        </div>
      </article>
    );
  } catch (error) {
    return notFound();
  }
}

async function fetchPostContent(slug: string): Promise<string> {
  // In production, would read from file system or database
  // For now, just return empty string - the generate-content script will populate this
  return '';
}

function extractClinicNames(content: React.ReactNode): string[] {
  // Simplified - would use proper parsing in production
  return [];
}

async function fetchClinics(names: string[]) {
  if (names.length === 0) return [];
  
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .in('name', names);
    
  if (error) {
    console.error('Error fetching clinics:', error);
    return [];
  }
  
  return data || [];
}