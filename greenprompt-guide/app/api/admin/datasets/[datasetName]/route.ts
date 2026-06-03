import { NextRequest } from "next/server";
import { deleteObjectAPI, updateObjectAPI } from "@/lib/admin-actions-server";

type RouteContext = {
  params: Promise<{ datasetName: string }> | { datasetName: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { datasetName } = await Promise.resolve(context.params);
  return await updateObjectAPI("datasets", request, datasetName);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { datasetName } = await Promise.resolve(context.params);
  return await deleteObjectAPI("datasets", datasetName);
}