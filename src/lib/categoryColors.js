// Color palette for experience categories. Tones are intentionally muted
// (terracotta / slate / brick) so they sit alongside the dark-green + cream
// brand palette without clashing.
export const CATEGORY_COLORS = {
  Sensory: {
    primary: '#C77A4A',                       // muted terracotta orange
    border: 'rgba(199, 122, 74, 0.55)',
    bg: 'rgba(199, 122, 74, 0.16)',
    bgStrong: 'rgba(199, 122, 74, 0.32)',
  },
  Memory: {
    primary: '#5A7CA0',                       // slate blue
    border: 'rgba(90, 124, 160, 0.55)',
    bg: 'rgba(90, 124, 160, 0.16)',
    bgStrong: 'rgba(90, 124, 160, 0.32)',
  },
  Complaint: {
    primary: '#A65244',                       // dusty brick red
    border: 'rgba(166, 82, 68, 0.55)',
    bg: 'rgba(166, 82, 68, 0.16)',
    bgStrong: 'rgba(166, 82, 68, 0.32)',
  },
};

const DEFAULT_CATEGORY = {
  primary: '#306B47',
  border: 'rgba(48, 107, 71, 0.55)',
  bg: 'rgba(48, 107, 71, 0.16)',
  bgStrong: 'rgba(48, 107, 71, 0.32)',
};

export function getCategoryColors(type) {
  return CATEGORY_COLORS[type] || DEFAULT_CATEGORY;
}
