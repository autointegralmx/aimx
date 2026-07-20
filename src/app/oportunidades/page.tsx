import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy URL — keep permanent redirect to the canonical auction board. */
export default function OportunidadesRedirectPage() {
  permanentRedirect("/subastas");
}
