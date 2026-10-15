const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MONTH_INPUT = /^\d{4}-(0[1-9]|1[0-2])$/;

function isRealDate(value) {
  if (!DATE_INPUT.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

function isRealDateTime(value) {
  if (!DATETIME_INPUT.test(value)) return false;
  const [date, time] = value.split("T");
  const [hours, minutes] = time.split(":").map(Number);
  return isRealDate(date) && hours <= 23 && minutes <= 59;
}

export function isDateInputValid(value) {
  return isRealDate(value);
}

export function isDateTimeInputValid(value) {
  return isRealDateTime(value);
}

export function isMonthInputValid(value) {
  return MONTH_INPUT.test(value);
}

export function isAttendanceExpiryValid(value, now = Date.now()) {
  if (!isRealDateTime(value)) return false;
  const expiry = Date.parse(`${value}:00+05:00`);
  return Number.isFinite(expiry) &&
    expiry > now &&
    expiry <= now + 24 * 60 * 60 * 1000;
}

export function isAttendanceSessionInputValid(classId, sessionDate, expiresAt, now = Date.now()) {
  return Boolean(
    classId &&
    isRealDate(sessionDate) &&
    isAttendanceExpiryValid(expiresAt, now),
  );
}

export function isAcademyRoleAllowed(role, allowedRoles) {
  return allowedRoles.includes(role);
}

export function isUniqueConstraintViolation(code) {
  return code === "23505";
}
