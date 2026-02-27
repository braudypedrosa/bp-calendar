/**
 * BP Calendar - A lightweight, dynamic calendar library
 * 
 * This library creates a beautiful, customizable calendar component
 * that displays multiple months side by side with navigation controls.
 * Supports both single date and date range selection modes.
 *
 * @class BPCalendar
 * @version 1.0.0
 */
class BPCalendar {
    /**
     * Creates an instance of BPCalendar
     * 
     * @param {HTMLElement|string} container - The container element or selector where the calendar will be rendered
     * @param {Object} options - Configuration options for the calendar
     * @param {Date} options.startDate - The starting date to display (defaults to current date)
     * @param {number} options.monthsToShow - Number of months to display (1-4, default: 2)
     * @param {string} options.mode - Selection mode: 'single', 'range', or 'datepicker' (default: 'single')
     * @param {Function} options.onDateSelect - Callback function when a date is clicked (single mode)
     * @param {Function} options.onRangeSelect - Callback function when a range is selected (range mode)
     * @param {Object} options.dateConfig - Per-date config keyed by YYYY-MM-DD. Each value: { date, isDisabled, price, minDays, maxDays }
     * @param {number} options.defaultMinDays - Fallback min nights for message when no range selected (default: 1)
     * @param {Date} options.selectedDate - The initially selected date (single mode)
     * @param {Object} options.selectedRange - The initially selected range (range mode) { start: Date, end: Date }
     * @param {string} options.tooltipLabel - Custom label for tooltip (e.g., 'Nights', 'Days', 'Stays'). Default: 'Nights'
     * @param {boolean} options.showTooltip - Show tooltip on hover (default: true)
     * @param {boolean} options.showClearButton - Show the built-in Clear button (range/datepicker mode). Default: true. Set false to hide (e.g. when using a custom Clear in modal footer).
     * @param {'default'|'auto'} options.datepickerPlacement - Popup placement strategy for datepicker mode. 'default' keeps existing behavior; 'auto' enables viewport edge-aware alignment.
     * @param {Object<number, (number|{monthsToShow:number})>} options.breakpoints - Responsive monthsToShow overrides keyed by max viewport width (px), e.g. { 1024: 1, 768: { monthsToShow: 1 } }.
     */
    constructor(container, options = {}) {
        // Store the container element
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        // Validate that container exists
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // Validate and set monthsToShow (1-4, default 2)
        const monthsToShow = options.monthsToShow || 2;
        if (monthsToShow < 1 || monthsToShow > 4) {
            throw new Error('monthsToShow must be between 1 and 4');
        }

        // dateConfig: object keyed by YYYY-MM-DD; each value { date, isDisabled, price, minDays, maxDays }
        const dateConfig = options.dateConfig && typeof options.dateConfig === 'object' ? options.dateConfig : {};

        // Set default options and merge with user-provided options
        this.options = {
            startDate: options.startDate || new Date(),
            monthsToShow: monthsToShow,
            mode: options.mode || 'single', // 'single', 'range', or 'datepicker'
            onDateSelect: options.onDateSelect || null,
            onRangeSelect: options.onRangeSelect || null,
            dateConfig: dateConfig,
            defaultMinDays: options.defaultMinDays !== undefined ? options.defaultMinDays : 1,
            selectedDate: options.selectedDate || null,
            selectedRange: options.selectedRange || null,
            tooltipLabel: options.tooltipLabel || 'Nights',
            showTooltip: options.showTooltip !== false,
            showClearButton: options.showClearButton !== false,
            breakpoints: { 768: 1 },
            ...options,
            datepickerPlacement: options.datepickerPlacement === 'auto' ? 'auto' : 'default'
        };
        this.responsiveBreakpoints = this.normalizeBreakpoints(this.options.breakpoints);

        // For range mode, track selection state
        // Store two selected dates, then determine start/end automatically
        this.rangeSelection = {
            date1: null,  // First selected date
            date2: null,  // Second selected date
            start: null,  // Calculated start (earlier date)
            end: null,    // Calculated end (later date)
            tempEnd: null // Temporary end date while hovering
        };
        
        // Only set if explicitly provided in options
        if (this.options.selectedRange?.start && this.options.selectedRange?.end) {
            const start = new Date(this.options.selectedRange.start);
            const end = new Date(this.options.selectedRange.end);
            this.rangeSelection.date1 = start < end ? start : end;
            this.rangeSelection.date2 = start < end ? end : start;
            this.rangeSelection.start = this.rangeSelection.date1;
            this.rangeSelection.end = this.rangeSelection.date2;
        }

        // Store the current displayed month
        this.currentDate = new Date(this.options.startDate);
        
        // Initialize the calendar
        this.init();
    }

    /**
     * Initializes the calendar by rendering it for the first time
     */
    init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Renders the calendar HTML structure
     * This creates the multi-month layout with navigation arrows
     */
    render() {
        // Clear any existing content
        this.container.innerHTML = '';

        // For datepicker mode, create input fields and popup calendar
        if (this.options.mode === 'datepicker') {
            this.renderDatepicker();
            return;
        }

        // For single and range modes, render the calendar directly
        this.renderCalendar();
    }

    /**
     * Renders the datepicker mode with input fields and popup calendar
     */
    renderDatepicker() {
        // Create datepicker wrapper (clicking anywhere on it can open the popup)
        const datepickerWrapper = document.createElement('div');
        datepickerWrapper.className = 'bp-calendar-datepicker-wrapper';
        this.datepickerWrapper = datepickerWrapper;

        // Create single input field (like Airbnb)
        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.className = 'bp-calendar-datepicker-input';
        dateInput.placeholder = 'Check in — Check out';
        dateInput.readOnly = true;
        this.dateInput = dateInput;

        datepickerWrapper.appendChild(dateInput);
        
        // Create popup calendar container (initially hidden)
        const popupWrapper = document.createElement('div');
        popupWrapper.className = 'bp-calendar-datepicker-popup';
        popupWrapper.style.display = 'none';
        this.popupWrapper = popupWrapper;
        
        // Create calendar inside popup (will use range mode internally)
        const calendarWrapper = document.createElement('div');
        calendarWrapper.className = 'bp-calendar-wrapper';
        const monthsToShow = this.getEffectiveMonthsToShow();
        calendarWrapper.setAttribute('data-months', monthsToShow);
        this.calendarWrapper = calendarWrapper;
        
        popupWrapper.appendChild(calendarWrapper);
        datepickerWrapper.appendChild(popupWrapper);
        
        // Add to container
        this.container.appendChild(datepickerWrapper);
        
        // Render the calendar inside popup
        this.renderCalendarInPopup();
        
        // Set initial values if provided
        if (this.options.selectedRange?.start && this.options.selectedRange?.end) {
            this.updateDateInput();
        }
        
        // Attach datepicker event listeners
        this.attachDatepickerListeners();
    }

    /**
     * Renders the calendar inside the datepicker popup
     */
    renderCalendarInPopup() {
        // Clear existing calendar content
        this.calendarWrapper.innerHTML = '';
        const monthsToShow = this.getEffectiveMonthsToShow();
        this.calendarWrapper.setAttribute('data-months', monthsToShow);
        this.renderedMonthsToShow = monthsToShow;

        // Create the months container
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'bp-calendar-months';

        // Render the specified number of months
        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(this.currentDate);
            monthDate.setMonth(monthDate.getMonth() + i);
            const month = this.renderMonth(monthDate);
            monthsContainer.appendChild(month);
        }

        this.calendarWrapper.appendChild(monthsContainer);

        // For datepicker mode, add navigation to popup wrapper (only on first render; keep existing nav when updating months)
        if (this.options.mode === 'datepicker') {
            const existingNavLeft = this.popupWrapper.querySelector('.bp-calendar-nav-left');
            const existingNavRight = this.popupWrapper.querySelector('.bp-calendar-nav-right');
            if (!existingNavLeft || !existingNavRight) {
                // First render: create and append nav buttons
                const navLeft = document.createElement('button');
                navLeft.className = 'bp-calendar-nav bp-calendar-nav-left bp-calendar-datepicker-nav';
                navLeft.setAttribute('aria-label', 'Previous months');
                navLeft.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                navLeft.style.position = 'absolute';
                navLeft.style.left = '8px';
                navLeft.style.zIndex = '10';
                navLeft.style.backgroundColor = 'transparent';
                navLeft.style.border = 'none';
                navLeft.style.width = '32px';
                navLeft.style.height = '32px';
                navLeft.style.display = 'flex';
                navLeft.style.alignItems = 'center';
                navLeft.style.justifyContent = 'center';
                this.popupWrapper.appendChild(navLeft);

                const navRight = document.createElement('button');
                navRight.className = 'bp-calendar-nav bp-calendar-nav-right bp-calendar-datepicker-nav';
                navRight.setAttribute('aria-label', 'Next months');
                navRight.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                navRight.style.position = 'absolute';
                navRight.style.right = '8px';
                navRight.style.zIndex = '10';
                navRight.style.backgroundColor = 'transparent';
                navRight.style.border = 'none';
                navRight.style.width = '32px';
                navRight.style.height = '32px';
                navRight.style.display = 'flex';
                navRight.style.alignItems = 'center';
                navRight.style.justifyContent = 'center';
                this.popupWrapper.appendChild(navRight);
            }
            // If nav already exists, leave it in place so the clicked element is never removed (avoids retargeted outside-click)
        } else {
            // Create navigation arrows for regular calendar
            const navLeft = document.createElement('button');
            navLeft.className = 'bp-calendar-nav bp-calendar-nav-left';
            navLeft.setAttribute('aria-label', 'Previous months');
            navLeft.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            this.calendarWrapper.appendChild(navLeft);
            
            const navRight = document.createElement('button');
            navRight.className = 'bp-calendar-nav bp-calendar-nav-right';
            navRight.setAttribute('aria-label', 'Next months');
            navRight.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            this.calendarWrapper.appendChild(navRight);
        }

        // Create clear button wrapper (for range mode and datepicker mode)
        if (!this.clearButtonWrapper) {
            this.clearButtonWrapper = document.createElement('div');
            this.clearButtonWrapper.className = 'bp-calendar-clear-wrapper';
            
            // Add message for datepicker mode (dates on first line, availability message on second line under)
            if (this.options.mode === 'datepicker') {
                const messagesWrap = document.createElement('div');
                messagesWrap.className = 'bp-calendar-datepicker-messages';
                const message = document.createElement('div');
                message.className = 'bp-calendar-datepicker-message';
                this.datepickerMessage = message;
                const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
                message.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? 'night' : 'nights'}`;
                messagesWrap.appendChild(message);
                const availabilityEl = document.createElement('div');
                availabilityEl.className = 'bp-calendar-datepicker-availability';
                availabilityEl.style.display = 'none';
                this.datepickerAvailabilityEl = availabilityEl;
                messagesWrap.appendChild(availabilityEl);
                this.clearButtonWrapper.appendChild(messagesWrap);
            }
            
            const clearButton = document.createElement('button');
            clearButton.className = 'bp-calendar-clear';
            clearButton.setAttribute('aria-label', 'Clear selection');
            clearButton.textContent = 'Clear';
            clearButton.style.display = 'none';
            this.clearButtonWrapper.appendChild(clearButton);
        } else {
            // Update message if it exists
            const existingMessagesWrap = this.clearButtonWrapper.querySelector('.bp-calendar-datepicker-messages');
            const existingMessage = this.clearButtonWrapper.querySelector('.bp-calendar-datepicker-message');
            let existingAvailability = this.clearButtonWrapper.querySelector('.bp-calendar-datepicker-availability');
            if (this.options.mode === 'datepicker') {
                if (!existingMessage) {
                    const messagesWrap = document.createElement('div');
                    messagesWrap.className = 'bp-calendar-datepicker-messages';
                    const message = document.createElement('div');
                    message.className = 'bp-calendar-datepicker-message';
                    this.datepickerMessage = message;
                    const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
                    message.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? 'night' : 'nights'}`;
                    messagesWrap.appendChild(message);
                    const availabilityEl = document.createElement('div');
                    availabilityEl.className = 'bp-calendar-datepicker-availability';
                    availabilityEl.style.display = 'none';
                    this.datepickerAvailabilityEl = availabilityEl;
                    messagesWrap.appendChild(availabilityEl);
                    this.clearButtonWrapper.insertBefore(messagesWrap, this.clearButtonWrapper.querySelector('.bp-calendar-clear'));
                } else {
                    this.datepickerMessage = existingMessage;
                    if (!existingAvailability && existingMessagesWrap) {
                        const availabilityEl = document.createElement('div');
                        availabilityEl.className = 'bp-calendar-datepicker-availability';
                        availabilityEl.style.display = 'none';
                        this.datepickerAvailabilityEl = availabilityEl;
                        existingMessagesWrap.appendChild(availabilityEl);
                    } else {
                        this.datepickerAvailabilityEl = existingAvailability;
                    }
                    // Update message text if no dates selected
                    if (!this.rangeSelection.start || !this.rangeSelection.end) {
                        const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
                        existingMessage.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? 'night' : 'nights'}`;
                        this.setAvailabilityMessage('', null);
                    }
                }
            } else {
                if (existingMessagesWrap) existingMessagesWrap.remove();
                else {
                    if (existingMessage) existingMessage.remove();
                    if (existingAvailability) existingAvailability.remove();
                }
                this.datepickerAvailabilityEl = null;
            }
        }
        
        this.calendarWrapper.appendChild(this.clearButtonWrapper);

        // Create tooltip element for range mode
        this.createTooltip();
    }

    /**
     * Renders the standard calendar (for single and range modes)
     */
    renderCalendar() {
        // Create the main calendar wrapper
        const monthsToShow = this.getEffectiveMonthsToShow();
        const calendarWrapper = document.createElement('div');
        calendarWrapper.className = 'bp-calendar-wrapper';
        calendarWrapper.setAttribute('data-months', monthsToShow);
        this.renderedMonthsToShow = monthsToShow;

        // Create navigation arrow (left - previous months)
        const navLeft = document.createElement('button');
        navLeft.className = 'bp-calendar-nav bp-calendar-nav-left';
        navLeft.setAttribute('aria-label', 'Previous months');
        navLeft.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        calendarWrapper.appendChild(navLeft);

        // Create the months container
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'bp-calendar-months';

        // Render the specified number of months
        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(this.currentDate);
            monthDate.setMonth(monthDate.getMonth() + i);
            const month = this.renderMonth(monthDate);
            monthsContainer.appendChild(month);
        }

        calendarWrapper.appendChild(monthsContainer);

        // Create navigation arrow (right - next months)
        const navRight = document.createElement('button');
        navRight.className = 'bp-calendar-nav bp-calendar-nav-right';
        navRight.setAttribute('aria-label', 'Next months');
        navRight.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        calendarWrapper.appendChild(navRight);

        // Add the calendar to the container
        this.container.appendChild(calendarWrapper);

        // Create clear button wrapper at the bottom (if in range mode and showClearButton is true)
        if (this.options.mode === 'range' && this.options.showClearButton) {
            if (!this.clearButtonWrapper) {
                this.clearButtonWrapper = document.createElement('div');
                this.clearButtonWrapper.className = 'bp-calendar-clear-wrapper';
                
                const clearButton = document.createElement('button');
                clearButton.className = 'bp-calendar-clear';
                clearButton.setAttribute('aria-label', 'Clear selection');
                clearButton.textContent = 'Clear';
                clearButton.style.display = 'none';
                this.clearButtonWrapper.appendChild(clearButton);
            } else {
                // Clear existing content and recreate
                this.clearButtonWrapper.innerHTML = '';
                const clearButton = document.createElement('button');
                clearButton.className = 'bp-calendar-clear';
                clearButton.setAttribute('aria-label', 'Clear selection');
                clearButton.textContent = 'Clear';
                clearButton.style.display = 'none';
                this.clearButtonWrapper.appendChild(clearButton);
            }
            
            // Append clear button wrapper to container if not already there
            if (!this.container.contains(this.clearButtonWrapper)) {
                this.container.appendChild(this.clearButtonWrapper);
            }
        }

        // Create tooltip element for range mode and datepicker mode
        if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
            this.createTooltip();
        }
    }

    /**
     * Creates a tooltip element for showing range duration
     */
    createTooltip() {
        // Remove existing tooltip if any
        const existingTooltip = document.querySelector('.bp-calendar-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'bp-calendar-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
    }

    /**
     * Shows the tooltip with duration information
     * 
     * @param {HTMLElement} targetElement - The element to position the tooltip above
     * @param {number} nights - Number of nights in the range
     */
    showTooltip(targetElement, nights) {
        if ((this.options.mode !== 'range' && this.options.mode !== 'datepicker') || !this.options.showTooltip) return;

        // Ensure tooltip exists
        if (!this.tooltip || !document.body.contains(this.tooltip)) {
            this.createTooltip();
        }

        // Use custom label or default to 'Nights'
        const label = this.options.tooltipLabel || 'Nights';
        // Handle singular/plural: if label ends with 's', remove it for singular
        const singularLabel = label.endsWith('s') ? label.slice(0, -1) : label;
        const pluralLabel = label;
        
        this.tooltip.textContent = `${nights} ${nights === 1 ? singularLabel : pluralLabel}`;
        
        // Remove constraint class for regular tooltip
        this.tooltip.classList.remove('bp-calendar-tooltip-constraint');
        
        // Set initial position to calculate dimensions
        this.tooltip.style.display = 'block';
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.zIndex = '10000';

        // Force a reflow to ensure tooltip is rendered before getting dimensions
        const height = this.tooltip.offsetHeight;
        const width = this.tooltip.offsetWidth;

        // Position tooltip above the target element
        const rect = targetElement.getBoundingClientRect();
        
        const left = rect.left + (rect.width / 2) - (width / 2);
        const top = rect.top - height - 15;
        
        this.tooltip.style.left = `${Math.max(10, Math.min(left, window.innerWidth - width - 10))}px`;
        this.tooltip.style.top = `${Math.max(10, top)}px`;
        this.tooltip.style.visibility = 'visible'; // Now make it visible
        this.tooltip.style.pointerEvents = 'none'; // Don't block mouse events
    }

    /**
     * Hides the tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    /**
     * Shows a constraint tooltip for min/max days
     * 
     * @param {HTMLElement} targetElement - The element to position the tooltip above
     * @param {string} constraintType - Either 'min' or 'max'
     * @param {number} days - The minimum or maximum number of days
     */
    showConstraintTooltip(targetElement, constraintType, days) {
        if ((this.options.mode !== 'range' && this.options.mode !== 'datepicker') || !this.options.showTooltip) return;
        
        // Ensure tooltip exists
        if (!this.tooltip || !document.body.contains(this.tooltip)) {
            this.createTooltip();
        }
        
        // Use custom label or default to 'Nights'
        const label = this.options.tooltipLabel || 'Nights';
        // Handle singular/plural: if label ends with 's', remove it for singular
        const singularLabel = label.endsWith('s') ? label.slice(0, -1) : label;
        const pluralLabel = label;
        
        // Set tooltip text based on constraint type
        const labelText = days === 1 ? singularLabel : pluralLabel;
        const constraintText = constraintType === 'min' 
            ? `Min. of ${days} ${labelText}`
            : `Max. of ${days} ${labelText}`;
        
        this.tooltip.textContent = constraintText;
        
        // Add constraint class for reddish background
        this.tooltip.classList.add('bp-calendar-tooltip-constraint');
        
        // Position tooltip
        this.tooltip.style.display = 'block';
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.zIndex = '10000';
        
        // Force a reflow to ensure tooltip is rendered before getting dimensions
        const height = this.tooltip.offsetHeight;
        const width = this.tooltip.offsetWidth;
        
        // Position tooltip above the target element
        const rect = targetElement.getBoundingClientRect();
        const left = rect.left + (rect.width / 2) - (width / 2);
        const top = rect.top - height - 15;
        
        this.tooltip.style.left = `${Math.max(10, Math.min(left, window.innerWidth - width - 10))}px`;
        this.tooltip.style.top = `${Math.max(10, top)}px`;
        this.tooltip.style.visibility = 'visible'; // Now make it visible
        this.tooltip.style.pointerEvents = 'none'; // Don't block mouse events
    }
    
    /**
     * Renders a single month calendar
     * 
     * @param {Date} date - The date object representing the month to render
     * @returns {HTMLElement} The month element
     */
    renderMonth(date) {
        // Create the month container
        const monthElement = document.createElement('div');
        monthElement.className = 'bp-calendar-month';

        // Get month name and year
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Create month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'bp-calendar-month-header';
        monthHeader.textContent = monthName;
        monthElement.appendChild(monthHeader);

        // Create days of week header
        const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const daysHeader = document.createElement('div');
        daysHeader.className = 'bp-calendar-days-header';
        
        daysOfWeek.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'bp-calendar-day-header';
            dayElement.textContent = day;
            daysHeader.appendChild(dayElement);
        });
        
        monthElement.appendChild(daysHeader);

        // Create the calendar grid
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'bp-calendar-grid';

        // Get the first day of the month and the number of days
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Get today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'bp-calendar-day bp-calendar-day-empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'bp-calendar-day';
            
            // Create a date object for this day
            const cellDate = new Date(date.getFullYear(), date.getMonth(), day);
            cellDate.setHours(0, 0, 0, 0);
            
            // Format date as YYYY-MM-DD for comparison
            const dateString = this.formatDate(cellDate);
            
            // Add data attribute for easy lookup
            dayCell.setAttribute('data-date', dateString);
            
            // Create date number container
            const dateNumber = document.createElement('div');
            dateNumber.className = 'bp-calendar-day-number';
            dateNumber.textContent = day;
            dayCell.appendChild(dateNumber);
            
            // Store the date number element for dot positioning
            dayCell.dateNumberElement = dateNumber;

            // Check if this date is in the past (before today)
            const isPastDate = cellDate < today;
            const isToday = cellDate.getTime() === today.getTime();
            
            // Always disable past dates in all modes
            if (isPastDate) {
                dayCell.classList.add('bp-calendar-day-past');
            }
            
            // Highlight today's date differently
            if (isToday) {
                dayCell.classList.add('bp-calendar-day-today');
            }

            // Handle range mode and datepicker mode (datepicker uses range internally)
            if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
                this.applyRangeStyling(dayCell, cellDate);
            } else {
                // Single date mode
                const selectedDate = this.options.selectedDate 
                    ? new Date(this.options.selectedDate)
                    : null;
                if (selectedDate) {
                    selectedDate.setHours(0, 0, 0, 0);
                    if (cellDate.getTime() === selectedDate.getTime()) {
                        dayCell.classList.add('bp-calendar-day-selected');
                    }
                }
            }

            // Check if this date is disabled (from dateConfig)
            const config = this.getDateConfig(dateString);
            const isDisabled = config.isDisabled;
            if (isDisabled) {
                dayCell.classList.add('bp-calendar-day-disabled');
            }
            
            // Check for price in dateConfig
            const priceVal = config.price;
            if (priceVal != null && priceVal !== '') {
                const priceElement = document.createElement('div');
                priceElement.className = 'bp-calendar-day-price';
                priceElement.textContent = typeof priceVal === 'number' ? String(priceVal) : priceVal;
                dayCell.appendChild(priceElement);
            }

            // Only add click handler if date is not past and not disabled
            // Past dates are disabled in all modes
            const canSelect = !isPastDate && !isDisabled;
            
            if (canSelect) {
                // Always add click handler for selectable dates
                dayCell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleDateClick(cellDate, dayCell);
                });

                // For range mode and datepicker mode, add hover effects (only for future dates)
                if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
                    dayCell.addEventListener('mouseenter', (e) => {
                        e.stopPropagation();
                        this.handleDateHover(cellDate, dayCell);
                    });
                }
            }

            calendarGrid.appendChild(dayCell);
        }

        monthElement.appendChild(calendarGrid);

        return monthElement;
    }

    /**
     * Applies range styling to a date cell
     * Handles both normal and reverse selection preview
     * 
     * @param {HTMLElement} dayCell - The day cell element
     * @param {Date} cellDate - The date for this cell
     */
    applyRangeStyling(dayCell, cellDate) {
        const date1 = this.rangeSelection.date1;
        const date2 = this.rangeSelection.date2;
        const tempEnd = this.rangeSelection.tempEnd;
        
        // If we have both dates selected, use calculated start/end
        let start, end;
        if (this.rangeSelection.start && this.rangeSelection.end) {
            start = this.rangeSelection.start;
            end = this.rangeSelection.end;
        }
        // If we have date1 and tempEnd (hovering), calculate preview
        else if (date1 && tempEnd) {
            if (tempEnd < date1) {
                start = tempEnd;
                end = date1;
            } else {
                start = date1;
                end = tempEnd;
            }
        }
        // If we only have date1, highlight just that date
        else if (date1) {
            const cellTime = cellDate.getTime();
            const date1Time = date1.getTime();
            if (cellTime === date1Time) {
                dayCell.classList.add('bp-calendar-day-range-start');
            }
            return;
        }
        // No selection yet
        else {
            return;
        }

        const cellTime = cellDate.getTime();
        const startTime = start.getTime();
        const endTime = end.getTime();

        // Check if this is the start date
        if (cellTime === startTime) {
            dayCell.classList.add('bp-calendar-day-range-start');
            // If start and end are the same
            if (cellTime === endTime) {
                dayCell.classList.add('bp-calendar-day-range-end');
            }
        }
        // Check if this is the end date (same orange color as start)
        else if (cellTime === endTime) {
            dayCell.classList.add('bp-calendar-day-range-end');
            dayCell.classList.add('bp-calendar-day-range-start'); // Same orange color
        }
        // Check if this date is in the range (between start and end)
        else if (cellTime > startTime && cellTime < endTime) {
            dayCell.classList.add('bp-calendar-day-in-range');
        }
    }

    /**
     * Handles date click events
     * 
     * @param {Date} date - The clicked date
     * @param {HTMLElement} dayCell - The day cell element
     */
    handleDateClick(date) {
        if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
            this.handleRangeSelection(date);
        } else {
            this.selectDate(date);
        }
    }

    /**
     * Handles range selection logic
     * User selects two dates - whichever is earlier becomes start, later becomes end
     * 
     * @param {Date} date - The clicked date
     */
    handleRangeSelection(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ensure we only allow future dates (including today)
        if (date < today) {
            return; // Don't allow past dates
        }

        const date1 = this.rangeSelection.date1;
        const date2 = this.rangeSelection.date2;
        const dateTime = date.getTime();

        // If no first date selected, set it
        if (!date1) {
            const normalizedDate = new Date(date);
            normalizedDate.setHours(0, 0, 0, 0);
            this.rangeSelection.date1 = normalizedDate;
            this.rangeSelection.date2 = null;
            this.rangeSelection.start = null;
            this.rangeSelection.end = null;
            this.rangeSelection.tempEnd = null;
        }
        // If first date exists but not second, set second date
        else if (!date2) {
            // Don't allow selecting the same date twice
            if (dateTime === date1.getTime()) {
                return;
            }
            
            // Determine which would be start and which would be end (earlier = start, later = end)
            const date1Normalized = new Date(this.rangeSelection.date1);
            date1Normalized.setHours(0, 0, 0, 0);
            
            const dateNormalized = new Date(date);
            dateNormalized.setHours(0, 0, 0, 0);
            
            let potentialStart, potentialEnd;
            if (date1Normalized.getTime() < dateNormalized.getTime()) {
                potentialStart = date1Normalized;
                potentialEnd = dateNormalized;
            } else {
                // Reverse selection - date is earlier
                potentialStart = dateNormalized;
                potentialEnd = date1Normalized;
            }
            
            // Check if there are any disabled dates strictly between start and end
            // We only care about dates that are AFTER start and BEFORE end (not including boundaries)
            if (this.hasDisabledDatesInRange(potentialStart, potentialEnd)) {
                // Don't allow selection if there are disabled dates in between
                return;
            }
            
            // Check minimum and maximum days constraints (from start date's dateConfig)
            const daysInRange = Math.ceil((potentialEnd.getTime() - potentialStart.getTime()) / (1000 * 60 * 60 * 24));
            const startConfig = this.getDateConfig(this.formatDate(potentialStart));
            const minDays = startConfig.minDays != null ? startConfig.minDays : null;
            const maxDays = startConfig.maxDays != null ? startConfig.maxDays : null;
            if (minDays !== null && daysInRange < minDays) {
                return;
            }
            if (maxDays !== null && daysInRange > maxDays) {
                return;
            }
            
            // Create new date objects to avoid reference issues
            this.rangeSelection.date2 = new Date(dateNormalized);
            this.rangeSelection.start = new Date(potentialStart);
            this.rangeSelection.end = new Date(potentialEnd);
            this.rangeSelection.tempEnd = null;
        }
        // If both dates exist, reset and start new selection
        else {
            this.rangeSelection.date1 = new Date(date);
            this.rangeSelection.date2 = null;
            this.rangeSelection.start = null;
            this.rangeSelection.end = null;
            this.rangeSelection.tempEnd = null;
        }

        // Hide tooltip when selection is made
        this.hideTooltip();

        // Re-render to update styling
        if (this.options.mode === 'datepicker') {
            this.renderCalendarInPopup();
            this.attachDatepickerEventListeners();
            // Update input field
            this.updateDateInput();
            // Update selected dates display
            this.updateSelectedDatesDisplay();
        } else {
            this.render();
            this.attachEventListeners();
        }

        // Update clear button visibility
        this.updateClearButton();

        // Call callback if range is complete
        if (this.rangeSelection.start && this.rangeSelection.end) {
            if (this.options.onRangeSelect) {
                this.options.onRangeSelect({
                    start: new Date(this.rangeSelection.start),
                    end: new Date(this.rangeSelection.end)
                });
            }
        }
    }

    /**
     * Handles date hover for range preview
     * Shows tooltip and preview when hovering over potential second date
     * 
     * @param {Date} date - The hovered date
     * @param {HTMLElement} dayCell - The day cell element
     */
    handleDateHover(date, dayCell) {
        const date1 = this.rangeSelection.date1;
        const date2 = this.rangeSelection.date2;

        // Only show preview if we have first date but not second date yet
        if (!date1 || date2) {
            this.hideTooltip();
            // Clear any preview styling
            if (this.rangeSelection.tempEnd) {
                this.clearPreviewStyling();
                this.rangeSelection.tempEnd = null;
            }
            return;
        }

        // Don't show preview if hovering on the same date as date1
        if (date.getTime() === date1.getTime()) {
            this.hideTooltip();
            if (this.rangeSelection.tempEnd) {
                this.clearPreviewStyling();
                this.rangeSelection.tempEnd = null;
            }
            return;
        }

        // Calculate which would be start and end dates
        const previousTempEnd = this.rangeSelection.tempEnd;
        
        // Normalize dates for comparison
        const date1Copy = new Date(date1);
        date1Copy.setHours(0, 0, 0, 0);
        const dateCopy = new Date(date);
        dateCopy.setHours(0, 0, 0, 0);
        
        let startDate, endDate;
        if (dateCopy < date1Copy) {
            startDate = new Date(dateCopy);
            endDate = new Date(date1Copy);
        } else {
            startDate = new Date(date1Copy);
            endDate = new Date(dateCopy);
        }
        
        // Normalize both to midnight
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // Don't show preview if there are disabled dates in the range
        if (this.hasDisabledDatesInRange(startDate, endDate)) {
            this.hideTooltip();
            if (this.rangeSelection.tempEnd) {
                this.clearPreviewStyling();
                this.rangeSelection.tempEnd = null;
            }
            return;
        }

        // Check minimum and maximum days constraints for preview (from start date's dateConfig)
        const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const startConfig = this.getDateConfig(this.formatDate(startDate));
        const minDays = startConfig.minDays != null ? startConfig.minDays : null;
        const maxDays = startConfig.maxDays != null ? startConfig.maxDays : null;
        if (minDays !== null && daysInRange < minDays) {
            this.showConstraintTooltip(dayCell, 'min', minDays);
            if (this.rangeSelection.tempEnd) {
                this.clearPreviewStyling();
                this.rangeSelection.tempEnd = null;
            }
            return;
        }
        if (maxDays !== null && daysInRange > maxDays) {
            this.showConstraintTooltip(dayCell, 'max', maxDays);
            if (this.rangeSelection.tempEnd) {
                this.clearPreviewStyling();
                this.rangeSelection.tempEnd = null;
            }
            return;
        }

        // Show preview for valid date range
        this.rangeSelection.tempEnd = new Date(date);
        
        // Show tooltip
        this.showTooltip(dayCell, daysInRange);

        // Update preview styling without full re-render
        this.updatePreviewStyling(previousTempEnd);
    }
    
    /**
     * Clears preview styling from all cells
     */
    clearPreviewStyling() {
        const cells = this.container.querySelectorAll('.bp-calendar-day');
        cells.forEach(cell => {
            cell.classList.remove('bp-calendar-day-in-range');
            // Don't remove range-start/range-end as those are actual selections
        });
    }
    
    /**
     * Updates preview styling for hover state
     * 
     * @param {Date} previousTempEnd - Previous temp end date to clear
     */
    updatePreviewStyling(previousTempEnd) {
        // Clear previous preview
        const container = this.options.mode === 'datepicker' ? this.calendarWrapper : this.container;
        if (previousTempEnd) {
            const prevDateString = this.formatDate(previousTempEnd);
            const prevCell = container.querySelector(`[data-date="${prevDateString}"]`);
            if (prevCell) {
                prevCell.classList.remove('bp-calendar-day-in-range');
            }
        }
        
        // Apply new preview
        const date1 = this.rangeSelection.date1;
        const tempEnd = this.rangeSelection.tempEnd;
        
        if (!date1 || !tempEnd) return;
        
        let start, end;
        if (tempEnd < date1) {
            start = tempEnd;
            end = date1;
        } else {
            start = date1;
            end = tempEnd;
        }
        
        // Get all cells and update styling
        const cells = container.querySelectorAll('.bp-calendar-day');
        cells.forEach(cell => {
            const cellDateString = cell.getAttribute('data-date');
            if (!cellDateString) return;
            
            const [year, month, day] = cellDateString.split('-').map(Number);
            const cellDate = new Date(year, month - 1, day);
            cellDate.setHours(0, 0, 0, 0);
            
            const cellTime = cellDate.getTime();
            const startTime = start.getTime();
            const endTime = end.getTime();
            
            // Only update in-range styling, don't touch start/end
            if (cellTime > startTime && cellTime < endTime) {
                if (!cell.classList.contains('bp-calendar-day-range-start') && 
                    !cell.classList.contains('bp-calendar-day-range-end')) {
                    cell.classList.add('bp-calendar-day-in-range');
                }
            } else {
                cell.classList.remove('bp-calendar-day-in-range');
            }
        });
    }

    /**
     * Formats a date object as YYYY-MM-DD string
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    /**
     * Formats a date for display in input fields (e.g., "Dec 23, 2025" - Airbnb style)
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[d.getMonth()];
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month} ${day}, ${year}`;
    }

    /**
     * Formats a date as YYYY-MM-DD string
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


    /**
     * Checks if a date is currently selected
     * 
     * @param {Date} date - The date to check
     * @returns {boolean} True if date is selected
     */
    isDateSelected(date) {
        if (this.options.mode === 'range') {
            const date1 = this.rangeSelection.date1;
            const date2 = this.rangeSelection.date2;
            const dateTime = date.getTime();
            
            if (date1 && dateTime === date1.getTime()) return true;
            if (date2 && dateTime === date2.getTime()) return true;
            if (this.rangeSelection.start && dateTime === this.rangeSelection.start.getTime()) return true;
            if (this.rangeSelection.end && dateTime === this.rangeSelection.end.getTime()) return true;
            
            return false;
        } else {
            const selectedDate = this.options.selectedDate;
            if (!selectedDate) return false;
            
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            return date.getTime() === selected.getTime();
        }
    }

    /**
     * Returns per-date config for a date (from dateConfig). Missing dates get a default.
     *
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {{ date: string, isDisabled: boolean, price: number|string|null, minDays: number|null, maxDays: number|null }}
     */
    getDateConfig(dateString) {
        const cfg = this.options.dateConfig && this.options.dateConfig[dateString];
        if (cfg && typeof cfg === 'object') {
            return {
                date: cfg.date != null ? String(cfg.date) : dateString,
                isDisabled: Boolean(cfg.isDisabled),
                price: cfg.price != null ? cfg.price : null,
                minDays: cfg.minDays != null && Number.isInteger(cfg.minDays) ? cfg.minDays : null,
                maxDays: cfg.maxDays != null && Number.isInteger(cfg.maxDays) ? cfg.maxDays : null,
            };
        }
        return {
            date: dateString,
            isDisabled: false,
            price: null,
            minDays: null,
            maxDays: null,
        };
    }

    /**
     * Gets price for a specific date (from dateConfig). Kept for compatibility.
     *
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {Object|null} { price: number|string } or null if no price
     */
    getPriceData(dateString) {
        const config = this.getDateConfig(dateString);
        return config.price != null && config.price !== '' ? { price: config.price } : null;
    }

    /**
     * Checks if there are any disabled dates between start and end dates
     * Only checks dates strictly between start and end (excluding boundaries)
     * 
     * @param {Date} startDate - The start date
     * @param {Date} endDate - The end date
     * @returns {boolean} True if there are disabled dates in the range
     */
    hasDisabledDatesInRange(startDate, endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const startTime = start.getTime();

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        const endTime = end.getTime();

        if (startTime >= endTime) {
            return false;
        }

        const cur = new Date(start);
        cur.setDate(cur.getDate() + 1);
        while (cur.getTime() < endTime) {
            const dateString = this.formatDate(cur);
            if (this.getDateConfig(dateString).isDisabled) {
                return true;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return false;
    }

    /**
     * Handles date selection (single mode)
     * 
     * @param {Date} date - The selected date
     */
    selectDate(date) {
        // Update the selected date
        this.options.selectedDate = date;

        // Re-render to update the visual state
        this.render();
        this.attachEventListeners();

        // Update clear button visibility
        this.updateClearButton();

        // Call the callback if provided
        if (this.options.onDateSelect) {
            this.options.onDateSelect(date);
        }
    }

    /**
     * Clears the current selection (range or single)
     */
    clearSelection() {
        if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
            this.rangeSelection = {
                date1: null,
                date2: null,
                start: null,
                end: null,
                tempEnd: null
            };
            // Notify consumer so they can reset derived state (e.g. price header to daily)
            if (this.options.onRangeSelect) {
                this.options.onRangeSelect({ start: null, end: null });
            }
        } else {
            this.options.selectedDate = null;
        }

        // Hide tooltip
        this.hideTooltip();

        // Re-render to update visual state
        if (this.options.mode === 'datepicker') {
            this.renderCalendarInPopup();
            this.attachDatepickerEventListeners();
            // Update selected dates display
            this.updateSelectedDatesDisplay();
            // Update input field
            this.updateDateInput();
        } else {
            this.render();
            this.attachEventListeners();
        }
    }

    /**
     * Updates the visibility of the clear button
     */
    updateClearButton() {
        const container = this.options.mode === 'datepicker' ? this.calendarWrapper : this.container;
        const clearButton = container ? container.querySelector('.bp-calendar-clear') : null;
        if (!clearButton) return;
        
        if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
            // Show button if at least one date is selected (date1 or date2)
            const hasSelection = this.rangeSelection.date1 !== null || 
                                this.rangeSelection.date2 !== null ||
                                (this.rangeSelection.start && this.rangeSelection.end);
            clearButton.style.display = hasSelection ? 'block' : 'none';
        } else {
            const hasSelection = this.options.selectedDate !== null;
            clearButton.style.display = hasSelection ? 'block' : 'none';
        }
    }

    /**
     * Navigates to the previous month set
     */
    navigatePrevious() {
        this.currentDate.setMonth(this.currentDate.getMonth() - this.getEffectiveMonthsToShow());
        this.render();
        this.attachEventListeners();
    }

    /**
     * Navigates to the next month set
     */
    navigateNext() {
        this.currentDate.setMonth(this.currentDate.getMonth() + this.getEffectiveMonthsToShow());
        this.render();
        this.attachEventListeners();
    }

    /**
     * Attaches event listeners to navigation buttons
     */
    attachEventListeners() {
        // Get the navigation buttons (they're recreated on each render)
        const navLeft = this.container.querySelector('.bp-calendar-nav-left');
        const navRight = this.container.querySelector('.bp-calendar-nav-right');

        if (navLeft) {
            navLeft.addEventListener('click', () => this.navigatePrevious());
        }

        if (navRight) {
            navRight.addEventListener('click', () => this.navigateNext());
        }

        // Add clear button event listener
        const clearButton = this.container.querySelector('.bp-calendar-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearSelection());
        }

        // Hide tooltip when mouse leaves calendar (for range and datepicker modes)
        if (this.options.mode === 'range' || this.options.mode === 'datepicker') {
            const calendarWrapper = this.options.mode === 'datepicker' 
                ? this.calendarWrapper 
                : this.container.querySelector('.bp-calendar-wrapper');
            if (calendarWrapper) {
                calendarWrapper.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                    if (this.rangeSelection.tempEnd) {
                        this.rangeSelection.tempEnd = null;
                        if (this.options.mode === 'datepicker') {
                            this.renderCalendarInPopup();
                            this.attachEventListeners();
                        } else {
                            this.render();
                            this.attachEventListeners();
                        }
                    }
                });
            }
        }
    }

    /**
     * Attaches event listeners for datepicker mode (input fields and popup)
     */
    attachDatepickerListeners() {
        if (this.options.mode !== 'datepicker') return;

        // Ensure document/window listeners are not duplicated across re-renders.
        if (this.clickOutsideHandler) {
            document.removeEventListener('click', this.clickOutsideHandler, true);
            this.clickOutsideHandler = null;
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.datepickerWrapper && this.datepickerWrapperClickHandler) {
            this.datepickerWrapper.removeEventListener('click', this.datepickerWrapperClickHandler);
        }
        if (this.popupWrapper && this.popupWrapperClickHandler) {
            this.popupWrapper.removeEventListener('click', this.popupWrapperClickHandler);
        }

        // Show popup when clicking on the datepicker wrapper (input or area above/beside it)
        if (this.datepickerWrapper) {
            this.datepickerWrapperClickHandler = (e) => {
                e.stopPropagation();
                this.showPopup();
            };
            this.datepickerWrapper.addEventListener('click', this.datepickerWrapperClickHandler);
        }

        // Hide popup when clicking outside
        const clickOutsideHandler = (e) => {
            const target = e.target;
            const clickedNav = target.closest ? target.closest('.bp-calendar-datepicker-nav') : null;
            const inPopup = this.popupWrapper && this.popupWrapper.contains(target);
            const inDatepickerWrapper = this.datepickerWrapper && this.datepickerWrapper.contains(target);

            // Don't close if clicking on navigation buttons or their children (SVG)
            if (clickedNav) {
                return;
            }

            // Don't close if clicking inside the popup
            if (inPopup) {
                return;
            }

            // Don't close if clicking on the datepicker wrapper (input or placeholder area)
            if (inDatepickerWrapper) {
                return;
            }

            // Close if clicking outside
            this.hidePopup();
        };
        
        // Store handler for cleanup
        this.clickOutsideHandler = clickOutsideHandler;
        // Use capture phase to catch events before they bubble
        document.addEventListener('click', clickOutsideHandler, true);

        const resizeHandler = () => {
            if (!this.popupWrapper || this.popupWrapper.style.display === 'none') return;
            const nextMonthsToShow = this.getEffectiveMonthsToShow();
            if (this.renderedMonthsToShow !== nextMonthsToShow) {
                this.renderCalendarInPopup();
                this.attachDatepickerEventListeners();
            }
            this.positionPopup();
        };
        this.resizeHandler = resizeHandler;
        window.addEventListener('resize', resizeHandler);

        // Prevent popup from closing when clicking inside it
        if (this.popupWrapper) {
            this.popupWrapperClickHandler = (e) => {
                e.stopPropagation();
            };
            this.popupWrapper.addEventListener('click', this.popupWrapperClickHandler);
        }

        // Override onRangeSelect to update input and show selected dates (don't close popup)
        const originalOnRangeSelect = this.options.onRangeSelect;
        this.options.onRangeSelect = (range) => {
            // Update input field with formatted range
            this.updateDateInput();
            
            // Update selected dates display at bottom
            this.updateSelectedDatesDisplay();
            
            // Don't hide popup - only closes on outside click
            
            // Call original callback if provided
            if (originalOnRangeSelect) {
                originalOnRangeSelect(range);
            }
        };
        
        // Attach event listeners to the popup calendar
        this.attachDatepickerEventListeners();
    }
    
    /**
     * Updates the date input field with the selected range
     */
    updateDateInput() {
        if (!this.dateInput) return;
        
        if (this.rangeSelection.start && this.rangeSelection.end) {
            const startFormatted = this.formatDateForInput(this.rangeSelection.start);
            const endFormatted = this.formatDateForInput(this.rangeSelection.end);
            this.dateInput.value = `${startFormatted} — ${endFormatted}`;
        } else if (this.rangeSelection.date1) {
            // Only first date selected
            const startFormatted = this.formatDateForInput(this.rangeSelection.date1);
            this.dateInput.value = `${startFormatted} — `;
        } else {
            this.dateInput.value = '';
        }
    }
    
    /**
     * Formats a date as "Month Day, Year" (e.g., "December 23, 2025")
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDateFull(date) {
        if (!date) return '';
        const d = new Date(date);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[d.getMonth()];
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month} ${day}, ${year}`;
    }
    
    /**
     * Updates the selected dates display at the bottom of the datepicker popup
     * Replaces the message with selected dates when dates are selected
     */
    updateSelectedDatesDisplay() {
        if (!this.datepickerMessage || this.options.mode !== 'datepicker') return;
        
        if (this.rangeSelection.start && this.rangeSelection.end) {
            // Show selected dates instead of message
            const startFormatted = this.formatDateFull(this.rangeSelection.start);
            const endFormatted = this.formatDateFull(this.rangeSelection.end);
            this.datepickerMessage.textContent = `${startFormatted} — ${endFormatted}`;
        } else {
            const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
            this.datepickerMessage.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? 'night' : 'nights'}`;
            this.setAvailabilityMessage('', null);
        }
    }
    
    /**
     * Sets the availability message line (below selected dates) for live availability check.
     *
     * @param {string} text Message text (e.g. "Checking availability…", "Selected dates are available.").
     * @param {string|null} status 'loading' | 'success' | 'error', or null to hide/clear.
     */
    setAvailabilityMessage(text, status) {
        if (!this.datepickerAvailabilityEl || this.options.mode !== 'datepicker') return;
        const el = this.datepickerAvailabilityEl;
        el.textContent = text || '';
        el.className = 'bp-calendar-datepicker-availability';
        if (status === 'loading') {
            el.classList.add('bp-calendar-datepicker-availability--loading');
        } else if (status === 'success') {
            el.classList.add('bp-calendar-datepicker-availability--success');
        } else if (status === 'error') {
            el.classList.add('bp-calendar-datepicker-availability--error');
        }
        el.style.display = (text && status) ? '' : 'none';
    }
    
    /**
     * Attaches event listeners for datepicker popup calendar
     */
    attachDatepickerEventListeners() {
        if (!this.calendarWrapper || !this.popupWrapper) return;

        // Get the navigation buttons from popup wrapper (for datepicker mode)
        const navLeft = this.popupWrapper.querySelector('.bp-calendar-nav-left');
        const navRight = this.popupWrapper.querySelector('.bp-calendar-nav-right');

        // Only attach nav listeners once (nav nodes are kept in DOM when updating months)
        if (navLeft && !navLeft.hasAttribute('data-bp-calendar-nav-bound')) {
            navLeft.setAttribute('data-bp-calendar-nav-bound', 'true');
            navLeft.addEventListener('click', (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                this.currentDate.setMonth(this.currentDate.getMonth() - this.getEffectiveMonthsToShow());
                this.renderCalendarInPopup();
                this.attachDatepickerEventListeners();
                return false;
            }, true);
        }

        if (navRight && !navRight.hasAttribute('data-bp-calendar-nav-bound')) {
            navRight.setAttribute('data-bp-calendar-nav-bound', 'true');
            navRight.addEventListener('click', (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                this.currentDate.setMonth(this.currentDate.getMonth() + this.getEffectiveMonthsToShow());
                this.renderCalendarInPopup();
                this.attachDatepickerEventListeners();
                return false;
            }, true);
        }

        // Add clear button event listener
        const clearButton = this.calendarWrapper.querySelector('.bp-calendar-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearSelection();
                if (this.dateInput) this.dateInput.value = '';
            });
        }

        // Update clear button visibility
        this.updateClearButton();

        // Note: Click and hover listeners are already added in renderMonth() method
        // No need to add them again here as renderMonth() handles all modes including datepicker
    }

    /**
     * Shows the datepicker popup
     */
    showPopup() {
        if (this.popupWrapper) {
            this.popupWrapper.style.display = 'block';
            // Position popup below inputs
            this.positionPopup();
        }
    }

    /**
     * Hides the datepicker popup
     */
    hidePopup() {
        if (this.popupWrapper) {
            this.popupWrapper.style.display = 'none';
        }
    }

    /**
     * Positions the datepicker popup relative to the input
     */
    positionPopup() {
        if (!this.popupWrapper || !this.dateInput) return;

        const inputRect = this.dateInput.getBoundingClientRect();
        const wrapperRect = this.container.getBoundingClientRect();
        const popup = this.popupWrapper;
        const gutter = 12;
        const isAutoPlacement = this.options.datepickerPlacement === 'auto';
        const isCompactSingleMonth = this.isBreakpointSingleMonthViewport();

        // Calculate position relative to the wrapper
        const topOffset = inputRect.bottom - wrapperRect.top + 5;
        const leftOffset = inputRect.left - wrapperRect.left;

        const setLeftAlignment = (left, isImportant = false) => {
            popup.style.setProperty('left', `${left}px`, isImportant ? 'important' : '');
            popup.style.setProperty('right', 'auto');
            popup.classList.remove('bp-calendar-datepicker-popup--align-right');
        };

        const setRightAlignment = (right) => {
            popup.style.setProperty('left', 'auto');
            popup.style.setProperty('right', `${right}px`);
            popup.classList.add('bp-calendar-datepicker-popup--align-right');
        };

        // Position below the input (relative to wrapper).
        popup.style.position = 'absolute';
        popup.style.top = `${topOffset}px`;
        popup.style.zIndex = '10000';

        if (isCompactSingleMonth) {
            popup.classList.remove('bp-calendar-datepicker-popup--align-right');
            popup.classList.add('bp-calendar-datepicker-popup--mobile-center');
            popup.style.setProperty('left', '50%', 'important');
            popup.style.setProperty('right', 'auto');
            return;
        }

        popup.classList.remove('bp-calendar-datepicker-popup--mobile-center');

        if (!isAutoPlacement) {
            setLeftAlignment(leftOffset);
            return;
        }

        // Attempt default left alignment first.
        setLeftAlignment(leftOffset);
        let popupRect = popup.getBoundingClientRect();

        // If the popup overflows right edge, align to the right side of the input wrapper.
        if (popupRect.right > window.innerWidth - gutter) {
            const rightOffset = Math.max(0, wrapperRect.right - inputRect.right);
            setRightAlignment(rightOffset);
            popupRect = popup.getBoundingClientRect();

            // Clamp if right-aligned placement still clips on either side.
            if (popupRect.left < gutter || popupRect.right > window.innerWidth - gutter) {
                const maxLeftViewport = Math.max(gutter, window.innerWidth - popupRect.width - gutter);
                const clampedLeftViewport = Math.min(
                    Math.max(popupRect.left, gutter),
                    maxLeftViewport
                );
                const leftRelative = clampedLeftViewport - wrapperRect.left;
                setLeftAlignment(leftRelative, true);
            }
        }
    }

    /**
     * Updates the calendar with new options
     * 
     * @param {Object} newOptions - New options to merge with existing ones
     */
    updateOptions(newOptions) {
        // Validate monthsToShow if provided
        if (newOptions.monthsToShow !== undefined) {
            if (newOptions.monthsToShow < 1 || newOptions.monthsToShow > 4) {
                throw new Error('monthsToShow must be between 1 and 4');
            }
        }

        this.options = { ...this.options, ...newOptions };
        if (newOptions.breakpoints !== undefined) {
            this.responsiveBreakpoints = this.normalizeBreakpoints(newOptions.breakpoints);
        }
        this.renderedMonthsToShow = this.getEffectiveMonthsToShow();
        
        // Update range selection if provided
        if (newOptions.selectedRange) {
            this.rangeSelection.start = newOptions.selectedRange.start ? new Date(newOptions.selectedRange.start) : null;
            this.rangeSelection.end = newOptions.selectedRange.end ? new Date(newOptions.selectedRange.end) : null;
        }

        this.render();
        this.attachEventListeners();
    }

    /**
     * Normalizes responsive breakpoint config into sorted max-width entries.
     *
     * @param {Object<number, (number|{monthsToShow:number})>} breakpoints
     * @returns {Array<{maxWidth:number, monthsToShow:number}>}
     */
    normalizeBreakpoints(breakpoints) {
        if (!breakpoints || typeof breakpoints !== 'object') return [];

        return Object.entries(breakpoints)
            .map(([maxWidthKey, config]) => {
                const maxWidth = Number(maxWidthKey);
                if (!Number.isFinite(maxWidth) || maxWidth <= 0) return null;

                let monthsToShow = null;
                if (typeof config === 'number') {
                    monthsToShow = config;
                } else if (config && typeof config === 'object' && config.monthsToShow !== undefined) {
                    monthsToShow = Number(config.monthsToShow);
                }

                if (!Number.isFinite(monthsToShow)) return null;

                return {
                    maxWidth,
                    monthsToShow: Math.min(4, Math.max(1, Math.round(monthsToShow)))
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.maxWidth - b.maxWidth);
    }

    /**
     * Returns the base non-responsive monthsToShow value.
     *
     * @returns {number}
     */
    getBaseMonthsToShow() {
        const raw = Number(this.options.monthsToShow);
        const months = Number.isFinite(raw) ? raw : 2;
        return Math.min(4, Math.max(1, Math.round(months)));
    }

    /**
     * Returns current viewport width in CSS pixels.
     *
     * @returns {number}
     */
    getViewportWidth() {
        return typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY;
    }

    /**
     * Returns the first matching breakpoint for current viewport width.
     *
     * @returns {{maxWidth:number, monthsToShow:number}|null}
     */
    getMatchedBreakpoint() {
        const viewportWidth = this.getViewportWidth();
        for (let i = 0; i < this.responsiveBreakpoints.length; i += 1) {
            const breakpoint = this.responsiveBreakpoints[i];
            if (viewportWidth <= breakpoint.maxWidth) {
                return breakpoint;
            }
        }
        return null;
    }

    /**
     * True when an active breakpoint reduces datepicker to a single month.
     *
     * @returns {boolean}
     */
    isBreakpointSingleMonthViewport() {
        const matched = this.getMatchedBreakpoint();
        return !!(matched && matched.monthsToShow === 1);
    }

    /**
     * Computes the visible month count for the current viewport.
     *
     * @returns {number}
     */
    getEffectiveMonthsToShow() {
        const matched = this.getMatchedBreakpoint();
        if (matched) return matched.monthsToShow;
        return this.getBaseMonthsToShow();
    }

    /**
     * Gets the currently selected date (single mode)
     * 
     * @returns {Date|null} The selected date
     */
    getSelectedDate() {
        return this.options.selectedDate ? new Date(this.options.selectedDate) : null;
    }

    /**
     * Gets the currently selected range (range mode)
     * 
     * @returns {Object|null} Object with start and end dates, or null
     */
    getSelectedRange() {
        if (!this.rangeSelection.start || !this.rangeSelection.end) {
            return null;
        }
        return {
            start: new Date(this.rangeSelection.start),
            end: new Date(this.rangeSelection.end)
        };
    }

    /**
     * Destroys the calendar instance and removes it from the DOM
     */
    destroy() {
        if (this.clickOutsideHandler) {
            document.removeEventListener('click', this.clickOutsideHandler, true);
            this.clickOutsideHandler = null;
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.datepickerWrapper && this.datepickerWrapperClickHandler) {
            this.datepickerWrapper.removeEventListener('click', this.datepickerWrapperClickHandler);
            this.datepickerWrapperClickHandler = null;
        }

        if (this.popupWrapper && this.popupWrapperClickHandler) {
            this.popupWrapper.removeEventListener('click', this.popupWrapperClickHandler);
            this.popupWrapperClickHandler = null;
        }

        if (this.tooltip) {
            this.tooltip.remove();
        }
        this.container.innerHTML = '';
    }
}

/**
 * Factory function to create a BP Calendar instance
 * This provides a cleaner API: new BP_Calendar('selector', { config })
 * 
 * @param {HTMLElement|string} container - The container element or selector
 * @param {Object} options - Configuration options
 * @returns {BPCalendar} A new BPCalendar instance
 */
function BP_Calendar(container, options = {}) {
    return new BPCalendar(container, options);
}

// Export for use in modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BPCalendar;
    module.exports.BP_Calendar = BP_Calendar;
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.BPCalendar = BPCalendar;
    window.BP_Calendar = BP_Calendar;
}

// ES module export for Vite/bundlers
export { BPCalendar, BP_Calendar };
