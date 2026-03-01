'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Order { id: string; status: string; total: number; customer_email: string; items: any[]; created_at: string; }

export default function OrdersPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState('');

  useEffect(() => { loadOrders(); }, [projectId, filter]);

  async function loadOrders() {
        const url = '/api/projects/' + projectId + '/orders' + (filter ? '?status=' + filter : '');
        const res = await fetch(url);
        if (res.ok) setOrders(await res.json());
  }

  async function updateStatus(orderId: string, status: string) {
        await fetch('/api/projects/' + projectId + '/orders/' + orderId, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
        });
        loadOrders();
  }

  const statusColors: Record<string, string> = { pending: 'bg-yellow-600', processing: 'bg-blue-600', shipped: 'bg-purple-600', delivered: 'bg-green-600', cancelled: 'bg-red-600' };

  return (
        <div className="space-y-6">
              <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-white">Orders</h1>
                      <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                                <option value="">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                      </select>
              </div>
              <div className="space-y-3">
                {orders.map((order) => (
                    <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                              <div>
                                                              <span className="font-medium text-white">Order #{order.id.slice(0, 8)}</span>
                                                              <span className="ml-2 text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                                              </div>
                                              <span className={'text-xs px-2 py-1 rounded text-white ' + (statusColors[order.status] || 'bg-gray-600')}>{order.status}</span>
                                </div>
                                <div className="text-sm text-gray-400">{order.customer_email || 'No email'}</div>
                                <div className="text-lg font-bold text-white mt-1">${Number(order.total).toFixed(2)}</div>
                                <div className="flex gap-2 mt-3">
                                  {['pending', 'processing', 'shipped', 'delivered'].map(s => (
                                      <button key={s} onClick={() => updateStatus(order.id, s)} disabled={order.status === s}
                                                          className={'px-2 py-1 text-xs rounded ' + (order.status === s ? 'bg-gray-600 text-gray-400' : 'bg-gray-700 text-white hover:bg-gray-600')}>
                                        {s}
                                      </button>
                                    ))}
                                </div>
                                    </div>
                  ))}
                {orders.length === 0 && <p className="text-gray-500 text-center py-8">No orders yet.</p>}
              </div>
        </div>
      );
}
