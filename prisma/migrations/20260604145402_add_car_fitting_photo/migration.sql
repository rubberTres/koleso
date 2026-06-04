/*
  Warnings:

  - Added the required column `brand` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WheelSize" AS ENUM ('R_15', 'R_16', 'R_17', 'R_18', 'R_19', 'R_20', 'R_21', 'R_22');

-- CreateEnum
CREATE TYPE "WheelWidth" AS ENUM ('W_6_5', 'W_7', 'W_7_5', 'W_8', 'W_8_5', 'W_9', 'W_9_5', 'W_10', 'W_10_5', 'W_11', 'W_11_5', 'W_12');

-- CreateEnum
CREATE TYPE "TireWidth" AS ENUM ('T_175', 'T_185', 'T_195', 'T_205', 'T_215', 'T_225', 'T_235', 'T_245', 'T_255', 'T_265', 'T_275', 'T_285', 'T_295', 'T_305', 'T_315', 'T_325');

-- CreateEnum
CREATE TYPE "TireProfile" AS ENUM ('P_25', 'P_30', 'P_35', 'P_40', 'P_45', 'P_50', 'P_55', 'P_60', 'P_65', 'P_70');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER;

-- CreateTable
CREATE TABLE "CarFitting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "carId" TEXT NOT NULL,
    "wheelSize" "WheelSize" NOT NULL,
    "wheelWidth" "WheelWidth",
    "et" INTEGER,
    "tireWidth" "TireWidth",
    "tireProfile" "TireProfile",

    CONSTRAINT "CarFitting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "carId" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarFitting_carId_idx" ON "CarFitting"("carId");

-- CreateIndex
CREATE INDEX "Photo_carId_idx" ON "Photo"("carId");

-- AddForeignKey
ALTER TABLE "CarFitting" ADD CONSTRAINT "CarFitting_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
