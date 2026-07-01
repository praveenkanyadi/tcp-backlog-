import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// Products
export async function listProducts(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      include: { portfolio: true, areas: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, portfolioId, color, description, sortOrder } = req.body;
    const product = await prisma.product.create({
      data: { name, portfolioId, sortOrder: sortOrder ?? 0 },
      include: { portfolio: true, areas: true },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, portfolioId, sortOrder } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: { name, portfolioId, sortOrder },
      include: { portfolio: true, areas: true },
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// Areas (ProductArea)
export async function listAreas(req: Request, res: Response) {
  try {
    const areas = await prisma.productArea.findMany({
      include: { product: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createArea(req: Request, res: Response) {
  try {
    const { name, productId, sortOrder } = req.body;
    const area = await prisma.productArea.create({
      data: { name, productId, sortOrder: sortOrder ?? 0 },
      include: { product: true },
    });
    res.status(201).json(area);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function updateArea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, productId, sortOrder } = req.body;
    const area = await prisma.productArea.update({
      where: { id },
      data: { name, productId, sortOrder },
      include: { product: true },
    });
    res.json(area);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function deleteArea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.productArea.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// BacklogStatus
export async function listStatuses(req: Request, res: Response) {
  try {
    const statuses = await prisma.backlogStatus.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createStatus(req: Request, res: Response) {
  try {
    const { name, color, sortOrder, isDefault } = req.body;
    const status = await prisma.backlogStatus.create({
      data: { name, color, sortOrder: sortOrder ?? 0, isDefault: isDefault ?? false },
    });
    res.status(201).json(status);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, color, sortOrder, isDefault } = req.body;
    const status = await prisma.backlogStatus.update({
      where: { id },
      data: { name, color, sortOrder, isDefault },
    });
    res.json(status);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function deleteStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.backlogStatus.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// BacklogSource
export async function listSources(req: Request, res: Response) {
  try {
    const sources = await prisma.backlogSource.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createSource(req: Request, res: Response) {
  try {
    const { name, sortOrder } = req.body;
    const source = await prisma.backlogSource.create({
      data: { name, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(source);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function updateSource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    const source = await prisma.backlogSource.update({
      where: { id },
      data: { name, sortOrder },
    });
    res.json(source);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function deleteSource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.backlogSource.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// StrategicInitiative
export async function listInitiatives(req: Request, res: Response) {
  try {
    const initiatives = await prisma.strategicInitiative.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(initiatives);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createInitiative(req: Request, res: Response) {
  try {
    const { name, color, sortOrder } = req.body;
    const initiative = await prisma.strategicInitiative.create({
      data: { name, color, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(initiative);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function updateInitiative(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, color, sortOrder } = req.body;
    const initiative = await prisma.strategicInitiative.update({
      where: { id },
      data: { name, color, sortOrder },
    });
    res.json(initiative);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function deleteInitiative(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.strategicInitiative.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// TargetRelease
export async function listReleases(req: Request, res: Response) {
  try {
    const releases = await prisma.targetRelease.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createRelease(req: Request, res: Response) {
  try {
    const { name, sortOrder } = req.body;
    const release = await prisma.targetRelease.create({
      data: { name, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(release);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function updateRelease(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    const release = await prisma.targetRelease.update({
      where: { id },
      data: { name, sortOrder },
    });
    res.json(release);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function deleteRelease(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.targetRelease.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// BacklogConfig
export async function getConfig(req: Request, res: Response) {
  try {
    const [dsConfig, rqConfig] = await Promise.all([
      prisma.backlogConfig.findUnique({ where: { key: "discovery_statuses" } }),
      prisma.backlogConfig.findUnique({ where: { key: "roadmap_quarters" } }),
    ]);

    res.json({
      discoveryStatuses: dsConfig ? (dsConfig.values as string[]) : [],
      roadmapQuarters: rqConfig ? (rqConfig.values as string[]) : [],
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function updateConfig(req: Request, res: Response) {
  try {
    const { discoveryStatuses, roadmapQuarters } = req.body as {
      discoveryStatuses?: string[];
      roadmapQuarters?: string[];
    };

    const ops: Promise<unknown>[] = [];

    if (discoveryStatuses !== undefined) {
      ops.push(
        prisma.backlogConfig.upsert({
          where: { key: "discovery_statuses" },
          update: { values: discoveryStatuses },
          create: { key: "discovery_statuses", values: discoveryStatuses },
        })
      );
    }

    if (roadmapQuarters !== undefined) {
      ops.push(
        prisma.backlogConfig.upsert({
          where: { key: "roadmap_quarters" },
          update: { values: roadmapQuarters },
          create: { key: "roadmap_quarters", values: roadmapQuarters },
        })
      );
    }

    await Promise.all(ops);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

// Users
export async function listUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}
