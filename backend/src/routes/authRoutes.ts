import { Router } from "express";
import * as authController from "../controllers/authController";
import * as rolesController from "../controllers/rolesController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { loginLimiter, otpLimiter } from "../middleware/rateLimit";
import {
  loginSchema,
  roleSelectSchema,
  forgotPasswordSchema,
  resetPasswordOtpSchema,
  resetPasswordLoggedInSchema,
  registerPanelSchema,
  refreshSchema,
} from "../validators/authValidators";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", requireAuth(), authController.logout);

router.get("/roles", requireAuth(), rolesController.listAvailableRoles);
router.post("/select-role", requireAuth(), validate(roleSelectSchema), rolesController.selectRole);

router.post("/forgot-password", otpLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password-otp", otpLimiter, validate(resetPasswordOtpSchema), authController.resetPasswordWithOtp);
router.post("/reset-password", requireAuth(), validate(resetPasswordLoggedInSchema), authController.resetPasswordLoggedIn);

router.post("/register-panel", loginLimiter, validate(registerPanelSchema), authController.registerPanel);

export default router;
