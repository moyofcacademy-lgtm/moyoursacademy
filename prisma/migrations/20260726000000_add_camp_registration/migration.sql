-- CreateTable
CREATE TABLE "CampRegistration" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "religion" TEXT,
    "nationality" TEXT,
    "state" TEXT,
    "address" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "guardianEmail" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amountKobo" INTEGER,
    "proofUrl" TEXT,
    "proofPublicId" TEXT,
    "proofFormat" TEXT,
    "proofBytes" INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'AWAITING_PROOF',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "consentDeclaration" BOOLEAN NOT NULL DEFAULT false,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampRegistration_reference_key" ON "CampRegistration"("reference");

-- CreateIndex
CREATE INDEX "CampRegistration_createdAt_idx" ON "CampRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "CampRegistration_guardianPhone_idx" ON "CampRegistration"("guardianPhone");

-- CreateIndex
CREATE INDEX "CampRegistration_paymentStatus_idx" ON "CampRegistration"("paymentStatus");

