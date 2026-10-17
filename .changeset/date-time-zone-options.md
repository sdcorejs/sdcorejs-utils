---
"@sdcorejs/utils": minor
---

Add opt-in fixed time zones to the date and filter helpers.

`DateUtilities.toFormat`, `parseFrom`, `begin`, and `end` accept a new optional `TimeZoneOptions` (`{ timeZone }`, an IANA id such as `Asia/Ho_Chi_Minh`). With it, an instant shows the wall clock of that zone, a zone-less or date-only string keeps its own digits and is read as a wall clock in the zone, and day bounds use the zone's calendar (23- and 25-hour days included). New helpers: `DateUtilities.parse` (lenient, returns `null` instead of throwing), `isValidTimeZone`, `toZonedParts`, and `fromZonedParts` (a repeated wall clock takes the earlier offset, a skipped one moves forward), plus the exported `TimeZoneOptions` and `ZonedDateTimeParts` types.

`FilterUtilities` accepts `timeZone` in `MatchOptions` and `ToEpochOptions`, so `date-today`, `date-relative`, and zone-less date operands resolve in that zone; `resolveRelativeDate` takes the same option.

Offsets come from the runtime's `Intl` data. Numeric offsets such as `+07:00` are rejected because they carry no offset history. Calls without the option behave exactly as in 1.2.6.
