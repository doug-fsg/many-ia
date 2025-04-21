const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando criação da tabela WhatsAppConnection...');
    
    const migrationPath = path.join(__dirname, '../prisma/migrations/20241230_add_whatsapp_connections/migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir as instruções SQL e executá-las uma a uma
    const sqlStatements = migrationSql
      .split(';')
      .filter(statement => statement.trim())
      .map(statement => statement.trim() + ';');
    
    for (const sql of sqlStatements) {
      console.log(`Executando: ${sql.substring(0, 100)}...`);
      await prisma.$executeRawUnsafe(sql);
    }
    
    console.log('Tabela WhatsAppConnection criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 