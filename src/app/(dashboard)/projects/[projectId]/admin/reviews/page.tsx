'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Review {
  id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function ReviewsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadReviews = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/reviews`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
    }
  }, [projectId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  async function updateReview(id: string, updates: Partial<Review>) {
    await fetch(`/api/projects/${projectId}/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    loadReviews();
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review?')) return;
    await fetch(`/api/projects/${projectId}/reviews/${id}`, { method: 'DELETE' });
    loadReviews();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reviews</h1>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{review.customer_name}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                    ))}
                  </div>
                </div>
                {review.customer_email && <div className="text-sm text-gray-400">{review.customer_email}</div>}
                <div className="text-xs text-gray-500 mt-1">{new Date(review.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${review.is_approved ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
                  {review.is_approved ? 'Approved' : 'Pending'}
                </span>
                {review.is_featured && <span className="text-xs px-2 py-0.5 rounded bg-purple-600 text-white">Featured</span>}
              </div>
            </div>
            {review.review_text && <p className="mt-3 text-gray-300 text-sm">{review.review_text}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => updateReview(review.id, { is_approved: !review.is_approved })} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">
                {review.is_approved ? 'Unapprove' : 'Approve'}
              </button>
              <button onClick={() => updateReview(review.id, { is_featured: !review.is_featured })} className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">
                {review.is_featured ? 'Unfeature' : 'Feature'}
              </button>
              <button onClick={() => deleteReview(review.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-500 text-center py-8">No reviews yet.</p>}
      </div>
    </div>
  );
}
