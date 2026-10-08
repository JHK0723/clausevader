import fs from 'fs';
import path from 'path';
import { Google, generateState, generateCodeVerifier } from 'arctic';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
const appUrl = (env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

console.log('--- Google OAuth Configuration Check ---');
console.log('Client ID Valid:', Boolean(clientId && clientId.includes('googleusercontent.com')));
console.log('Client ID Snippet:', clientId ? clientId.substring(0, 25) + '...' : 'MISSING');
console.log('Client Secret Valid:', Boolean(clientSecret && clientSecret.length > 10));
console.log('Redirect URI:', `${appUrl}/login/google/callback`);

try {
  const google = new Google(clientId, clientSecret, `${appUrl}/login/google/callback`);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const authUrl = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile']);

  console.log('\n--- Generated Google OAuth URL ---');
  console.log(authUrl.toString());
  console.log('\n--- TEST SUCCESSFUL: Authorization URL constructed cleanly! ---');
} catch (err) {
  console.error('\n--- TEST FAILED ---', err);
}
