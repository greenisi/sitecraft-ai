'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  author: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

export default function BlogPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', featured_image: '', author: '', status: 'draft' });
  const [uploading, setUploading] = useState(false);

  const loadPosts = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/blog`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts || []);
    }
  }, [projectId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('imageType', 'blog');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, featured_image: data.url });
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/projects/${projectId}/blog/${editing.id}` : `/api/projects/${projectId}/blog`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug: form.slug || generateSlug(form.title) }),
    });
    if (res.ok) {
      loadPosts();
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', slug: '', content: '', excerpt: '', featured_image: '', author: '', status: 'draft' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/projects/${projectId}/blog/${id}`, { method: 'DELETE' });
    loadPosts();
  }

  async function togglePublish(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await fetch(`/api/projects/${projectId}/blog/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadPosts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', slug: '', content: '', excerpt: '', featured_image: '', author: '', status: 'draft' }); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">New Post</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })} placeholder="Post title" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="URL slug (auto-generated)" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short excerpt" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" rows={2} />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Post content" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" rows={10} />
          <div className="grid grid-cols-2 gap-4">
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">Featured Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-gray-400 text-sm" />
            {uploading && <span className="text-gray-500 text-sm ml-2">Uploading...</span>}
            {form.featured_image && <img src={form.featured_image} alt="Preview" className="mt-2 h-32 object-cover rounded" />}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {post.featured_image && <img src={post.featured_image} alt="" className="w-16 h-16 object-cover rounded" />}
              <div>
                <div className="font-medium text-white">{post.title}</div>
                <div className="text-sm text-gray-400">/{post.slug} {post.author && `• by ${post.author}`}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${post.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>{post.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => togglePublish(post)} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">{post.status === 'published' ? 'Unpublish' : 'Publish'}</button>
              <button onClick={() => { setEditing(post); setForm({ title: post.title, slug: post.slug, content: post.content || '', excerpt: post.excerpt || '', featured_image: post.featured_image || '', author: post.author || '', status: post.status }); setShowForm(true); }} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">Edit</button>
              <button onClick={() => handleDelete(post.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-gray-500 text-center py-8">No blog posts yet.</p>}
      </div>
    </div>
  );
}
