/**
 * Returns the current user's profile and XP from Firestore.
 * Requires Authorization: Bearer <idToken>.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getFirebaseAuth, getFirebaseFirestore } = await import("@/lib/firebase-admin");
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const db = getFirebaseFirestore();
    const userSnap = await db.collection("users").doc(uid).get();
    const data = userSnap.data();

    return NextResponse.json({
      uid,
      xp: data?.xp ?? 0,
      displayName: data?.displayName ?? decoded.name ?? null,
      email: data?.email ?? decoded.email ?? null,
      photoURL: data?.photoURL ?? decoded.picture ?? null,
      lastUpdated: data?.lastUpdated?.toMillis?.() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
