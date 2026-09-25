/* Subtext Surfers – start GitHub OAuth login.
 * Redirects the surfer to the company GitHub authorize endpoint.
 * Requires env vars GITHUB_CLIENT_ID (Netlify UI → Site settings → Environment variables). */
const crypto = require('crypto');

exports.handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return { statusCode: 302, headers: { Location: '/?auth_error=not_configured' } };
  }
  const state = crypto.randomBytes(12).toString('hex');
  const redirectUri = new URL('/api/auth-callback', event.headers.host ? 'https://' + event.headers.host : 'https://example.com').toString();
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  return {
    statusCode: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': `subtext_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax`,
    },
  };
};
