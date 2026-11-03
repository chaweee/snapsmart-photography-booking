import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import "./PhotographerPortal.css";

type AssignmentStatus = "Upcoming" | "Today" | "Completed" | "Rescheduled";
type AvailabilityStatus = "Available" | "Booked" | "Unavailable";

interface PhotographerAssignment {
  id: string;
  bookingId: string;
  clientName: string;
  eventType: string;
  packageName: string;
  eventDate: string;
  eventTime: string;
  calendarDay: number;
  location: string;
  role: "Photographer" | "Videographer";
  assignedWith: string;
  status: AssignmentStatus;
  notes: string;
  tasks: string[];
}

interface AvailabilityDay {
  id: string;
  date: string;
  day: string;
  calendarDay: number;
  status: AvailabilityStatus;
  note: string;
}

const assignments: PhotographerAssignment[] = [
  {
    id: "ASG-2026-001",
    bookingId: "BK-2026-001",
    clientName: "Maria Santos",
    eventType: "Wedding",
    packageName: "Storyteller",
    eventDate: "Sept. 18, 2026",
    eventTime: "2:00 PM - 8:00 PM",
    calendarDay: 18,
    location: "Sample Garden Events Place, Cavite",
    role: "Photographer",
    assignedWith: "Carlo Reyes - Videographer",
    status: "Upcoming",
    notes:
      "Rustic garden theme. Client requested candid shots, family portraits, and ceremony highlights.",
    tasks: [
      "Prepare camera body and backup camera",
      "Check batteries and memory cards",
      "Coordinate with assigned videographer",
      "Arrive at least 30 minutes before event time",
    ],
  },
  {
    id: "ASG-2026-002",
    bookingId: "BK-2026-004",
    clientName: "Daniel Mendoza",
    eventType: "Debut",
    packageName: "Storyteller",
    eventDate: "Sept. 22, 2026",
    eventTime: "4:00 PM - 9:00 PM",
    calendarDay: 22,
    location: "Bacoor Events Hall, Cavite",
    role: "Photographer",
    assignedWith: "Mika Lopez - Videographer",
    status: "Upcoming",
    notes:
      "Walk-in booking created by admin. Focus on entrance, 18 roses, family photos, and program highlights.",
    tasks: [
      "Review event program",
      "Confirm call time with admin",
      "Prepare portrait lens",
      "Upload selected previews after event",
    ],
  },
  {
    id: "ASG-2026-003",
    bookingId: "BK-2026-003",
    clientName: "Reyes Family",
    eventType: "Christening",
    packageName: "Digital Keepsake Plus",
    eventDate: "Aug. 28, 2026",
    eventTime: "10:00 AM - 1:00 PM",
    calendarDay: 28,
    location: "Sample Church and Reception Hall",
    role: "Photographer",
    assignedWith: "No videographer assigned",
    status: "Completed",
    notes:
      "Gallery already submitted to admin. Final edited soft copies were prepared for client release.",
    tasks: [
      "Event coverage completed",
      "Photo selection completed",
      "Final edits submitted",
      "Gallery ready for client access",
    ],
  },
];

const availabilitySchedule: AvailabilityDay[] = [
  {
    id: "AVL-001",
    date: "Sept. 18, 2026",
    day: "Friday",
    calendarDay: 18,
    status: "Booked",
    note: "Assigned to Maria Santos wedding",
  },
  {
    id: "AVL-002",
    date: "Sept. 19, 2026",
    day: "Saturday",
    calendarDay: 19,
    status: "Available",
    note: "Open for new assignment",
  },
  {
    id: "AVL-003",
    date: "Sept. 20, 2026",
    day: "Sunday",
    calendarDay: 20,
    status: "Unavailable",
    note: "Marked unavailable",
  },
  {
    id: "AVL-004",
    date: "Sept. 22, 2026",
    day: "Tuesday",
    calendarDay: 22,
    status: "Booked",
    note: "Assigned to Daniel Mendoza debut",
  },
  {
    id: "AVL-005",
    date: "Sept. 25, 2026",
    day: "Friday",
    calendarDay: 25,
    status: "Available",
    note: "Open for new assignment",
  },
  {
    id: "AVL-006",
    date: "Sept. 27, 2026",
    day: "Sunday",
    calendarDay: 27,
    status: "Unavailable",
    note: "Personal day / not available",
  },
];

const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);

const assignmentFilters = ["All", "Upcoming", "Today", "Completed"];

function PhotographerPortal() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(
    assignments[0]?.id ?? "",
  );
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredAssignments = useMemo(() => {
    if (activeFilter === "All") return assignments;

    return assignments.filter(
      (assignment) => assignment.status === activeFilter,
    );
  }, [activeFilter]);

  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedAssignmentId) ??
    assignments[0];

  const upcomingCount = assignments.filter(
    (assignment) => assignment.status === "Upcoming",
  ).length;

  const completedCount = assignments.filter(
    (assignment) => assignment.status === "Completed",
  ).length;

  const bookedDays = availabilitySchedule.filter(
    (day) => day.status === "Booked",
  ).length;

  const availableDays = availabilitySchedule.filter(
    (day) => day.status === "Available",
  ).length;

  const getAssignmentStatusClass = (status: AssignmentStatus) => {
    if (status === "Upcoming") return "upcoming";
    if (status === "Today") return "today";
    if (status === "Completed") return "completed";
    return "rescheduled";
  };

  const getAvailabilityClass = (status: AvailabilityStatus) => {
    if (status === "Available") return "available";
    if (status === "Booked") return "booked";
    return "unavailable";
  };

  const getCalendarDayStatus = (dayNumber: number) => {
    return availabilitySchedule.find((day) => day.calendarDay === dayNumber);
  };

  const getCalendarAssignment = (dayNumber: number) => {
    return assignments.find((assignment) => assignment.calendarDay === dayNumber);
  };

  const selectAssignmentFromCalendar = (dayNumber: number) => {
    const assignment = getCalendarAssignment(dayNumber);

    if (assignment) {
      setSelectedAssignmentId(assignment.id);
    }
  };

  return (
    <div className="photographer-portal-page">
      <Navbar isLoggedIn />

      <main className="photographer-portal-main">
        <section className="photographer-hero">
          <div>
            <p>Team Member Portal</p>
            <h1>Photographer account</h1>
            <span>
              View assigned bookings, event schedules, availability status, and
              task reminders.
            </span>
          </div>

          <div className="photographer-profile-card">
            <div className="photographer-profile-avatar">T</div>

            <div>
              <strong>Toni Villacoba</strong>
              <span>Lead Photographer</span>
            </div>
          </div>
        </section>

        <section className="photographer-summary-grid">
          <article>
            <span>Upcoming Assignments</span>
            <strong>{upcomingCount}</strong>
            <p>events assigned to you</p>
          </article>

          <article>
            <span>Completed Events</span>
            <strong>{completedCount}</strong>
            <p>finished event coverages</p>
          </article>

          <article>
            <span>Booked Days</span>
            <strong>{bookedDays}</strong>
            <p>dates with assignments</p>
          </article>

          <article>
            <span>Available Days</span>
            <strong>{availableDays}</strong>
            <p>open dates for booking</p>
          </article>
        </section>

        <section className="photographer-calendar-section">
          <div className="photographer-section-heading">
            <div>
              <p>Calendar</p>
              <h2>September 2026 schedule</h2>
            </div>

            <div className="photographer-calendar-legend">
              <span>
                <b className="legend-dot booked" />
                Booked
              </span>
              <span>
                <b className="legend-dot available" />
                Available
              </span>
              <span>
                <b className="legend-dot unavailable" />
                Unavailable
              </span>
            </div>
          </div>

          <div className="photographer-calendar-card">
            <div className="photographer-calendar-weekdays">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="photographer-calendar-grid">
              <div className="photographer-calendar-blank" />
              <div className="photographer-calendar-blank" />

              {calendarDays.map((dayNumber) => {
                const availability = getCalendarDayStatus(dayNumber);
                const assignment = getCalendarAssignment(dayNumber);
                const statusClass = availability
                  ? getAvailabilityClass(availability.status)
                  : "";

                return (
                  <button
                    type="button"
                    key={dayNumber}
                    className={
                      assignment
                        ? `photographer-calendar-day ${statusClass} has-assignment`
                        : `photographer-calendar-day ${statusClass}`
                    }
                    onClick={() => selectAssignmentFromCalendar(dayNumber)}
                  >
                    <strong>{dayNumber}</strong>

                    {assignment ? (
                      <span>{assignment.eventType}</span>
                    ) : availability ? (
                      <span>{availability.status}</span>
                    ) : (
                      <span>Open</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="photographer-layout">
          <div className="photographer-left-column">
            <div className="photographer-section-heading">
              <div>
                <p>Assignments</p>
                <h2>My assigned events</h2>
              </div>

              <div className="photographer-filters">
                {assignmentFilters.map((filter) => (
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
            </div>

            <div className="photographer-assignment-list">
              {filteredAssignments.map((assignment) => (
                <button
                  type="button"
                  key={assignment.id}
                  className={
                    selectedAssignment.id === assignment.id
                      ? "photographer-assignment-card active"
                      : "photographer-assignment-card"
                  }
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                >
                  <div className="photographer-assignment-top">
                    <span>{assignment.bookingId}</span>
                    <strong
                      className={`photographer-status ${getAssignmentStatusClass(
                        assignment.status,
                      )}`}
                    >
                      {assignment.status}
                    </strong>
                  </div>

                  <h3>{assignment.eventType}</h3>

                  <p>
                    {assignment.clientName} • {assignment.packageName}
                  </p>

                  <div className="photographer-assignment-meta">
                    <span>{assignment.eventDate}</span>
                    <span>{assignment.eventTime}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="photographer-section-heading availability-heading">
              <div>
                <p>Availability</p>
                <h2>Schedule status</h2>
              </div>
            </div>

            <div className="photographer-availability-list">
              {availabilitySchedule.map((day) => (
                <article
                  key={day.id}
                  className="photographer-availability-card"
                >
                  <div>
                    <span>{day.day}</span>
                    <strong>{day.date}</strong>
                    <p>{day.note}</p>
                  </div>

                  <b
                    className={`availability-status ${getAvailabilityClass(
                      day.status,
                    )}`}
                  >
                    {day.status}
                  </b>
                </article>
              ))}
            </div>
          </div>

          {selectedAssignment && (
            <aside className="photographer-detail-panel">
              <div className="photographer-detail-header">
                <span>{selectedAssignment.id}</span>
                <h2>{selectedAssignment.eventType}</h2>
                <p>{selectedAssignment.clientName}</p>
              </div>

              <div className="photographer-detail-badges">
                <strong
                  className={`photographer-status ${getAssignmentStatusClass(
                    selectedAssignment.status,
                  )}`}
                >
                  {selectedAssignment.status}
                </strong>

                <strong className="photographer-role-badge">
                  {selectedAssignment.role}
                </strong>
              </div>

              <div className="photographer-info-grid">
                <div>
                  <span>Booking ID</span>
                  <strong>{selectedAssignment.bookingId}</strong>
                </div>

                <div>
                  <span>Package</span>
                  <strong>{selectedAssignment.packageName}</strong>
                </div>

                <div>
                  <span>Date</span>
                  <strong>{selectedAssignment.eventDate}</strong>
                </div>

                <div>
                  <span>Time</span>
                  <strong>{selectedAssignment.eventTime}</strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>{selectedAssignment.location}</strong>
                </div>

                <div>
                  <span>Assigned With</span>
                  <strong>{selectedAssignment.assignedWith}</strong>
                </div>
              </div>

              <div className="photographer-notes-card">
                <span>Event Notes</span>
                <p>{selectedAssignment.notes}</p>
              </div>

              <div className="photographer-task-card">
                <span>Task Checklist</span>

                <div className="photographer-task-list">
                  {selectedAssignment.tasks.map((task) => (
                    <label key={task}>
                      <input
                        type="checkbox"
                        defaultChecked={
                          selectedAssignment.status === "Completed"
                        }
                      />
                      <span>{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="photographer-actions">
                <button type="button">Mark as Completed</button>
                <button type="button">Upload Event Previews</button>
              </div>
            </aside>
          )}
        </section>
      </main>
    </div>
  );
}

export default PhotographerPortal;