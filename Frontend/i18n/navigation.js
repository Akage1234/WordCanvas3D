import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link and usePathname (the pathname comes back without the locale prefix).
export const { Link, usePathname } = createNavigation(routing);
