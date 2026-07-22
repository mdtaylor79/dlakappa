#!/usr/bin/env node
/**
 * Wix → DLA Blog Migration Script
 * --------------------------------
 * Fetches all posts from the Wix RSS feed, scrapes each post's
 * full content, and inserts them into your Supabase `posts` table.
 *
 * Requirements: Node.js 18+ (built-in fetch) — no extra packages needed.
 *
 * Usage:
 *   1. Open a terminal in this folder
 *   2. Run:  node migrate-wix-blog.js
 *   3. Watch the progress log — each post printed as ✓ inserted or ✗ failed
 *   4. Check dlakappa.org/blog/ when done
 */

const SUPABASE_URL = 'https://eithccduveikejdhvnmq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdGhjY2R1dmVpa2VqZGh2bm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4NTgwNiwiZXhwIjoyMDk5ODYxODA2fQ.q8HjsDknMaPvjmj4zkvdGeElilZ-s7Z3sJNPTwV7Wi0';

const RSS_BASE     = 'https://martaucydesigns.wixsite.com/website/blog-feed.xml';
const SITEMAP_URL  = 'https://martaucydesigns.wixsite.com/website/blog-posts-sitemap.xml';
const DELAY_MS = 1800; // pause between requests — avoids Wix rate limits

// ── Category mapping ────────────────────────────────────────────────────────
const CAT_MAP = {
  'DLA Kappas':        'news',
  'Kappa League News': 'guide-right',
  'News':              'news',
  'Event Recap':       'event-recap',
  'Member Spotlight':  'member-spotlight',
};

function mapCategory(wixCat) {
  return CAT_MAP[wixCat] || 'news';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripCdata(s) {
  if (!s) return '';
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? stripCdata(m[1]) : '';
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function slugFromUrl(url) {
  return url.split('/post/')[1]?.split('?')[0]?.split('#')[0] || '';
}

// ── RSS fetch & parse ────────────────────────────────────────────────────────
async function fetchRssPage(page) {
  const url = page === 1 ? RSS_BASE : `${RSS_BASE}?page=${page}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DLA-Migration/1.0)' }
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks) {
    items.push({
      title:      extractTag(block, 'title'),
      excerpt:    extractTag(block, 'description'),
      link:       extractTag(block, 'link'),
      slug:       slugFromUrl(extractTag(block, 'link')),
      category:   mapCategory(extractTag(block, 'category')),
      author:     extractTag(block, 'dc:creator') || 'DLA Chapter Administration',
      cover:      extractAttr(block, 'enclosure', 'url').replace(/\/fit\/.*$/, '/fit/w_1200,h_800,al_c,q_85/file.png'),
      published_at: new Date(extractTag(block, 'pubDate')).toISOString(),
    });
  }
  return items;
}

// Get all post URLs from sitemap (covers all 70+ posts)
async function fetchPostUrlsFromSitemap() {
  console.log('🗺  Fetching sitemap for all post URLs…');
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DLA-Migration/1.0)' }
    });
    const xml = await res.text();

    // Parse each <url> block to get loc + optional image
    const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
    const entries = urlBlocks.map(block => {
      const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
      const imgMatch = block.match(/<image:loc>([^<]+)<\/image:loc>/);
      const url = locMatch ? locMatch[1].trim() : null;
      const img = imgMatch ? imgMatch[1].trim() : null;
      return url && url.includes('/post/') ? { url, img } : null;
    }).filter(Boolean);

    console.log(`   Found ${entries.length} post URLs in sitemap\n`);
    return entries;
  } catch (e) {
    console.error('Sitemap error:', e.message);
    return [];
  }
}

// Build RSS metadata index (title, excerpt, cover, category, author, date)
async function fetchRssMeta() {
  const meta = {};
  let page = 1;
  const seen = new Set();
  while (true) {
    const items = await fetchRssPage(page);
    if (!items.length) break;
    const newItems = items.filter(p => p.slug && !seen.has(p.slug));
    if (!newItems.length) break;
    newItems.forEach(p => { seen.add(p.slug); meta[p.slug] = p; });
    page++;
    await sleep(500);
  }
  return meta;
}

async function fetchAllPosts() {
  // Get full URL list from sitemap (returns [{url, img}])
  const urls = await fetchPostUrlsFromSitemap();

  // Get metadata (title, excerpt, cover, category etc) from RSS
  console.log('📡 Fetching RSS metadata…');
  const rssMeta = await fetchRssMeta();
  console.log(`   RSS metadata: ${Object.keys(rssMeta).length} posts indexed\n`);

  // Build combined post list
  const posts = urls.map(({ url, img }) => {
    const slug = slugFromUrl(url);
    const meta = rssMeta[slug] || {};
    return {
      title:       meta.title || slug,
      excerpt:     meta.excerpt || '',
      link:        url,
      slug,
      category:    meta.category || 'news',
      author:      meta.author || 'DLA Chapter Administration',
      cover:       meta.cover || img || null,  // RSS cover first, sitemap image as fallback
      published_at: meta.published_at || new Date().toISOString(),
    };
  }).filter(p => p.slug);

  // Deduplicate
  const unique = [...new Map(posts.map(p => [p.slug, p])).values()];
  console.log(`Total: ${unique.length} unique posts to migrate\n`);
  return unique;
}

// ── Wix post content scraper ─────────────────────────────────────────────────
async function fetchPostContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Wix renders blog content server-side inside JSON state — extract it
    // Try window.__FEDOPS_LOGGER__ or wix-blog structured data first
    const jsonMatch = html.match(/"content"\s*:\s*\{"blocks":([\s\S]{50,10000}?),"entityMap"/);
    if (jsonMatch) {
      return convertDraftJsToHtml(jsonMatch[0]);
    }

    // Fallback: grab visible text from <article> or main content divs
    let content = '';
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      content = articleMatch[1];
    } else {
      // Try common Wix content hooks
      const hooks = ['post-description', 'post-content', 'rich-content-viewer'];
      for (const hook of hooks) {
        const m = html.match(new RegExp(`data-hook="${hook}"[^>]*>([\\s\\S]*?)</div>`, 'i'));
        if (m) { content = m[1]; break; }
      }
    }

    if (content) {
      // Strip Wix-specific attributes, keep semantic HTML
      return cleanWixHtml(content);
    }
    return null;
  } catch {
    return null;
  }
}

function convertDraftJsToHtml(json) {
  // Very light Draft.js → HTML converter for Wix content
  try {
    const parsed = JSON.parse(`{${json}}`);
    const blocks = parsed.blocks || [];
    return blocks.map(b => {
      const text = b.text || '';
      switch (b.type) {
        case 'header-one':   return `<h2>${text}</h2>`;
        case 'header-two':   return `<h2>${text}</h2>`;
        case 'header-three': return `<h3>${text}</h3>`;
        case 'blockquote':   return `<blockquote>${text}</blockquote>`;
        case 'unordered-list-item': return `<li>${text}</li>`;
        case 'ordered-list-item':   return `<li>${text}</li>`;
        default:             return text ? `<p>${text}</p>` : '';
      }
    }).join('\n');
  } catch {
    return null;
  }
}

function cleanWixHtml(raw) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s*data-[\w-]+=["'][^"']*["']/g, '')
    .replace(/\s*class="[^"]*wix[^"]*"/gi, '')
    .replace(/\s*id="[^"]*"/g, '')
    .replace(/<(div|span)(\s[^>]*)?>/gi, '')
    .replace(/<\/(div|span)>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Supabase insert ──────────────────────────────────────────────────────────
async function insertPost(post) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      'apikey':       SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer':       'return=minimal',
    },
    body: JSON.stringify(post),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Wix → DLA Blog Migration');
  console.log('═══════════════════════════════════════════════\n');

  const posts = await fetchAllPosts();
  let inserted = 0, skipped = 0, failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    process.stdout.write(`[${i + 1}/${posts.length}] ${p.title.slice(0, 55)}… `);

    // Skip posts with no valid slug
    if (!p.slug) {
      console.log('✗ no slug, skipped');
      skipped++;
      continue;
    }

    // Fetch full content from post page
    let content = null;
    if (p.link) {
      content = await fetchPostContent(p.link);
      await sleep(DELAY_MS);
    }

    // Fall back to excerpt wrapped in <p> if scrape fails
    if (!content || content.length < 30) {
      content = `<p>${p.excerpt}</p>`;
    }

    const record = {
      title:          p.title,
      slug:           p.slug,
      excerpt:        p.excerpt.slice(0, 300) || null,
      content:        content,
      cover_image:    p.cover || null,
      category:       p.category,
      author:         p.author,
      is_members_only: false,
      published:      true,
      published_at:   p.published_at,
    };

    try {
      await insertPost(record);
      console.log('✓');
      inserted++;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        console.log('⟳ already exists, skipped');
        skipped++;
      } else {
        console.log(`✗ ${msg.slice(0, 80)}`);
        failed++;
      }
    }

    await sleep(300); // small pause between Supabase inserts
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Done!  ✓ ${inserted} inserted  ⟳ ${skipped} skipped  ✗ ${failed} failed`);
  console.log('  Visit https://dlakappa.org/blog/ to see your posts.');
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
