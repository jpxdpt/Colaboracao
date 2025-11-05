# Instruções de Utilização

## Como Criar um Administrador

### Método 1: Script Interativo (Mais Fácil)

1. Abra um terminal na pasta `backend`
2. Execute:
   ```bash
   npm run create-admin
   ```
3. Digite:
   - Nome do administrador
   - Email
   - Password

### Método 2: MongoDB Compass

1. Abra o MongoDB Compass
2. Conecte-se à base de dados `team_collaboration`
3. Vá à coleção `users`
4. Clique em "Insert Document"
5. Adicione:
   ```json
   {
     "email": "admin@exemplo.com",
     "password_hash": "GERE_O_HASH_DA_PASSWORD",
     "name": "Administrador",
     "role": "admin",
     "created_at": new Date()
   }
   ```

   **Para gerar o hash da password**, execute no terminal:
   ```bash
   cd backend
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('sua_password_aqui', 10));"
   ```

### Método 3: Atualizar Utilizador Existente

1. Abra o MongoDB Compass
2. Encontre o utilizador na coleção `users`
3. Edite o campo `role` de `"user"` para `"admin"`

---

## Como Criar um Utilizador Normal

1. Abra a aplicação: http://localhost:5173
2. Clique em "Criar Conta" ou "Registar"
3. Preencha:
   - Nome
   - Email
   - Password (mínimo 6 caracteres)
4. Clique em "Criar Conta"

**Nota:** Todos os utilizadores criados através do registo são automaticamente `user` (não admin).

---

## Diferenças entre Admin e User

### 👑 Administrador (Admin)
- ✅ Vê **todas as tarefas** de todos os utilizadores
- ✅ Pode **atribuir tarefas** a qualquer utilizador
- ✅ Pode **editar/eliminar** qualquer tarefa
- ✅ Pode **gerir utilizadores** (editar roles, eliminar)
- ✅ Acesso completo ao sistema

### 👤 Utilizador Normal (User)
- ✅ Vê apenas as tarefas **atribuídas a si**
- ✅ Pode **criar tarefas** para si mesmo
- ✅ Pode **editar o estado** das suas tarefas
- ✅ Pode **adicionar comentários** às suas tarefas
- ❌ Não pode gerir utilizadores
- ❌ Não vê tarefas de outros utilizadores

---

## Resolução de Problemas

### Não consigo criar tarefas

1. **Verifique se está autenticado:**
   - Faça logout e login novamente
   - Verifique se o token está válido

2. **Verifique o console do navegador (F12):**
   - Veja se há erros em vermelho
   - Verifique a aba Network para ver se a requisição falha

3. **Verifique se o backend está a correr:**
   - Acesse: http://localhost:8081/health
   - Deve retornar: `{"status":"ok","database":"connected"}`

### Não consigo ver todas as tarefas

- Se for **admin**, deve ver todas as tarefas
- Se for **user**, só vê as tarefas atribuídas a si
- Verifique o seu role no MongoDB ou faça logout/login

### Erro ao criar administrador

- Certifique-se de que o MongoDB está a correr
- Verifique a conexão na base de dados
- Tente usar o MongoDB Compass para criar manualmente

---

## Estrutura de Base de Dados

### Coleção: `users`
```json
{
  "_id": ObjectId("..."),
  "email": "user@exemplo.com",
  "password_hash": "$2a$10$...",
  "name": "Nome do Utilizador",
  "role": "admin" ou "user",
  "created_at": ISODate("...")
}
```

### Coleção: `tasks`
```json
{
  "_id": ObjectId("..."),
  "title": "Título da Tarefa",
  "description": "Descrição...",
  "assigned_to": ObjectId("..."), // ID do utilizador
  "created_by": ObjectId("..."), // ID do criador
  "status": "pending" | "in_progress" | "completed",
  "priority": "low" | "medium" | "high",
  "deadline": ISODate("..."),
  "start_date": ISODate("..."),
  "tags": ["tag1", "tag2"],
  "parent_task_id": ObjectId("..."), // Para subtarefas
  "created_at": ISODate("..."),
  "updated_at": ISODate("...")
}
```

---

## URLs Importantes

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8081
- **Health Check:** http://localhost:8081/health

---

## Comandos Úteis

```bash
# Criar administrador
cd backend
npm run create-admin

# Iniciar backend
cd backend
npm run dev

# Iniciar frontend
cd frontend
npm run dev

# Verificar MongoDB
mongosh
use team_collaboration
db.users.find()
```

