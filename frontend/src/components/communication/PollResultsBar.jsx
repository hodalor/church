export default function PollResultsBar({ options = [] }) {
  const totalVotes = options.reduce((sum, option) => sum + Number(option.votes || 0), 0);
  const topVotes = Math.max(...options.map((option) => Number(option.votes || 0)), 0);

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const votes = Number(option.votes || 0);
        const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
        const leading = votes === topVotes && topVotes > 0;

        return (
          <div key={option.id || option.text} className="space-y-1">
            <div className="flex items-center justify-between text-sm text-white/75">
              <span>{option.text}</span>
              <span>
                {votes} votes ({percent}%)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className={leading ? 'h-full bg-accent transition-all' : 'h-full bg-[#20304f] transition-all'}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
