import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, Cpu, Info, PackageSearch, ShieldAlert, Sparkles } from 'lucide-react'
import { Glass, useToast } from './ui'
import { CATEGORIES, detectProductType, PRODUCT_PROFILES, recognizeScrap } from '../lib/ai'

export default function AiProductDetector({ ratesMap = CATEGORIES, onApplyCategory, onApplyBundle, compact = false }) {
  const toast = useToast()
  const [mode, setMode] = useState('photo') // 'photo' | 'product'
  const [query, setQuery] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [visionResult, setVisionResult] = useState(null)
  const [productResult, setProductResult] = useState(() => detectProductType('split ac', ratesMap))

  const handleImage = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const objUrl = URL.createObjectURL(file)
    setPreviewUrl(objUrl)
    setScanning(true)
    try {
      const res = await recognizeScrap(file)
      setVisionResult(res)
      if (onApplyCategory) onApplyCategory(res.category)
      toast(`Detected ${res.category} (${Math.round(res.confidence * 100)}% match)`)
    } catch (err) {
      toast(err.message || 'Unable to analyze this image.')
    } finally {
      setScanning(false)
    }
  }

  const runProductSearch = text => {
    const clean = String(text || '').trim()
    setQuery(clean)
    if (!clean) {
      setProductResult(null)
      return
    }
    const res = detectProductType(clean, ratesMap)
    setProductResult(res)
  }

  const handleApplyDetectedBundle = result => {
    if (!result?.components?.length) return
    const items = result.components.map(c => ({
      category: c.category,
      weight: Math.max(1, Math.round(c.weightKg)),
    }))
    if (onApplyBundle) {
      onApplyBundle(items, result)
      toast(`Added ${result.productName} materials to quote`)
    } else if (onApplyCategory) {
      onApplyCategory(result.primaryCategory)
      toast(`Selected ${result.primaryCategory}`)
    }
  }

  return (
    <Glass className={compact ? '!p-4 space-y-4' : 'space-y-4'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-leaf-400" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold sm:text-lg">AI product type detector</h2>
            <p className="text-xs opacity-70">
              Scan any photo with on-device vision or type a household product to decode scrap materials &amp; payout value.
            </p>
          </div>
        </div>

        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs" role="tablist" aria-label="Detector input mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'photo'}
            onClick={() => setMode('photo')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold whitespace-nowrap transition ${
              mode === 'photo' ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
            }`}
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" /> Photo / Camera scan
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'product'}
            onClick={() => setMode('product')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold whitespace-nowrap transition ${
              mode === 'product' ? 'bg-leaf-500 text-emerald-950' : 'opacity-75 hover:bg-white/10'
            }`}
          >
            <PackageSearch className="h-3.5 w-3.5" aria-hidden="true" /> Product type lookup
          </button>
        </div>
      </div>

      {mode === 'photo' ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
            <label className="flex cursor-pointer flex-col justify-center rounded-xl border border-dashed border-leaf-400/45 bg-leaf-500/5 p-4 text-center transition hover:bg-leaf-500/10">
              <Camera className="mx-auto h-6 w-6 text-leaf-400" aria-hidden="true" />
              <span className="mt-1.5 text-sm font-semibold">Upload product photo or snap camera</span>
              <span className="mt-0.5 text-xs opacity-65">JPG, PNG, or WebP · MobileNet v2 vision</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                className="sr-only"
              />
            </label>

            {previewUrl ? (
              <div className="relative h-32 overflow-hidden rounded-xl border border-white/15 bg-black/40">
                <img src={previewUrl} alt="Uploaded item preview" className="h-full w-full object-cover" />
                {scanning && (
                  <motion.div
                    initial={{ y: '-100%' }}
                    animate={{ y: '400%' }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-leaf-400/45 to-transparent"
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs opacity-75 space-y-1">
                <p className="font-semibold text-leaf-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> What can it detect?
                </p>
                <p>Phones, laptops, copper wiring, beverage cans, PET bottles, newspapers, cartons, appliances, clothing &amp; glass.</p>
              </div>
            )}
          </div>

          {scanning && (
            <p role="status" className="text-xs font-medium text-leaf-400">
              Scanning product geometry &amp; material signature…
            </p>
          )}

          {visionResult && !scanning && (
            <div className="space-y-2.5 rounded-xl border border-leaf-400/35 bg-leaf-500/10 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-leaf-300">
                  Detected: {visionResult.category} · <span className="font-mono tabular-nums">₹{ratesMap[visionResult.category] ?? visionResult.perKg}/kg</span>
                </p>
                <span className="font-mono font-semibold tabular-nums text-leaf-300">
                  {Math.round(visionResult.confidence * 100)}% confidence
                </span>
              </div>
              <p className="opacity-80">
                Visual object label: <strong>{visionResult.label}</strong>
                {visionResult.productProfile ? ` · Category profile: ${visionResult.productProfile.productType}` : ''}
              </p>

              {visionResult.alternatives?.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="opacity-70">Switch grade:</span>
                  {visionResult.alternatives.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onApplyCategory?.(cat)}
                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-medium hover:border-leaf-400 hover:bg-leaf-500/20"
                    >
                      {cat} (₹{ratesMap[cat] ?? CATEGORIES[cat] ?? 5}/kg)
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              className="input w-full sm:flex-1 text-xs"
              placeholder="Type a product name (e.g. Split AC, iPhone, Ceiling fan, Washing machine, Copper wire)…"
              aria-label="Enter product name to detect scrap composition"
              value={query}
              onChange={e => runProductSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_PROFILES.slice(0, 7).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => runProductSearch(item.keywords[0])}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                  productResult?.id === item.id
                    ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300'
                    : 'border-white/10 bg-white/5 opacity-80 hover:bg-white/10'
                }`}
              >
                {item.productName}
              </button>
            ))}
          </div>

          {productResult && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-leaf-400">{productResult.productName}</p>
                  <p className="opacity-70">{productResult.productType}</p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <p className="text-base font-extrabold text-leaf-400">~₹{productResult.estimatedTotalValue}</p>
                  <p className="opacity-65">est. {productResult.estimatedWeightKg} kg total</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold opacity-80">AI material composition breakdown:</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {productResult.components.map(comp => (
                    <div key={comp.category} className="rounded-lg border border-white/10 bg-white/5 p-2 tabular-nums">
                      <div className="flex items-center justify-between gap-1 font-semibold">
                        <span>{comp.category}</span>
                        <span className="font-mono text-leaf-400">{comp.sharePct}%</span>
                      </div>
                      <p className="mt-0.5 font-mono opacity-75">
                        ~{comp.weightKg} kg × ₹{comp.ratePerKg}/kg = <strong>₹{comp.value}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 border-t border-white/10 pt-2.5 sm:grid-cols-2">
                <p className="flex items-start gap-1.5 opacity-80">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                  <span><strong>Safety:</strong> {productResult.safetyTip}</span>
                </p>
                <p className="flex items-start gap-1.5 opacity-80">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf-400" aria-hidden="true" />
                  <span><strong>Prep tip:</strong> {productResult.prepTip}</span>
                </p>
              </div>

              {(onApplyBundle || onApplyCategory) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyDetectedBundle(productResult)}
                    className="btn inline-flex items-center gap-1.5 whitespace-nowrap !py-1.5 !px-3.5 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {onApplyBundle ? 'Add breakdown to pickup' : `Select ${productResult.primaryCategory}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Glass>
  )
}
