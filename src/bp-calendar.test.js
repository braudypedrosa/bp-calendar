import { afterEach, describe, expect, it } from 'vitest';
import { BPCalendar } from './bp-calendar.js';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('BPCalendar layout option', () => {
    it('defaults to horizontal layout', () => {
        document.body.innerHTML = '<div id="calendar"></div>';

        new BPCalendar('#calendar', {
            startDate: new Date('2026-03-01T00:00:00'),
            monthsToShow: 2
        });

        const wrapper = document.querySelector('.bp-calendar-wrapper');
        expect(wrapper.getAttribute('data-layout')).toBe('horizontal');
        expect(wrapper.querySelector('.bp-calendar-nav-controls')).toBeNull();
        expect(wrapper.querySelectorAll('.bp-calendar-month')).toHaveLength(2);
    });

    it('renders inline calendars with vertical layout metadata', () => {
        document.body.innerHTML = '<div id="calendar"></div>';

        new BPCalendar('#calendar', {
            startDate: new Date('2026-03-01T00:00:00'),
            monthsToShow: 3,
            layout: 'vertical'
        });

        const wrapper = document.querySelector('.bp-calendar-wrapper');
        const navControls = wrapper.querySelector('.bp-calendar-nav-controls');

        expect(wrapper.getAttribute('data-layout')).toBe('vertical');
        expect(wrapper.firstElementChild).toBe(navControls);
        expect(navControls.querySelector('.bp-calendar-nav-left')).not.toBeNull();
        expect(navControls.querySelector('.bp-calendar-nav-right')).not.toBeNull();
        expect(wrapper.querySelectorAll('.bp-calendar-month')).toHaveLength(3);
    });

    it('updates vertical layout after initialization', () => {
        document.body.innerHTML = '<div id="calendar"></div>';

        const calendar = new BPCalendar('#calendar', {
            startDate: new Date('2026-03-01T00:00:00'),
            monthsToShow: 2
        });

        calendar.updateOptions({ layout: 'vertical' });

        expect(document.querySelector('.bp-calendar-wrapper').getAttribute('data-layout')).toBe('vertical');
    });

    it('applies vertical layout metadata to datepicker popup calendars', () => {
        document.body.innerHTML = '<div id="calendar"></div>';

        new BPCalendar('#calendar', {
            mode: 'datepicker',
            startDate: new Date('2026-03-01T00:00:00'),
            monthsToShow: 2,
            layout: 'vertical'
        });

        const popup = document.querySelector('.bp-calendar-datepicker-popup');
        const wrapper = popup.querySelector('.bp-calendar-wrapper');

        expect(popup.getAttribute('data-layout')).toBe('vertical');
        expect(wrapper.getAttribute('data-layout')).toBe('vertical');
        expect(wrapper.querySelectorAll('.bp-calendar-month')).toHaveLength(2);
    });

    it('rejects unsupported layout values', () => {
        document.body.innerHTML = '<div id="calendar"></div>';

        expect(() => new BPCalendar('#calendar', { layout: 'stacked' }))
            .toThrow("layout must be either 'horizontal' or 'vertical'");
    });
});
