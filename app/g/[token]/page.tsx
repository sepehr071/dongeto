import { notFound } from "next/navigation";
import { GroupApp } from "@/components/GroupApp";
import { loadGroup } from "@/lib/group";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const group = await loadGroup(token);
  if (!group) notFound();
  return <GroupApp initial={group} />;
}
