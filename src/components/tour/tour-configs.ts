import type { TourConfig } from '@/stores/tour-store';

// ── Dashboard Tour ────────────────────────────────────────────────────
export const dashboardTour: TourConfig = {
  id: 'dashboard',
  welcomeTitle: 'Welcome to SiteCraft! \u2728',
  welcomeDescription:
    'Let us show you around your new AI-powered website builder. This quick tour will help you get started in no time.',
  steps: [
    {
      target: '[data-tour="new-project-btn"]',
      title: 'Create a New Project',
      description:
        'Click here to start building a new website. Just describe what you want and our AI will generate a professional site for you in seconds.',
      placement: 'bottom',
      spotlightPadding: 6,
    },
    {
      target: '[data-tour="project-grid"]',
      title: 'Your Projects',
      description:
        'All your websites appear here as cards with live previews. You can see the actual design of each site right from the dashboard.',
      placement: 'top',
      spotlightPadding: 12,
    },
    {
      target: '[data-tour="sidebar-templates"]',
      title: 'Browse Templates',
      description:
        'Explore professionally designed templates to kickstart your project. Choose from restaurants, portfolios, SaaS, and more.',
      placement: 'right',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="sidebar-settings"]',
      title: 'Your Settings',
      description:
        'Manage your profile, check your credits balance, and configure your account preferences here.',
      placement: 'right',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="credits-display"]',
      title: 'AI Credits',
      description:
        'This shows your remaining AI generation credits. Each website generation or edit uses credits. Keep an eye on your balance!',
      placement: 'bottom',
      spotlightPadding: 6,
    },
  ],
};

// ── Project Editor Tour ───────────────────────────────────────────────
export const editorTour: TourConfig = {
  id: 'editor',
  welcomeTitle: 'Your Website Editor \u{1F3A8}',
  welcomeDescription:
    'This is where the magic happens! Chat with AI to build and edit your website, preview changes in real-time, and publish when ready.',
  steps: [
    {
      target: '[data-tour="chat-input"]',
      title: 'AI Chat',
      description:
        'Type what you want to change here. Try things like "Change the color scheme to blue" or "Add a testimonials section." The AI understands natural language!',
      placement: 'top',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="preview-area"]',
      title: 'Live Preview',
      description:
        'See your website come to life in real-time. Every change you make through chat or the visual editor updates here instantly.',
      placement: 'left',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="page-tabs"]',
      title: 'Page Navigation',
      description:
        'Switch between different pages of your website. Each page (Home, About, Services, Contact) is a separate tab you can preview and edit.',
      placement: 'bottom',
      spotlightPadding: 6,
    },
    {
      target: '[data-tour="viewport-switcher"]',
      title: 'Responsive Preview',
      description:
        'Test how your website looks on Desktop, Tablet, and Mobile devices. Make sure your site looks great everywhere!',
      placement: 'bottom',
      spotlightPadding: 6,
    },
    {
      target: '[data-tour="edit-btn"]',
      title: 'Visual Editor',
      description:
        'Open the powerful visual editor to click and style any element directly. Change colors, fonts, spacing, and links with precision controls.',
      placement: 'bottom',
      spotlightPadding: 6,
    },
    {
      target: '[data-tour="export-btn"]',
      title: 'Export Your Site',
      description:
        'Download your complete website as a ZIP file with all the code, ready to host anywhere.',
      placement: 'bottom',
      spotlightPadding: 6,
    },
    {
      target: '[data-tour="publish-btn"]',
      title: 'Publish to the Web',
      description:
        'Go live with one click! Publish your website to a live URL and share it with the world.',
      placement: 'bottom',
      spotlightPadding: 6,
    },
  ],
};

// ── Visual Editor Tour ────────────────────────────────────────────────
export const visualEditorTour: TourConfig = {
  id: 'visual-editor',
  welcomeTitle: 'Visual Editor \u{1F58C}\uFE0F',
  welcomeDescription:
    'Click any element to select it, then use the properties panel to customize every detail. Double-click text to edit it inline!',
  steps: [
    {
      target: '[data-tour="ve-style-tab"]',
      title: 'Style Tab',
      description:
        'Change colors, backgrounds, borders, border radius, and element size. Everything you need to make elements look exactly how you want.',
      placement: 'right',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="ve-spacing-tab"]',
      title: 'Spacing Tab',
      description:
        'Fine-tune padding and margin with an intuitive box model editor. Drag to adjust or type exact pixel values.',
      placement: 'right',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="ve-type-tab"]',
      title: 'Typography Tab',
      description:
        'Control fonts, sizes, weight, line height, letter spacing, and text alignment. Make your text beautiful.',
      placement: 'right',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="ve-fx-tab"]',
      title: 'Effects Tab',
      description:
        'Add opacity, shadows, change display modes, and control overflow behavior for advanced styling.',
      placement: 'right',
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="ve-save-btn"]',
      title: 'Save Your Changes',
      description:
        'When you\'re happy with your edits, click Save to apply them permanently. You can also Discard to undo all changes.',
      placement: 'top',
      spotlightPadding: 6,
    },
  ],
};

// ── Templates Tour ────────────────────────────────────────────────────
export const templatesTour: TourConfig = {
  id: 'templates',
  welcomeTitle: 'Template Gallery \u{1F5BC}\uFE0F',
  welcomeDescription:
    'Browse our collection of professionally designed templates. Each one is fully customizable with AI to match your brand.',
  steps: [
    {
      target: '[data-tour="template-grid"]',
      title: 'Choose a Template',
      description:
        'Browse through our curated template collection. Each card shows a preview, name, and category. Click on any template to start customizing it.',
      placement: 'top',
      spotlightPadding: 12,
    },
    {
      target: '[data-tour="template-categories"]',
      title: 'Filter by Category',
      description:
        'Filter templates by industry — restaurants, portfolios, SaaS, e-commerce, and more. Find the perfect starting point for your project.',
      placement: 'bottom',
      spotlightPadding: 6,
    },
  ],
};

// ── Settings Tour ─────────────────────────────────────────────────────
export const settingsTour: TourConfig = {
  id: 'settings',
  welcomeTitle: 'Account Settings \u2699\uFE0F',
  welcomeDescription:
    'Manage your profile and subscription details from here.',
  steps: [
    {
      target: '[data-tour="settings-profile"]',
      title: 'Your Profile',
      description:
        'View and update your profile information including your name, email, and avatar.',
      placement: 'bottom',
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="settings-plan"]',
      title: 'Plan & Credits',
      description:
        'Check your current plan, see how many AI credits you have remaining, and upgrade if you need more.',
      placement: 'top',
      spotlightPadding: 8,
    },
  ],
};

// ── Map of all tours by ID ────────────────────────────────────────────
export const tourConfigMap: Record<string, TourConfig> = {
  dashboard: dashboardTour,
  editor: editorTour,
  'visual-editor': visualEditorTour,
  templates: templatesTour,
  settings: settingsTour,
};
