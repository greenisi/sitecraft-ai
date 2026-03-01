'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Booking {
  id: string;
  service_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function BookingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadBookings = useCallback(async () => {
    const searchParams = new URLSearchParams();
    if (dateFilter) searchParams.set('date', dateFilter);
    if (statusFilter !== 'all') searchParams.set('status', statusFilter);
    const url = `/api/projects/${projectId}/bookings${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
    }
  }, [projectId, dateFilter, statusFilter]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/projects/${projectId}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadBookings();
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-600',
    confirmed: 'bg-blue-600',
    cancelled: 'bg-red-600',
    completed: 'bg-green-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <div className="flex gap-3">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-white">{booking.customer_name}</div>
                <div className="text-sm text-gray-400">{booking.customer_email} {booking.customer_phone && `• ${booking.customer_phone}`}</div>
                <div className="text-sm text-purple-400 mt-1">
                  {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                </div>
                {booking.notes && <div className="text-sm text-gray-500 mt-1">Notes: {booking.notes}</div>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded text-white ${statusColors[booking.status] || 'bg-gray-600'}`}>
                {booking.status}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(booking.id, status)}
                  className={`px-3 py-1 text-sm rounded text-white capitalize ${
                    booking.status === status ? statusColors[status] : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
        {bookings.length === 0 && <p className="text-gray-500 text-center py-8">No bookings found.</p>}
      </div>
    </div>
  );
}
