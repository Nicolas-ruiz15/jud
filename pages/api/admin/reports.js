// /pages/api/admin/reports.js
import { query } from '../../../lib/database';
// import { adminAuth } from '../../../middleware/adminAuth';

export default async function handler(req, res) {
  // await adminAuth(req, res); // Descomenta para proteger la ruta

  try {
    // Validar y establecer el rango de fechas. Por defecto, los últimos 30 días.
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(endDate.getDate() - 30));
    
    // Formatear fechas para SQL (YYYY-MM-DD HH:MM:SS)
    const sqlStartDate = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const sqlEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');

    const params = [sqlStartDate, sqlEndDate];

    // Ejecutar todas las consultas en paralelo para máxima eficiencia
    const [
      kpiResults,
      salesOverTimeResults,
      topProductsResults,
      topCustomersResults,
      newCustomersResult
    ] = await Promise.all([
      // 1. KPIs principales
      query(`
        SELECT
          SUM(total_amount) as totalRevenue,
          COUNT(id) as totalOrders,
          AVG(total_amount) as averageOrderValue
        FROM orders
        WHERE date_created BETWEEN ? AND ? AND status NOT IN ('cancelled', 'failed')
      `, params),
      
      // 2. Ventas a lo largo del tiempo (para el gráfico)
      query(`
        SELECT 
          DATE(date_created) as date, 
          SUM(total_amount) as total
        FROM orders
        WHERE date_created BETWEEN ? AND ? AND status NOT IN ('cancelled', 'failed')
        GROUP BY DATE(date_created)
        ORDER BY date ASC
      `, params),

      // 3. Productos más vendidos
      query(`
        SELECT
          p.id,
          p.name,
          p.sku,
          SUM(oi.quantity) as totalQuantity,
          SUM(oi.total) as totalRevenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.date_created BETWEEN ? AND ? AND o.status NOT IN ('cancelled', 'failed')
        GROUP BY p.id, p.name, p.sku
        ORDER BY totalRevenue DESC
        LIMIT 5
      `, params),

      // 4. Clientes con mayor gasto
      query(`
        SELECT
          u.id,
          u.name,
          u.email,
          COUNT(o.id) as totalOrders,
          SUM(o.total_amount) as totalSpent
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.date_created BETWEEN ? AND ? AND o.status NOT IN ('cancelled', 'failed')
        GROUP BY u.id, u.name, u.email
        ORDER BY totalSpent DESC
        LIMIT 5
      `, params),

      // 5. Nuevos clientes registrados
      query(`
        SELECT COUNT(id) as newCustomers FROM users WHERE date_registered_gmt BETWEEN ? AND ?
      `, params)
    ]);
    
    // Formatear la respuesta final
    const report = {
      kpis: {
        totalRevenue: kpiResults[0].totalRevenue ?? 0,
        totalOrders: kpiResults[0].totalOrders ?? 0,
        averageOrderValue: kpiResults[0].averageOrderValue ?? 0,
        newCustomers: newCustomersResult[0].newCustomers ?? 0,
      },
      salesOverTime: salesOverTimeResults,
      topProducts: topProductsResults,
      topCustomers: topCustomersResults
    };

    res.status(200).json({ success: true, data: report });

  } catch (error) {
    console.error('API Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Error al generar los reportes.' });
  }
}