import assert from "node:assert/strict";
import test from "node:test";
import { isWithinYTD } from "./isWithinYTD";
import { sumSkipNulls } from "../pivot/aggregators";

const AS_OF = new Date("2025-10-23T12:00:00");

function ymd(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

test("isWithinYTD includes dates on or before cutoff in the same calendar year", () => {
  assert.equal(isWithinYTD(ymd(2025, 10, 22), AS_OF), true, "Day before cutoff should be included");
  assert.equal(isWithinYTD(ymd(2025, 10, 23), AS_OF), true, "Cutoff day should be included");
  assert.equal(isWithinYTD(ymd(2025, 10, 24), AS_OF), false, "Day after cutoff should be excluded");
});

test("isWithinYTD applies cutoff using as-of month/day for prior years", () => {
  assert.equal(isWithinYTD(ymd(2024, 10, 22), AS_OF), true, "Previous year before cutoff should be included");
  assert.equal(isWithinYTD(ymd(2024, 10, 23), AS_OF), true, "Previous year on cutoff day should be included");
  assert.equal(isWithinYTD(ymd(2024, 10, 24), AS_OF), false, "Previous year after cutoff should be excluded");

  assert.equal(isWithinYTD(ymd(2023, 1, 1), AS_OF), true, "Any date earlier in the calendar year should be included");
  assert.equal(isWithinYTD(ymd(2023, 12, 31), AS_OF), false, "Dates beyond the cutoff month/day should be excluded");
});

test("isWithinYTD returns false for invalid or missing dates", () => {
  assert.equal(isWithinYTD(null as unknown as Date, AS_OF), false);
  assert.equal(isWithinYTD(undefined as unknown as Date, AS_OF), false);
  assert.equal(isWithinYTD("invalid-date", AS_OF), false);
});

test("sumSkipNulls works with YTD filtered values across multiple years", () => {
  const rows = [
    { date: ymd(2025, 10, 22), value: 100 },
    { date: ymd(2025, 10, 24), value: 200 },
    { date: ymd(2024, 10, 23), value: 300 },
    { date: ymd(2024, 12, 1), value: 400 },
    { date: ymd(2023, 3, 5), value: 500 },
    { date: null, value: 600 },
    { date: ymd(2023, 11, 15), value: Number.NaN },
  ];

  const ytdValues = rows.map((row) =>
    isWithinYTD(row.date as Date | string | number, AS_OF) ? row.value : null
  );

  assert.equal(
    sumSkipNulls(ytdValues),
    900,
    "Only YTD values should be summed (100 + 300 + 500)"
  );

  const mixedValues = [100, null, undefined, Number.NaN, 50];
  assert.equal(sumSkipNulls(mixedValues), 150, "Aggregator should ignore non-finite values");
});
