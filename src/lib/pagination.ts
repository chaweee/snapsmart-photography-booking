export const PAGE_SIZE = 10;

/** Number of pages needed for `total` items (at least 1). */
export const pageCount = (total: number, pageSize = PAGE_SIZE) => Math.max(1, Math.ceil(total / pageSize));

/** Keeps a page number inside 1..pageCount (e.g. after the list shrinks). */
export const clampPage = (page: number, total: number, pageSize = PAGE_SIZE) => Math.min(Math.max(1, page), pageCount(total, pageSize));

/** The items shown on `page` (1-based). */
export const pageSlice = <T>(items: T[], page: number, pageSize = PAGE_SIZE) =>
  items.slice((page - 1) * pageSize, page * pageSize);

/** The page (1-based) that contains the item at `index`. */
export const pageOfIndex = (index: number, pageSize = PAGE_SIZE) => Math.floor(Math.max(0, index) / pageSize) + 1;
