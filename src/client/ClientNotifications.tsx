import { clientNotifications } from "./clientMockData";
import "./Client.css";

function ClientNotifications() {
  return (
    <div className="client-page">
      <section className="client-page-heading">
        <div>
          <p>Notifications</p>
          <h2>Your latest updates</h2>
        </div>
      </section>

      <section className="client-notification-list">
        {clientNotifications.map((notification) => (
          <article
            key={notification.id}
            className={
              notification.isUnread
                ? "client-notification-card unread"
                : "client-notification-card"
            }
          >
            <div>
              <span>{notification.type}</span>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>

            <strong>{notification.date}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}

export default ClientNotifications;