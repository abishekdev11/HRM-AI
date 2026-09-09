import { useEffect, useState } from "react";

function UserFormModal({
    isOpen,
    onClose,
    onSubmit,
    departments,
    editingUser
}) {

    const [form, setForm] = useState({
        employeeId: "",
        name: "",
        email: "",
        password: "",
        department: "",
        designation: "",
        role: "employee"
    });

    useEffect(() => {

        if (editingUser) {

            setForm({
                employeeId: editingUser.employeeId,
                name: editingUser.name,
                email: editingUser.email,
                password: "",
                department: editingUser.department?._id || "",
                designation: editingUser.designation,
                role: editingUser.role
            });

        } else {

            setForm({
                employeeId: "",
                name: "",
                email: "",
                password: "",
                department: "",
                designation: "",
                role: "employee"
            });

        }

    }, [editingUser]);

    if (!isOpen) return null;

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit(form);

    };

    return (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-8">

                <h2 className="text-2xl font-bold mb-6">

                    {editingUser ? "Edit User" : "Create User"}

                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <input
                        name="employeeId"
                        value={form.employeeId}
                        onChange={handleChange}
                        placeholder="Employee ID"
                        className="w-full border rounded-lg px-4 py-2"
                        required
                    />

                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full border rounded-lg px-4 py-2"
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full border rounded-lg px-4 py-2"
                        required
                    />

                    {!editingUser && (

                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full border rounded-lg px-4 py-2"
                            required
                        />

                    )}

                    <select
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2"
                        required
                    >

                        <option value="">Select Department</option>

                        {departments.map((dept) => (

                            <option
                                key={dept._id}
                                value={dept._id}
                            >
                                {dept.name}
                            </option>

                        ))}

                    </select>

                    <input
                        name="designation"
                        value={form.designation}
                        onChange={handleChange}
                        placeholder="Designation"
                        className="w-full border rounded-lg px-4 py-2"
                        required
                    />

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2"
                    >

                        <option value="admin">Admin</option>
                        <option value="hr">HR</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>

                    </select>

                    <div className="flex justify-end gap-3 pt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-300 rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            {editingUser ? "Update" : "Create"}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

export default UserFormModal;