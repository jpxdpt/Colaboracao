import UserManagement from '../components/UserManagement';

const UsersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Utilizadores</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerir utilizadores, permissões e funções
        </p>
      </div>
      <UserManagement />
    </div>
  );
};

export default UsersPage;

