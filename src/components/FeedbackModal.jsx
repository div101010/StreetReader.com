import { useEffect, useRef, useState } from 'react';
import { submitPlatformFeedback } from '../lib/supabase.js';
import { useTranslation } from '../lib/translations.jsx';

const STROKE = '#1F3A2A';
const CREAM = '#F5F2E8';

export default function FeedbackModal({ open, onClose = () => {} }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef(null);

  // Reset state every time the modal opens.
  useEffect(() => {
    if (open) {
      setText('');
      setStatus('idle');
      setErrorMsg('');
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Auto-close 2s after success.
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(t);
  }, [status, onClose]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && status !== 'submitting';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    setErrorMsg('');
    const { error } = await submitPlatformFeedback(trimmed);
    if (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Submission failed.');
      return;
    }
    setStatus('success');
  };

  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{
        // Same dark-green wash + subtle blur as Pin-a-Story so both modals
        // share the standard "focus-the-user" backdrop.
        backgroundColor: 'rgba(31, 58, 42, 0.18)',
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)',
        // Honour iOS safe areas so nothing sits under the notch / home bar.
        padding: 'env(safe-area-inset-top, 0px) 16px env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          // Match Pin-a-Story dimensions exactly.
          width: 420,
          maxWidth: '90vw',
          // Bottom padding grows by the safe-area inset so iOS browser
          // chrome can't cover the Submit / Cancel row.
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
        {/* Header — matches the eyebrow / title rhythm of Pin-a-Story */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                opacity: 0.55,
                margin: 0,
              }}
            >
              {t('feedback.eyebrow')}
            </p>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.15,
                margin: '4px 0 0',
                color: STROKE,
              }}
            >
              {t('feedback.heading')}
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                fontStyle: 'italic',
                lineHeight: 1.45,
                color: STROKE,
                opacity: 0.7,
              }}
            >
              {t('feedback.subtext')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            style={{
              flexShrink: 0,
              // 44px hit target — meets the iOS HIG minimum and matches
              // the menu close-button on the mobile drawer.
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `1px solid ${STROKE}33`,
              backgroundColor: 'transparent',
              color: STROKE,
              fontSize: 20,
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            margin: '18px 0 16px',
            height: 1,
            backgroundColor: 'rgba(31, 58, 42, 0.18)',
          }}
        />

        {status === 'success' ? (
          <div
            style={{
              padding: '28px 4px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                opacity: 0.55,
                margin: 0,
              }}
            >
              {t('feedback.success.eyebrow')}
            </p>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.3,
                color: STROKE,
              }}
            >
              {t('feedback.success.title')}
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                fontStyle: 'italic',
                lineHeight: 1.45,
                opacity: 0.65,
              }}
            >
              {t('feedback.success.body')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="platform-feedback-textarea"
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                opacity: 0.6,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              {t('feedback.label')}
            </label>
            <textarea
              id="platform-feedback-textarea"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={t('feedback.placeholder')}
              disabled={status === 'submitting'}
              className="feedback-textarea"
              style={{
                width: '100%',
                padding: 12,
                // 16px stays below iOS Safari's auto-zoom-on-focus
                // threshold, so tapping the textarea doesn't zoom the page.
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

            {status === 'error' && (
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
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'submitting'}
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
                  opacity: status === 'submitting' ? 0.5 : 1,
                }}
              >
                {t('common.cancel')}
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
                }}
              >
                {status === 'submitting' ? t('feedback.sending') : t('common.submit')}
              </button>
            </div>

            <p
              style={{
                margin: '14px 0 0',
                fontSize: 10,
                fontStyle: 'italic',
                opacity: 0.55,
                lineHeight: 1.5,
              }}
            >
              {t('feedback.note')}
            </p>
          </form>
        )}
      </div>

      <style>{`
        .feedback-textarea:focus {
          border-color: ${STROKE};
          box-shadow: 0 0 0 3px rgba(31, 58, 42, 0.18);
        }
      `}</style>
    </div>
  );
}
