import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 shadow-sm transition focus-within:border-white/15">
      <Search className="h-4 w-4 text-white/35" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
      />
    </label>
  );
}
