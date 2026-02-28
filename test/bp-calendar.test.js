/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BPCalendar, resolveDatepickerAutoPlacement } from '../bp-calendar.js';

function setViewportWidth(width) {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: width
    });
}

function createRect({ left, top = 0, width, height = 40 }) {
    return {
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON() {
            return this;
        }
    };
}

function monthsBetween(start, end) {
    return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
}

describe('resolveDatepickerAutoPlacement', () => {
    it('centers the popup when there is room on both sides', () => {
        expect(resolveDatepickerAutoPlacement({
            viewportWidth: 1200,
            inputLeft: 400,
            inputRight: 580,
            popupWidth: 300
        })).toEqual({
            fits: true,
            mode: 'center',
            leftViewport: 340
        });
    });

    it('aligns to the input left edge when centered placement crosses the left viewport edge', () => {
        expect(resolveDatepickerAutoPlacement({
            viewportWidth: 900,
            inputLeft: 30,
            inputRight: 210,
            popupWidth: 300
        })).toEqual({
            fits: true,
            mode: 'left',
            leftViewport: 30
        });
    });

    it('aligns to the input right edge when centered placement crosses the right viewport edge', () => {
        expect(resolveDatepickerAutoPlacement({
            viewportWidth: 900,
            inputLeft: 690,
            inputRight: 870,
            popupWidth: 300
        })).toEqual({
            fits: true,
            mode: 'right',
            leftViewport: 570
        });
    });

    it('signals fallback when neither centered nor edge-aligned placement fits', () => {
        expect(resolveDatepickerAutoPlacement({
            viewportWidth: 700,
            inputLeft: 150,
            inputRight: 330,
            popupWidth: 620
        })).toEqual({
            fits: false,
            mode: 'fallback',
            leftViewport: null
        });
    });
});

describe('BPCalendar datepicker auto placement', () => {
    let container;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        setViewportWidth(700);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    function mockGeometry(calendar, widthsByMonths, anchorRect = null) {
        const containerRect = createRect({ left: 100, top: 20, width: 400, height: 80 });
        const inputRect = createRect({ left: 150, top: 30, width: 180, height: 44 });

        calendar.container.getBoundingClientRect = () => containerRect;
        calendar.dateInput.getBoundingClientRect = () => inputRect;
        if (anchorRect) {
            const anchorElement = document.createElement('div');
            anchorElement.getBoundingClientRect = () => anchorRect;
            document.body.appendChild(anchorElement);
            calendar.options.datepickerAnchorElement = anchorElement;
        }
        calendar.popupWrapper.getBoundingClientRect = () => {
            const width = widthsByMonths[calendar.renderedMonthsToShow] ?? widthsByMonths.default ?? 320;
            return {
                left: inputRect.left,
                top: inputRect.bottom + 5,
                width,
                height: 360,
                right: inputRect.left + width,
                bottom: inputRect.bottom + 365,
                x: inputRect.left,
                y: inputRect.bottom + 5,
                toJSON() {
                    return this;
                }
            };
        };
    }

    it('temporarily falls back to one popup month and restores the base month count when space returns', () => {
        const calendar = new BPCalendar(container, {
            mode: 'datepicker',
            monthsToShow: 2,
            breakpoints: {},
            datepickerPlacement: 'auto'
        });

        mockGeometry(calendar, { 1: 300, 2: 620 });

        calendar.showPopup();

        expect(calendar.renderedMonthsToShow).toBe(1);
        expect(calendar.popupAutoMonthsOverride).toBe(1);
        expect(calendar.popupWrapper.classList.contains('bp-calendar-datepicker-popup--mobile-center')).toBe(false);

        setViewportWidth(1200);
        window.dispatchEvent(new Event('resize'));

        expect(calendar.renderedMonthsToShow).toBe(2);
        expect(calendar.popupAutoMonthsOverride).toBe(null);
        expect(calendar.popupWrapper.style.left).toBe('50px');

        calendar.destroy();
    });

    it('uses the custom placement anchor when provided', () => {
        const calendar = new BPCalendar(container, {
            mode: 'datepicker',
            monthsToShow: 2,
            breakpoints: {},
            datepickerPlacement: 'auto'
        });

        mockGeometry(
            calendar,
            { 1: 300, 2: 620 },
            createRect({ left: 20, top: 24, width: 280, height: 60 })
        );

        calendar.showPopup();

        expect(calendar.renderedMonthsToShow).toBe(2);
        expect(calendar.popupWrapper.style.left).toBe('-80px');

        calendar.destroy();
    });

    it('navigates by the actual rendered popup month count after auto fallback', () => {
        const calendar = new BPCalendar(container, {
            mode: 'datepicker',
            monthsToShow: 2,
            breakpoints: {},
            datepickerPlacement: 'auto'
        });

        mockGeometry(calendar, { 1: 300, 2: 620 });
        calendar.showPopup();

        const navRight = calendar.popupWrapper.querySelector('.bp-calendar-nav-right');
        const navLeft = calendar.popupWrapper.querySelector('.bp-calendar-nav-left');
        const initialDate = new Date(calendar.currentDate);

        navRight.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(monthsBetween(initialDate, calendar.currentDate)).toBe(1);

        setViewportWidth(1200);
        window.dispatchEvent(new Event('resize'));

        const widenedDate = new Date(calendar.currentDate);
        navLeft.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(monthsBetween(calendar.currentDate, widenedDate)).toBe(2);

        calendar.destroy();
    });
});
