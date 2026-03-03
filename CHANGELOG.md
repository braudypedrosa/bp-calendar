# Changelog

All notable changes to this project are documented in this file.

## [1.0.5] - 2026-03-04

### Added
- Added a compiled `./styles` export that includes the shared widget reset stylesheet for consumer-ready CSS imports.
- Added CI workflow coverage for test and CSS build verification.

### Changed
- Removed duplicated inline reset styles from the calendar stylesheet and moved reset application to runtime root elements.
- Added `.bp-widget-reset` to both inline calendar and datepicker wrapper roots.
- Upgraded the local tooling baseline to Vite 7, Vitest 4, jsdom 28, and `sass-embedded` 1.97.3.

## [1.0.2] - 2026-02-28

### Changed
- Reworked `datepickerPlacement: 'auto'` to follow deterministic center, edge-align, one-month fallback, and compact fallback rules.
- Made datepicker popup navigation follow the actual rendered popup month count during temporary auto-placement fallback.
- Added support for custom datepicker alignment anchors so embedded hosts can align the popup to the full field shell instead of only the inner input.
- Updated the compact fallback so narrow popups stay clamped to the anchor/viewport edge instead of floating centered.

### Added
- Added Vitest coverage for datepicker auto-placement rules and popup month fallback behavior.

## [1.0.1] - 2026-02-27

### Changed
- Added automated release scripts (`release`, `release:patch`, `release:minor`, `release:major`) for maintainers.
- Updated maintainer docs with one-command release instructions.

## [1.0.0] - 2026-02-27

### Added
- Initial release of `bp-calendar` package.
- Framework-agnostic booking calendar with `single`, `range`, and `datepicker` modes.
