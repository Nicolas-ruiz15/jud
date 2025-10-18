// /pages/admin/users/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';

const UserEditPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [user, setUser] = useState({ first_name: '', last_name: '', email: '', role: 'customer' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id && !isNew) {
      fetch(`/api/admin/users/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.data);
          }
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    if (password && password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      setUpdating(false);
      return;
    }

    const payload = { ...user };
    if (password) {
      payload.password = password;
    }
    
    const url = isNew ? '/api/admin/users' : `/api/admin/users/${id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Usuario ${isNew ? 'creado' : 'actualizado'} exitosamente.`);
        router.push('/admin/users');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Ocurrió un error en el servidor.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AdminLayout title="Cargando..."><div>Cargando...</div></AdminLayout>;

  return (
    <AdminLayout title={isNew ? 'Crear Usuario' : 'Editar Usuario'}>
      <h1 className="text-2xl font-bold mb-6">{isNew ? 'Crear Nuevo Usuario' : `Editando a ${user.first_name}`}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-soft space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1">Nombre</label>
            <input type="text" name="first_name" value={user.first_name || ''} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block mb-1">Apellido</label>
            <input type="text" name="last_name" value={user.last_name || ''} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>
        
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" name="email" value={user.email || ''} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>

        <div>
          <label className="block mb-1">Rol</label>
          <select name="role" value={user.role || 'customer'} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="customer">Cliente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">{isNew ? 'Establecer Contraseña' : 'Cambiar Contraseña'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1">Nueva Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" required={isNew} />
            </div>
            <div>
              <label className="block mb-1">Confirmar Contraseña</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded" required={isNew} />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => router.push('/admin/users')} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
            Cancelar
          </button>
          <button type="submit" disabled={updating} className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50">
            {updating ? 'Guardando...' : (isNew ? 'Crear Usuario' : 'Actualizar Usuario')}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default UserEditPage;