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
    <div>

      {/* Heading */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-800">
            User Management
          </h1>

          <p className="text-gray-500 mt-2">
            Manage Employees
          </p>

        </div>

       <button
    onClick={() => {

        setEditingUser(null);

        setShowModal(true);

    }}
    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
>
    + Add User
</button>

      </div>

      {/* Filters */}

      <div className="flex gap-4 mb-6">

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => {

            setSearch(e.target.value);
            setPage(1);

          }}
          className="border rounded-lg px-4 py-2 w-72"
        />

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>

        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

      <table className="w-full min-w-[1100px] border border-collapse">

        <thead>

          <tr className="bg-gray-100">

            <th className="border p-3">Employee ID</th>
            <th className="border p-3">Name</th>
            <th className="border p-3">Department</th>
            <th className="border p-3">Designation</th>
            <th className="border p-3">Role</th>
            <th className="border p-3">Status</th>
            <th className="border p-3">Actions</th>

          </tr>

        </thead>

        <tbody>

          {users.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="text-center py-8"
              >
                No Users Found
              </td>

            </tr>

          ) : (

            users.map((user) => (

              <tr key={user._id}>

                <td className="border p-3 min-w-[170px] break-all">
                  {user.employeeId}
                </td>

                <td className="border p-3">
                  {user.name}
                </td>

                <td className="border p-3">
                  {user.department?.name}
                </td>

                <td className="border p-3">
                  {user.designation}
                </td>

                <td className="border p-3 capitalize">
                  {user.role}
                </td>

                <td className="border p-3">

                  {user.isActive ? (

                    <span className="text-green-600 font-semibold">
                      Active
                    </span>

                  ) : (

                    <span className="text-red-600 font-semibold">
                      Inactive
                    </span>

                  )}

                </td>

                <td className="border p-3">

                  <div className="flex justify-center gap-2">

                    <button
    onClick={() => {

        setEditingUser(user);

        setShowModal(true);

    }}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
>
    Edit
</button>

                    <button
                      onClick={async () => {

                        await updateUserStatus(
                          user._id,
                          !user.isActive
                        );

                        loadUsers();

                      }}
                      className={`px-3 py-1 rounded text-white ${
                        user.isActive
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >

                      {user.isActive
                        ? "Deactivate"
                        : "Activate"}

                    </button>

                    <button
                      onClick={async () => {

                        if (
                          window.confirm(
                            "Delete this user?"
                          )
                        ) {

                          await deleteUser(user._id);

                          loadUsers();

                        }

                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      </div>

      {/* Pagination */}

      <div className="flex justify-end items-center gap-3 mt-6">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>

          Page {page} of {totalPages}

        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

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