import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getUser } from "../lib/auth.js";

export async function getPortfolio(req: Request, res: Response) {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: { products: true },
    });
    res.json(portfolios);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getTaxonomy(req: Request, res: Response) {
  try {
    const [portfolios, statuses, sources, releases, initiatives, dsConfig, rqConfig] = await Promise.all([
      prisma.portfolio.findMany({ include: { products: { include: { areas: true } } } }),
      prisma.backlogStatus.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.backlogSource.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.targetRelease.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.strategicInitiative.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.backlogConfig.findUnique({ where: { key: "discovery_statuses" } }),
      prisma.backlogConfig.findUnique({ where: { key: "roadmap_quarters" } }),
    ]);

    const discoveryStatuses: string[] = dsConfig ? (dsConfig.values as string[]) : [];
    const roadmapQuarters: string[] = rqConfig ? (rqConfig.values as string[]) : [];

    const products = portfolios.flatMap((p: { products: { areas: unknown[] }[] }) => p.products);
    const areas = products.flatMap((p: { areas: unknown[] }) => p.areas);

    res.json({ portfolios, products, areas, statuses, sources, releases, initiatives, discoveryStatuses, roadmapQuarters });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getActivity(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit ?? 20);
    const itemId = req.query.itemId as string | undefined;

    const where = itemId ? { itemId } : {};

    const activities = await prisma.backlogActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { item: { select: { title: true } } },
    });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function publishRanking(req: Request, res: Response) {
  try {
    const { productId, updates } = req.body as { productId: string; updates: { id: string; priorityRank: number }[] };
    const user = getUser(req);

    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.backlogItem.update({
          where: { id: update.id },
          data: { businessPriority: update.priorityRank, rankPublishedAt: new Date() },
        });
      }

      // Use the first item id for the activity, or a placeholder product-level item if none
      const firstItemId = updates[0]?.id;
      if (firstItemId) {
        await tx.backlogActivity.create({
          data: {
            itemId: firstItemId,
            actorId: user.id !== "anon" ? user.id : null,
            actorName: user.name,
            actorRole: user.role,
            changeType: "RANK",
            summary: `Ranking published for ${updates.length} items`,
            changes: { productId, updates },
          },
        });
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function listItems(req: Request, res: Response) {
  try {
    const {
      productId,
      statusId,
      search,
      publishedOnly,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (statusId) where.statusId = statusId;
    if (publishedOnly === "true") where.publishedToStakeholders = true;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.backlogItem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          product: true,
          productArea: true,
          status: true,
          source: true,
          targetRelease: true,
          _count: { select: { upvotes: true, comments: true } },
        },
      }),
      prisma.backlogItem.count({ where }),
    ]);

    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function createItem(req: Request, res: Response) {
  try {
    const user = getUser(req);
    const data = req.body;

    const item = await prisma.backlogItem.create({
      data: {
        ...data,
        createdById: user.id !== "anon" ? user.id : undefined,
      },
    });

    await prisma.backlogActivity.create({
      data: {
        itemId: item.id,
        actorId: user.id !== "anon" ? user.id : null,
        actorName: user.name,
        actorRole: user.role,
        changeType: "CREATE",
        summary: `Created item: ${item.title}`,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);

    const item = await prisma.backlogItem.findUnique({
      where: { id },
      include: {
        product: true,
        productArea: true,
        status: true,
        source: true,
        targetRelease: true,
        initiatives: { include: { initiative: true } },
        comments: { orderBy: { createdAt: "asc" } },
        _count: { select: { upvotes: true, comments: true } },
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const upvote = user.id !== "anon"
      ? await prisma.upvote.findUnique({ where: { itemId_userId: { itemId: id, userId: user.id } } })
      : null;

    res.json({ ...item, userUpvoted: !!upvote });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function updateItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);
    const { initiatives, ...data } = req.body;

    await prisma.$transaction(async (tx) => {
      if (initiatives !== undefined) {
        await tx.backlogItemInitiative.deleteMany({ where: { itemId: id } });
        if (Array.isArray(initiatives) && initiatives.length > 0) {
          await tx.backlogItemInitiative.createMany({
            data: initiatives.map((initiativeId: string) => ({ itemId: id, initiativeId })),
          });
        }
      }

      await tx.backlogItem.update({ where: { id }, data });

      await tx.backlogActivity.create({
        data: {
          itemId: id,
          actorId: user.id !== "anon" ? user.id : null,
          actorName: user.name,
          actorRole: user.role,
          changeType: "UPDATE",
          summary: `Updated item`,
          changes: data,
        },
      });
    });

    const updated = await prisma.backlogItem.findUnique({
      where: { id },
      include: {
        product: true,
        productArea: true,
        status: true,
        source: true,
        targetRelease: true,
        initiatives: { include: { initiative: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function deleteItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);

    const item = await prisma.backlogItem.findUnique({ where: { id }, select: { title: true } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    await prisma.backlogActivity.create({
      data: {
        itemId: id,
        actorId: user.id !== "anon" ? user.id : null,
        actorName: user.name,
        actorRole: user.role,
        changeType: "DELETE",
        summary: `Deleted item: ${item.title}`,
      },
    });

    await prisma.backlogItem.delete({ where: { id } });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function publishItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);
    const { published } = req.body as { published: boolean };

    const item = await prisma.backlogItem.update({
      where: { id },
      data: { publishedToStakeholders: published },
    });

    await prisma.backlogActivity.create({
      data: {
        itemId: id,
        actorId: user.id !== "anon" ? user.id : null,
        actorName: user.name,
        actorRole: user.role,
        changeType: "PUBLISH",
        summary: published ? "Published item to stakeholders" : "Unpublished item from stakeholders",
      },
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function engReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);
    const { estimatedEffort, complexity, technicalDeps, risks, confidenceLevel } = req.body;

    const item = await prisma.backlogItem.update({
      where: { id },
      data: {
        estimatedEffort,
        complexity,
        technicalDeps,
        risks,
        confidenceLevel,
        engReviewedAt: new Date(),
        engReviewedById: user.id !== "anon" ? user.id : undefined,
      },
    });

    await prisma.backlogActivity.create({
      data: {
        itemId: id,
        actorId: user.id !== "anon" ? user.id : null,
        actorName: user.name,
        actorRole: user.role,
        changeType: "ENG_REVIEW",
        summary: "Engineering review submitted",
        changes: { estimatedEffort, complexity, technicalDeps, risks, confidenceLevel },
      },
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function toggleUpvote(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);

    const existing = await prisma.upvote.findUnique({
      where: { itemId_userId: { itemId: id, userId: user.id } },
    });

    let upvoted: boolean;
    if (existing) {
      await prisma.upvote.delete({ where: { itemId_userId: { itemId: id, userId: user.id } } });
      upvoted = false;
    } else {
      await prisma.upvote.create({ data: { itemId: id, userId: user.id } });
      upvoted = true;
    }

    const count = await prisma.upvote.count({ where: { itemId: id } });
    res.json({ upvoted, count });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);
    const { body, parentId } = req.body as { body: string; parentId?: string };

    const comment = await prisma.comment.create({
      data: {
        itemId: id,
        authorId: user.id !== "anon" ? user.id : undefined,
        authorName: user.name,
        body,
        parentId: parentId ?? null,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const { commentId } = req.params;
    const user = getUser(req);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.authorId !== user.id) return res.status(403).json({ error: "Forbidden" });

    await prisma.comment.delete({ where: { id: commentId } });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function linkJira(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = getUser(req);
    const { jiraKey, jiraUrl } = req.body as { jiraKey: string; jiraUrl: string };

    const item = await prisma.backlogItem.update({
      where: { id },
      data: { jiraIssueKey: jiraKey, jiraUrl },
    });

    await prisma.backlogActivity.create({
      data: {
        itemId: id,
        actorId: user.id !== "anon" ? user.id : null,
        actorName: user.name,
        actorRole: user.role,
        changeType: "JIRA_LINK",
        summary: `Linked Jira issue: ${jiraKey}`,
        changes: { jiraKey, jiraUrl },
      },
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
