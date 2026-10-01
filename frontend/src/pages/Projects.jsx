import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaProjectDiagram,
  FaTimes,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import { getProjects } from "../api/chatbot";

function ProgressCircle({ project, size = "large" }) {
  const isSmall = size === "small";

  return (
    <div
      className={`project-progress-circle ${isSmall ? "project-progress-circle-small" : ""}`}
      style={{
        background: `conic-gradient(${project.accent} ${project.progress}%, #e2e8f0 0)`,
      }}
      aria-label={`${project.progress}% complete`}
    >
      <div className="project-progress-circle-inner">
        <strong>{project.progress}%</strong>
        {!isSmall && <span>complete</span>}
      </div>
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await getProjects();
        setProjects(response?.data || []);
      } catch (loadError) {
        console.error("Error loading projects:", loadError);
        setError("Could not load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className="page-enter max-w-[1500px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 mb-2">
            Delivery workspace
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="text-slate-500 mt-2">
            Track project health, ownership, and team allocation in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
          {projects.length} active projects
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-slate-500">Loading projects...</p>}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
          No active projects found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {projects.map((project, index) => (
          <div
            key={project._id || project.id}
            onClick={() => setSelectedProject(project)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedProject(project);
              }
            }}
            role="button"
            tabIndex={0}
            className="project-card stagger-in text-left"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex justify-center mb-6">
              <ProgressCircle project={project} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-2">
                  Project
                </p>
                <h2 className="text-lg font-bold text-slate-900">{project.name}</h2>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedClient(project.client);
                  }}
                  className="project-client-link text-sm text-slate-500 mt-1"
                >
                  {project.client?.name || "Client unavailable"}
                </button>
              </div>
              <FaProjectDiagram className="text-slate-300 mt-1" />
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Team lead</span>
              <span className="font-semibold text-slate-700">{project.teamLead?.name || "Unassigned"}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center">
          <div
            className="project-detail-panel w-full max-w-xl rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-detail-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 mb-2">
                  Project details
                </p>
                <h2 id="project-detail-title" className="text-2xl font-bold text-slate-900">
                  {selectedProject.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close project details"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 p-6">
              <ProgressCircle project={selectedProject} size="small" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="project-detail-item">
                  <FaBuilding />
                  <div><span>Client</span><strong>{selectedProject.client?.name || "Client unavailable"}</strong></div>
                </div>
                <div className="project-detail-item">
                  <FaUserTie />
                  <div><span>Team lead</span><strong>{selectedProject.teamLead?.name || "Unassigned"}</strong></div>
                </div>
                <div className="project-detail-item sm:col-span-2">
                  <FaUsers />
                  <div>
                    <span>Assigned employees</span>
                    <strong>{selectedProject.employees?.map((employee) => employee.name).join(", ") || "None assigned"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center">
          <div
            className="project-detail-panel w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-detail-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 mb-2">
                  Client details
                </p>
                <h2 id="client-detail-title" className="text-2xl font-bold text-slate-900">
                  {selectedClient.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close client details"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid gap-5 p-6">
              <div className="project-detail-item">
                <FaMapMarkerAlt />
                <div><span>Address</span><strong>{selectedClient.address}</strong></div>
              </div>
              <div className="project-detail-item">
                <FaEnvelope />
                <div><span>Email</span><strong>{selectedClient.email}</strong></div>
              </div>
              <div className="project-detail-item">
                <FaPhone />
                <div><span>Contact number</span><strong>{selectedClient.contactNo}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;