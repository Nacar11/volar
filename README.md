# Volar

An installable, offline-first web app (PWA) for kids in grades 1–3. A spinning
cartoon globe is the whole home screen: rotate it, spot the glowing animal
icons where each animal lives, and tap one to fly into an animated scene full
of facts and playful trivia toys. No quizzes, no scores, no failure states —
every tap rewards curiosity.

**Status:** Phase 1 done: a spinning cartoon globe with all 34 animals pinned
on it. Two are playable, the Philippine tarsier and the scarlet macaw; the
rest are "coming soon" pins. Phase 2 (offline mode and the Animal Book) is
next. See [`docs/plan.md`](docs/plan.md).

## Run it

```sh
npm install
npm run dev            # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Validates every animal pack, then builds the static SPA into `build/` |
| `npm run validate` | Content checks only (schema, files, credits, rig parts, habitats, sounds, 12-word lines, 800 KB budget) |
| `npm run build:audio` | Cuts, levels and encodes each animal's sound sprite from `art-source/audio/` |
| `npm run bake:globe` | Redraws the globe texture from Natural Earth |
| `npm run check` | Svelte + TypeScript type check |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | Browser tests against a production build (Playwright, tablet + phone) |

**Scene previewer (dev only):** `/dev/<animal-id>`, e.g.
`/dev/philippine-tarsier`, plays any rig state on demand and shows live fps.

## How an animal is put together

```
content/animals/<animal-id>/
├─ animal.json     # facts, toys, rig, sources — validated by src/lib/content/schema.ts
├─ puppet.svg      # flat SVG with named part ids the rig animates
├─ icon.svg
├─ bg-far.svg, bg-mid.svg, bg-near.svg   # parallax layers
├─ regions.geojson # its habitat on the globe (optional)
├─ audio.webm, audio.m4a, audio.json     # sound sprite (optional; npm run build:audio)
└─ credits.json    # source and license of every file
```

- **Rigs** (`src/lib/scene/rigs.ts`) list the part ids and actions a body type
  provides; the motion template (`src/lib/scene/motions/<rig>.ts`) animates
  them with GSAP on top of the shared idle/blink/action core (`core.ts`).
  Built so far: `mammal-small` (tarsier) and `bird` (macaw).
- **Sounds:** a "Hear it" clip plays along with the rig action of the same name
  (the macaw's `squawk`), if there is one.
- **Animals without a pack** are listed in `content/planned/planned.json` and
  show as greyed pins; delete an entry when its pack lands.
- **Toys** live in `src/lib/toys/`, one component each.
- Parts styled `opacity: var(--xray-hide, 1)` (like eyelids) vanish under the
  x-ray lens.

## Phase 0 results

| Budget | Target | Measured |
| --- | --- | --- |
| Tarsier pack | 300–800 KB | 9 KB (no audio yet) |
| First load (app shell, gzipped) | < 3 MB | ~100 KB JS/CSS + 38 KB fonts |
| Frame rate | ≥ 30 fps | 60 fps in Chromium at 4× CPU throttle |

Still to confirm on real hardware: a budget Android phone, an older Windows
laptop and an iPad (only the laptop is available for now). Not yet in the
pack: an animal sound (needs a CC0 recording), and a teacher's review of the
facts.

## License

[MIT](LICENSE), for the code and Volar's original art. Third-party files keep
their own licenses, logged in each animal's `credits.json`.
