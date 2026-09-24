import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgIconStandard = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e232a"/>
      <stop offset="100%" stop-color="#0a0c10"/>
    </linearGradient>

    <!-- Amber Brand Gradient -->
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Route Sign Gradient -->
    <linearGradient id="signGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>

    <!-- Glass reflections -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#0284c7" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.25"/>
    </linearGradient>

    <!-- Drop Shadow for Bus -->
    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#f59e0b" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Base App Background with Rounded Corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#f59e0b" stroke-width="6" stroke-opacity="0.35"/>

  <!-- Subtle grid pattern in background -->
  <g opacity="0.04" stroke="#ffffff" stroke-width="2">
    <line x1="64" y1="0" x2="64" y2="512"/>
    <line x1="128" y1="0" x2="128" y2="512"/>
    <line x1="192" y1="0" x2="192" y2="512"/>
    <line x1="256" y1="0" x2="256" y2="512"/>
    <line x1="320" y1="0" x2="320" y2="512"/>
    <line x1="384" y1="0" x2="384" y2="512"/>
    <line x1="448" y1="0" x2="448" y2="512"/>
    <line x1="0" y1="64" x2="512" y2="64"/>
    <line x1="0" y1="128" x2="512" y2="128"/>
    <line x1="0" y1="192" x2="512" y2="192"/>
    <line x1="0" y1="256" x2="512" y2="256"/>
    <line x1="0" y1="320" x2="512" y2="320"/>
    <line x1="0" y1="384" x2="512" y2="384"/>
    <line x1="0" y1="448" x2="512" y2="448"/>
  </g>

  <!-- TOP BADGE: "HK" with Hong Kong Red & Amber Accent -->
  <g transform="translate(0, 48)">
    <rect x="206" y="0" width="100" height="34" rx="10" fill="#dc2626" />
    <text x="256" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="3">HK</text>
  </g>

  <!-- HONG KONG DOUBLE-DECKER BUS ICON (Centered) -->
  <g transform="translate(136, 100)" filter="url(#dropGlow)">
    <!-- Main Bus Chassis Outline -->
    <rect x="0" y="0" width="240" height="236" rx="36" fill="#1c1917" stroke="#fbbf24" stroke-width="7"/>

    <!-- Upper Deck Destination & LED Display Screen -->
    <rect x="22" y="20" width="196" height="42" rx="10" fill="url(#signGrad)" stroke="#333" stroke-width="2"/>
    <!-- LED Matrix Text "ETA" in destination box -->
    <text x="120" y="49" font-family="'JetBrains Mono', 'Courier New', monospace, sans-serif" font-weight="900" font-size="28" fill="#fbbf24" text-anchor="middle" letter-spacing="4">ETA</text>

    <!-- Upper Deck Windshield (Big Glass) -->
    <rect x="22" y="72" width="196" height="52" rx="8" fill="url(#glassGrad)" stroke="#444" stroke-width="2"/>
    <!-- Upper Deck dividing pillar & passengers silhouette -->
    <line x1="120" y1="72" x2="120" y2="124" stroke="#1c1917" stroke-width="4"/>
    <circle cx="70" cy="98" r="8" fill="#ffffff" opacity="0.3"/>
    <circle cx="170" cy="98" r="8" fill="#ffffff" opacity="0.3"/>

    <!-- Mid-Chassis Trim Line (Red Hong Kong City livery accent) -->
    <rect x="14" y="132" width="212" height="10" rx="3" fill="#dc2626"/>

    <!-- Lower Deck Windshield -->
    <rect x="22" y="150" width="196" height="48" rx="8" fill="url(#glassGrad)" stroke="#444" stroke-width="2"/>
    <!-- Driver area on right (HK Right-Hand Drive) -->
    <circle cx="180" cy="174" r="8" fill="#fbbf24" opacity="0.4"/>
    <line x1="180" y1="184" x2="180" y2="198" stroke="#fbbf24" stroke-width="3" opacity="0.4"/>

    <!-- Lower Bumper, Grille & Headlights -->
    <rect x="22" y="206" width="196" height="20" rx="6" fill="#0c0a09"/>
    <!-- Left Headlights (Glowing) -->
    <circle cx="44" cy="216" r="6" fill="#fef08a"/>
    <circle cx="44" cy="216" r="10" fill="#fbbf24" opacity="0.4"/>
    <circle cx="62" cy="216" r="4" fill="#fef08a"/>
    <!-- Center Grille vents -->
    <line x1="96" y1="216" x2="144" y2="216" stroke="#444" stroke-width="3" stroke-dasharray="4,4"/>
    <!-- Right Headlights (Glowing) -->
    <circle cx="196" cy="216" r="6" fill="#fef08a"/>
    <circle cx="196" cy="216" r="10" fill="#fbbf24" opacity="0.4"/>
    <circle cx="178" cy="216" r="4" fill="#fef08a"/>

    <!-- Bus Tires Underneath -->
    <rect x="26" y="234" width="36" height="10" rx="4" fill="#09090b"/>
    <rect x="178" y="234" width="36" height="10" rx="4" fill="#09090b"/>
  </g>

  <!-- PROMINENT BOTTOM TEXT: "HK ETA" -->
  <g transform="translate(0, 396)">
    <!-- HK badge -->
    <text x="175" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle" letter-spacing="2">HK</text>

    <!-- Golden Dot Separator -->
    <circle cx="232" cy="38" r="7" fill="#fbbf24"/>

    <!-- ETA in glowing amber -->
    <text x="325" y="52" font-family="'JetBrains Mono', -apple-system, BlinkMacSystemFont, monospace, sans-serif" font-weight="900" font-size="58" fill="#fbbf24" text-anchor="middle" letter-spacing="3">ETA</text>
  </g>

  <!-- Bottom Subtitle pill -->
  <g transform="translate(0, 466)">
    <text x="256" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#a1a1aa" text-anchor="middle" letter-spacing="4">實時到站看板</text>
  </g>
</svg>
`;

// Maskable version with 15% safe padding all around
const svgIconMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e232a"/>
      <stop offset="100%" stop-color="#0a0c10"/>
    </linearGradient>
    <linearGradient id="signGradM" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>
    <linearGradient id="glassGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.25"/>
    </linearGradient>
  </defs>

  <!-- Full-bleed background for maskable -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Scaled content inside safe zone (approx 78% center) -->
  <g transform="translate(256, 256) scale(0.76) translate(-256, -256)">
    <!-- TOP BADGE: "HK" -->
    <g transform="translate(0, 48)">
      <rect x="206" y="0" width="100" height="34" rx="10" fill="#dc2626" />
      <text x="256" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="3">HK</text>
    </g>

    <!-- HONG KONG DOUBLE-DECKER BUS ICON -->
    <g transform="translate(136, 100)">
      <rect x="0" y="0" width="240" height="236" rx="36" fill="#1c1917" stroke="#fbbf24" stroke-width="7"/>
      <rect x="22" y="20" width="196" height="42" rx="10" fill="url(#signGradM)" stroke="#333" stroke-width="2"/>
      <text x="120" y="49" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="28" fill="#fbbf24" text-anchor="middle" letter-spacing="4">ETA</text>
      <rect x="22" y="72" width="196" height="52" rx="8" fill="url(#glassGradM)" stroke="#444" stroke-width="2"/>
      <line x1="120" y1="72" x2="120" y2="124" stroke="#1c1917" stroke-width="4"/>
      <circle cx="70" cy="98" r="8" fill="#ffffff" opacity="0.3"/>
      <circle cx="170" cy="98" r="8" fill="#ffffff" opacity="0.3"/>
      <rect x="14" y="132" width="212" height="10" rx="3" fill="#dc2626"/>
      <rect x="22" y="150" width="196" height="48" rx="8" fill="url(#glassGradM)" stroke="#444" stroke-width="2"/>
      <circle cx="180" cy="174" r="8" fill="#fbbf24" opacity="0.4"/>
      <line x1="180" y1="184" x2="180" y2="198" stroke="#fbbf24" stroke-width="3" opacity="0.4"/>
      <rect x="22" y="206" width="196" height="20" rx="6" fill="#0c0a09"/>
      <circle cx="44" cy="216" r="6" fill="#fef08a"/>
      <circle cx="62" cy="216" r="4" fill="#fef08a"/>
      <circle cx="196" cy="216" r="6" fill="#fef08a"/>
      <circle cx="178" cy="216" r="4" fill="#fef08a"/>
      <rect x="26" y="234" width="36" height="10" rx="4" fill="#09090b"/>
      <rect x="178" y="234" width="36" height="10" rx="4" fill="#09090b"/>
    </g>

    <!-- PROMINENT BOTTOM TEXT: "HK ETA" -->
    <g transform="translate(0, 396)">
      <text x="175" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle" letter-spacing="2">HK</text>
      <circle cx="232" cy="38" r="7" fill="#fbbf24"/>
      <text x="325" y="52" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="58" fill="#fbbf24" text-anchor="middle" letter-spacing="3">ETA</text>
    </g>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Save standard SVG icon
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIconStandard.trim());
  console.log('Saved public/icon.svg');

  // 2. Generate Apple Touch Icon (180x180 PNG)
  await sharp(Buffer.from(svgIconStandard))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png (180x180)');

  // 3. Generate PWA 192x192 PNG
  await sharp(Buffer.from(svgIconStandard))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png (192x192)');

  // 4. Generate PWA 512x512 PNG
  await sharp(Buffer.from(svgIconStandard))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png (512x512)');

  // 5. Generate PWA Maskable 512x512 PNG
  await sharp(Buffer.from(svgIconMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png (512x512 maskable)');

  // 6. Generate favicon-32x32.png
  await sharp(Buffer.from(svgIconStandard))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated public/favicon-32x32.png');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
