# Character Generation Logic Flow

## End-to-end flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PROFILE TAB (profile-tab.tsx)                                            │
│    User clicks "Regenerate"                                                  │
│    → handleRegenerate() runs                                                 │
│    → POST /api/generate-character                                            │
│       body: { imageUrl: sourceImageUrl, chips: selectedChips }               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. API ROUTE (app/api/generate-character/route.ts)                          │
│    • Reads NANO_BANANA_API_KEY from process.env                              │
│    • Builds prompt from theme + chips                                        │
│    • Creates FormData: prompt, model, mode, imageUrl, aspectRatio, etc.      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. NANO BANANA API (nanobananapro.cloud)                                     │
│    POST https://nanobananapro.cloud/api/v1/image/nano-banana                 │
│    Headers: Authorization: Bearer {NANO_BANANA_API_KEY}                      │
│    Body: FormData (prompt, imageUrl, model=nano-banana-2, mode=image-to-image)│
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │ IF 401 Unauthorized → API key invalid/missing/wrong provider         │  │
│    │ IF 200 + data.id → Success, poll /result for image URL              │  │
│    │ IF 200 + no task ID → "No task ID returned" (wrong response format)  │  │
│    └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. POLL FOR RESULT (if task ID received)                                     │
│    POST .../nano-banana/result with { taskId }                               │
│    Poll every 2s until status=succeeded or failed                            │
│    Extract results[0].url                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. SAVE TO FIREBASE                                                          │
│    Fetch image from Nano Banana URL                                          │
│    Upload to Firebase Storage (profile-portraits/...)                        │
│    Return signed URL to frontend                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. PROFILE TAB                                                               │
│    Receives { success: true, imageUrl } → setGeneratedImageUrl(imageUrl)    │
│    OR receives { error: "..." } → setGenerateError(error)  ← "Unauthorized"   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## "Unauthorized" error

**Where it comes from:** Nano Banana API returns HTTP 401 when the `Authorization: Bearer {key}` header is rejected.

**Common causes:**
1. **NANO_BANANA_API_KEY is empty** – Check `.env.local`, ensure no trailing spaces
2. **Key from wrong provider** – Keys from `gateway.bananapro.site` (often `sk-` prefix) use a different API than `nanobananapro.cloud`
3. **Key expired or revoked** – Regenerate at [nanobananapro.cloud/api-keys](https://nanobananapro.cloud/api-keys)
4. **Env not loaded** – Restart dev server after changing `.env.local`

**Fix:** Use an API key from [nanobananapro.cloud](https://nanobananapro.cloud) (not bananapro.site). Ensure it's set in `frontend/.env.local` as `NANO_BANANA_API_KEY=your_key_here`.
