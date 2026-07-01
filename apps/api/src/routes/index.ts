import { Router } from "express";
import backlogRouter from "./backlog.js";
import adminRouter from "./admin.js";
import roadmapRouter from "./roadmap.js";
import importRouter from "./import.js";

const router = Router();
router.use("/backlog", backlogRouter);
router.use("/admin", adminRouter);
router.use("/roadmap", roadmapRouter);
router.use("/import", importRouter);
export default router;
