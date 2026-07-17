import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";

/**
 * Double-confirm pattern for destructive bulk operations (Section 6.18
 * Danger Zone): requires typing an exact confirmation phrase, not just a
 * single click-through.
 */
export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmPhrase = "DELETE",
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; confirmPhrase?: string;
}) {
  const [value, setValue] = useState("");
  const matches = value === confirmPhrase;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-ink/70">{description}</p>
      <Input
        label={`Type "${confirmPhrase}" to confirm`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          disabled={!matches}
          onClick={() => { onConfirm(); setValue(""); onClose(); }}
        >
          {title}
        </Button>
      </div>
    </Modal>
  );
}
