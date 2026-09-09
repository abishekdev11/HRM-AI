import { useEffect, useState } from "react";
import DepartmentFormModal from "../components/DepartmentFormModal";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../api/chatbot";

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const loadDepartments = async () => {
    try {
      const response = await getDepartments({ all: "true" });
      let data = response.data;

      if (search) {
        data = data.filter((dept) =>
          dept.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (status) {
        const activeFilter = status === "true";
        data = data.filter((dept) => dept.isActive === activeFilter);
      }

      setDepartments(data);
      setTotalPages(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDepartment = async (formData) => {
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment._id, formData);
      } else {
        await createDepartment(formData);
      }
      setShowModal(false);
      setEditingDepartment(null);
      loadDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (department) => {
    try {
      await updateDepartment(department._id, {
        name: department.name,
        description: department.description,
        isActive: !department.isActive,
      });
      loadDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [search, status]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Department Management
          </h1>
          <p className="text-gray-500 mt-2">Add and update departments</p>
        </div>
        <button
          onClick={() => {
            setEditingDepartment(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
        >
          + Add Department
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2 w-72"
        />

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

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3">Name</th>
            <th className="border p-3">Description</th>
            <th className="border p-3">Status</th>
            <th className="border p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8">
                No Departments Found
              </td>
            </tr>
          ) : (
            departments.map((department) => (
              <tr key={department._id}>
                <td className="border p-3">{department.name}</td>
                <td className="border p-3">{department.description}</td>
                <td className="border p-3">
                  {department.isActive ? (
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
                        setEditingDepartment(department);
                        setShowModal(true);
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleToggleStatus(department);
                      }}
                      className={`px-3 py-1 rounded text-white ${
                        department.isActive
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {department.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <DepartmentFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDepartment(null);
        }}
        onSubmit={handleSaveDepartment}
        editingDepartment={editingDepartment}
      />
    </div>
  );
}

export default DepartmentManagement;
