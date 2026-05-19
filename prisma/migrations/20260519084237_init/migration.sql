-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "embeddingJson" TEXT DEFAULT '[]';

-- CreateTable
CREATE TABLE "WatchEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchEvent_userId_idx" ON "WatchEvent"("userId");

-- CreateIndex
CREATE INDEX "WatchEvent_postId_idx" ON "WatchEvent"("postId");

-- AddForeignKey
ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
