'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const BUSINESS_TYPES = [
  { value: 'service', label: 'Service Business', desc: 'Offer services with booking and scheduling' },
  { value: 'ecommerce', label: 'E-Commerce', desc: 'Sell products with cart and checkout' },
  { value: 'realestate', label: 'Real Estate', desc: 'List properties with details and search' },
  { value: 'other', label: 'Other / General', desc: 'General website with custom content' },
  ];

export default function SetupPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const [businessType, setBusinessType] = useState('');
    const [saving, setSaving] = useState(false);
    const [currentType, setCurrentType] = useState('');

  useEffect(() => {
        fetch('/api/projects/' + projectId)
          .then(r => r.json())
          .then(p => { setBusinessType(p.business_type || p.site_type || ''); setCurrentType(p.business_type || p.site_type || ''); });
  }, [projectId]);

  async function handleSave() {
        setSaving(true);
        const res = await fetch('/api/projects/' + projectId + '/business-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ business_type: businessType }),
        });
        if (res.ok) { setCurrentType(businessType); alert('Business type updated!'); }
        else { alert('Failed to update'); }
        setSaving(false);
  }

  return (
        <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">Business Setup</h1>
              <p className="text-gray-400">Choose your business type to enable the right content management tools.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BUSINESS_TYPES.map((bt) => (
                    <button key={bt.value} onClick={() => setBusinessType(bt.value)}
                                  className={'p-4 rounded-lg border text-left transition-all ' +
                                                  (businessType === bt.value ? 'border-purple-500 bg-purple-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600')}>
                                <div className="font-medium text-white">{bt.label}</div>
                                <div className="text-sm text-gray-400 mt-1">{bt.desc}</div>
                    </button>
                                        ))}
              </div>
          {businessType && businessType !== currentType && (
                  <button onClick={handleSave} disabled={saving}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Business Type'}
                  </button>
              )}
        </div>
      );
}
