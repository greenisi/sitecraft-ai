type StripeLikeError = {
  code?: string;
  message?: string;
  statusCode?: number;
  type?: string;
};

export type StripeConnectErrorCode =
  | 'connect_not_configured'
  | 'connect_account_unavailable'
  | 'connect_request_failed';

export type StripeConnectErrorInfo = {
  code: StripeConnectErrorCode;
  message: string;
  status: number;
};

/**
 * Convert Stripe's server-side errors into stable, non-sensitive responses that
 * the settings UI can explain. Raw Stripe errors stay in server logs.
 */
export function classifyStripeConnectError(error: unknown): StripeConnectErrorInfo {
  const stripeError = (error ?? {}) as StripeLikeError;
  const message = stripeError.message?.toLowerCase() ?? '';

  if (
    stripeError.code === 'platform_account_required' ||
    message.includes('only stripe connect platforms can work with other accounts')
  ) {
    return {
      code: 'connect_not_configured',
      message: 'Stripe Connect is not configured for this platform yet.',
      status: 503,
    };
  }

  if (
    stripeError.code === 'resource_missing' ||
    message.includes('not connected to your platform') ||
    message.includes('does not exist')
  ) {
    return {
      code: 'connect_account_unavailable',
      message: 'This Stripe connection is no longer available. Start a new connection to continue.',
      status: 409,
    };
  }

  return {
    code: 'connect_request_failed',
    message: 'Stripe could not start the connection. Please try again.',
    status: stripeError.statusCode && stripeError.statusCode >= 400
      ? Math.min(stripeError.statusCode, 599)
      : 500,
  };
}

export function getAppOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing').replace(/\/+$/, '');
}
