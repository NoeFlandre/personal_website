import { SITE } from "../../../site-config.js";

const dateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE.timezone,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const monthDay = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE.timezone,
  month: "short",
  day: "numeric",
});

export function getSiteDateParts(date: Date) {
  const parts = dateParts.formatToParts(date);
  const partValue = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: partValue("year"), month: partValue("month"), day: partValue("day") };
}

export function formatSiteMonthDay(date: Date) {
  return monthDay.format(date);
}
