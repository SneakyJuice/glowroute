# GlowRoute Ark Orchestration — Sequential City Enrichment
# Runs all cities in tiers, batch by batch, auto-advances until each city exhausted
# Reports CITY_DONE and ALL_DONE markers for Zion monitoring

param(
  [int]$BatchSize = 20
)

Set-Location 'C:\Users\silly\.openclaw\workspace\glowroute'

# Load keys
$raw = Get-Content 'C:\Users\silly\.openclaw\workspace\.keys.env' -Raw -ErrorAction SilentlyContinue
if ($raw) {
  $pairs = $raw -split "`n" | Where-Object { $_ -match '^export ' }
  foreach ($p in $pairs) {
    $kv = ($p -replace '^export ', '') -split '=', 2
    if ($kv.Count -eq 2) {
      $k = $kv[0].Trim()
      $v = $kv[1].Trim().Trim("'")
      [System.Environment]::SetEnvironmentVariable($k, $v)
    }
  }
  Write-Host "✅ Keys loaded"
}

$outputDir = "output"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory $outputDir | Out-Null }

# Progress tracking file
$progressFile = "output\progress.json"

# City list — ordered by priority (Tampa metro first, then statewide expansion)
$cities = @(
  # Tier 1 — Tampa Bay Metro
  @{ city="st-petersburg"; display="St. Petersburg"; state="FL" },
  @{ city="clearwater"; display="Clearwater"; state="FL" },
  @{ city="brandon"; display="Brandon"; state="FL" },
  @{ city="wesley-chapel"; display="Wesley Chapel"; state="FL" },
  @{ city="land-o-lakes"; display="Land O Lakes"; state="FL" },
  @{ city="sarasota"; display="Sarasota"; state="FL" },
  # Tier 2 — Central FL
  @{ city="kissimmee"; display="Kissimmee"; state="FL" },
  @{ city="lakeland"; display="Lakeland"; state="FL" },
  @{ city="gainesville"; display="Gainesville"; state="FL" },
  @{ city="ocala"; display="Ocala"; state="FL" },
  @{ city="daytona-beach"; display="Daytona Beach"; state="FL" },
  # Tier 3 — South FL expansion
  @{ city="naples"; display="Naples"; state="FL" },
  @{ city="fort-myers"; display="Fort Myers"; state="FL" },
  @{ city="cape-coral"; display="Cape Coral"; state="FL" },
  @{ city="west-palm-beach"; display="West Palm Beach"; state="FL" },
  @{ city="coral-springs"; display="Coral Springs"; state="FL" },
  @{ city="pompano-beach"; display="Pompano Beach"; state="FL" },
  @{ city="port-st-lucie"; display="Port St. Lucie"; state="FL" },
  @{ city="boynton-beach"; display="Boynton Beach"; state="FL" },
  @{ city="palm-beach-gardens"; display="Palm Beach Gardens"; state="FL" },
  # Tier 4 — North FL / Panhandle
  @{ city="tallahassee"; display="Tallahassee"; state="FL" },
  @{ city="pensacola"; display="Pensacola"; state="FL" },
  @{ city="destin"; display="Destin"; state="FL" },
  @{ city="panama-city"; display="Panama City"; state="FL" },
  @{ city="ocala"; display="Ocala"; state="FL" }
)

# Load existing progress
$progress = @{}
if (Test-Path $progressFile) {
  try {
    $progress = Get-Content $progressFile -Raw | ConvertFrom-Json -AsHashtable
  } catch { $progress = @{} }
}

$totalClinics = 0
$totalCities = 0

Write-Host ""
Write-Host "🚀 GlowRoute Ark Orchestration Starting — $(Get-Date -Format 'HH:mm:ss')"
Write-Host "   Cities queued: $($cities.Count) | Batch size: $BatchSize"
Write-Host ""

foreach ($c in $cities) {
  $slug = $c.city
  $display = $c.display
  $state = $c.state
  $outputFile = "$outputDir\$slug.json"

  # Check if already complete
  if ($progress.ContainsKey($slug) -and $progress[$slug] -eq "DONE") {
    $existing = 0
    if (Test-Path $outputFile) {
      try { $existing = (Get-Content $outputFile -Raw | ConvertFrom-Json).Count } catch {}
    }
    Write-Host "⏭️  $display — already done ($existing clinics), skipping"
    $totalClinics += $existing
    $totalCities++
    continue
  }

  Write-Host "📍 Processing: $display, $state"

  $skip = 0
  $cityTotal = 0

  # Load existing data if partial run
  $existing = @()
  if (Test-Path $outputFile) {
    try {
      $existing = Get-Content $outputFile -Raw | ConvertFrom-Json
      $skip = $existing.Count
      $cityTotal = $existing.Count
      Write-Host "   Resuming from skip=$skip (already have $($existing.Count) clinics)"
    } catch {}
  }

  $batchNum = [math]::Floor($skip / $BatchSize) + 1

  while ($true) {
    $logFile = "$outputDir\$slug-batch$batchNum.log"
    Write-Host "   🔄 Batch $batchNum (skip=$skip)..."

    # Run batch
    $start = Get-Date
    node enrich-batch.js --city $display --state $state --max $BatchSize --skip $skip *> $logFile
    $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds)

    # Count results in output file
    $results = 0
    if (Test-Path $outputFile) {
      try { $results = (Get-Content $outputFile -Raw | ConvertFrom-Json).Count } catch {}
    }

    $newThisBatch = $results - $cityTotal
    $cityTotal = $results

    Write-Host "   ✅ Batch $batchNum done — $newThisBatch new clinics ($cityTotal total) in ${elapsed}s"

    # If we got fewer than batch size, city is exhausted
    if ($newThisBatch -lt $BatchSize) {
      Write-Host "   🏁 $display complete — $cityTotal clinics total"
      break
    }

    $skip += $BatchSize
    $batchNum++

    # Brief pause between batches
    Start-Sleep -Seconds 3
  }

  # Mark city done in progress
  $progress[$slug] = "DONE"
  $progress | ConvertTo-Json | Set-Content $progressFile

  Write-Host "CITY_DONE:$slug:$cityTotal"
  Write-Host ""

  $totalClinics += $cityTotal
  $totalCities++

  # Pause between cities
  Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "🎉 ALL_DONE — $totalCities cities, $totalClinics total clinics"
Write-Host "ALL_DONE:$totalCities:$totalClinics"
