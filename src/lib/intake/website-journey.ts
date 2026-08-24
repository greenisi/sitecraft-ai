import type { SiteType } from '@/lib/utils/constants';

export type JourneyStage = 'new' | 'established' | 'replace';
export type BusinessModel =
  | 'local-service'
  | 'professional-service'
  | 'ecommerce'
  | 'restaurant'
  | 'creator'
  | 'saas'
  | 'other';

export interface WebsiteJourneyAnswers {
  stage: JourneyStage;
  businessModel: BusinessModel;
  businessName: string;
  industry: string;
  location: string;
  offer: string;
  featuredOffer: string;
  idealCustomer: string;
  customerProblem: string;
  proof: string;
  yearsInBusiness: string;
  primaryAction: 'call' | 'quote' | 'book' | 'buy' | 'visit' | 'subscribe';
  contactDetails: string;
  brandFeelings: string[];
  colorPreference: string;
  inspirationUrl: string;
  avoid: string;
  buildQuality: 'smart' | 'ultra';
}

export const EMPTY_WEBSITE_JOURNEY: WebsiteJourneyAnswers = {
  stage: 'established',
  businessModel: 'local-service',
  businessName: '',
  industry: '',
  location: '',
  offer: '',
  featuredOffer: '',
  idealCustomer: '',
  customerProblem: '',
  proof: '',
  yearsInBusiness: '',
  primaryAction: 'quote',
  contactDetails: '',
  brandFeelings: [],
  colorPreference: '',
  inspirationUrl: '',
  avoid: '',
  buildQuality: 'smart',
};

export function modelTierForJourney(answers: WebsiteJourneyAnswers): 'pro-build' | 'architect' {
  return answers.buildQuality === 'ultra' ? 'architect' : 'pro-build';
}

export function siteTypeForJourney(model: BusinessModel): SiteType {
  if (model === 'ecommerce' || model === 'restaurant') return 'ecommerce';
  if (model === 'saas') return 'saas';
  if (model === 'local-service') return 'local-service';
  return 'business';
}

export function backendForJourney(answers: WebsiteJourneyAnswers) {
  if (answers.businessModel === 'ecommerce' || answers.businessModel === 'restaurant') {
    return {
      title: 'Order operations center',
      description: 'Products, customer details, orders, payments, and fulfillment status in one workspace.',
    };
  }
  if (answers.primaryAction === 'book') {
    return {
      title: 'Booking and follow-up workspace',
      description: 'Appointments, customer details, confirmations, reminders, and follow-up tasks in one place.',
    };
  }
  if (answers.primaryAction === 'subscribe') {
    return {
      title: 'Subscriber and inquiry workspace',
      description: 'Signups, customer questions, contact history, and owner follow-ups in one place.',
    };
  }
  return {
    title: 'Lead and customer workspace',
    description: 'Every inquiry, customer detail, status, and next action captured automatically.',
  };
}

export function recommendedPages(answers: WebsiteJourneyAnswers): string[] {
  if (answers.businessModel === 'ecommerce') return ['Home', 'Shop', 'About', 'FAQ', 'Contact'];
  if (answers.businessModel === 'restaurant') return ['Home', 'Menu', 'About', 'Visit', 'Contact'];
  if (answers.businessModel === 'saas') return ['Home', 'Features', 'Pricing', 'About', 'Contact'];
  if (answers.businessModel === 'creator') return ['Home', 'Work', 'About', 'Services', 'Contact'];
  return ['Home', 'Services', 'About', 'Reviews', 'Contact'];
}

const ACTION_LABELS: Record<WebsiteJourneyAnswers['primaryAction'], string> = {
  call: 'call the business',
  quote: 'request a quote or estimate',
  book: 'book an appointment',
  buy: 'purchase a product',
  visit: 'visit the location',
  subscribe: 'sign up or subscribe',
};

export function buildWebsiteBrief(answers: WebsiteJourneyAnswers): string {
  const feelings = answers.brandFeelings.length
    ? answers.brandFeelings.join(', ')
    : 'credible, clear, and welcoming';
  const pages = recommendedPages(answers).join(', ');
  const backend = backendForJourney(answers);

  return `Build a premium, complete multi-page website for ${answers.businessName}, a ${answers.industry} business${answers.location ? ` serving ${answers.location}` : ''}.

BUSINESS CONTEXT
This is ${answers.stage === 'new' ? 'a new business establishing its first strong online presence' : answers.stage === 'replace' ? 'an established business replacing an existing website that no longer represents its quality' : 'an established business ready for a stronger customer experience'}. The core offer is: ${answers.offer}. ${answers.featuredOffer ? `Lead with this priority offer: ${answers.featuredOffer}.` : ''}

CUSTOMER REALITY
The ideal customer is ${answers.idealCustomer}. The problem or concern they need resolved is: ${answers.customerProblem}. The website must reduce uncertainty, make the next step feel easy, and guide visitors toward one primary action: ${ACTION_LABELS[answers.primaryAction]}.

TRUST AND PROOF
Use these real credibility signals prominently: ${answers.proof || 'clearly marked placeholders for reviews, results, credentials, and guarantees that the owner can replace'}. ${answers.yearsInBusiness ? `The business has ${answers.yearsInBusiness} years of experience.` : ''} Never invent awards, customer counts, ratings, certifications, guarantees, prices, addresses, or statistics.

DESIGN DIRECTION
The experience should feel ${feelings}. ${answers.colorPreference ? `Color preference: ${answers.colorPreference}.` : 'Choose an industry-appropriate palette with an unmistakable high-contrast call to action.'} ${answers.inspirationUrl ? `Use ${answers.inspirationUrl} only as directional inspiration; create an original design.` : ''} Use strong typography, meaningful imagery, generous spacing, and one distinctive layout moment that feels specific to this business. Avoid generic AI gradients, repetitive card grids, vague headlines, and template-like filler. ${answers.avoid ? `Also avoid: ${answers.avoid}.` : ''}

CONTENT AND JOURNEY
Create these pages: ${pages}. Write concrete, customer-centered copy that explains the offer, demonstrates trust, handles common objections, and repeatedly supports the primary action without feeling pushy. Include the supplied contact information exactly where appropriate: ${answers.contactDetails || 'use clearly labeled placeholders and do not invent details'}.

CONNECTED BUSINESS SYSTEM
Prepare the site for the recommended backend: ${backend.title}. ${backend.description} Forms, booking actions, checkout actions, and contact calls-to-action must use Site Craft's supported project endpoints and flow into the owner's workspace. After generation, recommend the smallest useful first automation based on the primary action.

OWNER'S ORIGINAL DETAILS
Business name: ${answers.businessName}
Industry: ${answers.industry}
Offer: ${answers.offer}
Ideal customer: ${answers.idealCustomer}
Customer problem: ${answers.customerProblem}
Proof: ${answers.proof || 'Not supplied yet'}
Primary action: ${ACTION_LABELS[answers.primaryAction]}`;
}

export function journeyReadiness(answers: WebsiteJourneyAnswers): number {
  const weightedFields: Array<[unknown, number]> = [
    [answers.businessName, 12],
    [answers.industry, 10],
    [answers.offer, 16],
    [answers.idealCustomer, 14],
    [answers.customerProblem, 12],
    [answers.proof, 10],
    [answers.contactDetails, 8],
    [answers.brandFeelings.length, 10],
    [answers.featuredOffer, 4],
    [answers.location, 4],
  ];
  return weightedFields.reduce((score, [value, points]) => score + (value ? points : 0), 0);
}
