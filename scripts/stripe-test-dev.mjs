#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';

const profile = process.env.STRIPE_CLI_PROFILE || 'sitecraft-test';
const expectedAccount = (process.env.STRIPE_EXPECTED_ACCOUNT || 'sitecraft').toLowerCase();
const events = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'account.updated',
  'capability.updated',
].join(',');

if (process.argv.includes('--live')) {
  console.error('Live mode is disabled for this project workflow.');
  process.exit(1);
}

const auth = spawnSync(
  'stripe',
  ['whoami', '--project-name', profile],
  { encoding: 'utf8' },
);
const authOutput = `${auth.stdout || ''}\n${auth.stderr || ''}`;

if (auth.status !== 0) {
  console.error(`Stripe CLI profile "${profile}" is not authenticated.`);
  console.error('Run: npm run stripe:login:test');
  process.exit(1);
}

if (!/test mode key:\s+available/i.test(authOutput)) {
  console.error(`Stripe CLI profile "${profile}" does not have test-mode access.`);
  process.exit(1);
}

if (/live mode key:\s+available/i.test(authOutput)) {
  console.error(
    `Stripe CLI profile "${profile}" has live-mode access. Refusing this test-only workflow.`,
  );
  process.exit(1);
}

if (expectedAccount && !authOutput.toLowerCase().includes(expectedAccount)) {
  console.error(
    `Stripe CLI profile "${profile}" is not authenticated to the expected Sitecraft account.`,
  );
  console.error('Run: npm run stripe:login:test');
  process.exit(1);
}

console.log(`Using Stripe CLI profile "${profile}" in test mode.`);
console.log('Starting the local webhook listener. Signing secrets remain hidden.');

const listener = spawn(
  'stripe',
  [
    'listen',
    '--project-name',
    profile,
    '--events',
    events,
    '--forward-to',
    'localhost:3000/api/stripe/webhook',
    '--forward-connect-to',
    'localhost:3000/api/stripe/connect/webhook',
  ],
  {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let app = null;
let signingSecret = null;

function sanitize(line) {
  return line.replace(
    /(whsec_|sk_(?:test|live)_|rk_(?:test|live)_)[A-Za-z0-9_]+/g,
    '[secret hidden]',
  );
}

function handleLine(line) {
  const secretMatch = line.match(/whsec_[A-Za-z0-9_]+/);
  if (secretMatch && !signingSecret) {
    signingSecret = secretMatch[0];
    console.log('Webhook listener is ready. Starting Sitecraft on http://localhost:3000.');
    app = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        STRIPE_WEBHOOK_SECRET: signingSecret,
        STRIPE_CONNECT_WEBHOOK_SECRET: signingSecret,
      },
      stdio: 'inherit',
    });
    app.on('exit', (code) => {
      if (listener.exitCode === null) listener.kill('SIGTERM');
      process.exitCode = code ?? 0;
    });
  }

  const safeLine = sanitize(line);
  if (safeLine.trim()) process.stdout.write(`${safeLine}\n`);
}

function pipeLines(stream) {
  let pending = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || '';
    for (const line of lines) handleLine(line);
  });
  stream.on('end', () => {
    if (pending) handleLine(pending);
  });
}

pipeLines(listener.stdout);
pipeLines(listener.stderr);

listener.on('exit', (code) => {
  if (app?.exitCode === null) app.kill('SIGTERM');
  if (!signingSecret && code !== 0) {
    console.error('Stripe listener stopped before local development was ready.');
  }
  process.exitCode = code ?? 0;
});

function shutdown() {
  if (app?.exitCode === null) app.kill('SIGTERM');
  if (listener.exitCode === null) listener.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
