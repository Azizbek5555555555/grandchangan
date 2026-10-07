import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser, STAFF_ROLES } from "@/lib/auth/guard";
import { firstSection } from "@/lib/auth/permissions";

/** /admin — rolga qarab birinchi ochiq bo'limga yo'naltiradi (oshxona -> buyurtmalar va h.k.) */
export default async function AdminIndex() {
  const locale = await getLocale();
  const user = await currentUser();
  const first = user && STAFF_ROLES.includes(user.role) ? firstSection(user.role) : null;
  redirect({ href: first ? `/admin/${first}` : "/admin/login", locale });
}
