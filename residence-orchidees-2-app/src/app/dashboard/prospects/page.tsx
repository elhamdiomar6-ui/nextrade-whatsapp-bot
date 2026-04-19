import { prisma } from "@/lib/prisma";
import { ProspectsClient } from "./ProspectsClient";
import { getAttachmentMap } from "@/lib/attachments";

export default async function ProspectsPage() {
  const [prospects, lots] = await Promise.all([
    prisma.prospect.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        contacts: { orderBy: { date: "desc" } },
        prospectLots: { include: { lot: true } },
        _count: { select: { contacts: true } },
      },
    }),
    prisma.lot.findMany({ where: { status: "DISPONIBLE" }, orderBy: { name: "asc" } }),
  ]);

  const attMap = await getAttachmentMap("prospect", prospects.map((p) => p.id));

  const statusCounts = {
    NOUVEAU: 0, CONTACTE: 0, VISITE: 0, NEGOCIATION: 0, SIGNE: 0, PERDU: 0,
  };
  for (const p of prospects) statusCounts[p.status]++;

  return (
    <ProspectsClient
      prospects={prospects.map((p) => ({
        id: p.id, name: p.name, phone: p.phone, whatsapp: p.whatsapp,
        email: p.email, status: p.status, notes: p.notes, source: p.source,
        contactsCount: p._count.contacts,
        lastContact: p.contacts[0]
          ? { type: p.contacts[0].type, date: p.contacts[0].date.toISOString() }
          : null,
        lots: p.prospectLots.map((pl) => ({ id: pl.lot.id, name: pl.lot.name, status: pl.lot.status })),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        attachments: attMap[p.id] ?? [],
        contacts: p.contacts.map((c) => ({
          id: c.id, type: c.type, notes: c.notes, date: c.date.toISOString(),
        })),
      }))}
      statusCounts={statusCounts}
      availableLots={lots.map((l) => ({ id: l.id, name: l.name, status: l.status, kind: l.kind }))}
    />
  );
}
