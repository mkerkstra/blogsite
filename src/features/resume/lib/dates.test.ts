import { describe, expect, it } from "vitest";

import {
  calculateDuration,
  formatMonthYear,
  formatMonthYearUpper,
  formatRange,
  formatYear,
} from "./dates";

describe("date helpers", () => {
  // Reproduces the off-by-one TZ bug we fixed: bare-date string parses
  // as UTC midnight, formatter without timeZone:UTC renders previous day
  // in any timezone west of UTC.
  describe("formatMonthYear", () => {
    it("returns May 2023 for 2023-05-01 (not Apr 2023)", () => {
      expect(formatMonthYear(new Date("2023-05-01"))).toBe("May 2023");
    });

    it("returns Jun 2022 for 2022-06-01", () => {
      expect(formatMonthYear(new Date("2022-06-01"))).toBe("Jun 2022");
    });

    it("returns Feb 2019 for 2019-02-01", () => {
      expect(formatMonthYear(new Date("2019-02-01"))).toBe("Feb 2019");
    });
  });

  describe("formatMonthYearUpper", () => {
    it("uppercases the formatted month-year", () => {
      expect(formatMonthYearUpper(new Date("2023-05-01"))).toBe("MAY 2023");
    });
  });

  describe("formatYear", () => {
    it("returns the UTC year for a bare-date string", () => {
      expect(formatYear(new Date("2023-05-01"))).toBe("2023");
    });

    it("returns 2019 for 2019-02-01", () => {
      expect(formatYear(new Date("2019-02-01"))).toBe("2019");
    });
  });

  describe("calculateDuration", () => {
    it("returns years and months between two dates", () => {
      const start = new Date("2022-06-01");
      const end = new Date("2023-03-01");
      expect(calculateDuration(start, end)).toBe("9 months");
    });

    it("returns multi-year durations", () => {
      const start = new Date("2019-02-01");
      const end = new Date("2021-06-01");
      expect(calculateDuration(start, end)).toBe("2 years 4 months");
    });

    it("returns just years when no months", () => {
      const start = new Date("2020-01-01");
      const end = new Date("2022-01-01");
      expect(calculateDuration(start, end)).toBe("2 years");
    });
  });

  describe("formatRange", () => {
    it("returns 'Start – End' when both dates are present", () => {
      expect(formatRange(new Date("2022-06-01"), new Date("2023-03-01"))).toBe(
        "Jun 2022 – Mar 2023",
      );
    });

    it("returns 'Start – Present' when end is undefined", () => {
      expect(formatRange(new Date("2023-05-01"))).toBe("May 2023 – Present");
    });
  });
});
