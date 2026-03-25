export const PATTERNS = {
    pagination: /^[0-9]+$/,
    confirmApprove: /confirm|ok|yes|approve/i,
    confirmReject: /confirm|ok|yes|reject/i,
    confirmSave: /confirm|ok|yes|save/i,
    confirmSubmit: /confirm|ok|yes|submit/i,
    confirmDelete: /confirm|ok|yes|delete/i,
    updateRequest: /update|edit/i,
    deleteRequest: /delete/i,
} as const;
