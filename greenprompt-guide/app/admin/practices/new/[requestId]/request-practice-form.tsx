"use client";

import { useEffect, useState } from "react";
import { PracticeForm, type CategoryOption, type ReferenceOption } from "../../practice-form";
import type { OllamaExtractionResult } from "@/lib/ollama-client";

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
  const [llmDraft, setLlmDraft] = useState<OllamaExtractionResult | null>(null);
  
  // 1. ADD THIS: State to track when the client has finished checking storage
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`llm-draft-${requestId}`);
    if (raw) {
      try {
        setLlmDraft(JSON.parse(raw) as OllamaExtractionResult);
        sessionStorage.removeItem(`llm-draft-${requestId}`);
      } catch {
        // ignore malformed data
      }
    }
    // 2. ADD THIS: Mark as loaded whether we found a draft or not
    setIsClientLoaded(true);
  }, [requestId]);

  // 3. ADD THIS: Prevent rendering the form before the data is evaluated
  // This guarantees PracticeForm gets the correct initialValues on its very first mount
  if (!isClientLoaded) {
    return null; // You can replace this with a loading spinner if you prefer
  }

  // Build initialValues, merging LLM draft over request data
  const initialValues = llmDraft
    ? {
        practiceTitle: llmDraft.practice.name,
        practiceDescription: llmDraft.practice.description,
        greenScore: llmDraft.practice.greenScore,
        tactic: llmDraft.practice.tactic,
        referenceTitle: llmDraft.reference.title,
        referenceAuthors: llmDraft.reference.authors,
        referenceAbstract: llmDraft.reference.abstract,
        referenceYear: llmDraft.reference.year,
        referenceStudyType: llmDraft.reference.studyType,
        referenceDomain: llmDraft.reference.domain,
        referenceTask: llmDraft.reference.task,
        referenceVenue: llmDraft.reference.venue,
        referenceToolAvailability: llmDraft.reference.toolAvailability,
        referenceLink: requestReferenceLink,
        examples: llmDraft.examples,
        selectedCategoryNames: [], // admin selects from existing ones
      }
    : {
        practiceTitle: requestTitle,
        practiceDescription: requestDescription,
        referenceTitle: requestTitle,
        referenceAbstract: requestSummary,
        referenceLink: requestReferenceLink,
        examplesText: requestExamples,
      };

  return (
    <PracticeForm
      categories={categories}
      references={references}
      submitUrl={`/api/admin/requests/${requestId}`}
      redirectPath={`/admin/requests/${requestId}`}
      initialValues={initialValues}
      source={{
        title: requestTitle,
        summary: requestSummary,
        description: requestDescription,
        examples: requestExamples,
      }}
      llmExtraction={llmDraft}
    />
  );
}