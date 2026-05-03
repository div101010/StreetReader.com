import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import MapView, { ROTATION_OFFSET_Y } from './components/MapView.jsx';
import Compass from './components/Compass.jsx';
import Legend from './components/Legend.jsx';
import ContributionPanel from './components/ContributionPanel.jsx';
import IntroAnimation from './components/IntroAnimation.jsx';
// Single global Supabase instance — defined at module scope in lib/supabase.js
// and imported here so forceLoadStories can see it without re-creating
// a client on every render.
import { supabase, rowToExperience } from './lib/supabase.js';
import { getOrCreateUserId, isAdmin } from './lib/userId.js';
import { fetchOSMLandmarks, fetchOSMBuildings } from './lib/overpass.js';
import { generateUrbanInsights } from './lib/urbanInsights.js';
import { MOCK_EXPERIENCES } from './lib/mockExperiences.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('about');
  const [vizMode, setVizMode] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  // 'experience' = the default landing/map view. 'datamap' swaps the
  // sidebar to the Impact Report and the map to a wireframe blueprint.
  const [viewMode, setViewMode] = useState('experience');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const [userExperiences, setUserExperiences] = useState([]);

  // Re-derive clusters / hotspots / conflicts / insights every time the
  // experiences list changes. Pure function, no side effects.
  const urbanInsights = useMemo(
    () => generateUrbanInsights(userExperiences),
    [userExperiences],
  );
  const [placingMode, setPlacingMode] = useState(false);
  const [highlightedExperienceId, setHighlightedExperienceId] = useState(null);

  // Equivalent of "GLTF loader.load onLoad". MapView flips this true once
  // ShapeGeometry / fillGeom for the building parent group is materialized.
  // forceLoadStories waits on it.
  const [buildingsReady, setBuildingsReady] = useState(false);

  // Persistent per-browser identity. Generated once on first load, kept in
  // localStorage thereafter. Stamped onto every insert as `owner_id` so the
  // sidebar can decide which delete buttons to render.
  const [userId] = useState(() => getOrCreateUserId());
  const userIsAdmin = isAdmin(userId);

  // Contribution panel state
  const [pendingPosition, setPendingPosition] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [successToast, setSuccessToast] = useState(false);

  // OSM landmark labels fetched live from Overpass on mount.
  const [landmarks, setLandmarks] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Eastern extension building footprints — Edificio Metrópolis through
  // Círculo de Bellas Artes / Calle de Alcalá. Fetched live and merged with
  // the static geojson buildings inside MapView.
  const [extraBuildings, setExtraBuildings] = useState([]);

  useEffect(() => {
    fetchOSMLandmarks().then(setLandmarks);
    fetchOSMBuildings().then(setExtraBuildings);
  }, []);

  // Single "dot factory" — used by both the optimistic-insert path and the
  // initial-fetch loop so there is one canonical way a pin enters the scene.
  // Pure state update; the actual <UserPin> mesh is rendered by React/r3f
  // from the userExperiences array.
  const addPinToMap = useCallback((story) => {
    setUserExperiences((prev) => {
      if (prev.some((e) => e.id === story.id)) return prev;
      return [story, ...prev];
    });
  }, []);

  // Force-loads every row from `experiences`, drops the empty-state message,
  // and walks the rows to place a 3D pin per record. Uses the exact column
  // names from the schema (x_coord, z_coord) and pins at y=2.
  const forceLoadStories = useCallback(async () => {
    const { data, error } = await supabase
      .from('experiences')
      .select('*');

    if (error) {
      console.error('Supabase Load Error:', error);
      return;
    }

    console.log(
      'CRITICAL: Fetched ' + (data?.length ?? 0) + ' stories from Supabase on load.',
    );

    // Replace sidebar state immediately — this is what removes the "Be the
    // first to share a story" placeholder, since LivedExperiences renders
    // the empty state only when userExperiences.length === 0.
    // Stress-test mocks are prepended; remove MOCK_EXPERIENCES when no
    // longer needed (and the import above) to drop them.
    const realStories = (data || []).map((item) => ({
      id: item.id,
      position: [Number(item.x_coord), Number(item.z_coord)],
      type: item.category,
      text: item.content,
      createdAt: item.created_at,
    }));
    const stories = [...MOCK_EXPERIENCES, ...realStories];
    setUserExperiences(stories);

    if (!data || data.length === 0) return;

    // Loop through the rows and place each pin into the parent group. In r3f
    // the pin "creation" is React rendering one <UserPin> per story (mounted
    // inside <UserPins>, which is a child of the parent <group name="map">).
    // <UserPin> calls position.set(x, 2.0, z) under the hood — see MapView.
    data.forEach((item, i) => {
      console.log(
        `  pin ${i + 1}: position.set(${item.x_coord}, 2.0, ${item.z_coord})`,
      );
    });
  }, []);

  // Wait for the buildings to exist before fetching, so dots are added to
  // the parent group at the same time the parent group is real.
  useEffect(() => {
    if (!buildingsReady) return;
    forceLoadStories();
  }, [buildingsReady, forceLoadStories]);

  useEffect(() => {
    const channel = supabase
      .channel('experiences-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'experiences' },
        () => forceLoadStories(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [forceLoadStories]);

  const handleSelectFeature = (feature) => {
    setSelectedFeature(feature);
  };

  const handleStartPlacing = () => {
    setSelectedFeature(null);
    setPlacingMode(true);
  };

  const handleCancelPlacing = () => {
    setPlacingMode(false);
  };

  // Called for every map click — see MapView.handleAnyMapClick.
  // Opens the contribution panel only when placingMode is true.
  const handleMapPlace = (worldPos) => {
    console.log('[map click]', { x: worldPos[0], z: worldPos[1] });
    if (!placingMode) return;
    setPlacingMode(false);
    setSubmitError(null);
    setPendingPosition(worldPos);
  };

  const handlePanelSubmit = async ({ type, text }) => {
    if (!pendingPosition) return;
    setSubmitError(null);

    const position = pendingPosition;
    const payload = {
      x_coord: position[0],
      z_coord: position[1],
      content: text,
      category: type,
      owner_id: userId,
    };
    console.log('Saving story...', payload);

    // OPTIMISTIC: drop a temp pin + sidebar entry immediately so the UI feels
    // instant. We tag the temp row with a `pending: true` flag and a tempId
    // we can swap out once the server returns the real id.
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimisticExp = {
      id: tempId,
      position,
      type,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
      ownerId: userId,
    };
    addPinToMap(optimisticExp);
    setHighlightedExperienceId(tempId);
    setPendingPosition(null);
    setActiveTab('experiences');

    // Background insert.
    const { data, error } = await supabase
      .from('experiences')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[supabase] insert failed:', error.message);
      // Rollback the optimistic entry and re-open the panel with the user's text.
      setUserExperiences((prev) => prev.filter((e) => e.id !== tempId));
      setHighlightedExperienceId(null);
      setSubmitError(error.message);
      setPendingPosition(position);
      return;
    }
    console.log('[supabase] inserted row:', data);

    // Replace the optimistic row with the authoritative one.
    const realExp = rowToExperience(data);
    setUserExperiences((prev) =>
      prev.map((e) => (e.id === tempId ? realExp : e)),
    );
    setHighlightedExperienceId(realExp.id);

    // Background re-fetch to reconcile in case any other writes happened.
    forceLoadStories();

    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2400);
  };

  const handlePanelCancel = () => {
    setPendingPosition(null);
    setSubmitError(null);
  };

  const handlePickExperience = (id) => {
    setHighlightedExperienceId(id);
    setActiveTab('experiences');
  };

  const handleDeleteExperience = async (id) => {
    // Optimistic remove so the UI feels instant.
    setUserExperiences((prev) => prev.filter((e) => e.id !== id));
    if (highlightedExperienceId === id) setHighlightedExperienceId(null);

    // Server-side ownership check — non-admin clients can only delete rows
    // whose owner_id matches their session id. Admins skip the constraint.
    let query = supabase.from('experiences').delete().eq('id', id);
    if (!userIsAdmin) {
      query = query.eq('owner_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.error('[supabase] delete failed:', error.message);
      // Reconcile from the server in case the optimistic remove was wrong.
      forceLoadStories();
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lon: pos.coords.longitude, lat: pos.coords.latitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-brand-beige font-sans text-brand-green md:h-screen">
      <MapView
        vizMode={vizMode}
        userLocation={userLocation}
        selectedFeature={selectedFeature}
        onSelectFeature={handleSelectFeature}
        placingMode={placingMode}
        userExperiences={userExperiences}
        highlightedExperienceId={highlightedExperienceId}
        onMapPlace={handleMapPlace}
        onCancelPlacing={handleCancelPlacing}
        onPickExperience={handlePickExperience}
        onBuildingsReady={() => setBuildingsReady(true)}
        landmarks={landmarks}
        onSelectLandmark={setCurrentLocation}
        extraBuildings={extraBuildings}
        viewMode={viewMode}
        hotspots={urbanInsights.hotspots}
        conflicts={urbanInsights.conflicts}
      />

      <Sidebar
        userExperiences={userExperiences}
        highlightedId={highlightedExperienceId}
        placingMode={placingMode}
        currentUserId={userId}
        isAdmin={userIsAdmin}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onStartPlacing={handleStartPlacing}
        onCancelPlacing={handleCancelPlacing}
        onDeleteExperience={handleDeleteExperience}
        currentLocation={currentLocation}
        onClearLocation={() => setCurrentLocation(null)}
        vizMode={vizMode}
        onToggleViz={() => setVizMode((v) => !v)}
        viewMode={viewMode}
        onSwitchToDataMap={() => setViewMode('datamap')}
        onBackToExperience={() => setViewMode('experience')}
        insights={urbanInsights.insights}
      />
      {viewMode !== 'datamap' && <Legend />}
      <Compass rotationY={ROTATION_OFFSET_Y} />

      {/* Navigation hint — visible on both viewports, with a touch-aware
          verb swap on mobile. Sits above the map at bottom-4 and respects
          the iOS safe-area inset so it never tucks under the home bar. */}
      <div
        className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 px-4 md:bottom-6"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <p
          className="whitespace-nowrap text-[10px] font-medium uppercase italic"
          style={{
            color: '#1F3A2A',
            opacity: 0.5,
            letterSpacing: '0.3em',
            fontFamily: '"Darker Grotesque", system-ui, sans-serif',
          }}
        >
          <span className="md:hidden">Pinch</span>
          <span className="hidden md:inline">Scroll</span>
          {' '}to zoom · Drag to move
        </p>
      </div>

      <ContributionPanel
        open={!!pendingPosition}
        onSubmit={handlePanelSubmit}
        onCancel={handlePanelCancel}
        error={submitError}
      />

      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      <div
        className="pointer-events-none absolute left-1/2 top-6 z-40"
        style={{
          opacity: successToast ? 1 : 0,
          transform: successToast
            ? 'translate(-50%, 0)'
            : 'translate(-50%, -8px)',
          transition: 'opacity 400ms ease-out, transform 400ms ease-out',
        }}
      >
        <div
          className="rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            backgroundColor: '#1F3A2A',
            color: '#F5F2E8',
            boxShadow: '0 6px 18px rgba(31, 58, 42, 0.22)',
          }}
        >
          ✓  Story pinned to Gran Vía
        </div>
      </div>
    </div>
  );
}
