# bp-calendar

A lightweight, framework-agnostic calendar component for booking-style date selection.

Current version: **1.0.6**

## What it does

`bp-calendar` renders a customizable calendar UI with support for:

- **Single date** selection
- **Date range** selection
- **Popup datepicker** mode with an input + calendar overlay
- **Horizontal or vertical** multi-month layouts

It is designed to be:

- **ESM‑first** – you import it as a normal ES module.
- **Framework‑agnostic** – works with plain JS, React, Vue, etc.
- **Styling‑friendly** – ships with a small CSS file you can import or override.

## Getting started

Clone or vendor this repository into your project and import directly from `src`:

```js
// Example: relative path from your app entry
import { BPCalendar } from './path/to/bp-calendar/src/bp-calendar.js';
import './path/to/bp-calendar/dist/bp-calendar.css';
```

Then instantiate the calendar:

```html
<div id="calendar"></div>

<script type="module">
  import { BPCalendar } from './path/to/bp-calendar/src/bp-calendar.js';
  import './path/to/bp-calendar/dist/bp-calendar.css';

  const calendar = new BPCalendar('#calendar', {
    mode: 'range',          // 'single' | 'range' | 'datepicker'
    monthsToShow: 2,        // 1–4 months
    layout: 'horizontal',   // 'horizontal' | 'vertical'
    onRangeSelect: (range) => {
      console.log('Selected range:', range);
    },
  });
</script>
```

### Using vertical mode

```js
const calendar = new BPCalendar('#calendar', {
  mode: 'range',
  monthsToShow: 3,
  layout: 'vertical',
});
```

### Using datepicker mode

```html
<div id="datepicker-demo"></div>

<script type="module">
  import { BPCalendar } from './path/to/bp-calendar/src/bp-calendar.js';
  import './path/to/bp-calendar/dist/bp-calendar.css';

  const datepicker = new BPCalendar('#datepicker-demo', {
    mode: 'datepicker',
    monthsToShow: 2,
    datepickerPlacement: 'auto', // smarter popup placement
    onRangeSelect: (range) => {
      console.log('Selected date range:', range);
    },
  });
</script>
```

## Options (consumer-friendly summary)

You pass an `options` object as the second argument to `new BPCalendar(container, options)`:

- `mode`: `'single' | 'range' | 'datepicker'`  
  Which selection mode to use.

- `monthsToShow`: `number` (1–4, default `2`)  
  How many months to render.

- `layout`: `'horizontal' | 'vertical'` (default `'horizontal'`)
  Controls whether multiple visible months are rendered side by side or stacked vertically.

- `startDate`: `Date` (default: today)  
  First month to show.

- `dateConfig`: `Record<string, DateConfig>`  
  Per-day configuration keyed by `YYYY-MM-DD` strings. See below.

- `onDateSelect(date)`  
  Called when a date is selected in `single` mode.

- `onRangeSelect({ start, end })`  
  Called when a range is selected in `range` or `datepicker` modes.

- `defaultMinDays`: `number` (default `1`)  
  Used for copy and tooltips when no explicit `minDays` is set on a date.

- `selectedDate`: `Date | null`  
  Initial selection in `single` mode.

- `selectedRange`: `{ start: Date, end: Date } | null`  
  Initial selection in `range` / `datepicker` modes.

- `tooltipLabel`: `string` (default `'Nights'`)  
  Label used in the hover tooltips (e.g. “3 Nights”).

- `showTooltip`: `boolean` (default `true`)  
  Show or hide the hover tooltip.

- `showClearButton`: `boolean` (default `true`)  
  Show or hide the built‑in **Clear** button.

- `datepickerPlacement`: `'default' | 'auto'` (default `'default'`)  
  - `'default'`: classic placement below the input.  
  - `'auto'`: smarter behavior that centers when there’s space and falls back to edge‑aligned and compact layouts when needed.

- `breakpoints`: `Record<number, number | { monthsToShow: number }>`  
  Simple responsive rules; keys are viewport max widths in pixels.

### `DateConfig` shape (per‑day options)

```js
{
  date: '2026-03-01',  // optional label; defaults to key
  isDisabled: false,   // disable selection for this date
  price: 250,          // any value to display under the day
  minDays: 2,          // minimum nights if this is the check-in date
  maxDays: 14,         // maximum nights if this is the check-in date
}
```

## Public methods

Once you have an instance:

- `updateOptions(newOptions)`  
  Merge in new options and re-render.

- `clearSelection()`  
  Clears the current selection (date or range).

- `navigatePrevious()` / `navigateNext()`  
  Programmatically move the visible month window.

- `getSelectedDate(): Date | null`  
- `getSelectedRange(): { start: Date, end: Date } | null`

- `destroy()`  
  Remove all DOM and event listeners created by the calendar.

## Styling

The compiled CSS in `dist/bp-calendar.css` includes all base styles under the `.bp-calendar-*` namespace:

- Layout: `.bp-calendar-wrapper`, `.bp-calendar-months`, `.bp-calendar-grid`
- States: `.bp-calendar-day-selected`, `.bp-calendar-day-in-range`, `.bp-calendar-day-disabled`, `.bp-calendar-day-today`
- Datepicker: `.bp-calendar-datepicker-*`
- Tooltip: `.bp-calendar-tooltip`, `.bp-calendar-tooltip-constraint`

You can either:

- Import the CSS as‑is and override classes in your own stylesheet, or
- Start from `src/bp-calendar.scss` if you prefer to run the SCSS through your own pipeline.

## License

MIT
