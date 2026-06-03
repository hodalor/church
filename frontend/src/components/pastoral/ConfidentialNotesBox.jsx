export default function ConfidentialNotesBox({ notes, hasAccess }) {
  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
        <p className="font-semibold uppercase tracking-[0.18em] text-white/45">Confidential Notes</p>
        <p className="mt-2">Locked. Restricted to senior pastors only.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/35 bg-accent/10 px-4 py-3 text-sm text-white/85">
      <p className="font-semibold uppercase tracking-[0.18em] text-accent">Confidential Notes</p>
      <p className="mt-2 whitespace-pre-wrap">{notes || 'No confidential notes recorded.'}</p>
    </div>
  );
}
