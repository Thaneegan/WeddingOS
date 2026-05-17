import { prisma } from "@/lib/prisma";

export const tamilEventTemplate = [
  { name: "Engagement / pre-wedding", type: "ENGAGEMENT", offsetDays: -90, startTime: "18:00", endTime: "21:00" },
  { name: "Nalangu or family ceremony", type: "NALANGU", offsetDays: -3, startTime: "17:00", endTime: "20:00" },
  { name: "Mehndi / Sangeet", type: "MEHNDI_SANGEET", offsetDays: -2, startTime: "18:00", endTime: "23:00" },
  { name: "Wedding ceremony", type: "CEREMONY", offsetDays: 0, startTime: "09:00", endTime: "12:30" },
  { name: "Reception", type: "RECEPTION", offsetDays: 0, startTime: "18:00", endTime: "23:30" },
  { name: "Post-wedding family meal", type: "FAMILY_MEAL", offsetDays: 1, startTime: "12:00", endTime: "15:00" },
] as const;

export const tamilCeremonyChecklist = [
  "Confirm thaali, koorai saree, and ceremony trays",
  "Confirm garland delivery and backup garlands",
  "Confirm priest arrival time and ceremony item list",
  "Share nadaswaram/thavil timing with venue",
  "Build photo/video shot list for family moments",
  "Confirm vendor arrival sheet and emergency contact list",
] as const;

export const tamilFamilyResponsibilities = [
  "Bride family lead",
  "Groom family lead",
  "Sibling logistics lead",
  "Transportation lead",
  "Food and late-night meal lead",
] as const;

export function offsetDate(baseDate: Date, days: number) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

export function combineDateAndTime(date: Date, time?: string | null) {
  const combined = new Date(date);
  const [hours = "0", minutes = "0"] = (time ?? "00:00").split(":");
  combined.setHours(Number(hours), Number(minutes), 0, 0);
  return combined;
}

export async function ensureDefaultWeddingEvents(weddingId: string) {
  const existing = await prisma.weddingEvent.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { date: "asc" }],
  });

  if (existing.length) {
    return existing;
  }

  const wedding = await prisma.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    select: { date: true, location: true },
  });

  await prisma.weddingEvent.createMany({
    data: tamilEventTemplate.map((event, index) => {
      const eventDate = offsetDate(wedding.date, event.offsetDays);
      return {
        weddingId,
        name: event.name,
        type: event.type,
        date: eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: wedding.location,
        sortOrder: index,
      };
    }),
  });

  return prisma.weddingEvent.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: "asc" }, { date: "asc" }],
  });
}
