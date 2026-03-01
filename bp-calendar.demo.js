var BPCalendarDemo = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../bp-calendar/bp-calendar.js
  var bp_calendar_exports = {};
  __export(bp_calendar_exports, {
    BPCalendar: () => BPCalendar,
    BP_Calendar: () => BP_Calendar,
    resolveDatepickerAutoPlacement: () => resolveDatepickerAutoPlacement
  });
  var DATEPICKER_AUTO_VIEWPORT_GUTTER = 12;
  function resolveDatepickerAutoPlacement({
    viewportWidth,
    inputLeft,
    inputRight,
    popupWidth,
    gutter = DATEPICKER_AUTO_VIEWPORT_GUTTER
  }) {
    const centeredLeft = inputLeft + (inputRight - inputLeft - popupWidth) / 2;
    const centeredRight = centeredLeft + popupWidth;
    const viewportRightLimit = viewportWidth - gutter;
    if (centeredLeft >= gutter && centeredRight <= viewportRightLimit) {
      return {
        fits: true,
        mode: "center",
        leftViewport: centeredLeft
      };
    }
    if (centeredLeft < gutter && centeredRight > viewportRightLimit) {
      return {
        fits: false,
        mode: "fallback",
        leftViewport: null
      };
    }
    if (centeredLeft < gutter) {
      const leftAlignedLeft = inputLeft;
      const leftAlignedRight = leftAlignedLeft + popupWidth;
      if (leftAlignedRight <= viewportRightLimit) {
        return {
          fits: true,
          mode: "left",
          leftViewport: leftAlignedLeft
        };
      }
      return {
        fits: false,
        mode: "fallback",
        leftViewport: null
      };
    }
    if (centeredRight > viewportRightLimit) {
      const rightAlignedLeft = inputRight - popupWidth;
      if (rightAlignedLeft >= gutter) {
        return {
          fits: true,
          mode: "right",
          leftViewport: rightAlignedLeft
        };
      }
      return {
        fits: false,
        mode: "fallback",
        leftViewport: null
      };
    }
    return {
      fits: false,
      mode: "fallback",
      leftViewport: null
    };
  }
  var BPCalendar = class {
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
    * @param {'default'|'auto'} options.datepickerPlacement - Popup placement strategy for datepicker mode. 'default' keeps existing behavior; 'auto' centers when possible, otherwise aligns to the relevant input edge, temporarily falls back to one month when needed, and only then uses the compact clamped fallback.
    * @param {HTMLElement|null} options.datepickerAnchorElement - Optional anchor element used for popup alignment in datepicker mode. Defaults to the date input itself.
        * @param {Object<number, (number|{monthsToShow:number})>} options.breakpoints - Responsive monthsToShow overrides keyed by max viewport width (px), e.g. { 1024: 1, 768: { monthsToShow: 1 } }.
        */
    constructor(container, options = {}) {
      this.container = typeof container === "string" ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error("Container element not found");
      }
      const monthsToShow = options.monthsToShow || 2;
      if (monthsToShow < 1 || monthsToShow > 4) {
        throw new Error("monthsToShow must be between 1 and 4");
      }
      const dateConfig = options.dateConfig && typeof options.dateConfig === "object" ? options.dateConfig : {};
      this.options = {
        startDate: options.startDate || /* @__PURE__ */ new Date(),
        monthsToShow,
        mode: options.mode || "single",
        // 'single', 'range', or 'datepicker'
        onDateSelect: options.onDateSelect || null,
        onRangeSelect: options.onRangeSelect || null,
        dateConfig,
        defaultMinDays: options.defaultMinDays !== void 0 ? options.defaultMinDays : 1,
        selectedDate: options.selectedDate || null,
        selectedRange: options.selectedRange || null,
        tooltipLabel: options.tooltipLabel || "Nights",
        showTooltip: options.showTooltip !== false,
        showClearButton: options.showClearButton !== false,
        breakpoints: { 768: 1 },
        ...options,
        datepickerPlacement: options.datepickerPlacement === "auto" ? "auto" : "default"
      };
      this.responsiveBreakpoints = this.normalizeBreakpoints(this.options.breakpoints);
      this.popupAutoMonthsOverride = null;
      this.renderedMonthsToShow = this.getEffectiveMonthsToShow();
      this.rangeSelection = {
        date1: null,
        // First selected date
        date2: null,
        // Second selected date
        start: null,
        // Calculated start (earlier date)
        end: null,
        // Calculated end (later date)
        tempEnd: null
        // Temporary end date while hovering
      };
      if (this.options.selectedRange?.start && this.options.selectedRange?.end) {
        const start = new Date(this.options.selectedRange.start);
        const end = new Date(this.options.selectedRange.end);
        this.rangeSelection.date1 = start < end ? start : end;
        this.rangeSelection.date2 = start < end ? end : start;
        this.rangeSelection.start = this.rangeSelection.date1;
        this.rangeSelection.end = this.rangeSelection.date2;
      }
      this.currentDate = new Date(this.options.startDate);
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
      this.container.innerHTML = "";
      if (this.options.mode === "datepicker") {
        this.renderDatepicker();
        return;
      }
      this.renderCalendar();
    }
    /**
     * Renders the datepicker mode with input fields and popup calendar
     */
    renderDatepicker() {
      const datepickerWrapper = document.createElement("div");
      datepickerWrapper.className = "bp-calendar-datepicker-wrapper";
      this.datepickerWrapper = datepickerWrapper;
      const dateInput = document.createElement("input");
      dateInput.type = "text";
      dateInput.className = "bp-calendar-datepicker-input";
      dateInput.placeholder = "Check in \u2014 Check out";
      dateInput.readOnly = true;
      this.dateInput = dateInput;
      datepickerWrapper.appendChild(dateInput);
      const popupWrapper = document.createElement("div");
      popupWrapper.className = "bp-calendar-datepicker-popup";
      popupWrapper.style.display = "none";
      this.popupWrapper = popupWrapper;
      const calendarWrapper = document.createElement("div");
      calendarWrapper.className = "bp-calendar-wrapper";
      const monthsToShow = this.getPopupMonthsToShow();
      calendarWrapper.setAttribute("data-months", monthsToShow);
      this.calendarWrapper = calendarWrapper;
      popupWrapper.appendChild(calendarWrapper);
      datepickerWrapper.appendChild(popupWrapper);
      this.container.appendChild(datepickerWrapper);
      this.renderCalendarInPopup();
      if (this.options.selectedRange?.start && this.options.selectedRange?.end) {
        this.updateDateInput();
      }
      this.attachDatepickerListeners();
    }
    /**
     * Renders the calendar inside the datepicker popup
     */
    renderCalendarInPopup() {
      this.calendarWrapper.innerHTML = "";
      const monthsToShow = this.getPopupMonthsToShow();
      this.calendarWrapper.setAttribute("data-months", monthsToShow);
      this.renderedMonthsToShow = monthsToShow;
      const monthsContainer = document.createElement("div");
      monthsContainer.className = "bp-calendar-months";
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(this.currentDate);
        monthDate.setMonth(monthDate.getMonth() + i);
        const month = this.renderMonth(monthDate);
        monthsContainer.appendChild(month);
      }
      this.calendarWrapper.appendChild(monthsContainer);
      if (this.options.mode === "datepicker") {
        const existingNavLeft = this.popupWrapper.querySelector(".bp-calendar-nav-left");
        const existingNavRight = this.popupWrapper.querySelector(".bp-calendar-nav-right");
        if (!existingNavLeft || !existingNavRight) {
          const navLeft = document.createElement("button");
          navLeft.className = "bp-calendar-nav bp-calendar-nav-left bp-calendar-datepicker-nav";
          navLeft.setAttribute("aria-label", "Previous months");
          navLeft.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          navLeft.style.position = "absolute";
          navLeft.style.left = "8px";
          navLeft.style.zIndex = "10";
          navLeft.style.backgroundColor = "transparent";
          navLeft.style.border = "none";
          navLeft.style.width = "32px";
          navLeft.style.height = "32px";
          navLeft.style.display = "flex";
          navLeft.style.alignItems = "center";
          navLeft.style.justifyContent = "center";
          this.popupWrapper.appendChild(navLeft);
          const navRight = document.createElement("button");
          navRight.className = "bp-calendar-nav bp-calendar-nav-right bp-calendar-datepicker-nav";
          navRight.setAttribute("aria-label", "Next months");
          navRight.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          navRight.style.position = "absolute";
          navRight.style.right = "8px";
          navRight.style.zIndex = "10";
          navRight.style.backgroundColor = "transparent";
          navRight.style.border = "none";
          navRight.style.width = "32px";
          navRight.style.height = "32px";
          navRight.style.display = "flex";
          navRight.style.alignItems = "center";
          navRight.style.justifyContent = "center";
          this.popupWrapper.appendChild(navRight);
        }
      } else {
        const navLeft = document.createElement("button");
        navLeft.className = "bp-calendar-nav bp-calendar-nav-left";
        navLeft.setAttribute("aria-label", "Previous months");
        navLeft.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        this.calendarWrapper.appendChild(navLeft);
        const navRight = document.createElement("button");
        navRight.className = "bp-calendar-nav bp-calendar-nav-right";
        navRight.setAttribute("aria-label", "Next months");
        navRight.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        this.calendarWrapper.appendChild(navRight);
      }
      if (!this.clearButtonWrapper) {
        this.clearButtonWrapper = document.createElement("div");
        this.clearButtonWrapper.className = "bp-calendar-clear-wrapper";
        if (this.options.mode === "datepicker") {
          const messagesWrap = document.createElement("div");
          messagesWrap.className = "bp-calendar-datepicker-messages";
          const message = document.createElement("div");
          message.className = "bp-calendar-datepicker-message";
          this.datepickerMessage = message;
          const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
          message.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? "night" : "nights"}`;
          messagesWrap.appendChild(message);
          const availabilityEl = document.createElement("div");
          availabilityEl.className = "bp-calendar-datepicker-availability";
          availabilityEl.style.display = "none";
          this.datepickerAvailabilityEl = availabilityEl;
          messagesWrap.appendChild(availabilityEl);
          this.clearButtonWrapper.appendChild(messagesWrap);
        }
        const clearButton = document.createElement("button");
        clearButton.className = "bp-calendar-clear";
        clearButton.setAttribute("aria-label", "Clear selection");
        clearButton.textContent = "Clear";
        clearButton.style.display = "none";
        this.clearButtonWrapper.appendChild(clearButton);
      } else {
        const existingMessagesWrap = this.clearButtonWrapper.querySelector(".bp-calendar-datepicker-messages");
        const existingMessage = this.clearButtonWrapper.querySelector(".bp-calendar-datepicker-message");
        let existingAvailability = this.clearButtonWrapper.querySelector(".bp-calendar-datepicker-availability");
        if (this.options.mode === "datepicker") {
          if (!existingMessage) {
            const messagesWrap = document.createElement("div");
            messagesWrap.className = "bp-calendar-datepicker-messages";
            const message = document.createElement("div");
            message.className = "bp-calendar-datepicker-message";
            this.datepickerMessage = message;
            const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
            message.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? "night" : "nights"}`;
            messagesWrap.appendChild(message);
            const availabilityEl = document.createElement("div");
            availabilityEl.className = "bp-calendar-datepicker-availability";
            availabilityEl.style.display = "none";
            this.datepickerAvailabilityEl = availabilityEl;
            messagesWrap.appendChild(availabilityEl);
            this.clearButtonWrapper.insertBefore(messagesWrap, this.clearButtonWrapper.querySelector(".bp-calendar-clear"));
          } else {
            this.datepickerMessage = existingMessage;
            if (!existingAvailability && existingMessagesWrap) {
              const availabilityEl = document.createElement("div");
              availabilityEl.className = "bp-calendar-datepicker-availability";
              availabilityEl.style.display = "none";
              this.datepickerAvailabilityEl = availabilityEl;
              existingMessagesWrap.appendChild(availabilityEl);
            } else {
              this.datepickerAvailabilityEl = existingAvailability;
            }
            if (!this.rangeSelection.start || !this.rangeSelection.end) {
              const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
              existingMessage.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? "night" : "nights"}`;
              this.setAvailabilityMessage("", null);
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
      this.createTooltip();
    }
    /**
     * Renders the standard calendar (for single and range modes)
     */
    renderCalendar() {
      const monthsToShow = this.getEffectiveMonthsToShow();
      const calendarWrapper = document.createElement("div");
      calendarWrapper.className = "bp-calendar-wrapper";
      calendarWrapper.setAttribute("data-months", monthsToShow);
      this.renderedMonthsToShow = monthsToShow;
      const navLeft = document.createElement("button");
      navLeft.className = "bp-calendar-nav bp-calendar-nav-left";
      navLeft.setAttribute("aria-label", "Previous months");
      navLeft.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      calendarWrapper.appendChild(navLeft);
      const monthsContainer = document.createElement("div");
      monthsContainer.className = "bp-calendar-months";
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(this.currentDate);
        monthDate.setMonth(monthDate.getMonth() + i);
        const month = this.renderMonth(monthDate);
        monthsContainer.appendChild(month);
      }
      calendarWrapper.appendChild(monthsContainer);
      const navRight = document.createElement("button");
      navRight.className = "bp-calendar-nav bp-calendar-nav-right";
      navRight.setAttribute("aria-label", "Next months");
      navRight.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      calendarWrapper.appendChild(navRight);
      this.container.appendChild(calendarWrapper);
      if (this.options.mode === "range" && this.options.showClearButton) {
        if (!this.clearButtonWrapper) {
          this.clearButtonWrapper = document.createElement("div");
          this.clearButtonWrapper.className = "bp-calendar-clear-wrapper";
          const clearButton = document.createElement("button");
          clearButton.className = "bp-calendar-clear";
          clearButton.setAttribute("aria-label", "Clear selection");
          clearButton.textContent = "Clear";
          clearButton.style.display = "none";
          this.clearButtonWrapper.appendChild(clearButton);
        } else {
          this.clearButtonWrapper.innerHTML = "";
          const clearButton = document.createElement("button");
          clearButton.className = "bp-calendar-clear";
          clearButton.setAttribute("aria-label", "Clear selection");
          clearButton.textContent = "Clear";
          clearButton.style.display = "none";
          this.clearButtonWrapper.appendChild(clearButton);
        }
        if (!this.container.contains(this.clearButtonWrapper)) {
          this.container.appendChild(this.clearButtonWrapper);
        }
      }
      if (this.options.mode === "range" || this.options.mode === "datepicker") {
        this.createTooltip();
      }
    }
    /**
     * Creates a tooltip element for showing range duration
     */
    createTooltip() {
      const existingTooltip = document.querySelector(".bp-calendar-tooltip");
      if (existingTooltip) {
        existingTooltip.remove();
      }
      const tooltip = document.createElement("div");
      tooltip.className = "bp-calendar-tooltip";
      tooltip.style.display = "none";
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
      if (this.options.mode !== "range" && this.options.mode !== "datepicker" || !this.options.showTooltip) return;
      if (!this.tooltip || !document.body.contains(this.tooltip)) {
        this.createTooltip();
      }
      const label = this.options.tooltipLabel || "Nights";
      const singularLabel = label.endsWith("s") ? label.slice(0, -1) : label;
      const pluralLabel = label;
      this.tooltip.textContent = `${nights} ${nights === 1 ? singularLabel : pluralLabel}`;
      this.tooltip.classList.remove("bp-calendar-tooltip-constraint");
      this.tooltip.style.display = "block";
      this.tooltip.style.visibility = "hidden";
      this.tooltip.style.position = "fixed";
      this.tooltip.style.zIndex = "10000";
      const height = this.tooltip.offsetHeight;
      const width = this.tooltip.offsetWidth;
      const rect = targetElement.getBoundingClientRect();
      const left = rect.left + rect.width / 2 - width / 2;
      const top = rect.top - height - 15;
      this.tooltip.style.left = `${Math.max(10, Math.min(left, window.innerWidth - width - 10))}px`;
      this.tooltip.style.top = `${Math.max(10, top)}px`;
      this.tooltip.style.visibility = "visible";
      this.tooltip.style.pointerEvents = "none";
    }
    /**
     * Hides the tooltip
     */
    hideTooltip() {
      if (this.tooltip) {
        this.tooltip.style.display = "none";
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
      if (this.options.mode !== "range" && this.options.mode !== "datepicker" || !this.options.showTooltip) return;
      if (!this.tooltip || !document.body.contains(this.tooltip)) {
        this.createTooltip();
      }
      const label = this.options.tooltipLabel || "Nights";
      const singularLabel = label.endsWith("s") ? label.slice(0, -1) : label;
      const pluralLabel = label;
      const labelText = days === 1 ? singularLabel : pluralLabel;
      const constraintText = constraintType === "min" ? `Min. of ${days} ${labelText}` : `Max. of ${days} ${labelText}`;
      this.tooltip.textContent = constraintText;
      this.tooltip.classList.add("bp-calendar-tooltip-constraint");
      this.tooltip.style.display = "block";
      this.tooltip.style.visibility = "hidden";
      this.tooltip.style.position = "fixed";
      this.tooltip.style.zIndex = "10000";
      const height = this.tooltip.offsetHeight;
      const width = this.tooltip.offsetWidth;
      const rect = targetElement.getBoundingClientRect();
      const left = rect.left + rect.width / 2 - width / 2;
      const top = rect.top - height - 15;
      this.tooltip.style.left = `${Math.max(10, Math.min(left, window.innerWidth - width - 10))}px`;
      this.tooltip.style.top = `${Math.max(10, top)}px`;
      this.tooltip.style.visibility = "visible";
      this.tooltip.style.pointerEvents = "none";
    }
    /**
     * Renders a single month calendar
     * 
     * @param {Date} date - The date object representing the month to render
     * @returns {HTMLElement} The month element
     */
    renderMonth(date) {
      const monthElement = document.createElement("div");
      monthElement.className = "bp-calendar-month";
      const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const monthHeader = document.createElement("div");
      monthHeader.className = "bp-calendar-month-header";
      monthHeader.textContent = monthName;
      monthElement.appendChild(monthHeader);
      const daysOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const daysHeader = document.createElement("div");
      daysHeader.className = "bp-calendar-days-header";
      daysOfWeek.forEach((day) => {
        const dayElement = document.createElement("div");
        dayElement.className = "bp-calendar-day-header";
        dayElement.textContent = day;
        daysHeader.appendChild(dayElement);
      });
      monthElement.appendChild(daysHeader);
      const calendarGrid = document.createElement("div");
      calendarGrid.className = "bp-calendar-grid";
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "bp-calendar-day bp-calendar-day-empty";
        calendarGrid.appendChild(emptyCell);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "bp-calendar-day";
        const cellDate = new Date(date.getFullYear(), date.getMonth(), day);
        cellDate.setHours(0, 0, 0, 0);
        const dateString = this.formatDate(cellDate);
        dayCell.setAttribute("data-date", dateString);
        const dateNumber = document.createElement("div");
        dateNumber.className = "bp-calendar-day-number";
        dateNumber.textContent = day;
        dayCell.appendChild(dateNumber);
        dayCell.dateNumberElement = dateNumber;
        const isPastDate = cellDate < today;
        const isToday = cellDate.getTime() === today.getTime();
        if (isPastDate) {
          dayCell.classList.add("bp-calendar-day-past");
        }
        if (isToday) {
          dayCell.classList.add("bp-calendar-day-today");
        }
        if (this.options.mode === "range" || this.options.mode === "datepicker") {
          this.applyRangeStyling(dayCell, cellDate);
        } else {
          const selectedDate = this.options.selectedDate ? new Date(this.options.selectedDate) : null;
          if (selectedDate) {
            selectedDate.setHours(0, 0, 0, 0);
            if (cellDate.getTime() === selectedDate.getTime()) {
              dayCell.classList.add("bp-calendar-day-selected");
            }
          }
        }
        const config = this.getDateConfig(dateString);
        const isDisabled = config.isDisabled;
        if (isDisabled) {
          dayCell.classList.add("bp-calendar-day-disabled");
        }
        const priceVal = config.price;
        if (priceVal != null && priceVal !== "") {
          const priceElement = document.createElement("div");
          priceElement.className = "bp-calendar-day-price";
          priceElement.textContent = typeof priceVal === "number" ? String(priceVal) : priceVal;
          dayCell.appendChild(priceElement);
        }
        const canSelect = !isPastDate && !isDisabled;
        if (canSelect) {
          dayCell.addEventListener("click", (e) => {
            e.stopPropagation();
            this.handleDateClick(cellDate, dayCell);
          });
          if (this.options.mode === "range" || this.options.mode === "datepicker") {
            dayCell.addEventListener("mouseenter", (e) => {
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
      let start, end;
      if (this.rangeSelection.start && this.rangeSelection.end) {
        start = this.rangeSelection.start;
        end = this.rangeSelection.end;
      } else if (date1 && tempEnd) {
        if (tempEnd < date1) {
          start = tempEnd;
          end = date1;
        } else {
          start = date1;
          end = tempEnd;
        }
      } else if (date1) {
        const cellTime2 = cellDate.getTime();
        const date1Time = date1.getTime();
        if (cellTime2 === date1Time) {
          dayCell.classList.add("bp-calendar-day-range-start");
        }
        return;
      } else {
        return;
      }
      const cellTime = cellDate.getTime();
      const startTime = start.getTime();
      const endTime = end.getTime();
      if (cellTime === startTime) {
        dayCell.classList.add("bp-calendar-day-range-start");
        if (cellTime === endTime) {
          dayCell.classList.add("bp-calendar-day-range-end");
        }
      } else if (cellTime === endTime) {
        dayCell.classList.add("bp-calendar-day-range-end");
        dayCell.classList.add("bp-calendar-day-range-start");
      } else if (cellTime > startTime && cellTime < endTime) {
        dayCell.classList.add("bp-calendar-day-in-range");
      }
    }
    /**
     * Handles date click events
     * 
     * @param {Date} date - The clicked date
     * @param {HTMLElement} dayCell - The day cell element
     */
    handleDateClick(date) {
      if (this.options.mode === "range" || this.options.mode === "datepicker") {
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
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return;
      }
      const date1 = this.rangeSelection.date1;
      const date2 = this.rangeSelection.date2;
      const dateTime = date.getTime();
      if (!date1) {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        this.rangeSelection.date1 = normalizedDate;
        this.rangeSelection.date2 = null;
        this.rangeSelection.start = null;
        this.rangeSelection.end = null;
        this.rangeSelection.tempEnd = null;
      } else if (!date2) {
        if (dateTime === date1.getTime()) {
          return;
        }
        const date1Normalized = new Date(this.rangeSelection.date1);
        date1Normalized.setHours(0, 0, 0, 0);
        const dateNormalized = new Date(date);
        dateNormalized.setHours(0, 0, 0, 0);
        let potentialStart, potentialEnd;
        if (date1Normalized.getTime() < dateNormalized.getTime()) {
          potentialStart = date1Normalized;
          potentialEnd = dateNormalized;
        } else {
          potentialStart = dateNormalized;
          potentialEnd = date1Normalized;
        }
        if (this.hasDisabledDatesInRange(potentialStart, potentialEnd)) {
          return;
        }
        const daysInRange = Math.ceil((potentialEnd.getTime() - potentialStart.getTime()) / (1e3 * 60 * 60 * 24));
        const startConfig = this.getDateConfig(this.formatDate(potentialStart));
        const minDays = startConfig.minDays != null ? startConfig.minDays : null;
        const maxDays = startConfig.maxDays != null ? startConfig.maxDays : null;
        if (minDays !== null && daysInRange < minDays) {
          return;
        }
        if (maxDays !== null && daysInRange > maxDays) {
          return;
        }
        this.rangeSelection.date2 = new Date(dateNormalized);
        this.rangeSelection.start = new Date(potentialStart);
        this.rangeSelection.end = new Date(potentialEnd);
        this.rangeSelection.tempEnd = null;
      } else {
        this.rangeSelection.date1 = new Date(date);
        this.rangeSelection.date2 = null;
        this.rangeSelection.start = null;
        this.rangeSelection.end = null;
        this.rangeSelection.tempEnd = null;
      }
      this.hideTooltip();
      if (this.options.mode === "datepicker") {
        this.renderCalendarInPopup();
        this.attachDatepickerEventListeners();
        this.updateDateInput();
        this.updateSelectedDatesDisplay();
      } else {
        this.render();
        this.attachEventListeners();
      }
      this.updateClearButton();
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
      if (!date1 || date2) {
        this.hideTooltip();
        if (this.rangeSelection.tempEnd) {
          this.clearPreviewStyling();
          this.rangeSelection.tempEnd = null;
        }
        return;
      }
      if (date.getTime() === date1.getTime()) {
        this.hideTooltip();
        if (this.rangeSelection.tempEnd) {
          this.clearPreviewStyling();
          this.rangeSelection.tempEnd = null;
        }
        return;
      }
      const previousTempEnd = this.rangeSelection.tempEnd;
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
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (this.hasDisabledDatesInRange(startDate, endDate)) {
        this.hideTooltip();
        if (this.rangeSelection.tempEnd) {
          this.clearPreviewStyling();
          this.rangeSelection.tempEnd = null;
        }
        return;
      }
      const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      const startConfig = this.getDateConfig(this.formatDate(startDate));
      const minDays = startConfig.minDays != null ? startConfig.minDays : null;
      const maxDays = startConfig.maxDays != null ? startConfig.maxDays : null;
      if (minDays !== null && daysInRange < minDays) {
        this.showConstraintTooltip(dayCell, "min", minDays);
        if (this.rangeSelection.tempEnd) {
          this.clearPreviewStyling();
          this.rangeSelection.tempEnd = null;
        }
        return;
      }
      if (maxDays !== null && daysInRange > maxDays) {
        this.showConstraintTooltip(dayCell, "max", maxDays);
        if (this.rangeSelection.tempEnd) {
          this.clearPreviewStyling();
          this.rangeSelection.tempEnd = null;
        }
        return;
      }
      this.rangeSelection.tempEnd = new Date(date);
      this.showTooltip(dayCell, daysInRange);
      this.updatePreviewStyling(previousTempEnd);
    }
    /**
     * Clears preview styling from all cells
     */
    clearPreviewStyling() {
      const cells = this.container.querySelectorAll(".bp-calendar-day");
      cells.forEach((cell) => {
        cell.classList.remove("bp-calendar-day-in-range");
      });
    }
    /**
     * Updates preview styling for hover state
     * 
     * @param {Date} previousTempEnd - Previous temp end date to clear
     */
    updatePreviewStyling(previousTempEnd) {
      const container = this.options.mode === "datepicker" ? this.calendarWrapper : this.container;
      if (previousTempEnd) {
        const prevDateString = this.formatDate(previousTempEnd);
        const prevCell = container.querySelector(`[data-date="${prevDateString}"]`);
        if (prevCell) {
          prevCell.classList.remove("bp-calendar-day-in-range");
        }
      }
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
      const cells = container.querySelectorAll(".bp-calendar-day");
      cells.forEach((cell) => {
        const cellDateString = cell.getAttribute("data-date");
        if (!cellDateString) return;
        const [year, month, day] = cellDateString.split("-").map(Number);
        const cellDate = new Date(year, month - 1, day);
        cellDate.setHours(0, 0, 0, 0);
        const cellTime = cellDate.getTime();
        const startTime = start.getTime();
        const endTime = end.getTime();
        if (cellTime > startTime && cellTime < endTime) {
          if (!cell.classList.contains("bp-calendar-day-range-start") && !cell.classList.contains("bp-calendar-day-range-end")) {
            cell.classList.add("bp-calendar-day-in-range");
          }
        } else {
          cell.classList.remove("bp-calendar-day-in-range");
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
      if (!date) return "";
      const d = new Date(date);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    /**
     * Checks if a date is currently selected
     * 
     * @param {Date} date - The date to check
     * @returns {boolean} True if date is selected
     */
    isDateSelected(date) {
      if (this.options.mode === "range") {
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
      if (cfg && typeof cfg === "object") {
        return {
          date: cfg.date != null ? String(cfg.date) : dateString,
          isDisabled: Boolean(cfg.isDisabled),
          price: cfg.price != null ? cfg.price : null,
          minDays: cfg.minDays != null && Number.isInteger(cfg.minDays) ? cfg.minDays : null,
          maxDays: cfg.maxDays != null && Number.isInteger(cfg.maxDays) ? cfg.maxDays : null
        };
      }
      return {
        date: dateString,
        isDisabled: false,
        price: null,
        minDays: null,
        maxDays: null
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
      return config.price != null && config.price !== "" ? { price: config.price } : null;
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
      this.options.selectedDate = date;
      this.render();
      this.attachEventListeners();
      this.updateClearButton();
      if (this.options.onDateSelect) {
        this.options.onDateSelect(date);
      }
    }
    /**
     * Clears the current selection (range or single)
     */
    clearSelection() {
      if (this.options.mode === "range" || this.options.mode === "datepicker") {
        this.rangeSelection = {
          date1: null,
          date2: null,
          start: null,
          end: null,
          tempEnd: null
        };
        if (this.options.onRangeSelect) {
          this.options.onRangeSelect({ start: null, end: null });
        }
      } else {
        this.options.selectedDate = null;
      }
      this.hideTooltip();
      if (this.options.mode === "datepicker") {
        this.renderCalendarInPopup();
        this.attachDatepickerEventListeners();
        this.updateSelectedDatesDisplay();
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
      const container = this.options.mode === "datepicker" ? this.calendarWrapper : this.container;
      const clearButton = container ? container.querySelector(".bp-calendar-clear") : null;
      if (!clearButton) return;
      if (this.options.mode === "range" || this.options.mode === "datepicker") {
        const hasSelection = this.rangeSelection.date1 !== null || this.rangeSelection.date2 !== null || this.rangeSelection.start && this.rangeSelection.end;
        clearButton.style.display = hasSelection ? "block" : "none";
      } else {
        const hasSelection = this.options.selectedDate !== null;
        clearButton.style.display = hasSelection ? "block" : "none";
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
      const navLeft = this.container.querySelector(".bp-calendar-nav-left");
      const navRight = this.container.querySelector(".bp-calendar-nav-right");
      if (navLeft) {
        navLeft.addEventListener("click", () => this.navigatePrevious());
      }
      if (navRight) {
        navRight.addEventListener("click", () => this.navigateNext());
      }
      const clearButton = this.container.querySelector(".bp-calendar-clear");
      if (clearButton) {
        clearButton.addEventListener("click", () => this.clearSelection());
      }
      if (this.options.mode === "range" || this.options.mode === "datepicker") {
        const calendarWrapper = this.options.mode === "datepicker" ? this.calendarWrapper : this.container.querySelector(".bp-calendar-wrapper");
        if (calendarWrapper) {
          calendarWrapper.addEventListener("mouseleave", () => {
            this.hideTooltip();
            if (this.rangeSelection.tempEnd) {
              this.rangeSelection.tempEnd = null;
              if (this.options.mode === "datepicker") {
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
      if (this.options.mode !== "datepicker") return;
      if (this.clickOutsideHandler) {
        document.removeEventListener("click", this.clickOutsideHandler, true);
        this.clickOutsideHandler = null;
      }
      if (this.resizeHandler) {
        window.removeEventListener("resize", this.resizeHandler);
        this.resizeHandler = null;
      }
      if (this.datepickerWrapper && this.datepickerWrapperClickHandler) {
        this.datepickerWrapper.removeEventListener("click", this.datepickerWrapperClickHandler);
      }
      if (this.popupWrapper && this.popupWrapperClickHandler) {
        this.popupWrapper.removeEventListener("click", this.popupWrapperClickHandler);
      }
      if (this.datepickerWrapper) {
        this.datepickerWrapperClickHandler = (e) => {
          e.stopPropagation();
          this.showPopup();
        };
        this.datepickerWrapper.addEventListener("click", this.datepickerWrapperClickHandler);
      }
      const clickOutsideHandler = (e) => {
        const target = e.target;
        const clickedNav = target.closest ? target.closest(".bp-calendar-datepicker-nav") : null;
        const inPopup = this.popupWrapper && this.popupWrapper.contains(target);
        const inDatepickerWrapper = this.datepickerWrapper && this.datepickerWrapper.contains(target);
        if (clickedNav) {
          return;
        }
        if (inPopup) {
          return;
        }
        if (inDatepickerWrapper) {
          return;
        }
        this.hidePopup();
      };
      this.clickOutsideHandler = clickOutsideHandler;
      document.addEventListener("click", clickOutsideHandler, true);
      const resizeHandler = () => {
        if (!this.popupWrapper || this.popupWrapper.style.display === "none") return;
        this.positionPopup();
      };
      this.resizeHandler = resizeHandler;
      window.addEventListener("resize", resizeHandler);
      if (this.popupWrapper) {
        this.popupWrapperClickHandler = (e) => {
          e.stopPropagation();
        };
        this.popupWrapper.addEventListener("click", this.popupWrapperClickHandler);
      }
      const originalOnRangeSelect = this.options.onRangeSelect;
      this.options.onRangeSelect = (range) => {
        this.updateDateInput();
        this.updateSelectedDatesDisplay();
        if (originalOnRangeSelect) {
          originalOnRangeSelect(range);
        }
      };
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
        this.dateInput.value = `${startFormatted} \u2014 ${endFormatted}`;
      } else if (this.rangeSelection.date1) {
        const startFormatted = this.formatDateForInput(this.rangeSelection.date1);
        this.dateInput.value = `${startFormatted} \u2014 `;
      } else {
        this.dateInput.value = "";
      }
    }
    /**
     * Formats a date as "Month Day, Year" (e.g., "December 23, 2025")
     * 
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDateFull(date) {
      if (!date) return "";
      const d = new Date(date);
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
      if (!this.datepickerMessage || this.options.mode !== "datepicker") return;
      if (this.rangeSelection.start && this.rangeSelection.end) {
        const startFormatted = this.formatDateFull(this.rangeSelection.start);
        const endFormatted = this.formatDateFull(this.rangeSelection.end);
        this.datepickerMessage.textContent = `${startFormatted} \u2014 ${endFormatted}`;
      } else {
        const minDays = this.options.defaultMinDays != null ? this.options.defaultMinDays : 1;
        this.datepickerMessage.textContent = `Please select a date range of at least ${minDays} ${minDays === 1 ? "night" : "nights"}`;
        this.setAvailabilityMessage("", null);
      }
    }
    /**
     * Sets the availability message line (below selected dates) for live availability check.
     *
     * @param {string} text Message text (e.g. "Checking availability…", "Selected dates are available.").
     * @param {string|null} status 'loading' | 'success' | 'error', or null to hide/clear.
     */
    setAvailabilityMessage(text, status) {
      if (!this.datepickerAvailabilityEl || this.options.mode !== "datepicker") return;
      const el = this.datepickerAvailabilityEl;
      el.textContent = text || "";
      el.className = "bp-calendar-datepicker-availability";
      if (status === "loading") {
        el.classList.add("bp-calendar-datepicker-availability--loading");
      } else if (status === "success") {
        el.classList.add("bp-calendar-datepicker-availability--success");
      } else if (status === "error") {
        el.classList.add("bp-calendar-datepicker-availability--error");
      }
      el.style.display = text && status ? "" : "none";
    }
    /**
     * Attaches event listeners for datepicker popup calendar
     */
    attachDatepickerEventListeners() {
      if (!this.calendarWrapper || !this.popupWrapper) return;
      const navLeft = this.popupWrapper.querySelector(".bp-calendar-nav-left");
      const navRight = this.popupWrapper.querySelector(".bp-calendar-nav-right");
      if (navLeft && !navLeft.hasAttribute("data-bp-calendar-nav-bound")) {
        navLeft.setAttribute("data-bp-calendar-nav-bound", "true");
        navLeft.addEventListener("click", (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          this.currentDate.setMonth(this.currentDate.getMonth() - this.getDatepickerNavigationStep());
          this.renderCalendarInPopup();
          this.attachDatepickerEventListeners();
          this.positionPopup();
          return false;
        }, true);
      }
      if (navRight && !navRight.hasAttribute("data-bp-calendar-nav-bound")) {
        navRight.setAttribute("data-bp-calendar-nav-bound", "true");
        navRight.addEventListener("click", (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          this.currentDate.setMonth(this.currentDate.getMonth() + this.getDatepickerNavigationStep());
          this.renderCalendarInPopup();
          this.attachDatepickerEventListeners();
          this.positionPopup();
          return false;
        }, true);
      }
      const clearButton = this.calendarWrapper.querySelector(".bp-calendar-clear");
      if (clearButton) {
        clearButton.addEventListener("click", () => {
          this.clearSelection();
          if (this.dateInput) this.dateInput.value = "";
        });
      }
      this.updateClearButton();
    }
    /**
     * Shows the datepicker popup
     */
    showPopup() {
      if (this.popupWrapper) {
        this.popupWrapper.style.display = "block";
        this.positionPopup();
      }
    }
    /**
     * Hides the datepicker popup
     */
    hidePopup() {
      if (this.popupWrapper) {
        this.popupWrapper.style.display = "none";
      }
    }
    /**
     * Returns the responsive month count before any popup-only auto override.
     *
     * @returns {number}
     */
    getBasePopupMonthsToShow() {
      return this.getEffectiveMonthsToShow();
    }
    /**
     * Returns the actual month count rendered inside the datepicker popup.
     *
     * @returns {number}
     */
    getPopupMonthsToShow() {
      if (this.options.mode === "datepicker" && this.popupAutoMonthsOverride !== null) {
        return this.popupAutoMonthsOverride;
      }
      return this.getBasePopupMonthsToShow();
    }
    /**
     * Updates the temporary popup-only month override used by auto placement.
     *
     * @param {number|null} months
     * @returns {boolean} True when the override changed
     */
    setPopupAutoMonthsOverride(months) {
      if (months === null || months === void 0) {
        const changed2 = this.popupAutoMonthsOverride !== null;
        this.popupAutoMonthsOverride = null;
        return changed2;
      }
      const normalized = Math.min(4, Math.max(1, Math.round(Number(months))));
      const changed = this.popupAutoMonthsOverride !== normalized;
      this.popupAutoMonthsOverride = normalized;
      return changed;
    }
    /**
     * Ensures the datepicker popup is rendered with the requested override state.
     *
     * @param {number|null} monthsOverride
     * @returns {number} Actual months rendered in the popup
     */
    ensureDatepickerPopupMonths(monthsOverride = null) {
      const overrideChanged = this.setPopupAutoMonthsOverride(monthsOverride);
      const targetMonthsToShow = this.getPopupMonthsToShow();
      if (overrideChanged || this.renderedMonthsToShow !== targetMonthsToShow) {
        this.renderCalendarInPopup();
        this.attachDatepickerEventListeners();
      }
      return targetMonthsToShow;
    }
    /**
     * Returns the month step used by datepicker popup navigation.
     *
     * @returns {number}
     */
    getDatepickerNavigationStep() {
      const renderedMonths = Number(this.renderedMonthsToShow);
      if (Number.isFinite(renderedMonths) && renderedMonths > 0) {
        return renderedMonths;
      }
      return this.getPopupMonthsToShow();
    }
    /**
     * Returns the element rect used for popup placement in datepicker mode.
     *
     * @returns {DOMRect}
     */
    getDatepickerPlacementAnchorRect() {
      const anchorElement = this.options.datepickerAnchorElement;
      if (anchorElement && anchorElement instanceof Node && typeof anchorElement.getBoundingClientRect === "function" && document.contains(anchorElement)) {
        return anchorElement.getBoundingClientRect();
      }
      return this.dateInput.getBoundingClientRect();
    }
    /**
     * Positions the datepicker popup relative to the input
     */
    positionPopup() {
      if (!this.popupWrapper || !this.dateInput) return;
      const anchorRect = this.getDatepickerPlacementAnchorRect();
      const wrapperRect = this.container.getBoundingClientRect();
      const popup = this.popupWrapper;
      const gutter = DATEPICKER_AUTO_VIEWPORT_GUTTER;
      const isAutoPlacement = this.options.datepickerPlacement === "auto";
      const topOffset = anchorRect.bottom - wrapperRect.top + 5;
      const leftOffset = anchorRect.left - wrapperRect.left;
      const setLeftAlignment = (left) => {
        popup.style.left = `${left}px`;
        popup.style.right = "auto";
        popup.classList.remove("bp-calendar-datepicker-popup--align-right");
        popup.classList.remove("bp-calendar-datepicker-popup--mobile-center");
      };
      const setRightAlignment = (right) => {
        popup.style.left = "auto";
        popup.style.right = `${right}px`;
        popup.classList.add("bp-calendar-datepicker-popup--align-right");
        popup.classList.remove("bp-calendar-datepicker-popup--mobile-center");
      };
      const setCompactClampedFallback = () => {
        popup.classList.remove("bp-calendar-datepicker-popup--align-right");
        popup.classList.add("bp-calendar-datepicker-popup--mobile-center");
        popup.style.right = "auto";
        popup.style.left = "0px";
        const popupWidth = popup.getBoundingClientRect().width;
        const maxLeftViewport = Math.max(gutter, this.getViewportWidth() - popupWidth - gutter);
        const leftViewport = Math.min(Math.max(anchorRect.left, gutter), maxLeftViewport);
        popup.style.left = `${leftViewport - wrapperRect.left}px`;
        popup.style.right = "auto";
      };
      const applyAutoPlacementDecision = () => {
        const decision = resolveDatepickerAutoPlacement({
          viewportWidth: this.getViewportWidth(),
          inputLeft: anchorRect.left,
          inputRight: anchorRect.right,
          popupWidth: popup.getBoundingClientRect().width,
          gutter
        });
        if (!decision.fits) {
          return false;
        }
        if (decision.mode === "right") {
          const rightOffset = wrapperRect.right - anchorRect.right;
          setRightAlignment(rightOffset);
          return true;
        }
        const leftRelative = decision.leftViewport - wrapperRect.left;
        setLeftAlignment(leftRelative);
        return true;
      };
      popup.style.position = "absolute";
      popup.style.top = `${topOffset}px`;
      popup.style.zIndex = "10000";
      if (!isAutoPlacement) {
        this.setPopupAutoMonthsOverride(null);
        setLeftAlignment(leftOffset);
        return;
      }
      this.ensureDatepickerPopupMonths(null);
      if (applyAutoPlacementDecision()) {
        return;
      }
      if (this.getBasePopupMonthsToShow() !== 1) {
        this.ensureDatepickerPopupMonths(1);
        if (applyAutoPlacementDecision()) {
          return;
        }
      }
      this.ensureDatepickerPopupMonths(this.getBasePopupMonthsToShow() === 1 ? null : 1);
      setCompactClampedFallback();
    }
    /**
     * Updates the calendar with new options
     * 
     * @param {Object} newOptions - New options to merge with existing ones
     */
    updateOptions(newOptions) {
      if (newOptions.monthsToShow !== void 0) {
        if (newOptions.monthsToShow < 1 || newOptions.monthsToShow > 4) {
          throw new Error("monthsToShow must be between 1 and 4");
        }
      }
      this.options = { ...this.options, ...newOptions };
      if (newOptions.breakpoints !== void 0) {
        this.responsiveBreakpoints = this.normalizeBreakpoints(newOptions.breakpoints);
      }
      this.popupAutoMonthsOverride = null;
      this.renderedMonthsToShow = this.getEffectiveMonthsToShow();
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
      if (!breakpoints || typeof breakpoints !== "object") return [];
      return Object.entries(breakpoints).map(([maxWidthKey, config]) => {
        const maxWidth = Number(maxWidthKey);
        if (!Number.isFinite(maxWidth) || maxWidth <= 0) return null;
        let monthsToShow = null;
        if (typeof config === "number") {
          monthsToShow = config;
        } else if (config && typeof config === "object" && config.monthsToShow !== void 0) {
          monthsToShow = Number(config.monthsToShow);
        }
        if (!Number.isFinite(monthsToShow)) return null;
        return {
          maxWidth,
          monthsToShow: Math.min(4, Math.max(1, Math.round(monthsToShow)))
        };
      }).filter(Boolean).sort((a, b) => a.maxWidth - b.maxWidth);
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
      return typeof window !== "undefined" ? window.innerWidth : Number.POSITIVE_INFINITY;
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
        document.removeEventListener("click", this.clickOutsideHandler, true);
        this.clickOutsideHandler = null;
      }
      if (this.resizeHandler) {
        window.removeEventListener("resize", this.resizeHandler);
        this.resizeHandler = null;
      }
      if (this.datepickerWrapper && this.datepickerWrapperClickHandler) {
        this.datepickerWrapper.removeEventListener("click", this.datepickerWrapperClickHandler);
        this.datepickerWrapperClickHandler = null;
      }
      if (this.popupWrapper && this.popupWrapperClickHandler) {
        this.popupWrapper.removeEventListener("click", this.popupWrapperClickHandler);
        this.popupWrapperClickHandler = null;
      }
      if (this.tooltip) {
        this.tooltip.remove();
      }
      this.container.innerHTML = "";
    }
  };
  function BP_Calendar(container, options = {}) {
    return new BPCalendar(container, options);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = BPCalendar;
    module.exports.BP_Calendar = BP_Calendar;
  }
  if (typeof window !== "undefined") {
    window.BPCalendar = BPCalendar;
    window.BP_Calendar = BP_Calendar;
  }
  return __toCommonJS(bp_calendar_exports);
})();
