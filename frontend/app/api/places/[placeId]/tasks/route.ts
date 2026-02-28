/**
 * Returns task config for a place. Checks Firestore placeTaskConfig first;
 * falls back to default tasks with placeName interpolated.
 */

import { NextRequest, NextResponse } from "next/server";

export interface PlaceTask {
  characterId: "1" | "2" | "3" | "4";
  type: "photo" | "yes_no" | "description" | "confirm" | "location";
  title: string;
  description: string;
  question?: string;
  hint?: string;
  reward: { xp: number; blockProgress?: number };
}

const NPC_META: Record<string, { name: string; title: string; avatarInitial: string }> = {
  "1": { name: "ZERO", title: "Information Broker", avatarInitial: "Z" },
  "2": { name: "NOVA", title: "Tech Scavenger", avatarInitial: "N" },
  "3": { name: "CIPHER", title: "Accessibility Scout", avatarInitial: "C" },
  "4": { name: "ECHO", title: "Street Historian", avatarInitial: "E" },
};

function getDefaultTasks(placeName: string): PlaceTask[] {
  return [
    {
      characterId: "1",
      type: "photo",
      title: "Storefront Scan",
      description: `Take a photo of ${placeName} for the network database.`,
      hint: "Make sure the location is clearly visible",
      reward: { xp: 15, blockProgress: 2 },
    },
    {
      characterId: "2",
      type: "yes_no",
      title: "Status Check",
      description: "Help verify current conditions in this area.",
      question: `Is ${placeName} currently open for business?`,
      reward: { xp: 10, blockProgress: 3 },
    },
    {
      characterId: "3",
      type: "yes_no",
      title: "Access Report",
      description: "Help map accessibility features in the area.",
      question: `Is ${placeName} wheelchair accessible?`,
      reward: { xp: 12, blockProgress: 4 },
    },
    {
      characterId: "4",
      type: "description",
      title: "Street Memory",
      description: `Collect firsthand accounts of ${placeName} for the archive.`,
      question: `What stands out to you about ${placeName}? Describe what you see or remember.`,
      reward: { xp: 20, blockProgress: 5 },
    },
  ];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }

    const placeNameFromQuery = request.nextUrl.searchParams.get("placeName");

    let tasks: PlaceTask[] | null = null;
    let placeName = placeNameFromQuery ?? placeId;

    try {
      const { getFirebaseFirestore } = await import("@/lib/firebase-admin");
      const db = getFirebaseFirestore();
      const configRef = db.collection("placeTaskConfig").doc(placeId);
      const doc = await configRef.get();

      if (doc.exists) {
        const data = doc.data();
        if (Array.isArray(data?.tasks) && data.tasks.length > 0) {
          tasks = data.tasks as PlaceTask[];
          placeName = (data.placeName as string) ?? placeId;
        }
      }
    } catch (firebaseErr) {
      console.warn("Firestore placeTaskConfig unavailable:", firebaseErr);
    }

    if (!tasks || tasks.length === 0) {
      tasks = getDefaultTasks(placeName);
    }

    const tasksWithMeta = tasks.map((t) => ({
      ...t,
      ...NPC_META[t.characterId],
    }));

    return NextResponse.json({
      placeId,
      placeName,
      tasks: tasksWithMeta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tasks API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
