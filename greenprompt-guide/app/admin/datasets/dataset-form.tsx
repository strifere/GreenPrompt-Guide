"use client";

import { useState, type ChangeEvent } from "react";
import styles from "../admin.module.css";
import {
  BaseEntityForm,
  type DataFormatType,
  type ReferenceOption,
} from "../base-entity-form";

export type DatasetFormInitialValues = {
  name?: string;
  description?: string | null;
  size?: string | null;
  dataFormatType?: DataFormatType[];
  selectedReferenceTitles?: string[];
};

type DatasetFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: DatasetFormInitialValues;
  references?: ReferenceOption[];
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

export function DatasetForm({
  submitUrl,
  redirectPath,
  initialValues,
  references = [],
  mode = "create",
  method = "POST",
}: Readonly<DatasetFormProps>) {
  const [size, setSize] = useState(initialValues?.size ?? "");

  return (
    <BaseEntityForm<DatasetFormInitialValues>
      title="Dataset details"
      formatSectionTitle="Data format types"
      formatHint="Select all formats present in this dataset."
      referenceHint="Select all references this dataset was used or described in."
      type="dataset"
      submitUrl={submitUrl}
      redirectPath={redirectPath}
      initialValues={initialValues}
      references={references}
      mode={mode}
      method={method}
      getExtraBodyFields={() => ({
        size: size.trim() || null,
      })}
    >
      {({ name, setName, description, setDescription, isEditMode }) => (
        <>
          <div className="form-group">
            <label htmlFor="dataset-name">Name</label>
            <input
              id="dataset-name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
              disabled={isEditMode}
              placeholder="e.g. SQuAD, GSM8K, HumanEval"
            />
            {isEditMode ? (
              <p className={styles.creationHint}>The name is the primary key and cannot be changed.</p>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="dataset-description">
              Description <span className={styles.muted}>(optional)</span>
            </label>
            <textarea
              id="dataset-description"
              className={styles.creationTextarea}
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dataset-size">
              Size <span className={styles.muted}>(optional)</span>
            </label>
            <input
              id="dataset-size"
              value={size}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSize(e.target.value)}
              placeholder="e.g. 10,570 items, large"
            />
          </div>
        </>
      )}
    </BaseEntityForm>
  );
}