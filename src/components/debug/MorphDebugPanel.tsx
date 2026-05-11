import { useState } from 'react'
import type { BlendshapeValues } from '../../types/blendshape'
import { CONTROLLABLE_MORPH_KEYS } from '../../config/morphKeys'
import { getBlendshapeMaxValue } from '../../utils/controlConfig'

interface MorphDebugPanelProps {
  target: BlendshapeValues
  player: BlendshapeValues
  score: number | null
}

export function MorphDebugPanel({ target, player, score }: MorphDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 80,
    left: 20,
    zIndex: 10,
    padding: '8px 12px',
    background: '#333',
    color: '#fff',
    border: '1px solid #666',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    left: 20,
    width: 600,
    maxHeight: '60vh',
    background: 'rgba(0, 0, 0, 0.9)',
    color: '#fff',
    border: '1px solid #666',
    borderRadius: 4,
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '11px',
    zIndex: 11,
    overflowY: 'auto',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #555',
  }

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 16,
  }

  const scoreStyle: React.CSSProperties = {
    marginBottom: '12px',
    padding: '8px',
    background: 'rgba(100, 100, 100, 0.3)',
    borderRadius: 3,
    textAlign: 'center',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '4px 6px',
    borderBottom: '1px solid #555',
    fontWeight: 'bold',
  }

  const tdStyle: React.CSSProperties = {
    padding: '4px 6px',
    borderBottom: '1px solid #333',
  }

  const rowDiffStyle: React.CSSProperties = {
    background: 'rgba(255, 100, 100, 0.2)',
  }

  if (!isOpen) {
    return (
      <button
        style={toggleButtonStyle}
        onClick={() => setIsOpen(true)}
        title="Open morph debug panel"
      >
        🔍 Debug Morphs
      </button>
    )
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0 }}>Morph Debug Panel</h3>
        <button
          style={closeButtonStyle}
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
      </div>

      <div style={scoreStyle}>
        <strong>Score: {score ?? '-'} / 100</strong>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr style={{ background: 'rgba(100, 100, 100, 0.2)' }}>
            <th style={thStyle}>Morph Key</th>
            <th style={thStyle}>Target</th>
            <th style={thStyle}>Player</th>
            <th style={thStyle}>Max</th>
            <th style={thStyle}>Diff %</th>
          </tr>
        </thead>
        <tbody>
          {CONTROLLABLE_MORPH_KEYS.map((key) => {
            const targetVal = target[key as keyof BlendshapeValues] ?? 0
            const playerVal = player[key as keyof BlendshapeValues] ?? 0
            const maxVal = getBlendshapeMaxValue(key as keyof BlendshapeValues)
            const diff = Math.abs(targetVal - playerVal)
            const diffPercent = ((diff / maxVal) * 100).toFixed(1)
            const hasDiff = diff > 0.05

            return (
              <tr
                key={key}
                style={hasDiff ? { ...tdStyle, ...rowDiffStyle } : tdStyle}
              >
                <td style={tdStyle}>{key}</td>
                <td style={tdStyle}>{targetVal.toFixed(3)}</td>
                <td style={tdStyle}>{playerVal.toFixed(3)}</td>
                <td style={tdStyle}>{maxVal.toFixed(2)}</td>
                <td style={tdStyle} title={`Diff: ${diff.toFixed(3)}`}>
                  {diffPercent}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}