-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nomeAtendenteDigital" TEXT NOT NULL,
    "enviarParaAtendente" BOOLEAN NOT NULL DEFAULT true,
    "quemEhAtendente" TEXT NOT NULL,
    "oQueAtendenteFaz" TEXT NOT NULL,
    "objetivoAtendente" TEXT NOT NULL,
    "comoAtendenteDeve" TEXT NOT NULL,
    "horarioAtendimento" TEXT NOT NULL,
    "tempoRetornoAtendimento" TEXT,
    "condicoesAtendimento" TEXT,
    "informacoesEmpresa" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");
