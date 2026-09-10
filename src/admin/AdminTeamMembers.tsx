import { useMemo, useState } from "react";
import "./Admin.css";

type TeamRole =
  | "Photographer"
  | "Videographer"
  | "Photographer & Videographer";

type TeamStatus = "Active" | "Inactive" | "Unavailable";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: TeamRole;
  status: TeamStatus;
  canLogin: boolean;
  profilePhoto: string;
  assignedEvents: number;
  nextEvent: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "TM-001",
    fullName: "Charlie Foot",
    email: "toni@example.com",
    phone: "0917 123 4567",
    role: "Photographer & Videographer",
    status: "Active",
    canLogin: true,
    profilePhoto: "/chaw.jpg",
    assignedEvents: 8,
    nextEvent: "Sept. 18, 2026",
  },
  {
    id: "TM-002",
    fullName: "Marco Reyes",
    email: "marco.reyes@example.com",
    phone: "0928 456 7788",
    role: "Photographer",
    status: "Active",
    canLogin: true,
    profilePhoto: "https://i.pravatar.cc/160?img=11",
    assignedEvents: 5,
    nextEvent: "Sept. 21, 2026",
  },
  {
    id: "TM-003",
    fullName: "Elaine Santos",
    email: "elaine.santos@example.com",
    phone: "0906 882 1144",
    role: "Videographer",
    status: "Active",
    canLogin: false,
    profilePhoto: "https://i.pravatar.cc/160?img=32",
    assignedEvents: 4,
    nextEvent: "Sept. 28, 2026",
  },
  {
    id: "TM-004",
    fullName: "Rafael Cruz",
    email: "rafael.cruz@example.com",
    phone: "0999 221 3300",
    role: "Photographer",
    status: "Unavailable",
    canLogin: false,
    profilePhoto: "https://i.pravatar.cc/160?img=15",
    assignedEvents: 2,
    nextEvent: "No upcoming event",
  },
  {
    id: "TM-005",
    fullName: "Bianca Mendoza",
    email: "bianca.mendoza@example.com",
    phone: "0915 778 9001",
    role: "Videographer",
    status: "Inactive",
    canLogin: false,
    profilePhoto: "https://i.pravatar.cc/160?img=47",
    assignedEvents: 0,
    nextEvent: "No upcoming event",
  },
];

const roleOptions = [
  "All",
  "Photographer",
  "Videographer",
  "Photographer & Videographer",
];

function getTeamStatusClass(status: TeamStatus) {
  switch (status) {
    case "Active":
      return "team-status active";
    case "Unavailable":
      return "team-status unavailable";
    default:
      return "team-status inactive";
  }
}

function AdminTeamMembers() {
  const [roleFilter, setRoleFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(
    mockTeamMembers[0].id,
  );

  const filteredMembers = useMemo(() => {
    return mockTeamMembers.filter((member) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        member.fullName.toLowerCase().includes(searchValue) ||
        member.email.toLowerCase().includes(searchValue) ||
        member.phone.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "All" || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchTerm]);

  const selectedMember =
    mockTeamMembers.find((member) => member.id === selectedMemberId) ??
    mockTeamMembers[0];

  const activeMembers = mockTeamMembers.filter(
    (member) => member.status === "Active",
  ).length;

  const loginEnabled = mockTeamMembers.filter(
    (member) => member.canLogin,
  ).length;

  const unavailableMembers = mockTeamMembers.filter(
    (member) => member.status === "Unavailable",
  ).length;

  return (
    <div className="admin-team-page">
      <section className="admin-page-heading">
        <div>
          <p>Manage Team Members</p>
          <h2>Photographers & videographers</h2>
        </div>

        <div className="dashboard-actions">
  <button type="button">Add New Member</button>
</div>
      </section>

      <section className="team-summary-grid">
        <article className="overview-card">
          <span>Total Members</span>
          <strong>{mockTeamMembers.length}</strong>
          <p>All team member records</p>
        </article>

        <article className="overview-card">
          <span>Active Members</span>
          <strong>{activeMembers}</strong>
          <p>Available for assignment</p>
        </article>

        <article className="overview-card">
          <span>Login Enabled</span>
          <strong>{loginEnabled}</strong>
          <p>Can access own schedule</p>
        </article>

        <article className="overview-card">
          <span>Unavailable</span>
          <strong>{unavailableMembers}</strong>
          <p>Not available for booking</p>
        </article>
      </section>

      <section className="team-layout">
        <article className="admin-panel team-list-panel">
          <div className="team-tools">
            <label className="team-search">
              <span>Search Member</span>
              <input
                type="search"
                placeholder="Search by name, email, or phone"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="team-filter">
              <span>Role Filter</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="team-card-grid">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                className={
                  selectedMember.id === member.id
                    ? "team-member-card selected"
                    : "team-member-card"
                }
                onClick={() => setSelectedMemberId(member.id)}
              >
                <img src={member.profilePhoto} alt={member.fullName} />

                <div className="team-member-card-copy">
                  <span>{member.id}</span>
                  <strong>{member.fullName}</strong>
                  <p>{member.role}</p>
                </div>

                <div className="team-member-card-footer">
                  <span className={getTeamStatusClass(member.status)}>
                    {member.status}
                  </span>

                  <span className="login-pill">
                    {member.canLogin ? "Can Login" : "No Login"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="booking-empty-state">
              <strong>No team members found</strong>
              <p>Try changing the search keyword or role filter.</p>
            </div>
          )}
        </article>

        <aside className="admin-panel team-detail-panel">
          <div className="team-profile-header">
            <img
              src={selectedMember.profilePhoto}
              alt={selectedMember.fullName}
            />

            <div>
              <span>{selectedMember.id}</span>
              <h3>{selectedMember.fullName}</h3>
              <p>{selectedMember.role}</p>
            </div>
          </div>

          <div className="team-detail-statuses">
            <span className={getTeamStatusClass(selectedMember.status)}>
              {selectedMember.status}
            </span>

            <span className="login-pill">
              {selectedMember.canLogin ? "Login Enabled" : "No Login Access"}
            </span>
          </div>

          <div className="team-detail-list">
            <div>
              <span>Email</span>
              <strong>{selectedMember.email}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{selectedMember.phone}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong>{selectedMember.role}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedMember.status}</strong>
            </div>

            <div>
              <span>Can Login</span>
              <strong>{selectedMember.canLogin ? "Yes" : "No"}</strong>
            </div>

            <div>
              <span>Assigned Events</span>
              <strong>{selectedMember.assignedEvents}</strong>
            </div>

            <div>
              <span>Next Event</span>
              <strong>{selectedMember.nextEvent}</strong>
            </div>
          </div>

          <div className="team-schedule-preview">
            <div>
              <p>Team Access</p>
              <h4>What this member can view</h4>
            </div>

            <ul>
              <li>Own assigned events</li>
              <li>Own calendar schedule</li>
              <li>Notifications from admin</li>
            </ul>
          </div>

          <div className="team-detail-actions">
  <button type="button">Edit Member</button>
  <button type="button">View Schedule</button>
</div>
        </aside>
      </section>
    </div>
  );
}

export default AdminTeamMembers;