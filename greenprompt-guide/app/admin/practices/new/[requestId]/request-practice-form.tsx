"use client";

import { PracticeForm, type CategoryOption, type ReferenceOption } from "../../practice-form";

type RequestedPracticeFormProps = {
	requestId: number;
	requestTitle: string;
	requestSummary: string;
	requestDescription: string;
	requestReferenceLink: string;
	requestExamples: string | null;
	categories: CategoryOption[];
	references: ReferenceOption[];
};

export function RequestPracticeForm({
	requestId,
	requestTitle,
	requestSummary,
	requestDescription,
	requestReferenceLink,
	requestExamples,
	categories,
	references,
}: Readonly<RequestedPracticeFormProps>) {
	return (
		<PracticeForm
			categories={categories}
			references={references}
			submitUrl={`/api/admin/requests/${requestId}`}
			redirectPath={`/admin/requests/${requestId}`}
			initialValues={{
				practiceTitle: requestTitle,
				practiceDescription: requestDescription,
				referenceTitle: requestTitle,
				referenceAbstract: requestSummary,
				referenceLink: requestReferenceLink,
				examplesText: requestExamples,
			}}
			source={{
				title: requestTitle,
				summary: requestSummary,
				description: requestDescription,
				examples: requestExamples,
			}}
		/>
	);
}