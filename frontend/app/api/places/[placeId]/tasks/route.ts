/**
 * Returns task config for a place. Checks Firestore placeTaskConfig first;
 * falls back to default tasks with placeName interpolated.
 * Uses Place Details API to derive questions (accessibility, business status, place type).
 * Merges Gemini-generated review-intel tasks (4–8) when reviews exist.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCharactersForPlace } from "@/lib/characters";
import { fetchPlaceDetails, type PlaceDetailsData } from "@/lib/place-details";
import { fetchPlaceReviews } from "@/lib/place-reviews";
import { getReviewIntel } from "@/lib/gemini/reviewIntel";
import type { ReviewIntelTask } from "@/lib/review-intel-types";

export interface PlaceTask {
  characterId: string; // "1".."8" baseline, "9".."16" review tasks
  type: "photo" | "yes_no" | "description" | "confirm" | "location";
  title: string;
  description: string;
  question?: string;
  hint?: string;
  reward: { xp: number; blockProgress?: number };
}

function getDescriptionQuestion(placeName: string, types?: string[]): string {
  const hasPark = types?.some((t) => t === "park" || t === "natural_feature");
  const hasRestaurant = types?.some((t) => t === "restaurant" || t === "food");
  const hasStore = types?.some((t) => t === "store" || t === "shopping_mall");

  if (hasPark) {
    return `What stands out to you about ${placeName}? Describe the park's atmosphere and surroundings.`;
  }
  if (hasRestaurant) {
    return `What stands out to you about ${placeName}? Describe the ambiance or your experience.`;
  }
  if (hasStore) {
    return `What stands out to you about ${placeName}? Describe what you see or remember.`;
  }
  return `What stands out to you about ${placeName}? Describe what you see or remember.`;
}

function getDefaultTasks(
  placeName: string,
  details?: PlaceDetailsData | null
): { tasks: PlaceTask[]; replacementTasks: PlaceTask[] } {
  const wheelchairKnown = details?.wheelchairAccessibleEntrance === true;
  const businessOperational = details?.businessStatus === "OPERATIONAL";
  const types = details?.types;

  const openQuestion = businessOperational
    ? `Can you confirm that ${placeName} is currently open for business?`
    : `Is ${placeName} currently open for business?`;

  const accessQuestion = wheelchairKnown
    ? `Can you confirm that ${placeName} is wheelchair accessible?`
    : `Is ${placeName} wheelchair accessible?`;

  const initial: PlaceTask[] = [
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
      question: openQuestion,
      reward: { xp: 10, blockProgress: 3 },
    },
    {
      characterId: "3",
      type: "yes_no",
      title: "Access Report",
      description: "Help map accessibility features in the area.",
      question: accessQuestion,
      reward: { xp: 12, blockProgress: 4 },
    },
    {
      characterId: "4",
      type: "description",
      title: "Street Memory",
      description: `Collect firsthand accounts of ${placeName} for the archive.`,
      question: getDescriptionQuestion(placeName, types),
      reward: { xp: 20, blockProgress: 5 },
    },
  ];
  const replacement: PlaceTask[] = [
    {
      characterId: "5",
      type: "yes_no",
      title: "Parking Check",
      description: "Help verify parking availability.",
      question: `Is there parking available at or near ${placeName}?`,
      reward: { xp: 8, blockProgress: 2 },
    },
    {
      characterId: "6",
      type: "yes_no",
      title: "Crowd Level",
      description: "Report on current conditions.",
      question: `Is ${placeName} currently crowded?`,
      reward: { xp: 10, blockProgress: 3 },
    },
    {
      characterId: "7",
      type: "description",
      title: "First Impression",
      description: "Share your first impression.",
      question: `What was your first impression when you arrived at ${placeName}?`,
      reward: { xp: 15, blockProgress: 4 },
    },
    {
      characterId: "8",
      type: "yes_no",
      title: "Cleanliness",
      description: "Help rate the area.",
      question: `Is ${placeName} well-maintained and clean?`,
      reward: { xp: 10, blockProgress: 3 },
    },
  ];
  return { tasks: initial, replacementTasks: replacement };
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

    const placeDetails = await fetchPlaceDetails(placeId);
    if (placeDetails?.name) placeName = placeDetails.name;

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

    let replacementTasks: PlaceTask[] = [];
    if (!tasks || tasks.length === 0) {
      const defaults = getDefaultTasks(placeName, placeDetails);
      tasks = defaults.tasks;
      replacementTasks = defaults.replacementTasks;
    } else {
      const defaults = getDefaultTasks(placeName, placeDetails);
      replacementTasks = defaults.replacementTasks;
    }

    // Review intel: fetch reviews, get Gemini consensus + tasks, merge into response
    let reviewTasks: PlaceTask[] = [];
    let reviewIntel: { consensusSummary: string } | undefined;
    try {
      const { oneStar, fiveStar } = await fetchPlaceReviews(placeId);
      if (oneStar.length > 0 || fiveStar.length > 0) {
        const intel = await getReviewIntel(placeId, placeName, oneStar, fiveStar);
        if (intel.consensusSummary.trim()) reviewIntel = { consensusSummary: intel.consensusSummary };
        if (intel.tasksToVerify.length > 0) {
          reviewTasks = intel.tasksToVerify.slice(0, 8).map((t: ReviewIntelTask, i: number) => ({
            characterId: String(9 + i),
            type: t.type,
            title: "Review check",
            description: t.claim || t.question,
            question: t.question,
            hint: t.evidenceQuotes?.[0] ? `Review: "${t.evidenceQuotes[0].slice(0, 60)}..."` : undefined,
            reward: { xp: 12, blockProgress: 2 },
          }));
        }
      }
    } catch (reviewErr) {
      console.warn("Review intel unavailable, using baseline tasks only:", reviewErr);
    }

    // Get up to 16 characters (8 baseline + 8 review slots)
    const placeCharacters = getCharactersForPlace(placeId, 16);
    const charIndex = (id: string) => Math.min(Math.max(0, parseInt(id, 10) - 1), placeCharacters.length - 1);

    const withMeta = (t: PlaceTask) => ({
      ...t,
      ...(placeCharacters[charIndex(t.characterId)] ?? placeCharacters[0] ?? {
        name: "Traveler",
        title: "Adventurer",
        avatarInitial: "?",
        imageUrl: "",
      }),
    });

    const tasksWithMeta = tasks.map(withMeta);
    const replacementWithMeta = replacementTasks.map(withMeta);
    const reviewTasksWithMeta = reviewTasks.map(withMeta);

    return NextResponse.json({
      placeId,
      placeName,
      tasks: tasksWithMeta,
      replacementTasks: replacementWithMeta,
      reviewTasks: reviewTasksWithMeta,
      ...(reviewIntel && { reviewIntel }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tasks API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
