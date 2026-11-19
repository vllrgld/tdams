import type { DocumentStatus } from '@/types/documents';

export const documentStatusLabels = {
    under_review: 'Under review',
    in_progress: 'In progress',
    approved: 'Approved',
    disapproved: 'Disapproved',
    completed: 'Completed',
    archived: 'Archived',
} as const satisfies Record<DocumentStatus, string>;
