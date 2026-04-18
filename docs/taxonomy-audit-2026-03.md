# GlowRoute Taxonomy Audit — 2026-03

**Run date:** 2026-03-31  
**Taxonomy version:** 1.0.0  
**Total clinics:** 6261  
**Clinics with empty services:** 1462 (23%)  
**Clinics with canonical coverage:** 3529 (74% of those with any tags)  

---

## 🆕 New / Unmapped Tags (Taxonomy Candidates)

These tags appear in clinic data but don't map to any canonical slug.  
**Review for potential additions to taxonomy.json.** Signal-driven: prefer tags users search for, not clinical terminology.

| Tag | Count | Suggested Action |
|-----|-------|-----------------|
| `laser-skin` | 1283 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `weight-loss-ozempic` | 1046 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `trt-testosterone` | 225 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `skin-care-clinic` | 70 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `beauty-salon` | 55 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `object-object` | 51 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `facial-spa` | 47 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `dermatologist` | 45 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `hair-salon` | 40 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `medical-clinic` | 33 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `plastic-surgeon` | 28 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `dentist` | 24 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `massage-spa` | 23 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `massage-therapy` | 20 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `massage-therapist` | 20 | ⚡ HIGH SIGNAL — add to canonical or existing variant list |
| `nail-salon` | 18 | 👀 Worth adding as variant |
| `hotel` | 16 | 👀 Worth adding as variant |
| `laser-hair-removal-service` | 16 | 👀 Worth adding as variant |
| `doctor` | 15 | 👀 Worth adding as variant |
| `day-spa` | 14 | 👀 Worth adding as variant |
| `pharmacy` | 13 | 👀 Worth adding as variant |
| `permanent-make-up-clinic` | 12 | 👀 Worth adding as variant |
| `chiropractor` | 11 | 👀 Worth adding as variant |
| `deep-tissue-massage` | 11 | 👀 Worth adding as variant |
| `medical-center` | 10 | 👀 Worth adding as variant |
| `waxing` | 10 | 👀 Worth adding as variant |
| `acupuncture` | 10 | 👀 Worth adding as variant |
| `swedish-massage` | 10 | 👀 Worth adding as variant |
| `weight-loss-service` | 9 | Monitor next month |
| `resort-hotel` | 9 | Monitor next month |
| `hair-extension-technician` | 9 | Monitor next month |
| `permanent-makeup` | 9 | Monitor next month |
| `cosmetic-dentist` | 8 | Monitor next month |
| `skin-care` | 8 | Monitor next month |
| `plastic-surgery-clinic` | 8 | Monitor next month |
| `hairdresser` | 8 | Monitor next month |
| `cosmetic-dentistry` | 8 | Monitor next month |
| `health-spa` | 7 | Monitor next month |
| `plastic-surgery` | 7 | Monitor next month |
| `therapeutic-massage` | 7 | Monitor next month |
| `beauty-school` | 7 | Monitor next month |
| `teeth-whitening` | 7 | Monitor next month |
| `dental-implants` | 7 | Monitor next month |
| `eyelash-salon` | 6 | Monitor next month |
| `internist` | 6 | Monitor next month |
| `skin-treatments` | 6 | Monitor next month |
| `cupping` | 6 | Monitor next month |
| `waxing-hair-removal-service` | 6 | Monitor next month |
| `cosmetic-surgeon` | 6 | Monitor next month |
| `chiropractic-care` | 6 | Monitor next month |

**Total unmapped unique tags:** 1453  
**Total unmapped instances:** 5031

---

## 📊 Canonical Coverage

| Canonical Slug | Label | Clinic Matches |
|----------------|-------|---------------|
| `botox-fillers` | Botox & Fillers | 1553 |
| `hydrafacial` | HydraFacial | 1149 |
| `microneedling` | Microneedling | 985 |
| `anti-aging` | Anti-Aging & Skin Care | 876 |
| `iv-therapy` | IV Therapy | 552 |
| `prp-treatments` | PRP Treatments | 504 |
| `laser-hair-removal` | Laser Hair Removal | 485 |
| `coolsculpting` | Body Contouring | 473 |
| `chemical-peels` | Chemical Peels | 314 |
| `peptide-therapy` | Peptide Therapy | 219 |
| `hair-restoration` | Hair Restoration | 21 |
| `weight-loss-ozempic` | Medical Weight Loss | 0 ⚠️ ZERO MATCHES |
| `trt-testosterone` | TRT & Hormone Therapy | 0 ⚠️ ZERO MATCHES |
| `laser-skin` | Laser Skin Treatments | 0 ⚠️ ZERO MATCHES |

---

## ⚠️ Dead Canonicals (Zero Matches)

These canonical slugs have zero clinic matches. Consider merging or removing:

- `weight-loss-ozempic`
- `trt-testosterone`
- `laser-skin`

---

## 📱 PostHog Search Signals

_PostHog signals skipped (pass --posthog flag + POSTHOG_API_KEY to include)_

_No PostHog data available this run. Re-run with --posthog flag after 30+ days of traffic._

---

## 🔧 Recommended Actions This Month

1. **Review high-signal unmapped tags above** — add to taxonomy.json variants or create new canonical
2. **Run backfill after any taxonomy.json changes:** `node scripts/taxonomy-backfill.js --write`
3. **Check PostHog dashboard** for new search terms at posthog.com
4. **Next audit:** First Monday of May 2026

---

_Auto-generated by scripts/taxonomy-audit.js. Do not manually edit — re-run script to refresh._