import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const hyperparameterDetailsArgs = Prisma.validator<Prisma.HyperparameterDefaultArgs>()({
});

export type HyperparameterDetails = Prisma.HyperparameterGetPayload<typeof hyperparameterDetailsArgs>;

export async function getHyperparameterById(
  hyperparameterId: number,
): Promise<HyperparameterDetails | null> {
  return prisma.hyperparameter.findUnique({
    ...hyperparameterDetailsArgs,
    where: { id: hyperparameterId },
  });
}
