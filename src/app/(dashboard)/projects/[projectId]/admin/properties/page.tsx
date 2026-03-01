'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Property {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  status: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  image_url: string | null;
}

export default function PropertiesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ title: '', description: '', property_type: 'house', status: 'for_sale', price: 0, address: '', city: '', state: '', zip_code: '', bedrooms: 0, bathrooms: 0, square_feet: 0, image_url: '' });
  const [uploading, setUploading] = useState(false);

  const loadProperties = useCallback(async () => {
    const res = await fetch('/api/projects/' + projectId + '/properties');
    if (res.ok) setProperties(await res.json());
  }, [projectId]);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('imageType', 'property');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, image_url: data.url });
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? '/api/projects/' + projectId + '/properties/' + editing.id : '/api/projects/' + projectId + '/properties';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { loadProperties(); setShowForm(false); setEditing(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this property?')) return;
    await fetch('/api/projects/' + projectId + '/properties/' + id, { method: 'DELETE' });
    loadProperties();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Properties</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', description: '', property_type: 'house', status: 'for_sale', price: 0, address: '', city: '', state: '', zip_code: '', bedrooms: 0, bathrooms: 0, square_feet: 0, image_url: '' }); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Property</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Property title" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="house">House</option><option value="condo">Condo</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option>
            </select>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="for_sale">For Sale</option><option value="for_rent">For Rent</option><option value="pending">Pending</option><option value="sold">Sold</option>
            </select>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Price" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: Number(e.target.value)})} placeholder="Bedrooms" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: Number(e.target.value)})} placeholder="Bathrooms" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input type="number" value={form.square_feet} onChange={e => setForm({...form, square_feet: Number(e.target.value)})} placeholder="Sq Ft" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">Property Image</label>
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
        {properties.map((p) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 object-cover rounded" />}
              <div>
                <div className="font-medium text-white">{p.title}</div>
                <div className="text-sm text-gray-400">${p.price.toLocaleString()} - {p.bedrooms}bd/{p.bathrooms}ba - {p.city}, {p.state}</div>
                <span className={'text-xs px-2 py-0.5 rounded ' + (p.status === 'for_sale' ? 'bg-green-600' : p.status === 'for_rent' ? 'bg-blue-600' : p.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600') + ' text-white'}>{p.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(p); setForm({ title: p.title, description: p.description || '', property_type: p.property_type, status: p.status, price: p.price, address: p.address, city: p.city, state: p.state, zip_code: p.zip_code || '', bedrooms: p.bedrooms, bathrooms: p.bathrooms, square_feet: p.square_feet, image_url: p.image_url || '' }); setShowForm(true); }} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
        {properties.length === 0 && <p className="text-gray-500 text-center py-8">No properties yet. Add your first listing above.</p>}
      </div>
    </div>
  );
}
