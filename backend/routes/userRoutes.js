const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { createUser, getUsers, getUserById, updateUser, updateUserStatus, deleteUser } = require("../controllers/UserController");
const authorize = require("../middleware/authorize");

router.post("/", protect, authorize("admin"), createUser);
router.get("/", protect, authorize("admin"), getUsers);
router.get("/:id", protect, authorize("admin"), getUserById);
router.put("/:id", protect, authorize("admin"), updateUser);
router.patch("/:id/status", protect, authorize("admin"), updateUserStatus);
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;