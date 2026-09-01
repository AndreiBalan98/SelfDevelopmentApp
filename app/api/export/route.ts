import { NextResponse } from "next/server";
import { buildExport, markExported } from "@/lib/backup";
import { today } from "@/lib/day";

// The one URL that hands over everything. It sits behind the PIN gate in
// proxy.ts like every other page — that's why the gate was built first.
//
// Never cached: a backup served from a cache would be a backup of the past.
export const dynamic = "force-dynamic";

function failed(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const result = await buildExport();
    if ("error" in result) return failed(result.error);

    await markExported();

    return new NextResponse(JSON.stringify(result.payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="life-tracker-${today()}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return failed(error instanceof Error ? error.message : String(error));
  }
}
