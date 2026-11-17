import { useId } from 'react'

export default function BrandLogo({ size = 30, className = '', withWordmark = false, wordmarkClass = 'text-lg font-extrabold tracking-tight' }) {
  const uid = useId().replace(/:/g, '')
  const gradMain = `sc-grad-${uid}`
  const gradAccent = `sc-accent-${uid}`

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradMain} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="52%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={gradAccent} x1="10" y1="30" x2="32" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>

      {/* Rounded architectural shield frame */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="#052e1c"
        stroke={`url(#${gradMain})`}
        strokeWidth="2"
      />

      {/* Circular recovery arc (top-left to right) */}
      <path
        d="M11 19C11 13.477 15.477 9 21 9C24.8 9 28.1 11.12 29.8 14.25"
        stroke={`url(#${gradMain})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M26.5 14.5L30.5 15.2L31.4 11.2"
        stroke="#86efac"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Complementary connect arc (bottom-right to left) */}
      <path
        d="M29 21C29 26.523 24.523 31 19 31C15.2 31 11.9 28.88 10.2 25.75"
        stroke={`url(#${gradAccent})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M13.5 25.5L9.5 24.8L8.6 28.8"
        stroke="#4ade80"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central leaf-circuit diamond core */}
      <path
        d="M20 14.2C22.4 15.8 24.2 18.1 24.2 20.5C24.2 23.1 22.3 25.2 20 25.8C17.7 25.2 15.8 23.1 15.8 20.5C15.8 18.1 17.6 15.8 20 14.2Z"
        fill={`url(#${gradMain})`}
      />
      <path
        d="M20 16.4V23.6"
        stroke="#052e1c"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )

  if (!withWordmark) return mark

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      {mark}
      <span className={wordmarkClass}>Scrap Connect</span>
    </span>
  )
}
