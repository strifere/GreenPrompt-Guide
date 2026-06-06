import { NextRequest } from "next/server";
import { insertObjectAPI } from "@/lib/admin-actions-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return await insertObjectAPI("dataset", request);
}
