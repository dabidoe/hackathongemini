/**
 * Firebase Admin SDK initialization for server-side use.
 * Used by API routes for Storage (images) and Firestore (cache).
 */

import { getApps, initializeApp, cert, type ServiceAccount } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import { getFirestore } from "firebase-admin/firestore"
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

  return initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
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

export function getFirebaseStorage() {
  if (!_storage) {
    getFirebaseApp()
    _storage = getStorage()
  }
  return _storage
}

export function getFirebaseFirestore() {
  if (!_firestore) {
    getFirebaseApp()
    _firestore = getFirestore()
  }
  return _firestore
}
