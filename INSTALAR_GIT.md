# Como Instalar Git no Windows

## Método 1: Instalação Manual (Recomendado)

1. **Baixar Git:**
   - Acesse: https://git-scm.com/download/win
   - O download iniciará automaticamente

2. **Instalar:**
   - Execute o instalador baixado
   - Clique em "Next" nas opções padrão
   - **Importante:** Marque "Git from the command line and also from 3rd-party software"
   - Continue com "Next" até "Install"
   - Aguarde a instalação

3. **Verificar Instalação:**
   - Abra um novo PowerShell ou CMD
   - Execute: `git --version`
   - Deve mostrar algo como: `git version 2.x.x`

## Método 2: Usando winget (Windows 10/11)

Se tiver winget instalado, execute:

```powershell
winget install --id Git.Git -e --source winget
```

## Método 3: Usando Chocolatey

Se tiver Chocolatey instalado:

```powershell
choco install git
```

## Após Instalar

1. **Configure o Git (substitua com seus dados):**
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

2. **Reinicie o terminal** para que as mudanças tenham efeito

3. **Verifique se funciona:**
   ```bash
   git --version
   ```

## Próximo Passo

Após instalar o Git, volte e peça para enviar o código para o GitHub!

