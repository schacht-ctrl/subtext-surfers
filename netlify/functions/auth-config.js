/* Subtext Surfers – GitHub auth config probe.
 * Returns whether the GitHub OAuth app is configured. */
exports.handler = async () => {
  const enabled = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ enabled }),
  };
};
