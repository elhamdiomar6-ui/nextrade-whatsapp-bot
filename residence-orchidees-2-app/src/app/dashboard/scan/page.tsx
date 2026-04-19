import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getScanHistory } from "@/actions/smart-intake";
import { ScanClient } from "./ScanClient";
import type { ScanLog } from "@prisma/client";

export default async function ScanPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const history = await getScanHistory();
  return <ScanClient history={history.map((h: ScanLog) => ({
    id: h.id,
    fileName: h.fileName,
    fileUrl: h.fileUrl ?? null,
    docType: h.docType,
    confidence: h.confidence,
    actionsExecuted: h.actionsExecuted ? JSON.parse(h.actionsExecuted) : [],
    createdAt: h.createdAt.toISOString(),
  }))} />;
}
