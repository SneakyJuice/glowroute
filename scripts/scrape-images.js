#!/usr/bin/env node
/**
 * GlowRoute — Firecrawl image scraping pass
 * Extracts og:image, logo, and hero images from clinic websites
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const FC_KEY = fs.readFileSync(path.join(process.env.HOME, '.firecrawl_key'), 'utf8').trim()
const DATA_FILE = path.join(__dirname, '../data/tampa-clinics.ts')
const DELAY_MS = 2000

// ── Parse clinics from .ts file ──────────────────────────────────────────────
function parseClinics(src) {
  const clinics = []
  // Match each object block between { and }
  const blockRe = /\{\s*\n([\s\S]*?)\n  \}/g
  let m
  while ((m = blockRe.exec(src)) !== null) {
    const block = m[0]
    const get = (key) => {
      const r = new RegExp(`${key}:\\s*'([^']*)'`)
      const r2 = new RegExp(`${key}:\\s*"([^"]*)"`)
      const match = r.exec(block) || r2.exec(block)
      return match ? match[1] : null
    }
    const id = get('id')
    if (!id) continue
    clinics.push({
      id,
      website: get('website'),
      imageUrl: get('imageUrl'),
      logo: get('logo'),
    })
  }
  return clinics
}

// ── Firecrawl scrape ─────────────────────────────────────────────────────────
function firecrawlScrape(url) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      url,
      formats: ['html'],
      onlyMainContent: false,
    })
    const options = {
      hostname: 'api.firecrawl.dev',
      path: '/v1/scrape',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FC_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 20000,
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve({ error: 'parse_error', raw: data.slice(0, 200) })
        }
      })
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.write(body)
    req.end()
  })
}

// ── Extract images from scraped HTML ─────────────────────────────────────────
function extractImages(html, siteUrl) {
  if (!html) return { imageUrl: null, logo: null }

  // og:image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  const ogImage = ogMatch ? ogMatch[1] : null

  // logo — look for img with "logo" in class/id/alt/src
  const logoMatch = html.match(/<img[^>]*(?:id|class|alt|src)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
    || html.match(/<img[^>]*src=["']([^"']*logo[^"']*)["']/i)
  let logoImg = logoMatch ? logoMatch[1] : null

  // hero — look for large banner/hero images
  const heroMatch = html.match(/<img[^>]*(?:class|id|alt)=["'][^"']*(?:hero|banner|header|bg)[^"']*["'][^>]*src=["']([^"']+)["']/i)
  let heroImg = heroMatch ? heroMatch[1] : null

  // Resolve relative URLs
  const resolve = (url) => {
    if (!url) return null
    if (url.startsWith('//')) return 'https:' + url
    if (url.startsWith('/')) {
      try {
        const base = new URL(siteUrl)
        return base.origin + url
      } catch { return null }
    }
    if (!url.startsWith('http')) return null
    return url
  }

  // Filter out data URIs and tiny images
  const clean = (url) => {
    const r = resolve(url)
    if (!r) return null
    if (r.startsWith('data:')) return null
    if (r.includes('pixel') || r.includes('1x1') || r.includes('spacer')) return null
    return r
  }

  return {
    imageUrl: clean(ogImage) || clean(heroImg),
    logo: clean(logoImg),
  }
}

// ── Update .ts file with scraped values ──────────────────────────────────────
function updateTsFile(src, updates) {
  let result = src
  for (const { id, imageUrl, logo } of updates) {
    if (!imageUrl && !logo) continue

    // Find the clinic block by id and inject fields
    const idPattern = new RegExp(`(id: '${id.replace(/[-']/g, (c) => c === "'" ? "\\'" : '\\-')}',\\n)`)
    
    if (imageUrl && !result.includes(`imageUrl:`) ) {
      // no imageUrl field at all — we'll do targeted replacement per clinic block
    }

    // Use a block-scoped replacement approach
    // Find the block for this clinic and add/update imageUrl and logo
    const blockStart = result.indexOf(`id: '${id}'`)
    if (blockStart === -1) continue

    // Find end of this block
    const blockEnd = result.indexOf('\n  },', blockStart)
    if (blockEnd === -1) continue

    let block = result.slice(blockStart, blockEnd)

    // Update or insert imageUrl
    if (imageUrl) {
      if (block.includes('imageUrl:')) {
        block = block.replace(/imageUrl:\s*'[^']*'/, `imageUrl: '${imageUrl}'`)
      } else {
        // Insert after description line or before verified line
        block = block.replace(/(description:[^\n]+\n)/, `$1    imageUrl: '${imageUrl}',\n`)
          || block.replace(/(verified:)/, `imageUrl: '${imageUrl}',\n    $1`)
      }
    }

    // Update or insert logo
    if (logo) {
      if (block.includes('logo:')) {
        block = block.replace(/logo:\s*'[^']*'/, `logo: '${logo}'`)
      } else if (imageUrl) {
        block = block.replace(/(imageUrl:[^\n]+\n)/, `$1    logo: '${logo}',\n`)
      }
    }

    result = result.slice(0, blockStart) + block + result.slice(blockEnd)
  }
  return result
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const src = fs.readFileSync(DATA_FILE, 'utf8')
  const clinics = parseClinics(src)

  const toScrape = clinics.filter(c => c.website && !c.imageUrl)
  console.log(`Total clinics: ${clinics.length}`)
  console.log(`With website, no imageUrl: ${toScrape.length}`)
  console.log(`Already have imageUrl: ${clinics.filter(c => c.imageUrl).length}`)
  console.log('─'.repeat(60))

  const updates = []
  let scraped = 0, found = 0, failed = 0

  for (const clinic of toScrape) {
    scraped++
    process.stdout.write(`[${scraped}/${toScrape.length}] ${clinic.id.slice(0, 50)}... `)

    const result = await firecrawlScrape(clinic.website)

    if (result.error || !result.success) {
      const errMsg = result.error || (result.data && result.data.warning) || 'failed'
      console.log(`❌ ${errMsg}`)
      failed++
    } else {
      const html = result.data?.html || result.data?.rawHtml || ''
      const { imageUrl, logo } = extractImages(html, clinic.website)

      if (imageUrl || logo) {
        found++
        console.log(`✅ img=${imageUrl ? '✓' : '✗'} logo=${logo ? '✓' : '✗'}`)
        updates.push({ id: clinic.id, imageUrl, logo })
      } else {
        console.log(`⚠️  no images found in response`)
        failed++
      }
    }

    if (scraped < toScrape.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log('─'.repeat(60))
  console.log(`Done: ${scraped} scraped | ${found} with images | ${failed} failed/empty`)

  if (updates.length > 0) {
    const updated = updateTsFile(src, updates)
    fs.writeFileSync(DATA_FILE, updated, 'utf8')
    console.log(`✅ Wrote ${updates.length} image updates to ${DATA_FILE}`)
  } else {
    console.log('⚠️  No updates to write')
  }

  // Write summary JSON for debugging
  const summaryPath = path.join(__dirname, '../data/image-scrape-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify({ scraped, found, failed, updates }, null, 2))
  console.log(`📝 Summary → ${summaryPath}`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
