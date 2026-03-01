'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Property { id: string; title: string; property_type: string; status: string; price: number; address: string; city: string; state: string; bedrooms: number; bathrooms: number; square_feet: number; }

export default function PropertiesPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [properties, setProperties] = useState<Property[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Property | null>(null);
    const [form, setForm] = useState({ title: '', description: '', property_type: 'house', status: 'active', price: 0, address: '', city: '', state: '', zip_code: '', bedrooms: 0, bathrooms: 0, square_feet: 0 });

  useEffect(() => { loadProperties(); }, [projectId]);

  async function loadProperties() {
        const res = await fetch('/api/projects/' + projectId + '/properties');
        if (res.ok) setProperties(await res.json());
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
                      <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', description: '', property_type: 'house', status: 'active', price: 0, address: '', city: '', state: '', zip_code: '', bedrooms: 0, bathrooms: 0, square_feet: 0 }); }}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Property</button>
              </div>
          {showForm && (
                  <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
                            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Property title" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                            <div className="grid grid-cols-2 gap-4">
                                        <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                                                      <option value="house">House</option><option value="condo">Condo</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option>
                                        </select>
                                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                                                      <option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option>
                                        </select>
                                        <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Price" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: Number(e.target.value)})} placeholder="Bedrooms" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: Number(e.target.value)})} placeholder="Bathrooms" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input type="number" value={form.square_feet} onChange={e => setForm({...form, square_feet: Number(e.target.value)})} placeholder="Sq Ft" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
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
                                <div>
                                              <div className="font-medium text-white">{p.title}</div>
                                              <div className="text-sm text-gray-400">${p.price.toLocaleString()} - {p.bedrooms}bd/{p.bathrooms}ba - {p.city}, {p.state}</div>
                                              <span className={'text-xs px-2 py-0.5 rounded ' + (p.status === 'active' ? 'bg-green-600' : p.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600') + ' text-white'}>{p.status}</span>
                                </div>
                                <div className="flex gap-2">
                                              <button onClick={() => { setEditing(p); setForm(p as any); setShowForm(true); }} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">Edit</button>
                                              <button onClick={() => handleDelete(p.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                </div>
                    </div>
                  ))}
                {properties.length === 0 && <p className="text-gray-500 text-center py-8">No properties yet. Add your first listing above.</p>}
              </div>
        </div>
      );
}
