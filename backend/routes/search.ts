import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { scrapeStackOverflow } from "../scraper/stackoverflow";

const router = Router();

router.get(
  "/search",
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const query = req.query.q as string;

    if (!query) {
      res.status(400).json({ error: "Missing query parameter ?q=" });
      return;
    }

    try {
      const results = await scrapeStackOverflow(query);
      res.status(200).json({ results });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: "Failed to scrape StackOverflow" });
    }
  }
);

export default router;
