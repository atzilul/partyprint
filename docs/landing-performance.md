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

## Verified public result

Application release: **30346940b85bcc2872acb36a933f27d9dae1a74f**, [PR #18](https://github.com/atzilul/partyprint/pull/18).
Source fingerprint: **81e89758827b0ef9ca6acdf8b7e0555e1870dd774df19402fa93cdf62cdaeda8**.

The public release API was clean with this exact SHA/fingerprint at 2026-11-02T07:04:04.025Z, matching CI. The subsequent public performance run required that same identity before measuring; all six samples passed the feature checks.

| Public profile | Baseline median | After median | After range | Lab CLS after |
| --- | --- | --- | --- | --- |
| Mobile | 10.372s | **1.908s** | 1.860–2.012s | 0 |
| Desktop | 1.624s | **0.440s** | 0.424–0.512s | 0.00161 |

These are three cold-context samples per profile using the same network/CPU/viewport configuration, not the user's earlier unknown audit conditions. Runs use GitHub-hosted Ubuntu runners; hardware/location and upstream caches are not held perfectly constant. Do not present the change as field p75 or campaign conversion uplift.

On desktop the final observed LCP candidate became a headline span; the hero image finished downloading at 0.354–0.433s. On mobile the hero image remained the LCP candidate. The public browser selected the 960px AVIF (77,064 decoded bytes); screenshots confirmed artwork, logo and the dynamic 10% offer remained visible.

Evidence:
- [Candidate lab](https://github.com/atzilul/partyprint/actions/runs/41403149608/job/125139171796): mobile 1.660s / desktop 0.376s medians with a **local-only Brotli text proxy**, lab CLS 0 / 0.00161. Local timings are not directly compared to public server latency.
- [Main build](https://github.com/atzilul/partyprint/actions/runs/41403621843/job/125140630311): 32 regression tests, isolated real order API against synthetic storage/no mail, production build, isolated standalone startup and 339 local SEO checks passed.
- [Public lab](https://github.com/atzilul/partyprint/actions/runs/41403621836/job/125141494983), began 2026-11-02T07:04:45.267Z: 6/6 samples passed. All five event choices responded, WebP fallback decoded with AVIF disabled, distant artwork stayed deferred, WOFF2 was used, and no client exceptions occurred.
- [Public form/quantity/measurement](https://github.com/atzilul/partyprint/actions/runs/41403621843/job/125141694443): 14 form checks plus 31 quantity/tier checks in each of 390×844 and 1366×900, then three isolated measurement scenarios passed on the matching public application at 07:05:24–07:05:56 UTC. No real order, quote, analytics write or email was sent.
- [Public source/SEO audit](https://github.com/atzilul/partyprint/actions/runs/41403621843/job/125141305996): clean exact application revision/fingerprint and 550 SEO checks, zero errors, at 07:04 UTC.
- Full sanitized [public timing report](performance/landing-public-2026-11-02.json) and [candidate timing report](performance/landing-candidate-2026-11-02.json).

Faster first paint exposed a desktop layout shift in an intermediate candidate. Unexpected movement was recorded in clipped landing containers; using overflow:clip for the root/body/hero instead of scrollable overflow:hidden eliminated the large shift. Final public CLS above uses the largest session window (less than 1s between shifts, at most 5s), observed for 12 seconds before test interaction. This does not measure lifetime CLS or INP.

The first main public audit returned generic fetch failures, and the first quantity probe still saw the old release. Those are not acceptance evidence and are retained in Actions history. The post-deployment audit and quantity runs linked above supersede them; the exact cause of the initial fetch failures was not established.

## Continuing verification

The workflow at .github/workflows/landing-performance.yml runs candidate laboratory QA for relevant PRs/pushes and a read-only production probe after main candidate success (or manual dispatch). Production waits for the exact clean commit/fingerprint; a nonmatching deployment is marked waiting_for_matching_deployment and cannot pass as a verified rollout. The CI is real; no recurring field monitoring or new paid service was configured.

T10's measured homepage fix is implemented and publicly observed. T09 still records missing verified field data and further page sampling. Neither this test nor a good individual lab run establishes that 75% of actual visitors meet Google's LCP target.

Hostinger's exact successful deployment receipt is still unavailable; public application evidence above does not close V02. Sites was read again and remains public version 28. Its source sync remains blocked by the disconnected execution environment as well as the outstanding hosting receipt gate. No new Site was created or published. Resend sender verification remains outstanding. N01 remains a separate development dependency advisory (16 moderate findings, zero production/high/critical in this run); dependencies/lockfile were unchanged.

## Rebuild asset provenance
The generated image/font reports in public/landing record tool versions, dimensions, source hashes and bytes. Recompression scripts use isolated Sharp 0.35.5 and fonttools 4.68.0; they are not application dependencies. Generated binary files are committed before builds, so installation/build does not rewrite source assets or the lockfile.

Official reference: https://web.dev/articles/optimize-lcp. Good field LCP means at most 2.5s at the 75th percentile; a lab pass alone cannot establish that.
