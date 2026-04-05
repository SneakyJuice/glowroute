# GlowRoute — FL Cities Enrichment Queue
*Target: 1,500+ total FL clinic listings*
*Current: 292 (Tampa, Orlando, Miami, Fort Lauderdale, Jacksonville, Boca Raton)*

## Batch Instructions
- Max 20 clinics per run (`--max 20`) to prevent timeouts
- 1.1s delay built into script (Firecrawl paid plan)
- Each city = 2-3 batch runs with `--skip 0`, `--skip 20`, `--skip 40`
- Save output to `output/<city-slug>.json`
- After each city completes, mark ✅ below

## Cities Queue (ordered by market size)

### Tier 1 — Run First (high medspa density)
- [ ] St. Petersburg, FL — `node enrich-batch.js --city "St. Petersburg" --max 20`
- [ ] Clearwater, FL — `node enrich-batch.js --city "Clearwater" --max 20`
- [ ] West Palm Beach, FL — `node enrich-batch.js --city "West Palm Beach" --max 20`
- [ ] Fort Myers, FL — `node enrich-batch.js --city "Fort Myers" --max 20`
- [ ] Naples, FL — `node enrich-batch.js --city "Naples" --max 20`
- [ ] Sarasota, FL — `node enrich-batch.js --city "Sarasota" --max 20`

### Tier 2 — High Value
- [ ] Coral Springs, FL — `node enrich-batch.js --city "Coral Springs" --max 20`
- [ ] Hollywood, FL — `node enrich-batch.js --city "Hollywood" --max 20`
- [ ] Aventura, FL — `node enrich-batch.js --city "Aventura" --max 20`
- [ ] Pembroke Pines, FL — `node enrich-batch.js --city "Pembroke Pines" --max 20`
- [ ] Coral Gables, FL — `node enrich-batch.js --city "Coral Gables" --max 20`
- [ ] Delray Beach, FL — `node enrich-batch.js --city "Delray Beach" --max 20`
- [ ] Boynton Beach, FL — `node enrich-batch.js --city "Boynton Beach" --max 20`
- [ ] Palm Beach Gardens, FL — `node enrich-batch.js --city "Palm Beach Gardens" --max 20`
- [ ] Doral, FL — `node enrich-batch.js --city "Doral" --max 20`
- [ ] Lakeland, FL — `node enrich-batch.js --city "Lakeland" --max 20`
- [ ] Bradenton, FL — `node enrich-batch.js --city "Bradenton" --max 20`

### Tier 3 — Secondary Markets
- [ ] Gainesville, FL — `node enrich-batch.js --city "Gainesville" --max 20`
- [ ] Tallahassee, FL — `node enrich-batch.js --city "Tallahassee" --max 20`
- [ ] Pensacola, FL — `node enrich-batch.js --city "Pensacola" --max 20`
- [ ] Kissimmee, FL — `node enrich-batch.js --city "Kissimmee" --max 20`
- [ ] Daytona Beach, FL — `node enrich-batch.js --city "Daytona Beach" --max 20`
- [ ] Melbourne, FL — `node enrich-batch.js --city "Melbourne" --max 20`
- [ ] Port St. Lucie, FL — `node enrich-batch.js --city "Port St. Lucie" --max 20`
- [ ] Cape Coral, FL — `node enrich-batch.js --city "Cape Coral" --max 20`
- [ ] Plantation, FL — `node enrich-batch.js --city "Plantation" --max 20`
- [ ] Weston, FL — `node enrich-batch.js --city "Weston" --max 20`

## Merge Command (run after all cities complete)
```
node merge-cities.js
```
Merges all `output/*.json` → `output/all-merged.json` → push to GitHub for Atlas to pull.

## Progress Tracking
| City | Clinics | Status |
|------|---------|--------|
| Tampa | 57 | ✅ Done |
| Orlando | 46 | ✅ Done |
| Miami | 44 | ✅ Done |
| Fort Lauderdale | 45 | ✅ Done |
| Jacksonville | 43 | ✅ Done |
| Boca Raton | 20 | ✅ Done |
| **Total so far** | **292** | |
| **Target** | **1,500+** | |
