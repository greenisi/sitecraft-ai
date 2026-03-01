'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
}

export default function LeadsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const loadLeads = useCallback(async () => {
    const url = statusFilter === 'all' 
      ? `/api/projects/${projectId}/leads`
      : `/api/projects/${projectId}/leads?status=${statusFilter}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads || []);
    }
  }, [projectId, statusFilter]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/projects/${projectId}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadLeads();
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, status });
    }
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-600',
    contacted: 'bg-yellow-600',
    converted: 'bg-green-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`bg-gray-900 border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedLead?.id === lead.id ? 'border-purple-500' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-white">{lead.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded text-white ${statusColors[lead.status] || 'bg-gray-600'}`}>
                  {lead.status}
                </span>
              </div>
              <div className="text-sm text-gray-400">{lead.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(lead.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="text-gray-500 text-center py-8">No leads yet.</p>
          )}
        </div>

        {selectedLead && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">{selectedLead.name}</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">Email:</span> <span className="text-white">{selectedLead.email}</span></div>
              {selectedLead.phone && <div><span className="text-gray-400">Phone:</span> <span className="text-white">{selectedLead.phone}</span></div>}
              <div><span className="text-gray-400">Source:</span> <span className="text-white">{selectedLead.source}</span></div>
              <div><span className="text-gray-400">Date:</span> <span className="text-white">{new Date(selectedLead.created_at).toLocaleString()}</span></div>
            </div>
            {selectedLead.message && (
              <div>
                <div className="text-gray-400 text-sm mb-1">Message:</div>
                <div className="bg-gray-800 p-3 rounded text-white text-sm">{selectedLead.message}</div>
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm block mb-2">Update Status:</label>
              <div className="flex gap-2">
                {['new', 'contacted', 'converted'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(selectedLead.id, status)}
                    className={`px-3 py-1 text-sm rounded text-white capitalize ${
                      selectedLead.status === status ? statusColors[status] : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
