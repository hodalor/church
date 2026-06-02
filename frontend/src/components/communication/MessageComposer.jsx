import { useMemo } from 'react';
import Card from '../ui/Card';

const variables = ['{{firstName}}', '{{lastName}}', '{{churchName}}', '{{date}}', '{{memberId}}'];

export default function MessageComposer({ value, onChange, maxLength = 500, channels = [] }) {
  const preview = useMemo(() => {
    return String(value || '')
      .replaceAll('{{firstName}}', 'Grace')
      .replaceAll('{{lastName}}', 'Member')
      .replaceAll('{{churchName}}', 'Prynova Church')
      .replaceAll('{{date}}', new Date().toLocaleDateString())
      .replaceAll('{{memberId}}', 'MEM-000001');
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {variables.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70"
            onClick={() => onChange?.(`${value || ''}${value ? ' ' : ''}${item}`)}
          >
            {item}
          </button>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-white/75">Message</span>
        <textarea
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          maxLength={maxLength}
          rows={7}
          className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-accent"
          placeholder="Write your message..."
        />
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/40">
          <span>{channels.length ? channels.join(' / ') : 'No channels selected'}</span>
          <span>
            {String(value || '').length}/{maxLength}
          </span>
        </div>
      </label>

      <Card className="rounded-2xl bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Preview</p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-white/75">{preview || 'Your rendered preview will appear here.'}</p>
      </Card>
    </div>
  );
}
