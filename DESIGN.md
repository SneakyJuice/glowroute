# GlowRoute directory repair

Audience: people comparing local aesthetic and wellness providers, primarily on phones.

Concept: trustworthy local discovery, with the same facts from search card to provider profile.

Aesthetic: retain the existing refined editorial ivory, onyx, sage, and champagne system. Contact actions and location evidence carry the hierarchy. No decorative redesign.

Signature: a readable search-to-provider flow with honest verification, stable image frames, and visible contact actions.

Typography and tokens: keep DM Sans and the existing editorial serif pairing. Use existing semantic colors; legacy navy/teal/gold names map to onyx/sage/champagne.

Motion: minimal, brief state feedback. Respect reduced motion and never delay navigation.

Responsive: compact navigation until the full desktop link set fits; one-column mobile results, visible mobile filter controls, bounded images, and no tablet overflow.

Assets: use sourced provider images. Display small logos as bounded marks, preserve media space on load/error, and avoid credential-bearing image URLs. Relevance still needs source review; image dimensions cannot prove that an image depicts the clinic.

Quality gates: unit regression tests for directory behavior and crawl safety; TypeScript, ESLint, production build; rendered desktop/mobile/tablet review of search, filters, phone actions, image fallbacks, keyboard controls, and reduced motion. Audit evidence lives in ../audit.
