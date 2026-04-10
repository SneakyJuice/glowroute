# data/enrichment/

Apollo enrichment run summaries for WF-07.

## Files
- `WF07-YYYY-MM-DD-summary.json` — per-run summary (date, mode, processed, enriched, skipped, errors)

## Usage
```bash
# Test mode (5 clinics, no writes)
./scripts/wf-07-runner.sh --test

# Live run (100 clinics)
./scripts/wf-07-runner.sh --batch 100

# Resume from offset
./scripts/wf-07-runner.sh --batch 100 --offset 500
```

## Pipeline position
WF-06 (scrape) → **WF-07 (enrich)** → WF-02 (outreach)
