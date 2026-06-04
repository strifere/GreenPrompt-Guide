"use client";

import { useState, type ChangeEvent } from "react";
import styles from "../admin.module.css";
import {
  BaseEntityForm,
  type DataFormatType,
  type ReferenceOption,
} from "../base-entity-form";

export type ModelFormInitialValues = {
  name?: string;
  description?: string | null;
  parameters?: string | null;
  size?: string | null;
  dataFormatType?: DataFormatType[];
  selectedReferenceTitles?: string[];
};

type ModelFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: ModelFormInitialValues;
  references?: ReferenceOption[];
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

export function ModelForm({
  submitUrl,
  redirectPath,
  initialValues,
  references = [],
  mode = "create",
  method = "POST",
}: Readonly<ModelFormProps>) {
  const [parameters, setParameters] = useState(initialValues?.parameters ?? "");
  const [size, setSize] = useState(initialValues?.size ?? "");

  return (
    <BaseEntityForm<ModelFormInitialValues>
      title="Model details"
      formatSectionTitle="Supported data formats"
      formatHint="Select all formats this model can process as input."
      referenceHint="Select all references this model was studied or mentioned in."
      type="model"
      submitUrl={submitUrl}
      redirectPath={redirectPath}
      initialValues={initialValues}
      references={references}
      mode={mode}
      method={method}
      getExtraBodyFields={() => ({
        parameters: parameters.trim() || null,
        size: size.trim() || null,
      })}
    >
      {({ name, setName, description, setDescription, isEditMode }) => (
        <>
          <div className="form-group">
            <label htmlFor="model-name">Name</label>
            <input
              id="model-name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
              disabled={isEditMode}
              placeholder="e.g. GPT-4, LLaMA-2-7B"
            />
            {isEditMode ? (
              <p className={styles.creationHint}>The name is the primary key and cannot be changed.</p>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="model-description">
              Description <span className={styles.muted}>(optional)</span>
            </label>
            <textarea
              id="model-description"
              className={styles.creationTextarea}
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.creationSplitGrid}>
            <div className="form-group">
              <label htmlFor="model-parameters">
                Parameters <span className={styles.muted}>(optional)</span>
              </label>
              <input
                id="model-parameters"
                value={parameters}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setParameters(e.target.value)}
                placeholder="e.g. 7B, 13B, 70B"
              />
            </div>
            <div className="form-group">
              <label htmlFor="model-size">
                Size <span className={styles.muted}>(optional)</span>
              </label>
              <input
                id="model-size"
                value={size}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSize(e.target.value)}
                placeholder="e.g. small, large"
              />
            </div>
          </div>
        </>
      )}
    </BaseEntityForm>
  );
}