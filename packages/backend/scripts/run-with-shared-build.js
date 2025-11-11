#!/usr/bin/env node
/**
 * Script auxiliar para garantir que @taskify/shared está compilado antes de executar outro script
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scriptToRun = process.argv[2];

if (!scriptToRun) {
  console.error('❌ Erro: Especifique o script a executar');
  process.exit(1);
}

try {
  // Compilar shared primeiro
  console.log('📦 Compilando @taskify/shared...');
  execSync('npm run build', {
    cwd: join(__dirname, '../../shared'),
    stdio: 'inherit',
  });

  // Executar script solicitado
  console.log(`\n🚀 Executando: ${scriptToRun}\n`);
  execSync(`tsx ${scriptToRun}`, {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

