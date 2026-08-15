export const TAB_KEYS = Object.freeze(['today', 'archive', 'films', 'settings'])
export const INFO_PAGE_KEYS = Object.freeze(['about', 'guide', 'privacy', 'terms', 'contact', 'ads'])

export function parseAppHash(hash = '') {
  const value = String(hash).replace(/^#/, '')
  if (TAB_KEYS.includes(value)) return { tab: value, infoPage: null }

  const [namespace, page] = value.split('/')
  if (namespace === 'info' && INFO_PAGE_KEYS.includes(page)) {
    return { tab: 'settings', infoPage: page }
  }

  return { tab: 'today', infoPage: null }
}

export function infoHash(page) {
  return INFO_PAGE_KEYS.includes(page) ? `info/${page}` : 'settings'
}
