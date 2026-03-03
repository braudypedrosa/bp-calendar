# Changelog

All notable **user-facing** changes to this project are documented here.

## [1.0.0] – 2026-03-04

Initial public release of `bp-calendar` as a small, ESM‑first calendar widget.

### Highlights

- **Booking-friendly modes**
  - Single date selection (`single`)
  - Date range selection (`range`)
  - Popup datepicker (`datepicker`)

- **Multi‑month layout**
  - Render between `1` and `4` months side by side.
  - Responsive month count via simple breakpoint settings.

- **Per‑day configuration**
  - Mark dates as disabled.
  - Attach prices or labels per date.
  - Enforce minimum / maximum stay length from the check‑in date.

- **Range UX**
  - Hover preview with “nights” tooltip.
  - Clear visual styling for start, end, in‑range, today, disabled, and past days.
  - Built‑in “Clear” control for range and datepicker modes.

- **Datepicker experience**
  - Popup anchored to an input field.
  - Optional automatic placement (`datepickerPlacement: 'auto'`) that:
    - Centers the popup when it fits.
    - Falls back to left/right alignment near viewport edges.
    - Uses a compact, clamped layout when space is tight.

- **API surface**
  - Construct via `new BPCalendar(container, options)`.
  - Read selection with `getSelectedDate()` / `getSelectedRange()`.
  - Update behavior with `updateOptions(newOptions)`.
  - Clean up with `destroy()`.

Older internal maintenance changes (CI, tooling, release scripts, etc.) are intentionally omitted here for brevity.
