#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const profile = process.env.STRIPE_CLI_PROFILE || 'sitecraft-test';
const expectedAccount = (process.env.STRIPE_EXPECTED_ACCOUNT || 'sitecraft').toLowerCase();

if (process.argv.includes('--live')) {
  console.error('Live mode is disabled for the Sitecraft Connect test workflow.');
  process.exit(1);
}

function runStripe(args) {
  return spawnSync('stripe', [...args, '--project-name', profile], {
    encoding: 'utf8',
  });
}

const identity = runStripe(['whoami']);
const identityOutput = `${identity.stdout || ''}\n${identity.stderr || ''}`;

if (identity.status !== 0 || /authenticated:\s+false/i.test(identityOutput)) {
  console.error(`Stripe CLI profile "${profile}" is not authenticated.`);
  console.error('Run: npm run stripe:login:test');
  process.exit(1);
}

if (!/test mode key:\s+available/i.test(identityOutput)) {
  console.error(`Stripe CLI profile "${profile}" does not have test-mode access.`);
  process.exit(1);
}

if (/live mode key:\s+available/i.test(identityOutput)) {
  console.error(
    `Stripe CLI profile "${profile}" has live-mode access. Refusing this test-only workflow.`,
  );
  process.exit(1);
}

if (expectedAccount && !identityOutput.toLowerCase().includes(expectedAccount)) {
  console.error(
    `Stripe CLI profile "${profile}" is not authenticated to the expected Sitecraft account.`,
  );
  process.exit(1);
}

const balance = runStripe(['balance', 'retrieve']);
let balancePayload;
try {
  balancePayload = JSON.parse(balance.stdout || '{}');
} catch {
  balancePayload = null;
}

if (balance.status !== 0 || !balancePayload || balancePayload.livemode !== false) {
  console.error('Could not verify a test-mode API response. No resources were changed.');
  process.exit(1);
}

const accounts = runStripe(['accounts', 'list', '--limit', '1']);
let accountsPayload;
try {
  accountsPayload = JSON.parse(accounts.stdout || '{}');
} catch {
  accountsPayload = null;
}

if (accountsPayload?.error) {
  const message = String(accountsPayload.error.message || '');
  if (message.includes('signed up for Connect')) {
    console.error('Stripe test access is ready, but the Sitecraft account is not enrolled as a Connect platform.');
    console.error('Account-owner action required: finish the test-mode Connect platform setup in Stripe Dashboard.');
    console.error('No connected account or other Stripe resource was created.');
    process.exit(2);
  }

  console.error('Stripe Connect preflight failed without creating resources.');
  process.exit(1);
}

if (accounts.status !== 0 || accountsPayload?.object !== 'list') {
  console.error('Stripe Connect preflight could not verify the platform account.');
  process.exit(1);
}

console.log(`Stripe Connect preflight passed for profile "${profile}".`);
console.log('Mode: test only (live access unavailable).');
console.log('Connect account-list API: reachable.');
console.log('Note: Stripe confirms platform enrollment only when the first test connected account is created.');
console.log('No Stripe resources were created or changed.');
