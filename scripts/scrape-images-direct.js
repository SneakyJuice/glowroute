#!/usr/bin/env node
/**
 * GlowRoute — Direct HTTP image scraping (no Firecrawl)
 * Fetches clinic homepages directly, extracts og:image + logo
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const { URL } = require('url')

const DATA_FILE = path.join(__dirname, '../data/tampa-clinics.ts')
const DELAY_MS = 1500
const TIMEOUT_MS = 12000

// ── Parse clinic websites from .ts file ──────────────────────────────────────
function parseClinics(src) {
  const clinics = []
  const lines = src.split('\n')
  let current = null

  for (const line of lines) {
    const idMatch = line.match(/^\s+id:\s*['"]([^'"]+)['"]/)
    if (idMatch) { current = { id: idMatch[1], website: null, imageUrl: null, logo: null } }

    const websiteMatch = line.match(/^\s+website:\s*['"]([^'"]+)['"]/)
    if (websiteMatch && current) current.website = websiteMatch[1]

    const imageMatch = line.match(/^\s+imageUrl:\s*['"]([^'"]+)['"]/)
    if (imageMatch && current) current.imageUrl = imageMatch[1]

    const logoMatch = line.match(/^\s+logo:\s*['"]([^'"]+)['"]/)
    if (logoMatch && current) current.logo = logoMatch[1]

    if (line.match(/^\s+\},?$/) && current?.id) {
      clinics.push({ ...current })
      current = null
    }
  }
  return clinics
}

// ── Fetch URL with redirect following ────────────────────────────────────────
function fetchHtml(urlStr, redirectCount = 0) {
  return new Promise((resolve) => {
    if (redirectCount > 4) return resolve(null)
    let parsed
    try { parsed = new URL(urlStr) } catch { return resolve(null) }

    const lib = parsed.protocol === 'https:' ? https : http
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GlowRouteBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: TIMEOUT_MS,
    }

    const req = lib.request(options, (res) => {
      // Follow redirects
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        let loc = res.headers.location
        if (loc.startsWith('/')) loc = `${parsed.protocol}//${parsed.hostname}${loc}`
        res.resume()
        return resolve(fetchHtml(loc, redirectCount + 1))
      }

      if (res.statusCode !== 200) {
        res.resume()
        return resolve({ status: res.statusCode, html: null })
      }

      // Only read first 80KB — enough for <head> tags
      let data = ''
      let size = 0
      res.on('data', (chunk) => {
        size += chunk.length
        data += chunk.toString()
        if (size > 80000) res.destroy()
      })
      res.on('end', () => resolve({ status: res.statusCode, html: data }))
      res.on('close', () => resolve({ status: res.statusCode, html: data }))
    })

    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.end()
  })
}

// ── Extract images from HTML ──────────────────────────────────────────────────
function extractImages(html, siteUrl) {
  if (!html) return { imageUrl: null, logo: null }

  let base
  try { base = new URL(siteUrl) } catch { return { imageUrl: null, logo: null } }

  const resolve = (url) => {
    if (!url || url.startsWith('data:')) return null
    try {
      if (url.startsWith('//')) return 'https:' + url
      if (url.startsWith('/')) return base.origin + url
      if (url.startsWith('http')) return url
      return null
    } catch { return null }
  }

  const isUsable = (url) => {
    if (!url) return false
    const lower = url.toLowerCase()
    // Skip tiny tracking pixels
    if (/1x1|pixel|spacer|blank|tracking|analytics/.test(lower)) return false
    // Skip icon-sized images
    if (/favicon|icon-\d+x\d+/.test(lower)) return false
    // Prefer actual image extensions or known CDN patterns
    return true
  }

  // 1. og:image (highest confidence)
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  const ogImage = ogMatch ? resolve(ogMatch[1]) : null

  // 2. twitter:image
  const twMatch = html.match(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image["']/i)
  const twitterImage = twMatch ? resolve(twMatch[1]) : null

  // 3. logo img
  const logoPatterns = [
    /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']*logo[^"']*)["']/i,
    /<img[^>]+id=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
  ]
  let logoImg = null
  for (const pattern of logoPatterns) {
    const m = html.match(pattern)
    if (m) { logoImg = resolve(m[1]); if (logoImg) break }
  }

  // 4. hero/banner image
  const heroPatterns = [
    /<img[^>]+class=["'][^"']*(?:hero|banner|header-img|bg-img|featured)[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<source[^>]+srcset=["']([^"']+\.(?:jpg|jpeg|webp|png))[^"']*["'][^>]*>/i,
  ]
  let heroImg = null
  for (const pattern of heroPatterns) {
    const m = html.match(pattern)
    if (m) {
      const candidate = resolve(m[1].split(',')[0].trim().split(' ')[0])
      if (candidate && isUsable(candidate)) { heroImg = candidate; break }
    }
  }

  const imageUrl = (isUsable(ogImage) ? ogImage : null)
    || (isUsable(twitterImage) ? twitterImage : null)
    || (isUsable(heroImg) ? heroImg : null)

  return { imageUrl, logo: isUsable(logoImg) ? logoImg : null }
}

// ── Patch .ts file with scraped values ───────────────────────────────────────
function patchTsFile(src, updates) {
  let result = src
  for (const { id, imageUrl, logo } of updates) {
    if (!imageUrl && !logo) continue

    const escapedId = id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const idIdx = result.indexOf(`id: '${id}'`)
    if (idIdx === -1) continue

    const blockEnd = result.indexOf('\n  },', idIdx)
    if (blockEnd === -1) continue

    let block = result.slice(idIdx, blockEnd)

    if (imageUrl) {
      if (/imageUrl:/.test(block)) {
        block = block.replace(/imageUrl:\s*'[^']*'/, `imageUrl: '${imageUrl}'`)
      } else {
        // Insert before 'verified:' line
        block = block.replace(/(\s+verified:)/, `\n    imageUrl: '${imageUrl}',$1`)
      }
    }

    if (logo) {
      if (/\blogo:/.test(block)) {
        block = block.replace(/logo:\s*'[^']*'/, `logo: '${logo}'`)
      } else if (imageUrl && /imageUrl:/.test(block)) {
        block = block.replace(/(imageUrl:\s*'[^']*',)/, `$1\n    logo: '${logo}',`)
      } else {
        block = block.replace(/(\s+verified:)/, `\n    logo: '${logo}',$1`)
      }
    }

    result = result.slice(0, idIdx) + block + result.slice(blockEnd)
  }
  return result
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const src = fs.readFileSync(DATA_FILE, 'utf8')
  const clinics = parseClinics(src)

  const toScrape = clinics.filter(c => c.website && !c.imageUrl)
  console.log(`Total clinics parsed: ${clinics.length}`)
  console.log(`Need scraping (website, no imageUrl): ${toScrape.length}`)
  console.log(`Already have imageUrl: ${clinics.filter(c => c.imageUrl).length}`)
  console.log('─'.repeat(65))

  const updates = []
  let found = 0, failed = 0

  for (let i = 0; i < toScrape.length; i++) {
    const clinic = toScrape[i]
    process.stdout.write(`[${i+1}/${toScrape.length}] ${clinic.website.slice(0, 55).padEnd(55)} `)

    const res = await fetchHtml(clinic.website)

    if (!res || !res.html) {
      console.log(`❌ no response (${res ? res.status : 'timeout'})`)
      failed++
    } else {
      const { imageUrl, logo } = extractImages(res.html, clinic.website)
      if (imageUrl || logo) {
        found++
        console.log(`✅ img=${imageUrl ? '✓' : '✗'} logo=${logo ? '✓' : '✗'}`)
        updates.push({ id: clinic.id, imageUrl, logo })
      } else {
        console.log(`⚠️  no images in HTML`)
        failed++
      }
    }

    if (i < toScrape.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log('─'.repeat(65))
  console.log(`✅ ${found} images found | ❌ ${failed} failed/empty | ${toScrape.length} total scraped`)

  if (updates.length > 0) {
    const patched = patchTsFile(src, updates)
    fs.writeFileSync(DATA_FILE, patched, 'utf8')
    console.log(`\n💾 Wrote ${updates.length} updates to ${DATA_FILE}`)
  } else {
    console.log('\n⚠️  No updates to write')
  }

  // Write summary
  const summaryPath = path.join(__dirname, '../data/image-scrape-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify({
    scraped: toScrape.length, found, failed,
    updates: updates.map(u => ({ id: u.id, imageUrl: u.imageUrl, logo: u.logo }))
  }, null, 2))
  console.log(`📝 Summary → ${summaryPath}`)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
