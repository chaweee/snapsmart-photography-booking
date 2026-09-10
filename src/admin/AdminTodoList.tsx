import { useMemo, useState } from "react";
import "./Admin.css";
import { adminTodoItems, type AdminTodoItem } from "./adminMockData";

const statusFilters = ["All", "Pending", "In Progress", "Completed"];
const priorityFilters = ["All", "High", "Medium", "Low"];

function getTodoPriorityClass(priority: AdminTodoItem["priority"]) {
  switch (priority) {
    case "High":
      return "todo-priority high";
    case "Medium":
      return "todo-priority medium";
    default:
      return "todo-priority low";
  }
}

function getTodoStatusClass(status: AdminTodoItem["status"]) {
  switch (status) {
    case "Completed":
      return "todo-status completed";
    case "In Progress":
      return "todo-status progress";
    default:
      return "todo-status pending";
  }
}

function AdminTodoList() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedTodoId, setSelectedTodoId] = useState(adminTodoItems[0].id);

  const filteredTodoItems = useMemo(() => {
    return adminTodoItems.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      return matchesStatus && matchesPriority;
    });
  }, [statusFilter, priorityFilter]);

  const selectedTodo =
    adminTodoItems.find((item) => item.id === selectedTodoId) ??
    adminTodoItems[0];

  const pendingCount = adminTodoItems.filter(
    (item) => item.status === "Pending",
  ).length;

  const inProgressCount = adminTodoItems.filter(
    (item) => item.status === "In Progress",
  ).length;

  const completedCount = adminTodoItems.filter(
    (item) => item.status === "Completed",
  ).length;

  const highPriorityCount = adminTodoItems.filter(
    (item) => item.priority === "High",
  ).length;

  return (
    <div className="admin-todo-page">
      <section className="admin-page-heading">
        <div>
          <p>To-Do List</p>
          <h2>Admin task management</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button">Add Task</button>
          <button type="button">Mark Selected Complete</button>
        </div>
      </section>

      <section className="todo-summary-grid">
        <article className="overview-card">
          <span>Pending Tasks</span>
          <strong>{pendingCount}</strong>
          <p>Tasks not yet started</p>
        </article>

        <article className="overview-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
          <p>Currently being handled</p>
        </article>

        <article className="overview-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
          <p>Finished admin tasks</p>
        </article>

        <article className="overview-card">
          <span>High Priority</span>
          <strong>{highPriorityCount}</strong>
          <p>Needs urgent attention</p>
        </article>
      </section>

      <section className="todo-layout">
        <article className="admin-panel todo-list-panel">
          <div className="todo-tools">
            <label className="todo-filter">
              <span>Status Filter</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusFilters.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="todo-filter">
              <span>Priority Filter</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                {priorityFilters.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="todo-card-list">
            {filteredTodoItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  selectedTodo.id === item.id
                    ? "todo-task-card selected"
                    : "todo-task-card"
                }
                onClick={() => setSelectedTodoId(item.id)}
              >
                <div className="todo-task-main">
                  <div>
                    <span>{item.id}</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>

                  <div className="todo-task-badges">
                    <span className={getTodoPriorityClass(item.priority)}>
                      {item.priority}
                    </span>

                    <span className={getTodoStatusClass(item.status)}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="todo-task-footer">
                  <span>Related: {item.relatedTo}</span>
                  <span>Due: {item.dueDate}</span>
                </div>
              </button>
            ))}
          </div>

          {filteredTodoItems.length === 0 && (
            <div className="booking-empty-state">
              <strong>No tasks found</strong>
              <p>Try changing the status or priority filter.</p>
            </div>
          )}
        </article>

        <aside className="admin-panel todo-detail-panel">
          <div className="todo-detail-header">
            <span>{selectedTodo.id}</span>
            <h3>{selectedTodo.title}</h3>
            <p>{selectedTodo.relatedTo}</p>
          </div>

          <div className="todo-detail-badges">
            <span className={getTodoPriorityClass(selectedTodo.priority)}>
              {selectedTodo.priority} Priority
            </span>

            <span className={getTodoStatusClass(selectedTodo.status)}>
              {selectedTodo.status}
            </span>
          </div>

          <div className="todo-detail-list">
            <div>
              <span>Task ID</span>
              <strong>{selectedTodo.id}</strong>
            </div>

            <div>
              <span>Related To</span>
              <strong>{selectedTodo.relatedTo}</strong>
            </div>

            <div>
              <span>Due Date</span>
              <strong>{selectedTodo.dueDate}</strong>
            </div>

            <div>
              <span>Priority</span>
              <strong>{selectedTodo.priority}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedTodo.status}</strong>
            </div>

            <div className="full-detail">
              <span>Description</span>
              <strong>{selectedTodo.description}</strong>
            </div>
          </div>

          <div className="todo-detail-actions">
            <button type="button">Edit Task</button>
            <button type="button">Set In Progress</button>
            <button type="button">Mark Complete</button>
          </div>

          <div className="todo-note-box">
            <strong>Mock data note</strong>
            <p>
              These tasks are the same task records used in the Dashboard To-Do
              List preview. Later, this will come from the Supabase admin tasks
              table.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AdminTodoList;