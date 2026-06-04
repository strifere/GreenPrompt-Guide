import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPracticeByName } from "@/domain/practice-repository";
import { prisma } from "@/lib/prisma";
import styles from "../../../admin.module.css";
import { PracticeForm } from "../../practice-form";

type EditPracticePageProps = {
	params: Promise<{ practiceName: string }>;
};

function decodePracticeName(practiceName: string) {
	try {
		return decodeURIComponent(practiceName);
	} catch {
		return practiceName;
	}
}

export default async function EditPracticePage({ params }: Readonly<EditPracticePageProps>) {
	const { practiceName } = await params;
	const decodedPracticeName = decodePracticeName(practiceName);
	const practice = await getPracticeByName(decodedPracticeName);

	if (!practice) {
		notFound();
	}

	const [categories, promptTechniques, models, references, hyperparameters] = await prisma.$transaction([
		prisma.category.findMany({
			orderBy: { name: "asc" },
			select: {
				name: true,
				description: true,
				tactic: true,
			},
		}),
		prisma.promptTechnique.findMany({
			orderBy: { name: "asc" },
			select: { name: true },
		}),
		prisma.model.findMany({
			orderBy: { name: "asc" },
			select: { name: true },
		}),
		prisma.reference.findMany({
			orderBy: { title: "asc" },
			select: { title: true, year: true, authors: true },
		}),
		prisma.hyperparameter.findMany({
			orderBy: [{ name: "asc" }, { value: "asc" }],
			select: {
				id: true,
				name: true,
				value: true,
				dataType: true,
				referenceTitle: true,
			},
		}),
	]);

	return (
		<section className={styles.pageSection}>
			<header className={styles.sectionHeader}>
				<div>
					<p className={styles.kicker}>Practices</p>
					<h2 className={styles.sectionTitle}>Modify practice</h2>
					<p className={styles.sectionCopy}>
						Update the practice details, relationships, examples, and metrics.
					</p>
				</div>
				<Link href="/admin/practices" className={`ghost-btn ${styles.headerAction}`}>
					<ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
					Back to practices
				</Link>
			</header>

			<PracticeForm
				mode="edit"
				method="PATCH"
				categories={categories}
				promptTechniques={promptTechniques}
				models={models}
				references={references}
				hyperparameters={hyperparameters}
				submitUrl={`/api/admin/practices/${encodeURIComponent(practice.name)}`}
				redirectPath="/admin/practices"
				initialValues={{
					practiceTitle: practice.name,
					practiceDescription: practice.description,
					greenScore: practice.greenScore,
					tactic: practice.tactic,
					selectedCategoryNames: practice.categories.map((entry) => entry.category.name),
					selectedPromptTechniqueNames: practice.prompts.map((entry) => entry.promptTechnique.name),
					selectedModelNames: practice.models.map((entry) => entry.model.name),
					selectedReferenceTitles: practice.papers.map((entry) => entry.reference.title),
					selectedHyperparameterIds: practice.hyperparameters.map((hyperparameter) => hyperparameter.id),
					examples: practice.practiceExamples.map((example) => ({
						scenario: example.scenario,
						originalPrompts: example.originalPrompts,
						improvedPrompts: example.improvedPrompts,
						observations: example.observations,
					})),
					metrics: practice.metrics.map((metric) => {
						const energyMetric = metric.energyMetrics[0];
						const accuracyMetric = metric.accuracyMetrics[0];

						return {
							subtype: metric.subtype,
							title: metric.title,
							value: metric.value,
							description: metric.description ?? "",
							confidence: String(metric.confidence),
							energyType: energyMetric?.type ?? "REDUCTION",
							minValue: energyMetric?.minValue === null || energyMetric?.minValue === undefined ? "" : String(energyMetric.minValue),
							maxValue: energyMetric?.maxValue === null || energyMetric?.maxValue === undefined ? "" : String(energyMetric.maxValue),
							bestGuessValue: energyMetric?.bestGuessValue === undefined ? "" : String(energyMetric.bestGuessValue),
							unit: energyMetric?.unit ?? "PERCENTAGE",
							accuracyLevel: accuracyMetric?.level ?? "SAME_OR_BETTER",
							accuracyScore: accuracyMetric?.score === null || accuracyMetric?.score === undefined ? "" : String(accuracyMetric.score),
						};
					}),
				}}
			/>
		</section>
	);
}
