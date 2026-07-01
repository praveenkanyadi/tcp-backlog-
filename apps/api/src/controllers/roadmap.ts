import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getQuarters(req: Request, res: Response) {
  try {
    const config = await prisma.backlogConfig.findUnique({ where: { key: "roadmap_quarters" } });
    const quarters: string[] = config
      ? (config.values as string[])
      : ["Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"];
    res.json(quarters);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getRoadmap(req: Request, res: Response) {
  try {
    const { quarter } = req.query as { quarter?: string };

    const where: Record<string, unknown> = { publishedToStakeholders: true };
    if (quarter) where.roadmapQuarter = quarter;

    const items = await prisma.backlogItem.findMany({
      where,
      include: {
        status: true,
        product: true,
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { businessPriority: "asc" },
    });

    // Group by roadmapQuarter
    const grouped = new Map<string, typeof items>();
    for (const item of items) {
      const q = item.roadmapQuarter ?? "Unscheduled";
      if (!grouped.has(q)) grouped.set(q, []);
      grouped.get(q)!.push(item);
    }

    const result = Array.from(grouped.entries()).map(([quarter, items]) => ({ quarter, items }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
