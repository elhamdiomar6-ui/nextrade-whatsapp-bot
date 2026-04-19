import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const id = (session.user as { id?: string }).id;
  if (!id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!user) redirect("/login");

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }}
    />
  );
}
