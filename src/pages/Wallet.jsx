import { useCallback, useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CreditCard, FileText, Leaf, Package, QrCode, ShieldCheck, Wallet as WalletIcon, Zap } from 'lucide-react'
import { Glass, Grid, Skeleton, StatCard, useToast } from '../components/ui'
import OnlinePaymentModal from '../components/OnlinePaymentModal'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const ONLINE_SERVICES = [
  {
    id: 'srv-express',
    title: 'Priority 2-Hr Express Pickup Pass',
    desc: 'Skip the regular dispatch queue for urgent appliance or office scrap collections.',
    price: 29,
    type: 'online_payment',
    icon: Zap,
  },
  {
    id: 'srv-bins',
    title: 'Zero-Waste 3-Bin Sorting Kit',
    desc: 'Color-coded heavy-duty washable woven bags for Paper, Metals, and Plastics (+5% sorted bonus).',
    price: 149,
    type: 'online_payment',
    icon: Package,
  },
  {
    id: 'srv-trees',
    title: 'Plant 5 Native Saplings Pledge',
    desc: 'Verified urban canopy plantation batch in Chennai / Bengaluru with GPS tree tag.',
    price: 199,
    type: 'carbon_offset',
    icon: Leaf,
  },
  {
    id: 'srv-cert',
    title: 'Annual Verified Green Impact Certificate',
    desc: 'Official CSR & housing society audit report summarizing CO₂, water, and kg diverted.',
    price: 299,
    type: 'online_payment',
    icon: FileText,
  },
]

export default function Wallet() {
  const { user } = useAuth()
  const toast = useToast()

  const [data, setData] = useState({
    walletBalance: 0,
    totalCredits: 0,
    totalOnlinePayments: 0,
    totalWithdrawn: 0,
    savedUpiId: '',
    preferredPayoutMethod: 'UPI',
    transactions: [],
  })
  const [loading, setLoading] = useState(true)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '200',
    method: 'UPI',
    upiOrRef: '',
  })
  const [withdrawing, setWithdrawing] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState(null)
  const [selectedTx, setSelectedTx] = useState(null)

  const uid = user?.id || 'u1'

  const loadWallet = useCallback(async () => {
    try {
      const res = await api.getWallet(uid)
      setData(res)
      setWithdrawForm(prev => ({
        ...prev,
        upiOrRef: prev.upiOrRef || res.savedUpiId || user?.upiId || 'priya@okicici',
        amount: prev.amount || String(Math.min(200, res.walletBalance || 100)),
      }))
    } catch {
      toast('Unable to load online wallet details.')
    } finally {
      setLoading(false)
    }
  }, [uid, user?.upiId, toast])

  useEffect(() => {
    loadWallet()
  }, [loadWallet])

  const handleWithdraw = async e => {
    e.preventDefault()
    if (withdrawing) return
    setWithdrawing(true)
    try {
      const res = await api.withdrawOnline({
        userId: uid,
        amount: Number(withdrawForm.amount),
        method: withdrawForm.method,
        upiOrRef: withdrawForm.upiOrRef,
      })
      if (res.overview) setData(res.overview)
      toast(`Transferred ₹${res.transaction.amount} online to ${res.transaction.upiOrRef}`)
    } catch (err) {
      toast(err.message || 'Unable to process withdrawal.')
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Grid>{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</Grid>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Online Wallet, UPI Settlements &amp; Payments</h1>
          <p className="mt-1 text-sm opacity-75">
            Withdraw scrap payouts directly to your UPI ID or Bank IMPS, pay online for eco add-ons, and download receipts.
          </p>
        </div>
        <span className="glass inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-leaf-400">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Instant UPI · Zero transfer fee
        </span>
      </div>

      <Grid>
        <StatCard label="Available wallet balance" value={`₹${data.walletBalance}`} />
        <StatCard label="Total scrap &amp; bonus credits" value={`₹${data.totalCredits}`} />
        <StatCard label="Online payments made" value={`₹${data.totalOnlinePayments}`} />
        <StatCard label="Withdrawn to UPI / Bank" value={`₹${data.totalWithdrawn}`} />
      </Grid>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Instant Online Withdrawal */}
        <form onSubmit={handleWithdraw} className="glass space-y-4 p-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-leaf-400" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold">Instant online withdrawal</h2>
              <p className="text-xs opacity-70">Transfer earned balance to UPI or IMPS bank account.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="wd-method" className="mb-1 block text-xs opacity-70">Settlement rail</label>
              <select
                id="wd-method"
                className="input text-xs"
                value={withdrawForm.method}
                onChange={e => setWithdrawForm(prev => ({ ...prev, method: e.target.value }))}
              >
                <option value="UPI">Instant UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">IMPS / Bank Transfer</option>
              </select>
            </div>
            <div>
              <label htmlFor="wd-amount" className="mb-1 block text-xs opacity-70">Amount (₹)</label>
              <input
                id="wd-amount"
                type="number"
                min="1"
                max={Math.max(1, data.walletBalance)}
                className="input text-right font-mono text-xs tabular-nums"
                value={withdrawForm.amount}
                onChange={e => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label htmlFor="wd-upi" className="mb-1 block text-xs opacity-70">
              {withdrawForm.method === 'UPI' ? 'Verified UPI ID' : 'Bank Account / IFSC'}
            </label>
            <input
              id="wd-upi"
              required
              className="input font-mono text-xs"
              placeholder={withdrawForm.method === 'UPI' ? 'name@okicici' : 'HDFC0001234 · ••••8821'}
              value={withdrawForm.upiOrRef}
              onChange={e => setWithdrawForm(prev => ({ ...prev, upiOrRef: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={withdrawing || data.walletBalance <= 0}
            className="btn w-full whitespace-nowrap text-xs disabled:opacity-50"
          >
            {withdrawing ? 'Settling online…' : `Withdraw ₹${withdrawForm.amount || 0} to ${withdrawForm.method}`}
          </button>
        </form>

        {/* Online Payment Storefront */}
        <Glass className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-leaf-400" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold">Pay online for eco passes &amp; kits</h2>
                <p className="text-xs opacity-70">Supports UPI QR, Debit/Credit Cards, NetBanking &amp; Eco-Wallet.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ONLINE_SERVICES.map(srv => {
              const Icon = srv.icon
              return (
                <div key={srv.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Icon className="h-4 w-4 text-leaf-400" aria-hidden="true" />
                      <span className="font-mono text-base font-extrabold tabular-nums text-leaf-400">₹{srv.price}</span>
                    </div>
                    <h3 className="mt-2 font-semibold leading-snug">{srv.title}</h3>
                    <p className="mt-1 text-xs opacity-70">{srv.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutItem(srv)}
                    className="btn w-full whitespace-nowrap !py-1.5 text-xs"
                  >
                    Pay ₹{srv.price} online
                  </button>
                </div>
              )
            })}
          </div>
        </Glass>
      </div>

      {/* Transaction History & Receipts */}
      <Glass className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Payment ledger &amp; digital receipts ({data.transactions.length})</h2>
          <span className="inline-flex items-center gap-1.5 text-xs opacity-70">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" /> Click any row to inspect receipt
          </span>
        </div>

        {data.transactions.length ? (
          <div className="divide-y divide-white/10">
            {data.transactions.map(tx => {
              const isCredit = tx.direction === 'credit'
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 py-3 text-left text-sm transition hover:bg-white/5 px-2 rounded-lg"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isCredit ? 'bg-leaf-500/20 text-leaf-400' : 'bg-white/10 text-amber-300'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="h-4 w-4" aria-hidden="true" /> : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{tx.description}</p>
                      <p className="truncate text-xs opacity-65">
                        <span className="font-mono">{tx.id}</span> · {tx.method} ({tx.upiOrRef}) ·{' '}
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <p className={`text-base font-bold ${isCredit ? 'text-leaf-400' : ''}`}>
                      {isCredit ? '+' : '−'}₹{tx.amount}
                    </p>
                    <p className="text-[11px] uppercase opacity-65">{tx.status}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="py-6 text-sm opacity-70">Completed pickup payouts and online payments will appear here.</p>
        )}

        {selectedTx && (
          <div className="rounded-xl border border-leaf-400/35 bg-leaf-500/10 p-4 text-xs space-y-1.5 font-mono tabular-nums">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-leaf-300">Digital Receipt · {selectedTx.id}</strong>
              <button type="button" onClick={() => window.print()} className="underline text-leaf-300">
                Print receipt
              </button>
            </div>
            <p>Description: {selectedTx.description}</p>
            <p>Rail &amp; Reference: {selectedTx.method} · {selectedTx.upiOrRef}</p>
            <p>Settlement Amount: ₹{selectedTx.amount} ({selectedTx.direction.toUpperCase()})</p>
            <p>Timestamp: {new Date(selectedTx.createdAt).toLocaleString('en-IN')}</p>
          </div>
        )}
      </Glass>

      <OnlinePaymentModal
        open={Boolean(checkoutItem)}
        onClose={() => setCheckoutItem(null)}
        amount={checkoutItem?.price || 0}
        title={checkoutItem?.title || 'Online Payment'}
        description={checkoutItem?.title || ''}
        type={checkoutItem?.type || 'online_payment'}
        defaultUpi={data.savedUpiId}
        onSuccess={res => {
          if (res?.overview) setData(res.overview)
        }}
      />
    </div>
  )
}
