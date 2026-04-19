import { prisma } from "./prisma";

const INSTANCE = process.env.WA_INSTANCE ?? "";
const TOKEN    = process.env.WA_TOKEN    ?? "";
const BASE_URL = `https://api.ultramsg.com/${INSTANCE}`;

/**
 * Envoie un message WhatsApp via UltraMsg.
 * Ne lance pas d'exception si l'envoi échoue (log seulement).
 */
export async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!INSTANCE || !TOKEN || !to) return;

  try {
    const params = new URLSearchParams({ token: TOKEN, to, body, priority: "1" });
    const res = await fetch(`${BASE_URL}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) console.error(`[WA] Échec ${to} — HTTP ${res.status}`);
    else console.log(`[WA] ✓ Message envoyé à ${to}`);
  } catch (e) {
    console.error(`[WA] Erreur réseau vers ${to}:`, e);
  }
}

/** Lit un paramètre WA depuis la DB, avec fallback .env */
async function getWASetting(key: string): Promise<string> {
  try {
    const s = await prisma.appSetting.findUnique({ where: { key } });
    if (s?.value) return s.value;
  } catch {}
  return process.env[key] ?? "";
}

/** Numéro d'Omar (admin principal). */
export async function getOmarPhone(): Promise<string> {
  return getWASetting("WA_OMAR");
}

/** Numéros des 4 copropriétaires (filtre les vides). */
export async function getAllOwners(): Promise<string[]> {
  const keys = ["WA_OMAR", "WA_MOHAMED", "WA_BRAHIM", "WA_LAHOUCINE"];
  const results = await Promise.all(keys.map(getWASetting));
  return results.filter(Boolean);
}

/** Envoie le même message à tous les copropriétaires. */
export async function notifyAllOwners(message: string): Promise<void> {
  const numbers = await getAllOwners();
  await Promise.all(numbers.map((n) => sendWhatsApp(n, message)));
}
