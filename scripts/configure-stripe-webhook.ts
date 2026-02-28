/**
 * Script to configure Stripe webhook for the main payment endpoint
 * 
 * Run this script once to set up the webhook in Stripe:
 * npx ts-node --project tsconfig.json scripts/configure-stripe-webhook.ts
 * 
 * Or in production: 
 * STRIPE_SECRET_KEY=sk_live_xxx BASE_URL=https://app.innovated.marketing npx ts-node scripts/configure-stripe-webhook.ts
 */

import Stripe from 'stripe';

async function configureWebhook() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const baseUrl = process.env.BASE_URL || 'https://app.innovated.marketing';

  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  });

  const webhookUrl = `${baseUrl}/api/stripe/webhook`;

  console.log('🔧 Configuring Stripe webhook...');
  console.log(`   URL: ${webhookUrl}`);

  try {
    // First, check if webhook already exists
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = existingWebhooks.data.find(
      (w) => w.url === webhookUrl
    );

    if (existingWebhook) {
      console.log('⚠️  Webhook already exists. Updating...');

      const updated = await stripe.webhookEndpoints.update(existingWebhook.id, {
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_failed',
        ],
      });

      console.log('✅ Webhook updated successfully!');
      console.log(`   ID: ${updated.id}`);
      console.log(`   Status: ${updated.status}`);
      console.log('');
      console.log('⚠️  Note: The webhook secret was generated when the webhook was first created.');
      console.log('   If you need a new secret, delete and recreate the webhook in Stripe Dashboard.');
      return;
    }

    // Create new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
      ],
      description: 'SiteCraft AI main payment webhook',
    });

    console.log('✅ Webhook created successfully!');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Secret: ${webhook.secret}`);
    console.log('');
    console.log('🔐 IMPORTANT: Add this webhook secret to your environment variables:');
    console.log(`   STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    console.log('');
    console.log('   For Vercel: Add it in Project Settings > Environment Variables');
    console.log('   Then redeploy for changes to take effect.');
  } catch (error) {
    console.error('❌ Failed to configure webhook:', error);
    process.exit(1);
  }
}

configureWebhook();
