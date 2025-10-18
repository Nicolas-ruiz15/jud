export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // Limpiar cookie
  res.setHeader('Set-Cookie', [
    'adminToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
  ]);

  res.status(200).json({
    success: true,
    message: 'Logout exitoso'
  });
}