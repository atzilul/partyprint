# Follow-up: complete the landing media audit

Date: 2026-11-02. Prior verified application 3034694 (then documentation-only main 5f6a142), source fingerprint 81e89758…; baseline public median LCP 1.908s mobile and 0.440s desktop. This follow-up is pending candidate and public acceptance.

The user's audit covered six points. Responsive hero sources, high priority, full WOFF2 conversion and removal of autoplay were already implemented by PR #18. This phase completes offscreen art, font subsets, preload and cache lifetime.

- All fixed homepage artwork uses responsive AVIF and WebP fallback, with explicit sizes, native dimensions and lazy/low priority below the hero. The first hero alone is preloaded as an image.
- The 1536×1024 Wow Machine triptych was downloaded once in the observed prior browser resource timings, despite its three HTML uses. Its visible thirds are now independent 512×1024 panels (256/512 variants), preserving the existing center crops. All three 512px AVIFs total 105,004 bytes versus the prior 345,382-byte shared image. Actual browser selection is measured separately.
- Six font weights are split into 18 disjoint Hebrew/Latin/other faces. The union retains the original Unicode coverage, layout feature closure and advance widths. Rubik's Hebrew faces are 4.3–4.5KB, Latin 19.8–21.1KB; other languages retain a separate face instead of losing support. CSS uses unicode-range and font-display:swap.
- Media is imported through the existing Vite/Vinext asset pipeline. Production URLs are content-hashed under /_next/static/media and inherit its year-long immutable cache behavior. Source files live under app/assets/static; the source manifest and build validator verify 80 hashes and file signatures. Legacy public originals remain for existing links.
- The existing lossless WebP logos retain their appearance, including the shared content-page logo. No original PARTYPRINT vector SVG was found in the repository or the targeted Library search; SVG replacement is not claimed. A raster image wrapped in an SVG would not meet the size/quality goal.
- No dependency, lockfile, pricing, order storage, mail or consent changes. No Higgsfield or new artwork generation.

## Acceptance

Existing production build, API isolation, order/quantity/measurement and SEO checks remain required. Added checks exercise all static artwork, visible Wow panels, exact critical font preload URLs, other-script text, all 18 CSS faces, content hashes, immutable asset responses, missing-file 404 and no-store on /api/release. Public media QA explicitly waits for the matching source.

Candidate and production evidence will be appended after execution. Do not claim field Core Web Vitals or a Hostinger receipt from lab/CI alone. Sites remains a separate version 28 copy with unavailable execution infrastructure; Resend and N01 remain open.

## Regeneration

Asset generation is a developer preparation step, not part of production install/build. Use isolated Sharp 0.35.5 and fonttools[woff] 4.68.0, run prepare-landing-assets.mjs, prepare-font-subsets.py, then prepare-immutable-media.mjs; review and commit the resulting source assets before building. The source validator confirms hashes/signatures. Runtime builds do not rewrite assets or the lockfile.

Official references: https://vite.dev/guide/assets; https://fonttools.readthedocs.io/en/stable/subset/; https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control.
