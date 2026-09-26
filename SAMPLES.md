# Sample sources

MBean1's current real-instrument sample mode uses a deliberately small subset of two CC0 libraries.

## Flute and oboe

Source: **VS Chamber Orchestra: Community Edition (VSCO 2 CE)** by Versilian Studios / Sam Gossner and contributors.

Repository: https://github.com/sgossner/VSCO-2-CE

License: **CC0 1.0**.

Current source notes:

- Flute sustain non-vibrato: C4, E4, A4
- Oboe sustain: D4, F4, A#4

MBean1 pitch-shifts from the nearest recorded source note for pitches between those recordings.

## Acoustic drums

Source: **Virtuosity Drums** by Versilian Studios and Karoryfer Samples.

Repository: https://github.com/sfzinstruments/virtuosity_drums

License: **CC0 1.0**.

Current compact kit:

- kick
- snare center
- high tom
- closed hi-hat
- open hi-hat
- crash

The browser fetches these samples from their upstream raw GitHub paths on first use. When MBean1 is served over HTTP/HTTPS, its service worker runtime-caches fetched audio for subsequent offline use. When opened directly as a `file://` page, service workers are unavailable, so the real samples require network access each session.

If a sample cannot load or decode, MBean1 falls back to a simple synthesized tone rather than stopping playback.
