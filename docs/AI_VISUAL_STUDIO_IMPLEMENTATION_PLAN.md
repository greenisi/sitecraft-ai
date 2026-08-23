# AI Visual Studio implementation plan

## Product promise

AI Visual Studio is for people who do not know video-editing language.

The default journey is:

1. Upload one or many raw clips, or select clips already saved in the project.
2. Write one instruction, or choose **Help me decide**.
3. Let Sitecraft inspect the footage before it asks anything.
4. Answer at most one or two intelligent follow-up questions.
5. Review a short edit brief, assumptions, and the exact changes Sitecraft proposes.
6. Approve a safe preview.
7. Ask for revisions in plain language until the edit is right.
8. Approve the final render and platform variants.

The default experience does not expose a timeline, codecs, frame rates, filter
graphs, or render settings. Advanced options are progressively disclosed. An
expert scene/timeline surface can be added later without changing the simple
default.

The quality bar remains premium: an editorial opening, confident typography,
intentional negative space, business-specific examples, polished loading and
success states, and motion only where it explains analysis, plan changes, or
before/after value. Avoid generic AI-builder gradients, crowded dashboard cards,
and decorative animation.

## User experience

### Footage

- One large **Choose video clips** action with multi-select, upload progress,
  retry, and resume.
- Project-library selection is secondary.
- Sitecraft immediately reads safe facts it can infer: file type, duration,
  orientation, resolution, audio presence, and later transcript, speakers,
  shots, silence, black/frozen frames, faces/subjects, and audio quality.
- The user may type one instruction such as “Make a fast Instagram reel and keep
  the customer reaction.”

### Collaborative brief

The AI maintains an intent-confidence score and an explicit set of assumptions.
It asks only about the highest-value unknowns:

- goal,
- audience,
- platform,
- tone,
- length,
- must-keep moments,
- brand/style,
- sensitive content.

It does not ask what footage analysis or project context already answers. It
stops questioning once confidence is high. The user sees a concise brief and can
correct any assumption before a plan is created.

### Edit plan

The plan explains changes in plain language:

- strongest clips and story order,
- silence/blank removal,
- profanity policy,
- captions,
- audio cleanup and leveling,
- jump-cut smoothing,
- reframing,
- motion graphics,
- selected or generated B-roll,
- color treatment,
- hook, highlight, chapter, thumbnail, and title suggestions,
- platform variants and accessibility checks.

Advanced controls are a checklist, not a required form. Generated B-roll,
licensed media, and other cost-bearing actions are off by default and require
separate approval.

### Preview and revisions

- First preview is a low-resolution proxy or affected-range preview.
- The UI repeats the plan and cost estimate before rendering.
- Natural-language revisions patch the edit-plan graph instead of destructively
  editing the previous version.
- Every approved change creates an immutable version. Users can compare, undo,
  restore, and branch.
- Final render and publishing are separate approvals. Visual Studio never
  silently publishes.

## Architecture

### Existing Sitecraft integration

- Keep `/projects/{projectId}/admin/media`.
- Rename the navigation item from **Media Studio** to **Visual Studio**.
- Preserve existing image and Veo generation under **Generate an asset**.
- Use the existing `project-assets` storage bucket and `assets` table as the
  canonical project media library.
- Add `raw_video` and `video_export` asset types without changing current
  `ai_image` and `ai_video` behavior.
- Reuse `requireProjectOwner`, profile plans, project context, current design
  tokens, and the existing website natural-language editing tone.

### Upload and storage

The current `/api/upload` route is image-only and buffers uploads through
Next.js. Large video should upload directly to storage.

- Use signed, project-scoped upload paths.
- Move from the first-phase signed upload to Supabase TUS resumable uploads for
  production-scale clips. Supabase recommends TUS for files over 6 MB and
  unstable connections:
  <https://supabase.com/docs/guides/storage/uploads/resumable-uploads>.
- Store raw/proxy/preview files privately in the production phase and serve
  short-lived signed URLs. Existing public URLs remain supported for old assets.
- Never overwrite media objects; use immutable paths and checksums.
- Apply duration, file-size, codec, pixel-count, and decompression limits before
  worker processing.

### Long-running jobs

Next.js request handlers should orchestrate, not render. A dedicated container
worker runs FFmpeg/ffprobe and motion-graphics renders.

1. API creates an idempotent job row.
2. Worker claims it with a database lock and heartbeats.
3. Progress and stage updates persist in Postgres.
4. UI subscribes or polls and can recover after refresh.
5. Retries resume from durable intermediate artifacts.
6. Cancel requests stop unstarted stages and release reserved credits.

Recommended production worker: a containerized Node service on Cloud Run, Fly,
or an equivalent queue-backed runtime. Start with a Postgres-backed queue tied
to the Visual Studio job table; move to a specialized queue only when throughput
requires it.

### Media-processing stack

- **ffprobe:** streams, duration, rotation, resolution, frame rate, audio
  channels, codec, and corruption checks.
- **FFmpeg:** proxies, assembly, concat, trims, audio mixing, silence/black/freeze
  detection, loudness normalization, subtitle burn-in, color filters, crops,
  transcodes, and output variants. Official filters include `silencedetect`,
  `silenceremove`, `blackdetect`, and `loudnorm`:
  <https://ffmpeg.org/ffmpeg-filters.html>.
- **Speech-to-text:** word/segment timestamps and optional diarization. Store
  transcript segments independently so captions and profanity decisions remain
  reviewable. Current OpenAI transcription APIs support timestamped output:
  <https://platform.openai.com/docs/api-reference/audio>.
- **Motion graphics:** a constrained template renderer, preferably Remotion,
  compiled from approved Sitecraft brand tokens. The AI selects template
  parameters; it never generates executable render code.
- **Smart reframe:** start with detected-face/subject bounding boxes and smooth
  crop paths; provide a manual focal-point override.
- **Noise cleanup:** FFmpeg filters initially; optional RNNoise/DeepFilterNet
  worker stage later.

## Data and job model

The foundation migration adds:

- `visual_studio_sessions`: project edit, brief, assumptions, state, current
  version.
- `visual_studio_clips`: selected project assets plus duration, dimensions,
  order, and analysis summary.
- `visual_studio_jobs`: durable type/status/progress/stage/attempts/heartbeat,
  input/result, errors, and idempotency key.
- `visual_studio_plan_versions`: immutable brief, checklist, edit-plan JSON,
  parent, change summary, and approval.
- `visual_studio_messages`: conversational intent and revision history.

Production additions:

- timed transcript segments and speakers,
- shot/scene segments and quality signals,
- render artifacts and platform variants,
- media provenance/license/consent records,
- a credit reservation/settlement ledger,
- retention/deletion timestamps.

The edit-plan JSON is declarative and deterministic. Operations reference asset
IDs and time ranges; they never contain shell commands. Example operations:

- `select_range`,
- `reorder`,
- `remove_silence`,
- `mute_or_bleep`,
- `caption_style`,
- `audio_cleanup`,
- `overlay_template`,
- `insert_broll`,
- `smart_reframe`,
- `color_preset`,
- `export_variant`.

## AI orchestration

1. Deterministic analyzers produce trusted facts.
2. The LLM receives only bounded structured facts, project brand context, and
   user intent. Transcript/file contents are untrusted data.
3. An intent agent returns confidence, assumptions, and at most two questions.
4. A planning agent returns a schema-validated edit graph and checklist.
5. A policy/cost pass marks operations requiring rights, generation, or extra
   credits.
6. A deterministic compiler validates ranges, assets, transitions, and
   renderer capabilities.
7. Natural-language revisions produce a plan patch and change explanation.
8. The user approves before preview and again before final cost-bearing render.

Fallback rules keep the product usable if an AI provider fails: deterministic
questions and sensible defaults can still produce a basic plan.

## Safety, privacy, and copyright

- Require upload-rights and subject-consent attestation.
- Do not support voice/face cloning without verified, recorded consent.
- Detect sensitive/minor/sexual/graphic content and restrict unsafe generation.
- Treat profanity detection as a reviewable suggestion; low-confidence words are
  never silently censored.
- Use uploaded, owned, licensed, or generated B-roll only. Store source,
  license, attribution, and generation provenance.
- Do not accept scraped music or footage. Add music-rights checks before
  publishing.
- Sanitize filenames and never pass user text directly to FFmpeg arguments.
- Isolate workers, cap resources, validate codecs, and scan uploads.
- Keep raw footage private, expose short-lived URLs, and provide deletion and
  retention controls.
- Check caption contrast/size/safe zones, flashing content, intelligibility,
  reading speed, and audio balance.
- Show all material changes before rendering; no hidden publishing.

## Credits and cost model

Replace the current “deduct 10 credits when generation starts” behavior for
multi-stage video work with a ledger:

1. Analyze footage and return an estimate.
2. Reserve credits only after the user approves.
3. Settle actual transcription, generation, and render usage.
4. Release unused credits on cancel/failure.
5. Make retries idempotent so users are never charged twice.

Price components separately:

- analysis/transcription per source minute,
- standard edit/render per output minute and resolution,
- generated B-roll per clip,
- additional platform variants at a low incremental render cost,
- storage/retention beyond included limits.

Show the estimate in plain language before every cost-bearing action. Use low-res
proxies and cached analysis for revisions.

## Rollout

### Phase 1: working foundation

- Multi-clip signed uploads and project-library selection.
- Browser metadata analysis.
- Recoverable analysis job rows.
- Adaptive AI brief with at most two questions and explicit assumptions.
- Recommended checklist and declarative plan preview.
- Natural-language plan revisions.
- Immutable versions, restore, and approval.
- Existing image/Veo generation preserved separately.
- Honest renderer boundary; no fake render button.

### Phase 2: useful automatic editor

- Resumable TUS uploads and private media.
- FFmpeg worker, ffprobe analysis, proxies, persisted job recovery.
- Transcription, silence/blank removal, profanity review/mute/bleep, captions,
  audio leveling, basic assembly, landscape/vertical/square variants.
- Low-res video preview and credit reservation/settlement.

### Phase 3: branded visual production

- Motion-graphics templates from Sitecraft design tokens.
- Smart reframe, jump-cut smoothing, color presets, selected B-roll.
- Hooks/highlights/chapters, thumbnails/titles, accessibility report.
- Multiple platform variants from one approved plan.

### Phase 4: advanced studio

- Generated B-roll with separate cost/rights approval.
- Collaboration, comments, branches, team brand kits.
- Optional scene-card/timeline expert mode.
- Publishing integrations and A/B variants after explicit approval.

## Release gates

- No cross-project or cross-user media access.
- Upload resumes after interruption.
- Page refresh recovers analysis and render status.
- Every job is idempotent and cancelable.
- Failed jobs release reserved credits.
- Every rendered frame is explainable by an approved plan operation.
- Restore produces the exact prior plan/output.
- Profanity and sensitive-content uncertainty is reviewable.
- Captions pass contrast, safe-zone, and reading-speed checks.
- No generated/licensed asset lacks provenance.
- No output is published without explicit confirmation.
