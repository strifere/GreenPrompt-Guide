"use client";

import { useEffect, useEffectEvent, useState } from "react";
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
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  const updateLlmDraft = useEffectEvent((raw: string) => {
    setLlmDraft(JSON.parse(raw) as OllamaExtractionResult);
  });

  const updateClientLoaded = useEffectEvent(() => {
    setIsClientLoaded(true);
  });

  useEffect(() => {
    const raw = sessionStorage.getItem(`llm-draft-${requestId}`);
    if (raw) {
      try {
        updateLlmDraft(raw);
        sessionStorage.removeItem(`llm-draft-${requestId}`);
      } catch {
        // ignore malformed data
      }
    }
    updateClientLoaded();
  }, [requestId]);

  if (!isClientLoaded) {
    return null; 
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