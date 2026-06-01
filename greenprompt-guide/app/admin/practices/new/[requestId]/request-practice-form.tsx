"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import styles from "../../../admin.module.css";

type CategoryOption = {
	name: string;
	description: string | null;
	tactic: string;
};

type ExampleDraft = {
	id: number;
	scenario: string;
	originalPrompts: string;
	improvedPrompts: string;
	observations: string;
};

type PracticeExampleBody = Omit<ExampleDraft, "id">;
type ExampleDraftTextField = keyof PracticeExampleBody;

type RequestedPracticeFormProps = {
	requestId: number;
	requestTitle: string;
	requestSummary: string;
	requestDescription: string;
	requestReferenceLink: string;
	requestExamples: string | null;
	categories: CategoryOption[];
};

type PracticeFormBody = {
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

function createEmptyExample(id: number): ExampleDraft {
	return {
		id,
		scenario: "",
		originalPrompts: "",
		improvedPrompts: "",
		observations: "",
	};
}

function createInitialExamples(requestExamples: string | null) {
	if (!requestExamples?.trim()) {
		return [createEmptyExample(1)];
	}

	return [
		{
			id: 1,
			scenario: "From request notes",
			originalPrompts: requestExamples.trim(),
			improvedPrompts: "",
			observations: "",
		},
	];
}

export function RequestPracticeForm({
	requestId,
	requestTitle,
	requestSummary,
	requestDescription,
	requestReferenceLink,
	requestExamples,
	categories,
}: Readonly<RequestedPracticeFormProps>) {
	const router = useRouter();
	const [practiceTitle, setPracticeTitle] = useState(requestTitle);
	const [practiceDescription, setPracticeDescription] = useState(requestDescription);
	const [greenScore, setGreenScore] = useState("50");
	const [tactic, setTactic] = useState("GREEN_PRACTICE");
	const [categoryMode, setCategoryMode] = useState<"existing" | "new">(categories.length > 0 ? "existing" : "new");
	const [existingCategoryName, setExistingCategoryName] = useState(categories[0]?.name ?? "");
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryDescription, setNewCategoryDescription] = useState("");
	const [newCategoryTactic, setNewCategoryTactic] = useState("GREEN_PRACTICE");
	const initialExamples = createInitialExamples(requestExamples);
	const [examples, setExamples] = useState<ExampleDraft[]>(initialExamples);
	const [nextExampleId, setNextExampleId] = useState(initialExamples.length + 1);
	const [referenceTitle, setReferenceTitle] = useState(requestTitle);
	const [referenceAuthors, setReferenceAuthors] = useState("");
	const [referenceAbstract, setReferenceAbstract] = useState(requestSummary);
	const [referenceKeywords, setReferenceKeywords] = useState("");
	const [referenceYear, setReferenceYear] = useState(String(new Date().getFullYear()));
	const [referenceStudyType, setReferenceStudyType] = useState("");
	const [referenceDomain, setReferenceDomain] = useState("");
	const [referenceTask, setReferenceTask] = useState("");
	const [referenceVenue, setReferenceVenue] = useState("");
	const [referenceToolAvailability, setReferenceToolAvailability] = useState("");
	const [referenceLink, setReferenceLink] = useState(requestReferenceLink);
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

	const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSaving(true);
		setError("");

		const body: PracticeFormBody = {
			practice: {
				name: practiceTitle.trim(),
				description: practiceDescription.trim(),
				greenScore: Number.parseInt(greenScore, 10),
				tactic,
			},
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
			examples: examples.map((example) => ({
				scenario: example.scenario.trim(),
				originalPrompts: example.originalPrompts.trim(),
				improvedPrompts: example.improvedPrompts.trim(),
				observations: example.observations.trim(),
			})),
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
			const response = await fetch(`/api/admin/requests/${requestId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				throw new Error(data.error ?? "Failed to create the practice");
			}

			router.push(`/admin/requests/${requestId}`);
			router.refresh();
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to save the practice right now");
		} finally {
			setSaving(false);
		}
	};

	return (
		<form className={styles.creationForm} onSubmit={handleSubmit}>
			<div className={styles.creationIntroCard}>
				<p className={styles.creationIntroKicker}>Requested practice</p>
				<h3 className={styles.creationIntroTitle}>{requestTitle}</h3>
				<p className={styles.creationIntroCopy}>{requestSummary}</p>
				<p className={styles.creationIntroCopy}>{requestDescription}</p>
				{requestExamples?.trim() ? (
					<div className={styles.creationSourceBox}>
						<span className={styles.creationSourceLabel}>Request examples</span>
						<p>{requestExamples}</p>
					</div>
				) : null}
			</div>

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

			{error ? <div className="error-message">{error}</div> : null}

			<div className={styles.creationActions}>
				<button type="submit" className="green-btn" disabled={saving}>
					{saving ? "Saving..." : "Save"}
				</button>
			</div>
		</form>
	);
}
