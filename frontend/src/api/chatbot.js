import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://hrm-ai-backend-ltot.onrender.com",
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
  const response = await API.post("/api/chat", { question });
  return response.data;
};

export const askAIAudio = async (audioBlob, filename) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  const response = await API.post("/api/chat", formData);
  return response.data;
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

// ----------------------------
// Project APIs
// ----------------------------

export async function getProjects() {
  const response = await API.get("/api/projects");
  return response.data;
}

export async function getProjectFormOptions() {
  const response = await API.get("/api/projects/options");
  return response.data;
}

export async function createProject(projectData) {
  const response = await API.post("/api/projects", projectData);
  return response.data;
}

export async function updateProject(id, projectData) {
  const response = await API.put(`/api/projects/${id}`, projectData);
  return response.data;
}

export async function deleteProject(id) {
  const response = await API.delete(`/api/projects/${id}`);
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

export const getDashboardDetails = async () => {
  const response = await API.get("/api/attendance/dashboard-details");
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

export const getWorkProgress = async () => {
  const response = await API.get("/api/attendance/progress");
  return response.data;
};

export const startWorkBreak = async (reason) => {
  const response = await API.post("/api/attendance/break/start", { reason });
  return response.data;
};

export const endWorkBreak = async () => {
  const response = await API.post("/api/attendance/break/end");
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
// Queries / Private Messages
// ----------------------------

export async function getQueryRecipients() {
  const response = await API.get("/api/queries/recipients");
  return response.data;
}

export async function getQueries() {
  const response = await API.get("/api/queries");
  return response.data;
}

export async function createQuery(queryData) {
  const response = await API.post("/api/queries", queryData);
  return response.data;
}

export async function getQueryMessages(queryId) {
  const response = await API.get(`/api/queries/${queryId}/messages`);
  return response.data;
}

export async function sendQueryMessage(queryId, body) {
  const response = await API.post(`/api/queries/${queryId}/messages`, { body });
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

