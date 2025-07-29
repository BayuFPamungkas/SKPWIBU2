/*
  Warnings:

  - Added the required column `acara` to the `HasilRanking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal` to the `HasilRanking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `hasilranking` ADD COLUMN `acara` VARCHAR(191) NOT NULL,
    ADD COLUMN `tanggal` DATETIME(3) NOT NULL;
