import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { api, unwrap } from "../../lib/api";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useToastStore } from "../../store/toastStore";

/**
 * DOCX -> HTML -> CKEditor -> DOCX round trip (Section 6.13): lets a
 * coordinator make a small wording tweak to a generated letter without
 * re-running the whole template-fill flow.
 */
export function LiveEditModal({ documentId, open, onClose }: { documentId: string | null; open: boolean; onClose: () => void }) {
  const push = useToastStore((s) => s.push);
  const [html, setHtml] = useState("");

  useQuery({
    queryKey: ["document-html", documentId],
    queryFn: async () => {
      const res = await unwrap(api.get<{ data: { html: string } }>(`/documents/${documentId}/html`));
      setHtml(res.html);
      return res;
    },
    enabled: Boolean(documentId) && open,
  });

  const save = useMutation({
    mutationFn: () => api.put(`/documents/${documentId}/html`, { html }),
    onSuccess: () => { push("Changes saved to the document"); onClose(); },
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit document">
      <div className="max-h-[60vh] overflow-y-auto rounded border border-ink/10 p-2">
        <CKEditor editor={ClassicEditor} data={html} onChange={(_e, editor) => setHtml(editor.getData())} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => save.mutate()}>Save changes</Button>
      </div>
    </Modal>
  );
}
