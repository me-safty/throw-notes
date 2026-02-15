type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string) {
  const existing = formatterCache.get(timezone);
  if (existing) {
    return existing;
  }

  const created = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  formatterCache.set(timezone, created);
  return created;
}

export function assertValidTimezone(timezone: string) {
  try {
    getFormatter(timezone).format(Date.now());
  } catch {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

function getLocalDateTime(ms: number, timezone: string): LocalDateTime {
  const parts = getFormatter(timezone).formatToParts(ms);
  const parsed: Record<string, number> = {};

  for (const part of parts) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      parsed[part.type] = Number(part.value);
      continue;
    }

    if (part.type === "hour" || part.type === "minute" || part.type === "second") {
      parsed[part.type] = Number(part.value);
    }
  }

  return {
    year: parsed.year,
    month: parsed.month,
    day: parsed.day,
    hour: parsed.hour,
    minute: parsed.minute,
    second: parsed.second,
  };
}

function localTimeToUtcMs(localDateTime: LocalDateTime, timezone: string) {
  let utcGuess = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    localDateTime.second,
  );

  const targetAsUtcMs = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    localDateTime.second,
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const zonedDateTime = getLocalDateTime(utcGuess, timezone);
    const zonedAsUtcMs = Date.UTC(
      zonedDateTime.year,
      zonedDateTime.month - 1,
      zonedDateTime.day,
      zonedDateTime.hour,
      zonedDateTime.minute,
      zonedDateTime.second,
    );

    const difference = targetAsUtcMs - zonedAsUtcMs;

    if (difference === 0) {
      return utcGuess;
    }

    utcGuess += difference;
  }

  return utcGuess;
}

export function computeNextRunAtMs(args: {
  hour: number;
  minute: number;
  timezone: string;
  fromMs?: number;
}) {
  assertValidTimezone(args.timezone);

  const fromMs = args.fromMs ?? Date.now();
  const nowInTimezone = getLocalDateTime(fromMs, args.timezone);

  const candidateToday = localTimeToUtcMs(
    {
      year: nowInTimezone.year,
      month: nowInTimezone.month,
      day: nowInTimezone.day,
      hour: args.hour,
      minute: args.minute,
      second: 0,
    },
    args.timezone,
  );

  if (candidateToday > fromMs + 1_000) {
    return candidateToday;
  }

  const nextDayReference = new Date(
    Date.UTC(nowInTimezone.year, nowInTimezone.month - 1, nowInTimezone.day),
  );
  nextDayReference.setUTCDate(nextDayReference.getUTCDate() + 1);

  return localTimeToUtcMs(
    {
      year: nextDayReference.getUTCFullYear(),
      month: nextDayReference.getUTCMonth() + 1,
      day: nextDayReference.getUTCDate(),
      hour: args.hour,
      minute: args.minute,
      second: 0,
    },
    args.timezone,
  );
}
