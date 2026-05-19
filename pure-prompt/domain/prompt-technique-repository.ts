import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const promptTechniqueDetailsArgs = Prisma.validator<Prisma.PromptTechniqueDefaultArgs>()({
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

export type PromptTechniqueDetails = Prisma.PromptTechniqueGetPayload<typeof promptTechniqueDetailsArgs>;

export async function getPromptTechniqueByName(
  promptTechniqueName: string,
): Promise<PromptTechniqueDetails | null> {
  return prisma.promptTechnique.findUnique({
    ...promptTechniqueDetailsArgs,
    where: { name: promptTechniqueName },
  });
}
