import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { INFO_PAGE_META, infoContent } from '../src/infoContent.js'

const outputRoot = fileURLToPath(new URL('../docs/', import.meta.url))
const siteUrl = 'https://niji.mia-and-max.com'
const pages = infoContent['zh-Hant']

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderLinks(links = []) {
  if (!links.length) return ''
  return `<div class="resources" aria-label="相關連結">${links.map(({ label, href }) => `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}<span aria-hidden="true">↗</span></a>`).join('')}</div>`
}

function renderSection(section) {
  const paragraphs = (section.paragraphs ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
  const bullets = section.bullets?.length ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''
  return `<section><h2>${escapeHtml(section.title)}</h2>${paragraphs}${bullets}${renderLinks(section.links)}</section>`
}

function renderPage(key) {
  const page = pages[key]
  const canonical = `${siteUrl}/info/${key}/`
  const heading = escapeHtml(page.label).replaceAll('／', '&#8288;／<wbr>')
  const navigation = INFO_PAGE_META.map(({ key: navKey }) => {
    const current = navKey === key ? ' aria-current="page"' : ''
    return `<a href="../${navKey}/"${current}>${escapeHtml(pages[navKey].label)}</a>`
  }).join('')

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(page.summary)}" />
    <meta name="google-adsense-account" content="ca-pub-9186241112756787" />
    <meta name="theme-color" content="#fff9ff" />
    <meta property="og:title" content="${escapeHtml(page.label)}｜拾色日記" />
    <meta property="og:description" content="${escapeHtml(page.summary)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" href="../../logo.svg" type="image/svg+xml" />
    <title>${escapeHtml(page.label)}｜拾色日記 · Niji Diary</title>
    <style>
      :root { color-scheme: light; font-family: "Trebuchet MS", "Noto Sans TC", system-ui, sans-serif; color: #241435; background: #fff9ff; --ink: #241435; --pink: #ff4fa3; --cyan: #4ee8f5; --yellow: #ffd84d; --lime: #c9f65b; }
      * { box-sizing: border-box; }
      body { min-width: 320px; min-height: 100dvh; margin: 0; background: radial-gradient(circle at 8% 6%, #ffd8eb 0 8%, transparent 8.5%), radial-gradient(circle at 92% 30%, #d9fbff 0 10%, transparent 10.5%), #fff9ff; }
      a { color: inherit; } a:focus-visible { outline: 4px solid #6d40cc; outline-offset: 4px; }
      .skip { position: fixed; top: 12px; left: 12px; z-index: 10; padding: 11px 15px; border: 2px solid var(--ink); border-radius: 11px; background: white; font-size: 14px; font-weight: 900; transform: translateY(-170%); }.skip:focus { transform: none; }
      .site-header, main, footer { width: min(900px, calc(100% - 32px)); margin-inline: auto; }
      .site-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 22px 0; }
      .brand { display: inline-flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 900; text-decoration: none; }.brand img { width: 40px; height: 40px; }
      .play-link { min-height: 44px; display: inline-flex; align-items: center; padding: 9px 14px; border: 2px solid var(--ink); border-radius: 12px; background: var(--pink); box-shadow: 3px 3px 0 var(--ink); font-size: 13px; font-weight: 900; text-decoration: none; }
      main { padding: 30px 0 60px; }
      .hero { padding: clamp(26px, 6vw, 52px); border: 3px solid var(--ink); border-radius: 24px 24px 0 0; background: linear-gradient(130deg, #fff0fa, #d9fbff 58%, #f2ffd3); }
      .kicker { margin: 0 0 12px; color: #7037c7; font-size: 13px; font-weight: 900; letter-spacing: .13em; }.hero h1 { margin: 0; font-size: clamp(34px, 7vw, 54px); line-height: 1.08; letter-spacing: -.035em; text-wrap: balance; }.summary { margin: 17px 0 0; color: #4f3a60; font-size: 17px; font-weight: 700; line-height: 1.7; text-wrap: pretty; }.status { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; padding: 7px 11px; border: 2px solid var(--ink); border-radius: 999px; background: white; font-size: 13px; font-weight: 900; }.status::before { content: ""; width: 10px; height: 10px; border: 2px solid var(--ink); border-radius: 50%; background: var(--lime); }.updated { display: block; margin-top: 14px; color: #5b4968; font-size: 12px; font-weight: 800; }
      .article-body { padding: clamp(24px, 6vw, 52px); border: 3px solid var(--ink); border-top: 0; border-radius: 0 0 24px 24px; background: white; box-shadow: 8px 8px 0 var(--ink); }.article-body section + section { margin-top: 34px; padding-top: 30px; border-top: 2px dashed #cdbfda; }.article-body h2 { margin: 0 0 12px; font-size: 23px; line-height: 1.25; text-wrap: balance; }.article-body p, .article-body li { color: #463754; font-size: 16px; font-weight: 600; line-height: 1.75; text-wrap: pretty; }.article-body p { margin: 0; }.article-body p + p { margin-top: 12px; }.article-body ul { margin: 0; padding-left: 24px; }.article-body li + li { margin-top: 8px; }.article-body li::marker { color: #7037c7; }
      .resources { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }.resources a { min-height: 44px; display: inline-flex; align-items: center; gap: 7px; padding: 9px 12px; border: 2px solid var(--ink); border-radius: 12px; background: var(--yellow); box-shadow: 3px 3px 0 var(--ink); font-size: 13px; font-weight: 900; text-decoration: none; }
      .page-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; margin-top: 28px; }.page-nav a { min-height: 50px; display: flex; align-items: center; justify-content: center; padding: 8px 10px; border: 2px solid var(--ink); border-radius: 12px; background: white; box-shadow: 3px 3px 0 var(--ink); font-size: 12px; font-weight: 900; line-height: 1.35; text-align: center; text-decoration: none; }.page-nav a[aria-current="page"] { background: var(--cyan); }
      footer { padding: 28px 0 44px; border-top: 2px solid #cdbfda; color: #5b4968; font-size: 13px; line-height: 1.6; }
      @media (max-width: 620px) { .site-header, main, footer { width: min(100% - 24px, 900px); }.site-header { align-items: flex-start; }.hero { border-radius: 19px 19px 0 0; }.article-body { border-radius: 0 0 19px 19px; box-shadow: 5px 5px 0 var(--ink); }.page-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }.page-nav a { justify-content: flex-start; text-align: left; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
    </style>
  </head>
  <body>
    <a class="skip" href="#content">跳到主要內容</a>
    <header class="site-header"><a class="brand" href="../../"><img src="../../logo.svg" alt="" aria-hidden="true" />拾色日記</a><a class="play-link" href="../../#today">開始拾色</a></header>
    <main id="content">
      <article>
        <header class="hero"><p class="kicker">${escapeHtml(page.kicker)}</p><h1>${heading}</h1>${page.status ? `<strong class="status">${escapeHtml(page.status)}</strong>` : ''}<p class="summary">${escapeHtml(page.summary)}</p>${page.updated ? `<small class="updated">${escapeHtml(page.updated)}</small>` : ''}</header>
        <div class="article-body">${page.sections.map(renderSection).join('')}</div>
      </article>
      <nav class="page-nav" aria-label="網站資訊">${navigation}</nav>
    </main>
    <footer>© 2026 Mia & Max · <a href="https://mia-and-max.com/">回到 Mia & Max</a></footer>
  </body>
</html>
`
}

await Promise.all(INFO_PAGE_META.map(async ({ key }) => {
  const directory = `${outputRoot}info/${key}/`
  await mkdir(directory, { recursive: true })
  await writeFile(`${directory}index.html`, renderPage(key), 'utf8')
}))

const sitemapUrls = ['/', ...INFO_PAGE_META.map(({ key }) => `/info/${key}/`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((path) => `  <url><loc>${siteUrl}${path}</loc><lastmod>2026-08-15</lastmod></url>`).join('\n')}
</urlset>
`

await writeFile(`${outputRoot}sitemap.xml`, sitemap, 'utf8')
console.log(`Generated ${INFO_PAGE_META.length} static information pages and sitemap.xml.`)
