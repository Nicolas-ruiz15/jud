// /pages/api/admin/users/index.js
import { query } from '../../../../lib/database';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Factor de coste para el hash de la contraseña

async function getUsers(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE name LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Consulta para obtener los usuarios de la página actual
    const usersQuery = `
      SELECT id, name, email, role, date_registered_gmt 
      FROM users 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const users = await query(usersQuery, [...params, limit, offset]);

    // Consulta para obtener el total de usuarios para la paginación
    const totalQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalResult = await query(totalQuery, params);
    const total = totalResult[0].total;

    res.status(200).json({ 
      success: true, 
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('API Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los usuarios.' });
  }
}

async function createUser(req, res) {
  const { first_name, last_name, email, password, role } = req.body;

  if (!email || !password || !first_name) {
    return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUser = {
      email,
      password: hashedPassword,
      first_name,
      last_name: last_name || '',
      name: `${first_name} ${last_name || ''}`.trim(),
      role: role || 'customer',
    };

    const result = await query(
      'INSERT INTO users SET ?',
      [newUser]
    );

    res.status(201).json({ success: true, message: 'Usuario creado exitosamente.', data: { id: result.insertId } });
  } catch (error) {
    console.error('API Error creating user:', error);
    // Código de error para email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'El correo electrónico ya está en uso.' });
    }
    res.status(500).json({ success: false, message: 'Error al crear el usuario.' });
  }
}


export default async function handler(req, res) {
  // Aquí iría tu middleware de autenticación de admin
  switch (req.method) {
    case 'GET':
      return await getUsers(req, res);
    case 'POST':
      return await createUser(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ success: false, message: `Método ${req.method} no permitido` });
  }
}