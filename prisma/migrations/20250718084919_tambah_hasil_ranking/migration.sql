-- CreateTable
CREATE TABLE `HasilRanking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pesertaId` INTEGER NOT NULL,
    `totalSkor` DOUBLE NOT NULL,
    `ranking` INTEGER NOT NULL,

    UNIQUE INDEX `HasilRanking_pesertaId_key`(`pesertaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HasilRanking` ADD CONSTRAINT `HasilRanking_pesertaId_fkey` FOREIGN KEY (`pesertaId`) REFERENCES `Peserta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
