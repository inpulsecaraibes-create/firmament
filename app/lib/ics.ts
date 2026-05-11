export function generateICS(events: { title: string; date: Date; description?: string }[]): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FIRMAMENT//Duleme & Cie//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@frmmnt.fr`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(ev.date)}`,
      `DTEND:${fmt(new Date(ev.date.getTime() + 60 * 60 * 1000))}`,
      `SUMMARY:${ev.title}`,
      ev.description ? `DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}` : "",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export function downloadICS(content: string, filename = "firmament-actions.ics") {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
