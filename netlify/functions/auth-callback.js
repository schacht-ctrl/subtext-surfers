/* Subtext Surfers – GitHub OAuth callback.
 * Exchanges the code for the user's GitHub login and hands it back to the
 * game, which stores the verified flag with the player login. */
const crypto = require('crypto');

exports.handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const params = event.queryStringParameters || {};
  const cookies = Object.fromEntries((event.headers.cookie || '').split(';').map(c => c.trim().split('=')));

  if (!clientId || !clientSecret) {
    return { statusCode: 302, headers: { Location: '/?auth_error=not_configured' } };
  }
  if (!params.code || cookies.subtext_state !== params.state) {
    return { statusCode: 302, headers: { Location: '/?auth_error=state_mismatch' } };
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: params.code,
        redirect_uri: new URL('/api/auth-callback', 'https://' + event.headers.host).toString(),
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return { statusCode: 302, headers: { Location: '/?auth_error=token_exchange_failed' } };
    }
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'subtext-surfers' },
    });
    const user = await userRes.json();
    if (!user.login) {
      return { statusCode: 302, headers: { Location: '/?auth_error=no_user' } };
    }
    const login = encodeURIComponent(user.login);
    return {
      statusCode: 302,
      headers: {
        Location: `/?github_login=${login}`,
        'Set-Cookie': 'subtext_state=; Path=/; Max-Age=0',
      },
    };
  } catch (err) {
    return { statusCode: 302, headers: { Location: '/?auth_error=request_failed' } };
  }
};

/* keep crypto import referenced for future signature work */
void crypto;
