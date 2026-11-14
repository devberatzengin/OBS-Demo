import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { cn } from './cn';

/**
 * Footer for a server-paged list. page is 0-based, as the backend sends it.
 * Renders nothing when everything fits on one page.
 */
export default function Pagination({ page, totalPages, totalElements, onChange, className }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className={cn('flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm', className)}>
      <p className="text-fg-subtle tabular-nums">
        Page {page + 1} of {totalPages}{totalElements != null && ` · ${totalElements} total`}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={page <= 0} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
