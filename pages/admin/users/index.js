// /pages/admin/users/index.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

const UsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&search=${search}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, searchTerm);
  }, [searchTerm, fetchUsers]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.')) {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) {
          alert('Usuario eliminado');
          fetchUsers(pagination.page, searchTerm); // Recargar la lista
        } else {
          alert('Error al eliminar: ' + data.message);
        }
      } catch (error) {
        alert('Ocurrió un error en el servidor.');
      }
    }
  }

  return (
    <AdminLayout title="Administrar Usuarios">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Link href="/admin/users/new" legacyBehavior>
          <a className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
            + Crear Usuario
          </a>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-soft">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full mb-4 px-3 py-2 border rounded-md"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Registrado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center p-6">Cargando...</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>{user.role}</span></td>
                  <td className="p-3">{new Date(user.date_registered_gmt).toLocaleDateString()}</td>
                  <td className="p-3 flex space-x-2">
                    <button onClick={() => router.push(`/admin/users/${user.id}`)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="flex justify-between items-center mt-4">
          <p>Total: {pagination.total} usuarios</p>
          <div className="flex space-x-2">
            {Array.from({ length: pagination.totalPages || 0 }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => fetchUsers(page, searchTerm)}
                className={`px-3 py-1 rounded ${pagination.page === page ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;