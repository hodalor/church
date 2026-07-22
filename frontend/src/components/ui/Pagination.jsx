import Button from './Button';

export default function Pagination({ currentPage, totalPages, onPageChange, tone = 'light' }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const inactivePageClass =
    tone === 'dark'
      ? 'border border-white/10 bg-white/5 text-white shadow-sm hover:bg-white/10'
      : 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-accent/35 hover:bg-slate-50 hover:text-slate-900';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="subtle" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
              page === currentPage
                ? 'bg-accent text-primary'
                : inactivePageClass
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      <Button
        variant="subtle"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}
