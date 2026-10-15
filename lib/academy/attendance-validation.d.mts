export function isDateInputValid(value: string): boolean;

export function isDateTimeInputValid(value: string): boolean;

export function isMonthInputValid(value: string): boolean;

export function isAttendanceExpiryValid(value: string, now?: number): boolean;

export function isAttendanceSessionInputValid(
  classId: string,
  sessionDate: string,
  expiresAt: string,
  now?: number,
): boolean;

export function isAcademyRoleAllowed(
  role: string,
  allowedRoles: readonly string[],
): boolean;

export function isUniqueConstraintViolation(code?: string): boolean;
