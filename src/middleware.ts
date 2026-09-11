import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api, _next, _vercel va fayllardan tashqari barcha yo'llar
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
