import React, { useState, useEffect } from 'react'
import {
  Wind,
  Eye,
  Cloud,
  CloudFog,
  CloudSun,
  Sun,
  Thermometer,
  Compass,
  Layers,
  Navigation,
  AlertTriangle,
  Terminal,
  Plus,
  X,
  RefreshCcw,
  Activity,
  Radar,
  Dot,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const WindRose = ({ degrees, isVariable = false }) => {
  const parsedDegrees =
    typeof degrees === 'number' ? degrees : Number.parseInt(String(degrees ?? ''), 10)
  const hasDirection = Number.isFinite(parsedDegrees) && !isVariable
  const normalizedDegrees = hasDirection ? ((parsedDegrees % 360) + 360) % 360 : 0
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)

  return (
    <div className="relative h-24 w-24 md:h-28 md:w-28 shrink-0 rounded-full border border-cyan-300/30 bg-cyan-400/5">
      <div className="absolute inset-2 rounded-full border border-cyan-300/20" />

      {ticks.map((deg) => (
        <div
          key={`tick-${deg}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
        >
          <span
            className={cn('block rounded-full bg-cyan-200/80', deg % 90 === 0 ? 'h-3 w-[2px]' : 'h-2 w-px')}
            style={{ transform: 'translateY(-38px)' }}
          />
        </div>
      ))}

      <span className="absolute left-1/2 -top-3 -translate-x-1/2 text-xs md:text-sm font-bold tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]">
        N
      </span>
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-xs md:text-sm font-bold tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]">
        E
      </span>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs md:text-sm font-bold tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]">
        S
      </span>
      <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-xs md:text-sm font-bold tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]">
        O
      </span>

      {hasDirection && (
        <div
          className="absolute bottom-1/2 left-1/2 h-10 w-0.5 -translate-x-1/2 origin-bottom rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.8)] transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${normalizedDegrees}deg)` }}
        >
          <div className="absolute -top-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-b-[10px] border-l-transparent border-r-transparent border-b-cyan-200" />
        </div>
      )}

      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/60 bg-cyan-300" />
    </div>
  )
}

const InstrumentCard = ({ title, value, unit, icon: Icon, detail, tone = 'amber', extra }) => {
  const toneMap = {
    amber: 'text-amber-200 border-amber-300/25',
    cyan: 'text-cyan-200 border-cyan-300/25',
    lime: 'text-lime-200 border-lime-300/25',
  }

  return (
    <section
      className={cn(
        'neo-card rounded-2xl p-6 border flex flex-col gap-4 relative overflow-hidden',
        toneMap[tone]
      )}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.22em] font-semibold opacity-80">{title}</h3>
        {Icon ? <Icon size={24} className="opacity-75" /> : null}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">{value || '---'}</span>
          {unit && <span className="text-xs uppercase tracking-widest opacity-75">{unit}</span>}
        </div>
        {extra}
      </div>

      {detail && <p className="text-xs opacity-70 border-t border-white/10 pt-3 leading-relaxed">{detail}</p>}
    </section>
  )
}

const MetarModal = ({ isOpen, onClose, onDecode }) => {
  const [input, setInput] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl neo-card rounded-2xl p-8 border border-cyan-300/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-300/20">
              <Terminal className="text-cyan-200" size={20} />
            </div>
            <h2 className="text-2xl font-semibold text-cyan-100 tracking-tight">Ingresar METAR</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-cyan-100/60 hover:text-cyan-100 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <p className="text-sm text-cyan-50/70 mb-4">
          Pega el mensaje METAR completo para generar un informe técnico y narrativo.
        </p>

        <textarea
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: METAR LEMD 121330Z 21015G25KT 180V250 9999 FEW030 14/05 Q1012="
          className="w-full h-32 bg-slate-950/70 border border-cyan-200/20 rounded-xl p-4 text-cyan-100 font-mono focus:border-cyan-300/70 outline-none transition-all resize-none"
        />

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => {
              onDecode(input)
              onClose()
            }}
            disabled={!input.trim()}
            className="flex-1 bg-cyan-300 text-slate-950 font-semibold py-3 rounded-xl hover:bg-cyan-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.18em] text-xs"
          >
            Decodificar
          </button>
        </div>
      </div>
    </div>
  )
}

const parseVisibilityMeters = (mainValue) => {
  const text = String(mainValue || '').toLowerCase()
  if (!text) return null
  if (text.includes('cavok') || text.includes('10 km o más')) return 10000

  const metersMatch = text.match(/(\d+)\s*m\b/)
  if (metersMatch) return Number.parseInt(metersMatch[1], 10)

  const kmMatch = text.match(/(\d+)\s*km\b/)
  if (kmMatch) return Number.parseInt(kmMatch[1], 10) * 1000

  const rawDigits = text.match(/^\d{4}$/)
  if (rawDigits) return Number.parseInt(rawDigits[0], 10)

  return null
}

const getVisibilityVisual = ({ visibilityMain, visibilityText, weather, clouds }) => {
  const normalizedMain = String(visibilityMain || '').toUpperCase()
  const normalizedText = String(visibilityText || '').toLowerCase()
  const weatherText = (weather || []).join(' ').toLowerCase()
  const cloudText = (clouds || []).join(' ').toUpperCase()
  const visibilityMeters = parseVisibilityMeters(visibilityMain)

  const hasOvercast = /OVC|COMPLETAMENTE CUBIERTO|8 OCTAS/.test(cloudText)
  const hasBroken = /BKN|PARCIALMENTE CUBIERTO|5 A 7 OCTAS/.test(cloudText)
  const hasFogLike = /(niebla|neblina|calima|humo|bruma|fog|mist|haze)/.test(
    `${normalizedText} ${weatherText}`
  )

  if (normalizedMain.includes('CAVOK') || (visibilityMeters !== null && visibilityMeters >= 9000 && !hasBroken && !hasOvercast)) {
    return {
      icon: Sun,
      label: 'Despejado',
      classes: 'text-amber-200 border-amber-200/40 bg-amber-300/10',
    }
  }

  if (hasOvercast) {
    return {
      icon: Cloud,
      label: 'Overcast',
      classes: 'text-slate-200 border-slate-300/40 bg-slate-300/10',
    }
  }

  if (hasFogLike || (visibilityMeters !== null && visibilityMeters < 3000)) {
    return {
      icon: CloudFog,
      label: 'Baja',
      classes: 'text-orange-200 border-orange-300/40 bg-orange-300/10',
    }
  }

  if (hasBroken || (visibilityMeters !== null && visibilityMeters < 8000)) {
    return {
      icon: CloudSun,
      label: 'Parcial',
      classes: 'text-cyan-200 border-cyan-300/40 bg-cyan-300/10',
    }
  }

  return {
    icon: CloudSun,
    label: 'Variable',
    classes: 'text-cyan-200 border-cyan-300/40 bg-cyan-300/10',
  }
}

function App() {
  const [data, setData] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`)
        setApiStatus(res.ok ? 'online' : 'offline')
      } catch {
        setApiStatus('offline')
      }
    }
    checkHealth()
  }, [])

  const handleDecode = async (metar) => {
    const normalizedMetar = metar.trim()
    if (!normalizedMetar) {
      setError('El METAR está vacío.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metar: normalizedMetar }),
      })

      if (!response.ok) {
        let detail = 'Error al decodificar'
        try {
          const payload = await response.json()
          if (payload?.detail) detail = payload.detail
        } catch {
          // Keep default error message when body is not JSON.
        }
        throw new Error(detail)
      }

      const result = await response.json()
      setData(result)
      setApiStatus('online')
    } catch (err) {
      if (err instanceof TypeError) {
        setApiStatus('offline')
        setError(`No se pudo conectar con el backend en ${API_BASE_URL}. Verifica que esté activo.`)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const statusTone = apiStatus === 'online' ? 'bg-lime-300/20 text-lime-200' : 'bg-red-300/20 text-red-200'
  const windDirectionText = String(data?.wind?.direction || '').toLowerCase()
  const isVariableWind =
    windDirectionText.includes('variable') || windDirectionText.includes('vrb')
  const condensedReportText = (() => {
    const text = String(data?.report_text || '').trim()
    if (!text) return ''
    const firstPeriodIndex = text.indexOf('.')
    if (firstPeriodIndex === -1) return text
    return text.slice(firstPeriodIndex + 1).trim()
  })()
  const visibilityVisual = getVisibilityVisual({
    visibilityMain: data?.visibility?.main,
    visibilityText: data?.visibility?.text,
    weather: data?.weather,
    clouds: data?.clouds,
  })
  const VisibilityIcon = visibilityVisual.icon

  return (
    <div className="min-h-screen relative px-4 py-6 md:px-10 md:py-10 lg:px-14 lg:py-12">
      <header className="mb-10 lg:mb-12">
        <div className="neo-card rounded-2xl border border-cyan-300/20 p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <img
                src="/logo-metar-stall.png"
                alt="Logo METAR Stall"
                className="h-12 w-12 md:h-14 md:w-14 rounded-xl object-cover border border-cyan-200/25 shadow-[0_0_25px_rgba(56,189,248,0.2)]"
              />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 text-[11px] uppercase tracking-[0.2em] font-semibold">
                <Radar size={14} />
                Operaciones METAR
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-cyan-50">METAR Stall</h1>
            <p className="text-cyan-100/70 text-sm md:text-base max-w-2xl leading-relaxed">
              Consola meteorológica aeronáutica para lectura técnica y narración operativa del parte.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className={cn('px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.16em]', statusTone)}>
              API {apiStatus}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 bg-cyan-300 text-slate-950 px-5 py-3 rounded-xl hover:bg-cyan-200 transition-colors"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span className="font-semibold uppercase tracking-[0.18em] text-xs">Nuevo reporte</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {error && (
          <div className="mb-8 rounded-xl border border-red-300/30 bg-red-400/10 p-4 flex items-start gap-3 text-red-100">
            <AlertTriangle size={18} className="mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!data && !loading && (
          <div className="neo-card rounded-2xl p-12 md:p-16 border border-white/10 flex flex-col items-center justify-center text-cyan-100/50">
            <Activity size={46} className="mb-4" />
            <p className="uppercase tracking-[0.3em] text-xs">Esperando datos METAR</p>
          </div>
        )}

        {loading && (
          <div className="neo-card rounded-2xl p-12 md:p-16 border border-cyan-300/20 flex flex-col items-center justify-center text-cyan-100">
            <RefreshCcw size={40} className="animate-spin mb-4" />
            <p className="uppercase tracking-[0.28em] text-xs">Procesando mensaje</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
            <section className="xl:col-span-2 neo-card rounded-2xl border border-cyan-300/20 p-6 md:p-8 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-cyan-50">{data.airport_name}</h2>
                  <div className="mt-2 flex items-center gap-2 text-cyan-200/85">
                    <Compass size={14} />
                    <span className="text-sm font-medium tracking-wide">{data.station} · ICAO</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base md:text-lg uppercase tracking-[0.12em] font-semibold text-cyan-100/90">
                    {data.datetime}
                  </div>
                </div>
              </div>

              {data.auto_report && (
                <div className="rounded-xl border border-amber-300/35 bg-amber-300/15 p-3">
                  <p className="text-xs md:text-sm uppercase tracking-[0.16em] font-semibold text-amber-100">
                    Reporte automático (AUTO)
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-slate-950/60 border border-cyan-300/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/50 mb-2">Mensaje original</p>
                <code className="text-cyan-100 text-sm break-all font-mono">{data.raw}</code>
              </div>

              {condensedReportText && (
                <div className="rounded-xl bg-cyan-300/5 border border-cyan-300/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/60 mb-2">Resumen narrativo</p>
                  <p className="text-sm text-cyan-50/90 leading-relaxed">{condensedReportText}</p>
                </div>
              )}
            </section>

            <InstrumentCard
              title="Viento"
              value={data.wind?.speed?.split(' ')[0]}
              unit="KT"
              icon={Wind}
              detail={data.wind?.text || data.wind?.direction}
              tone="lime"
              extra={<WindRose degrees={data.wind?.degrees} isVariable={isVariableWind} />}
            />

            <InstrumentCard
              title="Visibilidad"
              value={data.visibility?.main?.split(' ')[0] || data.visibility?.main}
              unit={data.visibility?.main?.includes('km') ? 'KM' : 'M'}
              icon={Eye}
              detail={data.visibility?.text || data.visibility?.main}
              tone="amber"
              extra={
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.14em] font-semibold',
                    visibilityVisual.classes
                  )}
                >
                  <VisibilityIcon size={18} />
                  <span>{visibilityVisual.label}</span>
                </div>
              }
            />

            <section className="neo-card rounded-2xl p-6 border border-cyan-300/20 text-cyan-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[11px] uppercase tracking-[0.22em] font-semibold opacity-80">Fenómenos</h3>
                <Radar size={24} className="opacity-80" />
              </div>
              <div className="space-y-2">
                {data.weather?.length > 0 ? (
                  data.weather.map((w, i) => (
                    <div key={`w-${i}`} className="flex items-start gap-2 text-sm leading-relaxed">
                      <Dot size={24} className="mt-0.5 shrink-0" />
                      <span className="font-medium">{w}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm opacity-70">Sin fenómenos significativos</span>
                )}

                {data.recent_weather?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-cyan-200/15">
                    <p className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-2">Tiempo reciente</p>
                    {data.recent_weather.map((w, i) => (
                      <div key={`rw-${i}`} className="flex items-start gap-2 text-sm leading-relaxed">
                        <Dot size={24} className="mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="neo-card rounded-2xl p-6 border border-cyan-300/20 text-cyan-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[11px] uppercase tracking-[0.22em] font-semibold opacity-80">Cielo y nubes</h3>
                <Layers size={24} className="opacity-80" />
              </div>
              <div className="space-y-2">
                {data.clouds?.length > 0 ? (
                  data.clouds.map((c, i) => (
                    <div key={`c-${i}`} className="flex items-start gap-2 text-sm leading-relaxed">
                      <Cloud size={21} className="mt-0.5 shrink-0 opacity-80" />
                      <span>{c}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm opacity-70">Sin nubes significativas</span>
                )}
              </div>
            </section>

            <InstrumentCard
              title="Temperatura"
              value={data.temperature?.air?.replace('ºC', '')}
              unit="ºC"
              icon={Thermometer}
              detail={data.temperature?.text || `Punto de rocío: ${data.temperature?.dewpoint || '---'}`}
              tone="amber"
            />

            <InstrumentCard
              title="QNH"
              value={data.qnh?.split(' ')[0] || '---'}
              unit="HPA"
              icon={Navigation}
              detail={data.qnh_text || 'Presión reducida a nivel del mar'}
              tone="cyan"
            />
          </div>
        )}
      </main>

      <footer className="mt-16 pt-6 border-t border-cyan-300/15 flex flex-col md:flex-row gap-2 justify-between text-[11px] uppercase tracking-[0.18em] text-cyan-100/55">
        <span>Centro de lectura meteorológica</span>
        <span>2026 METAR Stall</span>
      </footer>

      <MetarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onDecode={handleDecode} />
    </div>
  )
}

export default App
