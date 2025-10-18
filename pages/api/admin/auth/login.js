import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // ✅ Buscar usuario admin (solo columnas que existen)
    const users = await query(
      'SELECT id, email, password, role, name FROM users WHERE email = ? AND role = "admin"',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // ✅ Remover verificación de status (columna no existe)
    // if (user.status !== 'active') { ... } // Comentado

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // ✅ Remover actualización de last_login (columna no existe)
    // await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Configurar cookie
    res.setHeader('Set-Cookie', [
      `adminToken=${token}; HttpOnly; Path=/; Max-Age=${8 * 60 * 60}; SameSite=Strict`
    ]);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name, // ✅ Usar 'name' directamente
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}