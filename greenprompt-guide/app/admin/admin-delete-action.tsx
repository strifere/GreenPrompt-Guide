"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteObject } from "@/lib/admin-actions-client";
import styles from "./admin.module.css";

type AdminDeleteActionProps = {
    type: "model" | "reference" | "practice" | "dataset" | "hyperparameter";
    objectKey: string | number; // Name for most types, but ID for hyperparameters
};

export function AdminDeleteAction({ type, objectKey }: Readonly<AdminDeleteActionProps>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  let types : "models" | "references" | "practices" | "datasets" | "hyperparameters" = "models";

  switch (type) {
    case "reference":
      types = "references";
      break;
    case "practice":
      types = "practices";
      break;
    case "dataset":
      types = "datasets";
      break;
    case "hyperparameter":
      types = "hyperparameters";
      break;
  } 

  const closeDialog = () => {
    setOpen(false);
    setLoading(false);
    setError("");
  };

  return (
    <>
      <button
        type="button"
        className={`ghost-btn ${styles.actionButton} ${styles.dangerAction}`}
        onClick={() => setOpen(true)}
      >
        Delete
      </button>

      {open ? (
        <div className="recovery-modal-overlay">
          <button
            type="button"
            className="recovery-modal-backdrop"
            aria-label="Close delete reference dialog"
            onClick={closeDialog}
          />
          <div className="recovery-modal">
            <button type="button" className="recovery-modal-close" onClick={closeDialog}>
              ✕
            </button>

            <h2>Delete {type}?</h2>
            <p className={styles.dialogHint}>
              This will permanently remove &quot;{objectKey}&quot; from the system. {type === "reference" && ("Associated practices and hyperparameters linked only to this reference may also be affected.")}
            </p>

            {error ? <div className={`error-message ${styles.dialogError}`}>{error}</div> : null}

            <div className={styles.dialogActions}>
              <button
                type="button"
                className={`ghost-btn ${styles.dialogCancelButton}`}
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`recovery-btn ${styles.dialogDangerButton}`}
                onClick={deleteObject.bind(null, objectKey, types, setLoading, setError, router, closeDialog)}
                disabled={loading}
              >
                {loading ? "Deleting..." : "I'm sure, delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
