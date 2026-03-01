'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface BusinessInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  social_links: Record<string, string>;
  google_maps_url: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultForm: BusinessInfo = {
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA',
  hours: DAYS.reduce((acc, day) => ({ ...acc, [day]: { open: '09:00', close: '17:00', closed: false } }), {}),
  social_links: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
  google_maps_url: '',
};

export default function BusinessInfoPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessInfo>(defaultForm);

  const loadBusinessInfo = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/business-info`);
    if (res.ok) {
      const data = await res.json();
      if (data.business_info) {
        setForm((prevForm) => ({
          ...prevForm,
          ...data.business_info,
          hours: { ...prevForm.hours, ...data.business_info.hours },
          social_links: { ...prevForm.social_links, ...data.business_info.social_links },
        }));
      }
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadBusinessInfo(); }, [loadBusinessInfo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/projects/${projectId}/business-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
  }

  function updateHours(day: string, field: string, value: string | boolean) {
    setForm({
      ...form,
      hours: { ...form.hours, [day]: { ...form.hours[day], [field]: value } },
    });
  }

  function updateSocial(platform: string, value: string) {
    setForm({ ...form, social_links: { ...form.social_links, [platform]: value } });
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Business Info</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Address</h2>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street Address" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder="ZIP" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <input value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} placeholder="Google Maps URL" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Business Hours</h2>
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <span className="w-24 text-gray-300 capitalize">{day}</span>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.hours[day]?.closed || false} onChange={(e) => updateHours(day, 'closed', e.target.checked)} className="rounded" />
                <span className="text-gray-400 text-sm">Closed</span>
              </label>
              {!form.hours[day]?.closed && (
                <>
                  <input type="time" value={form.hours[day]?.open || '09:00'} onChange={(e) => updateHours(day, 'open', e.target.value)} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
                  <span className="text-gray-400">to</span>
                  <input type="time" value={form.hours[day]?.close || '17:00'} onChange={(e) => updateHours(day, 'close', e.target.value)} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
                </>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Social Media Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].map((platform) => (
              <input key={platform} value={form.social_links[platform] || ''} onChange={(e) => updateSocial(platform, e.target.value)} placeholder={platform.charAt(0).toUpperCase() + platform.slice(1) + ' URL'} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
