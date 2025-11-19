import { Router } from "express";
import { recomendarTecnicos } from "../controllers/ml.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/recomendar", authMiddleware, recomendarTecnicos);

export default router;
