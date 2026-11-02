# Follow-up: complete the landing media audit

Date: 2026-11-02. Prior verified application 3034694 (then documentation-only main 5f6a142), source fingerprint 81e89758…; baseline public median LCP 1.908s mobile and 0.440s desktop. This follow-up was implemented and publicly verified; evidence follows below.

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

## Public acceptance completed

Application release **f2943070b3fd8ddac6bfe4e8689c40b5ae08d841** ([PR #20](https://github.com/atzilul/partyprint/pull/20)), clean fingerprint **fb4d18b5153c66ef1b832ec222c0bf09d76faa168868d8885f73f64961a14258** matches CI. The public source/SEO audit observed it at 2026-11-02T08:01:33.995Z.

| Public lab profile | Previous phase median | Follow-up median | Follow-up range |
| --- | --- | --- | --- |
| Mobile, 390×844 / DPR2, 1.6 Mbps, CPU×4 | 1.908s | **1.716s** | 1.564–1.828s |
| Desktop, 1366×900 / DPR1, 10 Mbps, CPU×1 | 0.440s | **0.396s** | 0.372–0.712s |

Three cold-context samples per profile, normal motion, 12-second observation before interaction; same configured profiles as the prior phase. Browser cache is disabled in the lab. Vendor scripts may load; measurement writes are blocked. GitHub-hosted hardware/location and upstream caches are not perfectly controlled. These samples do not establish field p75 or campaign conversion uplift; desktop ranges overlap across phases.

Evidence:
- [Main build](https://github.com/atzilul/partyprint/actions/runs/41409618214/job/125159416609): 80 content hashes and file signatures; 32 regressions; isolated real order API/synthetic storage; production build/standalone; 339 local SEO checks passed.
- [Public performance](https://github.com/atzilul/partyprint/actions/runs/41409618192/job/125160176279), began 08:00 UTC: exact clean source gate passed, 6/6 profiles passed, no client exceptions, lab CLS 0 mobile/~0.00161 desktop, no original transformation.webp request, no automatic loading of other event heroes. The initial hero and font responses carry public, max-age=31536000, immutable.
- [Post-deployment form and media](https://github.com/atzilul/partyprint/actions/runs/41409618214/job/125161216773), 08:03 UTC: form 14 checks per viewport, quantity/tier 31 per viewport, three isolated measurement scenarios and media 20 per viewport passed against matching source. All 11 sampled asset URLs returned 200 and year-long immutable cache headers. The release API remained no-store; missing static files returned 404. No real orders, quotes, analytics writes or emails were sent.
- [Public source/SEO](https://github.com/atzilul/partyprint/actions/runs/41409618214/job/125160773733): clean exact revision/fingerprint, 550 checks and zero errors after deployment.
- [Candidate performance](https://github.com/atzilul/partyprint/actions/runs/41408984880/job/125157415731): mobile 1.248s / desktop 0.300s medians with the explicitly local-only Brotli proxy. Local timing is not compared directly with public latency.
- Raw sanitized [public performance](performance/landing-media-public-2026-11-02.json) and [public media/cache checks](performance/landing-media-qa-2026-11-02.json) are retained.

The initial production probes still saw 5f6a142 and were explicitly marked waiting_for_matching_deployment; the post-deployment runs above supersede them. A successful job that skipped new-feature checks is not acceptance evidence.

All 77 task IDs are retained. T10 records the publicly observed homepage resource fix; T09 retains missing field metrics and further page sampling. No formal hPanel successful-deployment receipt is available, so V02 stays open despite the public evidence. Sites remains version 28 with source sync blocked by the disconnected environment and receipt gate; no new Site or Site publication occurred. Resend verification and the known N01 development advisory remain separate. No new paid service or recurring field monitor was enabled.
