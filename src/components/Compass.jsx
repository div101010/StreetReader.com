export default function Compass({ rotationY = 0 }) {
  // The compass rotates opposite to the map so 'N' always points to true north.
  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-20 hidden md:block">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/30 shadow-md backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
          WebkitBackdropFilter: 'blur(14px)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="-24 -24 48 48"
          style={{
            transform: `rotate(${-rotationY}rad)`,
            transition: 'transform 200ms ease-out',
          }}
        >
          <circle cx="0" cy="0" r="20" fill="none" stroke="#1F3A2A" strokeOpacity="0.18" strokeWidth="0.5" />
          <polygon points="0,-16 4,4 0,1 -4,4" fill="#1F3A2A" />
          <polygon points="0,16 4,-4 0,-1 -4,-4" fill="#1F3A2A" fillOpacity="0.25" />
          <text
            x="0"
            y="-19"
            textAnchor="middle"
            fontSize="6"
            fontWeight="600"
            fontFamily='"Darker Grotesque", system-ui, sans-serif'
            fill="#1F3A2A"
            transform="translate(0, 2.5)"
          >
            N
          </text>
        </svg>
      </div>
    </div>
  );
}
