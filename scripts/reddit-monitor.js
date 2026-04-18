#!/usr/bin/env node
/**
 * T-21: Reddit monitoring agent for GlowRoute
 * Tracks medspa/aesthetic subreddits for leads, competitor signals, content ideas
 *
 * Usage:
 *   node scripts/reddit-monitor.js                        # all subreddits
 *   node scripts/reddit-monitor.js --subreddit medspa     # single sub
 *   node scripts/reddit-monitor.js --type lead_signal     # filter by type
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const FILTER_SUB  = args.includes('--subreddit') ? args[args.indexOf('--subreddit')+1] : null;
const FILTER_TYPE = args.includes('--type') ? args[args.indexOf('--type')+1] : null;

const SUBREDDITS = ['medspa','aesthetics','Semaglutide','Testosterone','Peptides','PlasticSurgery','smallbusiness','beauty'];

// Lead signal keywords — someone looking for a clinic or pricing
const LEAD_KEYWORDS = ['where can i','looking for','recommend','best medspa','best med spa','find a','how much does','cost of','price of','any good','anyone tried','suggestions for','near me','in [city]','book','consultation'];
// Competitor mentions
const COMPETITOR_KEYWORDS = ['yelp','zocdoc','healthgrades','realself','allergan','brilliant distinctions','aspire rewards','groupon','alle rewards','patientpop','podium'];
// Content idea keywords — educational questions
const CONTENT_KEYWORDS = ['what is','how does','does it work','is it safe','how long','what to expect','results','side effects','worth it','before and after','difference between','vs ','explain','help me understand'];

function classify(title, body) {
  const text = (title + ' ' + (body||'')).toLowerCase();
  if (LEAD_KEYWORDS.some(k => text.includes(k))) return 'lead_signal';
  if (COMPETITOR_KEYWORDS.some(k => text.includes(k))) return 'competitor_mention';
  if (CONTENT_KEYWORDS.some(k => text.includes(k))) return 'content_idea';
  return 'noise';
}

function fetchSubreddit(sub) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'www.reddit.com',
      path: `/r/${sub}/new.json?limit=25&t=week`,
      method: 'GET',
      headers: { 'User-Agent': 'GlowRoute-Monitor/1.0 (by /u/GlowRouteBot)' },
      timeout: 10000,
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const posts = (json?.data?.children || []).map(p => {
            const post = p.data;
            const type = classify(post.title, post.selftext);
            return {
              subreddit: sub,
              title: post.title,
              url: `https://reddit.com${post.permalink}`,
              score: post.score,
              comments: post.num_comments,
              created: new Date(post.created_utc * 1000).toISOString().slice(0,10),
              preview: (post.selftext || '').slice(0, 300).replace(/\n/g, ' '),
              type,
            };
          });
          resolve({ sub, posts, error: null });
        } catch (e) {
          resolve({ sub, posts: [], error: e.message });
        }
      });
    });
    req.on('error', e => resolve({ sub, posts: [], error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ sub, posts: [], error: 'timeout' }); });
    req.end();
  });
}

async function main() {
  const targets = FILTER_SUB ? [FILTER_SUB] : SUBREDDITS;
  console.log(`\n🔍 Reddit Monitor — GlowRoute`);
  console.log(`Subreddits: ${targets.join(', ')}\n`);

  const allPosts = [];
  const stats = { lead_signal: 0, competitor_mention: 0, content_idea: 0, noise: 0 };
  const errors = [];

  for (const sub of targets) {
    const { posts, error } = await fetchSubreddit(sub);
    if (error) { errors.push(`r/${sub}: ${error}`); console.log(`  ❌ r/${sub} — ${error}`); continue; }
    allPosts.push(...posts);
    const byType = posts.reduce((a,p) => { a[p.type]=(a[p.type]||0)+1; return a; }, {});
    posts.forEach(p => stats[p.type]++);
    console.log(`  ✅ r/${sub}: ${posts.length} posts | leads:${byType.lead_signal||0} competitors:${byType.competitor_mention||0} ideas:${byType.content_idea||0}`);
    await new Promise(r => setTimeout(r, 1000)); // be polite to Reddit
  }

  // Apply type filter if requested
  const filtered = FILTER_TYPE ? allPosts.filter(p => p.type === FILTER_TYPE) : allPosts;

  console.log('\n════════════════════════════════');
  console.log(`📊 Total posts: ${allPosts.length}`);
  console.log(`🎯 Lead signals:       ${stats.lead_signal}`);
  console.log(`🔍 Competitor mentions: ${stats.competitor_mention}`);
  console.log(`💡 Content ideas:      ${stats.content_idea}`);
  console.log(`🔇 Noise:              ${stats.noise}`);

  // Show top signals
  const leads = allPosts.filter(p => p.type === 'lead_signal').sort((a,b) => b.score - a.score).slice(0,5);
  const ideas = allPosts.filter(p => p.type === 'content_idea').sort((a,b) => b.score - a.score).slice(0,5);
  const competitors = allPosts.filter(p => p.type === 'competitor_mention').slice(0,3);

  if (leads.length) {
    console.log('\n🎯 TOP LEAD SIGNALS:');
    leads.forEach(p => console.log(`  [r/${p.subreddit}] "${p.title}" (↑${p.score}) ${p.url}`));
  }
  if (ideas.length) {
    console.log('\n💡 TOP CONTENT IDEAS:');
    ideas.forEach(p => console.log(`  [r/${p.subreddit}] "${p.title}" (↑${p.score})`));
  }
  if (competitors.length) {
    console.log('\n🔍 COMPETITOR MENTIONS:');
    competitors.forEach(p => console.log(`  [r/${p.subreddit}] "${p.title}" ${p.url}`));
  }

  // Save output
  const date = new Date().toISOString().slice(0,10);
  const outPath = path.join(__dirname, `../output/reddit-monitor-${date}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ date, stats, posts: filtered, errors }, null, 2));
  console.log(`\n📝 Saved: ${outPath}`);
  console.log('════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
