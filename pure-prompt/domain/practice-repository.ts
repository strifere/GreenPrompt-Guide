import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const listPracticesArgs = Prisma.validator<Prisma.PracticeFindManyArgs>()({
  orderBy: { id: "asc" },
  include: {
    categories: { include: { category: true } },
    papers: {
      include: {
        reference: true,
      },
    },
  },
});

const practiceDetailsArgs = Prisma.validator<Prisma.PracticeDefaultArgs>()({
  include: {
    categories: { include: { category: true } },
    prompts: { include: { promptTechnique: true } },
    models: { include: { model: true } },
    papers: {
      include: {
        reference: {
          include: {
            datasets: { include: { dataset: true } },
          },
        },
      },
    },
    practiceExamples: true,
  },
});

export type PracticeListItem = Prisma.PracticeGetPayload<typeof listPracticesArgs>;
export type PracticeDetails = Prisma.PracticeGetPayload<typeof practiceDetailsArgs>;

export async function listPractices(): Promise<PracticeListItem[]> {
  return prisma.practice.findMany(listPracticesArgs);
}

export async function getPracticeById(
  practiceId: number,
): Promise<PracticeDetails | null> {
  return prisma.practice.findUnique({
    ...practiceDetailsArgs,
    where: { id: practiceId },
  });
}

export async function listSidebarData() {
  const [categories, models, promptTechniques] = await prisma.$transaction([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.model.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.promptTechnique.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return {
    categories: categories.map((category) => category.name),
    models: models.map((model) => model.name),
    promptTechniques: promptTechniques.map((technique) => technique.name),
  };
}
