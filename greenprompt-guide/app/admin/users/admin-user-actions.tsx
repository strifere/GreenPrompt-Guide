"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "../admin.module.css";

type AdminUserActionsProps = {
  username: string;
  email: string;
  banned: boolean;
};

type Mode = "ban" | "unban" | "delete" | "promote" | "accept-request"| "reject-request" | null;

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
  promote: {
    title: (username) => `Promote ${username} to admin?`,
    hint: "This will grant the user admin privileges.",
    confirm: "I'm sure, promote",
  },
  "accept-request": {
    title: (username) => `Accept ${username}'s admin request?`,
    hint: "This will grant the user admin privileges.",
    confirm: "I'm sure, accept",
  },
  "reject-request": {
    title: (username) => `Reject ${username}'s admin request?`,
    hint: "This will notify the user that their request has been rejected.",
    confirm: "I'm sure, reject",
  }
};

function getLoadingLabel(mode: DialogMode) {
  if (mode === "delete") return "Deleting...";
  if (mode === "ban") return "Banning...";
  if (mode === "promote") return "Promoting...";
  if (mode === "accept-request") return "Accepting request...";

  return "Unbanning...";
}

type AdminUserModerationDialogProps = {
  mode: DialogMode;
  username: string;
  email: string;
  reason: string;
  loading: boolean;
  error: string;
  requestMessage: string;
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
  requestMessage,
  onClose,
  onReasonChange,
  onSubmit,
}: Readonly<AdminUserModerationDialogProps>) {
  if (!mode) {
    return null;
  }

  const copy = dialogCopy[mode];
  const needsReason = mode === "ban" || mode === "delete" || mode === "reject-request";
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

        {needsReason && (
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
        )}

        {mode === "unban" && (
          <p className={styles.dialogHint}>The user&apos;s activity will be restored.</p>
        )}

        {mode === "accept-request" && (
          <div>
            <p className={styles.dialogHint}> Request message:</p>
            <p className={styles.requestMessage}>
              {requestMessage}
            </p>
          </div>
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

async function loadRequestedAdminStatus(username: string, setRequestedAdmin: (requested: boolean) => void, setRequestMessage: (message: string) => void) {
  try {
    const adminRequestResponse = await fetch(`/api/admin/users/${encodeURIComponent(username)}/admin-request`, {
      method: "GET",
      credentials: "include",
    });
  
    if (!adminRequestResponse.ok) {
      setRequestedAdmin(false);
      return;
    }

		const adminRequestData = await adminRequestResponse.json();

    setRequestedAdmin(adminRequestData.requested);
    setRequestMessage(adminRequestData.requested ? adminRequestData.message : "");
  } catch (requestError) {
    console.error(
      "An error occurred: " +
        (requestError instanceof Error ? requestError.message : "Please try again.")
    );
    setRequestedAdmin(false);
  }
}

export function AdminUserActions({ username, email, banned }: Readonly<AdminUserActionsProps>) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestedAdmin, setRequestedAdmin] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

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

  useEffect(() => {
    loadRequestedAdminStatus(username, setRequestedAdmin, setRequestMessage);
  }, [username, loading]);

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
        {requestedAdmin ? (
          <div>
            <button
              type="button"
              className={`ghost-btn ${styles.actionButton} ${styles.notificationAction}`}
              onClick={() => setMode("accept-request")}
            >
              Accept request
            </button>
            <button
              type="button"
              className={`ghost-btn ${styles.actionButton} ${styles.notificationRejection}`}
              onClick={() => setMode("reject-request")}
            >
              Deny request
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`ghost-btn ${styles.actionButton} ${styles.solidAction}`}
            onClick={() => setMode("promote")}
          >
            Promote
          </button>
        )}
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
          requestMessage={requestMessage}
          onClose={closeDialog}
          onReasonChange={setReason}
          onSubmit={submitModeration}
        />
      ) : null}
    </>
  );
}