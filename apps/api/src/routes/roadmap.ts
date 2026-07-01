import { Router } from "express";
import * as c from "../controllers/roadmap.js";

const router = Router();
router.get("/quarters", c.getQuarters);
router.get("/", c.getRoadmap);
export default router;
