import { Router, Request, Response, NextFunction } from "express";
import { curateAnswer } from "../ai/curateAnswer";

const router = Router();

router.post(
  "/curate",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: "Invalid or missing 'answers' array" });
      return;
    }

    try {
      const result = await curateAnswer(answers);
      res.status(200).json({ curated: result });
    } catch (err) {
      console.error("LLM error:", err);
      res.status(500).json({ error: "AI processing failed" });
    }
  }
);

export default router;
