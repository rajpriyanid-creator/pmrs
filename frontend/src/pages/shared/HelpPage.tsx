import { Card } from "../../components/ui/Card";

/** Help Center (Section 6.20): bundled guides for document preparation, marks entry, and scheduling. */
export function HelpPage() {
  const topics = [
    { title: "Preparing a document template", body: "Upload a .docx file with {placeholder} fields anywhere in the text (e.g. {studentName}, {teamName}, {vivaDate}). PRMS detects them automatically - no manual field mapping needed." },
    { title: "Entering marks", body: "Score each of the four rubric criteria from 0-10, then tick \"Confirm\" before submitting. Confirmed entries from every marker are averaged automatically into the published score." },
    { title: "Submitting availability", body: "List the time windows you're free during the review period. The auto-scheduler looks for a slot every assigned guide/panel member has in common and checks it against existing commitments before booking it." },
    { title: "Team formation & locking", body: "Invite teammates one at a time; each invite must be accepted before they join. Once a team is locked, it cannot be reopened by any student - only an Admin can undo it." },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl">Help Center</h1>
      <div className="flex flex-col gap-4">
        {topics.map((t) => (
          <Card key={t.title}>
            <h2 className="mb-1 font-display text-lg">{t.title}</h2>
            <p className="text-sm text-ink/70">{t.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
