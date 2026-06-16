-- CreateEnum
CREATE TYPE "Level" AS ENUM ('CAT', 'TIGER', 'LEOPARD');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('BOOKED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "classesAttended" INTEGER NOT NULL DEFAULT 0,
    "level" "Level" NOT NULL DEFAULT 'CAT',
    "celebratedLevels" "Level"[] DEFAULT ARRAY[]::"Level"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "classOccurrenceId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'BOOKED',
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_lineUserId_key" ON "Member"("lineUserId");

-- CreateIndex
CREATE INDEX "Member_lineUserId_idx" ON "Member"("lineUserId");

-- CreateIndex
CREATE INDEX "Attendance_memberId_idx" ON "Attendance"("memberId");

-- CreateIndex
CREATE INDEX "Attendance_classOccurrenceId_idx" ON "Attendance"("classOccurrenceId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
