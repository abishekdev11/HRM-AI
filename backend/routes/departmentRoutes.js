const express = require("express");

const router = express.Router();
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/DepartmentController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, createDepartment);
router.get("/", protect, getDepartments);
router.put("/:id", protect, updateDepartment);
router.delete("/:id", protect, deleteDepartment);

module.exports = router;