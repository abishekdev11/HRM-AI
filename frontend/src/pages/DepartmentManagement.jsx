import { useEffect, useState } from "react";
import DepartmentFormModal from "../components/DepartmentFormModal";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
} from "../api/chatbot";
import { FaBan, FaBuilding, FaCheck, FaEdit, FaPlus, FaSearch } from "react-icons/fa";

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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
    <div className="page-enter mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Organization</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Departments</h1>
          <p className="mt-2 text-sm text-slate-500">Organize teams and manage department access.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingDepartment(null);
            setShowModal(true);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <FaPlus size={12} /> Add department
        </button>
      </header>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Department directory</h2>
            <p className="mt-1 text-sm text-slate-500">{departments.length} departments</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(15rem,1fr)_auto]">
            <label className="relative block">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="search"
                placeholder="Search departments"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
            <select
              aria-label="Filter departments by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
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
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-slate-50">
                {["Department", "Description", "Status", "Actions"].map((heading) => (
                  <th key={heading} className={`border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${["Status", "Actions"].includes(heading) ? "text-center" : "text-left"}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <p className="font-semibold text-slate-700">No departments found</p>
                    <p className="mt-1 text-sm text-slate-500">Try another search or add a department.</p>
                  </td>
                </tr>
              ) : departments.map((department) => (
                <tr key={department._id} className="group transition-colors hover:bg-teal-50/35">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                        <FaBuilding size={15} />
                      </span>
                      <span className="font-semibold text-slate-900">{department.name}</span>
                    </div>
                  </td>
                  <td className="max-w-xl px-5 py-4 text-left text-sm leading-6 text-slate-600">
                    {department.description || <span className="text-slate-400">No description provided</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${department.isActive ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${department.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {department.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="Edit department"
                        aria-label={`Edit ${department.name}`}
                        onClick={() => {
                          setEditingDepartment(department);
                          setShowModal(true);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        type="button"
                        title={department.isActive ? "Deactivate department" : "Activate department"}
                        aria-label={`${department.isActive ? "Deactivate" : "Activate"} ${department.name}`}
                        onClick={() => handleToggleStatus(department)}
                        className={`grid h-9 w-9 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${department.isActive ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        {department.isActive ? <FaBan size={13} /> : <FaCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
