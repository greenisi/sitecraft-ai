'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { VisualStudioEditor } from '@/components/media/visual-studio-editor';

interface MediaAsset {
  id: string;
  file_name: string;
  file_type: 'ai_image' | 'ai_video';
  public_url: string;
  size_bytes: number | null;
  created_at: string;
}

type Mode = 'image' | 'video';
type StudioSurface = 'edit' | 'generate';

export default function MediaStudioPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [surface, setSurface] = useState<StudioSurface>('edit');
  const [mode, setMode] = useState<Mode>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9');
  const [generating, setGenerating] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryAdded, setGalleryAdded] = useState<Record<string, 'adding' | 'added' | 'error'>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/media`);
      if (res.ok) {
        const json = await res.json();
        setAssets(json.assets || []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAssets();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadAssets]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setErrorText(null);

    try {
      if (mode === 'image') {
        setStatusText('Generating image…');
        const res = await fetch(`/api/projects/${projectId}/media/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Image generation failed');
        setAssets((prev) => [json.asset, ...prev]);
        setStatusText(null);
        setGenerating(false);
      } else {
        setStatusText('Starting video generation…');
        const res = await fetch(`/api/projects/${projectId}/media/video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Video generation failed to start');

        const op = json.operationName as string;
        setStatusText('Generating video — this takes 1-3 minutes…');
        pollRef.current = setInterval(async () => {
          try {
            const pollRes = await fetch(
              `/api/projects/${projectId}/media/video?op=${encodeURIComponent(op)}`
            );
            const pollJson = await pollRes.json();
            if (pollJson.error) throw new Error(pollJson.error);
            if (pollJson.done && pollJson.asset) {
              if (pollRef.current) clearInterval(pollRef.current);
              setAssets((prev) => [pollJson.asset, ...prev]);
              setStatusText(null);
              setGenerating(false);
            }
          } catch (pollErr) {
            if (pollRef.current) clearInterval(pollRef.current);
            setErrorText(pollErr instanceof Error ? pollErr.message : 'Video generation failed');
            setStatusText(null);
            setGenerating(false);
          }
        }, 8000);
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Generation failed');
      setStatusText(null);
      setGenerating(false);
    }
  }

  async function addToGallery(asset: MediaAsset) {
    setGalleryAdded((prev) => ({ ...prev, [asset.id]: 'adding' }));
    try {
      const res = await fetch(`/api/projects/${projectId}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: asset.public_url, title: 'AI generated', category: 'ai' }),
      });
      setGalleryAdded((prev) => ({ ...prev, [asset.id]: res.ok ? 'added' : 'error' }));
    } catch {
      setGalleryAdded((prev) => ({ ...prev, [asset.id]: 'error' }));
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="pk-fade-up">
        <h1 className="text-2xl font-bold text-white">AI Visual Studio</h1>
        <p className="text-sm text-gray-400 mt-1">
          Edit your footage with plain language, or generate a new image or short AI clip.
        </p>
      </div>

      <div className="inline-flex rounded-full border border-gray-800 bg-gray-950 p-1">
        <button
          type="button"
          onClick={() => setSurface('edit')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            surface === 'edit' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Edit my footage
        </button>
        <button
          type="button"
          onClick={() => setSurface('generate')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            surface === 'generate' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Generate an asset
        </button>
      </div>

      {surface === 'edit' ? (
        <VisualStudioEditor projectId={projectId} />
      ) : (
        <>
      <div className={`rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4 pk-fade-up pk-stagger-1 ${generating ? 'pk-glow border-purple-700/60' : ''}`}>
        <div className="flex gap-2">
          {(['image', 'video'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={generating}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {m === 'image' ? 'Image' : 'Video'}
            </button>
          ))}
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
            disabled={generating}
            className="ml-auto bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2"
          >
            <option value="16:9">Landscape (16:9)</option>
            {mode === 'image' && <option value="1:1">Square (1:1)</option>}
            <option value="9:16">Portrait (9:16)</option>
          </select>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating}
          rows={3}
          placeholder={
            mode === 'image'
              ? 'e.g. A pristine freshly-mowed lawn in front of a modern suburban home, golden hour lighting, professional photography'
              : 'e.g. Slow cinematic drone shot rising over a landscaping crew finishing a backyard patio at sunset'
          }
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-purple-500 focus:outline-none resize-none"
        />

        <div className="flex items-center gap-4">
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="px-5 py-2.5 rounded-lg pk-btn disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
          >
            {generating ? 'Generating…' : mode === 'image' ? 'Generate Image' : 'Generate Video'}
          </button>
          {statusText && (
            <span className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="pk-working">{statusText}</span>
            </span>
          )}
          {errorText && <span className="text-sm text-red-400">{errorText}</span>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Generated media</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : assets.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing yet — describe what you need above and generate your first asset.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {assets.map((asset, i) => (
              <div
                key={asset.id}
                className={`rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden group pk-card pk-scale-in pk-stagger-${Math.min(i + 1, 6)}`}
              >
                {asset.file_type === 'ai_video' ? (
                  <video
                    src={asset.public_url}
                    controls
                    playsInline
                    className="w-full aspect-video object-cover bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.public_url}
                    alt={asset.file_name}
                    className="w-full aspect-video object-cover"
                  />
                )}
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">
                    {asset.file_type === 'ai_video' ? 'Video' : 'Image'} ·{' '}
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-3">
                    {asset.file_type === 'ai_image' && (
                      <button
                        onClick={() => addToGallery(asset)}
                        disabled={galleryAdded[asset.id] === 'adding' || galleryAdded[asset.id] === 'added'}
                        className="text-xs text-purple-400 hover:text-purple-300 disabled:text-gray-500"
                      >
                        {galleryAdded[asset.id] === 'added' ? 'In gallery ✓'
                          : galleryAdded[asset.id] === 'adding' ? 'Adding…'
                          : galleryAdded[asset.id] === 'error' ? 'Failed — retry'
                          : 'Add to gallery'}
                      </button>
                    )}
                    <a
                      href={asset.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Open
                    </a>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
