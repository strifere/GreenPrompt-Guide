import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const listPracticesArgs = Prisma.validator<Prisma.PracticeFindManyArgs>()({
  orderBy: { name: "asc" },
  include: {
    categories: { include: { category: true } },
    models: { include: { model: true } },
    prompts: { include: { promptTechnique: true } },
    hyperparameters: true,
    papers: {
      include: {
        reference: {
          include: {
            datasets: { include: { dataset: true } },
          },
        },
      },
    },
  },
});

const practiceDetailsArgs = Prisma.validator<Prisma.PracticeDefaultArgs>()({
  include: {
    categories: { include: { category: true } },
    prompts: { include: { promptTechnique: true } },
    models: { include: { model: true } },
    hyperparameters: true,
    metrics: true,
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
export type SidebarData = {
  categories: string[];
  models: string[];
  promptTechniques: string[];
  hyperparameters: string[];
  datasets: string[];
};

export async function listPractices(): Promise<PracticeListItem[]> {
  return prisma.practice.findMany(listPracticesArgs);
}

export async function getPracticeByName(
  practiceName: string,
): Promise<PracticeDetails | null> {
  return prisma.practice.findUnique({
    ...practiceDetailsArgs,
    where: { name: practiceName },
  });
}

export async function listSidebarData(): Promise<SidebarData> {
  const [categories, models, promptTechniques, hyperparameters, datasets] =
    await prisma.$transaction([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.model.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.promptTechnique.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.hyperparameter.findMany({
      distinct: ["name"],
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.dataset.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    ]);

  return {
    categories: categories.map((category) => category.name),
    models: models.map((model) => model.name),
    promptTechniques: promptTechniques.map((technique) => technique.name),
    hyperparameters: hyperparameters.map((hyperparameter) => hyperparameter.name),
    datasets: datasets.map((dataset) => dataset.name),
  };
}
