export function degToCompass(deg: number) {
  if (!Number.isFinite(deg)) return "—";
  const dirs = [
    "North","NNE","NE","ENE","East","ESE","SE","SSE",
    "South","SSW","SW","WSW","West","WNW","NW","NNW"
  ];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[idx];
}

export function safeDatePartsUTC(datetime: unknown) {
  const d = new Date(String(datetime));
  const t = d.getTime();
  if (!Number.isFinite(t)) return { valid: false as const, date: "—", time: "—", ts: NaN };

  const date = d.toLocaleDateString("en-CA", { timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { valid: true as const, date, time, ts: t };
}