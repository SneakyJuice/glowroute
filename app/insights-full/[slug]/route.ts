import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { INSIGHTS } from '@/data/insights'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const insight = INSIGHTS.find(i => i.slug === params.slug)
  if (!insight?.contentFile) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const filePath = path.join(process.cwd(), 'content', 'insights', insight.contentFile)
    let html = fs.readFileSync(filePath, 'utf-8')

    // Inject share/download action bar after opening <body>
    const actionBar = `
<div style="position:fixed;bottom:0;left:0;right:0;z-index:999;background:rgba(26,26,46,0.97);backdrop-filter:blur(12px);border-top:1px solid rgba(212,168,83,0.25);padding:12px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
  <span style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-family:Inter,sans-serif;margin-right:8px;">The Glowing Q1 2026</span>
  <a href="javascript:window.print()" style="display:inline-flex;align-items:center;gap:6px;background:white;color:#0D0D0D;font-family:Inter,sans-serif;font-size:13px;font-weight:600;padding:8px 18px;border-radius:100px;text-decoration:none;">
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Download PDF
  </a>
  <a href="/insights/${params.slug}#share" style="display:inline-flex;align-items:center;gap:6px;background:#4A6741;color:white;font-family:Inter,sans-serif;font-size:13px;font-weight:600;padding:8px 18px;border-radius:100px;text-decoration:none;">
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Share Report
  </a>
  <a href="/insights" style="color:rgba(255,255,255,0.5);font-family:Inter,sans-serif;font-size:12px;text-decoration:none;margin-left:auto;">← Back to Intelligence</a>
</div>
<style>body { padding-bottom: 80px; } @media print { #gr-action-bar { display:none!important; } body { padding-bottom:0; } } </style>
`

    // Replace peptide card grid with proper table for better readability
    html = html.replace(
      /<div class="peptide-grid">([\s\S]*?)<\/div>\s*<p style="font-size:0\.78rem/,
      (match, cards) => {
        const rows: string[] = []
        const cardRegex = /<div class="peptide-card (returning|banned)"><strong>(.*?)<\/strong><div class="status">(.*?)<\/div><\/div>/g
        let m
        while ((m = cardRegex.exec(cards)) !== null) {
          const [, status, name, statusText] = m
          const color = status === 'returning' ? '#065F46' : '#991B1B'
          const bg = status === 'returning' ? '#ECFDF5' : '#FEF2F2'
          const dot = status === 'returning' ? '●' : '○'
          rows.push(`<tr><td style="font-weight:600;padding:10px 16px;border-bottom:1px solid #f0f0f0;">${name}</td><td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;"><span style="background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;">${dot} ${statusText}</span></td><td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:0.78rem;color:#6B7280;">${status === 'returning' ? '503A compounding authorized' : 'Compounding not permitted'}</td></tr>`)
        }
        return `<table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);margin:1.5rem 0;background:white;">
<thead><tr style="background:#0D0D0D;color:white;">
<th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Peptide</th>
<th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Status</th>
<th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Compounding Access</th>
</tr></thead>
<tbody>${rows.join('')}</tbody>
</table>
<p style="font-size:0\.78rem`
      }
    )

    // Inject numbered footnotes — find all external links and number them
    let footnoteCounter = 0
    const footnotes: { num: number; url: string; text: string }[] = []
    html = html.replace(/<a href="(https?:\/\/[^"]+)"[^>]*target="_blank"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
      footnoteCounter++
      footnotes.push({ num: footnoteCounter, url, text })
      return `${text}<sup style="font-size:0.65em;color:#C9A96E;font-weight:700;margin-left:1px;">[${footnoteCounter}]</sup>`
    })

    // Append footnotes section before the footer
    if (footnotes.length > 0) {
      const footnotesHtml = `
<div class="section" style="max-width:900px;margin:0 auto;padding:3rem 2rem 2rem;">
  <h3 style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6B7280;margin-bottom:1.5rem;border-bottom:2px solid #f0f0f0;padding-bottom:0.75rem;">References & Sources</h3>
  <ol style="padding-left:1.5rem;font-size:0.82rem;line-height:1.7;color:#6B7280;">
    ${footnotes.map(f => `<li style="margin-bottom:0.4rem;" id="fn${f.num}"><a href="${f.url}" target="_blank" rel="noopener" style="color:#4A6741;text-decoration:none;">${f.url}</a> — ${f.text}</li>`).join('')}
  </ol>
</div>`
      html = html.replace(/<footer class="footer">/, footnotesHtml + '\n<footer class="footer">')
    }

    // Fix the nav bar to link back to glowroute.io properly
    html = html.replace(
      /<nav class="nav-bar">/,
      `<nav class="nav-bar" id="gr-top-nav">`
    )

    // Inject action bar after opening body tag
    html = html.replace(/<body>/, `<body>${actionBar}`)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error(err)
    return new NextResponse('Error loading report', { status: 500 })
  }
}
