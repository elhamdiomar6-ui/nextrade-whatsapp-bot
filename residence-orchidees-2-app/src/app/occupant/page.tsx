import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Redirect: authenticated occupants → mon-espace, others → login with hint
export default async function OccupantPortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?portal=occupant");
  }
  const role = (session.user as { role?: string }).role;
  if (role === "OCCUPANT") {
    redirect("/dashboard/mon-espace");
  }
  // Non-occupant authenticated user → dashboard
  redirect("/dashboard");
}
