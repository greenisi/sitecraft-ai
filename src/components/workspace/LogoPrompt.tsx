'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Asks the owner for their logo, and shows it once they have one.
 *
 * business_info.logo_url has existed for months with nothing reading or
 * writing it. The follow-up flow could store one, but no screen ever asked,
 * and publishing never looked for it, so a business that had a logo still
 * shipped with a generated wordmark.
 *
 * Uploading here saves to business_info, and the next publish swaps the
 * wordmark for the image. That is stated on the card, because a change that
 * only appears after republishing looks broken otherwise -- the same reason
 * the capability panel says it.
 */
export function LogoPrompt({ projectId }: { projectId: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/follow-up`);
      if (!res.ok) return;
      const data = await res.json();
      setLogoUrl(data?.answers?.logo || null);
    } catch {
      // Leave the prompt showing; asking twice is better than never asking.
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('That file is not an image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logos need to be under 5MB.');
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('projectId', projectId);
      form.append('imageType', 'logo');

      const upRes = await fetch('/api/upload', { method: 'POST', body: form });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.url) throw new Error(upData.error || 'Upload failed');

      // Saved through the follow-up endpoint, which already writes logo_url
      // to business_info and is what the publisher reads.
      const saveRes = await fetch(`/api/projects/${projectId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { logo: upData.url } }),
      });
      if (!saveRes.ok) throw new Error('Could not save the logo');

      setLogoUrl(upData.url);
      toast.success('Logo saved.', {
        description: 'Publish the site to put it in place of the wordmark.',
        duration: 8000,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="mb-1 text-base font-semibold text-white">
        {logoUrl ? 'Your logo' : 'Add your logo'}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-gray-500">
        {logoUrl
          ? 'This replaces the wordmark in the header. Publish to put a new one live.'
          : 'Your site is using a text wordmark. Upload a logo and it takes that place in the header.'}
      </p>

      {logoUrl && (
        <div className="mb-4 inline-flex items-center rounded-lg bg-white/90 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Your logo" className="h-10 w-auto max-w-[200px] object-contain" />
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-60"
      >
        {busy ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
      </button>

      <p className="mt-3 text-xs text-gray-600">
        PNG or SVG with a transparent background works best. Under 5MB.
      </p>
    </div>
  );
}
