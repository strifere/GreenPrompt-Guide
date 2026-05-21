import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const modelDetailsArgs = Prisma.validator<Prisma.ModelDefaultArgs>()({
  include: {
    practices: {
      include: {
        practice: true,
      },
    },
    references: {
      include: {
        reference: true,
      },
    },
  },
});

export type ModelDetails = Prisma.ModelGetPayload<typeof modelDetailsArgs>;

export async function getModelByName(
  modelName: string,
): Promise<ModelDetails | null> {
  return prisma.model.findUnique({
    ...modelDetailsArgs,
    where: { name: modelName },
  });
}
