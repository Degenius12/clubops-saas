import { useEffect, useState, useCallback } from 'react'
import {
  CpuChipIcon,
  SignalIcon,
  SignalSlashIcon,
  PlayIcon,
  ArrowPathIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type ConnectionType = 'SIMULATOR' | 'USB' | 'ETHERNET'

interface BergConfig {
  id: string
  clubId: string
  connectionType: ConnectionType
  comPort: string | null
  ipAddress: string | null
  tcpPort: number | null
  pourWithRelease: boolean
  ackTimeoutMs: number
  isConnected: boolean
  lastConnectedAt: string | null
  lastError: string | null
}

interface BergStatus {
  connectionType: ConnectionType
  isConnected: boolean
  lastConnectedAt: string | null
  lastError: string | null
  productCount: number
  poursLast24h: number
}

interface BergProduct {
  id: string
  plu: string
  brandName: string
  portionSize: string
  portionOz: string | number
  price: string | number
  category: string
  active: boolean
}

function useToken() {
  return localStorage.getItem('token')
}

async function api<T>(path: string, init: RequestInit = {}, token: string | null): Promise<T> {
  const res = await fetch(`${API}/api/berg-integration${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function BergIntegration() {
  const token = useToken()
  const [config, setConfig] = useState<BergConfig | null>(null)
  const [status, setStatus] = useState<BergStatus | null>(null)
  const [products, setProducts] = useState<BergProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [simulating, setSimulating] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [cfg, stat, prods] = await Promise.all([
        api<BergConfig>('/config', {}, token),
        api<BergStatus>('/status', {}, token),
        api<BergProduct[]>('/products', {}, token),
      ])
      setConfig(cfg)
      setStatus(stat)
      setProducts(prods)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function saveConfig(patch: Partial<BergConfig>) {
    if (!config) return
    setSaving(true)
    try {
      const updated = await api<BergConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify(patch),
      }, token)
      setConfig(updated)
      toast.success('Berg configuration saved')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function seedSamples() {
    try {
      const result = await api<{ created: number; skipped: number }>('/products/seed-samples', {
        method: 'POST', body: '{}',
      }, token)
      toast.success(`Seeded ${result.created} products (${result.skipped} already present)`)
      refresh()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function simulatePour(plu: string) {
    setSimulating(plu)
    try {
      const result = await api<{ authorized: boolean; reason?: string }>('/simulate-pour', {
        method: 'POST', body: JSON.stringify({ plu }),
      }, token)
      if (result.authorized) {
        toast.success(`Pour authorized (PLU ${plu})`)
      } else {
        toast.error(`NAK: ${result.reason}`)
      }
      refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSimulating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-text-tertiary">
        <ArrowPathIcon className="h-6 w-6 mr-2 animate-spin" />
        Loading Berg integration…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + status pill */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-electric-500/15 border border-electric-500/20">
            <CpuChipIcon className="h-6 w-6 text-electric-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Berg Liquor Dispenser</h2>
            <p className="text-sm text-text-tertiary">Authorize pours from the Berg controller and reconcile with POS ring-ups.</p>
          </div>
        </div>
        {status && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
            status.isConnected
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-warning/10 border-status-warning/30 text-status-warning'
          }`}>
            {status.isConnected ? <SignalIcon className="h-5 w-5" /> : <SignalSlashIcon className="h-5 w-5" />}
            <span className="text-sm font-semibold">
              {status.isConnected ? `Live · ${status.connectionType}` : `Offline · ${status.connectionType}`}
            </span>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Connection" value={status.connectionType} />
          <StatTile label="Active PLUs" value={String(status.productCount)} />
          <StatTile label="Pours (24h)" value={String(status.poursLast24h)} />
        </div>
      )}

      {/* Connection config */}
      {config && (
        <section className="card-premium p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Connection</h3>
          <div className="flex flex-wrap gap-2">
            {(['SIMULATOR', 'USB', 'ETHERNET'] as ConnectionType[]).map(type => (
              <button
                key={type}
                onClick={() => saveConfig({ connectionType: type })}
                disabled={saving}
                className={`touch-target px-5 rounded-xl font-medium text-sm transition-all ${
                  config.connectionType === type
                    ? 'bg-gold-500/15 text-gold-500 border border-gold-500/30'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-white/5 border border-white/10'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>

          {config.connectionType === 'USB' && (
            <LabeledInput
              label="COM port / device path"
              placeholder="COM3 or /dev/ttyUSB0"
              value={config.comPort || ''}
              onBlurSave={(v) => saveConfig({ comPort: v })}
            />
          )}
          {config.connectionType === 'ETHERNET' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LabeledInput
                label="IP address"
                placeholder="10.0.0.42"
                value={config.ipAddress || ''}
                onBlurSave={(v) => saveConfig({ ipAddress: v })}
              />
              <LabeledInput
                label="TCP port"
                placeholder="4001"
                value={config.tcpPort?.toString() || ''}
                onBlurSave={(v) => saveConfig({ tcpPort: v ? Number(v) : null as unknown as number })}
              />
            </div>
          )}
          {config.connectionType === 'SIMULATOR' && (
            <div className="flex items-start gap-3 rounded-xl border border-electric-500/30 bg-electric-500/5 p-4 text-sm text-text-secondary">
              <BeakerIcon className="h-5 w-5 shrink-0 text-electric-400 mt-0.5" />
              <div>
                Simulator mode lets you demo ACK/NAK authorization without Berg hardware.
                Seed the sample catalog below and try <span className="font-mono text-electric-400">Simulate pour</span> on any row.
              </div>
            </div>
          )}

          {config.lastError && (
            <div className="flex items-start gap-3 rounded-xl border border-status-danger/30 bg-status-danger/5 p-4 text-sm text-status-danger">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Last error</p>
                <p className="opacity-90">{config.lastError}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Product catalog */}
      <section className="card-premium p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-text-primary">
            PLU Catalog <span className="text-text-tertiary font-normal text-sm">({products.length})</span>
          </h3>
          {products.length === 0 && (
            <button onClick={seedSamples} className="btn-primary touch-target px-4 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5" />
              Seed sample products
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4">
            No products mapped yet. Import a Berg brand CSV or seed the sample catalog to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-tertiary uppercase tracking-wide text-xs border-b border-white/10">
                <tr>
                  <th className="py-3 pr-4 font-medium">PLU</th>
                  <th className="py-3 pr-4 font-medium">Brand</th>
                  <th className="py-3 pr-4 font-medium">Portion</th>
                  <th className="py-3 pr-4 font-medium">oz</th>
                  <th className="py-3 pr-4 font-medium">Price</th>
                  <th className="py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className={`border-b border-white/5 ${!p.active ? 'opacity-50' : ''}`}>
                    <td className="py-3 pr-4 font-mono text-electric-400">{p.plu}</td>
                    <td className="py-3 pr-4">{p.brandName}</td>
                    <td className="py-3 pr-4">{p.portionSize}</td>
                    <td className="py-3 pr-4 font-mono tabular-nums">{Number(p.portionOz).toFixed(2)}</td>
                    <td className="py-3 pr-4 font-mono tabular-nums">${Number(p.price).toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => simulatePour(p.plu)}
                        disabled={simulating === p.plu || !p.active}
                        className="touch-target inline-flex items-center gap-2 px-4 rounded-lg border border-electric-500/30 bg-electric-500/10 text-electric-400 hover:bg-electric-500/20 transition-all disabled:opacity-50"
                      >
                        {simulating === p.plu ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <PlayIcon className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium">Simulate pour</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-premium p-5">
      <p className="text-xs sm:text-sm text-text-tertiary uppercase tracking-wider">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold font-mono text-text-primary mt-1 tabular-nums">{value}</p>
    </div>
  )
}

function LabeledInput({
  label, placeholder, value, onBlurSave,
}: { label: string; placeholder?: string; value: string; onBlurSave: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <label className="block">
      <span className="block text-xs sm:text-sm text-text-tertiary mb-2">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onBlurSave(local) }}
        className="input-premium w-full py-3"
      />
    </label>
  )
}

export default BergIntegration
