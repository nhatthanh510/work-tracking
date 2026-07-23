// Regenerate the social share image: `yarn og`
// Renders a 1200x630 PNG to public/og-image.png using sharp (dev dependency).
import sharp from 'sharp'

const W = 1200
const H = 630

// palette (Timesheet Chronograph — dark instrument panel)
const bg = '#0f1319'
const surface = '#161b22'
const border = '#262d37'
const teal = '#2fb3a0'
const text = '#e7e9e6'
const muted = '#98a2b0'
const track = '#232b34'
const inkOnTeal = '#06110f'

const display = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const mono = "'Menlo', 'Monaco', 'DejaVu Sans Mono', monospace"

// ---- Day Bar geometry (06:00–22:00 window) ----
const barX = 80
const barW = W - 160 // 1040
const barY = 486
const barH = 52
const WIN_START = 6 * 60
const WIN = 16 * 60
const frac = (min) => (min - WIN_START) / WIN
const fillL = barX + frac(9 * 60) * barW // 09:00
const fillR = barX + frac(17 * 60 + 45) * barW // 17:45

const ticks = Array.from({ length: 15 }, (_, i) => {
  const x = barX + ((i + 1) * barW) / 16
  return `<line x1="${x}" y1="${barY + 8}" x2="${x}" y2="${barY + barH - 8}" stroke="${text}" stroke-opacity="0.07" stroke-width="2"/>`
}).join('')

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="18%" cy="10%" r="55%">
      <stop offset="0%" stop-color="${teal}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${teal}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${teal}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${teal}" stop-opacity="0.75"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${border}" stroke-width="2"/>

  <!-- Brand -->
  <rect x="80" y="72" width="64" height="64" rx="16" fill="${teal}"/>
  <g stroke="${inkOnTeal}" stroke-width="3.5" stroke-linecap="round" fill="none">
    <circle cx="112" cy="104" r="17"/>
    <line x1="112" y1="104" x2="112" y2="91"/>
    <line x1="112" y1="104" x2="122" y2="109"/>
  </g>
  <text x="164" y="100" font-family="${display}" font-size="40" font-weight="700" fill="${text}">Timesheet</text>
  <text x="166" y="127" font-family="${mono}" font-size="15" font-weight="500" letter-spacing="3" fill="${teal}">CHRONOGRAPH</text>

  <!-- Headline -->
  <text x="80" y="278" font-family="${display}" font-size="82" font-weight="700" fill="${text}">Your hours,</text>
  <text x="80" y="366" font-family="${display}" font-size="82" font-weight="700" fill="${teal}">measured.</text>
  <text x="82" y="420" font-family="${display}" font-size="26" fill="${muted}">One-tap check in / out · totals · CSV export</text>

  <!-- Today readout card -->
  <rect x="760" y="176" width="360" height="176" rx="22" fill="${surface}" stroke="${border}" stroke-width="1.5"/>
  <text x="792" y="228" font-family="${mono}" font-size="14" font-weight="500" letter-spacing="2.5" fill="${muted}">TODAY</text>
  <text x="792" y="292" font-family="${mono}" font-size="60" font-weight="600" fill="${text}">7h 45m</text>
  <text x="792" y="324" font-family="${mono}" font-size="18" fill="${muted}">09:00 – 17:45</text>

  <!-- Day Bar signature -->
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="14" fill="${track}"/>
  ${ticks}
  <rect x="${fillL}" y="${barY}" width="${fillR - fillL}" height="${barH}" rx="14" fill="url(#fill)"/>
  <line x1="${fillL}" y1="${barY}" x2="${fillL}" y2="${barY + barH}" stroke="${bg}" stroke-opacity="0.55" stroke-width="3"/>
  <line x1="${fillR}" y1="${barY}" x2="${fillR}" y2="${barY + barH}" stroke="${bg}" stroke-opacity="0.55" stroke-width="3"/>
  <text x="${barX}" y="${barY - 14}" font-family="${mono}" font-size="15" fill="${muted}">6a</text>
  <text x="${barX + barW}" y="${barY - 14}" text-anchor="end" font-family="${mono}" font-size="15" fill="${muted}">10p</text>
  <text x="${fillL}" y="${barY + barH + 30}" text-anchor="middle" font-family="${mono}" font-size="16" fill="${text}">in 09:00</text>
  <text x="${fillR}" y="${barY + barH + 30}" text-anchor="middle" font-family="${mono}" font-size="16" fill="${text}">out 17:45</text>
</svg>`

const outPath = process.argv[2] ?? 'public/og-image.png'
await sharp(Buffer.from(svg)).png().toFile(outPath)
const meta = await sharp(outPath).metadata()
console.log(`Wrote ${outPath} — ${meta.width}x${meta.height}`)
