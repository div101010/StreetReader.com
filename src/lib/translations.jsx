// All user-facing strings, indexed by short dotted keys. Two locales:
// English (en) and Spanish (es). Keys must exist in BOTH dictionaries —
// fall-throughs default to the English string and warn in dev.
//
// Brand names ("StreetReader"), proper nouns ("Gran Vía", "Plaza de
// España", "Callao", "Telefónica", "Metropolis", "Madrid") are NOT
// translated — they stay identical across locales.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const SUPPORTED_LANGS = ['en', 'es'];

const dict = {
  en: {
    // ── Generic ──────────────────────────────────────────────────────
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.delete': 'delete',
    'common.story': 'story',
    'common.stories': 'stories',
    'common.justNow': 'just now',
    'common.minAgo': 'min ago',
    'common.hrAgo': 'hr ago',
    'common.dayAgo': 'day ago',
    'common.daysAgo': 'days ago',

    // ── Sidebar ──────────────────────────────────────────────────────
    'sidebar.tab.about': 'About',
    'sidebar.tab.experiences': 'Experiences',
    'sidebar.platformFeedback': 'Platform Feedback',
    'sidebar.footer': 'Gran Vía, Madrid · 2026',
    'sidebar.currentLocation': 'Current Location',
    'sidebar.openMenu': 'Open menu',
    'sidebar.closeMenu': 'Close menu',
    'sidebar.menu': 'Menu',

    // ── About ────────────────────────────────────────────────────────
    'about.intro':
      "StreetReader is a sensory re-reading of Madrid's Gran Vía. It maps the corridor through the people who live and walk it — their memories, their senses, their grievances — alongside the architectural plan.",
    'about.fourPillars': 'The Four Pillars',
    'about.pillar.ecological.title': 'Ecological Integration',
    'about.pillar.ecological.blurb':
      'Reconnecting the street to nature beyond metrics.',
    'about.pillar.spatial.title': 'Spatial Justice',
    'about.pillar.spatial.blurb': 'Questioning who the street is actually for.',
    'about.pillar.organic.title': 'Organic Design',
    'about.pillar.organic.blurb':
      'Moving away from rigid, "high-performance" corridor layouts.',
    'about.pillar.participatory.title': 'Participatory Agency',
    'about.pillar.participatory.blurb':
      'Allowing lived data to drive institutional change.',

    // ── Lived Experiences (sidebar tab) ──────────────────────────────
    'lived.title': 'Lived Experiences',
    'lived.tapHint': 'Click anywhere on the map to share a story.',
    'lived.add': '+  Add your own story',
    'lived.cancel': '✕  Cancel — pick a spot on the map',
    'lived.empty.eyebrow': 'The map is currently silent',
    'lived.empty.body': 'Be the first to share a lived experience.',
    'lived.viz.title': 'Reveal Lived Intensity',
    'lived.viz.subtitle':
      'Visualize real-time sensory & grievance hotspots',
    'lived.datamap.title': 'Urban Impact Strategy',
    'lived.datamap.subtitle':
      'Algorithmic plan for institutional intervention',

    // ── Categories ───────────────────────────────────────────────────
    'category.Sensory': 'Sensory',
    'category.Memory': 'Memory',
    'category.Complaint': 'Complaint',
    'category.Story': 'Story',
    'category.Conflict': 'Protection Zone',

    // ── Pin a Story modal ────────────────────────────────────────────
    'pin.eyebrow': 'Pin a story',
    'pin.heading': 'What happened here?',
    'pin.guidance.Sensory':
      'What do you smell, hear, or feel in this spot? (e.g., loud traffic, jasmine, wind tunnels).',
    'pin.guidance.Memory':
      'What happened here in the past? A personal history or a vanished landmark.',
    'pin.guidance.Complaint':
      'What is making the urban experience difficult here? (e.g., broken pavement, lack of seating).',
    'pin.placeholder': 'Describe the sensory, the memory, the complaint…',
    'pin.submit': 'Share Story',
    'pin.submitting': 'Sharing…',

    // ── Platform feedback modal ──────────────────────────────────────
    'feedback.eyebrow': 'Platform Feedback',
    'feedback.heading': 'Help us evolve StreetReader',
    'feedback.subtext':
      'How can this platform better represent the lived reality of Madrid?',
    'feedback.label': 'Your reflection',
    'feedback.placeholder':
      "Share what's missing, what feels off, or what could go further…",
    'feedback.note': 'Submitted anonymously · for research only.',
    'feedback.sending': 'Sending…',
    'feedback.success.eyebrow': 'Submitted',
    'feedback.success.title': 'Thank you for contributing to the research!',
    'feedback.success.body':
      'Your perspective helps shape how StreetReader evolves.',

    // ── Evidence modal ───────────────────────────────────────────────
    'evidence.eyebrow': 'Lived Evidence',
    'evidence.zoneFallback': 'Gran Vía corridor',
    'evidence.empty': 'No stories on file for this cluster.',
    'evidence.footer':
      'Stories shown without authorship or timestamps · privacy-aggregated.',

    // ── Impact report ────────────────────────────────────────────────
    'impact.back': '←  Back to Experiences',
    'impact.eyebrow': 'Data Map',
    'impact.heading': 'Actionable Urban Plan',
    'impact.subhead':
      'Generated from clusters of 3+ stories within a 40-metre radius.',
    'impact.empty':
      'Not enough clustered data yet. Pin more stories of the same category within 40 m of each other to generate the plan.',
    'impact.footer': 'Data is spatially aggregated to protect participant privacy.',
    'impact.zone': 'Zone',
    'impact.segment': 'Segment',
    'impact.cluster.Sensory': 'Sensory Cluster',
    'impact.cluster.Memory': 'Memory Cluster',
    'impact.cluster.Complaint': 'Complaint Cluster',
    'impact.cluster.Conflict': 'Protection Zone',
    'impact.clustered': 'clustered',

    // Insight templates (used inside urbanInsights.js)
    'insight.Sensory':
      'Sensory Intervention: implement acoustic buffering or green rest zones.',
    'insight.Memory':
      'Social Heritage Site: recommend community signage or digital plaques.',
    'insight.Complaint':
      'Immediate Infrastructure Correction: lighting / access audit required.',
    'insight.Conflict':
      'High-Priority Protection Zone: a complaint cluster overlaps a memory cluster — balance heritage preservation with infrastructure repair.',
    // Zone labels — `{name}` is the landmark passed by the caller.
    'zone.vicinity': 'Vicinity of {name}',
    'zone.approach': '{name} Approach',

    // ── Legend ───────────────────────────────────────────────────────
    'legend.title': 'Gran Vía, Madrid',
    'legend.subtitle': 'Sensory Re-Reading · 2026',
    'legend.openMobile': 'Legend',
    'legend.openAria': 'Open legend',
    'legend.closeAria': 'Close legend',
    'legend.item.lamps': 'Street Lamps / Lighting',
    'legend.item.trees': 'Trees & Vegetation',
    'legend.item.housing': 'Housing / Residential',
    'legend.item.shops': 'Shops, Cinemas & Leisure',
    'legend.item.foodTrucks': 'Food Trucks / Temporary Stalls',
    'legend.item.metro': 'Metro / Public Transit',

    // ── Misc / global ────────────────────────────────────────────────
    'nav.zoom.scroll': 'Scroll',
    'nav.zoom.pinch': 'Pinch',
    'nav.zoomDragSuffix': 'to zoom · Drag to move',
    'toast.pinned': '✓  Story pinned to Gran Vía',
    'map.loading': 'Initializing map',
    'intro.subtitle': 'Perceived Reality v/s Lived Reality',
  },

  es: {
    // ── Genérico ─────────────────────────────────────────────────────
    'common.cancel': 'Cancelar',
    'common.submit': 'Enviar',
    'common.close': 'Cerrar',
    'common.delete': 'eliminar',
    'common.story': 'historia',
    'common.stories': 'historias',
    'common.justNow': 'justo ahora',
    'common.minAgo': 'min',
    'common.hrAgo': 'h',
    'common.dayAgo': 'día',
    'common.daysAgo': 'días',

    // ── Sidebar ──────────────────────────────────────────────────────
    'sidebar.tab.about': 'Acerca',
    'sidebar.tab.experiences': 'Experiencias',
    'sidebar.platformFeedback': 'Comentarios',
    'sidebar.footer': 'Gran Vía, Madrid · 2026',
    'sidebar.currentLocation': 'Ubicación actual',
    'sidebar.openMenu': 'Abrir menú',
    'sidebar.closeMenu': 'Cerrar menú',
    'sidebar.menu': 'Menú',

    // ── Acerca ───────────────────────────────────────────────────────
    'about.intro':
      'StreetReader es una relectura sensorial de la Gran Vía de Madrid. Cartografía el corredor a través de las personas que lo habitan y caminan — sus recuerdos, sus sentidos, sus quejas — junto al plan arquitectónico.',
    'about.fourPillars': 'Los Cuatro Pilares',
    'about.pillar.ecological.title': 'Integración Ecológica',
    'about.pillar.ecological.blurb':
      'Reconectar la calle con la naturaleza más allá de las métricas.',
    'about.pillar.spatial.title': 'Justicia Espacial',
    'about.pillar.spatial.blurb':
      'Cuestionar para quién es realmente la calle.',
    'about.pillar.organic.title': 'Diseño Orgánico',
    'about.pillar.organic.blurb':
      'Alejarse de los corredores rígidos de "alto rendimiento".',
    'about.pillar.participatory.title': 'Agencia Participativa',
    'about.pillar.participatory.blurb':
      'Permitir que los datos vividos impulsen el cambio institucional.',

    // ── Experiencias vividas ─────────────────────────────────────────
    'lived.title': 'Experiencias vividas',
    'lived.tapHint':
      'Toca en cualquier punto del mapa para compartir una historia.',
    'lived.add': '+  Añadir tu propia historia',
    'lived.cancel': '✕  Cancelar — elige un punto en el mapa',
    'lived.empty.eyebrow': 'El mapa está en silencio',
    'lived.empty.body': 'Sé el primero en compartir una experiencia vivida.',
    'lived.viz.title': 'Mostrar intensidad vivida',
    'lived.viz.subtitle':
      'Visualizar focos sensoriales y de queja en tiempo real',
    'lived.datamap.title': 'Estrategia de impacto urbano',
    'lived.datamap.subtitle': 'Plan algorítmico para intervención institucional',

    // ── Categorías ───────────────────────────────────────────────────
    'category.Sensory': 'Sensorial',
    'category.Memory': 'Memoria',
    'category.Complaint': 'Queja',
    'category.Story': 'Historia',
    'category.Conflict': 'Zona de protección',

    // ── Modal: Publicar historia ─────────────────────────────────────
    'pin.eyebrow': 'Publicar una historia',
    'pin.heading': '¿Qué ha ocurrido aquí?',
    'pin.guidance.Sensory':
      '¿Qué hueles, escuchas o sientes en este punto? (p. ej., tráfico ruidoso, jazmín, túneles de viento).',
    'pin.guidance.Memory':
      '¿Qué ocurrió aquí en el pasado? Una historia personal o un lugar desaparecido.',
    'pin.guidance.Complaint':
      '¿Qué hace difícil la experiencia urbana aquí? (p. ej., aceras rotas, falta de bancos).',
    'pin.placeholder': 'Describe lo sensorial, la memoria, la queja…',
    'pin.submit': 'Publicar historia',
    'pin.submitting': 'Publicando…',

    // ── Modal: Comentarios ───────────────────────────────────────────
    'feedback.eyebrow': 'Comentarios sobre la plataforma',
    'feedback.heading': 'Ayúdanos a hacer evolucionar StreetReader',
    'feedback.subtext':
      '¿Cómo podría esta plataforma representar mejor la realidad vivida de Madrid?',
    'feedback.label': 'Tu reflexión',
    'feedback.placeholder':
      'Comparte qué falta, qué no encaja o qué podría ir más allá…',
    'feedback.note': 'Enviado anónimamente · solo para investigación.',
    'feedback.sending': 'Enviando…',
    'feedback.success.eyebrow': 'Enviado',
    'feedback.success.title': '¡Gracias por contribuir a la investigación!',
    'feedback.success.body':
      'Tu perspectiva ayuda a dar forma a la evolución de StreetReader.',

    // ── Modal: Evidencia ─────────────────────────────────────────────
    'evidence.eyebrow': 'Evidencia vivida',
    'evidence.zoneFallback': 'Corredor Gran Vía',
    'evidence.empty': 'No hay historias registradas para este grupo.',
    'evidence.footer':
      'Historias mostradas sin autoría ni marca temporal · agregadas para preservar la privacidad.',

    // ── Informe de impacto ───────────────────────────────────────────
    'impact.back': '←  Volver a Experiencias',
    'impact.eyebrow': 'Mapa de datos',
    'impact.heading': 'Plan urbano accionable',
    'impact.subhead':
      'Generado a partir de grupos de 3+ historias en un radio de 40 metros.',
    'impact.empty':
      'Aún no hay suficientes datos agrupados. Publica más historias de la misma categoría a menos de 40 m entre sí para generar el plan.',
    'impact.footer':
      'Los datos se agregan espacialmente para proteger la privacidad de quienes participan.',
    'impact.zone': 'Zona',
    'impact.segment': 'Tramo',
    'impact.cluster.Sensory': 'Grupo sensorial',
    'impact.cluster.Memory': 'Grupo de memoria',
    'impact.cluster.Complaint': 'Grupo de quejas',
    'impact.cluster.Conflict': 'Zona de protección',
    'impact.clustered': 'agrupadas',

    'insight.Sensory':
      'Intervención sensorial: implementar amortiguamiento acústico o zonas verdes de descanso.',
    'insight.Memory':
      'Sitio de patrimonio social: se recomienda señalética comunitaria o placas digitales.',
    'insight.Complaint':
      'Corrección urgente de infraestructura: requiere auditoría de iluminación / accesibilidad.',
    'insight.Conflict':
      'Zona de protección de alta prioridad: un grupo de quejas se solapa con un grupo de memoria — equilibrar la preservación patrimonial con la reparación de infraestructura.',
    'zone.vicinity': 'Cerca de {name}',
    'zone.approach': 'Aproximación a {name}',

    // ── Leyenda ──────────────────────────────────────────────────────
    'legend.title': 'Gran Vía, Madrid',
    'legend.subtitle': 'Relectura sensorial · 2026',
    'legend.openMobile': 'Leyenda',
    'legend.openAria': 'Abrir leyenda',
    'legend.closeAria': 'Cerrar leyenda',
    'legend.item.lamps': 'Farolas / Iluminación',
    'legend.item.trees': 'Árboles y vegetación',
    'legend.item.housing': 'Vivienda / Residencial',
    'legend.item.shops': 'Tiendas, cines y ocio',
    'legend.item.foodTrucks': 'Food trucks / Puestos temporales',
    'legend.item.metro': 'Metro / Transporte público',

    // ── Varios ───────────────────────────────────────────────────────
    'nav.zoom.scroll': 'Desplaza',
    'nav.zoom.pinch': 'Pellizca',
    'nav.zoomDragSuffix': 'para acercar · Arrastra para mover',
    'toast.pinned': '✓  Historia anclada en Gran Vía',
    'map.loading': 'Inicializando mapa',
    'intro.subtitle': 'Realidad percibida v/s Realidad vivida',
  },
};

const STORAGE_KEY = 'streetreader.lang';

function readInitialLang() {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  // Fall back to navigator language. es-ES, es-MX, etc. all map to 'es'.
  const nav = (window.navigator?.language || 'en').toLowerCase();
  if (nav.startsWith('es')) return 'es';
  return 'en';
}

// Lightweight {name}-style interpolation. We don't need a full ICU pipeline
// for a five-key vocabulary.
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`,
  );
}

export function translate(lang, key, vars) {
  const table = dict[lang] || dict.en;
  const raw = table[key] ?? dict.en[key];
  if (raw == null) {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] Missing translation for key "${key}"`);
    }
    return key;
  }
  return interpolate(raw, vars);
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (SUPPORTED_LANGS.includes(next)) setLangState(next);
  }, []);

  // Stable t() per language change; interpolation vars handled per-call.
  const value = useMemo(() => {
    const t = (key, vars) => translate(lang, key, vars);
    return { lang, setLang, t };
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
