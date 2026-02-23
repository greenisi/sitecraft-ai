import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Submission {
  id: string;
  form_type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  service_needed: string | null;
  form_data: Record<string, any> | null;
  status: string;
  source_page: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, any> | null;
  total: number;
  currency: string;
  status: string;
  items: any[];
  created_at: string;
}

function formatFormType(type: string): string {
  const labels: Record<string, string> = {
    contact: 'Contact Form',
    quote: 'Quote Request',
    appointment: 'Appointment',
    booking: 'Booking',
    inquiry: 'Inquiry',
    consultation: 'Consultation',
    newsletter: 'Newsletter',
    property_inquiry: 'Property Inquiry',
    rental_inquiry: 'Rental Inquiry',
    service_request: 'Service Request',
    callback: 'Callback Request',
    estimate: 'Free Estimate',
    review: 'Review/Feedback',
    registration: 'Registration',
    application: 'Application',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default async function LeadsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, site_type')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) redirect('/dashboard');

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(200);

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(200);

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    read: 'bg-gray-500/20 text-gray-400',
    replied: 'bg-green-500/20 text-green-400',
    archived: 'bg-yellow-500/20 text-yellow-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-blue-500/20 text-blue-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    refunded: 'bg-red-500/20 text-red-400',
    scheduled: 'bg-violet-500/20 text-violet-400',
    no_show: 'bg-orange-500/20 text-orange-400',
  };

  // Group submissions by form_type for organized display
  const groupedSubmissions: Record<string, Submission[]> = {};
  if (submissions) {
    for (const s of submissions as Submission[]) {
      const type = s.form_type || 'general';
      if (!groupedSubmissions[type]) groupedSubmissions[type] = [];
      groupedSubmissions[type].push(s);
    }
  }

  const totalSubmissions = submissions?.length || 0;
  const totalOrders = orders?.length || 0;
  const newSubmissions = submissions?.filter((s: any) => s.status === 'new').length || 0;
  const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
              &larr; Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold">{project.name} &mdash; Leads &amp; Orders</h1>
            <p className="text-gray-400 text-sm mt-1">Manage all form submissions, inquiries, and orders from your website</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Total Submissions</p>
            <p className="text-2xl font-bold mt-1">{totalSubmissions}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide">New / Unread</p>
            <p className="text-2xl font-bold mt-1 text-blue-400">{newSubmissions}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Total Orders</p>
            <p className="text-2xl font-bold mt-1">{totalOrders}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Pending Orders</p>
            <p className="text-2xl font-bold mt-1 text-yellow-400">{pendingOrders}</p>
          </div>
        </div>

        {/* Form Submissions - Grouped by Type */}
        {Object.keys(groupedSubmissions).length > 0 ? (
          Object.entries(groupedSubmissions).map(([formType, subs]) => (
            <section key={formType} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">{formatFormType(formType)}</h2>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{subs.length}</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left text-gray-400">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map((s) => (
                        <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                            {new Date(s.created_at).toLocaleDateString()}<br/>
                            {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-medium">{s.name || '—'}</td>
                          <td className="px-4 py-3 text-blue-400 text-xs">{s.email || '—'}</td>
                          <td className="px-4 py-3 text-xs">{s.phone || '—'}</td>
                          <td className="px-4 py-3 max-w-md">
                            {s.message && <p className="text-gray-300 text-xs mb-1">{s.message}</p>}
                            {s.service_needed && <p className="text-xs text-violet-400">Service: {s.service_needed}</p>}
                            {s.form_data && Object.keys(s.form_data).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(s.form_data).map(([key, val]) => (
                                  <span key={key} className="inline-block bg-gray-800 text-gray-300 rounded px-2 py-0.5 text-xs">
                                    <span className="text-gray-500">{formatKey(key)}:</span> {String(val)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {s.source_page && <p className="text-xs text-gray-600 mt-1">from: {s.source_page}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[s.status] || 'bg-gray-700 text-gray-300'}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))
        ) : (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Form Submissions</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
              <p className="mb-2">No form submissions yet.</p>
              <p className="text-sm">They will appear here once visitors submit contact forms, booking requests, quote requests, or any other forms on your website.</p>
            </div>
          </section>
        )}

        {/* Orders Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold">Orders</h2>
            {orders && orders.length > 0 && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{orders.length}</span>
            )}
          </div>
          {(!orders || orders.length === 0) ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
              <p className="mb-2">No orders yet.</p>
              <p className="text-sm">Orders will appear here once customers make purchases on your website. This works with any e-commerce, service booking, or product ordering setup.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Order #</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orders as Order[]).map((o) => (
                      <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                          {new Date(o.created_at).toLocaleDateString()}<br/>
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{o.customer_name}</p>
                          <p className="text-blue-400 text-xs">{o.customer_email}</p>
                          {o.customer_phone && <p className="text-gray-500 text-xs">{o.customer_phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {o.items && o.items.length > 0 ? (
                            <div>
                              {o.items.slice(0, 3).map((item: any, i: number) => (
                                <p key={i} className="text-gray-300">{item.name || item.title || `Item ${i + 1}`} {item.quantity ? `x${item.quantity}` : ''}</p>
                              ))}
                              {o.items.length > 3 && <p className="text-gray-500">+{o.items.length - 3} more</p>}
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">${Number(o.total).toFixed(2)} <span className="text-gray-500 text-xs">{o.currency}</span></td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[o.status] || 'bg-gray-700 text-gray-300'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
