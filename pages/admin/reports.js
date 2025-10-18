// /pages/admin/reports.js
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { format, subDays, startOfMonth, endOfMonth, startOfToday, endOfToday } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- Componentes de UI Modulares ---

const StatCard = ({ title, value, icon, change, changeType }) => (
  <div className="bg-white p-6 rounded-lg shadow-soft flex items-center space-x-4">
    <div className="bg-primary-100 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const SalesChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => format(new Date(d.date), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.total),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const options = { responsive: true, plugins: { legend: { display: false } } };
  return <Line options={options} data={chartData} />;
};

const TopListTable = ({ title, headers, data, renderRow }) => (
  <div className="bg-white p-6 rounded-lg shadow-soft h-full">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h, i) => <th key={i} className="text-left font-semibold text-gray-600 p-2">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(renderRow)}
        </tbody>
      </table>
    </div>
  </div>
);


// --- Componente Principal de la Página de Reportes ---

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    label: 'Últimos 30 días',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startDateISO = dateRange.startDate.toISOString();
    const endDateISO = dateRange.endDate.toISOString();
    try {
      const res = await fetch(`/api/admin/reports?startDate=${startDateISO}&endDate=${endDateISO}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar los datos.');
      setReportData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);

  const dateRanges = [
    { label: 'Hoy', startDate: startOfToday(), endDate: endOfToday() },
    { label: 'Últimos 7 días', startDate: subDays(new Date(), 7), endDate: new Date() },
    { label: 'Últimos 30 días', startDate: subDays(new Date(), 30), endDate: new Date() },
    { label: 'Este Mes', startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) },
  ];

  if (loading) return <AdminLayout title="Cargando Reportes..."><div className="text-center p-12">Cargando datos...</div></AdminLayout>;
  if (error) return <AdminLayout title="Error"><div className="text-center p-12 text-red-600">Error: {error}</div></AdminLayout>;

  return (
    <AdminLayout title="Reportes y Estadísticas">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Dashboard de Reportes</h1>
        <div className="flex items-center bg-white shadow-soft rounded-lg p-1 space-x-1">
          {dateRanges.map(range => (
            <button
              key={range.label}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm rounded-md ${dateRange.label === range.label ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Ingresos Totales" value={formatCurrency(reportData.kpis.totalRevenue)} icon="💰" />
        <StatCard title="Órdenes" value={reportData.kpis.totalOrders} icon="📦" />
        <StatCard title="Valor Promedio Orden" value={formatCurrency(reportData.kpis.averageOrderValue)} icon="🛒" />
        <StatCard title="Nuevos Clientes" value={reportData.kpis.newCustomers} icon="👥" />
      </div>

      {/* Gráfico de Ventas */}
      <div className="bg-white p-6 rounded-lg shadow-soft mb-6">
        <h3 className="text-lg font-semibold mb-4">Ventas en el Periodo</h3>
        <SalesChart data={reportData.salesOverTime} />
      </div>

      {/* Listas Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopListTable
          title="Productos Más Vendidos"
          headers={['Producto', 'SKU', 'Vendidos', 'Ingresos']}
          data={reportData.topProducts}
          renderRow={(item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2 font-medium">{item.name}</td>
              <td className="p-2 text-gray-500">{item.sku}</td>
              <td className="p-2 text-center">{item.totalQuantity}</td>
              <td className="p-2 text-right">{formatCurrency(item.totalRevenue)}</td>
            </tr>
          )}
        />
        <TopListTable
          title="Clientes con Mayor Gasto"
          headers={['Cliente', 'Órdenes', 'Total Gastado']}
          data={reportData.topCustomers}
          renderRow={(item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.email}</p>
              </td>
              <td className="p-2 text-center">{item.totalOrders}</td>
              <td className="p-2 text-right">{formatCurrency(item.totalSpent)}</td>
            </tr>
          )}
        />
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;