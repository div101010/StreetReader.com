// Bias-free clustering algorithm — finds dense clusters of same-category
// experiences within a fixed metric radius and emits machine-generated
// urban-planning insights from those clusters.

export const HOTSPOT_RADIUS = 40;        // metres
export const MIN_CLUSTER_SIZE = 3;
export const CONFLICT_RADIUS = HOTSPOT_RADIUS * 1.5;

// Anchor landmarks used solely to label which segment of the corridor a
// hotspot belongs to. World [x, z] coords; same frame as user experiences.
const LANDMARK_ANCHORS = [
  { name: 'Plaza de España',  position: [-680, -180] },
  { name: 'Santo Domingo',    position: [-380,   40] },
  { name: 'Callao',           position: [-180,  170] },
  { name: 'Telefónica',       position: [ 140,  130] },
  { name: 'Metropolis',       position: [ 540,  310] },
];

const INSIGHT_TEMPLATES = {
  Sensory:
    'Sensory Intervention: implement acoustic buffering or green rest zones.',
  Memory:
    'Social Heritage Site: recommend community signage or digital plaques.',
  Complaint:
    'Immediate Infrastructure Correction: lighting / access audit required.',
};

const CONFLICT_INSIGHT =
  'High-Priority Protection Zone: a complaint cluster overlaps a memory cluster — balance heritage preservation with infrastructure repair.';

function distance(a, b) {
  const dx = a[0] - b[0];
  const dz = a[1] - b[1];
  return Math.sqrt(dx * dx + dz * dz);
}

function nearestLandmark(point) {
  let best = null;
  let bestD = Infinity;
  for (const lm of LANDMARK_ANCHORS) {
    const d = distance(point, lm.position);
    if (d < bestD) {
      bestD = d;
      best = lm;
    }
  }
  return best;
}

// Greedy single-pass clustering. For each unvisited point, gather every other
// unvisited point of the same category within HOTSPOT_RADIUS into one cluster.
// Cluster of MIN_CLUSTER_SIZE+ becomes a hotspot at the centroid.
function clusterByCategory(experiences) {
  const byCategory = {};
  for (const exp of experiences) {
    if (!exp?.position || !exp?.type) continue;
    if (!byCategory[exp.type]) byCategory[exp.type] = [];
    byCategory[exp.type].push(exp);
  }

  const hotspots = [];
  for (const [category, exps] of Object.entries(byCategory)) {
    const visited = new Set();
    for (let i = 0; i < exps.length; i++) {
      if (visited.has(i)) continue;
      const cluster = [exps[i]];
      const indices = [i];
      for (let j = i + 1; j < exps.length; j++) {
        if (visited.has(j)) continue;
        if (distance(exps[i].position, exps[j].position) < HOTSPOT_RADIUS) {
          cluster.push(exps[j]);
          indices.push(j);
        }
      }
      if (cluster.length >= MIN_CLUSTER_SIZE) {
        indices.forEach((idx) => visited.add(idx));
        const cx =
          cluster.reduce((s, e) => s + e.position[0], 0) / cluster.length;
        const cz =
          cluster.reduce((s, e) => s + e.position[1], 0) / cluster.length;
        hotspots.push({
          id: `${category}-${i}-${cluster.length}`,
          category,
          position: [cx, cz],
          count: cluster.length,
          radius: HOTSPOT_RADIUS,
          // Privacy-stripped extracts: text + category only. No id, ownerId,
          // createdAt — those never leave the algorithm layer.
          stories: cluster.map((e) => ({
            text: e.text || '',
            type: e.type,
          })),
        });
      }
    }
  }
  return hotspots;
}

function detectConflicts(hotspots) {
  const memory = hotspots.filter((h) => h.category === 'Memory');
  const complaints = hotspots.filter((h) => h.category === 'Complaint');
  const conflicts = [];
  for (const m of memory) {
    for (const c of complaints) {
      if (distance(m.position, c.position) < CONFLICT_RADIUS) {
        conflicts.push({
          id: `conflict-${m.id}-${c.id}`,
          position: [
            (m.position[0] + c.position[0]) / 2,
            (m.position[1] + c.position[1]) / 2,
          ],
          memoryHotspot: m,
          complaintHotspot: c,
        });
      }
    }
  }
  return conflicts;
}

export function generateUrbanInsights(experiences = []) {
  const hotspots = clusterByCategory(experiences);
  const conflicts = detectConflicts(hotspots);

  const insights = [];
  for (const h of hotspots) {
    const lm = nearestLandmark(h.position);
    insights.push({
      id: h.id,
      type: h.category,
      text: INSIGHT_TEMPLATES[h.category] || 'Cluster identified — review.',
      count: h.count,
      zone: lm ? `Vicinity of ${lm.name}` : 'Gran Vía corridor',
      stories: h.stories,
    });
  }
  for (const c of conflicts) {
    const lm = nearestLandmark(c.position);
    insights.push({
      id: c.id,
      type: 'Conflict',
      text: CONFLICT_INSIGHT,
      zone: lm ? `${lm.name} Approach` : 'Gran Vía corridor',
      // Conflict surfaces stories from BOTH overlapping clusters so the
      // planner can see the heritage and the grievance side by side.
      stories: [
        ...c.memoryHotspot.stories,
        ...c.complaintHotspot.stories,
      ],
    });
  }

  return { hotspots, conflicts, insights };
}
