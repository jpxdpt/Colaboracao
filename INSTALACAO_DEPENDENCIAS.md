# Instalação de Dependências

## ⚠️ IMPORTANTE

Após adicionar as novas funcionalidades, é necessário instalar as dependências adicionadas.

## Backend

```bash
cd backend
npm install
```

**Dependências adicionadas:**
- `pdfkit` - Geração de PDFs
- `exceljs` - Geração de ficheiros Excel
- `@types/pdfkit` - Tipos TypeScript para pdfkit

## Frontend

```bash
cd frontend
npm install
```

**Dependências adicionadas:**
- `jspdf` - Geração de PDFs no cliente (opcional, para uso futuro)
- `xlsx` - Leitura/escrita de ficheiros Excel (opcional, para uso futuro)

## Verificação

Após instalar, verifique se não há erros:

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Nota

As dependências `jspdf` e `xlsx` no frontend são opcionais e podem ser usadas no futuro para geração de relatórios no cliente. Atualmente, a geração de relatórios é feita no backend.

