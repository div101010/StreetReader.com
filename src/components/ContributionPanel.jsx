import { useEffect, useState } from 'react';

const STROKE = '#1F3A2A';
const CREAM = '#F5F2E8';
const TYPES = ['Sensory', 'Memory', 'Complaint'];

// Per-category prompt — keeps the user honest about what kind of detail
// belongs in each bucket. Shown italic under the category toggles.
const TYPE_GUIDANCE = {
  Sensory:
    'What do you smell, hear, or feel in this spot? (e.g., loud traffic, jasmine, wind tunnels).',
  Memory:
    'What happened here in the past? A personal history or a vanished landmark.',
  Complaint:
    'What is making the urban experience difficult here? (e.g., broken pavement, lack of seating).',
};

export default function ContributionPanel({ open, onSubmit, onCancel, error }) {
  const [type, setType] = useState('Sensory');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setType('Sensory');
      setText('');
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onSubmit({ type, text: trimmed });
    setSubmitting(false);
  };

  const canSubmit = text.trim().length > 0 && !submitting;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto"
      style={{
        backgroundColor: 'rgba(31, 58, 42, 0.18)',
        // Honour iOS safe areas so the modal doesn't sit under the
        // notch / home indicator on phones with viewport-fit=cover.
        padding: 'env(safe-area-inset-top, 0px) 16px env(safe-area-inset-bottom, 0px)',
      }}
      onMouseDown={onCancel}
    >
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: 420,
          maxWidth: '90vw',
          // Top/sides keep the original padding; bottom grows by the
          // safe-area inset so iOS browser chrome can't cover the
          // Submit / Cancel row.
          padding: '28px 28px calc(28px + env(safe-area-inset-bottom, 0px))',
          borderRadius: 18,
          backgroundColor: 'rgba(245, 242, 232, 0.94)',
          border: `1px solid ${STROKE}33`,
          boxShadow: '0 14px 44px rgba(31, 58, 42, 0.20)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          backdropFilter: 'blur(20px) saturate(140%)',
          fontFamily: '"Darker Grotesque", system-ui, sans-serif',
          color: STROKE,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <p
          style={{
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: 0.55,
            margin: 0,
          }}
        >
          Pin a story
        </p>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.1,
            margin: '4px 0 18px',
            color: STROKE,
          }}
        >
          What happened here?
        </h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {TYPES.map((t) => {
            const selected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  // 44px-tall tap target on every viewport. Padding alone
                  // didn't reach the iOS HIG minimum on small screens.
                  minHeight: 44,
                  padding: '12px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: 9,
                  cursor: 'pointer',
                  border: `1px solid ${selected ? STROKE : STROKE + '33'}`,
                  backgroundColor: selected ? STROKE : 'transparent',
                  color: selected ? CREAM : STROKE,
                  fontFamily: 'inherit',
                  transition: 'all 150ms ease',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Per-category guidance — switches with the selected toggle so the
            contributor knows what kind of detail belongs in this bucket. */}
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 12.5,
            fontStyle: 'italic',
            lineHeight: 1.45,
            color: STROKE,
            opacity: 0.65,
          }}
        >
          {TYPE_GUIDANCE[type]}
        </p>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the sensory, the memory, the complaint…"
          rows={5}
          style={{
            width: '100%',
            padding: 12,
            // 16px is the iOS auto-zoom-on-focus threshold — staying at 16
            // keeps Safari from zooming the page when the textarea is tapped.
            fontSize: 16,
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            borderRadius: 10,
            border: `1px solid ${STROKE}25`,
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
            color: STROKE,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: '#8a3b2a',
              backgroundColor: 'rgba(138, 59, 42, 0.08)',
              border: '1px solid rgba(138, 59, 42, 0.2)',
              borderRadius: 8,
              padding: '8px 10px',
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: 44,
              padding: '12px 14px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              borderRadius: 10,
              border: `1px solid ${STROKE}33`,
              backgroundColor: 'transparent',
              color: STROKE,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              flex: 1.4,
              minHeight: 44,
              padding: '12px 14px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              borderRadius: 10,
              border: 'none',
              backgroundColor: canSubmit ? STROKE : `${STROKE}55`,
              color: CREAM,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
            }}
          >
            {submitting ? 'Sharing…' : 'Share Story'}
          </button>
        </div>
      </form>
    </div>
  );
}
