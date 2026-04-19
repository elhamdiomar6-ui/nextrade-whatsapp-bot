import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWhatsAppSettings } from "@/actions/whatsapp-settings";
import { WhatsAppConfigClient } from "./WhatsAppConfigClient";

export default async function WhatsAppConfigPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") redirect("/dashboard");

  const settings = await getWhatsAppSettings();

  return (
    <WhatsAppConfigClient
      initial={settings}
      instance={process.env.WA_INSTANCE ?? ""}
    />
  );
}
