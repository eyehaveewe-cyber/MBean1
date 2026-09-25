# MBean1

MBean1 is a local-first browser music sketchbox: a small composition workbench for turning rough note ideas into usable loops without handing the whole composition over to a generator.

## Prototype features

- 4 independent tracks: Lead, Harmony, Bass, Pulse
- 16-step piano roll
- Browser-native Web Audio playback
- Per-track instrument and volume
- Adjustable BPM
- Drag-select a step range from the ruler
- Local region operations: transpose, duplicate, reverse, clear
- Three nearby variation modes that only alter the selected region
- Local autosave with `localStorage`
- JSON project export
- Keyboard shortcuts
- PWA manifest + service worker for offline caching after first served load

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
3. Real sample-based instruments and drum kits
4. Click-and-drag note painting
5. Branching variation history
6. Hum-to-note microphone input
7. Reharmonization tools
8. WAV rendering/export
9. Project import
10. Larger arrangements beyond one 16-step loop

## Status

Early prototype. The point of this version is to test whether direct manipulation + local variation feels good before adding heavier music-generation systems.
