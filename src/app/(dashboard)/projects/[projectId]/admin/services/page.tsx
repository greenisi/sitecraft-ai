'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Service { id: string; name: string; description: string; price: number; duration: string; is_active: boolean; }

export default function ServicesPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [services, setServices] = useState<Service[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [form, setForm] = useState({ name: '', description: '', price: 0, duration: '', is_active: true });

  useEffect(() => { loadServices(); }, [projectId]);

  async function loadServices() {
        const res = await fetch('/api/projects/' + projectId + '/services');
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
        }
  }

  async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const url = editing
          ? '/api/projects/' + projectId + '/services/' + editing.id
                : '/api/projects/' + projectId + '/services';
        const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
        });
        if (res.ok) { loadServices(); setShowForm(false); setEditing(null); setForm({ name: '', description: '', price: 0, duration: '', is_active: true }); }
  }

  async function handleDelete(id: string) {
        if (!confirm('Delete this service?')) return;
        await fetch('/api/projects/' + projectId + '/services/' + id, { method: 'DELETE' });
        loadServices();
  }

  return (
        <div className="space-y-6">
              <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-white">Services</h1>
                      <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '', price: 0, duration: '', is_active: true }); }}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Service</button>
              </div>
          {showForm && (
                  <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
                            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Service name" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" rows={3} />
                            <div className="grid grid-cols-2 gap-4">
                                        <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Price" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                                        <input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="Duration (e.g. 1 hour)" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                            </div>
                            <div className="flex gap-2">
                                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{editing ? 'Update' : 'Create'}</button>
                                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                            </div>
                  </form>
              )}
              <div className="space-y-3">
                {services.map((s) => (
                    <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                              <div className="font-medium text-white">{s.name}</div>
                                              <div className="text-sm text-gray-400">${s.price} - {s.duration || 'N/A'}</div>
                                </div>
                                <div className="flex gap-2">
                                              <button onClick={() => { setEditing(s); setForm(s as any); setShowForm(true); }} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">Edit</button>
                                              <button onClick={() => handleDelete(s.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                </div>
                    </div>
                  ))}
                {services.length === 0 && <p className="text-gray-500 text-center py-8">No services yet. Add your first service above.</p>}
              </div>
        </div>
      );
}
