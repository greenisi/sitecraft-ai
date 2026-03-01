'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: string;
  recipient_email: string;
  subject: string;
  body: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadNotifications = useCallback(async () => {
    const url = typeFilter === 'all'
      ? `/api/projects/${projectId}/notifications`
      : `/api/projects/${projectId}/notifications?type=${typeFilter}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
    }
  }, [projectId, typeFilter]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const typeLabels: Record<string, string> = {
    new_lead: 'New Lead',
    new_booking: 'New Booking',
    new_order: 'New Order',
    new_review: 'New Review',
  };

  const typeColors: Record<string, string> = {
    new_lead: 'bg-blue-600',
    new_booking: 'bg-purple-600',
    new_order: 'bg-green-600',
    new_review: 'bg-yellow-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        >
          <option value="all">All Types</option>
          <option value="new_lead">Leads</option>
          <option value="new_booking">Bookings</option>
          <option value="new_order">Orders</option>
          <option value="new_review">Reviews</option>
        </select>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${typeColors[notification.type] || 'bg-gray-600'}`}>
                    {typeLabels[notification.type] || notification.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${notification.status === 'sent' ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
                    {notification.status}
                  </span>
                </div>
                <div className="font-medium text-white mt-2">{notification.subject}</div>
                <div className="text-sm text-gray-400">To: {notification.recipient_email}</div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
            {notification.body && (
              <div className="mt-3 p-3 bg-gray-800 rounded text-sm text-gray-300 whitespace-pre-wrap">
                {notification.body}
              </div>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-gray-500 text-center py-8">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
