import assert from "node:assert/strict";
import test from "node:test";
import {
  isAcademyRoleAllowed,
  isAttendanceExpiryValid,
  isAttendanceSessionInputValid,
  isDateInputValid,
  isDateTimeInputValid,
  isMonthInputValid,
  isUniqueConstraintViolation,
} from "../lib/academy/attendance-validation.mjs";

const now = Date.parse("2026-10-14T12:00:00.000Z");

test("accepts valid date and expiry form values", () => {
  assert.equal(
    isAttendanceSessionInputValid(
      "class-id",
      "2026-10-14",
      "2026-10-14T18:30",
      now,
    ),
    true,
  );
});

test("rejects malformed and impossible attendance dates or times", () => {
  const cases = [
    ["", "2026-10-14", "2026-10-14T18:30"],
    ["class-id", "2026/10/14", "2026-10-14T18:30"],
    ["class-id", "2026-02-30", "2026-10-14T18:30"],
    ["class-id", "2026-10-14", "2026-10-14 18:30"],
    ["class-id", "2026-10-14", "2026-10-14T24:00"],
    ["class-id", "2026-10-14", "2026-10-14T18:60"],
  ];

  for (const input of cases) {
    assert.equal(isAttendanceSessionInputValid(...input, now), false);
  }
});

test("rejects invalid fee, admission, and exam date inputs", () => {
  assert.equal(isDateInputValid("2026-02-30"), false);
  assert.equal(isDateInputValid("2026-10-14"), true);
  assert.equal(isMonthInputValid("2026-13"), false);
  assert.equal(isMonthInputValid("2026-10"), true);
  assert.equal(isDateTimeInputValid("2026-10-14T24:00"), false);
  assert.equal(isDateTimeInputValid("2026-10-14T18:30"), true);
});

test("requires attendance expiration to be future and within one day", () => {
  assert.equal(isAttendanceExpiryValid("2026-10-14T19:00", now), true);
  assert.equal(isAttendanceExpiryValid("2026-10-14T11:00", now), false);
  assert.equal(isAttendanceExpiryValid("2026-10-16T12:00", now), false);
});

test("role checks do not elevate a role outside the explicitly allowed set", () => {
  assert.equal(isAcademyRoleAllowed("teacher", ["admin", "teacher"]), true);
  assert.equal(isAcademyRoleAllowed("student", ["admin", "teacher"]), false);
  assert.equal(isAcademyRoleAllowed("super_admin", ["admin", "teacher"]), false);
});

test("recognizes duplicate-key violations without masking other database errors", () => {
  assert.equal(isUniqueConstraintViolation("23505"), true);
  assert.equal(isUniqueConstraintViolation("42501"), false);
  assert.equal(isUniqueConstraintViolation(undefined), false);
});
