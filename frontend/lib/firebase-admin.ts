/**
 * Firebase Admin SDK initialization for server-side use.
 * Used by API routes for Storage (images) and Firestore (cache).
 */

import { getApps, initializeApp, cert, type ServiceAccount } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { readFileSync } from "fs"
import { resolve } from "path"

function getFirebaseApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]
  }

  const serviceAccount = getServiceAccount()
  if (!serviceAccount) {
    throw new Error(
      "Firebase not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT (base64 JSON)."
    )
  }

  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    (typeof serviceAccount === "object" && "project_id" in serviceAccount
      ? `${(serviceAccount as { project_id?: string }).project_id}.firebasestorage.app`
      : undefined)

  return initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket: bucket,
  })
}

function getServiceAccount(): ServiceAccount | null {
  // Option 1: Base64-encoded JSON in env (for Vercel/serverless)
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT
  if (base64) {
    try {
      const json = Buffer.from(base64, "base64").toString("utf-8")
      return JSON.parse(json) as ServiceAccount
    } catch {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT")
      return null
    }
  }

  // Option 2: Path to service account file
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    try {
      const fullPath = resolve(process.cwd(), credPath)
      const json = readFileSync(fullPath, "utf-8")
      return JSON.parse(json) as ServiceAccount
    } catch {
      console.error("Failed to load GOOGLE_APPLICATION_CREDENTIALS from", credPath)
      return null
    }
  }

  return null
}

let _storage: ReturnType<typeof getStorage> | null = null
let _firestore: ReturnType<typeof getFirestore> | null = null
let _auth: ReturnType<typeof getAuth> | null = null

export function getFirebaseStorage() {
  if (!_storage) {
    const app = getFirebaseApp()
    _storage = getStorage(app)
  }
  return _storage
}

/** Get the storage bucket, with explicit name for reliability. */
export function getStorageBucket() {
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ??
    (() => {
      try {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        if (credPath) {
          const fullPath = resolve(process.cwd(), credPath)
          const json = readFileSync(fullPath, "utf-8")
          const parsed = JSON.parse(json) as { project_id?: string }
          return parsed.project_id ? `${parsed.project_id}.firebasestorage.app` : undefined
        }
      } catch {
        /* ignore */
      }
      return undefined
    })()
  if (!bucketName) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET not set. Add it to .env.local (e.g. your-project.appspot.com). " +
        "Also ensure Firebase Storage is enabled: https://console.firebase.google.com → your project → Storage → Get started"
    )
  }
  return getFirebaseStorage().bucket(bucketName)
}

export function getFirebaseFirestore() {
  if (!_firestore) {
    getFirebaseApp()
    _firestore = getFirestore()
  }
  return _firestore
}

export function getFirebaseAuth() {
  if (!_auth) {
    const app = getFirebaseApp()
    _auth = getAuth(app)
  }
  return _auth
}
