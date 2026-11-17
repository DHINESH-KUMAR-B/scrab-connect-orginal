import { useState } from 'react'
import { CheckCircle2, CreditCard, Landmark, QrCode, ShieldCheck, Smartphone, Wallet, X } from 'lucide-react'
import { useToast } from './ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const PAYMENT_TABS = [
  { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
  { id: 'Card', label: 'Debit / Credit Card', icon: CreditCard },
  { id: 'NetBanking', label: 'NetBanking', icon: Landmark },
  { id: 'Eco-Wallet', label: 'Eco-Wallet', icon: Wallet },
]

export default function OnlinePaymentModal({
  open,
  onClose,
  amount = 0,
  title = 'Online Checkout',
  description = '',
  type = 'online_payment',
  pickupId,
  defaultUpi = '',
  onSuccess,
}) {
  const { user } = useAuth()
  const toast = useToast()

  const [method, setMethod] = useState('UPI')
  const [upiId, setUpiId] = useState(defaultUpi || user?.upiId || 'priya@okicici')
  const [cardLast4, setCardLast4] = useState('4242')
  const [bank, setBank] = useState('HDFC Bank')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  if (!open) return null

  const handlePay = async e => {
    e.preventDefault()
    if (busy) return
    if (method === 'UPI' && !upiId.includes('@')) {
      toast('Enter a valid UPI ID (example: name@okicici).')
      return
    }
    setBusy(true)
    const ref = method === 'UPI'
      ? upiId.trim()
      : method === 'Card'
        ? `CARD-••••${cardLast4.slice(-4) || '4242'}`
        : method === 'NetBanking'
          ? bank
          : 'ECO-WALLET'

    try {
      const res = await api.checkoutOnline({
        userId: user?.id || 'u1',
        amount,
        method,
        upiOrRef: ref,
        description: description || title,
        type,
        pickupId,
      })
      setReceipt(res.transaction)
      toast(`Payment of ₹${amount} succeeded`)
      onSuccess?.(res)
    } catch (err) {
      toast(err.message || 'Payment failed. Try another method.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="online-pay-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass max-w-md w-full space-y-4 overflow-hidden p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-leaf-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Encrypted Online Settlement
            </p>
            <h2 id="online-pay-title" className="mt-0.5 text-lg font-bold">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close payment window"
            onClick={() => {
              setReceipt(null)
              onClose?.()
            }}
            className="rounded-lg p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {receipt ? (
          <div className="space-y-4 py-2 text-center text-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-leaf-400" aria-hidden="true" />
            <div>
              <p className="text-xl font-extrabold font-mono tabular-nums text-leaf-400">₹{receipt.amount} Paid</p>
              <p className="mt-1 text-xs opacity-75">{receipt.description}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs space-y-1 font-mono tabular-nums">
              <p>Transaction ID: <strong>{receipt.id}</strong></p>
              <p>Method: <strong>{receipt.method}</strong> ({receipt.upiOrRef})</p>
              <p>Status: <strong className="text-leaf-400">COMPLETED</strong></p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReceipt(null)
                onClose?.()
              }}
              className="btn w-full text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-xs opacity-75">{description || title}</span>
              <span className="font-mono text-xl font-extrabold tabular-nums text-leaf-400">₹{amount}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="tablist" aria-label="Payment method">
              {PAYMENT_TABS.map(tab => {
                const Icon = tab.icon
                const active = method === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setMethod(tab.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      active ? 'border-leaf-400 bg-leaf-500/20 text-leaf-300' : 'border-white/10 bg-white/5 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="truncate max-w-full">{tab.id}</span>
                  </button>
                )
              })}
            </div>

            {method === 'UPI' && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-leaf-400/30 bg-white p-1.5 text-emerald-950">
                    <QrCode className="h-12 w-12" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Instant UPI QR / VPA</p>
                    <p className="opacity-70">Works with GPay, PhonePe, Paytm, BHIM &amp; any Indian bank app.</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="upi-vpa" className="mb-1 block opacity-75">Enter your UPI ID</label>
                  <input
                    id="upi-vpa"
                    className="input text-xs font-mono"
                    placeholder="name@okicici"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                  />
                </div>
              </div>
            )}

            {method === 'Card' && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <label className="block opacity-75" htmlFor="card-num">Card ending digits (Visa / RuPay / Mastercard)</label>
                <input
                  id="card-num"
                  maxLength={19}
                  className="input font-mono text-xs"
                  defaultValue="4532 •••• •••• 4242"
                  onChange={e => setCardLast4(e.target.value.replace(/\D/g, '').slice(-4) || '4242')}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input font-mono text-xs" placeholder="MM / YY" defaultValue="08/29" aria-label="Expiry" />
                  <input className="input font-mono text-xs" placeholder="CVV" type="password" maxLength={4} defaultValue="123" aria-label="CVV" />
                </div>
              </div>
            )}

            {method === 'NetBanking' && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <label className="block opacity-75" htmlFor="bank-sel">Select Indian Bank</label>
                <select id="bank-sel" className="input text-xs" value={bank} onChange={e => setBank(e.target.value)}>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            {method === 'Eco-Wallet' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                <p className="font-semibold text-leaf-400">Pay directly using earned Scrap Connect Eco-Wallet credits</p>
                <p className="mt-1 opacity-75">Zero convenience fee. Instant deduction from your scrap earnings ledger.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn w-full whitespace-nowrap text-xs disabled:opacity-55"
            >
              {busy ? 'Processing payment…' : `Pay ₹${amount} via ${method}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
