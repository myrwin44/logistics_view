import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

// Column width classes cycle to mimic realistic table proportions.
const colWidths = ['w-24', 'w-32', 'w-20', 'w-40', 'w-16'];

export function SkeletonTable({ rows = 25, columns = 5 }: SkeletonTableProps) {
  return (
    <Table aria-busy="true" aria-label="Loading data">
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className={`h-3 ${colWidths[i % colWidths.length]}`} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <TableRow key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <TableCell key={colIdx}>
                <Skeleton
                  className={`h-4 ${colWidths[colIdx % colWidths.length]}`}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
