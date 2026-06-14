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
    metrics: {
      include: {
        energyMetrics: true,
        accuracyMetrics: true,
      },
    },
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
export type PracticeGreenScore = { name: string; greenScore: number };
export type SelectableItem = { value: string; tooltip: string | null };
export type SidebarData = {
  categories: SelectableItem[];
  models: SelectableItem[];
  promptTechniques: SelectableItem[];
  hyperparameters: SelectableItem[];
  datasets: SelectableItem[];
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

export async function deletePractice(practiceName: string): Promise<void> {
  await prisma.practice.delete({ where: { name: practiceName } });
}

export async function listPracticeGreenScores(): Promise<PracticeGreenScore[]> {
  return prisma.practice.findMany({
    orderBy: { name: "asc" },
    select: { name: true, greenScore: true },
  });
}

export async function listSidebarData(): Promise<SidebarData> {
  const [categories, models, promptTechniques, hyperparameters, datasets] =
    await prisma.$transaction([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true, description: true} }),
    prisma.model.findMany({ orderBy: { name: "asc" }, select: { name: true, description: true} }),
    prisma.promptTechnique.findMany({
      orderBy: { name: "asc" },
      select: { name: true, description: true },
    }),
    prisma.hyperparameter.findMany({
      distinct: ["name"],
      orderBy: { name: "asc" },
      select: { name: true, value: true },
    }),
    prisma.dataset.findMany({ orderBy: { name: "asc" }, select: { name: true, description: true } }),
    ]);

  return {
    categories: categories.map((category) => ({ value: category.name, tooltip: category.description })),
    models: models.map((model) => ({ value: model.name, tooltip: model.description })),
    promptTechniques: promptTechniques.map((technique) => ({ value: technique.name, tooltip: technique.description })),
    hyperparameters: hyperparameters.map((hyperparameter) => ({ value: hyperparameter.name, tooltip: hyperparameter.value })),
    datasets: datasets.map((dataset) => ({ value: dataset.name, tooltip: dataset.description })),
  };
}
