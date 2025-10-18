import { query } from '../../../../lib/database';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function getUser(req, res, id) {
  try {
    // Nunca seleccionamos la contraseña para enviarla al frontend
    const user = await query('SELECT id, email, first_name, last_name, role, phone FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    console.error(`API Error fetching user ${id}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener el usuario.' });
  }
}

async function updateUser(req, res, id) {
  const { first_name, last_name, email, role, password } = req.body;
  
  try {
    const updateFields = {
      first_name,
      last_name,
      email,
      role,
      name: `${first_name || ''} ${last_name || ''}`.trim()
    };
    
    // Si se proporciona una nueva contraseña, la hasheamos y la añadimos
    if (password) {
      updateFields.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await query('UPDATE users SET ? WHERE id = ?', [updateFields, id]);

    res.status(200).json({ success: true, message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error(`API Error updating user ${id}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'El correo electrónico ya está en uso.' });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar el usuario.' });
  }
}

async function deleteUser(req, res, id) {
  try {
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error(`API Error deleting user ${id}:`, error);
    res.status(500).json({ success: false, message: 'Error al eliminar el usuario.' });
  }
}


export default async function handler(req, res) {
  const { id } = req.query;

  // Aquí iría tu middleware de autenticación de admin
  switch (req.method) {
    case 'GET':
      return await getUser(req, res, id);
    case 'PUT':
      return await updateUser(req, res, id);
    case 'DELETE':
      return await deleteUser(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: `Método ${req.method} no permitido` });
  }
}