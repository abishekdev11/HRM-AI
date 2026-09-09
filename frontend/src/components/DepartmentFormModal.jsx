import { useEffect, useState } from "react";

function DepartmentFormModal({ isOpen, onClose, onSubmit, editingDepartment }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (editingDepartment) {
      setForm({
        name: editingDepartment.name,
        description: editingDepartment.description,
      });
    } else {
      setForm({
        name: "",
        description: "",
      });
    }
  }, [editingDepartment]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6">
          {editingDepartment ? "Edit Department" : "Create Department"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Department Name"
            className="w-full border rounded-lg px-4 py-2"
            required
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border rounded-lg px-4 py-2 h-32"
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-300 rounded-lg"
            >
              Cancel
            </button>

            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg">
              {editingDepartment ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DepartmentFormModal;
