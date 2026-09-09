import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
});

// Add token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------
// Text Chat
// ----------------------------

export const askAI = async (question) => {
  const response = await API.post(
    "/api/chat",
    { question },
    {
      responseType: "blob",
    }
  );

  const transcript = decodeURIComponent(
    response.headers["x-transcript"]
  );

  const answer = decodeURIComponent(
    response.headers["x-answer"]
  );

  const language = response.headers["x-language"];

  const audio = URL.createObjectURL(response.data);

  return {
    transcript,
    answer,
    language,
    audio,
  };
};

// ----------------------------
// Voice Chat
// ----------------------------

export const askAIAudio = async (audioBlob) => {
  const formData = new FormData();

  formData.append("audio", audioBlob, "voice.webm");

  const response = await API.post(
    "/api/chat",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob",
    }
  );

  const transcript = decodeURIComponent(
    response.headers["x-transcript"]
  );

  const answer = decodeURIComponent(
    response.headers["x-answer"]
  );

  const language = response.headers["x-language"];

  const audio = URL.createObjectURL(response.data);

  return {
    transcript,
    answer,
    language,
    audio,
  };
};

// ----------------------------
// User APIs
// ----------------------------

export async function getUsers(params) {
  const response = await API.get("/api/users", {
    params,
  });
  return response.data;
}

export async function createUser(userData) {
  const response = await API.post(
    "/api/users",
    userData
  );
  return response.data;
}

export async function updateUser(id, userData) {
  const response = await API.put(
    `/api/users/${id}`,
    userData
  );
  return response.data;
}

export async function deleteUser(id) {
  const response = await API.delete(
    `/api/users/${id}`
  );
  return response.data;
}

export async function updateUserStatus(id, isActive) {
  const response = await API.patch(
    `/api/users/${id}/status`,
    { isActive }
  );
  return response.data;
}

// ----------------------------
// Department APIs
// ----------------------------

export async function getDepartments(params = {}) {
  const response = await API.get(
    "/api/departments",
    { params }
  );
  return response.data;
}

export async function createDepartment(departmentData) {
  const response = await API.post(
    "/api/departments",
    departmentData
  );
  return response.data;
}

export async function updateDepartment(id, departmentData) {
  const response = await API.put(
    `/api/departments/${id}`,
    departmentData
  );
  return response.data;
}

export async function deleteDepartment(id) {
  const response = await API.delete(
    `/api/departments/${id}`
  );
  return response.data;
}

// ----------------------------
// Attendance APIs
// ----------------------------

export const getAttendanceSummary = async () => {
  const response = await API.get("/api/attendance/summary");
  return response.data;
};

export async function checkInAttendance() {
  const response = await API.post(
    "/api/attendance/checkin",
    {}
  );
  return response.data;
}

export async function getMyAttendance() {
  const response = await API.get("/api/attendance/me");
  return response.data;
}

export const getTodayAttendance = async () => {
  const response = await API.get("/api/attendance/today");
  return response.data;
};

// ----------------------------
// Leave APIs
// ----------------------------

export const getLeaves = async () => {
  const response = await API.get("/api/leave");
  return response.data;
};

export async function applyLeave({ from, to, type, reason }) {
  const response = await API.post(
    "/api/leave",
    { from, to, type, reason }
  );
  return response.data;
}

export async function approveLeave(id) {
  const response = await API.patch(
    `/api/leave/${id}/approve`,
    {}
  );
  return response.data;
}

export async function rejectLeave(id) {
  const response = await API.patch(
    `/api/leave/${id}/reject`,
    {}
  );
  return response.data;
}

// ----------------------------
// Auth APIs
// ----------------------------

export const login = async (employeeId, password) => {
  const response = await API.post("/api/auth/login", {
    employeeId,
    password
  });
  return response.data;
};

export const logout = async () => {
  const response = await API.post("/api/auth/logout", {});
  return response.data;
};

