// src/lib/server/session.js
import { execute, fetch, fetchOne } from "./db";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { cookies } from "next/headers";

// Set session cookie
export async function setSessionTokenCookie(cookieStore, token) {
    console.log("Setting session token cookie", token);
    cookieStore.set("session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

// Delete session cookie
export async function deleteSessionTokenCookie(cookieStore) {
    console.log("Deleting session token cookie");
    cookieStore.set("session", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });
}

// Generate new session token
export async function generateSessionToken() {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return encodeBase32LowerCaseNoPadding(bytes);
}

// Create session in DB
export async function createSession(token, userId) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await execute(
        "INSERT INTO session (id, user_id, expires_at) VALUES ($1, $2, $3)",
        [sessionId, userId, Math.floor(expiresAt.getTime() / 1000)]
    );
    return { id: sessionId, userId, expiresAt };
}

// Validate session token
export async function validateSessionToken(token) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const row = await fetchOne(`
        SELECT 
            session.id AS id,
            session.user_id,
            session.expires_at,
            "user".id AS user_id,
            "user".name,
            "user".picture
        FROM session
        INNER JOIN "user" ON "user".id = session.user_id
        WHERE session.id = $1
    `, [sessionId]);

    if (!row) return { session: null, user: null };

    const session = {
        id: row.id,
        userId: row.user_id,
        expiresAt: new Date(row.expires_at * 1000)
    };

    const user = {
        id: row.user_id,
        name: row.name,
        picture: row.picture
    };

    const now = Date.now();

    if (now >= session.expiresAt.getTime()) {
        await execute("DELETE FROM session WHERE id = $1", [session.id]);
        return { session: null, user: null };
    }

    if (now >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
        session.expiresAt = new Date(now + 1000 * 60 * 60 * 24 * 30);
        await execute(
            "UPDATE session SET expires_at = $1 WHERE id = $2",
            [Math.floor(session.expiresAt.getTime() / 1000), session.id]
        );
    }

    return { session, user };
}

// Invalidate session
export async function invalidateSession(sessionId) {
    await execute("DELETE FROM session WHERE id = $1", [sessionId]);
}

export async function getCurrentSession() {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value;

	if (!token) {
		return { session: null, user: null };
	}

	return await validateSessionToken(token);
}