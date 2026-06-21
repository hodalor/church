import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
