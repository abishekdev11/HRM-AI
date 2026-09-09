const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { login, logout } = require("../controllers/authController");

router.post("/login", login);

router.post("/logout", authenticate, logout);

router.get(
    "/profile",
    authenticate,
    (req, res) => {

        res.json({

            success: true,

            user: req.user

        });

    }
);
module.exports = router;
