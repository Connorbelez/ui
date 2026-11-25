---
"@ui-sdk/core": patch
---

Tree: a composed item three or more levels deep keeps its `aria-level`, `data-level` and `--tree-level` when React hydrates the tree in a transition, as Next.js does. A render that yielded between a branch and its children counted the children a level too shallow, and React reported a hydration mismatch.
