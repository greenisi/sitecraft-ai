'use client';
import { useState } from 'react';

interface CheckoutProps {
  projectId: string;
  total: number;
  items: { product_id: string; quantity: number; name: string; price: number }[];
  accentColor?: string;
}

export default function CheckoutPage({ projectId, total, items, accentColor = '#9333ea' }: CheckoutProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/sites/' + projectId + '/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, items, return_url: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Checkout failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-3">Order Summary</h3>
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span>{item.name} x{item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      <form onSubmit={handleCheckout} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full px-3 py-2 border rounded-lg focus:ring-2" style={{'--tw-ring-color': accentColor} as any} />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50" style={{backgroundColor: accentColor}}>
          {loading ? 'Processing...' : 'Pay ${total.toFixed(2)}'}
        </button>
      </form>
    </div>
  );
      }
