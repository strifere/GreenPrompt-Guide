import { NextRequest } from "next/server";
import { deleteObjectAPI, updateObjectAPI } from "@/lib/admin-actions-server";

type RouteContext = {
  params: Promise<{ hyperparameterId: string }> | { hyperparameterId: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { hyperparameterId } = await Promise.resolve(context.params);
  return await updateObjectAPI("hyperparameter", request, hyperparameterId);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { hyperparameterId } = await Promise.resolve(context.params);
  return await deleteObjectAPI("hyperparameter", hyperparameterId);
}