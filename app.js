// State
let markedDays = new Set(); // Set of date strings "YYYY-MM-DD"
let lastClickedDate = null;

// Configurable settings
let windowSize = 365; // Rolling window size in days
let dayLimit = 90; // Max marked days allowed

// Date utilities
const today = new Date();
today.setHours(0, 0, 0, 0);
const currentYear = today.getFullYear();

// 3-year sliding window (can be shifted with nav buttons)
let baseYear = currentYear - 1; // Start with last year

// Keyboard navigation state
let navLevel = 'month'; // 'month' or 'day'
let focusedYear = currentYear;
let focusedMonth = today.getMonth();
let focusedDate = dateToString(today);

function getDisplayYears() {
  return [baseYear, baseYear + 1, baseYear + 2];
}

function getDateRange() {
  const startDate = new Date(baseYear, 0, 1);
  const endDate = new Date(baseYear + 2, 11, 31);
  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  return { startDate, endDate, totalDays };
}

// Default slider to today's date (clamped to visible range)
function getDefaultOffset() {
  const { startDate, totalDays } = getDateRange();
  const offset = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
  return Math.max(windowSize - 1, Math.min(offset, totalDays));
}

let windowEndOffset = getDefaultOffset();

function dateToString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function stringToDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get window dates based on slider
function getWindowDates() {
  const { startDate } = getDateRange();
  const endDate = addDays(startDate, windowEndOffset);
  const startWindowDate = addDays(endDate, -(windowSize - 1)); // windowSize days inclusive
  return { start: startWindowDate, end: endDate };
}

// Calculate marked days in a specific window
function calculateDaysInWindowRange(windowStart, windowEnd) {
  let count = 0;
  markedDays.forEach((dateStr) => {
    const date = stringToDate(dateStr);
    if (date >= windowStart && date <= windowEnd) {
      count++;
    }
  });
  return count;
}

// Calculate marked days in current window
function calculateDaysInWindow() {
  const { start, end } = getWindowDates();
  return calculateDaysInWindowRange(start, end);
}

// Find the window with maximum marked days
let maxWindowOffset = null;
function findMaxWindow() {
  const minOffset = windowSize - 1;
  if (markedDays.size === 0) {
    return { maxDays: 0, offset: minOffset, start: null, end: null };
  }

  const { startDate, totalDays } = getDateRange();
  let maxDays = 0;
  let bestOffset = minOffset;

  // Scan all possible windows (sliding by day)
  for (let offset = minOffset; offset <= totalDays; offset++) {
    const windowEnd = addDays(startDate, offset);
    const windowStart = addDays(windowEnd, -(windowSize - 1));
    const days = calculateDaysInWindowRange(windowStart, windowEnd);

    if (days > maxDays) {
      maxDays = days;
      bestOffset = offset;
    }
  }

  const bestEnd = addDays(startDate, bestOffset);
  const bestStart = addDays(bestEnd, -(windowSize - 1));

  return { maxDays, offset: bestOffset, start: bestStart, end: bestEnd };
}

// Update stats display
function updateStats() {
  const daysInWindow = calculateDaysInWindow();
  const daysRemaining = Math.max(0, dayLimit - daysInWindow);

  const daysInWindowEl = document.getElementById('daysInWindow');
  const daysRemainingEl = document.getElementById('daysRemaining');

  daysInWindowEl.textContent = daysInWindow;
  daysRemainingEl.textContent = daysRemaining;
  document.getElementById('totalDays').textContent = markedDays.size;

  // Update dynamic label
  document.getElementById('remainingLabel').textContent = `Remaining (of ${dayLimit})`;

  // Marked (in window) - always white
  daysInWindowEl.className = 'stat-value';
  daysInWindowEl.style.color = '';

  // Remaining - gradient from green (100%) to red (0%)
  const ratio = daysRemaining / dayLimit; // 1 = full, 0 = empty
  const hue = Math.round(ratio * 120); // 120 = green, 0 = red
  daysRemainingEl.className = 'stat-value';
  daysRemainingEl.style.color = `hsl(${hue}, 70%, 55%)`;

  // Update window dates display
  const { start, end } = getWindowDates();
  document.getElementById('windowDates').textContent = `${formatDate(start)} - ${formatDate(end)}`;

  // Update max window stats
  const maxWindow = findMaxWindow();
  maxWindowOffset = maxWindow.offset;
  const maxDaysEl = document.getElementById('maxDays');
  maxDaysEl.textContent = maxWindow.maxDays;

  // Most marked window - gradient from green (0) to red (at/over limit)
  const maxRatio = Math.min(maxWindow.maxDays / dayLimit, 1); // cap at 1
  const maxHue = Math.round((1 - maxRatio) * 120); // 120 = green, 0 = red
  maxDaysEl.className = 'stat-value';
  maxDaysEl.style.color = `hsl(${maxHue}, 70%, 55%)`;

  if (maxWindow.start && maxWindow.end) {
    document.getElementById('maxWindowDates').textContent =
      `${formatDate(maxWindow.start)} - ${formatDate(maxWindow.end)}`;
  } else {
    document.getElementById('maxWindowDates').textContent = '';
  }
}

// Render calendar
function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  const { start: windowStart, end: windowEnd } = getWindowDates();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render 3-year window
  getDisplayYears().forEach((year) => {
    const yearLabel = document.createElement('div');
    yearLabel.className = 'year-label';
    yearLabel.textContent = year;
    container.appendChild(yearLabel);

    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-wrapper';

    // Day of week labels
    const dayLabels = document.createElement('div');
    dayLabels.className = 'day-labels';
    dayNames.forEach((name) => {
      const label = document.createElement('div');
      label.className = 'day-label';
      label.textContent = name;
      dayLabels.appendChild(label);
    });
    wrapper.appendChild(dayLabels);

    const calendar = document.createElement('div');
    calendar.className = 'calendar';

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    months.forEach((monthName, monthIndex) => {
      const monthDiv = document.createElement('div');
      monthDiv.className = 'month';

      const monthLabel = document.createElement('div');
      monthLabel.className = 'month-label';
      monthLabel.textContent = monthName;
      monthLabel.dataset.year = year;
      monthLabel.dataset.month = monthIndex;
      // Set tabindex: 0 for focused month (tab entry point), -1 for others
      const isFocusedMonth = year === focusedYear && monthIndex === focusedMonth;
      monthLabel.setAttribute('tabindex', isFocusedMonth ? '0' : '-1');
      monthLabel.setAttribute('role', 'button');
      monthLabel.setAttribute('aria-label', `${monthName} ${year}`);
      monthDiv.appendChild(monthLabel);

      const weeksDiv = document.createElement('div');
      weeksDiv.className = 'weeks';

      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
      const daysInMonth = lastDay.getDate();

      // Group days into weeks
      let currentWeek = [];
      const weeks = [];

      // Add empty cells for days before the first of the month
      const firstDayOfWeek = firstDay.getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        currentWeek.push(date);

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }

      weeks.forEach((week) => {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'week';

        week.forEach((date) => {
          const dayDiv = document.createElement('div');
          dayDiv.className = 'day';

          if (date) {
            const dateStr = dateToString(date);
            dayDiv.dataset.date = dateStr;

            if (date.getTime() === today.getTime()) {
              dayDiv.classList.add('today');
            }

            const isMarked = markedDays.has(dateStr);
            if (isMarked) {
              dayDiv.classList.add('marked');
            }

            if (date >= windowStart && date <= windowEnd) {
              dayDiv.classList.add('in-window');
            }

            // Accessibility - tabindex managed by keyboard nav
            dayDiv.setAttribute('tabindex', '-1');

            // Event listeners
            dayDiv.addEventListener('click', (e) => handleDayClick(dateStr, e));
            dayDiv.addEventListener('mouseenter', (e) => showTooltip(dateStr, e));
            dayDiv.addEventListener('mouseleave', hideTooltip);
            dayDiv.addEventListener('focus', () => showTooltip(dateStr, dayDiv));
            dayDiv.addEventListener('blur', hideTooltip);
          } else {
            dayDiv.style.visibility = 'hidden';
          }

          weekDiv.appendChild(dayDiv);
        });

        weeksDiv.appendChild(weekDiv);
      });

      monthDiv.appendChild(weeksDiv);
      calendar.appendChild(monthDiv);
    });

    wrapper.appendChild(calendar);
    container.appendChild(wrapper);
  });

  updateStats();
}

// Handle day click
function handleDayClick(dateStr, event) {
  if (event.shiftKey && lastClickedDate) {
    // Range selection
    const start = stringToDate(lastClickedDate);
    const end = stringToDate(dateStr);
    const [from, to] = start < end ? [start, end] : [end, start];

    const shouldAdd = !markedDays.has(dateStr);
    let current = new Date(from);

    while (current <= to) {
      const str = dateToString(current);
      if (shouldAdd) {
        markedDays.add(str);
      } else {
        markedDays.delete(str);
      }
      current = addDays(current, 1);
    }
  } else {
    // Single toggle
    if (markedDays.has(dateStr)) {
      markedDays.delete(dateStr);
    } else {
      markedDays.add(dateStr);
    }
  }

  lastClickedDate = dateStr;
  renderCalendar();
}

// Tooltip
function showTooltip(dateStr, eventOrElement) {
  const tooltip = document.getElementById('tooltip');
  const date = stringToDate(dateStr);
  const isMarked = markedDays.has(dateStr);
  const { start, end } = getWindowDates();
  const inWindow = date >= start && date <= end;

  tooltip.innerHTML = `
    <div>${formatDate(date)}</div>
    <div>${isMarked ? 'Marked' : 'Unmarked'}</div>
    ${inWindow ? '<div style="color: #f0883e">In current window</div>' : ''}
  `;

  tooltip.style.display = 'block';

  // Position tooltip, avoiding viewport overflow
  const tooltipRect = tooltip.getBoundingClientRect();
  let left, top;

  if (eventOrElement.clientX !== undefined) {
    // Mouse event - position near cursor
    left = eventOrElement.clientX + 10;
    top = eventOrElement.clientY + 10;
  } else {
    // Element (keyboard focus) - position near element
    const elRect = eventOrElement.getBoundingClientRect();
    left = elRect.right + 5;
    top = elRect.top;
  }

  if (left + tooltipRect.width > window.innerWidth) {
    left =
      (eventOrElement.clientX ?? eventOrElement.getBoundingClientRect().left) -
      tooltipRect.width -
      10;
  }
  if (top + tooltipRect.height > window.innerHeight) {
    top =
      (eventOrElement.clientY ?? eventOrElement.getBoundingClientRect().bottom) -
      tooltipRect.height -
      10;
  }

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').style.display = 'none';
}

// File handling
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      markedDays.clear();

      data.forEach((range) => {
        const start = stringToDate(range.start);
        const end = stringToDate(range.end);
        let current = new Date(start);

        while (current <= end) {
          markedDays.add(dateToString(current));
          current = addDays(current, 1);
        }
      });

      renderCalendar();
    } catch (err) {
      alert('Error parsing JSON file: ' + err.message);
    }
    // Reset input so the same file can be loaded again
    fileInput.value = '';
  };
  reader.onerror = () => {
    alert('Error reading file');
    fileInput.value = '';
  };
  reader.readAsText(file);
});

// Export
document.getElementById('exportBtn').addEventListener('click', () => {
  // Group consecutive days into ranges
  const sortedDays = Array.from(markedDays).sort();
  const ranges = [];
  let currentRange = null;

  sortedDays.forEach((dateStr) => {
    if (!currentRange) {
      currentRange = { start: dateStr, end: dateStr };
    } else {
      const lastDate = stringToDate(currentRange.end);
      const thisDate = stringToDate(dateStr);
      const diff = daysBetween(lastDate, thisDate);

      if (diff === 1) {
        currentRange.end = dateStr;
      } else {
        ranges.push(currentRange);
        currentRange = { start: dateStr, end: dateStr };
      }
    }
  });

  if (currentRange) {
    ranges.push(currentRange);
  }

  const json = JSON.stringify(ranges, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'marked-dates.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Clear
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Clear all marked days?')) {
    markedDays.clear();
    renderCalendar();
  }
});

// Slider setup
const slider = document.getElementById('windowSlider');

function updateSliderRange() {
  const { totalDays } = getDateRange();
  slider.min = windowSize - 1;
  slider.max = totalDays;
  slider.value = windowEndOffset;
  document.getElementById('windowLabel').textContent = `${windowSize}-day window:`;
}

// Jump to worst-case window
const worstCaseStat = document.querySelector('.stat.worst-case');
function jumpToWorstWindow() {
  if (maxWindowOffset !== null) {
    windowEndOffset = maxWindowOffset;
    slider.value = maxWindowOffset;
    renderCalendar();
  }
}
worstCaseStat.addEventListener('click', jumpToWorstWindow);
worstCaseStat.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    jumpToWorstWindow();
  }
});

// Year navigation
function shiftYears(delta) {
  baseYear += delta;
  windowEndOffset = getDefaultOffset();
  updateSliderRange();
  renderCalendar();
  updateYearNav();
}

function updateYearNav() {
  const years = getDisplayYears();
  document.getElementById('yearRange').textContent = `${years[0]} - ${years[2]}`;
}

document.getElementById('prevYears').addEventListener('click', () => shiftYears(-1));
document.getElementById('nextYears').addEventListener('click', () => shiftYears(1));

// Jump to today
document.getElementById('todayBtn').addEventListener('click', () => {
  baseYear = currentYear - 1; // Reset to default year range
  windowEndOffset = getDefaultOffset();
  updateSliderRange();
  updateYearNav();
  renderCalendar();
});

// Config inputs
const presetSelect = document.getElementById('presetSelect');
const windowSizeInput = document.getElementById('windowSizeInput');
const dayLimitInput = document.getElementById('dayLimitInput');

function applyConfig() {
  // Validate window size (min 1, max 730)
  let ws = parseInt(windowSizeInput.value);
  if (isNaN(ws) || ws < 1) ws = 365;
  if (ws > 730) ws = 730;
  windowSize = ws;
  windowSizeInput.value = ws;

  // Update dayLimit max to match windowSize
  dayLimitInput.max = ws;

  // Validate day limit (min 1, max windowSize)
  let dl = parseInt(dayLimitInput.value);
  if (isNaN(dl) || dl < 1) dl = 90;
  if (dl > ws) dl = ws;
  dayLimit = dl;
  dayLimitInput.value = dl;

  windowEndOffset = getDefaultOffset();
  updateSliderRange();
  renderCalendar();
}

presetSelect.addEventListener('change', (e) => {
  const value = e.target.value;
  if (value !== 'custom') {
    const [ws, dl] = value.split('/').map(Number);
    windowSizeInput.value = ws;
    dayLimitInput.value = dl;
    applyConfig();
  }
});

windowSizeInput.addEventListener('change', () => {
  presetSelect.value = 'custom';
  applyConfig();
});

dayLimitInput.addEventListener('change', () => {
  presetSelect.value = 'custom';
  applyConfig();
});

updateSliderRange();

slider.addEventListener('input', (e) => {
  windowEndOffset = parseInt(e.target.value);
  renderCalendar();
});

// Keyboard navigation functions
function getMonthLabel(year, month) {
  return document.querySelector(`.month-label[data-year="${year}"][data-month="${month}"]`);
}

function getDayElement(dateStr) {
  return document.querySelector(`.day[data-date="${dateStr}"]`);
}

function getAllDaysInMonth(year, month) {
  const days = [];
  const container = document.getElementById('calendarContainer');
  container
    .querySelectorAll(`.day[data-date^="${year}-${String(month + 1).padStart(2, '0')}"]`)
    .forEach((el) => {
      if (el.dataset.date) days.push(el.dataset.date);
    });
  return days.sort();
}

function focusMonth(year, month) {
  // Clamp to displayed years
  const years = getDisplayYears();
  if (year < years[0]) {
    year = years[0];
  }
  if (year > years[2]) {
    year = years[2];
  }
  if (month < 0) {
    month = 11;
    year--;
  }
  if (month > 11) {
    month = 0;
    year++;
  }
  // Re-clamp after wrap
  if (year < years[0]) {
    year = years[2];
    month = 11;
  }
  if (year > years[2]) {
    year = years[0];
    month = 0;
  }

  focusedYear = year;
  focusedMonth = month;
  const label = getMonthLabel(year, month);
  if (label) {
    label.setAttribute('tabindex', '0');
    label.focus();
    // Reset other month tabindexes
    document.querySelectorAll('.month-label').forEach((el) => {
      if (el !== label) el.setAttribute('tabindex', '-1');
    });
  }
}

function focusDay(dateStr) {
  const el = getDayElement(dateStr);
  if (el) {
    focusedDate = dateStr;
    el.setAttribute('tabindex', '0');
    el.focus();
    // Reset other day tabindexes
    document.querySelectorAll('.day[data-date]').forEach((d) => {
      if (d !== el) d.setAttribute('tabindex', '-1');
    });
    // Tooltip shown via focus event listener
  }
}

function getFirstDayOfMonth(year, month) {
  const days = getAllDaysInMonth(year, month);
  return days.length > 0 ? days[0] : null;
}

function navigateDay(dateStr, direction) {
  const date = stringToDate(dateStr);
  let newDate;

  if (direction === 'up') {
    newDate = addDays(date, -1);
  } else if (direction === 'down') {
    newDate = addDays(date, 1);
  } else if (direction === 'left') {
    newDate = addDays(date, -7);
  } else if (direction === 'right') {
    newDate = addDays(date, 7);
  }

  const newDateStr = dateToString(newDate);
  const el = getDayElement(newDateStr);
  if (el) {
    focusDay(newDateStr);
    // Update focused month if we crossed into a new month
    focusedYear = newDate.getFullYear();
    focusedMonth = newDate.getMonth();
  }
  // If no element found, stay on current day (don't lose focus)
}

// Make calendar container handle keyboard events
const calendarContainer = document.getElementById('calendarContainer');
calendarContainer.addEventListener('keydown', (e) => {
  if (navLevel === 'month') {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusMonth(focusedYear, focusedMonth - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusMonth(focusedYear, focusedMonth + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusMonth(focusedYear - 1, focusedMonth);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusMonth(focusedYear + 1, focusedMonth);
    } else if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      navLevel = 'day';
      const firstDay = getFirstDayOfMonth(focusedYear, focusedMonth);
      if (firstDay) {
        focusDay(firstDay);
      }
    }
    // Shift+Tab: let browser handle it (exits calendar to previous element)
  } else if (navLevel === 'day') {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateDay(focusedDate, 'up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateDay(focusedDate, 'down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateDay(focusedDate, 'left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateDay(focusedDate, 'right');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(focusedDate, e);
      // Refocus after render (DOM was rebuilt)
      setTimeout(() => focusDay(focusedDate), 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      navLevel = 'month';
      focusMonth(focusedYear, focusedMonth);
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      navLevel = 'month';
      focusMonth(focusedYear, focusedMonth);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Let browser handle it (exits calendar to next element)
      navLevel = 'month'; // Reset for next time we tab back in
      // Tooltip hidden via blur event listener
    }
  }
});

// Initial render
updateYearNav();
renderCalendar();
