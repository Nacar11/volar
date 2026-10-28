# Animal sounds

One folder per animal (named by its id) with the source recordings and a
`clips.json` naming the clips to cut from them:

```json
{ "clips": { "squawk": { "file": "macaw-squawks.mp3", "start": 0, "end": 1.35 } } }
```

`npm run build:audio` trims each clip, evens out its loudness, joins the clips
into one sprite and writes `audio.webm` (Opus), `audio.m4a` (AAC, for older
iPads) and `audio.json` (each clip's start and length in ms) into
`content/animals/<id>/`. Credit every recording in that pack's `credits.json`.

## Sources

| Animal | File | Source | Licence |
| --- | --- | --- | --- |
| scarlet-macaw | macaw-squawks.mp3 | "Macaw Squawks" by loganzsound, freesound.org/s/875522 (HQ preview) | CC0 |
