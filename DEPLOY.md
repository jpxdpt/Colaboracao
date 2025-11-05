# Como Enviar para o GitHub

## Passo 1: Instalar Git

Se o Git não estiver instalado:

1. Baixe em: https://git-scm.com/download/win
2. Instale com as opções padrão
3. Reinicie o terminal

## Passo 2: Verificar Instalação

```bash
git --version
```

## Passo 3: Configurar Git (apenas na primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

## Passo 4: Enviar para o Repositório

```bash
# Navegar para a pasta do projeto
cd C:\Users\zeped\Documents\PAP2

# Inicializar repositório (se ainda não estiver)
git init

# Adicionar remote
git remote add origin https://github.com/jpxdpt/Colaboracao.git

# Verificar se já existe conteúdo no repositório
git pull origin main --allow-unrelated-histories

# Adicionar todos os ficheiros
git add .

# Fazer commit
git commit -m "Initial commit: Sistema de Colaboração em Equipa completo"

# Enviar para o GitHub
git push -u origin main
```

## Se der erro de branch

Se o repositório usar `master` em vez de `main`:

```bash
git branch -M main
git push -u origin main
```

## Se o repositório já tiver conteúdo

Se o repositório já tiver ficheiros:

```bash
git pull origin main --allow-unrelated-histories
# Resolva conflitos se houver
git add .
git commit -m "Merge com repositório remoto"
git push -u origin main
```

## Comandos Úteis

```bash
# Ver status
git status

# Ver histórico
git log

# Ver branches
git branch

# Desfazer últimas alterações locais (CUIDADO!)
git reset --hard HEAD
```

## Notas Importantes

⚠️ **NÃO commite ficheiros sensíveis:**
- `.env` (já está no .gitignore)
- `node_modules/` (já está no .gitignore)
- Credenciais de base de dados

✅ **Ficheiros que DEVEM ser commitados:**
- Código fonte
- `package.json`
- `README.md`
- `.gitignore`
- Documentação

