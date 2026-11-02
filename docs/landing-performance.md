# PARTYPRINT — paid landing performance

Date: 2026-11-02. Target: https://partyprint.co.il/, not the stale Sites copy.

## Baseline
Read-only laboratory run [41400281426](https://github.com/atzilul/partyprint/actions/runs/41400281426), Chromium from Playwright 1.64.1; three cold browser contexts per profile, 12-second observation, normal motion. All non-GET requests and analytics collection are blocked; vendor scripts may load. This is not field Core Web Vitals or a guarantee about every visitor.

| Profile | Viewport / DPR | Network / CPU | Median LCP | Range |
| --- | --- | --- | --- | --- |
| Mobile | 390×844 / 2 | 1.6 Mbps down, 0.75 up, 150ms CDP latency, 4× CPU slowdown | 10.372s | 10.196–10.400s |
| Desktop | 1366×900 / 1 | 10 Mbps down, 5 up, 40ms CDP latency, 1× CPU | 1.624s | 1.444–1.892s |

The user's 4.9s mobile / 6.2s desktop came without an audit/profile/source; those figures are not directly comparable. Do not claim that this laboratory result is their PageSpeed or field result.

The release API returned clean application commit 290534b6a3ee927b33014f571df2cc5b094f331b, fingerprint d8b66600c41e29998eef3d520f1386b671c769f070a826b02ad75d442151348e. main 2376fe9f053890518d05804cb13a22376eab9c6f only adds documentation to that application.

Mobile sample 1:
- Navigation TTFB 250ms; HTML received by 471ms with Brotli compression.
- Initial hero request started 393ms but ended at 10.153s. LCP paint followed 43ms later.
- The 350,814-byte hero competed with transformation.webp (345,382 bytes) and statement-family-fixed.webp (165,582 bytes), all discovered as early image links.
- Additional competing downloads included multiple TTF faces, two PNG logos, CSS and application chunks. No client exceptions occurred; measured CLS was 0.
- Desktop switched the selected event automatically after about 7.6 seconds; this was not the measured final LCP in these runs. No claim that removing autoplay alone fixes the bottleneck.

Full sanitized resource timings are in [the baseline](performance/landing-baseline-2026-11-02.json).

## Change
- Existing artwork is recompressed into 640, 960 and 1254 pixel AVIF images, with equivalent WebP fallback and responsive sizes. No AI/image-generation service was used; original files remain intact.
- The default mobile 960px AVIF is 77,064 bytes versus the previous 350,814 bytes (78% smaller); actual browser selection must be checked.
- Picture dimensions match the square source artwork. Image priority is high; the hero is visible immediately and changes only when the visitor chooses an event.
- Offscreen process/statement images use lazy loading and low fetch priority, removing eager React image preloads.
- WOFF2 font containers preserve every original Unicode mapping and horizontal glyph metric. Only the two critical text faces are preloaded; font-display remains swap.
- Header/footer logos use compact lossless WebP at 600px; original metadata/social images remain available.
- No pricing, coupon, order storage, email configuration or consent semantics are changed.

## Verification and release state
Candidate/browser/production results are pending. Never turn a successful candidate build into a statement that production is fixed.

The landing workflow measures three samples per device profile and checks initial image selection, decoding, stable event choice, deferred distant artwork, WOFF2 use and lab CLS. First samples also exercise all five event choices. Existing order, quantity/tier, measurement, SEO, standalone and API isolation checks must pass before release.

After deployment, rerun the public lab using the same profiles and verify clean sourceCommit/fingerprint. Report synthetic timings separately from CrUX or consented real-visitor monitoring. No real order/email is sent by these probes.

Hostinger's exact successful deployment receipt is still unavailable. Sites remains the separate version 28; its sync is blocked by the disconnected execution environment. Resend sender verification remains outstanding. No new background monitoring is enabled.

## Rebuild asset provenance
The generated image/font reports in public/landing record tool versions, dimensions, source hashes and bytes. Recompression scripts use isolated Sharp 0.35.5 and fonttools 4.68.0; they are not application dependencies. Generated binary files are committed before builds, so installation/build does not rewrite source assets or the lockfile.

Official reference: https://web.dev/articles/optimize-lcp. Good field LCP means at most 2.5s at the 75th percentile; a lab pass alone cannot establish that.
