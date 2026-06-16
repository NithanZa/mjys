-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('CLASSES_5', 'CLASSES_10', 'CLASSES_20', 'UNLIMITED', 'WALK_IN');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'EXHAUSTED');

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "photoUrl" TEXT,
    "initials" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "intensity" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClassTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassOccurrence" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClassOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "quoteText" TEXT NOT NULL,
    "quoteAuthor" TEXT,
    "poseName" TEXT NOT NULL,
    "poseDescription" TEXT NOT NULL,
    "poseImageUrl" TEXT,
    "bannerImageUrl" TEXT,
    "bannerHref" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "priceTHB" INTEGER NOT NULL,
    "classCount" INTEGER,
    "validityDays" INTEGER NOT NULL,
    "tagline" TEXT NOT NULL,
    "perks" TEXT[],
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PackageOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingPurchase" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "packageOfferId" TEXT NOT NULL,
    "proofImageUrl" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PendingPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "packageOfferId" TEXT NOT NULL,
    "classesRemaining" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToyPart" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ToyPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberToyPart" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "toyPartId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberToyPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requirement" JSONB NOT NULL,
    "rewardOfferId" TEXT,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberMilestone" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "MemberMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_slug_key" ON "Instructor"("slug");

-- CreateIndex
CREATE INDEX "ClassOccurrence_templateId_idx" ON "ClassOccurrence"("templateId");

-- CreateIndex
CREATE INDEX "ClassOccurrence_instructorId_idx" ON "ClassOccurrence"("instructorId");

-- CreateIndex
CREATE INDEX "ClassOccurrence_startsAt_idx" ON "ClassOccurrence"("startsAt");

-- CreateIndex
CREATE INDEX "PendingPurchase_memberId_idx" ON "PendingPurchase"("memberId");

-- CreateIndex
CREATE INDEX "PendingPurchase_packageOfferId_idx" ON "PendingPurchase"("packageOfferId");

-- CreateIndex
CREATE INDEX "Package_memberId_idx" ON "Package"("memberId");

-- CreateIndex
CREATE INDEX "Package_packageOfferId_idx" ON "Package"("packageOfferId");

-- CreateIndex
CREATE UNIQUE INDEX "ToyPart_code_key" ON "ToyPart"("code");

-- CreateIndex
CREATE INDEX "MemberToyPart_memberId_idx" ON "MemberToyPart"("memberId");

-- CreateIndex
CREATE INDEX "MemberToyPart_toyPartId_idx" ON "MemberToyPart"("toyPartId");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_code_key" ON "Milestone"("code");

-- CreateIndex
CREATE INDEX "MemberMilestone_memberId_idx" ON "MemberMilestone"("memberId");

-- CreateIndex
CREATE INDEX "MemberMilestone_milestoneId_idx" ON "MemberMilestone"("milestoneId");

-- AddForeignKey
ALTER TABLE "ClassOccurrence" ADD CONSTRAINT "ClassOccurrence_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassOccurrence" ADD CONSTRAINT "ClassOccurrence_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classOccurrenceId_fkey" FOREIGN KEY ("classOccurrenceId") REFERENCES "ClassOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPurchase" ADD CONSTRAINT "PendingPurchase_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPurchase" ADD CONSTRAINT "PendingPurchase_packageOfferId_fkey" FOREIGN KEY ("packageOfferId") REFERENCES "PackageOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_packageOfferId_fkey" FOREIGN KEY ("packageOfferId") REFERENCES "PackageOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberToyPart" ADD CONSTRAINT "MemberToyPart_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberToyPart" ADD CONSTRAINT "MemberToyPart_toyPartId_fkey" FOREIGN KEY ("toyPartId") REFERENCES "ToyPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMilestone" ADD CONSTRAINT "MemberMilestone_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMilestone" ADD CONSTRAINT "MemberMilestone_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
