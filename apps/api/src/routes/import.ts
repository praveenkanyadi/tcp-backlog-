import { Router } from "express";
import multer from "multer";
import * as c from "../controllers/import.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();
router.post("/csv/preview", upload.single("file"), c.csvPreview);
router.post("/csv/confirm", c.csvConfirm);
router.post("/jira/preview", c.jiraPreview);
router.post("/jira/confirm", c.jiraConfirm);
router.get("/duplicates", c.findDuplicates);
router.post("/duplicates/resolve", c.resolveDuplicate);
export default router;
