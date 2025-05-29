# Personalizando Taxas de Comissão para Afiliados

Este documento explica como personalizar as taxas de comissão para afiliados individuais no sistema.

## Visão Geral

Por padrão, todos os afiliados recebem uma comissão de 50% sobre todas as assinaturas que eles indicam. No entanto, o sistema agora suporta a personalização dessa porcentagem para cada afiliado individualmente.

## Como Personalizar a Taxa de Comissão

### Usando o PostgreSQL Diretamente

Para alterar a taxa de comissão de um afiliado específico, execute o seguinte comando SQL no banco de dados:

```sql
-- Alterar a taxa de comissão para um afiliado específico (por ID)
UPDATE "Affiliate"
SET "commissionRate" = 60 -- Substitua por qualquer valor entre 1 e 100
WHERE "id" = 'id_do_afiliado'; -- Substitua pelo ID do afiliado

-- OU por ID do usuário
UPDATE "Affiliate"
SET "commissionRate" = 60 -- Substitua por qualquer valor entre 1 e 100
WHERE "userId" = 'id_do_usuario'; -- Substitua pelo ID do usuário

-- OU por email do usuário (exige um JOIN)
UPDATE "Affiliate"
SET "commissionRate" = 60 -- Substitua por qualquer valor entre 1 e 100
FROM "User"
WHERE "Affiliate"."userId" = "User"."id"
AND "User"."email" = 'email@exemplo.com'; -- Substitua pelo email do usuário
```

### Encontrando o ID do Afiliado

Para encontrar o ID de um afiliado, você pode usar uma das seguintes consultas:

```sql
-- Listar todos os afiliados com suas taxas de comissão
SELECT 
  a.id AS "affiliateId", 
  a."userId",
  a."commissionRate",
  u.email,
  u.name
FROM "Affiliate" a
JOIN "User" u ON a."userId" = u.id
ORDER BY a."commissionRate" DESC;

-- Buscar um afiliado específico por email
SELECT 
  a.id AS "affiliateId", 
  a."userId",
  a."commissionRate",
  u.email,
  u.name
FROM "Affiliate" a
JOIN "User" u ON a."userId" = u.id
WHERE u.email = 'email@exemplo.com'; -- Substitua pelo email do usuário
```

## Notas Importantes

- A taxa de comissão deve ser um número inteiro entre 1 e 100, representando a porcentagem.
- As alterações nas taxas de comissão afetarão apenas os pagamentos futuros. Pagamentos já processados não serão recalculados.
- Recomenda-se fazer backup do banco de dados antes de realizar alterações manuais nas taxas de comissão.
- Se você precisar fazer alterações em massa para muitos afiliados, considere usar um script SQL mais complexo com condições apropriadas.

## Exemplo de Uso

Cenário: Você deseja aumentar a taxa de comissão para 60% para um afiliado de alto desempenho cujo email é "superafiliado@exemplo.com".

```sql
UPDATE "Affiliate"
SET "commissionRate" = 60
FROM "User"
WHERE "Affiliate"."userId" = "User"."id"
AND "User"."email" = 'superafiliado@exemplo.com';
```

Este comando atualizará a taxa de comissão para 60% para o afiliado associado ao email "superafiliado@exemplo.com". 