import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const listReferencesArgs = Prisma.validator<Prisma.ReferenceFindManyArgs>()({
  orderBy: { title: "asc" },
  include: {
        hyperparameters: true,
        datasets: { include: { dataset: true } },
        models: { include: { model: true } },
        practices: {
            include: {
                practice: true,
            },
        },
        promptTechniques: { include: { promptTechnique: true } }
    },
});

const referenceDetailsArgs = Prisma.validator<Prisma.ReferenceDefaultArgs>()({
  include: {
    hyperparameters: true,
    datasets: { include: { dataset: true } },
    models: { include: { model: true } },
    practices: {
      include: {
        practice: true,
      },
    },
    promptTechniques: { include: { promptTechnique: true } }
  },
});

export type ReferenceListItem = Prisma.ReferenceGetPayload<typeof listReferencesArgs>;
export type ReferenceDetails = Prisma.ReferenceGetPayload<typeof referenceDetailsArgs> & {
  link: string | null;
};

export async function listReferences(): Promise<ReferenceListItem[]> {
  return prisma.reference.findMany(listReferencesArgs);
}

export async function getReferenceByTitle(
  referenceTitle: string,
): Promise<ReferenceDetails | null> {
  return prisma.reference.findUnique({
    ...referenceDetailsArgs,
    where: { title: referenceTitle },
  }) as Promise<ReferenceDetails | null>;
}

