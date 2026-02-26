import { useState, useEffect } from 'react'
import {
  Wind, Eye, Cloud, Thermometer, Gauge, Radar,
  AlertTriangle, RefreshCw, Plus, X, ChevronRight,
  Activity, CloudFog, Sun, CloudSun,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// ── Token colour map for the METAR visual explainer ──────────────────────────
const TOKEN_GROUPS = [
  { id: 'type', label: 'Tipo', color: '#60a5fa', regex: /^(METAR|SPECI)$/ },
  { id: 'auto', label: 'AUTO', color: '#fbbf24', regex: /^AUTO$/ },
  { id: 'station', label: 'Estación', color: '#a78bfa', regex: /^[A-Z]{4}$/ },
  { id: 'time', label: 'Fecha/Hora', color: '#34d399', regex: /^\d{6}Z$/ },
  { id: 'wind', label: 'Viento', color: '#38bdf8', regex: /^(\d{3}|VRB)\d{2,3}(G\d{2,3})?KT$/ },
  { id: 'windvar', label: 'Var. viento', color: '#38bdf8', regex: /^\d{3}V\d{3}$/ },
  { id: 'vis', label: 'Visibilidad', color: '#a3e635', regex: /^(\d{4}|CAVOK|NOSIG)$/ },
  { id: 'rvr', label: 'VPR', color: '#fb923c', regex: /^R\d{2}[LRC]?\// },
  {
    id: 'wx', label: 'Fenómenos', color: '#f472b6',
    regex: /^[-+]?(VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|BR|FG|FU|VA|DU|SA|HZ){1,2}$/
  },
  { id: 'cloud', label: 'Nubes', color: '#94a3b8', regex: /^(FEW|SCT|BKN|OVC|NSC|NCD)\d{0,3}(CB|TCU)?$/ },
  { id: 'temp', label: 'Temp/Rocío', color: '#f97316', regex: /^M?\d{2}\/M?\d{2}$/ },
  { id: 'qnh', label: 'QNH', color: '#e879f9', regex: /^Q\d{4}$/ },
  { id: 'trend', label: 'Tendencia', color: '#fbbf24', regex: /^(BECMG|TEMPO|NOSIG)$/ },
]

function isStationToken(token, index, tokens) {
  if (!/^[A-Z]{4}$/.test(token)) return false
  const prev = tokens[index - 1]
  return index === 0 || prev === 'METAR' || prev === 'SPECI'
}

function classifyToken(token, index, tokens) {
  if (isStationToken(token, index, tokens)) {
    return TOKEN_GROUPS.find(g => g.id === 'station') || null
  }
  for (const g of TOKEN_GROUPS) {
    if (g.id === 'station') continue
    if (g.regex.test(token)) return g
  }
  return null
}

// ── Wind rose ─────────────────────────────────────────────────────────────────
function WindRose({ degrees, isVariable }) {
  const deg = Number.isFinite(Number(degrees)) ? Number(degrees) : null
  const ticks = Array.from({ length: 8 }, (_, i) => i * 45)

  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      {/* Glow effect behind the wind rose */}
      <div style={{ position: 'absolute', inset: 10, background: 'var(--accent)', filter: 'blur(20px)', opacity: 0.15, borderRadius: '50%' }} />
      <svg viewBox="0 0 88 88" style={{ width: 88, height: 88, position: 'relative', zIndex: 1 }}>
        {/* outer ring */}
        <circle cx="44" cy="44" r="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
        {/* inner ring */}
        <circle cx="44" cy="44" r="30" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" strokeDasharray="2 4" />
        {/* ticks */}
        {ticks.map(d => {
          const r = (d * Math.PI) / 180
          const x1 = 44 + 40 * Math.sin(r)
          const y1 = 44 - 40 * Math.cos(r)
          const x2 = 44 + 35 * Math.sin(r)
          const y2 = 44 - 35 * Math.cos(r)
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.25)" strokeWidth={d % 90 === 0 ? 2 : 1} />
        })}
        {/* Cardinal labels */}
        {[['N', 44, 4], ['E', 84, 44], ['S', 44, 85], ['O', 4, 44]].map(([l, x, y]) => (
          <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            style={{ fill: 'rgba(255,255,255,.6)', fontSize: 9, fontFamily: 'Inter', fontWeight: 700 }}>
            {l}
          </text>
        ))}
        {/* Arrow */}
        {!isVariable && deg !== null && (
          <g transform={`rotate(${deg}, 44, 44)`} style={{ filter: 'drop-shadow(0 0 4px rgba(14, 165, 233, 0.6))' }}>
            <line x1="44" y1="44" x2="44" y2="16"
              stroke="var(--accent-hi)" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="44,48 40,40 48,40"
              fill="var(--accent-hi)" />
          </g>
        )}
        {isVariable && (
          <circle cx="44" cy="44" r="6" fill="none" stroke="var(--accent-hi)" strokeWidth="2" strokeDasharray="3 3" style={{ filter: 'drop-shadow(0 0 4px rgba(14, 165, 233, 0.6))' }} />
        )}
        {/* Centre dot */}
        {(isVariable || deg === null) && <circle cx="44" cy="44" r="3" fill="var(--accent-hi)" style={{ filter: 'drop-shadow(0 0 4px rgba(14, 165, 233, 0.6))' }} />}
      </svg>
    </div>
  )
}

// ── Instrument card ───────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, className = '', delay = 0 }) {
  return (
    <div
      className={`card p-5 flex flex-col gap-3 fade-up fade-up-delay-${delay} ${className}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
          {title}
        </span>
        {Icon && <Icon size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
      </div>
      {children}
    </div>
  )
}

function BigValue({ val, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 36, fontWeight: 600, lineHeight: 1, color: 'var(--text)' }}>
        {val || '—'}
      </span>
      {unit && (
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {unit}
        </span>
      )}
    </div>
  )
}

function Detail({ text }) {
  if (!text) return null
  return (
    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 4 }}>
      {text}
    </p>
  )
}

function stripTrailingPeriod(text) {
  if (!text) return text
  return text.replace(/\.\s*$/, '')
}

function capitalizeFirst(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ── METAR token visualiser ────────────────────────────────────────────────────
function MetarVisualiser({ raw }) {
  const [hovered, setHovered] = useState(null)
  const tokens = raw.split(/\s+/)

  return (
    <div>
      {/* token strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 6px', marginBottom: 16 }}>
        {tokens.map((tok, i) => {
          const g = classifyToken(tok, i, tokens)
          const isHov = hovered === i
          return (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 8,
                border: `1px solid ${g ? g.color + (isHov ? '88' : '44') : 'rgba(255,255,255,.08)'}`,
                background: g ? g.color + (isHov ? '33' : '11') : 'rgba(255,255,255,.04)',
                color: g ? g.color : 'var(--text-3)',
                cursor: g ? 'default' : 'default',
                transition: 'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
                lineHeight: 1.4,
                boxShadow: isHov && g ? `0 0 12px ${g.color}44` : 'none',
                transform: isHov && g ? 'translateY(-1px)' : 'none'
              }}
            >
              {tok}
            </button>
          )
        })}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        {TOKEN_GROUPS.filter(g => (
          g.id === 'station'
            ? tokens.some((t, i) => isStationToken(t, i, tokens))
            : tokens.some(t => g.regex.test(t))
        )).map(g => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0, boxShadow: `0 0 8px ${g.color}66` }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Input modal ───────────────────────────────────────────────────────────────
function MetarModal({ open, onClose, onDecode }) {
  const [input, setInput] = useState('')
  if (!open) return null

  const submit = () => { if (input.trim()) { onDecode(input); onClose() } }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      background: 'rgba(0,0,0,.60)',
      backdropFilter: 'blur(12px)',
      animation: 'fadeUp 0.3s ease-out'
    }}>
      <div className="card-elevated" style={{ width: '100%', maxWidth: 640, padding: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.15, pointerEvents: 'none' }} />
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-hi)', marginBottom: 6 }}>
              Decodificador METAR
            </p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Ingresar mensaje</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'var(--text-2)', padding: 6, borderRadius: '50%', transition: 'all 0.2s' }} aria-label="Cerrar" onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>
            <X size={20} />
          </button>
        </div>

        <textarea
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && submit()}
          placeholder="Ej: METAR LEMD 121330Z 21015G25KT 9999 FEW030 14/05 Q1012="
          style={{
            width: '100%', height: 120,
            background: 'rgba(0,0,0,.2)',
            border: '1px solid var(--border)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
            borderRadius: 12, padding: '16px',
            color: '#fff', fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14, resize: 'none', outline: 'none',
            transition: 'border-color .2s, box-shadow .2s',
            position: 'relative'
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-hi)'; e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px rgba(14,165,233,0.2)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.2)'; }}
        />

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10, marginBottom: 24 }}>
          Presiona <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>Ctrl</kbd> + <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>Enter</kbd> para decodificar al instante.
        </p>

        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          <button
            onClick={submit}
            disabled={!input.trim()}
            style={{
              flex: 1,
              background: 'var(--accent)', color: '#fff',
              border: '1px solid var(--accent-hi)', borderRadius: 10,
              padding: '12px 0', fontWeight: 600,
              fontSize: 14, letterSpacing: '.04em',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              opacity: input.trim() ? 1 : .5,
              boxShadow: input.trim() ? '0 4px 16px rgba(14, 165, 233, 0.3)' : 'none',
              transition: 'all .2s ease',
            }}
            onMouseEnter={e => { if (input.trim()) { e.target.style.background = 'var(--accent-hi)'; e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.5)'; } }}
            onMouseLeave={e => { if (input.trim()) { e.target.style.background = 'var(--accent)'; e.target.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.3)'; } }}
          >
            Decodificar
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,.05)',
              border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-2)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'all .2s ease'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,.1)'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,.05)'; e.target.style.color = 'var(--text-2)'; }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Visibility icon helper ────────────────────────────────────────────────────
function visIcon(main, weather, clouds) {
  const t = String(main || '').toLowerCase()
  const wx = (weather || []).join(' ').toLowerCase()
  const cl = (clouds || []).join(' ').toUpperCase()
  const m = (() => {
    if (t.includes('cavok') || t.includes('10 km')) return 10000
    const m1 = t.match(/(\d+)\s*m\b/); if (m1) return +m1[1]
    const m2 = t.match(/(\d+)\s*km\b/); if (m2) return +m2[1] * 1000
    return null
  })()
  const fog = /(niebla|neblina|calima|fog|mist|haze)/.test(`${t} ${wx}`)
  const ovc = /OVC|COMPLETAMENTE/.test(cl)
  const bkn = /BKN|PARCIALMENTE/.test(cl)
  if (fog || (m !== null && m < 3000)) return { Icon: CloudFog, label: 'Reducida', col: '#fb923c' }
  if (ovc) return { Icon: Cloud, label: 'Cubierto', col: '#94a3b8' }
  if (bkn || (m !== null && m < 8000)) return { Icon: CloudSun, label: 'Parcial', col: '#60a5fa' }
  return { Icon: Sun, label: 'Buena', col: '#fbbf24' }
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onDemo, onOpen }) {
  return (
    <div className="card fade-up" style={{ padding: '80px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />
      <div className="pill" style={{ justifyContent: 'center', margin: '0 auto 24px', position: 'relative' }}>
        <Activity size={14} /> LISTO PARA DECODIFICAR
      </div>
      <h2 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        Convierte cualquier METAR<br />en lenguaje claro
      </h2>
      <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px', position: 'relative' }}>
        Pega un mensaje METAR de aeropuertos españoles y obtén viento, visibilidad, nubes, temperatura y QNH de un vistazo con una interfaz diseñada para impactar.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
        <button
          id="btn-demo"
          onClick={onDemo}
          style={{
            background: 'var(--accent)', color: '#fff',
            border: '1px solid var(--accent-hi)', borderRadius: 12,
            padding: '12px 24px', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', letterSpacing: '.04em',
            boxShadow: '0 4px 20px rgba(14, 165, 233, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 24px rgba(14, 165, 233, 0.6)'; }}
          onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px rgba(14, 165, 233, 0.4)'; }}
        >
          Ver ejemplo guiado
        </button>
        <button
          id="btn-open-modal"
          onClick={onOpen}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: 'var(--text)',
            padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          Escribir mi METAR
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
const DEMO = 'METAR LEMD 121330Z 21015G25KT 180V250 9999 FEW030 14/05 Q1012='

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => setApiStatus(r.ok ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  async function decode(metar) {
    const m = metar.trim()
    if (!m) { setError('El METAR está vacío.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metar: m }),
      })
      if (!res.ok) {
        const p = await res.json().catch(() => ({}))
        throw new Error(p?.detail || 'Error al decodificar')
      }
      const result = await res.json()
      setData(result)
      setApiStatus('online')
    } catch (err) {
      if (err instanceof TypeError) {
        setApiStatus('offline')
        setError(`Sin conexión con el backend en ${API}. ¿Está activo?`)
      } else {
        setError(err.message)
      }
    } finally { setLoading(false) }
  }

  const windDeg = data?.wind?.degrees
  const isVariableWind = String(data?.wind?.direction || '').toLowerCase().includes('variable')
  const vis = data && visIcon(data.visibility?.main, data.weather, data.clouds)

  return (
    <div style={{ minHeight: '100vh', padding: '28px 20px', maxWidth: 1140, margin: '0 auto' }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 32 }}>
        <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Radar size={20} style={{ color: 'var(--accent-hi)' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-hi)' }}>
                Meteorología Aeronáutica
              </span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>METAR Stall</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '.10em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 999,
              background: apiStatus === 'online' ? 'var(--green-bg)' : 'var(--red-bg)',
              color: apiStatus === 'online' ? 'var(--green-txt)' : 'var(--red-txt)',
              border: `1px solid ${apiStatus === 'online' ? 'rgba(134,239,172,.20)' : 'rgba(252,165,165,.20)'}`,
            }}>
              API {apiStatus}
            </span>
            <button
              id="btn-nuevo-reporte"
              onClick={() => setModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--accent)', color: '#fff',
                border: '1px solid var(--accent-hi)', borderRadius: 10,
                padding: '10px 18px', fontWeight: 600,
                fontSize: 13, cursor: 'pointer', letterSpacing: '.04em',
                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.3)',
                transition: 'all .2s ease'
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.3)'; }}
            >
              <Plus size={16} />
              Nuevo reporte
            </button>
          </div>
        </div>
      </header>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 20, padding: '14px 16px',
          background: 'var(--red-bg)', border: '1px solid rgba(252,165,165,.20)',
          borderRadius: 12, color: 'var(--red-txt)', fontSize: 14,
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" style={{ color: 'var(--accent-hi)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Procesando mensaje
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!data && !loading && (
        <EmptyState onDemo={() => decode(DEMO)} onOpen={() => setModal(true)} />
      )}

      {/* ── Results ── */}
      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Row 1 — Overview */}
          <div className="card-elevated fade-up" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{data.airport_name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
                  {data.station} · ICAO &nbsp;·&nbsp; {data.datetime}
                </p>
              </div>
              <button
                onClick={() => setModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text-2)',
                  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                }}
              >
                Cambiar <ChevronRight size={13} />
              </button>
            </div>

            {data.auto_report && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--amber-bg)', border: '1px solid rgba(251,191,36,.20)',
                borderRadius: 8, padding: '5px 12px', marginBottom: 16,
                fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                color: 'var(--amber-txt)',
              }}>
                Reporte automático (AUTO)
              </div>
            )}

            {/* Token visualiser */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                Mensaje original — pasa el cursor sobre cada grupo
              </p>
              <MetarVisualiser raw={data.raw} />
            </div>

            {data.report_text && (
              <>
                <div className="divider" style={{ marginBottom: 14 }} />
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                  {data.report_text}
                </p>
              </>
            )}
          </div>

          {/* Row 2 — Instrument grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>

            {/* Wind */}
            <Card title="Viento" icon={Wind} delay={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <WindRose degrees={windDeg} isVariable={isVariableWind} />
                <div>
                  <BigValue val={data.wind?.speed?.split(' ')[0]} unit="KT" />
                  {data.wind?.gusts && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#fb923c' }}>
                      Ráfagas {data.wind.gusts}
                    </p>
                  )}
                  <Detail text={data.wind?.direction} />
                  {data.wind?.variation && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-2)' }}>
                      {data.wind.variation}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Visibility */}
            <Card title="Visibilidad" icon={Eye} delay={2}>
              <BigValue
                val={data.visibility?.main?.split(' ')[0] || data.visibility?.main}
                unit={data.visibility?.main?.toLowerCase().includes('km') ? 'KM' : 'M'}
              />
              {vis && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: `1px solid ${vis.col}44`, borderRadius: 8,
                  padding: '4px 10px', background: `${vis.col}11`,
                  color: vis.col, fontSize: 12, fontWeight: 600, width: 'fit-content',
                }}>
                  <vis.Icon size={14} /> {vis.label}
                </div>
              )}
              <Detail text={stripTrailingPeriod(data.visibility?.text)} />
              {data.rvr?.map((r, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text-2)', margin: '4px 0 0' }}>{r}</p>
              ))}
            </Card>

            {/* Temperature */}
            <Card title="Temperatura" icon={Thermometer} delay={1}>
              <BigValue val={data.temperature?.air?.replace('ºC', '')} unit="ºC" />
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 2px' }}>
                    Rocío
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                    {data.temperature?.dewpoint || '—'}
                  </p>
                </div>
              </div>
            </Card>

            {/* QNH */}
            <Card title="QNH" icon={Gauge} delay={2}>
              <BigValue val={data.qnh?.split(' ')[0] || '—'} unit="hPa" />
              <Detail text={data.qnh_text} />
            </Card>

            {/* Phenomena */}
            <Card title="Fenómenos meteorológicos" icon={Radar} delay={1}>
              {data.weather?.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.weather.map((w, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent-hi)', lineHeight: 1.4 }}>•</span>
                      {capitalizeFirst(w)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Sin fenómenos significativos</p>
              )}
              {data.recent_weather?.length > 0 && (
                <>
                  <div className="divider" style={{ marginTop: 10, marginBottom: 10 }} />
                  <p style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 6px' }}>
                    Tiempo reciente
                  </p>
                  {data.recent_weather.map((w, i) => (
                    <p key={i} style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--accent-hi)' }}>•</span> {capitalizeFirst(w)}
                    </p>
                  ))}
                </>
              )}
            </Card>

            {/* Clouds */}
            <Card title="Cobertura de nubes" icon={Cloud} delay={2}>
              {data.clouds?.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.clouds.map((c, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#94a3b8', lineHeight: 1.4 }}>☁</span>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Sin nubes significativas</p>
              )}
            </Card>

          </div>

          {/* Trends */}
          {data.trends?.length > 0 && (
            <div className="card fade-up" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                Tendencias
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.trends.map((t, i) => (
                  <span key={i} style={{
                    fontSize: 13, color: 'var(--amber-txt)',
                    background: 'var(--amber-bg)', border: '1px solid rgba(251,191,36,.20)',
                    borderRadius: 8, padding: '4px 12px',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{
        marginTop: 40, paddingTop: 16,
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, letterSpacing: '.08em', color: 'var(--text-3)',
        textTransform: 'uppercase',
      }}>
        <span>METAR Stall · Asignatura de Meteorología</span>
        <span>2026</span>
      </footer>

      <MetarModal open={modal} onClose={() => setModal(false)} onDecode={decode} />
    </div>
  )
}
