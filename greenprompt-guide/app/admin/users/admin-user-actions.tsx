"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../admin.module.css";

type AdminUserActionsProps = {
  username: string;
  email: string;
  banned: boolean;
};

type Mode = "ban" | "unban" | "delete" | null;

type DialogMode = Exclude<Mode, null>;

const dialogCopy: Record<DialogMode, { title: (username: string) => string; hint: string; confirm: string; placeholder?: string }> = {
  ban: {
    title: (username) => `Ban ${username}?`,
    hint: "Explain why this account is being banned.",
    confirm: "I'm sure, ban",
    placeholder: "Reason for banning the user",
  },
  unban: {
    title: (username) => `Unban ${username}?`,
    hint: "This will restore the account and its activity.",
    confirm: "I'm sure, unban",
  },
  delete: {
    title: (username) => `Delete ${username}?`,
    hint: "Explain why this account is being deleted.",
    confirm: "I'm sure, delete",
    placeholder: "Reason for deleting the user",
  },
};

function getLoadingLabel(mode: DialogMode) {
  if (mode === "delete") return "Deleting...";
  if (mode === "ban") return "Banning...";

  return "Unbanning...";
}

type AdminUserModerationDialogProps = {
  mode: DialogMode;
  username: string;
  email: string;
  reason: string;
  loading: boolean;
  error: string;
  onClose: () => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
};

function AdminUserModerationDialog({
  mode,
  username,
  email,
  reason,
  loading,
  error,
  onClose,
  onReasonChange,
  onSubmit,
}: Readonly<AdminUserModerationDialogProps>) {
  if (!mode) {
    return null;
  }

  const copy = dialogCopy[mode];
  const needsReason = mode === "ban" || mode === "delete";
  const isReasonMissing = needsReason && reason.trim().length === 0;

  return (
    <div className="recovery-modal-overlay">
      <button type="button" className="recovery-modal-backdrop" aria-label={`Close ${mode} user dialog`} onClick={onClose} />
      <div className="recovery-modal">
        <button type="button" className="recovery-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>{copy.title(username)}</h2>
        <p className={styles.dialogHint}>
          {copy.hint} The account email is {email}.
        </p>

        {error ? <div className={`error-message ${styles.dialogError}`}>{error}</div> : null}

        {needsReason ? (
          <div className="form-group">
            <label htmlFor={`moderation-reason-${username}`}>Reason</label>
            <textarea
              id={`moderation-reason-${username}`}
              className={styles.dialogTextarea}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={copy.placeholder}
            />
          </div>
        ) : (
          <p className={styles.dialogHint}>The user's activity will be restored.</p>
        )}

        <div className={styles.dialogActions}>
          <button type="button" className={`ghost-btn ${styles.dialogCancelButton}`} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`recovery-btn ${styles.dialogDangerButton}`} onClick={onSubmit} disabled={loading || isReasonMissing}>
            {loading ? getLoadingLabel(mode) : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUserActions({ username, email, banned }: Readonly<AdminUserActionsProps>) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeDialog = () => {
    setMode(null);
    setReason("");
    setLoading(false);
    setError("");
  };

  const submitModeration = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
        method: mode === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:
          mode === "delete"
            ? JSON.stringify({ reason })
            : JSON.stringify({ action: mode, reason }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to update the user");
      }

      closeDialog();
      router.refresh();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : "Failed to update the user");
    } finally {
      setLoading(false);
    }
  };

  const isDialogOpen = mode !== null;

  return (
    <>
      <div className={styles.rowActions}>
        <button
          type="button"
          className={`ghost-btn ${styles.actionButton}`}
          onClick={() => setMode(banned ? "unban" : "ban")}
        >
          {banned ? "Unban" : "Ban"}
        </button>
        <button
          type="button"
          className={`ghost-btn ${styles.actionButton} ${styles.dangerAction}`}
          onClick={() => setMode("delete")}
        >
          Delete
        </button>
      </div>

      {isDialogOpen ? (
        <AdminUserModerationDialog
          mode={mode}
          username={username}
          email={email}
          reason={reason}
          loading={loading}
          error={error}
          onClose={closeDialog}
          onReasonChange={setReason}
          onSubmit={submitModeration}
        />
      ) : null}
    </>
  );
}