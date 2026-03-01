'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: string;
  sku: string;
  inventory_count: number;
  image_url: string | null;
  is_active: boolean;
}

export default function ProductsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, compare_at_price: '', category: '', sku: '', inventory_count: 0, image_url: '', is_active: true });
  const [uploading, setUploading] = useState(false);

  const loadProducts = useCallback(async () => {
    const res = await fetch('/api/projects/' + projectId + '/products');
    if (res.ok) setProducts(await res.json());
  }, [projectId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('imageType', 'product');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, image_url: data.url });
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? '/api/projects/' + projectId + '/products/' + editing.id : '/api/projects/' + projectId + '/products';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null }),
    });
    if (res.ok) {
      loadProducts();
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '', price: 0, compare_at_price: '', category: '', sku: '', inventory_count: 0, image_url: '', is_active: true });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    await fetch('/api/projects/' + projectId + '/products/' + id, { method: 'DELETE' });
    loadProducts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '', price: 0, compare_at_price: '', category: '', sku: '', inventory_count: 0, image_url: '', is_active: true }); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Product name" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Price" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm({...form, compare_at_price: e.target.value})} placeholder="Compare at price" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SKU" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input type="number" value={form.inventory_count} onChange={e => setForm({...form, inventory_count: Number(e.target.value)})} placeholder="Inventory" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">Product Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-gray-400 text-sm" />
            {uploading && <span className="text-gray-500 text-sm ml-2">Uploading...</span>}
            {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-24 object-cover rounded" />}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 object-cover rounded" />}
              <div>
                <div className="font-medium text-white">{p.name}</div>
                <div className="text-sm text-gray-400">${p.price}{p.compare_at_price ? ' (was $' + p.compare_at_price + ')' : ''} - Stock: {p.inventory_count}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(p); setForm({...p, compare_at_price: p.compare_at_price?.toString() || '', image_url: p.image_url || ''}); setShowForm(true); }} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-gray-500 text-center py-8">No products yet. Add your first product above.</p>}
      </div>
    </div>
  );
}
