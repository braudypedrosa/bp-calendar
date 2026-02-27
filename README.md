# bp-calendar

A lightweight, framework-agnostic calendar component for booking-style date selection.

Current version: **1.0.0**

## Overview

`bp-calendar` renders a customizable calendar UI with support for:
- single-date selection
- date-range selection
- datepicker mode with popup behavior

It ships as plain JavaScript + SCSS and works in browser globals and ESM build pipelines.

## Features

- Single, Range, and Datepicker modes (`single`, `range`, `datepicker`)
- Multi-month rendering (`1` to `4` months)
- Responsive month count via breakpoint config
- Per-date configuration (`isDisabled`, `price`, `minDays`, `maxDays`)
- Range hover preview and duration tooltip
- Constraint tooltip for min/max stay rules
- Built-in clear button support (optional)
- Datepicker popup alignment strategies (`default`, `auto`)
- Public instance methods for updates, navigation, selection reads, and teardown

## Installation

### npm

```bash
npm install @braudypedrosa/bp-calendar
```

```js
import { BPCalendar } from '@braudypedrosa/bp-calendar';
import '@braudypedrosa/bp-calendar/styles';
```

### Browser

Include your styles and script in the page:

```html
<link rel="stylesheet" href="./bp-calendar.scss" />
<script type="module" src="./bp-calendar.js"></script>
```

Or bundle with your build tooling and import as ESM/CommonJS.

## Quick Start

```html
<div id="calendar"></div>
<script type="module">
  import { BPCalendar } from './bp-calendar.js';

  const calendar = new BPCalendar('#calendar', {
    mode: 'range',
    monthsToShow: 2,
    onRangeSelect: (range) => {
      console.log('Selected range:', range);
    },
  });
</script>
```

## API

### Constructor

```js
new BPCalendar(container, options)
```

- `container`: `HTMLElement | string`
- `options`: object

### Options

- `startDate: Date` default `new Date()`
- `monthsToShow: number` (`1..4`) default `2`
- `mode: 'single' | 'range' | 'datepicker'` default `'single'`
- `onDateSelect: (date: Date) => void`
- `onRangeSelect: ({start: Date|null, end: Date|null}) => void`
- `dateConfig: Record<string, DateConfig>` keyed by `YYYY-MM-DD`
- `defaultMinDays: number` default `1`
- `selectedDate: Date | null`
- `selectedRange: {start: Date, end: Date} | null`
- `tooltipLabel: string` default `'Nights'`
- `showTooltip: boolean` default `true`
- `showClearButton: boolean` default `true`
- `datepickerPlacement: 'default' | 'auto'` default `'default'`
- `breakpoints: Record<number, number | {monthsToShow: number}>`

### `DateConfig` shape

```js
{
  date: '2026-03-01',
  isDisabled: false,
  price: 250,
  minDays: 2,
  maxDays: 14,
}
```

## Public Methods

- `updateOptions(newOptions)`
- `clearSelection()`
- `navigatePrevious()`
- `navigateNext()`
- `getSelectedDate(): Date | null`
- `getSelectedRange(): {start: Date, end: Date} | null`
- `destroy()`

## Exports

- Browser global: `window.BPCalendar`, `window.BP_Calendar`
- ESM: `export { BPCalendar, BP_Calendar }`

## Styling

The provided stylesheet defines calendar structure and interaction classes under the `.bp-calendar-*` namespace.

Key groups:
- layout wrappers (`.bp-calendar-wrapper`, `.bp-calendar-months`)
- day states (`.bp-calendar-day-selected`, `.bp-calendar-day-in-range`, `.bp-calendar-day-disabled`)
- datepicker UI (`.bp-calendar-datepicker-*`)

## License

MIT

## Maintainer Workflow

Edit source files in this repository:
- `bp-calendar.js`
- `bp-calendar.scss`

Then release updates by bumping `package.json` version, tagging (`vX.Y.Z`), and publishing.

Use one command:

```bash
npm run release:patch
# or: npm run release:minor
# or: npm run release:major
```

This command sequence will:
- verify you are on `main` with a clean working tree
- bump version and create a release commit + git tag
- push `main` and tags to GitHub
- publish the new version to npm
