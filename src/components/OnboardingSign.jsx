export default function OnboardingSign({ visible }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-6 z-30"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, -8px)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
      }}
    >
      <div
        className="rounded-full px-6 py-3 text-sm font-medium"
        style={{
          backgroundColor: 'rgba(31, 58, 42, 0.92)',
          color: '#FAF5EB',
          boxShadow: '0 6px 18px rgba(31, 58, 42, 0.22)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
          letterSpacing: '0.01em',
        }}
      >
        Click anywhere on the map to share your lived experience of Gran Vía.
      </div>
    </div>
  );
}
