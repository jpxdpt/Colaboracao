# Como Criar um Administrador

Existem 3 formas de criar um administrador:

## Método 1: Script Interativo (Recomendado)

Execute o seguinte comando no terminal:

```bash
cd backend
npm run create-admin
```

O script irá pedir:
- Nome do administrador
- Email
- Password

## Método 2: Diretamente no MongoDB

1. Abra o MongoDB Compass ou mongo shell
2. Conecte-se à base de dados `team_collaboration`
3. Execute:

```javascript
db.users.insertOne({
  email: "admin@exemplo.com",
  password_hash: "$2a$10$...", // Hash bcrypt da password
  name: "Administrador",
  role: "admin",
  created_at: new Date()
})
```

**Nota:** Para gerar o hash da password, use este código Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('sua_password', 10);
console.log(hash);
```

## Método 3: Atualizar Utilizador Existente

Se já tem um utilizador criado, pode atualizar o role para admin:

```javascript
db.users.updateOne(
  { email: "seu@email.com" },
  { $set: { role: "admin" } }
)
```

## Verificar se é Admin

Após criar ou atualizar, faça login na aplicação. Se for admin, verá:
- Painel Administrativo completo
- Gestão de Utilizadores
- Pode criar/editar/eliminar qualquer tarefa
- Acesso a todas as funcionalidades

## Diferenças entre Admin e User

### Admin:
- ✅ Vê todas as tarefas (de todos os utilizadores)
- ✅ Pode atribuir tarefas a qualquer utilizador
- ✅ Pode editar/eliminar qualquer tarefa
- ✅ Pode gerir utilizadores (criar, editar roles, eliminar)
- ✅ Acesso completo ao sistema

### User Normal:
- ✅ Vê apenas as tarefas atribuídas a si
- ✅ Pode criar tarefas (apenas para si)
- ✅ Pode editar o estado das suas tarefas
- ✅ Pode adicionar comentários às suas tarefas
- ❌ Não pode gerir utilizadores
- ❌ Não vê tarefas de outros utilizadores

