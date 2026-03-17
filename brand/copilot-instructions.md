# GlowRoute ƒ?" GitHub Copilot Brand Instructions
# Place this file at: .github/copilot-instructions.md in your repo

## Brand Identity

GlowRoute is a premium medspa and aesthetic clinic discovery platform.
Positioning: "The premium discovery platform for aesthetic wellness."
Archetype: The Curator / The Sophisticate. Think Resy meets Net-a-Porter.

---

## Design System ƒ?" Always Use These

### CSS Custom Properties (add to :root)
```css
:root {
  --onyx: #0D0D0D;          /* Primary ƒ?" near-black */
  --champagne: #C9A96E;     /* Secondary ƒ?" warm gold */
  --blush: #E8C4B8;         /* Accent ƒ?" feminine warmth */
  --ivory: #FAF8F5;         /* Surface ƒ?" warm background */
  --stone: #8C8279;         /* Muted ƒ?" secondary text */
  --sage: #4A6741;          /* CTA ƒ?" action color */
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-accent: 'DM Serif Display', Georgia, serif;
}
```

### Typography Rules
- H1: Cormorant Garamond, font-weight 300, 56ƒ?"72px
- H2: Cormorant Garamond, font-weight 400, 36ƒ?"48px
- H3: DM Sans, font-weight 500, 24ƒ?"28px
- Body: DM Sans, font-weight 400, 16ƒ?"18px
- Labels/Captions: DM Sans, font-weight 500, 12px, letter-spacing 0.1em, uppercase

### Button Patterns
```jsx
// Primary CTA ƒ?" always sage green
<button className="bg-sage text-white px-7 py-3 rounded font-medium tracking-wide text-sm">
  Reserve Your Consultation
</button>

// Secondary ƒ?" champagne gold outline
<button className="border border-champagne text-champagne px-7 py-3 rounded text-sm">
  Explore by Specialty
</button>
```

### Clinic Card Pattern
```jsx
<div className="bg-white rounded-lg shadow-sm overflow-hidden">
  <div className="h-40 bg-ivory">{/* Clinic image */}</div>
  <div className="p-5">
    <span className="inline-flex items-center gap-1 text-champagne text-xs border border-champagne/30 bg-champagne/10 rounded px-2.5 py-1 mb-3">
      ƒoÝ Verified Provider
    </span>
    <h3 className="font-serif font-normal text-xl text-onyx mb-1">{clinic.name}</h3>
    <p className="text-stone text-sm mb-3">{clinic.city} Aú {clinic.distance}</p>
    {/* Gold star ratings */}
    <div className="flex gap-0.5 mb-3">{stars}</div>
    {/* Service tags */}
    <div className="flex gap-2 flex-wrap mb-4">
      {services.map(s => (
        <span className="border border-stone/20 rounded-full px-3 py-1 text-xs text-stone">{s}</span>
      ))}
    </div>
    <button className="w-full bg-sage text-white py-2.5 rounded text-sm font-medium">
      Reserve Your Consultation
    </button>
  </div>
</div>
```

---

## Voice & Copy Rules ƒ?" Always Enforce

| ƒ?O NEVER write | ƒo. ALWAYS write |
|---------------|----------------|
| "Book now" | "Reserve your consultation" |
| "Filter by treatment" | "Explore by specialty" |
| "60 clinics found near you" | "60 verified providers in Tampa" |
| "Claim your free listing" | "Join 292+ verified Tampa clinics" |
| "Best match" | "Curated for you" |
| "Sign up free" | "Join the GlowRoute network" |
| "Search results" | "Curated providers" |

**Tone:** Vogue meets healthcare. Aspirational, never clinical. Never use discount language.

---

## Layout Rules
1. Generous whitespace ƒ?" luxury breathes, never pack content
2. Hero sections: dark background (var(--onyx)) with gold accents
3. Surface sections: ivory cream (var(--ivory)) or white
4. Gold (#C9A96E) reserved for: accents, stars, verified badges, borders only
5. Sage (#4A6741) for ALL CTAs and action buttons
6. Border radius: 4px standard, 8px cards, 100px pill tags
7. One hero, one action, one story per section

---

## Component Naming Conventions
- `ClinicCard` ƒ?" listing page provider card
- `VerifiedBadge` ƒ?" gold "ƒoÝ Verified Provider" badge
- `HeroSearch` ƒ?" dark hero with centered search input
- `ServiceTag` ƒ?" pill-shaped treatment category tag
- `StarRating` ƒ?" champagne gold star display

---

## Google Fonts (always import these)
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
```

---

## Tailwind Config Extension (if using Tailwind)
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        onyx: '#0D0D0D',
        champagne: '#C9A96E',
        blush: '#E8C4B8',
        ivory: '#FAF8F5',
        stone: '#8C8279',
        sage: '#4A6741',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        accent: ['DM Serif Display', 'Georgia', 'serif'],
      },
    },
  },
}
```

---

*GlowRoute Brand System ƒ?" Copilot Instructions v1.0*
