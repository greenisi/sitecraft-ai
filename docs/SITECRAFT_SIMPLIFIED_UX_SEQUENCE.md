# Sitecraft simplified user-journey sequence

## Standard

The product should be understandable by a third grader without reducing the
quality of what Sitecraft produces.

Every main screen should have:

- one obvious primary action,
- a short plain-language title,
- smart defaults,
- visible progress and completion,
- reversible actions,
- contextual help at the moment it is needed,
- advanced controls behind **Advanced**,
- no internal model, code, file, deployment, or payment terminology unless the
  user asks for it.

## Non-negotiable quality bar

Simple must never mean generic. The product itself is proof of the quality
customers will receive.

- Give every major journey a memorable opening moment and one unmistakable
  visual priority.
- Use editorial typography, deliberate scale, generous spacing, and strong
  contrast instead of crowded card grids.
- Use real business-specific imagery, examples, proof, and language. Avoid
  interchangeable AI-builder copy and template-like section rhythms.
- Keep gradients, glows, glass effects, and decorative badges restrained. They
  should support hierarchy, not become the identity.
- Design empty, loading, error, approval, and success states to the same standard
  as the happy path.
- Motion must guide attention, explain progress, reveal a transformation, or
  demonstrate value. Decorative motion is removed.
- Respect reduced-motion preferences, keyboard navigation, readable focus
  states, contrast, and comfortable reading widths.
- The premium two-path funnel and Visual Studio share one design language:
  confident, cinematic, business-specific, calm, and conversion-focused.

## High-impact sequence

### 0. Premium two-path funnel

The owner's portfolio/business-card landing experience should begin with one
simple segmentation question:

**How would you like to grow your business?**

- **Do it for me** — premium hands-on strategy and implementation, leading to a
  consultation booking.
- **Build it with AI** — the simplified Sitecraft self-serve onboarding.

Do not present both as competing equal CTAs in the hero. Ask the segmentation
question first, then make the selected path the obvious primary action. Keep a
quiet “Choose the other path” link available.

Both paths use the same premium brand, proof, language, and quality bar. Pricing
appears after segmentation: service pricing belongs to the consultation path;
software plans and credits belong to the self-serve path. This prevents visitors
from comparing unlike offers before they understand which experience fits them.

#### “Do it for me” consultation funnel

The premium path is a short guided story, not a booking utility. Do not force
account creation and do not send the visitor through a generic contact form.

1. Open with a premium promise tied to business transformation.
2. Present the two-path choice: **Do it for me** / **Build it with AI**.
3. After **Do it for me**, ask a few visually engaging, adaptive questions about
   the business, current bottleneck, and desired outcome.
4. Show one tailored insight, mini before/after transformation, or relevant
   portfolio proof based on those answers.
5. Explain the personalized process, what the prospect receives, and the
   expected outcome.
6. Present the embedded calendar as the natural final step.

Keep this journey cinematic but fast: elegant transitions, strong visual proof,
keyboard/focus support, reduced-motion handling, and no bloated quiz. The user
should reach the calendar in roughly one minute.

At booking, collect only:

- name,
- business,
- email,
- phone,
- one short question: “What would you most like help with?”
- a separate, unchecked SMS-consent checkbox with clear frequency and opt-out
  language.

After the time is chosen, continue the same branded journey:

1. Create the appointment and persist lead source/campaign context.
2. Send email confirmation and reminders.
3. Send SMS confirmation/reminders only when explicit consent is recorded.
4. Notify the owner by email, with optional text notification.
5. Show a polished confirmation/pre-call page with meeting details, an obvious
   reschedule/cancel link, a short preparation checklist, a few optional
   questions, relevant portfolio examples, and clear next steps.

Keep scheduling and messaging providers behind adapter interfaces until a
specific vendor is selected. Sitecraft already has project booking and
notification concepts, so reuse its data/consent/audit patterns where suitable,
but keep this owner-level sales funnel separate from a generated site's customer
bookings.

### 1. Onboarding

Primary action: **Tell us what you do**.

- Ask business name and one sentence about the business.
- Infer industry, audience, pages, and visual direction.
- Ask one follow-up only when genuinely blocked.
- Show “Here is what I understood” before generation.
- Defer billing, domains, integrations, and advanced design choices.

### 2. Project creation

Primary action: **Build my site**.

- Replace configuration-first screens with a conversational brief.
- Offer examples as optional prompts.
- Put site type, model tier, section list, and design tokens under **Advanced**.
- Explain the expected output and credit estimate before starting.

### 3. Generation

Primary state: **Sitecraft is building your site**.

- Use five human stages: Understanding, Designing, Writing, Building, Checking.
- Keep exact technical stages in an optional details view.
- Let the user safely leave; show persistent progress in the workspace.
- Recover after connection loss and explain whether work is still running.

### 4. Editing

Primary action: **Tell Sitecraft what to change**.

- Default to plain-language edits with a preview of intended changes.
- Keep point-and-click editing available as **Edit it myself**.
- Put code and file names behind developer/expert mode.
- Every change creates a version with undo/redo and restore.
- Explain when a request is a small edit versus a larger rebuild.

### 5. Publishing

Primary action: **Publish my site**.

- Show one preflight card: site name, address, missing essentials, and what will
  become public.
- Move hosting/version/deployment details under **Advanced**.
- Use clear states: Checking, Publishing, Live.
- Provide a reversible rollback to the previous version.

### 6. Settings and billing

Primary action depends on context: **Manage plan** or **Update account**.

- Separate Account, Plan & credits, Team, and Notifications.
- Explain credits in outcomes, not tokens/models.
- Show current usage, next charge, and what an upgrade unlocks.
- Confirm cost-bearing actions immediately before purchase.
- Keep invoices, API/provider details, and power settings under **Advanced**.

### 7. Domains

Primary action: **Use my domain**.

- Start with two choices: Buy a new domain / Connect one I own.
- Ask for the domain, then show only the next required step.
- Translate DNS into “Copy this value here” with verification progress.
- Hide registrar records and diagnostic detail under **Advanced help**.
- Never imply a domain is live until verification succeeds.

### 8. Payments

Primary action: **Connect Stripe**.

- Explain where money goes and what Sitecraft can access.
- Show simple states: Not connected, Finish setup, Ready.
- Defer account IDs, capabilities, and webhook details.
- Preview checkout behavior before accepting a real payment.
- Keep per-project overrides behind **Use a different Stripe for this site**.

### 9. Project admin

Primary action: **Run this business**.

- Keep **Workspace** as the overview and next-best-action surface.
- Group navigation into:
  - Website: Setup, Pages/content, Gallery, Visual Studio.
  - Business: Services/products, Bookings/orders, Leads/reviews.
  - Grow: Marketing, domains, payments.
  - Settings: Business info, notifications, advanced.
- On small screens show the next action and a single **All tools** menu instead
  of the full horizontal list.
- Use empty states that explain why the feature matters and offer one action.

## Implementation order

1. Establish shared plain-language labels, page-header pattern, primary-action
   pattern, progress pattern, and **Advanced** disclosure component.
2. Simplify onboarding/project creation into one conversational brief.
3. Unify generation status and recovery across dashboard/workspace.
4. Make natural-language edit the default and version history persistent.
5. Consolidate publish preflight and rollback.
6. Reorganize project admin navigation without removing routes.
7. Simplify settings/billing, then domains and payments.
8. Run usability testing with first-time nontechnical users before broad visual
   redesign.

## Changes applied with Visual Studio

- Renamed **Media Studio** to **Visual Studio**.
- Default surface is **Edit my footage**; existing asset generation is secondary.
- Frames the outcome as turning raw phone clips into polished testimonials,
  promos, ads, and social content—not learning generic editing software.
- Reduced the core flow to Footage, Brief, Plan.
- One or two adaptive questions maximum.
- Assumptions and planned changes are visible before approval.
- Advanced checklist is collapsed by default.
- Natural-language revisions and restoreable versions are first-class.
- No render button is shown while rendering is unavailable.

Broader screens are intentionally not rewritten in this phase. The sequence
above should be applied route by route with focused verification, preserving all
current capabilities.
