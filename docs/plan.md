# Volar – Final Plan

Oct 28, 2026 · @dale

## Concept and the kid's journey

An installable, offline-first web app (PWA) where a spinning cartoon globe is the whole home screen. Kids rotate it, spot glowing animal icons where each animal lives, and tap one to fly into an animated scene full of facts and playful trivia. There are no quizzes, scores or failure states: every tap rewards curiosity.

App name: **Volar**. Audience: grades 1–3 (about ages 6–9). Language: English only. Text is short, easy-to-read dialogue; no voice narration at launch.

The core loop:

1. **Globe home.** The globe slowly auto-spins. Animal icons bob above their regions; habitat areas glow softly.
2. **Explore.** The kid drags to rotate and pinches to zoom. Icons grow and wiggle as they face the camera.
3. **Tap an animal.** Its habitat lights up, the camera flies to it, and the view zooms through the clouds into the animal's scene.
4. **Animal scene.** The animal makes a big entrance (the panda tumbles in, the whale breaches). A speech bubble says hello.
5. **Play with trivia.** Fact bubbles and interactive trivia toys appear one at a time (see *Animal scenes and interactive trivia*).
6. **Collect it.** Visiting an animal adds a sticker to the kid's **Animal Book**.
7. **Back to the globe**, or tap **Surprise Me** to spin the globe and land on a random animal.

Supporting extras: continent and habitat filters (ocean, jungle, desert, polar, grassland), a day/night globe toggle that reveals nocturnal animals, and sound on/off.

## Tech stack

The stack is Vite + Svelte + Three.js for the globe, and GSAP to animate SVG animal puppets and choreograph everything, packaged as an offline PWA.

| Layer | Choice | Why |
| --- | --- | --- |
| Build tool | Vite + TypeScript | Fast dev server, first-class PWA plugin, typed content schema |
| UI framework | Svelte (SvelteKit in static/SPA mode) | Small bundles and low overhead; matters on old school PCs and budget Android tablets |
| 3D globe | Three.js via Threlte (Svelte bindings) | Full control over a stylized, cartoon globe; touch rotate/zoom with OrbitControls |
| Map data | Natural Earth land outlines (public domain), simplified | Draw continents in a cartoon style; tiny file size |
| Habitat regions | Hand-simplified GeoJSON polygons per animal | Kid-readable blobs, not scientific range maps |
| Character animation | SVG puppets animated with GSAP | Tiny files, any state you code (idle, eat, sleep, react to tap), 100% free |
| Simpler/one-off animation | Lottie (lottie-web light player) | Scavenged effects and transitions, edited in Glaxnimate |
| Choreography | GSAP | Camera fly-to, scene transitions, staggered fact-bubble entrances |
| Scene backgrounds | Layered SVG with parallax | Crisp at any size, cheap to render |
| Physics toys (optional) | Matter.js | A few trivia toys (e.g. drop a feather vs a rock, size stacking) |
| Audio | Howler.js | Animal sounds and UI pops (no narration); audio sprites keep files small |
| Local data | Dexie.js (IndexedDB) | Animal Book stickers, settings, downloaded packs; no account needed |
| Offline/PWA | SvelteKit's native service worker | Precache, per-animal pack caches, install manifest, update prompts; `$app/manifest` already lists every built file, so no plugin is needed |
| i18n | One English JSON strings file | English only; all text in one place makes reading-level edits easy |
| Hosting | Cloudflare Pages (or Netlify/GitHub Pages) | Free, global CDN, easy deploys from Git |
| Wrappers (later) | Capacitor (Android/iOS), Tauri (desktop installer) | Same code, store or USB-stick distribution |

If you'd rather use React, swap Svelte for React and Threlte for React Three Fiber; everything else stays the same.

## The globe

The globe is a stylized cartoon planet, not a satellite map: chunky continents, a bright ocean, puffy clouds and animal icons a child can hit with a thumb.

**Look**

- Continents drawn from simplified Natural Earth outlines, baked into a 2048×1024 texture (1024×512 on low-end devices), with a soft toon shader and a thin outline.
- A slowly drifting cloud layer, a faint atmosphere glow, and stars in the background.
- Ocean animals sit on the water with a gentle ripple ring; polar animals sit on the ice caps.

**Controls**

- Drag to rotate with momentum (damping), pinch or scroll to zoom between fixed limits, tap to select.
- Auto-spin after 6 seconds idle; stops instantly on touch.
- Vertical tilt clamped so kids never get lost upside down.
- A big "Home" button re-centers the globe.

**Animal icons**

- Each animal is a round billboard icon (always faces the camera) placed at its habitat's center point.
- Icons on the far side fade out; nearby icons spread apart so they never overlap (simple screen-space collision nudge).
- Icons idle-bob and occasionally do a tiny wiggle to invite taps. Visited animals get a small star badge.

**Habitat highlights**

- Each animal has one or more simplified habitat polygons (GeoJSON), drawn as a glowing, slightly raised overlay in the animal's theme color.
- Hovering or tapping an icon pulses its habitat; filters (e.g. "Jungle") light up all matching habitats at once.
- Migratory animals (whales, monarch butterflies, sea turtles) get an animated dotted migration path.

**Tap → scene transition**

1. GSAP tweens the camera to face the animal's region and zooms in (about 1.2 s).
2. A cloud-burst transition covers the screen.
3. The globe stops rendering (saves battery) and the animal scene loads behind the clouds.
4. Clouds part to reveal the scene. Going back plays the reverse.

**Fallback:** if WebGL is unavailable, show a flat, sideways-scrolling 2D world map with the same pins and habitats. It is the globe's own baked texture laid flat (it is already equirectangular), so it needs no extra map library and looks the same.

## Animal scenes and interactive trivia

Every animal scene follows the same template so content scales: an entrance, a living animal you can poke, a stream of fact bubbles, and two or three trivia toys.

**Scene layout**

- Full-screen habitat background (layered SVG, parallax on drag or device tilt).
- The animal center stage as an SVG puppet animated with GSAP, with states: entrance, idle, 2–4 signature actions, react-to-tap, exit.
- A name banner with the animal's name, where it lives, and a tiny globe showing its region.
- Fact bubbles appear as short dialogue from the animal, one at a time; tap "next" to continue.
- A toy shelf along the bottom with the trivia toys for that animal.

**Trivia toys (no quizzes, no scores)**

| Toy | What the kid does | Example |
| --- | --- | --- |
| Tap-to-reveal | Taps a mystery card or egg; it cracks open with a surprising fact | "A group of flamingos is called a flamboyance" |
| Size compare | Drags a slider to stand a kid, a school bus, or a house next to the animal | Blue whale vs three buses end to end |
| Make it do it | Taps action buttons that play the animal's actions | Make the kangaroo hop, the chameleon change color |
| Hear it | Plays the animal's real call or sound | Lion roar, humpback song |
| Speed race | Watches the animal race a kid, a bicycle, or a car | Cheetah vs car; sloth vs snail |
| Day or night | Flips a toggle to see when the animal is awake | Tarsier wakes up at night |
| What's for dinner | Drags food items to the animal; it munches the right ones and politely refuses the rest | Panda eats bamboo, ignores the burger |
| Body x-ray | Slides a magnifier over the animal to see a hidden feature | Giraffe's long tongue, owl's huge eyes |
| Then vs now | Swipes to compare with an ancestor or baby form | Tadpole to frog; baby to adult turtle |

Each animal uses 2–3 toys that fit it best, not all of them. The "What's for dinner" toy has no wrong-answer buzzer; the animal just shakes its head and keeps playing.

**Fact writing rules**

- One short sentence per bubble (about 12 words max), using words a grade 1–3 reader knows.
- Each animal gets 5–8 facts: where it lives, what it eats, a body superpower, a baby fact, a record or "wow" fact, and one conservation fact told hopefully.
- Dialogue style: the animal speaks in first person ("I sleep most of the day!"), with a small picture hint beside tricky words, in Andika, a free font made for beginning readers (24 px or more).

## Animation pipeline

Animation is the biggest cost in this project, so lock one art style early and produce every animal through the same repeatable pipeline.

**Art style guide (decide once, before animal #2)**

- The Fluent Emoji Flat look: flat, rounded shapes, no outlines, a limited palette per habitat. Every self-drawn animal copies it so scavenged and new art blend.
- Animals recognizable but friendly (no scary teeth close-ups); realistic proportions where size facts matter.
- One shared puppet template (rig) per body type to reuse parts and states. The eight rigs: `mammal-small`, `quadruped`, `climber`, `bird`, `fish`, `sea-mammal`, `reptile-amphibian`, `insect`.

**Per-animal production checklist**

1. Research and write the facts and dialogue lines first, so animation serves the facts.
2. Grab the animal's Fluent Emoji Flat SVG; if there is none, draw it in the same style, tracing a CC0 PhyloPic silhouette for correct proportions.
3. In Inkscape, split the SVG into named parts and save as `puppet.svg` (see the puppet recipe below).
4. Animate in code with GSAP using the body-type template: entrance, idle loop, 2–4 actions, tap reaction, exit.
5. Build the habitat background as 3–4 parallax SVG layers from Fluent plants, rocks and clouds plus simple shapes.
6. Find a CC0 animal sound and log every file in `credits.json`.
7. Export: `puppet.svg`, background SVGs, audio sprite, and the JSON entry.
8. Test on a low-end phone; keep the animal pack under the size budget.

**Motion rules**

- Everything bounces or eases; nothing pops in linearly.
- Idle animation never stops (breathing, blinking, tail flicks) so the animal feels alive.
- One focus at a time: when a fact bubble appears, the animal calms to idle.
- Respect reduced motion: swap big camera moves for fades and slow the idle loops.

**Tooling for scale**

- A puppet template per body type: shared part names plus reusable GSAP motion presets.
- A scene previewer page in the app (dev-only) that loads any animal JSON so artists can check timing without clicking through the globe.

## $0 asset plan: what to scavenge

Everything Volar needs can be gathered for free: one MIT-licensed emoji set is the base art for every animal, free code animates it, and CC0 libraries cover sounds. Rive is out of the plan: since October 2025 its free plan no longer exports files you make; shipping needs a $9/month plan ([Rive blog](https://rive.app/blog/rive-s-new-9-mo-plan)).

| Need | Free source | License | How Volar uses it |
| --- | --- | --- | --- |
| Animal art (the house style) | [Fluent Emoji Flat](https://allsvgicons.com/pack/fluent-emoji-flat/), from Microsoft's fluentui-emoji repo on GitHub | MIT (include the license notice) | 3,145 flat SVGs; most of the 34 animals have one. Split into parts and animate |
| Shape references for missing animals | [PhyloPic](https://www.phylopic.org/articles/image-usage) silhouettes | Filter to CC0 / Public Domain Mark | Trace correct body shapes (tarsier, platypus, narwhal), then color in the Fluent style |
| Extra 2D animals | [Kenney Animal Pack](https://opengameart.org/content/animal-pack) | CC0 | 10 animals in 8 styles; placeholders and Animal Book stickers |
| UI reactions (stars, hearts, confetti) | Noto Animated Emoji | CC BY 4.0 (credit Google) | Ready-made Lottie; use for UI only so animal styles never clash |
| Ambient effects | LottieFiles free animations | Lottie Simple License | Bubbles, leaves, sparkles; edit colors in Glaxnimate |
| Animation code | [GSAP](https://www.gsap.com/pricing/) | Free, all plugins, commercial use allowed | Puppets, scene choreography, MorphSVG, MotionPath, Draggable for toys |
| Animation editor | [Glaxnimate](https://flathub.org/apps/org.mattbas.Glaxnimate) | GPL v3 (the tool only; your files are yours) | Open-source Lottie editor: imports SVG, tweening, bitmap tracing |
| Vector editing | Inkscape | GPL (the tool only) | Split emoji SVGs into named parts |
| Font | [Andika](<https://en.wikipedia.org/wiki/Andika_(typeface)>) (on Google Fonts) | SIL Open Font License | Designed for beginning readers |
| Animal sounds | [OpenGameArt](https://opengameart.org/content/penguin-sounds), [BigSoundBank](https://bigsoundbank.com/tawny-owl-3-s3459.html), Freesound with the CC0 filter | CC0 | Real calls and cries per animal |
| Globe map | Natural Earth | Public domain | Continent outlines (already in the plan) |

**Emoji coverage for the 34 animals**

- **Ready to use:** scarlet macaw (parrot), lion, African and Asian elephant, giraffe, hippo, tiger, giant panda, orangutan, sloth, kangaroo, koala, polar bear, penguin, bison, fox, hedgehog, butterfly, turtle, whale, bear, eagle.
- **Adapt a close emoji:** tamaraw (from water buffalo), Philippine eagle (eagle), jaguar (leopard), chameleon (lizard), poison dart frog (frog), clownfish (tropical fish).
- **Draw from scratch in the same style:** Philippine tarsier, platypus, narwhal, Atlantic puffin, toco toucan, whale shark.

**The puppet recipe (replaces Rive)**

1. Open the animal's flat SVG in Inkscape and group its parts: body, head, eyes, each leg, tail. Give each group an id (`body`, `head`, `eye-l`…) and save as `puppet.svg`.
2. Volar inlines the SVG and a `Puppet` Svelte component finds the parts by id.
3. GSAP timelines play the states: entrance, idle (breathing, blinking), 2–4 actions, tap reaction, exit.
4. Each of the eight body-type rigs gets a motion template, so a new animal mostly reuses existing timelines.

**License rules**

- Prefer CC0, public domain, MIT and OFL. CC BY is fine with credit.
- Avoid NC (non-commercial), ND (no edits) and SA (share-alike) files. Most xeno-canto recordings, for example, are [BY-NC-ND](https://worldspecies.org/audios); OpenMoji is [CC BY-SA](https://openmoji.org/faq), which would bind your edited art to the same license.
- Log every file in `credits.json` (source, author, license) and show it on a Credits page in the grown-ups corner.

## Content model and fact-checking

All animal content lives in data files, one folder per animal, so adding an animal never means touching app code.

Example `content/animals/philippine-tarsier/animal.json` (the shipped file, checked by `src/lib/content/schema.ts`):

```json
{
  "id": "philippine-tarsier",
  "name": "Philippine Tarsier",
  "continent": "asia",
  "livesIn": "the Philippines",
  "habitats": ["jungle"],
  "nocturnal": true,
  "rig": "mammal-small",
  "themeColor": "#8BC34A",
  "globe": { "lat": 9.85, "lng": 124.15, "regions": "regions.geojson" },
  "assets": {
    "icon": "icon.svg",
    "puppet": "puppet.svg",
    "background": ["bg-far.svg", "bg-mid.svg", "bg-near.svg"],
    "audio": "audio-sprite.webm"
  },
  "greeting": "Hi! I'm a tarsier!",
  "facts": [
    { "id": "eyes", "text": "Each of my eyes is as big as my brain!" }
  ],
  "toys": [
    { "type": "dayNight", "day": "Shh... I'm sleeping.", "night": "I'm awake! Time to catch bugs." },
    { "type": "bodyXray", "feature": "eyes", "reveal": "My eyes can't move, so I turn my head instead." },
    { "type": "makeItDo", "actions": ["leap", "turnHead"] }
  ],
  "sources": ["https://en.wikipedia.org/wiki/Philippine_tarsier"]
}
```

`regions` and `audio` are optional. The puppet is always `puppet.svg`, and `credits.json` beside it logs every file.

(Trimmed to one fact for space; verify every fact and coordinate during content writing.)

**Fact-checking rules**

- Every animal lists its sources, and every fact must be backed by at least one of them. Use reputable sources: e.g. National Geographic Kids, Smithsonian's National Zoo, San Diego Zoo Wildlife Alliance, WWF, natural history museums, encyclopedias.
- Prefer facts that sources agree on; avoid "myth" facts that circulate online.
- Habitat regions are simplified for kids but should never place an animal on the wrong continent.
- A teacher (Dale) reviews each animal's facts before release.
- Range maps: IUCN Red List spatial data is a useful reference, but check its license terms before deriving shipped files from it; hand-drawn approximations are safer and look better at a kid's scale.

## Offline strategy and performance budget

The app shell and globe are cached on first visit; animal packs cache as they are opened, and a "Download all animals" button grabs everything for fully offline use (e.g. before a school day with no Wi-Fi).

**Caching plan (SvelteKit service worker, `src/service-worker/`)**

- **Precache:** app code, fonts, UI sounds, globe textures, the animal index (names, icons, coordinates, habitats) and `/packs/index.json`, in a `shell-<version>` cache. Pages are network-first and fall back to the cached shell offline; asset paths are absolute so that shell works at any URL.
- **Animal packs:** one folder per animal (puppet SVG, backgrounds, audio), published at the fixed URL `/packs/<id>/` with a `manifest.json` listing its files and bytes; `/packs/index.json` lists every pack. Each animal's manifest, icon and habitat ship with the app instead, since the globe needs them at once. Cache-first once fetched; stored in a named cache so a pack can be updated individually.
- **Download all:** a settings button that fetches every pack with a progress bar and shows total size first.
- **Updates:** new versions download in the background; a friendly "New animals arrived!" toast asks to refresh (never mid-scene).
- **Storage:** request persistent storage (`navigator.storage.persist()`) so the browser is less likely to evict packs.

**Performance budget (targets to hold every build to)**

| Item | Target |
| --- | --- |
| First load to globe (app shell + globe) | under 3 MB |
| One animal pack (puppet SVG + backgrounds + audio) | 300–800 KB |
| All animals, 34 packs | under 40 MB |
| Frame rate on a budget Android phone | 30 fps minimum, 60 fps target |
| Time from tap to scene visible | under 1.5 s (pack cached) |

**Techniques**

- Cap device pixel ratio at 2 (1.5 on low-end: 4 or fewer CPU cores, or 4 GB or less memory). If the globe averages under 30 fps for 3 s (after a 1 s warm-up), it steps down once to low quality: 1024 texture, half the clouds, fewer stars, pixel ratio 1.
- Pause the globe's render loop while a scene is open; pause everything when the tab is hidden.
- Load lottie-web and Matter.js lazily (only when a scene needs them).
- Audio as compressed sprites (WebM/Opus with an AAC fallback for older iPads).
- SVGs optimized with SVGO; Lottie files trimmed of unused layers.
- Test devices: the local laptop, plus Chrome's CPU throttling and phone/tablet emulation as a stand-in for budget devices until real ones are available.

## Kid-friendly UX, accessibility, privacy

Design for a 6–9-year-old (grades 1–3) holding a tablet with sticky fingers, who may not read well yet.

**Kid UX**

- Tap targets at least 64 px; no double-taps, long-presses or tiny close buttons.
- Pictures first, words second: short dialogue bubbles, never paragraphs.
- No dead ends: every screen has a big back-to-globe button.
- No timers, scores, streaks or failure sounds; no pop-ups that interrupt play.
- A parent/teacher corner behind a simple adult gate ("press and hold for 3 seconds") for settings and "Download all". The hold is the one deliberate long-press: it is there so kids don't get in.

**Accessibility**

- Honor the system "reduce motion" setting, plus an in-app toggle.
- Adjustable text size, an easy-reading font option, and high-contrast mode.
- Keyboard navigation on desktop (arrow keys rotate the globe, Tab cycles animals).
- Screen-reader labels on icons and buttons.

**Privacy and safety**

- No accounts, ads, analytics or trackers; all progress stays on the device.
- No external links in kid-facing screens.
- This keeps you clear of most children's-privacy obligations (e.g. COPPA in the US and the Philippine Data Privacy Act); if you ever add analytics or accounts, review those rules first.
- Asset licensing: every scavenged file is logged with its source and license and credited on a Credits page.

## Project structure

Code, reusable components and content stay in separate folders so artists and writers can work without touching app logic.

```text
volar/
├─ src/
│  ├─ routes/              # Globe home, animal scene, Animal Book, settings
│  ├─ lib/
│  │  ├─ globe/            # Three.js/Threlte globe, icons, habitat overlays, camera fly-to
│  │  ├─ scene/            # Scene shell, SVG puppet player, parallax background, dialogue bubbles
│  │  ├─ toys/             # One component per trivia toy (SizeCompare, SpeedRace, DayNight…)
│  │  ├─ audio/            # Howler wrapper for animal sounds and UI effects
│  │  ├─ db/               # Dexie schema: stickers, settings, downloaded packs
│  │  ├─ content/          # Loads and validates animal JSON (zod schema)
│  │  └─ strings/          # All UI and dialogue text, English
│  └─ app.css
├─ content/
│  ├─ index.json           # Generated list of animals (name, icon, lat/lng)
│  ├─ animals/
│  │  └─ <animal-id>/      # animal.json, regions.geojson, icon.svg, puppet.svg, bg-*.svg, credits, audio
│  └─ planned/             # Animals with no pack yet: greyed "coming soon" globe pins (Fluent emoji stand-ins)
├─ art-source/             # Inkscape and Glaxnimate source files (not shipped)
├─ scripts/                # Build index.json, validate content, optimize SVG/audio
├─ static/                 # Globe textures, fonts, app icons, manifest assets
└─ vite.config.ts          # Includes vite-plugin-pwa config
```

A `scripts/validate-content` step runs on every build: it checks each animal.json against the schema, confirms all referenced files exist, and fails the build if a pack exceeds its size budget.

## Starter animal list

Launch with 34 animals, spread across every continent and the oceans, with Philippine animals included so local kids find home on the globe.

| Region | Animals | Rig |
| --- | --- | --- |
| Philippines (Asia) | Philippine tarsier, Philippine eagle, tamaraw, whale shark (Donsol/Oslob waters) | mammal-small, bird, quadruped, fish |
| Asia | Giant panda, Bengal tiger, Bornean orangutan, Asian elephant | quadruped, quadruped, climber, quadruped |
| Africa | Lion, African elephant, giraffe, hippopotamus, chameleon | quadruped ×4, reptile-amphibian |
| South America | Jaguar, three-toed sloth, toco toucan, scarlet macaw, poison dart frog | quadruped, climber, bird, bird, reptile-amphibian |
| North America | Grizzly bear, bald eagle, monarch butterfly (migration path), American bison | quadruped, bird, insect, quadruped |
| Europe | Red fox, European hedgehog, Atlantic puffin | quadruped, mammal-small, bird |
| Australia | Red kangaroo, koala, platypus | quadruped (hop), climber, mammal-small |
| Polar | Polar bear (Arctic), emperor penguin (Antarctica), narwhal | quadruped, bird, sea-mammal |
| Oceans | Blue whale, green sea turtle (migration path), clownfish | sea-mammal, reptile-amphibian, fish |

Build order: tarsier first (done in Phase 0), then scarlet macaw (the bird rig and the first animal sound), then lion, blue whale and emperor penguin, which together exercise land, ocean, polar and every main toy type.

## Build phases

| Phase | Goal | Gate |
| --- | --- | --- |
| 0 ✅ | One finished animal (the tarsier) | Art style, rig, file sizes and frame rate proven |
| 1 | The globe is the home screen | Globe holds 30 fps on the laptop and under 4× CPU throttle; tap → scene → back works |
| 2 | Offline and collecting | Works in airplane mode after "Download all"; stickers survive a reload |
| 3 | Content at scale | Every toy type and rig exists; animals added in batches by rig |
| 4 | Launch | Accessibility, teacher-reviewed facts, complete credits, deployed |

The task breakdown lives in the working file `tasks/plan.md` (not committed).

Phase 0 matters most: one finished animal proves the art style, rig, file sizes and frame rate before the expensive work of 33 more. Don't start Phase 3 until Phase 2's offline loop is solid.

## Risks and key decisions

The biggest risk is animation workload, not code: 34 hand-animated animals on eight rigs is a lot of art, so the plan reuses rigs and proves one animal before scaling.

| Risk | Mitigation |
| --- | --- |
| Animation takes far longer than expected | Puppet templates per body type; 2–4 actions per animal, not more; launch with fewer animals if needed (16 is still a great app) |
| Globe runs poorly on old school PCs | Adaptive quality, pixel-ratio cap, 2D map fallback; throttled-CPU checks from Phase 1 |
| Only a laptop to test on; no budget phone or iPad | Chrome CPU throttling and device emulation in every e2e run; borrow a real phone and iPad before launch, especially to test iOS offline storage |
| Wrong or myth facts | Cited sources per fact plus teacher review before release |
| Browser clears offline data | Persistent storage request; "Download all" button easy to re-run; small pack sizes |
| Asset licensing problems | Use only CC0, MIT, OFL or CC BY files; avoid NC, ND and SA; log every file in credits.json |
| Kids get lost on the globe | Tilt clamp, Home button, auto-spin, filters, Surprise Me |

**Decisions to make before Phase 0**

- [x] App name: **Volar**; mascot still to design
- [x] Target: grades 1–3
- [x] Framework: Svelte
- [x] Who draws and animates: $0 budget; scavenged MIT, CC0 and CC BY art, animated in-house with free tools (see $0 asset plan)
- [x] Narration: none at launch; short, easy-to-read dialogue bubbles
- [x] Language: English only
- [x] Phases: 0–4 as in *Build phases*
- [x] License: MIT, for the code and the original art
- [x] Body types: eight rigs, kept separate
- [x] Fact reviewer: Dale
- [x] Next animal: scarlet macaw (added as #34)
