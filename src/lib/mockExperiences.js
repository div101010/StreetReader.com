// Mock data has been retired — the map now renders only stories fetched
// from the Supabase `experiences` table. Keep this file (and its export)
// in place so existing imports in App.jsx / forceLoadStories continue to
// resolve without code changes.
//
// Each entry would have the shape:
//   {
//     id: string,
//     position: [x, z],         // world metres (same frame as MapView)
//     type: 'Sensory' | 'Memory' | 'Complaint',
//     text: string,
//     createdAt: string,        // ISO timestamp
//     ownerId: string,
//   }
export const MOCK_EXPERIENCES = [];
