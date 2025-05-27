/*
  Warnings:

  - You are about to alter the column `nomor` on the `peserta` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `peserta` MODIFY `nomor` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `SkorPeserta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pesertaId` INTEGER NOT NULL,
    `subKriteriaId` INTEGER NOT NULL,
    `nilai` DOUBLE NOT NULL,

    UNIQUE INDEX `SkorPeserta_pesertaId_subKriteriaId_key`(`pesertaId`, `subKriteriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SkorPeserta` ADD CONSTRAINT `SkorPeserta_pesertaId_fkey` FOREIGN KEY (`pesertaId`) REFERENCES `Peserta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SkorPeserta` ADD CONSTRAINT `SkorPeserta_subKriteriaId_fkey` FOREIGN KEY (`subKriteriaId`) REFERENCES `SubKriteria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
