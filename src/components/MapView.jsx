import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { getCategoryColors } from '../lib/categoryColors.js';
import { CONFLICT_RADIUS } from '../lib/urbanInsights.js';
import { useTranslation } from '../lib/translations.jsx';

const GEOJSON_URL = '/export.geojson';

const MOBILE_QUERY = '(max-width: 767px)';

// Tracks whether the viewport is in the mobile band so DOM-overlay labels
// (drei <Html>) can be rendered at smaller dimensions. Drei's <Html> in
// non-transform mode renders at fixed pixel size — the canvas scaling we
// already do via FitCamera does NOT shrink it, so we have to opt-in here.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const BG_COLOR = '#F2F0E8';
const FILL_COLOR = '#EAE3D2';
const STROKE_COLOR = '#1F3A2A';

// === MANUAL ALIGNMENT — applied ONLY to the Overpass data layer ============
// Slide / scale the green dots until they sit on top of the buildings.
// Buildings stay fixed; their projected coords are the ground truth.
const DATA_X_OFFSET = 0;     // metres along world-x (east +)
const DATA_Z_OFFSET = 0;     // metres along world-z (south +; north −)
const DATA_SCALE = 1.0;      // multiplier on data-layer positions

// Applied to the parent group — rotates both layers together (radians around Y).
export const ROTATION_OFFSET_Y = 0;
// ============================================================================

const LAT_M_PER_DEG = 110540;
const lonMetersPerDeg = (lat) =>
  111320 * Math.cos((lat * Math.PI) / 180);

const CATEGORIES = {
  subway: { color: '#1F3A2A', size: 6.0, kind: 'plane', renderOrder: 6 },
  hotel: { color: '#306B47', size: 4.0, kind: 'ring', renderOrder: 5 },
  shop: { color: '#1F3A2A', size: 2.5, kind: 'circle', renderOrder: 4 },
  tree: { color: '#8FAA90', size: 2.0, kind: 'circle', renderOrder: 3 },
  lamp: { color: '#B5A992', size: 1.0, kind: 'circle', renderOrder: 2 },
  other: { color: '#306B47', size: 2.0, kind: 'circle', renderOrder: 4 },
};

function categorize(props = {}) {
  if (props.railway === 'subway_entrance') return 'subway';
  if (props.tourism === 'hotel' || props.tourism === 'guest_house') return 'hotel';
  if (props.shop) return 'shop';
  if (props.natural === 'tree') return 'tree';
  if (props.highway === 'street_lamp') return 'lamp';
  return 'other';
}

function computeLonLatBounds(geojson) {
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  const visit = (c) => {
    if (typeof c[0] === 'number') {
      minLon = Math.min(minLon, c[0]);
      maxLon = Math.max(maxLon, c[0]);
      minLat = Math.min(minLat, c[1]);
      maxLat = Math.max(maxLat, c[1]);
    } else c.forEach(visit);
  };
  for (const f of geojson.features) if (f.geometry) visit(f.geometry.coordinates);
  return { minLon, maxLon, minLat, maxLat };
}

// Returns world-space (x, z) directly, in metres.
//   high lon (east)  → +x  (screen-right with camera up = (0, 0, -1))
//   high lat (north) → -z  (screen-top — the negative sign is mandatory)
function makeProjection(geojson) {
  const b = computeLonLatBounds(geojson);
  const cLon = (b.minLon + b.maxLon) / 2;
  const cLat = (b.minLat + b.maxLat) / 2;
  const lonM = lonMetersPerDeg(cLat);
  return ([lon, lat]) => [
    (lon - cLon) * lonM,
    -(lat - cLat) * LAT_M_PER_DEG,
  ];
}

function buildBuildingGeometries(geojson, project) {
  const shapes = [];
  const strokePositions = [];

  for (const f of geojson.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys =
      g.type === 'Polygon'
        ? [g.coordinates]
        : g.type === 'MultiPolygon'
          ? g.coordinates
          : null;
    if (!polys) continue;

    for (const polygon of polys) {
      if (!polygon.length) continue;
      const outer = polygon[0];
      const shape = new THREE.Shape();
      // ShapeGeometry creates vertices (sx, sy, 0). We want world (x, 0, z).
      // After rotateX(-π/2): (sx, sy, 0) → (sx, 0, -sy).
      // So sx = x, and sy = -z to land at world z.
      outer.forEach((c, i) => {
        const [x, z] = project(c);
        if (i === 0) shape.moveTo(x, -z);
        else shape.lineTo(x, -z);
      });
      for (let r = 1; r < polygon.length; r++) {
        const hole = new THREE.Path();
        polygon[r].forEach((c, i) => {
          const [x, z] = project(c);
          if (i === 0) hole.moveTo(x, -z);
          else hole.lineTo(x, -z);
        });
        shape.holes.push(hole);
      }
      shapes.push(shape);

      // Strokes are written directly in world XZ — no rotation needed.
      for (const ring of polygon) {
        for (let i = 0; i < ring.length - 1; i++) {
          const [ax, az] = project(ring[i]);
          const [bx, bz] = project(ring[i + 1]);
          strokePositions.push(ax, 0, az, bx, 0, bz);
        }
      }
    }
  }

  const fillGeom = new THREE.ShapeGeometry(shapes);
  fillGeom.rotateX(-Math.PI / 2);
  fillGeom.computeBoundingBox();

  const strokeGeom = new THREE.BufferGeometry();
  strokeGeom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(strokePositions, 3),
  );

  return { fillGeom, strokeGeom };
}

function buildPoiGroups(geojson, project) {
  const groups = {
    subway: [], hotel: [], shop: [], tree: [], lamp: [], other: [],
  };
  const subwayLabels = [];

  for (const f of geojson.features) {
    if (f.geometry?.type !== 'Point') continue;
    const props = f.properties || {};
    const cat = categorize(props);
    const [x, z] = project(f.geometry.coordinates);
    // Each entry keeps the feature reference so click handlers can resolve to tags.
    groups[cat].push({ position: [x, z], properties: props });
    if (cat === 'subway' && props.name) {
      subwayLabels.push({ position: [x, z], name: props.name });
    }
  }
  return { groups, subwayLabels };
}

function makeCategoryGeometry(config) {
  let g;
  if (config.kind === 'plane') {
    g = new THREE.PlaneGeometry(config.size, config.size);
  } else if (config.kind === 'ring') {
    g = new THREE.RingGeometry(config.size * 0.55, config.size, 24);
  } else {
    g = new THREE.CircleGeometry(config.size, 18);
  }
  g.rotateX(-Math.PI / 2);
  return g;
}

function CategoryMarkers({ category, entries, onPick }) {
  // OSM marker layer (trees / lamps / shops / hotels / subway).
  // Intentionally NOT subscribed to vizMode — Data Viz gradients are scoped
  // to lived-experience pins only (see <UserPin>), so toggling vizMode must
  // never alter the appearance of these street assets.
  const ref = useRef();
  const config = CATEGORIES[category];
  const geometry = useMemo(() => makeCategoryGeometry(config), [config]);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    if (!ref.current || !entries.length) return;
    const dummy = new THREE.Object3D();
    entries.forEach(({ position: [x, z] }, i) => {
      dummy.position.set(x, 0.5, z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [entries]);

  if (!entries.length) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    const i = e.instanceId;
    if (i == null) return;
    const entry = entries[i];
    onPick?.({ category, position: entry.position, properties: entry.properties });
  };

  // Hover handlers — onPointerMove tracks instance changes within the same
  // mesh (onPointerOver only fires on first entry, so moving between
  // instances of one InstancedMesh wouldn't update otherwise).
  const handlePointerMove = (e) => {
    e.stopPropagation();
    const i = e.instanceId;
    if (i != null && i !== hoveredIdx) setHoveredIdx(i);
  };
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredIdx(null);
  };

  // Resolve the tooltip label: real OSM name → specific tag (shop / tourism
  // / amenity / railway) → category as a last resort.
  const hoveredEntry = hoveredIdx != null ? entries[hoveredIdx] : null;
  const hoveredProps = hoveredEntry?.properties || {};
  const hoveredLabel =
    hoveredProps.name ||
    hoveredProps.shop ||
    hoveredProps.tourism ||
    hoveredProps.amenity ||
    hoveredProps.railway ||
    category;

  return (
    <>
      <instancedMesh
        ref={ref}
        args={[geometry, undefined, entries.length]}
        renderOrder={config.renderOrder}
        frustumCulled={false}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial
          color={config.color}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
      {hoveredEntry && (
        <Html
          position={[hoveredEntry.position[0], 5, hoveredEntry.position[1]]}
          center
          zIndexRange={[200, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="-translate-y-3 whitespace-nowrap rounded bg-white/90 px-3 py-1.5 text-[13px] font-bold shadow-sm"
            style={{ color: '#1F3A2A' }}
          >
            {hoveredLabel}
          </div>
        </Html>
      )}
    </>
  );
}

function UserPins({ experiences, onPick, vizMode }) {
  // Render every pin as its own group so the InstancedMesh count never drifts.
  if (!experiences.length) return null;
  return (
    <group>
      {experiences.map((exp) => (
        <UserPin
          key={exp.id}
          experience={exp}
          onPick={onPick}
          vizMode={vizMode}
        />
      ))}
    </group>
  );
}

function HotspotZone({ hotspot }) {
  const ringRef = useRef();
  const palette = getCategoryColors(hotspot.category);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime;
    const phase = (Number(String(hotspot.id).slice(-2)) || 0) * 0.21;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + phase);
    ringRef.current.scale.setScalar(1 + 0.18 * pulse);
    if (ringRef.current.material) {
      ringRef.current.material.opacity = 0.22 + 0.22 * pulse;
    }
  });

  return (
    <mesh
      ref={ringRef}
      position={[hotspot.position[0], 4, hotspot.position[1]]}
      rotation-x={-Math.PI / 2}
      renderOrder={5}
    >
      <ringGeometry args={[hotspot.radius * 0.55, hotspot.radius, 48]} />
      <meshBasicMaterial
        color={palette.primary}
        transparent
        opacity={0.32}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function ConflictZone({ conflict }) {
  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.9);
    ringRef.current.scale.setScalar(1 + 0.22 * pulse);
    if (ringRef.current.material) {
      ringRef.current.material.opacity = 0.32 + 0.28 * pulse;
    }
  });

  return (
    <mesh
      ref={ringRef}
      position={[conflict.position[0], 6, conflict.position[1]]}
      rotation-x={-Math.PI / 2}
      renderOrder={6}
    >
      <ringGeometry args={[CONFLICT_RADIUS * 0.5, CONFLICT_RADIUS * 0.85, 64]} />
      <meshBasicMaterial
        color="#1F3A2A"
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function UserPin({ experience, onPick, vizMode = false }) {
  const glowOuterRef = useRef();
  const glowInnerRef = useRef();
  const [x, z] = experience.position;
  const palette = getCategoryColors(experience.type);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    // Halo refs only exist when vizMode is on; bail out otherwise to skip
    // the per-frame opacity / scale work entirely.
    if (!vizMode) return;
    const t = clock.elapsedTime;
    const phase = (Number(String(experience.id).slice(-3)) || 0) * 0.13;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + phase);
    if (glowOuterRef.current) {
      glowOuterRef.current.scale.setScalar(1 + 0.35 * pulse);
      glowOuterRef.current.material.opacity = 0.10 + 0.08 * pulse;
    }
    if (glowInnerRef.current) {
      glowInnerRef.current.scale.setScalar(1 + 0.18 * pulse);
      glowInnerRef.current.material.opacity = 0.18 + 0.16 * pulse;
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    onPick?.(experience.id);
  };

  // Cream palette + additive blending against the beige floor reads as a
  // luminous glow even though the scene itself is unlit. y=2 so the pin sits
  // safely above the building fill mesh and never z-fights the floor.
  return (
    <group position={[x, 2.0, z]} rotation-x={-Math.PI / 2}>
      {/* Halo gradients — ONLY when Data Viz is on. Default state is just
          the core dot, no glow. */}
      {vizMode && (
        <>
          <mesh ref={glowOuterRef} renderOrder={6}>
            <circleGeometry args={[8, 32]} />
            <meshBasicMaterial
              color={palette.primary}
              transparent
              opacity={0.16}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={glowInnerRef} renderOrder={7}>
            <circleGeometry args={[4.5, 32]} />
            <meshBasicMaterial
              color={palette.primary}
              transparent
              opacity={0.32}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>
      )}
      {/* Core (clickable) — always rendered so each pin is locatable. */}
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        renderOrder={9}
      >
        <circleGeometry args={[2.4, 24]} />
        <meshBasicMaterial
          color={palette.primary}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </mesh>
      {/* Hover tooltip — same pill style as the OSM markers, but allowed
          to wrap because story text can be a sentence rather than a name.
          Tints to the experience's category colour. */}
      {hovered && experience.text && (
        <Html
          position={[0, 0, 0]}
          center
          zIndexRange={[200, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="-translate-y-3 max-w-[18rem] whitespace-normal rounded bg-white/90 px-3 py-1.5 text-[13px] font-bold leading-snug shadow-sm"
            style={{ color: palette.primary }}
          >
            {experience.text}
          </div>
        </Html>
      )}
    </group>
  );
}

function PinForm({ position, onSubmit, onCancel }) {
  const [type, setType] = useState('Sensory');
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({ type, text: text.trim() });
  };

  return (
    <Html
      position={[position[0], 5, position[1]]}
      center
      distanceFactor={null}
      style={{ pointerEvents: 'auto' }}
      zIndexRange={[100, 0]}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 280,
          transform: 'translate(0, -16px)',
          padding: 16,
          borderRadius: 14,
          backgroundColor: 'rgba(255, 252, 244, 0.96)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(31, 58, 42, 0.18)',
          boxShadow: '0 10px 28px rgba(31, 58, 42, 0.18)',
          color: STROKE_COLOR,
          fontFamily: '"Darker Grotesque", system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>
            Pin a story here
          </strong>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: 'none',
              background: 'transparent',
              color: STROKE_COLOR,
              opacity: 0.55,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="cancel"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {['Sensory', 'Memory', 'Complaint'].map((t) => {
            const selected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: `1px solid ${selected ? STROKE_COLOR : 'rgba(31, 58, 42, 0.18)'}`,
                  backgroundColor: selected ? STROKE_COLOR : 'transparent',
                  color: selected ? '#FAF5EB' : STROKE_COLOR,
                  fontFamily: 'inherit',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What happened here?"
          rows={4}
          style={{
            width: '100%',
            marginTop: 10,
            padding: 10,
            fontSize: 13,
            lineHeight: 1.4,
            border: '1px solid rgba(31, 58, 42, 0.18)',
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            color: STROKE_COLOR,
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: 8,
              border: '1px solid rgba(31, 58, 42, 0.2)',
              background: 'transparent',
              color: STROKE_COLOR,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: 8,
              border: 'none',
              background: text.trim() ? STROKE_COLOR : 'rgba(31, 58, 42, 0.25)',
              color: '#FAF5EB',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            Pin it
          </button>
        </div>
      </form>
    </Html>
  );
}

function ClickCatcher({ onClick }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick([e.point.x, e.point.z]);
  };
  return (
    <mesh
      position={[0, -1, 0]}
      rotation-x={-Math.PI / 2}
      onClick={handleClick}
      renderOrder={-1}
    >
      <planeGeometry args={[5000, 5000]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function DebugClickMarker({ point }) {
  if (!point) return null;
  return (
    <mesh position={[point[0], 3, point[1]]} renderOrder={1000}>
      <sphereGeometry args={[1.5, 16, 16]} />
      <meshBasicMaterial color="red" depthTest={false} toneMapped={false} />
    </mesh>
  );
}

function UserMarker({ position }) {
  const haloRef = useRef();
  useFrame(({ clock }) => {
    if (!haloRef.current) return;
    const t = clock.elapsedTime;
    const pulse = 1 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2));
    haloRef.current.scale.setScalar(pulse);
    if (haloRef.current.material) {
      haloRef.current.material.opacity = 0.55 - 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2));
    }
  });

  if (!position) return null;
  return (
    <group position={[position[0], 1.2, position[1]]} rotation-x={-Math.PI / 2}>
      <mesh ref={haloRef}>
        <ringGeometry args={[3, 5, 32]} />
        <meshBasicMaterial color="#306B47" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[2, 24]} />
        <meshBasicMaterial color="#306B47" />
      </mesh>
      <mesh>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#FAF5EB" />
      </mesh>
    </group>
  );
}

function FeaturePopup({ feature, onClose }) {
  if (!feature) return null;
  const p = feature.properties || {};
  const title =
    p.name ||
    p['addr:street'] ||
    (feature.category ? feature.category[0].toUpperCase() + feature.category.slice(1) : 'Point');

  const lines = [];
  if (p.shop) lines.push(`Shop · ${p.shop}`);
  if (p.tourism) lines.push(`Tourism · ${p.tourism}`);
  if (p.railway) lines.push(`Transport · ${p.railway.replace('_', ' ')}`);
  if (p.natural === 'tree') lines.push('Natural · tree');
  if (p.highway === 'street_lamp') lines.push('Street furniture · lamp');
  if (p['addr:street'] && p['addr:housenumber']) {
    lines.push(`${p['addr:street']} ${p['addr:housenumber']}`);
  }
  if (p.opening_hours) lines.push(p.opening_hours);

  return (
    <Html
      position={[feature.position[0], 4, feature.position[1]]}
      center
      distanceFactor={null}
      style={{ pointerEvents: 'auto' }}
      zIndexRange={[20, 0]}
    >
      <div
        style={{
          minWidth: 200,
          maxWidth: 280,
          transform: 'translate(0, -12px)',
          padding: '12px 14px',
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(31, 58, 42, 0.12)',
          boxShadow: '0 6px 18px rgba(31, 58, 42, 0.12)',
          color: STROKE_COLOR,
          fontFamily: '"Darker Grotesque", system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <strong style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{title}</strong>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: STROKE_COLOR,
              opacity: 0.5,
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="close"
          >
            ×
          </button>
        </div>
        {lines.length > 0 && (
          <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', fontSize: 12, opacity: 0.78 }}>
            {lines.map((l, i) => (
              <li key={i} style={{ marginTop: 2 }}>{l}</li>
            ))}
          </ul>
        )}
        <p
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(31, 58, 42, 0.1)',
            fontSize: 11,
            fontStyle: 'italic',
            opacity: 0.7,
          }}
        >
          No lived experience pinned yet.
        </p>
      </div>
    </Html>
  );
}

// Threshold above which we reveal individual shop names. Camera.zoom is in
// orthographic units; >4 corresponds to "close enough that shop labels won't
// pile on top of each other." Tweak if you want shops to appear sooner/later.
const SHOP_REVEAL_ZOOM = 4;

// Curated landmark anchors along the Gran Vía corridor, east → west.
// Coordinates are in the same world-metre frame as the building geometry
// (makeProjection puts (0, 0) at the centre of the dataset bbox; +x = east,
// +z = south). Spread along the corridor so labels don't pile on the curve.
// In-canvas landmark labels — drei <Html> in plain (non-transform) mode.
// World metres [x, y, z]; tweak in place to nudge a pin.
// All labels render with the leader line on TOP, dropping down to the street.
const LANDMARKS = [
  { name: 'PLAZA DE ESPAÑA', pos: [-680, 10, -180] },
  { name: 'SANTO DOMINGO',   pos: [-380, 10,   40] },
  { name: 'CALLAO',          pos: [-180, 10,  170] },
  { name: 'TELEFÓNICA',      pos: [ 140, 10,  130] },
  { name: 'METROPOLIS',      pos: [ 540, 10,  310], lineHeight: 60 },
];

// Distance-based filtering removed — the Overpass query in lib/overpass.js
// now scopes buildings authoritatively via the Gran Vía way relation, so all
// returned features are by definition on the corridor.

function PrecisionLabels() {
  const isMobile = useIsMobile();

  // Scale every dimension that affects the label's visual footprint when
  // we drop below 768px. Border + radius taper too so the pill stays
  // visually consistent at the smaller font.
  const fontSize = isMobile ? '7.5px' : '10px';
  const padding = isMobile ? '1px 5px' : '2px 8px';
  const borderWidth = isMobile ? '1px' : '1.5px';
  const borderRadius = isMobile ? '8px' : '12px';
  const defaultLineHeight = isMobile ? 18 : 35;
  // Per-landmark line overrides (e.g., METROPOLIS at 60px) shrink with
  // the same ratio so the relative spacing of labels along the corridor
  // is preserved.
  const lineScale = isMobile ? 0.5 : 1;

  return (
    <>
      {LANDMARKS.map((landmark) => {
        const lineHeight = landmark.lineHeight
          ? Math.round(landmark.lineHeight * lineScale)
          : defaultLineHeight;

        // Anchor correction — drei's `center` prop puts the geometric
        // center of the [line + label] stack on the world coord. After
        // shrinking, that center sits closer to the world point, which is
        // exactly the behaviour we want: the line tip stays near the
        // street, with the label hanging off it. The translateY below
        // pulls the join-point (line bottom / label top) onto the world
        // coord precisely, so the pointer always reads as "starts here."
        const joinOffset = (lineHeight - (isMobile ? 14 : 18)) / 2;

        return (
          <Html
            key={landmark.name}
            position={landmark.pos}
            center
            occlude={false}
            zIndexRange={[5, 0]}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                alignItems: 'center',
                transform: `translateY(${-joinOffset}px)`,
              }}
            >
              {/* Label box (rendered below the line via column-reverse) */}
              <div
                style={{
                  padding,
                  border: `${borderWidth} solid #1a2e1a`,
                  borderRadius,
                  backgroundColor: 'white',
                  fontSize,
                  fontWeight: 'bold',
                  color: '#1a2e1a',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                }}
              >
                {landmark.name}
              </div>
              {/* Leader line (rendered above the label via column-reverse) */}
              <div
                style={{
                  width: '1px',
                  height: `${lineHeight}px`,
                  backgroundColor: '#1a2e1a',
                }}
              />
            </div>
          </Html>
        );
      })}
    </>
  );
}

function LandmarkLabels({ landmarks, project }) {
  const { camera } = useThree();

  // Track only a binary "close enough for shops" flag so we don't re-render
  // every frame; flips state only when crossing the threshold.
  const [showShops, setShowShops] = useState(false);
  useFrame(() => {
    const close = camera.zoom > SHOP_REVEAL_ZOOM;
    if (close !== showShops) setShowShops(close);
  });

  if (!landmarks?.length || !project) return null;

  // Tight filter — only major civic landmarks always; shops only when zoomed in.
  const filtered = landmarks.filter((l) => {
    if (!l.tags?.name) return false;

    const isMajor =
      l.tags.amenity === 'cinema' ||
      l.tags.railway === 'station' ||
      l.tags.tourism === 'museum' ||
      !!l.tags.historic;
    if (isMajor) return true;

    if (l.tags.shop) return showShops;
    return false;
  });

  return (
    <group>
      {filtered.map((l) => {
        const [x, z] = project([l.lon, l.lat]);
        return (
          <Html
            key={l.id}
            position={[x, 15, z]}
            transform
            occlude
            distanceFactor={50}
            zIndexRange={[15, 0]}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#1f3a2a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                fontFamily: '"Darker Grotesque", system-ui, sans-serif',
              }}
            >
              {l.tags.name}
            </span>
          </Html>
        );
      })}
    </group>
  );
}

function SubwayLabels({ labels }) {
  if (!labels?.length) return null;
  return (
    <group>
      {labels.map((l, i) => (
        <Html
          key={`${l.name}-${i}`}
          position={[l.position[0], 1, l.position[1]]}
          center
          distanceFactor={null}
          style={{
            color: STROKE_COLOR,
            fontFamily: '"Darker Grotesque", system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            transform: 'translate(0, -14px)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {l.name}
        </Html>
      ))}
    </group>
  );
}

// Width of the sidebar overlay in screen pixels (w-96 = 384px) plus the left
// margin (left-6 = 24px). FitCamera shifts the camera target left so the
// model lands in the centre of the visible (non-sidebar) area.
const SIDEBAR_PIXEL_WIDTH = 384 + 24;

function FitCamera({ bbox }) {
  const { camera, size } = useThree();
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!bbox) return;

    // Mobile-only branch — keyed on canvas width, not user-agent. Re-runs
    // on rotation because size.width is in the dependency array.
    const isMobile = size.width < 768;

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const ext = new THREE.Vector3();
    bbox.getSize(ext);

    const aspect = size.width / size.height;

    // ── Desktop fit (unchanged) ──────────────────────────────────────────
    // Padding gives the labels (Plaza España and Metropolis sit beyond the
    // building bbox) room in the default view.
    //
    // ── Mobile fit ───────────────────────────────────────────────────────
    // Phone portrait: fit-to-width so the Gran Vía corridor spans the full
    // screen instead of being letterboxed inside a generous padded frustum.
    // viewHeight overflows the corridor — that's fine, the cream floor
    // simply extends north/south of the street.
    const viewWidth = isMobile
      ? ext.x * 1.05
      : Math.max(ext.x, ext.z * aspect) * 1.4;
    const viewHeight = viewWidth / aspect;

    // World units per screen pixel at this zoom.
    const worldPerPixel = viewWidth / size.width;
    // Desktop centres the map in the non-sidebar area (sidebar is always
    // visible). Mobile uses a drawer overlay, so no offset — keep the map
    // dead-centre on the device width.
    const offsetX = isMobile
      ? 0
      : -(SIDEBAR_PIXEL_WIDTH / 2) * worldPerPixel;

    camera.position.set(center.x + offsetX, 1000, center.z);

    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(center.x + offsetX, 0, center.z);
      controls.update();
    }
  }, [bbox, camera, size.width, size.height, controls]);

  return null;
}

function LoadingOverlay({ visible }) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
      style={{ backgroundColor: BG_COLOR }}
    >
      <div className="text-center">
        <h1
          className="font-display text-7xl font-semibold tracking-tight"
          style={{ color: STROKE_COLOR }}
        >
          StreetReader
        </h1>
        <p
          className="mt-6 text-xs uppercase tracking-[0.4em]"
          style={{ color: STROKE_COLOR, opacity: 0.55 }}
        >
          {t('map.loading')}
        </p>
      </div>
    </div>
  );
}

export default function MapView({
  vizMode = false,
  userLocation = null,
  selectedFeature = null,
  onSelectFeature = () => {},
  onEngage = () => {},
  placingMode = false,
  userExperiences = [],
  highlightedExperienceId = null,
  onMapPlace = () => {},
  onCancelPlacing = () => {},
  onPickExperience = () => {},
  onBuildingsReady = () => {},
  landmarks = [],
  onSelectLandmark = () => {},
  extraBuildings = [],
  viewMode = 'experience',
  hotspots = [],
  conflicts = [],
  activeTab = 'about',
}) {
  const inDataMap = viewMode === 'datamap';
  // Sensory / memory / complaint pins are research data — only surface
  // them while the contributor is actively in the Experiences tab. The
  // About tab stays clean (just the physical street markers + buildings).
  const showUserPins = activeTab === 'experiences';
  const [lastClickPoint, setLastClickPoint] = useState(null);

  const handleAnyMapClick = (worldPos) => {
    console.log('[MapView] click @ x=%f, z=%f', worldPos[0], worldPos[1]);
    setLastClickPoint(worldPos);
    onMapPlace(worldPos);
  };
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setGeojson(j);
      })
      .catch(() => {
        if (!cancelled) setGeojson({ features: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { fillGeom, strokeGeom, poiGroups, subwayLabels, bbox, project } = useMemo(() => {
    if (!geojson)
      return {
        fillGeom: null,
        strokeGeom: null,
        poiGroups: null,
        subwayLabels: null,
        bbox: null,
        project: null,
      };
    // Projection centre stays anchored to the static geojson bbox — existing
    // curated landmark coords (computed against this centre) keep their
    // positions. The extension just adds more buildings into the same frame.
    const project = makeProjection(geojson);

    // Polygons come from the Overpass way-relation query (corridor is
    // defined authoritatively there). POIs come from the static geojson.
    // While Overpass is loading, fall back to the static polygons so the
    // map isn't blank during the round-trip.
    const usingOverpass = extraBuildings.length > 0;
    const polygonFeatures = usingOverpass
      ? extraBuildings
      : geojson.features.filter(
          (f) =>
            f.geometry?.type === 'Polygon' ||
            f.geometry?.type === 'MultiPolygon',
        );
    console.log(
      '[MapView] buildings:',
      polygonFeatures.length,
      usingOverpass ? '(overpass)' : '(static fallback)',
    );
    const { fillGeom, strokeGeom } = buildBuildingGeometries(
      { features: polygonFeatures },
      project,
    );
    const { groups, subwayLabels } = buildPoiGroups(geojson, project);

    return {
      fillGeom,
      strokeGeom,
      poiGroups: groups,
      subwayLabels,
      bbox: fillGeom.boundingBox,
      project,
    };
  }, [geojson, extraBuildings]);

  // Project the live user location into the same coord system the data uses.
  const userWorld = useMemo(() => {
    if (!project || !userLocation) return null;
    return project([userLocation.lon, userLocation.lat]);
  }, [project, userLocation]);

  // Tell the parent the parent group / building geometry is ready, exactly
  // once. This is the equivalent of a GLTF loader's onLoad callback firing —
  // App.syncStoriesWithMap() waits for this signal before fetching.
  const buildingsReadyFiredRef = useRef(false);
  useEffect(() => {
    if (fillGeom && !buildingsReadyFiredRef.current) {
      buildingsReadyFiredRef.current = true;
      console.log('[MapView] parent group ready — building geometry materialized');
      onBuildingsReady();
    }
  }, [fillGeom, onBuildingsReady]);

  // Fire onEngage exactly once after the user first interacts with the map.
  const engagedRef = useRef(false);
  const handleControlsChange = () => {
    if (!engagedRef.current) {
      engagedRef.current = true;
      onEngage();
    }
  };

  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas
        gl={{ antialias: true }}
        dpr={[1, 2]}
        style={{ cursor: 'crosshair' }}
      >
        <OrthographicCamera
          makeDefault
          position={[0, 1000, 0]}
          up={[0, 0, -1]}
          near={0.1}
          far={5000}
          zoom={1}
        />
        <color attach="background" args={[BG_COLOR]} />

        {/* PARENT GROUP — rotation locks both layers together */}
        <group name="map" rotation-y={ROTATION_OFFSET_Y}>
          {/* Always-on click catcher — fires on every click, logs the point.
              Transparent, sits below buildings/POIs so they still hit-test first. */}
          <ClickCatcher onClick={handleAnyMapClick} />

          {/* Red debug sphere at the most recent click point */}
          <DebugClickMarker point={lastClickPoint} />

          {/* Building layer — fill is hidden in datamap mode so only the
              outline (stroke lines) is visible: a true blueprint look. */}
          <group name="buildings">
            {fillGeom && !inDataMap && (
              <mesh
                geometry={fillGeom}
                renderOrder={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnyMapClick([e.point.x, e.point.z]);
                }}
              >
                <meshBasicMaterial color={FILL_COLOR} toneMapped={false} />
              </mesh>
            )}
            {strokeGeom && (
              <lineSegments geometry={strokeGeom} renderOrder={1}>
                <lineBasicMaterial color={STROKE_COLOR} toneMapped={false} />
              </lineSegments>
            )}
          </group>

          {/* Data layer */}
          <group
            name="pois"
            position={[DATA_X_OFFSET, 0, DATA_Z_OFFSET]}
            scale={DATA_SCALE}
          >
            {/* OSM markers (trees / lamps / shops / etc.) — hidden in
                datamap mode so the blueprint stays uncluttered. */}
            {!inDataMap &&
              poiGroups &&
              Object.entries(poiGroups).map(([cat, entries]) =>
                entries.length > 0 ? (
                  <CategoryMarkers


                  key={cat}
                    category={cat}
                    entries={entries}
                    onPick={onSelectFeature}
                  />
                ) : null,
              )}
            {!inDataMap && userWorld && <UserMarker position={userWorld} />}
            {/* User-experience pins are also hidden in datamap; the algorithm
                replaces them with pulsing hotspot rings. They're additionally
                gated on the active sidebar tab — About keeps the map clean,
                Experiences reveals the sensory archive. */}
            {!inDataMap && showUserPins && fillGeom && (
              <UserPins
                experiences={userExperiences}
                highlightedId={highlightedExperienceId}
                onPick={onPickExperience}
                vizMode={vizMode}
              />
            )}
            {!inDataMap && (
              <FeaturePopup
                feature={selectedFeature}
                onClose={() => onSelectFeature(null)}
              />
            )}
          </group>

          {/* Algorithm overlay — only visible in datamap mode. */}
          {inDataMap && (
            <group name="hotspots">
              {hotspots.map((h) => (
                <HotspotZone key={h.id} hotspot={h} />
              ))}
              {conflicts.map((c) => (
                <ConflictZone key={c.id} conflict={c} />
              ))}
            </group>
          )}
        </group>

        {/* Curated landmark labels — hidden in datamap mode. */}
        {!inDataMap && <PrecisionLabels />}

        {bbox && <FitCamera bbox={bbox} />}

        <OrbitControls
          makeDefault
          enableRotate={false}
          enableDamping
          dampingFactor={0.05}
          screenSpacePanning
          minZoom={1}
          maxZoom={12}
          onChange={handleControlsChange}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>

      <LoadingOverlay visible={!geojson} />
    </div>
  );
}
