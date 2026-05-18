import { useThemeStore } from '../../store/themeStore';

// ─── ThemePreview ──────────────────────────────────────────────────────────
//
// Self-contained ~240×180 px mock-up card.
// All colours come from CSS variables injected by themeStore, so this
// component automatically stays in sync with any theme changes.

export function ThemePreview() {
  const { accentColor, backgroundColor, density } = useThemeStore();

  // Map density to padding classes for the preview
  const padMap = { compact: '4px', comfortable: '8px', spacious: '14px' };
  const pad = padMap[density];

  return (
    <div
      aria-label="Live theme preview"
      style={{
        width: 240,
        height: 180,
        borderRadius: 10,
        overflow: 'hidden',
        background: backgroundColor,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        fontFamily: 'ui-monospace, "Fira Code", monospace',
        fontSize: 10,
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Fake toolbar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `${pad} 8px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}
      >
        {['Query', 'Schema', 'Results'].map((tab, i) => (
          <div
            key={tab}
            style={{
              padding: '2px 8px',
              borderRadius: 5,
              fontSize: 9,
              background: i === 0 ? accentColor : 'rgba(255,255,255,0.07)',
              color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)',
              fontWeight: i === 0 ? 600 : 400,
              border: i === 0 ? `1px solid ${accentColor}` : '1px solid transparent',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {tab}
          </div>
        ))}
        {/* Spacer */}
        <div style={{ flex: 1 }} />
        {/* Run button */}
        <div
          style={{
            padding: '2px 8px',
            borderRadius: 5,
            fontSize: 9,
            background: accentColor,
            color: '#fff',
            fontWeight: 600,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          ▶ Run
        </div>
      </div>

      {/* ── Fake DSL editor ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: pad,
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          lineHeight: 1.6,
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#818cf8' }}>SELECT</span>
        <span style={{ color: '#e2e8f0' }}> id, name, </span>
        <span style={{ color: '#34d399' }}>COUNT</span>
        <span style={{ color: '#e2e8f0' }}>(*)</span>
        <br />
        <span style={{ color: '#818cf8' }}>FROM</span>
        <span style={{ color: accentColor }}> users </span>
        <span style={{ color: '#818cf8' }}>GROUP BY</span>
        <span style={{ color: '#e2e8f0' }}> id</span>
      </div>

      {/* ── Fake results table ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: pad }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            paddingBottom: 4,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 4,
          }}
        >
          {['id', 'name', 'count(*)'].map((col) => (
            <div
              key={col}
              style={{
                flex: 1,
                color: accentColor,
                fontWeight: 600,
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {col}
            </div>
          ))}
        </div>
        {/* Data rows */}
        {[
          ['1', 'alice', '42'],
          ['2', 'bob',   '17'],
          ['3', 'carol', '88'],
        ].map(([id, name, cnt]) => (
          <div
            key={id}
            style={{
              display: 'flex',
              gap: 4,
              paddingTop: 2,
              paddingBottom: 2,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ flex: 1, color: 'rgba(255,255,255,0.35)' }}>{id}</div>
            <div style={{ flex: 1, color: 'rgba(255,255,255,0.75)' }}>{name}</div>
            <div style={{ flex: 1, color: '#34d399' }}>{cnt}</div>
          </div>
        ))}
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3px 8px',
          background: `${accentColor}22`,
          borderTop: `1px solid ${accentColor}44`,
          flexShrink: 0,
        }}
      >
        <span style={{ color: accentColor, fontSize: 8, fontWeight: 600 }}>● 3 rows</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>12ms</span>
      </div>
    </div>
  );
}
