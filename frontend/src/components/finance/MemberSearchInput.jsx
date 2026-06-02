import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchMembers } from '../../api/endpoints/members';
import useDebounce from '../../hooks/useDebounce';

export default function MemberSearchInput({
  value,
  onSelect,
  onClear,
  placeholder = 'Search member by name or ID',
}) {
  const [search, setSearch] = useState(value?.memberName || value?.memberId || '');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setSearch(value?.memberName || value?.memberId || '');
  }, [value?.memberId, value?.memberName]);

  const query = useQuery({
    queryKey: ['member-search-input', debouncedSearch],
    queryFn: () => searchMembers({ search: debouncedSearch, limit: 8 }),
    enabled: debouncedSearch.trim().length >= 2,
  });

  const members = query.data?.members || [];

  return (
    <div className="relative space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-white/80">Member</span>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent"
          />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onClear?.();
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70"
          >
            Clear
          </button>
        </div>
      </label>

      {debouncedSearch.trim().length >= 2 && members.length ? (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1120] shadow-2xl shadow-black/30">
          {members.map((member) => {
            const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');
            return (
              <button
                key={member.memberId}
                type="button"
                onClick={() => {
                  onSelect?.({
                    memberId: member.memberId,
                    memberName: fullName,
                    member,
                  });
                  setSearch(fullName || member.memberId);
                }}
                className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left last:border-b-0 hover:bg-white/5"
              >
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={fullName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {(fullName || member.memberId || 'M').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{fullName || member.memberId}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">{member.memberId}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
