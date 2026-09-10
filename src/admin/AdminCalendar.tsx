import { useMemo, useState } from "react";
import "./Admin.css";

type BookingStatus =
  | "Pending"
  | "Awaiting Payment"
  | "For Verification"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

interface CalendarBooking {
  id: string;
  clientName: string;
  packageName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status: BookingStatus;
  paymentStatus: string;
  photographer: string;
  videographer?: string;
  themeMotif?: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const sampleBookings: CalendarBooking[] = [
  {
    id: "BK-2026-001",
    clientName: "Maria Santos",
    packageName: "Storyteller",
    eventType: "Wedding",
    eventDate: "2026-09-18",
    startTime: "09:00 AM",
    endTime: "04:00 PM",
    location: "San Jose, Batangas",
    status: "For Verification",
    paymentStatus: "Payment proof uploaded",
    photographer: "Toni Villacoba",
    videographer: "Videographer A",
    themeMotif: "Rustic garden",
  },
  {
    id: "BK-2026-002",
    clientName: "John Reyes",
    packageName: "Digital Keepsake Plus",
    eventType: "Birthday",
    eventDate: "2026-09-21",
    startTime: "02:00 PM",
    endTime: "06:00 PM",
    location: "Lipa City, Batangas",
    status: "Confirmed",
    paymentStatus: "Down payment verified",
    photographer: "Photographer A",
    themeMotif: "Blue and silver",
  },
  {
    id: "BK-2026-003",
    clientName: "Angela Cruz",
    packageName: "Signature Experience",
    eventType: "Wedding",
    eventDate: "2026-09-28",
    startTime: "08:00 AM",
    endTime: "05:00 PM",
    location: "Batangas City",
    status: "Pending",
    paymentStatus: "No payment proof yet",
    photographer: "No Preference",
    videographer: "No Preference",
    themeMotif: "Classic white",
  },
  {
    id: "BK-2026-004",
    clientName: "Sophia Mendoza",
    packageName: "Captured Moments",
    eventType: "Christening",
    eventDate: "2026-09-21",
    startTime: "09:00 AM",
    endTime: "12:00 PM",
    location: "Rosario, Batangas",
    status: "Confirmed",
    paymentStatus: "Down payment verified",
    photographer: "Toni Villacoba",
    themeMotif: "Pastel pink",
  },
];

function formatDateKey(year: number, month: number, day: number) {
  const monthValue = String(month + 1).padStart(2, "0");
  const dayValue = String(day).padStart(2, "0");

  return `${year}-${monthValue}-${dayValue}`;
}

function formatReadableDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return `${monthNames[month - 1]} ${day}, ${year}`;
}

function getStatusClass(status: BookingStatus) {
  switch (status) {
    case "Confirmed":
      return "calendar-status confirmed";
    case "Completed":
      return "calendar-status completed";
    case "Cancelled":
      return "calendar-status cancelled";
    case "For Verification":
      return "calendar-status verification";
    case "Awaiting Payment":
      return "calendar-status awaiting";
    default:
      return "calendar-status pending";
  }
}

function AdminCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8);
  const [selectedDate, setSelectedDate] = useState("2026-09-21");

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const selectedDateBookings = useMemo(
    () =>
      sampleBookings.filter(
        (booking) => booking.eventDate === selectedDate,
      ),
    [selectedDate],
  );

  const bookingsByDate = useMemo(() => {
    return sampleBookings.reduce<Record<string, CalendarBooking[]>>(
      (groupedBookings, booking) => {
        if (!groupedBookings[booking.eventDate]) {
          groupedBookings[booking.eventDate] = [];
        }

        groupedBookings[booking.eventDate].push(booking);

        return groupedBookings;
      },
      {},
    );
  }, []);

  const calendarDays = Array.from(
    { length: firstDayOfMonth + daysInMonth },
    (_, index) => {
      const dayNumber = index - firstDayOfMonth + 1;

      if (dayNumber < 1) {
        return null;
      }

      return dayNumber;
    },
  );

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
      return;
    }

    setCurrentMonth((month) => month - 1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
      return;
    }

    setCurrentMonth((month) => month + 1);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());

    const todayKey = formatDateKey(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    setSelectedDate(todayKey);
  };

  return (
    <div className="admin-calendar-page">
      <section className="admin-page-heading">
        <div>
          <p>Calendar / Schedule</p>
          <h2>Booking calendar</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={goToToday}>
            Today
          </button>

          <button type="button">Block Date</button>

          <button type="button">Export Schedule</button>
        </div>
      </section>

      <section className="calendar-layout">
        <article className="admin-panel calendar-panel">
          <div className="calendar-header">
            <div>
              <p>Monthly Schedule</p>
              <h3>
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>

            <div className="calendar-month-actions">
              <button type="button" onClick={goToPreviousMonth}>
                ←
              </button>

              <button type="button" onClick={goToNextMonth}>
                →
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((dayNumber, index) => {
              if (!dayNumber) {
                return (
                  <div
                    className="calendar-day empty"
                    key={`empty-${index}`}
                  />
                );
              }

              const dateKey = formatDateKey(
                currentYear,
                currentMonth,
                dayNumber,
              );

              const dayBookings = bookingsByDate[dateKey] ?? [];
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={
                    isSelected
                      ? "calendar-day selected"
                      : "calendar-day"
                  }
                  onClick={() => setSelectedDate(dateKey)}
                >
                  <span className="calendar-day-number">
                    {dayNumber}
                  </span>

                  {dayBookings.length > 0 && (
                    <div className="calendar-day-bookings">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <span
                          key={booking.id}
                          className={getStatusClass(booking.status)}
                        >
                          {booking.eventType}
                        </span>
                      ))}

                      {dayBookings.length > 2 && (
                        <small>+{dayBookings.length - 2} more</small>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </article>

        <aside className="admin-panel day-booking-panel">
          <div className="day-panel-heading">
            <p>Selected Day</p>
            <h3>{formatReadableDate(selectedDate)}</h3>
            <span>
              {selectedDateBookings.length} booking
              {selectedDateBookings.length === 1 ? "" : "s"} found
            </span>
          </div>

          {selectedDateBookings.length === 0 ? (
            <div className="empty-day-state">
              <strong>No bookings yet</strong>
              <p>
                This date is still available. Confirmed, pending, and
                walk-in bookings will appear here once connected to
                Supabase.
              </p>
            </div>
          ) : (
            <div className="day-booking-list">
              {selectedDateBookings.map((booking) => (
                <article className="day-booking-card" key={booking.id}>
                  <div className="day-booking-top">
                    <div>
                      <span>{booking.id}</span>
                      <h4>{booking.clientName}</h4>
                    </div>

                    <strong className={getStatusClass(booking.status)}>
                      {booking.status}
                    </strong>
                  </div>

                  <div className="day-booking-details">
                    <div>
                      <span>Package</span>
                      <strong>{booking.packageName}</strong>
                    </div>

                    <div>
                      <span>Event</span>
                      <strong>{booking.eventType}</strong>
                    </div>

                    <div>
                      <span>Time</span>
                      <strong>
                        {booking.startTime} - {booking.endTime}
                      </strong>
                    </div>

                    <div>
                      <span>Payment</span>
                      <strong>{booking.paymentStatus}</strong>
                    </div>

                    <div className="full-detail">
                      <span>Location</span>
                      <strong>{booking.location}</strong>
                    </div>

                    {booking.themeMotif && (
                      <div className="full-detail">
                        <span>Theme / Motif</span>
                        <strong>{booking.themeMotif}</strong>
                      </div>
                    )}

                    <div>
                      <span>Photographer</span>
                      <strong>{booking.photographer}</strong>
                    </div>

                    {booking.videographer && (
                      <div>
                        <span>Videographer</span>
                        <strong>{booking.videographer}</strong>
                      </div>
                    )}
                  </div>

                  <div className="day-booking-actions">
                    <button type="button">View Booking</button>
                    <button type="button">Update Status</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export default AdminCalendar;