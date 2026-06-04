-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SEDAN', 'COUPE', 'HATCHBACK', 'WAGON', 'SUV', 'PICKUP', 'CONVERTIBLE', 'VAN');

-- CreateEnum
CREATE TYPE "WheelSize" AS ENUM ('R_15', 'R_16', 'R_17', 'R_18', 'R_19', 'R_20', 'R_21', 'R_22');

-- CreateEnum
CREATE TYPE "WheelWidth" AS ENUM ('W_6_5', 'W_7', 'W_7_5', 'W_8', 'W_8_5', 'W_9', 'W_9_5', 'W_10', 'W_10_5', 'W_11', 'W_11_5', 'W_12');

-- CreateEnum
CREATE TYPE "TireWidth" AS ENUM ('T_175', 'T_185', 'T_195', 'T_205', 'T_215', 'T_225', 'T_235', 'T_245', 'T_255', 'T_265', 'T_275', 'T_285', 'T_295', 'T_305', 'T_315', 'T_325');

-- CreateEnum
CREATE TYPE "TireProfile" AS ENUM ('P_25', 'P_30', 'P_35', 'P_40', 'P_45', 'P_50', 'P_55', 'P_60', 'P_65', 'P_70');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "imageUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarMake" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CarMake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "year" INTEGER,
    "bodyType" "BodyType",
    "wheelSize" "WheelSize" NOT NULL,
    "wheelWidth" "WheelWidth",
    "et" INTEGER,
    "tireWidth" "TireWidth",
    "tireProfile" "TireProfile",

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CarMake_name_key" ON "CarMake"("name");

-- CreateIndex
CREATE INDEX "CarModel_makeId_idx" ON "CarModel"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_makeId_name_key" ON "CarModel"("makeId", "name");

-- CreateIndex
CREATE INDEX "Car_userId_idx" ON "Car"("userId");

-- CreateIndex
CREATE INDEX "Car_modelId_idx" ON "Car"("modelId");

-- CreateIndex
CREATE INDEX "Car_wheelSize_idx" ON "Car"("wheelSize");

-- CreateIndex
CREATE INDEX "Photo_carId_idx" ON "Photo"("carId");

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "CarMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
