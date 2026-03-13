// Date utility functions for Youth Training Hub
// All dates are handled in UTC for consistency

/**
 * Convert Date to YYYY-MM-DD string
 * @param {Date|string} date
 * @returns {string} YYYY-MM-DD format
 */
export function toDateStr(date) {
  const dt = new Date(date);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/**
 * Convert Date to HH:MM string
 * @param {Date|string} date
 * @returns {string} HH:MM format
 */
export function toTimeStr(date) {
  const dt = new Date(date);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

/**
 * Format date for display (e.g., "Mon, 15 Jan")
 * @param {Date|string} date
 * @returns {string} Formatted date
 */
export function fmtDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Format date and time for display (e.g., "Mon, 15 Jan · 14:30")
 * @param {Date|string} date
 * @returns {string} Formatted date and time
 */
export function fmtDateTime(date) {
  const dt = new Date(date);
  return `${fmtDate(date)} · ${dt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

/**
 * Get Monday of the week for a given date
 * @param {Date|string} date
 * @returns {Date} Monday of that week
 */
export function getMonStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

/**
 * Add days to a date
 * @param {Date|string} date
 * @param {number} days Number of days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get week label (e.g., "15 Jan")
 * @param {Date|string} date
 * @returns {string} Week label
 */
export function weekLabel(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Check if two dates are the same day
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean} True if same day
 */
export function isSameDay(date1, date2) {
  return toDateStr(date1) === toDateStr(date2);
}

/**
 * Get start and end of week
 * @param {Date|string} date
 * @returns {{start: Date, end: Date}} Week boundaries
 */
export function getWeekBounds(date) {
  const start = getMonStart(date);
  const end = addDays(start, 7);
  return { start, end };
}

/**
 * Get relative week label (e.g., "This week", "Last week", "2 weeks ago")
 * @param {number} weekOffset Offset from current week
 * @returns {string} Relative week label
 */
export function getRelativeWeekLabel(weekOffset) {
  if (weekOffset === 0) return "This week";
  if (weekOffset === -1) return "Last week";
  if (weekOffset === 1) return "Next week";

  const abs = Math.abs(weekOffset);
  const plural = abs > 1 ? "s" : "";
  return `${abs} week${plural} ${weekOffset < 0 ? "ago" : "ahead"}`;
}

/**
 * Parse date and time strings into ISO date
 * @param {string} dateStr YYYY-MM-DD format
 * @param {string} timeStr HH:MM format
 * @returns {string} ISO date string
 */
export function combineDateTimeToISO(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}