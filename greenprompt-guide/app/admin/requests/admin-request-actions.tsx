"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../admin.module.css";

type AdminRequestDeleteActionProps = {
  requestId: number;
};

export function AdminRequestDeleteAction({ requestId }: Readonly<AdminRequestDeleteActionProps>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeDialog = () => {
    setOpen(false);
    setLoading(false);
    setError("");
  };

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to delete request");
      }

      closeDialog();
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className={`ghost-btn ${styles.actionButton} ${styles.dangerAction}`} onClick={() => setOpen(true)}>
        Delete
      </button>

      {open ? (
        <div className="recovery-modal-overlay">
          <button
            type="button"
            className="recovery-modal-backdrop"
            aria-label="Close delete practice dialog"
            onClick={closeDialog}
          />
          <div className="recovery-modal">
            <button type="button" className="recovery-modal-close" onClick={closeDialog}>
              ✕
            </button>

            <h2>Delete request?</h2>
            <p className={styles.dialogHint}>
              This will permanently remove the request from the system.
            </p>

            {error ? <div className={`error-message ${styles.dialogError}`}>{error}</div> : null}

            <div className={styles.dialogActions}>
              <button type="button" className={`ghost-btn ${styles.dialogCancelButton}`} onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className={`recovery-btn ${styles.dialogDangerButton}`}
                onClick={handleDelete}
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