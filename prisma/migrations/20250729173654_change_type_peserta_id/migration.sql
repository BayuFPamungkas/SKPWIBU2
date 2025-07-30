-- DropForeignKey
ALTER TABLE `hasilranking` DROP FOREIGN KEY `HasilRanking_pesertaId_fkey`;

-- DropIndex
DROP INDEX `HasilRanking_pesertaId_key` ON `hasilranking`;

-- AddForeignKey
ALTER TABLE `SubKriteria` ADD CONSTRAINT `SubKriteria_kriteriaId_fkey` FOREIGN KEY (`kriteriaId`) REFERENCES `Kriteria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
