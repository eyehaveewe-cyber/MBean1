# MBean1

MBean1 is a local-first browser music sketchbox: a small composition workbench for turning rough note ideas into usable loops without handing the whole composition over to a generator.

## Prototype features

- Add, duplicate, rename, remove, and mix up to 16 tracks
- Multi-bar piano roll with 4-bar editor pages
- Browser-native Web Audio playback
- Per-track instrument and volume
- Real CC0 sampled flute and oboe (VSCO 2 CE)
- Compact CC0 acoustic drum kit (Virtuosity Drums)
- Adjustable BPM
- Held notes: drag horizontally across a pitch to sustain it instead of retriggering every step
- Project lengths from 4 to 128 bars (about 4:39 at 110 BPM)
- Drag-select a step range from the ruler
- Local region operations: transpose, duplicate, reverse, clear
- Three nearby variation modes that only alter the selected region
- Local autosave with `localStorage`
- JSON project export
- Keyboard shortcuts
- PWA manifest + service worker for offline caching after first served load
- Sample audio is fetched from the original CC0 GitHub sources on first use, then runtime-cached when served over HTTP/HTTPS

## Running it

The project has no build system or dependencies.

Because browsers restrict some capabilities on `file://` pages, serve the folder locally instead of double-clicking `index.html`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Keyboard controls

- **Space** — play / stop
- **1–4** — choose track
- **A–'** — place notes on the current step

## Current design principle

Generation is deliberately local. MBean1 should behave like an instrument and editing surface, not a prompt-to-song machine. You make a phrase, select part of it, and ask for nearby alternatives.

## Next useful milestones

1. Import/export MIDI
2. Better note lengths and velocity
3. More velocity layers, articulations, and locally vendored sample packs
4. Click-and-drag note painting
5. Branching variation history
6. Hum-to-note microphone input
7. Reharmonization tools
8. WAV rendering/export
9. Project import
10. Arrangement blocks, looping regions, and copy/paste between sections

## Status

Early prototype. The point of this version is to test whether direct manipulation + local variation feels good before adding heavier music-generation systems.
