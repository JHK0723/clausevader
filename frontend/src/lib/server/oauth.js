import { Google } from "arctic";

// Support both local development and production Vercel deployment.
// In production (Vercel), NEXT_PUBLIC_APP_URL is set to the full Vercel URL.
// In local dev, it defaults to localhost:3000.
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID ?? "",
  process.env.GOOGLE_CLIENT_SECRET ?? "",
  `${appUrl}/login/google/callback`
);