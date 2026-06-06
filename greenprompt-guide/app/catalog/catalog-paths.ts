export function catalogPracticeHref(practiceName: string) {
  return `/catalog/practices/${encodeURIComponent(practiceName)}`;
}

export function catalogReferenceHref(referenceTitle: string) {
  return `/catalog/references/${encodeURIComponent(referenceTitle)}`;
}

export function catalogPromptTechniqueHref(promptTechniqueName: string) {
  return `/catalog/promptTechniques/${encodeURIComponent(promptTechniqueName)}`;
}

export function catalogModelHref(modelName: string) {
  return `/catalog/models/${encodeURIComponent(modelName)}`;
}

export function catalogDatasetHref(datasetName: string) {
  return `/catalog/datasets/${encodeURIComponent(datasetName)}`;
}

export function catalogHyperparameterHref(hyperparameterId: number) {
  return `/catalog/hyperparameters/${encodeURIComponent(hyperparameterId.toString())}`;
}