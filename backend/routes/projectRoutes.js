const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  getProjects,
  getProjectById,
  getProjectFormOptions,
  createProject,
  updateProject,
  archiveProject,
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", protect, getProjects);
router.get("/options", protect, authorize("admin", "manager"), getProjectFormOptions);
router.get("/:id", protect, getProjectById);
router.post("/", protect, authorize("admin", "manager"), createProject);
router.put("/:id", protect, authorize("admin", "manager"), updateProject);
router.delete("/:id", protect, authorize("admin", "manager"), archiveProject);

module.exports = router;