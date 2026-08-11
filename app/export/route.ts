import { todayIso } from "@/lib/cost";
import { allItems, dbStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Everything, as it is stored: integer cents and ISO dates, nothing derived. */
export function GET(): Response {
  const status = dbStatus();
  if (!status.ok) {
    return new Response(JSON.stringify({ error: status.detail, path: status.path }, null, 2), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      currency: "ZAR",
      price_unit: "cents",
      items: allItems(),
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="kept-${todayIso()}.json"`,
    },
  });
}
