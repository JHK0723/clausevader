import { generateSessionToken, createSession, setSessionTokenCookie } from "@/lib/server/session";
import { google } from "@/lib/server/oauth";
import { cookies } from "next/headers";
import { decodeIdToken } from "arctic";
import { createUser, getUserFromGoogleId } from "@/lib/server/user";

export async function GET(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookieStore = await cookies();
    const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
    const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

    if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
        return new Response("Invalid OAuth state", { status: 400 });
    }

    let tokens;
    try {
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (e) {
        console.error("OAuth error", e);
        const detail = e?.description || e?.message || JSON.stringify(e);
        return new Response(`OAuth error: ${detail}`, { status: 400 });
    }

    const claims = decodeIdToken(tokens.idToken());
    const googleUserId = claims.sub;
    const username = claims.name;
    const picture = claims.picture;

    try {
        const existingUser = await getUserFromGoogleId(googleUserId);
        const sessionToken = await generateSessionToken();

        const user = existingUser ?? await createUser(googleUserId, username, picture);
        const session = await createSession(sessionToken, user.id);

        await setSessionTokenCookie(cookieStore, sessionToken);
    } catch (dbErr) {
        console.error("Database / Session error", dbErr);
        return new Response(`Database error: ${dbErr?.message || dbErr}`, { status: 500 });
    }

    return new Response(null, {
        status: 302,
        headers: {
            Location: "/"
        }
    });
}
