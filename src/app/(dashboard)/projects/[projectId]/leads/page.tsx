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
    status: string;
    source_page: string | null;
    created_at: string;
}

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total: number;
    currency: string;
    status: string;
    items: any[];
    created_at: string;
}

export default async function LeadsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

  const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) redirect('/dashboard');

  const { data: submissions } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(100);

  const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(100);

  const statusColors: Record<string, string> = {
        new: 'bg-blue-500/20 text-blue-400',
        read: 'bg-gray-500/20 text-gray-400',
        replied: 'bg-green-500/20 text-green-400',
        archived: 'bg-yellow-500/20 text-yellow-400',
        pending: 'bg-yellow-500/20 text-yellow-400',
        confirmed: 'bg-blue-500/20 text-blue-400',
        shipped: 'bg-purple-500/20 text-purple-400',
        delivered: 'bg-green-500/20 text-green-400',
        cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
        <div className="min-h-screen bg-gray-950 text-white">
              <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="flex items-center justify-between mb-8">
                                <div>
                                            <Link href={`/projects/${projectId}`} className="text-sm text-gray-400 hover:text-white mb-2 inline-block">&larr; Back to project</Link>
                                            <h1 className="text-2xl font-bold">{project.name} &mdash; Leads &amp; Orders</h1>
                                </div>
                                <div className="flex gap-4 text-sm">
                                            <div className="bg-gray-800 rounded-lg px-4 py-2">
                                                          <span className="text-gray-400">Submissions:</span> <span className="font-semibold">{submissions?.length || 0}</span>
                                            </div>
                                            <div className="bg-gray-800 rounded-lg px-4 py-2">
                                                          <span className="text-gray-400">Orders:</span> <span className="font-semibold">{orders?.length || 0}</span>
                                            </div>
                                </div>
                      </div>
              
                {/* Form Submissions */}
                      <section className="mb-12">
                                <h2 className="text-lg font-semibold mb-4">Contact Form Submissions</h2>
                        {(!submissions || submissions.length === 0) ? (
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                                    No form submissions yet. They will appear here once visitors submit forms on your website.
                      </div>
                    ) : (
                      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                                      <thead>
                                                                                          <tr className="border-b border-gray-800 text-left text-gray-400">
                                                                                                                <th className="px-4 py-3">Date</th>
                                                                                                                <th className="px-4 py-3">Type</th>
                                                                                                                <th className="px-4 py-3">Name</th>
                                                                                                                <th className="px-4 py-3">Email</th>
                                                                                                                <th className="px-4 py-3">Phone</th>
                                                                                                                <th className="px-4 py-3">Message</th>
                                                                                                                <th className="px-4 py-3">Status</th>
                                                                                            </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                        {(submissions as Submission[]).map((s) => (
                                              <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                                                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                                                                      <td className="px-4 py-3 capitalize">{s.form_type}</td>
                                                                      <td className="px-4 py-3">{s.name || '—'}</td>
                                                                      <td className="px-4 py-3 text-blue-400">{s.email || '—'}</td>
                                                                      <td className="px-4 py-3">{s.phone || '—'}</td>
                                                                      <td className="px-4 py-3 max-w-xs truncate text-gray-300">{s.message || s.service_needed || '—'}</td>
                                                                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[s.status] || 'bg-gray-700 text-gray-300'}`}>{s.status}</span></td>
                                              </tr>
                                            ))}
                                                                      </tbody>
                                                    </table>
                                    </div>
                      </div>
                                )}
                      </section>
              
                {/* Orders */}
                      <section>
                                <h2 className="text-lg font-semibold mb-4">Orders</h2>
                        {(!orders || orders.length === 0) ? (
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                                    No orders yet. They will appear here once customers place orders on your website.
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
                                                                                                                <th className="px-4 py-3">Email</th>
                                                                                                                <th className="px-4 py-3">Items</th>
                                                                                                                <th className="px-4 py-3">Total</th>
                                                                                                                <th className="px-4 py-3">Status</th>
                                                                                            </tr>
                                                                      </thead>
                                                                      <tbody>
                                                                        {(orders as Order[]).map((o) => (
                                              <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                                                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                                                                      <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                                                                      <td className="px-4 py-3">{o.customer_name}</td>
                                                                      <td className="px-4 py-3 text-blue-400">{o.customer_email}</td>
                                                                      <td className="px-4 py-3">{o.items?.length || 0} items</td>
                                                                      <td className="px-4 py-3 font-semibold">${Number(o.total).toFixed(2)} {o.currency}</td>
                                                                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[o.status] || 'bg-gray-700 text-gray-300'}`}>{o.status}</span></td>
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
