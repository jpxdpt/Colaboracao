# Configuração do MongoDB

## Opção 1: MongoDB Atlas (Cloud - Recomendado) ⭐

1. **Criar conta gratuita:**
   - Aceda a: https://www.mongodb.com/cloud/atlas
   - Clique em "Try Free"
   - Crie uma conta gratuita

2. **Criar cluster:**
   - Selecione "Build a Database"
   - Escolha o plano gratuito (M0 Sandbox)
   - Selecione uma região próxima
   - Dê um nome ao cluster (ex: "TeamCollaboration")
   - Clique em "Create"

3. **Configurar acesso:**
   - Crie um utilizador de base de dados:
     - Username: `admin` (ou outro)
     - Password: (crie uma password segura)
   - Configure Network Access:
     - Adicione IP: `0.0.0.0/0` (permite acesso de qualquer lugar)
     - Ou adicione o seu IP específico

4. **Obter connection string:**
   - Clique em "Connect" no cluster
   - Selecione "Connect your application"
   - Copie a connection string (parece com: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Substitua `<password>` pela password que criou
   - Adicione o nome da base de dados: `mongodb+srv://username:password@cluster.mongodb.net/team_collaboration`

5. **Atualizar .env:**
   - Abra `backend/.env`
   - Substitua `MONGODB_URI` pela connection string do Atlas:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/team_collaboration
   ```

## Opção 2: MongoDB Local

### Instalação no Windows:

1. **Descarregar:**
   - Aceda a: https://www.mongodb.com/try/download/community
   - Selecione Windows
   - Descarregue o instalador MSI

2. **Instalar:**
   - Execute o instalador
   - Escolha "Complete" installation
   - Selecione "Install MongoDB as a Service"
   - O serviço será iniciado automaticamente

3. **Verificar:**
   - Abra o Services (Win+R → `services.msc`)
   - Procure por "MongoDB" e verifique se está "Running"

4. **Configurar .env:**
   - O `.env` já está configurado para local:
   ```
   MONGODB_URI=mongodb://localhost:27017/team_collaboration
   ```

## Testar Conexão

Depois de configurar, execute:

```bash
cd backend
npm run migrate
```

Se tudo estiver correto, verá:
```
✅ Conexão estabelecida. MongoDB não requer migrações SQL.
✅ Os modelos serão criados automaticamente na primeira inserção.
✅ Base de dados pronta para uso!
```

## Iniciar Servidor

```bash
cd backend
npm run dev
```

O servidor deve iniciar e conectar ao MongoDB automaticamente!

