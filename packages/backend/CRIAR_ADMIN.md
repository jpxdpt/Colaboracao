# Como Criar um Usuário Administrador

Existem duas formas de criar ou promover um usuário a administrador:

## Opção 1: Criar Novo Usuário Admin

Cria um novo usuário com role de administrador do zero.

```bash
cd packages/backend
npm run create-admin
```

O script irá:
1. Compilar automaticamente o package `@gamify/shared` (se necessário)
2. Solicitar os seguintes dados:
   - **Email**: Email do administrador
   - **Nome**: Nome completo
   - **Departamento**: Departamento do administrador
   - **Senha**: Senha para login

## Opção 2: Promover Usuário Existente

Promove um usuário existente (que já foi criado via registro normal) a administrador.

```bash
cd packages/backend
npm run promote-admin
```

O script irá:
1. Compilar automaticamente o package `@gamify/shared` (se necessário)
2. Solicitar apenas:
   - **Email**: Email do usuário a promover

## Pré-requisitos

1. Certifique-se de que o arquivo `.env` está configurado com a conexão MongoDB
2. O MongoDB deve estar rodando e acessível
3. As dependências devem estar instaladas (`npm install`)

## Exemplo de Uso

```bash
# Navegar para o diretório backend
cd packages/backend

# Criar novo admin
npm run create-admin

# Ou promover usuário existente
npm run promote-admin
```

## Verificar se Funcionou

Após criar/promover, você pode fazer login normalmente com as credenciais do admin. O campo `role` do usuário será `admin`, o que permite acesso a rotas administrativas.

## Notas de Segurança

- ⚠️ Mantenha as credenciais de admin seguras
- ⚠️ Use senhas fortes para contas administrativas
- ⚠️ Não compartilhe credenciais de admin em produção
- ⚠️ Considere usar variáveis de ambiente para scripts em produção

