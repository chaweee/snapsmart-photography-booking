// Each admin page is its own lazily-loaded chunk. These loaders are shared by the
// router (App.tsx, via React.lazy) and by AdminLayout, which preloads them all in
// the background so switching admin pages doesn't wait for a download.
export const adminPageLoaders = {
  dashboard: () => import("../admin/LiveDashboard"),
  galleries: () => import("../admin/PrivateGalleries"),
  packages: () => import("../admin/AdminPackages"),
  todoList: () => import("../admin/LiveTodoList"),
  payments: () => import("../admin/PaymentProofs"),
  walkIn: () => import("../admin/AdminWalkInBooking"),
  teamAssignments: () => import("../admin/BookingTeamAssignments"),
  portfolio: () => import("../admin/PortfolioManager"),
  teamDirectory: () => import("../admin/TeamDirectory"),
  // Shared with the client portal.
  records: () => import("../components/LiveRecords"),
  bookingViews: () => import("../components/BookingViews"),
  notifications: () => import("../components/NotificationsPage"),
};

let preloaded = false;

/** Starts downloading every admin page chunk once, when the browser is idle. */
export function preloadAdminPages() {
  if (preloaded) return;
  preloaded = true;
  const run = () => {
    for (const load of Object.values(adminPageLoaders)) void load().catch(() => { /* retried on navigation */ });
  };
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 2000 });
  else window.setTimeout(run, 300);
}
