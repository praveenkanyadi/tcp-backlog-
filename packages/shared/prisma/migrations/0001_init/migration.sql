-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PM', 'ENGINEERING', 'CS', 'SALES', 'IMPLEMENTATION', 'STAKEHOLDER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAKEHOLDER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BacklogStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BacklogSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicInitiative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StrategicInitiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetRelease" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TargetRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "productAreaId" TEXT,
    "statusId" TEXT NOT NULL,
    "sourceId" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT,
    "publishedToStakeholders" BOOLEAN NOT NULL DEFAULT false,
    "customersImpacted" INTEGER,
    "arrRepresented" DECIMAL(15,2),
    "opportunitiesBlocked" INTEGER,
    "churnRisk" TEXT,
    "customerSegment" TEXT,
    "vertical" TEXT,
    "customerQuotes" JSONB,
    "supportingEvidence" TEXT,
    "revenueOpportunity" DECIMAL(15,2),
    "isComplianceReq" BOOLEAN NOT NULL DEFAULT false,
    "isCompetitiveGap" BOOLEAN NOT NULL DEFAULT false,
    "strategicNotes" TEXT,
    "problemStatement" TEXT,
    "discoveryStatus" TEXT,
    "successMetrics" TEXT,
    "productNotes" TEXT,
    "estimatedEffort" TEXT,
    "complexity" TEXT,
    "technicalDeps" TEXT,
    "risks" TEXT,
    "confidenceLevel" TEXT,
    "engReviewedAt" TIMESTAMP(3),
    "engReviewedById" TEXT,
    "priorityScore" INTEGER,
    "businessPriority" INTEGER,
    "targetReleaseId" TEXT,
    "roadmapQuarter" TEXT,
    "rankPublishedAt" TIMESTAMP(3),
    "jiraIssueKey" TEXT,
    "jiraUrl" TEXT,
    "importSource" TEXT,
    "importId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogItemInitiative" (
    "itemId" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    CONSTRAINT "BacklogItemInitiative_pkey" PRIMARY KEY ("itemId","initiativeId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upvote" (
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upvote_pkey" PRIMARY KEY ("itemId","userId")
);

-- CreateTable
CREATE TABLE "BacklogActivity" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "changeType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BacklogActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogConfig" (
    "key" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BacklogConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "BacklogItem_productId_idx" ON "BacklogItem"("productId");
CREATE INDEX "BacklogItem_statusId_idx" ON "BacklogItem"("statusId");
CREATE INDEX "BacklogItem_roadmapQuarter_idx" ON "BacklogItem"("roadmapQuarter");
CREATE INDEX "BacklogItem_publishedToStakeholders_idx" ON "BacklogItem"("publishedToStakeholders");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductArea" ADD CONSTRAINT "ProductArea_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_productAreaId_fkey" FOREIGN KEY ("productAreaId") REFERENCES "ProductArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "BacklogStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "BacklogSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_targetReleaseId_fkey" FOREIGN KEY ("targetReleaseId") REFERENCES "TargetRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_engReviewedById_fkey" FOREIGN KEY ("engReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BacklogItemInitiative" ADD CONSTRAINT "BacklogItemInitiative_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BacklogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BacklogItemInitiative" ADD CONSTRAINT "BacklogItemInitiative_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "StrategicInitiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BacklogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BacklogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BacklogActivity" ADD CONSTRAINT "BacklogActivity_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BacklogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BacklogActivity" ADD CONSTRAINT "BacklogActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
