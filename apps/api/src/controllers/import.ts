import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { parse as parseSync } from "csv-parse/sync";
import crypto from "crypto";

export async function csvPreview(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const content = req.file.buffer.toString("utf-8");
    const rows = parseSync(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const preview = rows.slice(0, 10);

    res.json({ columns, rows: preview, total: rows.length });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function csvConfirm(req: Request, res: Response) {
  try {
    const { mapping, rows } = req.body as { mapping: Record<string, string>; rows: Record<string, string>[] };

    const defaultStatus = await prisma.backlogStatus.findFirst({
      where: { isDefault: true },
    }) ?? await prisma.backlogStatus.findFirst({ orderBy: { sortOrder: "asc" } });

    if (!defaultStatus) {
      return res.status(400).json({ error: "No default status configured" });
    }

    const imported: string[] = [];
    const duplicates: { existingId: string; title: string }[] = [];

    for (const row of rows) {
      const mapped: Record<string, string> = {};
      for (const [csvCol, fieldName] of Object.entries(mapping)) {
        if (row[csvCol] !== undefined) {
          mapped[fieldName] = row[csvCol];
        }
      }

      const title = mapped.title ?? mapped.name ?? "";
      if (!title) continue;

      const existing = await prisma.backlogItem.findFirst({
        where: { title: { equals: title, mode: "insensitive" } },
      });

      if (existing) {
        duplicates.push({ existingId: existing.id, title });
      } else {
        const { productId, statusId, ...rest } = mapped;
        if (!productId) continue;

        const item = await prisma.backlogItem.create({
          data: {
            title,
            productId,
            statusId: statusId ?? defaultStatus.id,
            importSource: "CSV",
            ...rest,
          },
        });
        imported.push(item.id);
      }
    }

    res.json({ imported: imported.length, duplicates });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (node === null || node === undefined) return "";
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.content)) {
      return (obj.content as unknown[]).map(extractText).join(" ").trim();
    }
    if (obj.type === "text" && typeof obj.text === "string") {
      return obj.text;
    }
  }
  return "";
}

export async function jiraPreview(req: Request, res: Response) {
  try {
    const { host, email, token, projectKey, type } = req.body as {
      host: string;
      email: string;
      token: string;
      projectKey: string;
      type: "CLOUD" | "SERVER";
    };

    const url =
      type === "CLOUD"
        ? `https://${host}/rest/api/3/search?jql=project=${projectKey}&maxResults=50`
        : `https://${host}/rest/api/2/search?jql=project=${projectKey}&maxResults=50`;

    const Authorization = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

    const response = await fetch(url, {
      headers: { Authorization, Accept: "application/json" },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Jira returned ${response.status}` });
    }

    const data = (await response.json()) as { issues: unknown[] };

    const issues = (data.issues ?? []).map((issue: unknown) => {
      const i = issue as Record<string, unknown>;
      const fields = i.fields as Record<string, unknown>;
      return {
        key: i.key as string,
        summary: fields.summary as string,
        description: extractText(fields.description),
        status: (fields.status as Record<string, string>).name,
        priority: (fields.priority as Record<string, string> | undefined)?.name,
      };
    });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function jiraConfirm(req: Request, res: Response) {
  try {
    const { items } = req.body as {
      items: { key: string; summary: string; description: string; status: string; priority?: string }[];
    };

    const defaultStatus = await prisma.backlogStatus.findFirst({
      where: { isDefault: true },
    }) ?? await prisma.backlogStatus.findFirst({ orderBy: { sortOrder: "asc" } });

    if (!defaultStatus) {
      return res.status(400).json({ error: "No default status configured" });
    }

    const imported: string[] = [];
    const duplicates: { existingId: string; title: string }[] = [];

    for (const item of items) {
      const existing = await prisma.backlogItem.findFirst({
        where: { importId: item.key },
      });

      if (existing) {
        duplicates.push({ existingId: existing.id, title: item.summary });
      } else {
        const created = await prisma.backlogItem.create({
          data: {
            title: item.summary,
            description: item.description,
            importSource: "JIRA",
            importId: item.key,
            statusId: defaultStatus.id,
            // productId is required — Jira imports need a product; use first available if not provided
            productId: await prisma.product.findFirst().then((p) => p?.id ?? ""),
          },
        });
        imported.push(created.id);
      }
    }

    res.json({ imported: imported.length, duplicates });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}

export async function findDuplicates(req: Request, res: Response) {
  try {
    const importedItems = await prisma.backlogItem.findMany({
      where: { importSource: { not: null } },
    });

    const duplicates: {
      id: string;
      primary: unknown;
      secondary: unknown;
      similarity: number;
    }[] = [];
    const seenPairs = new Set<string>();

    for (const item of importedItems) {
      const firstWords = item.title.split(/\s+/).slice(0, 5).join(" ");
      if (!firstWords) continue;

      const match = await prisma.backlogItem.findFirst({
        where: {
          AND: [
            { id: { not: item.id } },
            { title: { contains: firstWords, mode: "insensitive" } },
          ],
        },
      });

      if (match) {
        const pairKey = [item.id, match.id].sort().join("|");
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          duplicates.push({
            id: crypto.randomUUID(),
            primary: match,
            secondary: item,
            similarity: 0.8,
          });
        }
      }
    }

    res.json(duplicates);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function resolveDuplicate(req: Request, res: Response) {
  try {
    const { primaryId, secondaryId, action, mergedData } = req.body as {
      primaryId: string;
      secondaryId: string;
      action: "KEEP_BOTH" | "MERGE" | "DISCARD";
      mergedData?: Record<string, unknown>;
    };

    if (action === "DISCARD") {
      await prisma.backlogItem.delete({ where: { id: secondaryId } });
    } else if (action === "MERGE") {
      if (mergedData) {
        await prisma.backlogItem.update({ where: { id: primaryId }, data: mergedData });
      }
      await prisma.backlogItem.delete({ where: { id: secondaryId } });
    }
    // KEEP_BOTH: no-op

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
}
