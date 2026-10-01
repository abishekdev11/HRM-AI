import { useNavigate } from "react-router-dom";
import { login } from "../api/chatbot";
import { useRef, useState } from "react";
import { FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";

function Login() {

    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const employeeIdInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const [employeeIdError, setEmployeeIdError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [inactiveWarning, setInactiveWarning] = useState("");

    const handleLogin = async (event) => {

    event.preventDefault();

    const missingEmployeeId = !employeeId.trim();
    const missingPassword = !password;

    setEmployeeIdError(missingEmployeeId ? "Employee ID is mandatory" : "");
    setPasswordError(missingPassword ? "Password is mandatory" : "");

    if (missingEmployeeId || missingPassword) {
        if (missingEmployeeId) {
            employeeIdInputRef.current?.focus();
        } else {
            passwordInputRef.current?.focus();
        }
        return;
    }

    try {

        setLoading(true);

        setError("");
        setInactiveWarning("");

        const response = await login(

            employeeId,
            password

        );

        localStorage.setItem(

            "token",
            response.token

        );

        localStorage.setItem(

            "user",

            JSON.stringify(response.user)

        );

        const canViewDashboard = ["admin", "manager"].includes(response.user?.role);
        navigate(canViewDashboard ? "/dashboard" : "/projects");

    }

    catch (err) {

        const message = err.response?.data?.message || "Login Failed";

        // If account inactive (403), show a specific small warning box
        if (err.response?.status === 403) {
            setInactiveWarning(message);
            setError("");
        } else {
            setError(message);
            setInactiveWarning("");
        }

    }

    finally {

        setLoading(false);

    }

};

    return (

        <div className="min-h-screen flex bg-gray-100">

            {/* Left Section */}

            <div className="hidden md:flex w-1/2 bg-blue-700 text-white flex-col justify-center items-center p-12">

                <FaBuilding size={70} />

                <h1 className="text-5xl font-bold mt-6">

                    CompanyHub

                </h1>

                <p className="mt-4 text-xl text-blue-100">

                    Human Resource Management System

                </p>

                <p className="mt-12 text-center text-blue-200 max-w-md">

                    Manage Employees, Attendance, Payroll,
                    Leave Management and AI Assistant
                    from one centralized dashboard.

                </p>

            </div>

            {/* Right Section */}

            <div className="flex-1 flex justify-center items-center">

                <div className="bg-white w-full max-w-md shadow-xl rounded-xl p-10">

                    <h2 className="text-3xl font-bold text-center mb-2">

                        Welcome Back

                    </h2>

                    <p className="text-gray-500 text-center mb-8">

                        Login to continue

                    </p>

                    <form onSubmit={handleLogin}>

                    {/* EmployeeId */}

                    <div className="mb-5">

                        <label className="block mb-2 font-medium">

                            EmployeeId

                        </label>

                        <input

                            type="text"

                            autoFocus

                            ref={employeeIdInputRef}

                            value={employeeId}

                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    if (!employeeId.trim()) {
                                        setEmployeeIdError("Employee ID is mandatory");
                                        return;
                                    }
                                    setEmployeeIdError("");
                                    passwordInputRef.current?.focus();
                                }
                            }}

                            onChange={(e) => {
                                setEmployeeId(e.target.value.toUpperCase())
                                if (e.target.value.trim()) {
                                    setEmployeeIdError("");
                                }
                            }}

                            aria-invalid={Boolean(employeeIdError)}

                            aria-describedby={employeeIdError ? "employee-id-error" : undefined}

                            placeholder="Enter your Employee Id"

                            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"

                        />

                        {employeeIdError && (
                            <p id="employee-id-error" className="text-red-600 text-sm mt-2">
                                {employeeIdError}
                            </p>
                        )}

                    </div>

                    {/* Password */}

                    <div className="mb-8">

                        <label className="block mb-2 font-medium">

                            Password

                        </label>

                        <div className="relative">

                            <input

                                type={showPassword ? "text" : "password"}

                                ref={passwordInputRef}

                                value={password}

                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    if (e.target.value) {
                                        setPasswordError("");
                                    }
                                }}

                                aria-invalid={Boolean(passwordError)}

                                aria-describedby={passwordError ? "password-error" : undefined}

                                placeholder="Enter your password"

                                className="w-full border rounded-lg px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500"

                            />

                            <button

                                type="button"

                                onClick={() =>

                                    setShowPassword(!showPassword)

                                }

                                className="absolute right-4 top-4 text-gray-500"

                            >

                                {showPassword ?

                                    <FaEyeSlash />

                                    :

                                    <FaEye />

                                }

                            </button>

                        </div>

                        {passwordError && (
                            <p id="password-error" className="text-red-600 text-sm mt-2">
                                {passwordError}
                            </p>
                        )}

                    </div>

                    {error && (

    <p className="text-red-600 text-sm mb-4">

        {error}

    </p>

)}

                    {inactiveWarning && (
                        <div className="mb-4 p-3 rounded border border-yellow-400 bg-yellow-50 text-yellow-800 text-sm">
                            {inactiveWarning}
                        </div>
                    )}

                    {/* Login Button */}

                <button

    type="submit"

    disabled={loading}

    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"

>

    {loading ?

        "Logging in..."

        :

        "Login"

    }

</button>

                    </form>
                </div>

            </div>

        </div>

    );

}

export default Login;