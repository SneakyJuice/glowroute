import Link from 'next/link';

export default async function BlogPage() {
  // In production, would read from file system or database
  // For now, just return empty array - the generate-content script will populate this
  const posts: any[] = [];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">GlowRoute Blog</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map(post => (
          <article key={post.slug} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href={`/blog/${post.slug}`} className="block p-6">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.description}</p>
              <span className="text-blue-600 hover:text-blue-800">Read more →</span>
            </Link>
          </article>
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No articles yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}