'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
}

export default function GalleryPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });

  const loadImages = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/gallery`);
    if (res.ok) {
      const data = await res.json();
      setImages(data.images || []);
    }
  }, [projectId]);

  useEffect(() => { loadImages(); }, [loadImages]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('imageType', 'gallery');

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await fetch(`/api/projects/${projectId}/gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: url }),
        });
      }
    }

    setUploading(false);
    loadImages();
    e.target.value = '';
  }

  async function handleUpdate() {
    if (!editingImage) return;
    await fetch(`/api/projects/${projectId}/gallery/${editingImage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingImage(null);
    loadImages();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this image?')) return;
    await fetch(`/api/projects/${projectId}/gallery/${id}`, { method: 'DELETE' });
    loadImages();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gallery</h1>
        <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
          {uploading ? 'Uploading...' : 'Upload Images'}
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group relative">
            <img src={image.image_url} alt={image.title || ''} className="w-full h-40 object-cover" />
            <div className="p-3">
              <div className="text-sm text-white truncate">{image.title || 'Untitled'}</div>
              {image.category && <span className="text-xs text-purple-400">{image.category}</span>}
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => { setEditingImage(image); setEditForm({ title: image.title || '', description: image.description || '', category: image.category || '' }); }} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">Edit</button>
              <button onClick={() => handleDelete(image.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No images yet. Upload your first image above.</p>}
      </div>

      {editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-white">Edit Image</h2>
            <img src={editingImage.image_url} alt="" className="w-full h-40 object-cover rounded" />
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" rows={2} />
            <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="Category" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
              <button onClick={() => setEditingImage(null)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
