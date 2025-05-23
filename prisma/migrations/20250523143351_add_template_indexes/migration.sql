-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- CreateIndex
CREATE INDEX "Template_isPublic_idx" ON "Template"("isPublic");

-- CreateIndex
CREATE INDEX "TemplateAccess_userId_idx" ON "TemplateAccess"("userId");

-- CreateIndex
CREATE INDEX "TemplateAccess_templateId_idx" ON "TemplateAccess"("templateId");
