"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactNode, type SyntheticEvent } from "react";
import styles from "../admin.module.css";

export type CategoryOption = {
	name: string;
	description: string | null;
	tactic: string;
};

export type NamedOption = {
	name: string;
};

export type ReferenceOption = {
	title: string;
	year: number;
};

export type HyperparameterOption = {
	id: number;
	name: string;
	value: string;
	dataType: string;
	referenceTitle: string;
};

type ExampleDraft = {
	id: number;
	scenario: string;
	originalPrompts: string;
	improvedPrompts: string;
	observations: string;
};

type MetricDraft = {
	id: number;
	subtype: "GENERIC" | "ENERGY" | "ACCURACY";
	title: string;
	value: string;
	description: string;
	confidence: string;
	energyType: "REDUCTION" | "CONSUMPTION" | "EFFICIENCY";
	minValue: string;
	maxValue: string;
	bestGuessValue: string;
	unit: string;
	accuracyLevel:
		| "WORSE"
		| "SAME_OR_WORSE"
		| "SAME"
		| "SAME_OR_BETTER"
		| "BETTER"
		| "MUCH_BETTER"
		| "NEAR_PERFECT";
	accuracyScore: string;
};

type PracticeExampleBody = Omit<ExampleDraft, "id">;
type ExampleDraftTextField = keyof PracticeExampleBody;
type MetricDraftTextField = Exclude<keyof MetricDraft, "id">;

type PracticeMetricBody = {
	subtype: MetricDraft["subtype"];
	title: string;
	value: string;
	description: string;
	confidence: string;
	energy: {
		type: MetricDraft["energyType"];
		minValue: string;
		maxValue: string;
		bestGuessValue: string;
		unit: string;
	} | null;
	accuracy: {
		level: MetricDraft["accuracyLevel"];
		score: string;
	} | null;
};

type PracticeFormInitialValues = {
	practiceTitle?: string;
	practiceDescription?: string;
	greenScore?: number;
	tactic?: string;
	referenceTitle?: string;
	referenceAuthors?: string;
	referenceAbstract?: string;
	referenceKeywords?: string;
	referenceYear?: number;
	referenceStudyType?: string;
	referenceDomain?: string | null;
	referenceTask?: string | null;
	referenceVenue?: string | null;
	referenceToolAvailability?: string | null;
	referenceLink?: string | null;
	examplesText?: string | null;
	examples?: PracticeExampleBody[];
	selectedCategoryNames?: string[];
	selectedPromptTechniqueNames?: string[];
	selectedModelNames?: string[];
	selectedReferenceTitles?: string[];
	selectedHyperparameterIds?: number[];
	metrics?: Array<Omit<MetricDraft, "id">>;
};

type PracticeFormSource = {
	title: string;
	summary: string;
	description: string;
	examples: string | null;
};

type PracticeFormProps = {
	categories: CategoryOption[];
	submitUrl: string;
	redirectPath: string;
	initialValues?: PracticeFormInitialValues;
	source?: PracticeFormSource;
	mode?: "create" | "edit";
	method?: "POST" | "PATCH";
	promptTechniques?: NamedOption[];
	models?: NamedOption[];
	references?: ReferenceOption[];
	hyperparameters?: HyperparameterOption[];
};

type PracticeCreateFormBody = {
	practice: {
		name: string;
		description: string;
		greenScore: number;
		tactic: string;
	};
	category: {
		mode: "existing" | "new";
		name: string;
		description: string;
		tactic: string;
	};
	examples: PracticeExampleBody[];
	reference: {
		title: string;
		authors: string;
		abstract: string;
		keywords: string;
		year: string;
		studyType: string;
		domain: string;
		task: string;
		venue: string;
		toolAvailability: string;
		link: string;
	};
};

type PracticeUpdateFormBody = {
	practice: PracticeCreateFormBody["practice"];
	categoryNames: string[];
	promptTechniqueNames: string[];
	modelNames: string[];
	referenceTitles: string[];
	hyperparameterIds: number[];
	examples: PracticeExampleBody[];
	metrics: PracticeMetricBody[];
};

function createEmptyExample(id: number): ExampleDraft {
	return {
		id,
		scenario: "",
		originalPrompts: "",
		improvedPrompts: "",
		observations: "",
	};
}

function createEmptyMetric(id: number): MetricDraft {
	return {
		id,
		subtype: "GENERIC",
		title: "",
		value: "",
		description: "",
		confidence: "0.8",
		energyType: "REDUCTION",
		minValue: "",
		maxValue: "",
		bestGuessValue: "",
		unit: "PERCENTAGE",
		accuracyLevel: "SAME_OR_BETTER",
		accuracyScore: "",
	};
}

function createInitialExamples(initialValues: PracticeFormInitialValues | undefined) {
	if (initialValues?.examples?.length) {
		return initialValues.examples.map((example, index) => ({ ...example, id: index + 1 }));
	}

	if (!initialValues?.examplesText?.trim()) {
		return [createEmptyExample(1)];
	}

	return [
		{
			id: 1,
			scenario: "From request notes",
			originalPrompts: initialValues.examplesText.trim(),
			improvedPrompts: "",
			observations: "",
		},
	];
}

function createInitialMetrics(initialValues: PracticeFormInitialValues | undefined) {
	if (!initialValues?.metrics?.length) {
		return [createEmptyMetric(1)];
	}

	return initialValues.metrics.map((metric, index) => ({ ...metric, id: index + 1 }));
}

function toggleSelection<T>(currentValues: T[], value: T) {	
	return currentValues.includes(value)
		? currentValues.filter((currentValue) => currentValue !== value)
		: [...currentValues, value];
}

function MultiCheckboxSection({
	title,
	emptyMessage,
	children,
}: Readonly<{
	title: string;
	emptyMessage: string;
	children: ReactNode;
}>) {
	return (
		<section className={styles.creationSection}>
			<h3 className={styles.creationSectionTitle}>{title}</h3>
			<div className={styles.creationCategoryToggle}>
				{children || <p className={styles.creationHint}>{emptyMessage}</p>}
			</div>
		</section>
	);
}

export function PracticeForm({
	categories,
	submitUrl,
	redirectPath,
	initialValues,
	source,
	mode = "create",
	method = "POST",
	promptTechniques = [],
	models = [],
	references = [],
	hyperparameters = [],
}: Readonly<PracticeFormProps>) {
	const router = useRouter();
	const isEditMode = mode === "edit";
	const [practiceTitle, setPracticeTitle] = useState(initialValues?.practiceTitle ?? "");
	const [practiceDescription, setPracticeDescription] = useState(initialValues?.practiceDescription ?? "");
	const [greenScore, setGreenScore] = useState(String(initialValues?.greenScore ?? 50));
	const [tactic, setTactic] = useState(initialValues?.tactic ?? "GREEN_PRACTICE");
	const [categoryMode, setCategoryMode] = useState<"existing" | "new">(categories.length > 0 ? "existing" : "new");
	const [existingCategoryName, setExistingCategoryName] = useState(initialValues?.selectedCategoryNames?.[0] ?? categories[0]?.name ?? "");
	const [selectedCategoryNames, setSelectedCategoryNames] = useState(initialValues?.selectedCategoryNames ?? []);
	const [selectedPromptTechniqueNames, setSelectedPromptTechniqueNames] = useState(initialValues?.selectedPromptTechniqueNames ?? []);
	const [selectedModelNames, setSelectedModelNames] = useState(initialValues?.selectedModelNames ?? []);
	const [selectedReferenceTitles, setSelectedReferenceTitles] = useState(initialValues?.selectedReferenceTitles ?? []);
	const [selectedHyperparameterIds, setSelectedHyperparameterIds] = useState(initialValues?.selectedHyperparameterIds ?? []);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryDescription, setNewCategoryDescription] = useState("");
	const [newCategoryTactic, setNewCategoryTactic] = useState("GREEN_PRACTICE");
	const initialExamples = createInitialExamples(initialValues);
	const [examples, setExamples] = useState<ExampleDraft[]>(initialExamples);
	const [nextExampleId, setNextExampleId] = useState(initialExamples.length + 1);
	const initialMetrics = createInitialMetrics(initialValues);
	const [metrics, setMetrics] = useState<MetricDraft[]>(initialMetrics);
	const [nextMetricId, setNextMetricId] = useState(initialMetrics.length + 1);
	const [referenceTitle, setReferenceTitle] = useState(initialValues?.referenceTitle ?? "");
	const [referenceAuthors, setReferenceAuthors] = useState(initialValues?.referenceAuthors ?? "");
	const [referenceAbstract, setReferenceAbstract] = useState(initialValues?.referenceAbstract ?? "");
	const [referenceKeywords, setReferenceKeywords] = useState(initialValues?.referenceKeywords ?? "");
	const [referenceYear, setReferenceYear] = useState(String(initialValues?.referenceYear ?? new Date().getFullYear()));
	const [referenceStudyType, setReferenceStudyType] = useState(initialValues?.referenceStudyType ?? "");
	const [referenceDomain, setReferenceDomain] = useState(initialValues?.referenceDomain ?? "");
	const [referenceTask, setReferenceTask] = useState(initialValues?.referenceTask ?? "");
	const [referenceVenue, setReferenceVenue] = useState(initialValues?.referenceVenue ?? "");
	const [referenceToolAvailability, setReferenceToolAvailability] = useState(initialValues?.referenceToolAvailability ?? "");
	const [referenceLink, setReferenceLink] = useState(initialValues?.referenceLink ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const updateExample = (index: number, field: ExampleDraftTextField, value: string) => {
		setExamples((currentExamples) =>
			currentExamples.map((example, exampleIndex) => (exampleIndex === index ? { ...example, [field]: value } : example)),
		);
	};

	const addExample = () => {
		setExamples((currentExamples) => [...currentExamples, createEmptyExample(nextExampleId)]);
		setNextExampleId((currentValue) => currentValue + 1);
	};

	const removeExample = (index: number) => {
		setExamples((currentExamples) => (currentExamples.length === 1 ? [createEmptyExample(nextExampleId)] : currentExamples.filter((_, exampleIndex) => exampleIndex !== index)));
	};

	const updateMetric = (index: number, field: MetricDraftTextField, value: string) => {
		setMetrics((currentMetrics) =>
			currentMetrics.map((metric, metricIndex) => (metricIndex === index ? { ...metric, [field]: value } : metric)),
		);
	};

	const addMetric = () => {
		setMetrics((currentMetrics) => [...currentMetrics, createEmptyMetric(nextMetricId)]);
		setNextMetricId((currentValue) => currentValue + 1);
	};

	const removeMetric = (index: number) => {
		setMetrics((currentMetrics) => (currentMetrics.length === 1 ? [createEmptyMetric(nextMetricId)] : currentMetrics.filter((_, metricIndex) => metricIndex !== index)));
	};

	const buildExamplesBody = () =>
		examples.map((example) => ({
			scenario: example.scenario.trim(),
			originalPrompts: example.originalPrompts.trim(),
			improvedPrompts: example.improvedPrompts.trim(),
			observations: example.observations.trim(),
		}));

	const buildMetricsBody = () =>
		metrics.map((metric) => ({
			subtype: metric.subtype,
			title: metric.title.trim(),
			value: metric.value.trim(),
			description: metric.description.trim(),
			confidence: metric.confidence.trim(),
			energy: metric.subtype === "ENERGY"
				? {
					type: metric.energyType,
					minValue: metric.minValue.trim(),
					maxValue: metric.maxValue.trim(),
					bestGuessValue: metric.bestGuessValue.trim(),
					unit: metric.unit.trim(),
				}
				: null,
			accuracy: metric.subtype === "ACCURACY"
				? {
					level: metric.accuracyLevel,
					score: metric.accuracyScore.trim(),
				}
				: null,
		}));

	const buildPracticeBody = () => ({
		name: practiceTitle.trim(),
		description: practiceDescription.trim(),
		greenScore: Number.parseInt(greenScore, 10),
		tactic,
	});

	const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSaving(true);
		setError("");

		const body: PracticeCreateFormBody | PracticeUpdateFormBody = isEditMode
			? {
				practice: buildPracticeBody(),
				categoryNames: selectedCategoryNames,
				promptTechniqueNames: selectedPromptTechniqueNames,
				modelNames: selectedModelNames,
				referenceTitles: selectedReferenceTitles,
				hyperparameterIds: selectedHyperparameterIds,
				examples: buildExamplesBody(),
				metrics: buildMetricsBody(),
			}
			: {
				practice: buildPracticeBody(),
				category: categoryMode === "existing"
					? {
						mode: "existing",
						name: existingCategoryName,
						description: "",
						tactic: "GREEN_PRACTICE",
					}
					: {
						mode: "new",
						name: newCategoryName.trim(),
						description: newCategoryDescription.trim(),
						tactic: newCategoryTactic,
					},
				examples: buildExamplesBody(),
				reference: {
					title: referenceTitle.trim(),
					authors: referenceAuthors.trim(),
					abstract: referenceAbstract.trim(),
					keywords: referenceKeywords.trim(),
					year: referenceYear.trim(),
					studyType: referenceStudyType.trim(),
					domain: referenceDomain.trim(),
					task: referenceTask.trim(),
					venue: referenceVenue.trim(),
					toolAvailability: referenceToolAvailability.trim(),
					link: referenceLink.trim(),
				},
			};

		try {
			const response = await fetch(submitUrl, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const data = (await response.json().catch(() => ({}))) as { error?: string };

			if (!response.ok) {
				throw new Error(data.error ?? "Failed to save the practice");
			}

			router.push(redirectPath);
			router.refresh();
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to save the practice right now");
		} finally {
			setSaving(false);
		}
	};

	return (
		<form className={styles.creationForm} onSubmit={handleSubmit}>
			{source ? (
				<div className={styles.creationIntroCard}>
					<p className={styles.creationIntroKicker}>Requested practice</p>
					<h3 className={styles.creationIntroTitle}>{source.title}</h3>
					<p className={styles.creationIntroCopy}>{source.summary}</p>
					<p className={styles.creationIntroCopy}>{source.description}</p>
					{source.examples?.trim() ? (
						<div className={styles.creationSourceBox}>
							<span className={styles.creationSourceLabel}>Request examples</span>
							<p>{source.examples}</p>
						</div>
					) : null}
				</div>
			) : null}

			<section className={styles.creationSection}>
				<h3 className={styles.creationSectionTitle}>Practice details</h3>
				<div className={styles.creationSplitGrid}>
					<div className="form-group">
						<label htmlFor="practice-title">Practice title</label>
						<input id="practice-title" value={practiceTitle} onChange={(event: ChangeEvent<HTMLInputElement>) => setPracticeTitle(event.target.value)} required />
					</div>
					<div className="form-group">
						<label htmlFor="practice-green-score">Green score</label>
						<input id="practice-green-score" type="number" min={0} max={100} value={greenScore} onChange={(event: ChangeEvent<HTMLInputElement>) => setGreenScore(event.target.value)} required />
					</div>
				</div>
				<div className="form-group">
					<label htmlFor="practice-description">Practice description</label>
					<textarea id="practice-description" className={styles.creationTextarea} value={practiceDescription} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPracticeDescription(event.target.value)} rows={6} required />
				</div>
				<div className="form-group">
					<label htmlFor="practice-tactic">Tactic</label>
					<select id="practice-tactic" className={styles.creationSelect} value={tactic} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTactic(event.target.value)}>
						<option value="GREEN_PRACTICE">Green practice</option>
						<option value="RED_PRACTICE">Red practice</option>
					</select>
				</div>
			</section>

			{isEditMode ? (
				<MultiCheckboxSection title="Categories" emptyMessage="No categories available.">
					{categories.map((category) => (
						<label key={category.name} className={styles.creationRadioCard}>
							<input
								type="checkbox"
								checked={selectedCategoryNames.includes(category.name)}
								onChange={() => setSelectedCategoryNames((currentValues) => toggleSelection(currentValues, category.name))}
							/>
							<span>{category.name}</span>
						</label>
					))}
				</MultiCheckboxSection>
			) : (
				<section className={styles.creationSection}>
					<h3 className={styles.creationSectionTitle}>Category</h3>
					{categories.length > 0 ? (
						<div className={styles.creationCategoryToggle} role="radiogroup" aria-label="Category mode">
							<label className={styles.creationRadioCard}>
								<input type="radio" name="category-mode" checked={categoryMode === "existing"} onChange={() => setCategoryMode("existing")} />
								<span>Use an existing category</span>
							</label>
							<label className={styles.creationRadioCard}>
								<input type="radio" name="category-mode" checked={categoryMode === "new"} onChange={() => setCategoryMode("new")} />
								<span>Create a new category</span>
							</label>
						</div>
					) : null}

					{categoryMode === "existing" && categories.length > 0 ? (
						<div className="form-group">
							<label htmlFor="existing-category">Available categories</label>
							<select id="existing-category" className={styles.creationSelect} value={existingCategoryName} onChange={(event: ChangeEvent<HTMLSelectElement>) => setExistingCategoryName(event.target.value)}>
								{categories.map((category) => (
									<option key={category.name} value={category.name}>
										{category.name}
									</option>
								))}
							</select>
							<p className={styles.creationHint}>
								This practice will be attached to {existingCategoryName || "the selected category"}.
							</p>
						</div>
					) : (
						<div className={styles.creationSplitGrid}>
							<div className="form-group">
								<label htmlFor="new-category-name">Category name</label>
								<input id="new-category-name" value={newCategoryName} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewCategoryName(event.target.value)} required={categoryMode === "new"} />
							</div>
							<div className="form-group">
								<label htmlFor="new-category-tactic">Category tactic</label>
								<select id="new-category-tactic" className={styles.creationSelect} value={newCategoryTactic} onChange={(event: ChangeEvent<HTMLSelectElement>) => setNewCategoryTactic(event.target.value)}>
									<option value="GREEN_PRACTICE">Green practice</option>
									<option value="RED_PRACTICE">Red practice</option>
								</select>
							</div>
						</div>
					)}

					{categoryMode === "new" ? (
						<div className="form-group">
							<label htmlFor="new-category-description">Category description</label>
							<textarea id="new-category-description" className={styles.creationTextarea} value={newCategoryDescription} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNewCategoryDescription(event.target.value)} rows={3} />
						</div>
					) : null}
				</section>
			)}

			{isEditMode ? (
				<>
					<MultiCheckboxSection title="Prompt techniques" emptyMessage="No prompt techniques available.">
						{promptTechniques.map((promptTechnique) => (
							<label key={promptTechnique.name} className={styles.creationRadioCard}>
								<input
									type="checkbox"
									checked={selectedPromptTechniqueNames.includes(promptTechnique.name)}
									onChange={() => setSelectedPromptTechniqueNames((currentValues) => toggleSelection(currentValues, promptTechnique.name))}
								/>
								<span>{promptTechnique.name}</span>
							</label>
						))}
					</MultiCheckboxSection>

					<MultiCheckboxSection title="Models" emptyMessage="No models available.">
						{models.map((model) => (
							<label key={model.name} className={styles.creationRadioCard}>
								<input
									type="checkbox"
									checked={selectedModelNames.includes(model.name)}
									onChange={() => setSelectedModelNames((currentValues) => toggleSelection(currentValues, model.name))}
								/>
								<span>{model.name}</span>
							</label>
						))}
					</MultiCheckboxSection>

					<MultiCheckboxSection title="References" emptyMessage="No references available.">
						{references.map((reference) => (
							<label key={reference.title} className={styles.creationRadioCard}>
								<input
									type="checkbox"
									checked={selectedReferenceTitles.includes(reference.title)}
									onChange={() => setSelectedReferenceTitles((currentValues) => toggleSelection(currentValues, reference.title))}
								/>
								<span>{reference.title} ({reference.year})</span>
							</label>
						))}
					</MultiCheckboxSection>

					<MultiCheckboxSection title="Hyperparameters" emptyMessage="No hyperparameters available.">
						{hyperparameters.map((hyperparameter) => (
							<label key={hyperparameter.id} className={styles.creationRadioCard}>
								<input
									type="checkbox"
									checked={selectedHyperparameterIds.includes(hyperparameter.id)}
									onChange={() => setSelectedHyperparameterIds((currentValues) => toggleSelection(currentValues, hyperparameter.id))}
								/>
								<span>
									{hyperparameter.name}: {hyperparameter.value} ({hyperparameter.dataType}) - {hyperparameter.referenceTitle}
								</span>
							</label>
						))}
					</MultiCheckboxSection>
				</>
			) : null}

			<section className={styles.creationSection}>
				<div className={styles.creationSectionHeader}>
					<h3 className={styles.creationSectionTitle}>Practice examples</h3>
					<button type="button" className="ghost-btn" onClick={addExample}>
						Add example
					</button>
				</div>
				<div className={styles.creationExampleList}>
					{examples.map((example, index) => (
						<article key={example.id} className={styles.creationExampleCard}>
							<div className={styles.creationSectionHeader}>
								<h4 className={styles.creationExampleTitle}>Example {index + 1}</h4>
								{examples.length > 1 ? (
									<button type="button" className="ghost-btn" onClick={() => removeExample(index)}>
										Remove
									</button>
								) : null}
							</div>
							<div className="form-group">
								<label htmlFor={`example-scenario-${index}`}>Scenario</label>
								<input id={`example-scenario-${index}`} value={example.scenario} onChange={(event: ChangeEvent<HTMLInputElement>) => updateExample(index, "scenario", event.target.value)} />
							</div>
							<div className="form-group">
								<label htmlFor={`example-original-${index}`}>Original prompts</label>
								<textarea id={`example-original-${index}`} className={styles.creationTextarea} value={example.originalPrompts} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateExample(index, "originalPrompts", event.target.value)} rows={4} />
							</div>
							<div className="form-group">
								<label htmlFor={`example-improved-${index}`}>Improved prompts</label>
								<textarea id={`example-improved-${index}`} className={styles.creationTextarea} value={example.improvedPrompts} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateExample(index, "improvedPrompts", event.target.value)} rows={4} />
							</div>
							<div className="form-group">
								<label htmlFor={`example-observations-${index}`}>Observations</label>
								<textarea id={`example-observations-${index}`} className={styles.creationTextarea} value={example.observations} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateExample(index, "observations", event.target.value)} rows={4} />
							</div>
						</article>
					))}
				</div>
			</section>

			{isEditMode ? (
				<section className={styles.creationSection}>
					<div className={styles.creationSectionHeader}>
						<h3 className={styles.creationSectionTitle}>Metrics</h3>
						<button type="button" className="ghost-btn" onClick={addMetric}>
							Add metric
						</button>
					</div>
					<div className={styles.creationExampleList}>
						{metrics.map((metric, index) => (
							<article key={metric.id} className={styles.creationExampleCard}>
								<div className={styles.creationSectionHeader}>
									<h4 className={styles.creationExampleTitle}>Metric {index + 1}</h4>
									{metrics.length > 1 ? (
										<button type="button" className="ghost-btn" onClick={() => removeMetric(index)}>
											Remove
										</button>
									) : null}
								</div>
								<div className={styles.creationSplitGrid}>
									<div className="form-group">
										<label htmlFor={`metric-subtype-${index}`}>Metric type</label>
										<select id={`metric-subtype-${index}`} className={styles.creationSelect} value={metric.subtype} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateMetric(index, "subtype", event.target.value)}>
											<option value="GENERIC">Generic</option>
											<option value="ENERGY">Energy</option>
											<option value="ACCURACY">Accuracy</option>
										</select>
									</div>
									<div className="form-group">
										<label htmlFor={`metric-confidence-${index}`}>Confidence</label>
										<input id={`metric-confidence-${index}`} type="number" min={0} max={1} step={0.01} value={metric.confidence} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "confidence", event.target.value)} />
									</div>
								</div>
								<div className={styles.creationSplitGrid}>
									<div className="form-group">
										<label htmlFor={`metric-title-${index}`}>Title</label>
										<input id={`metric-title-${index}`} value={metric.title} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "title", event.target.value)} />
									</div>
									<div className="form-group">
										<label htmlFor={`metric-value-${index}`}>Value</label>
										<input id={`metric-value-${index}`} value={metric.value} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "value", event.target.value)} />
									</div>
								</div>
								<div className="form-group">
									<label htmlFor={`metric-description-${index}`}>Description</label>
									<textarea id={`metric-description-${index}`} className={styles.creationTextarea} value={metric.description} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateMetric(index, "description", event.target.value)} rows={3} />
								</div>
								{metric.subtype === "ENERGY" ? (
									<div className={styles.creationSplitGrid}>
										<div className="form-group">
											<label htmlFor={`metric-energy-type-${index}`}>Energy type</label>
											<select id={`metric-energy-type-${index}`} className={styles.creationSelect} value={metric.energyType} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateMetric(index, "energyType", event.target.value)}>
												<option value="REDUCTION">Reduction</option>
												<option value="CONSUMPTION">Consumption</option>
												<option value="EFFICIENCY">Efficiency</option>
											</select>
										</div>
										<div className="form-group">
											<label htmlFor={`metric-unit-${index}`}>Unit</label>
											<input id={`metric-unit-${index}`} value={metric.unit} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "unit", event.target.value)} />
										</div>
										<div className="form-group">
											<label htmlFor={`metric-min-${index}`}>Min value</label>
											<input id={`metric-min-${index}`} type="number" step="any" value={metric.minValue} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "minValue", event.target.value)} />
										</div>
										<div className="form-group">
											<label htmlFor={`metric-max-${index}`}>Max value</label>
											<input id={`metric-max-${index}`} type="number" step="any" value={metric.maxValue} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "maxValue", event.target.value)} />
										</div>
										<div className="form-group">
											<label htmlFor={`metric-best-${index}`}>Best guess value</label>
											<input id={`metric-best-${index}`} type="number" step="any" value={metric.bestGuessValue} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "bestGuessValue", event.target.value)} />
										</div>
									</div>
								) : null}
								{metric.subtype === "ACCURACY" ? (
									<div className={styles.creationSplitGrid}>
										<div className="form-group">
											<label htmlFor={`metric-accuracy-level-${index}`}>Accuracy level</label>
											<select id={`metric-accuracy-level-${index}`} className={styles.creationSelect} value={metric.accuracyLevel} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateMetric(index, "accuracyLevel", event.target.value)}>
												<option value="WORSE">Worse</option>
												<option value="SAME_OR_WORSE">Same or worse</option>
												<option value="SAME">Same</option>
												<option value="SAME_OR_BETTER">Same or better</option>
												<option value="BETTER">Better</option>
												<option value="MUCH_BETTER">Much better</option>
												<option value="NEAR_PERFECT">Near perfect</option>
											</select>
										</div>
										<div className="form-group">
											<label htmlFor={`metric-accuracy-score-${index}`}>Score</label>
											<input id={`metric-accuracy-score-${index}`} type="number" min={0} max={2} step={0.01} value={metric.accuracyScore} onChange={(event: ChangeEvent<HTMLInputElement>) => updateMetric(index, "accuracyScore", event.target.value)} />
										</div>
									</div>
								) : null}
							</article>
						))}
					</div>
				</section>
			) : null}

			{isEditMode ? null : (
				<section className={styles.creationSection}>
					<h3 className={styles.creationSectionTitle}>Reference</h3>
					<div className={styles.creationSplitGrid}>
						<div className="form-group">
							<label htmlFor="reference-title">Title</label>
							<input id="reference-title" value={referenceTitle} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceTitle(event.target.value)} required />
						</div>
						<div className="form-group">
							<label htmlFor="reference-authors">Authors</label>
							<input id="reference-authors" value={referenceAuthors} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceAuthors(event.target.value)} required />
						</div>
					</div>
					<div className="form-group">
						<label htmlFor="reference-abstract">Abstract</label>
						<textarea id="reference-abstract" className={styles.creationTextarea} value={referenceAbstract} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReferenceAbstract(event.target.value)} rows={5} />
					</div>
					<div className={styles.creationSplitGrid}>
						<div className="form-group">
							<label htmlFor="reference-keywords">Keywords</label>
							<input id="reference-keywords" value={referenceKeywords} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceKeywords(event.target.value)} placeholder="Comma-separated keywords" />
						</div>
						<div className="form-group">
							<label htmlFor="reference-year">Year</label>
							<input id="reference-year" type="number" value={referenceYear} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceYear(event.target.value)} required />
						</div>
					</div>
					<div className={styles.creationSplitGrid}>
						<div className="form-group">
							<label htmlFor="reference-study-type">Study type</label>
							<input id="reference-study-type" value={referenceStudyType} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceStudyType(event.target.value)} required />
						</div>
						<div className="form-group">
							<label htmlFor="reference-domain">Domain</label>
							<input id="reference-domain" value={referenceDomain} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceDomain(event.target.value)} />
						</div>
					</div>
					<div className={styles.creationSplitGrid}>
						<div className="form-group">
							<label htmlFor="reference-task">Task</label>
							<input id="reference-task" value={referenceTask} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceTask(event.target.value)} />
						</div>
						<div className="form-group">
							<label htmlFor="reference-venue">Venue</label>
							<input id="reference-venue" value={referenceVenue} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceVenue(event.target.value)} />
						</div>
					</div>
					<div className="form-group">
						<label htmlFor="reference-tool-availability">Tool availability</label>
						<input id="reference-tool-availability" value={referenceToolAvailability} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceToolAvailability(event.target.value)} />
					</div>
					<div className="form-group">
						<label htmlFor="reference-link">Link</label>
						<input id="reference-link" value={referenceLink} onChange={(event: ChangeEvent<HTMLInputElement>) => setReferenceLink(event.target.value)} required />
					</div>
				</section>
			)}

			{error ? <div className="error-message">{error}</div> : null}

			<div className={styles.creationActions}>
				<button type="submit" className="green-btn" disabled={saving}>
					{saving ? "Saving..." : "Save"}
				</button>
			</div>
		</form>
	);
}
