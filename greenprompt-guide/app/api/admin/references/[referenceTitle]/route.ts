import { NextRequest } from "next/server";
import { deleteObjectAPI, updateObjectAPI } from "@/lib/admin-actions-server";

type RouteContext = {
  params: Promise<{ referenceTitle: string }> | { referenceTitle: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { referenceTitle } = await Promise.resolve(context.params);
  return await updateObjectAPI("references", request, referenceTitle);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { referenceTitle } = await Promise.resolve(context.params);
  return await deleteObjectAPI("references", referenceTitle);
}
