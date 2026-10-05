import { useEffect, useState } from "react";
import {
  FaPlus,
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaProjectDiagram,
  FaChevronRight,
  FaTimes,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import { createProject, getProjectFormOptions, getProjects } from "../api/chatbot";
import ProjectFormModal from "../components/ProjectFormModal";

function ProgressCircle({ project, size = "large" }) {
  const isSmall = size === "small";
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
  const accent = project.accent || "#0f766e";

  return (
    <div
      className={`project-progress-circle ${isSmall ? "project-progress-circle-small" : ""} ${size === "card" ? "project-progress-circle-card" : ""}`}
      style={{
        background: `conic-gradient(${accent} ${progress}%, #e2e8f0 0)`,
      }}
      role="progressbar"
      aria-label={`${project.name} progress`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div className="project-progress-circle-inner">
        <strong>{progress}%</strong>
        {!isSmall && <span>complete</span>}
      </div>
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [canManageProjects] = useState(() => {
    try {
      const role = JSON.parse(localStorage.getItem("user") || "{}").role;
      return role === "admin" || role === "manager";
    } catch {
      return false;
    }
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormKey, setProjectFormKey] = useState(0);
  const [projectOptions, setProjectOptions] = useState({ users: [] });
  const [optionsLoading, setOptionsLoading] = useState(canManageProjects);
  const [optionsError, setOptionsError] = useState("");
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

  useEffect(() => {
    if (!canManageProjects) return undefined;
    let active = true;
    getProjectFormOptions()
      .then((response) => {
        if (active) setProjectOptions(response.data || { users: [] });
      })
      .catch((optionsLoadError) => {
        if (active) {
          console.error("Error loading project form options:", optionsLoadError);
          setOptionsError(optionsLoadError.response?.data?.message || "Could not load clients and team members.");
        }
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canManageProjects]);

  const handleCreateProject = async (projectData) => {
    const response = await createProject(projectData);
    setProjects((currentProjects) => [response.data, ...currentProjects]);
    setShowProjectForm(false);
  };

  const retryProjectOptions = async () => {
    setOptionsLoading(true);
    setOptionsError("");
    try {
      const response = await getProjectFormOptions();
      setProjectOptions(response.data || { users: [] });
    } catch (optionsLoadError) {
      console.error("Error loading project form options:", optionsLoadError);
      setOptionsError(optionsLoadError.response?.data?.message || "Could not load clients and team members.");
    } finally {
      setOptionsLoading(false);
    }
  };

  return (
    <div className="page-enter max-w-[1500px] mx-auto">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-2 border-l-2 border-teal-600 pl-4 text-slate-600">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{projects.length}</span>
            <span className="text-sm">active projects</span>
          </div>
          {canManageProjects && (
            <button
              type="button"
              onClick={() => {
                setProjectFormKey((currentKey) => currentKey + 1);
                setShowProjectForm(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              <FaPlus size={12} /> Add project
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-slate-500">Loading projects...</p>}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
          No active projects found.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => (
          <article
            key={project._id || project.id}
            className="project-card stagger-in flex flex-col"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Project</p>
              <FaProjectDiagram className="text-slate-300" aria-hidden="true" />
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(project)}
                    className="text-left hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {project.name}
                  </button>
                </h2>
                <button
                  type="button"
                  onClick={() => project.client && setSelectedClient(project.client)}
                  disabled={!project.client}
                  className="project-client-link mt-2 text-sm text-slate-500 disabled:cursor-default"
                >
                  {project.client?.name || "Client unavailable"}
                </button>
              </div>
              <ProgressCircle project={project} size="card" />
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Team lead</p>
                <p className="truncate text-sm font-semibold text-slate-700">{project.teamLead?.name || "Unassigned"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">{project.employees?.length || 0} members</span>
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  aria-label={`View ${project.name} details`}
                  title="View project details"
                  className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          </article>
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

      <ProjectFormModal
        key={projectFormKey}
        isOpen={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onSubmit={handleCreateProject}
        onRetryOptions={retryProjectOptions}
        options={projectOptions}
        optionsLoading={optionsLoading}
        optionsError={optionsError}
      />
    </div>
  );
}

export default Projects;