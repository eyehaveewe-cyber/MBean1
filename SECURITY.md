# Security notes

MBean1 is intentionally small and local-first.

## Current trust model

- No third-party JavaScript libraries or package manager dependencies.
- No analytics, telemetry, ads, accounts, cookies, WebSockets, or background upload service.
- Project state is stored in browser `localStorage`.
- Export uses a locally-created JSON Blob.
- Audio is generated with Web Audio or decoded from the CC0 sample files documented in `SAMPLES.md`.
- Remote sample URLs are pinned to immutable Git commit SHAs rather than mutable branch names.
- A Content Security Policy blocks remote scripts and limits network/audio access to `raw.githubusercontent.com`.
- The service worker caches only same-origin files and the explicitly allowed GitHub raw-content host.

## Remote data

MBean1 currently performs only one kind of intended external request: GET requests for selected flute, oboe, and drum audio samples. It does not POST project data or musical content anywhere.

The current pinned upstream commits are:

- VSCO 2 CE: `440300901dfe9275fd84e0b7763af1f8443ae62e`
- Virtuosity Drums: `9f04cf9a734527edfbb0a4eee1f674e45bbf71bc`

## Residual risk

Any browser application inherits risk from the browser and its media decoders. A malformed audio file could theoretically exercise a browser-decoder vulnerability. MBean1 reduces that supply-chain risk by using known open sample repositories and pinning exact audited commits, but no software audit can prove zero risk.

If new dependencies, plugins, remote APIs, or sample sources are added later, this security assessment should be repeated.
