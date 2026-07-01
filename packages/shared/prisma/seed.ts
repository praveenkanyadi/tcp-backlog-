import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: "sarah.mitchell@tcpsoftware.com" }, update: {}, create: { id: "pm-1", email: "sarah.mitchell@tcpsoftware.com", name: "Sarah Mitchell", role: UserRole.PM } }),
    prisma.user.upsert({ where: { email: "alex.kim@tcpsoftware.com" }, update: {}, create: { id: "pm-2", email: "alex.kim@tcpsoftware.com", name: "Alex Kim", role: UserRole.PM } }),
    prisma.user.upsert({ where: { email: "ryan.chen@tcpsoftware.com" }, update: {}, create: { id: "eng-1", email: "ryan.chen@tcpsoftware.com", name: "Ryan Chen", role: UserRole.ENGINEERING } }),
    prisma.user.upsert({ where: { email: "dana.wu@tcpsoftware.com" }, update: {}, create: { id: "exec-1", email: "dana.wu@tcpsoftware.com", name: "Dana Wu", role: UserRole.ADMIN } }),
    prisma.user.upsert({ where: { email: "jessica.torres@tcpsoftware.com" }, update: {}, create: { id: "cs-1", email: "jessica.torres@tcpsoftware.com", name: "Jessica Torres", role: UserRole.CS } }),
    prisma.user.upsert({ where: { email: "mark.johnson@tcpsoftware.com" }, update: {}, create: { id: "sales-1", email: "mark.johnson@tcpsoftware.com", name: "Mark Johnson", role: UserRole.SALES } }),
    prisma.user.upsert({ where: { email: "priya.patel@tcpsoftware.com" }, update: {}, create: { id: "impl-1", email: "priya.patel@tcpsoftware.com", name: "Priya Patel", role: UserRole.IMPLEMENTATION } }),
  ]);

  const portfolio = await prisma.portfolio.upsert({ where: { id: "port-1" }, update: {}, create: { id: "port-1", name: "Workforce Management" } });

  const tcp = await prisma.product.upsert({ where: { id: "prod-tcp" }, update: {}, create: { id: "prod-tcp", name: "TimeClock Plus", portfolioId: portfolio.id, sortOrder: 1 } });
  const hs = await prisma.product.upsert({ where: { id: "prod-hs" }, update: {}, create: { id: "prod-hs", name: "Humanity Scheduling", portfolioId: portfolio.id, sortOrder: 2 } });
  const ht = await prisma.product.upsert({ where: { id: "prod-ht" }, update: {}, create: { id: "prod-ht", name: "Humanity Time", portfolioId: portfolio.id, sortOrder: 3 } });
  const al = await prisma.product.upsert({ where: { id: "prod-al" }, update: {}, create: { id: "prod-al", name: "Aladtec", portfolioId: portfolio.id, sortOrder: 4 } });

  await prisma.productArea.upsert({ where: { id: "area-tcp-1" }, update: {}, create: { id: "area-tcp-1", name: "Scheduling", productId: tcp.id, sortOrder: 1 } });
  await prisma.productArea.upsert({ where: { id: "area-tcp-2" }, update: {}, create: { id: "area-tcp-2", name: "Time & Attendance", productId: tcp.id, sortOrder: 2 } });
  await prisma.productArea.upsert({ where: { id: "area-tcp-3" }, update: {}, create: { id: "area-tcp-3", name: "Payroll Integration", productId: tcp.id, sortOrder: 3 } });
  await prisma.productArea.upsert({ where: { id: "area-hs-1" }, update: {}, create: { id: "area-hs-1", name: "Shift Management", productId: hs.id, sortOrder: 1 } });
  await prisma.productArea.upsert({ where: { id: "area-hs-2" }, update: {}, create: { id: "area-hs-2", name: "Demand Forecasting", productId: hs.id, sortOrder: 2 } });
  await prisma.productArea.upsert({ where: { id: "area-al-1" }, update: {}, create: { id: "area-al-1", name: "Scheduling", productId: al.id, sortOrder: 1 } });

  const statusIdea = await prisma.backlogStatus.upsert({ where: { id: "status-1" }, update: {}, create: { id: "status-1", name: "Idea", color: "#94a3b8", isDefault: true, sortOrder: 1 } });
  const statusReview = await prisma.backlogStatus.upsert({ where: { id: "status-2" }, update: {}, create: { id: "status-2", name: "Under Review", color: "#f59e0b", sortOrder: 2 } });
  const statusApproved = await prisma.backlogStatus.upsert({ where: { id: "status-3" }, update: {}, create: { id: "status-3", name: "Approved", color: "#3b82f6", sortOrder: 3 } });
  const statusRoadmap = await prisma.backlogStatus.upsert({ where: { id: "status-4" }, update: {}, create: { id: "status-4", name: "On Roadmap", color: "#8b5cf6", sortOrder: 4 } });
  await prisma.backlogStatus.upsert({ where: { id: "status-5" }, update: {}, create: { id: "status-5", name: "In Progress", color: "#06b6d4", sortOrder: 5 } });
  await prisma.backlogStatus.upsert({ where: { id: "status-6" }, update: {}, create: { id: "status-6", name: "Delivered", color: "#22c55e", sortOrder: 6 } });
  await prisma.backlogStatus.upsert({ where: { id: "status-7" }, update: {}, create: { id: "status-7", name: "Declined", color: "#ef4444", sortOrder: 7 } });

  const srcCS = await prisma.backlogSource.upsert({ where: { id: "src-1" }, update: {}, create: { id: "src-1", name: "Customer Success", sortOrder: 1 } });
  const srcSales = await prisma.backlogSource.upsert({ where: { id: "src-2" }, update: {}, create: { id: "src-2", name: "Sales", sortOrder: 2 } });
  await prisma.backlogSource.upsert({ where: { id: "src-3" }, update: {}, create: { id: "src-3", name: "Product Discovery", sortOrder: 3 } });
  await prisma.backlogSource.upsert({ where: { id: "src-4" }, update: {}, create: { id: "src-4", name: "Engineering", sortOrder: 4 } });
  await prisma.backlogSource.upsert({ where: { id: "src-5" }, update: {}, create: { id: "src-5", name: "Executive", sortOrder: 5 } });
  await prisma.backlogSource.upsert({ where: { id: "src-6" }, update: {}, create: { id: "src-6", name: "Compliance", sortOrder: 6 } });

  await prisma.strategicInitiative.upsert({ where: { id: "init-1" }, update: {}, create: { id: "init-1", name: "Retention", color: "#ef4444", sortOrder: 1 } });
  await prisma.strategicInitiative.upsert({ where: { id: "init-2" }, update: {}, create: { id: "init-2", name: "Growth", color: "#22c55e", sortOrder: 2 } });
  await prisma.strategicInitiative.upsert({ where: { id: "init-3" }, update: {}, create: { id: "init-3", name: "Platform Modernization", color: "#3b82f6", sortOrder: 3 } });
  await prisma.strategicInitiative.upsert({ where: { id: "init-4" }, update: {}, create: { id: "init-4", name: "Compliance", color: "#f59e0b", sortOrder: 4 } });
  await prisma.strategicInitiative.upsert({ where: { id: "init-5" }, update: {}, create: { id: "init-5", name: "AI & Automation", color: "#8b5cf6", sortOrder: 5 } });

  await prisma.targetRelease.upsert({ where: { id: "rel-1" }, update: {}, create: { id: "rel-1", name: "Q3 2026", sortOrder: 1 } });
  await prisma.targetRelease.upsert({ where: { id: "rel-2" }, update: {}, create: { id: "rel-2", name: "Q4 2026", sortOrder: 2 } });
  await prisma.targetRelease.upsert({ where: { id: "rel-3" }, update: {}, create: { id: "rel-3", name: "Q1 2027", sortOrder: 3 } });
  await prisma.targetRelease.upsert({ where: { id: "rel-4" }, update: {}, create: { id: "rel-4", name: "Q2 2027", sortOrder: 4 } });

  await prisma.backlogConfig.upsert({ where: { key: "discovery_statuses" }, update: {}, create: { key: "discovery_statuses", values: ["Not Started", "Problem Defined", "User Research", "Prototyping", "Validated", "Ready for Build"] } });
  await prisma.backlogConfig.upsert({ where: { key: "roadmap_quarters" }, update: {}, create: { key: "roadmap_quarters", values: ["Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"] } });

  const item1 = await prisma.backlogItem.upsert({
    where: { id: "item-1" },
    update: {},
    create: {
      id: "item-1",
      title: "Automated overtime alerts for managers",
      description: "Managers need real-time alerts when employees approach overtime thresholds to proactively manage labor costs.",
      productId: tcp.id,
      productAreaId: "area-tcp-2",
      statusId: statusRoadmap.id,
      sourceId: srcCS.id,
      ownerId: "pm-1",
      createdById: "pm-1",
      publishedToStakeholders: true,
      customersImpacted: 47,
      arrRepresented: 1250000,
      churnRisk: "high",
      priorityScore: 87,
      businessPriority: 1,
      roadmapQuarter: "Q3 2026",
      targetReleaseId: "rel-1",
    },
  });

  const item2 = await prisma.backlogItem.upsert({
    where: { id: "item-2" },
    update: {},
    create: {
      id: "item-2",
      title: "AI-powered demand forecasting for scheduling",
      description: "Use historical data and ML to predict staffing needs and auto-generate optimal schedules.",
      productId: hs.id,
      productAreaId: "area-hs-2",
      statusId: statusApproved.id,
      sourceId: srcSales.id,
      ownerId: "pm-2",
      createdById: "pm-2",
      publishedToStakeholders: true,
      customersImpacted: 23,
      arrRepresented: 890000,
      churnRisk: "medium",
      priorityScore: 79,
      businessPriority: 2,
      roadmapQuarter: "Q4 2026",
      targetReleaseId: "rel-2",
    },
  });

  await prisma.backlogItem.upsert({
    where: { id: "item-3" },
    update: {},
    create: {
      id: "item-3",
      title: "Bulk shift swap approval workflow",
      description: "Allow managers to approve multiple shift swap requests in a single action.",
      productId: hs.id,
      productAreaId: "area-hs-1",
      statusId: statusReview.id,
      sourceId: srcCS.id,
      ownerId: "pm-2",
      createdById: "cs-1",
      publishedToStakeholders: false,
      customersImpacted: 31,
      arrRepresented: 450000,
      churnRisk: "low",
      priorityScore: 62,
      businessPriority: 3,
    },
  });

  await prisma.upvote.createMany({
    data: [
      { itemId: "item-1", userId: "cs-1" },
      { itemId: "item-1", userId: "sales-1" },
      { itemId: "item-2", userId: "cs-1" },
      { itemId: "item-2", userId: "impl-1" },
    ],
    skipDuplicates: true,
  });

  await prisma.comment.upsert({
    where: { id: "comment-1" },
    update: {},
    create: {
      id: "comment-1",
      itemId: "item-1",
      authorId: "cs-1",
      authorName: "Jessica Torres",
      body: "This is critical for our healthcare customers. We lost two accounts last quarter because of this gap.",
    },
  });

  await prisma.comment.upsert({
    where: { id: "comment-2" },
    update: {},
    create: {
      id: "comment-2",
      itemId: "item-1",
      authorId: "pm-1",
      authorName: "Sarah Mitchell",
      parentId: "comment-1",
      body: "Noted — this is already prioritized for Q3. Thanks for the context Jessica.",
    },
  });

  console.log("✅ Seed complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());
