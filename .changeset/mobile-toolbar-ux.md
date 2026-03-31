---
'markdown-studio': minor
---

Redesign mobile toolbar UX with hamburger menu and action sheet

Implement progressive disclosure pattern for mobile toolbar to improve UX on narrow viewports:
- Add native-feeling bottom action sheet with smooth animations and gesture support
- Replace overcrowded mobile button grid with hamburger menu revealing all CTAs
- Move all actions (Open, Save, Install, Examples, Copy, Clear, Export, GitHub) into organized action sheet
- Improve touch targets to meet 44px minimum accessibility standard
- Add responsive breakpoints: compact buttons at ≤1200px, icon-only GitHub at ≤1100px
- Include comprehensive test coverage for new mobile components
