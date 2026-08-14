import assert from 'node:assert/strict'
import { DEFAULT_FILM_ID, FILMS } from '../src/films.js'
import { createFilmSurfaceSvg, getFilmRenderModel, getPolaroidLayoutStyle, POLAROID_LAYOUT } from '../src/filmRendering.js'

assert.equal(POLAROID_LAYOUT.width / POLAROID_LAYOUT.height, 2 / 3)
assert.equal(POLAROID_LAYOUT.photo.width / POLAROID_LAYOUT.photo.height, 4 / 5)
assert.equal(POLAROID_LAYOUT.sources.y, POLAROID_LAYOUT.photo.y + POLAROID_LAYOUT.photo.height + 24)

const layoutStyle = getPolaroidLayoutStyle()
assert.equal(layoutStyle['--polaroid-photo-x'], '3.5cqw')
assert.equal(layoutStyle['--polaroid-source-height'], '11.5cqw')
assert.equal(layoutStyle['--polaroid-footer-x'], '5%')

for (const film of FILMS) {
  const model = getFilmRenderModel(film.id)
  assert.equal(model.film, film)
  assert.equal(model.layout, POLAROID_LAYOUT)
  assert.equal(model, getFilmRenderModel(film.id), `${film.id} should reuse one immutable render model`)
  assert.equal(model.surfaceUrl.startsWith('data:image/svg+xml;charset=UTF-8,'), true)
  assert.equal(decodeURIComponent(model.surfaceUrl.split(',')[1]), model.svg)
  assert.equal(model.svg, createFilmSurfaceSvg(film.id))
  assert.match(model.svg, /viewBox="0 0 1000 1500"/)
}

const skySurface = getFilmRenderModel('sky-blue').svg
assert.equal((skySurface.match(/<circle /g) ?? []).length, 6)
assert.equal(skySurface.includes('<ellipse'), false, 'sky-blue circles must stay circles at every render size')
assert.equal(getFilmRenderModel('missing-film').film.id, DEFAULT_FILM_ID)

console.log('Film rendering: previews, studio, and exports share one immutable 2:3 SVG surface and layout contract.')
