import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const datasetDetailsArgs = Prisma.validator<Prisma.DatasetDefaultArgs>()({
  include: {
    papers: {
      include: {
        reference: {
          include: {
            practices: {
              include: {
                practice: true,
              },
            },
          },
        },
      },
    },
  },
});

export type DatasetDetails = Prisma.DatasetGetPayload<typeof datasetDetailsArgs>;

export async function getDatasetByName(
  datasetName: string,
): Promise<DatasetDetails | null> {
  return prisma.dataset.findUnique({
    ...datasetDetailsArgs,
    where: { name: datasetName },
  });
}
