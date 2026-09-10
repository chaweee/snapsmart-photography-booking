import { useMemo, useState } from "react";
import "./Admin.css";

type NotificationType = "Payment" | "Booking" | "Gallery" | "Client" | "System";

type NotificationPriority = "High" | "Medium" | "Low";

interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRecord: string;
  time: string;
  priority: NotificationPriority;
  isUnread: boolean;
}

const adminNotifications: AdminNotification[] = [
  {
    id: "NOTIF-001",
    type: "Payment",
    title: "New payment proof submitted",
    message:
      "Maria Santos uploaded a GCash payment proof for booking BK-2026-001. Payment verification is required before confirming the booking.",
    relatedRecord: "BK-2026-001",
    time: "Today, 10:42 AM",
    priority: "High",
    isUnread: true,
  },
  {
    id: "NOTIF-002",
    type: "Payment",
    title: "Additional payment proof received",
    message:
      "Angela Cruz submitted an additional payment proof after the previous down payment was marked insufficient.",
    relatedRecord: "BK-2026-002",
    time: "Today, 9:18 AM",
    priority: "High",
    isUnread: true,
  },
  {
    id: "NOTIF-003",
    type: "Booking",
    title: "New online booking request",
    message:
      "A new online booking request was submitted for the Storyteller package. Review the event details and payment status.",
    relatedRecord: "BK-2026-004",
    time: "Yesterday, 5:36 PM",
    priority: "Medium",
    isUnread: true,
  },
  {
    id: "NOTIF-004",
    type: "Gallery",
    title: "Gallery upload pending",
    message:
      "The final gallery for the Reyes christening event is ready for upload to the client portal.",
    relatedRecord: "GAL-2026-003",
    time: "Yesterday, 2:12 PM",
    priority: "Medium",
    isUnread: false,
  },
  {
    id: "NOTIF-005",
    type: "Booking",
    title: "Upcoming event reminder",
    message:
      "Wedding coverage for booking BK-2026-001 is scheduled soon. Confirm assigned photographer and videographer availability.",
    relatedRecord: "BK-2026-001",
    time: "Sept. 17, 2026",
    priority: "Medium",
    isUnread: false,
  },
  {
    id: "NOTIF-006",
    type: "Client",
    title: "Client account linked",
    message:
      "A client account was linked to an existing walk-in booking using the same registered email address.",
    relatedRecord: "CL-2026-006",
    time: "Sept. 16, 2026",
    priority: "Low",
    isUnread: false,
  },
  {
    id: "NOTIF-007",
    type: "System",
    title: "Monthly analytics ready",
    message:
      "The monthly booking and revenue summary is ready to review in the admin dashboard.",
    relatedRecord: "Dashboard",
    time: "Sept. 15, 2026",
    priority: "Low",
    isUnread: false,
  },
];

const notificationFilters = ["All", "Unread", "Payment", "Booking", "Gallery"];

function AdminNotifications() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const notifications = useMemo(
    () =>
      adminNotifications.map((notification) => ({
        ...notification,
        isUnread:
          notification.isUnread && !readNotificationIds.includes(notification.id),
      })),
    [readNotificationIds],
  );

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return notification.isUnread;
    return notification.type === activeFilter;
  });

  const unreadCount = notifications.filter(
    (notification) => notification.isUnread,
  ).length;

  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === "High" && notification.isUnread,
  ).length;

  const paymentAlertCount = notifications.filter(
    (notification) => notification.type === "Payment" && notification.isUnread,
  ).length;

  const markAsRead = (notificationId: string) => {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId],
    );
  };

  const markAllAsRead = () => {
    setReadNotificationIds(adminNotifications.map((notification) => notification.id));
  };

  const getTypeClass = (type: NotificationType) => {
    if (type === "Payment") return "payment";
    if (type === "Booking") return "booking";
    if (type === "Gallery") return "gallery";
    if (type === "Client") return "client";
    return "system";
  };

  const getPriorityClass = (priority: NotificationPriority) => {
    if (priority === "High") return "high";
    if (priority === "Medium") return "medium";
    return "low";
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Admin Notifications</p>
          <h2>Notifications</h2>
          <span>
            Monitor booking updates, payment alerts, gallery reminders, and
            system notices.
          </span>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="notification-summary-grid">
        <article className="notification-summary-card">
          <span>Unread</span>
          <strong>{unreadCount}</strong>
          <p>notifications need attention</p>
        </article>

        <article className="notification-summary-card">
          <span>High Priority</span>
          <strong>{highPriorityCount}</strong>
          <p>urgent admin actions</p>
        </article>

        <article className="notification-summary-card">
          <span>Payment Alerts</span>
          <strong>{paymentAlertCount}</strong>
          <p>payment records for review</p>
        </article>
      </div>

      <div className="notification-filter-row">
        {notificationFilters.map((filter) => (
          <button
            type="button"
            key={filter}
            className={activeFilter === filter ? "active" : ""}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="admin-notification-list">
        {filteredNotifications.map((notification) => (
          <article
            key={notification.id}
            className={
              notification.isUnread
                ? "admin-notification-card unread"
                : "admin-notification-card"
            }
          >
            <div className="notification-icon-column">
              <div
                className={`notification-type-icon ${getTypeClass(
                  notification.type,
                )}`}
              >
                {notification.type.charAt(0)}
              </div>
            </div>

            <div className="notification-content">
              <div className="notification-content-top">
                <div>
                  <div className="notification-label-row">
                    <span
                      className={`notification-type-pill ${getTypeClass(
                        notification.type,
                      )}`}
                    >
                      {notification.type}
                    </span>

                    <span
                      className={`notification-priority-pill ${getPriorityClass(
                        notification.priority,
                      )}`}
                    >
                      {notification.priority}
                    </span>

                    {notification.isUnread && (
                      <span className="notification-unread-dot">Unread</span>
                    )}
                  </div>

                  <h3>{notification.title}</h3>
                </div>

                <strong>{notification.time}</strong>
              </div>

              <p>{notification.message}</p>

              <div className="notification-related-row">
                <span>Related Record</span>
                <strong>{notification.relatedRecord}</strong>
              </div>

              <div className="notification-action-row">
                <button type="button">View Related Record</button>

                {notification.isUnread && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="notification-empty-state">
            <strong>No notifications found</strong>
            <p>There are no notifications under this filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminNotifications;