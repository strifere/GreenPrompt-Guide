import { NextRequest } from "next/server";
import { deleteObjectAPI, updateObjectAPI } from "@/lib/admin-actions-server";

type RouteContext = {
  params: Promise<{ modelName: string }> | { modelName: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { modelName } = await Promise.resolve(context.params);
  return await updateObjectAPI("models", request, modelName);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { modelName } = await Promise.resolve(context.params);
  return await deleteObjectAPI("models", modelName);
}