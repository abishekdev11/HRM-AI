import { useEffect, useState } from "react";
import UserFormModal from "../components/UserFormModal";
import {
  getUsers,
  deleteUser,
  updateUserStatus,
  createUser,
  updateUser,
  getDepartments,
} from "../api/chatbot";
import {
  FaBan,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

function getInitials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [departments, setDepartments] = useState([]);

  const loadUsers = async () => {
    try {
      const response = await getUsers({
        search,
        role,
        department,
        isActive: status,
        page,
        limit: 10,
      });
      setUsers(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDepartments = async () => {

    try {

        const response = await getDepartments();

        setDepartments(response.data);

    }

    catch (err) {

        console.error(err);

    }

};

const handleSaveUser = async (formData) => {

    try {

        if (editingUser) {

            await updateUser(
                editingUser._id,
                formData
            );

        }

        else {

            await createUser(formData);

        }

        setShowModal(false);

        loadUsers();

    }

    catch (err) {

        console.error(err);

    }

};

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search, role, department, status, page]);

  return (
    <div className="page-enter mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">People operations</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee directory</h1>
          <p className="mt-2 text-sm text-slate-500">Manage employee profiles, roles, and access.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <FaPlus size={12} /> Add employee
        </button>
      </header>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Employees</h2>
            <p className="mt-1 text-sm text-slate-500">Showing {users.length} employees on this page</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex">
            <label className="relative block sm:col-span-2 lg:w-64">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="search"
                placeholder="Search employees"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
            <select
              aria-label="Filter employees by role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            <select
              aria-label="Filter employees by department"
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
            <select
              aria-label="Filter employees by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-slate-50">
                {[
                  "Employee",
                  "Department",
                  "Designation",
                  "Role",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className={`border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${["Role", "Status", "Actions"].includes(heading) ? "text-center" : "text-left"}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <p className="font-semibold text-slate-700">No employees found</p>
                    <p className="mt-1 text-sm text-slate-500">Try changing the search or filters.</p>
                  </td>
                </tr>
              ) : users.map((user) => {
                const roleTone = {
                  admin: "bg-rose-50 text-rose-700 ring-rose-200",
                  hr: "bg-cyan-50 text-cyan-800 ring-cyan-200",
                  manager: "bg-amber-50 text-amber-800 ring-amber-200",
                  employee: "bg-slate-100 text-slate-700 ring-slate-200",
                }[user.role] || "bg-slate-100 text-slate-700 ring-slate-200";

                return (
                  <tr key={user._id} className="group transition-colors hover:bg-teal-50/35">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800 ring-1 ring-teal-200">
                          {getInitials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.employeeId} · {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.department?.name || "Unassigned"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.designation || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${roleTone}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-2 text-sm font-medium ${user.isActive ? "text-emerald-700" : "text-slate-500"}`}>
                        <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Edit employee"
                          aria-label={`Edit ${user.name}`}
                          onClick={() => {
                            setEditingUser(user);
                            setShowModal(true);
                          }}
                          className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          type="button"
                          title={user.isActive ? "Deactivate employee" : "Activate employee"}
                          aria-label={`${user.isActive ? "Deactivate" : "Activate"} ${user.name}`}
                          onClick={async () => {
                            await updateUserStatus(user._id, !user.isActive);
                            loadUsers();
                          }}
                          className={`grid h-9 w-9 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${user.isActive ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          {user.isActive ? <FaBan size={13} /> : <FaCheck size={14} />}
                        </button>
                        <button
                          type="button"
                          title="Delete employee"
                          aria-label={`Delete ${user.name}`}
                          onClick={async () => {
                            if (window.confirm("Delete this user?")) {
                              await deleteUser(user._id);
                              loadUsers();
                            }
                          }}
                          className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaChevronLeft size={11} /> Previous
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <FaChevronRight size={11} />
            </button>
          </div>
        </footer>
      </section>

      <UserFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveUser}
        departments={departments}
        editingUser={editingUser}
      />
    </div>
  );
}

export default UserManagement;