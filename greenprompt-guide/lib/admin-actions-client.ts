import { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";

export async function deleteObject(
    objectKey: string | number, 
    type: "models" | "datasets" | "practices" | "references" | "hyperparameters",
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    router: ReturnType<typeof useRouter>,
    closeDialog: () => void
) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/${type}/${encodeURIComponent(String(objectKey))}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to delete ${type}`);
      }

      closeDialog();
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

type SubmitObjectParams = {
  event: SyntheticEvent<HTMLFormElement>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  submitUrl: string;
  method: "POST" | "PATCH";
  body: Record<string, any>;
  redirectPath: string;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  type: "model" | "dataset" | "practice" | "reference" | "hyperparameter";
};

export async function submitObject( { event, setSaving, setError, submitUrl, method, body, redirectPath, router, type }: SubmitObjectParams) : Promise<boolean> {
  event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(submitUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to save the ${type}`);
      }
      router.push(redirectPath);
      router.refresh();
      return true;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Unable to save the ${type} right now`,
      );
    } finally {
      setSaving(false);
    }
    return false;
  }