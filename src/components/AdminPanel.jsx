import { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = ({
  abrirModalGlobal,
  volverAlInicio,
  empleadoActual,
  personal = [],
  onAprobarSolicitud,
  onRechazarSolicitud,
}) => {
  const [tabActiva, setTabActiva] = useState('resumen');
  const [confirmacionAlta, setConfirmacionAlta] = useState(null);

  const resumenDia = {
    ventasTotales: 1250,
    ticketsVendidos: 35,
    efectivo: 800,
    qrPagos: 450,
    incidentes: 1
  };

  const movimientos = [
    { id: 'V-001', hora: '10:30', cliente: 'Juan Pérez', concepto: 'Trampoline Park x2', monto: 100, metodo: 'Efectivo' },
    { id: 'V-002', hora: '11:15', cliente: 'María López', concepto: 'Combo Hamburguesa', monto: 45, metodo: 'QR' },
    { id: 'V-003', hora: '12:00', cliente: 'Carlos Ruiz', concepto: 'Bowling x1', monto: 40, metodo: 'Efectivo' },
    { id: 'V-004', hora: '13:45', cliente: 'Ana Gómez', concepto: 'Paquete Cumpleaños', monto: 1000, metodo: 'Transferencia' },
  ];

  const inventario = [
    { id: 1, producto: 'Pulsos RFID', stock: 150, minimo: 50 },
    { id: 2, producto: 'Coca-Cola 500ml', stock: 45, minimo: 20 },
    { id: 3, producto: 'Hamburguesas (Carne)', stock: 30, minimo: 15 },
    { id: 4, producto: 'Pasteles de Cortesía', stock: 5, minimo: 10, alerta: true },
  ];

  const pendientes = personal.filter((p) => p.estado === 'pendiente');

  const aprobarConCodigo = (empleado) => {
    const nuevoCodigo = onAprobarSolicitud(empleado.id);
    setConfirmacionAlta({
      nombre: `${empleado.nombre} ${empleado.apellidos}`,
      ci: empleado.ci,
      telefono: empleado.telefono,
      email: empleado.email,
      codigo: nuevoCodigo,
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>Panel de Control <span className="highlight">XtremeFun</span></h2>
          <p>
            {empleadoActual
              ? `${empleadoActual.nombre} ${empleadoActual.apellidos} • CI: ${empleadoActual.ci} • Código: ${empleadoActual.codigo} (${empleadoActual.cargo})`
              : 'Bienvenida, Cajera Principal - Turno Mañana'}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={volverAlInicio}>
          Cerrar Sesión / Salir
        </button>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`tab-btn ${tabActiva === 'resumen' ? 'activo' : ''}`}
          onClick={() => setTabActiva('resumen')}
        >
          📊 Resumen de Caja
        </button>
        <button
          type="button"
          className={`tab-btn ${tabActiva === 'movimientos' ? 'activo' : ''}`}
          onClick={() => setTabActiva('movimientos')}
        >
          💸 Movimientos del Día
        </button>
        <button
          type="button"
          className={`tab-btn ${tabActiva === 'inventario' ? 'activo' : ''}`}
          onClick={() => setTabActiva('inventario')}
        >
          📦 Inventario
        </button>
        <button
          type="button"
          className={`tab-btn ${tabActiva === 'personal' ? 'activo' : ''}`}
          onClick={() => setTabActiva('personal')}
        >
          👥 Personal {pendientes.length > 0 ? `(${pendientes.length} pend.)` : ''}
        </button>
      </div>

      <div className="admin-content">
        {tabActiva === 'resumen' && (
          <div className="tab-resumen">
            <div className="cards-grid">
              <div className="stat-card">
                <span className="stat-label">Ventas Totales (Bs)</span>
                <h3 className="stat-value">Bs. {resumenDia.ventasTotales}</h3>
              </div>
              <div className="stat-card">
                <span className="stat-label">Tickets Vendidos</span>
                <h3 className="stat-value">{resumenDia.ticketsVendidos}</h3>
              </div>
              <div className="stat-card">
                <span className="stat-label">Ingresos en Efectivo</span>
                <h3 className="stat-value">Bs. {resumenDia.efectivo}</h3>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pagos por QR</span>
                <h3 className="stat-value">Bs. {resumenDia.qrPagos}</h3>
              </div>
            </div>

            <div className="cierre-caja">
              <h3>Cierre de Caja Sugerido</h3>
              <p>El sistema calcula un total de <strong>Bs. {resumenDia.ventasTotales}</strong> en caja.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  abrirModalGlobal(
                    'Cierre de Caja',
                    '¿Estás segura de realizar el cierre? Se generará un reporte y se bloqueará la caja hasta el siguiente turno.'
                  )
                }
              >
                Realizar Cierre de Caja 🔒
              </button>
            </div>
          </div>
        )}

        {tabActiva === 'movimientos' && (
          <div className="tab-movimientos">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{mov.id}</td>
                      <td>{mov.hora}</td>
                      <td>{mov.cliente}</td>
                      <td>{mov.concepto}</td>
                      <td>Bs. {mov.monto}</td>
                      <td>
                        <span className={`badge-metodo ${mov.metodo.toLowerCase()}`}>
                          {mov.metodo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tabActiva === 'inventario' && (
          <div className="tab-inventario">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item) => (
                    <tr key={item.id} className={item.alerta ? 'alerta-stock' : ''}>
                      <td>{item.producto}</td>
                      <td>{item.stock}</td>
                      <td>{item.minimo}</td>
                      <td>
                        {item.alerta ? (
                          <span className="badge-alerta">⚠️ Reabastecer</span>
                        ) : (
                          <span className="badge-ok">✅ Suficiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tabActiva === 'personal' && (
          <div className="tab-personal">
            <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Aprobación de Gerente / Dueño y Códigos de Acceso
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Al aprobar un alta, se genera su código único y se prepara la confirmación al teléfono
              y correo registrados indicando con qué CI y código debe ingresar.
            </p>

            {confirmacionAlta && (
              <div
                style={{
                  backgroundColor: '#e8f8ef',
                  border: '1px solid #27ae60',
                  color: '#145a32',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              >
                ✅ <strong>Alta aprobada para {confirmacionAlta.nombre}</strong>.
                <br />
                Confirmación enviada a: Teléfono <strong>{confirmacionAlta.telefono}</strong> y
                correo <strong>{confirmacionAlta.email}</strong>.
                <br />
                Credenciales para ingresar al Panel Administrativo: CI{' '}
                <strong>{confirmacionAlta.ci}</strong> y Código único{' '}
                <strong>{confirmacionAlta.codigo}</strong>.
              </div>
            )}

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre y Apellidos</th>
                    <th>CI</th>
                    <th>Teléfono</th>
                    <th>Correo / Gmail</th>
                    <th>Cargo / Turno</th>
                    <th>Estado</th>
                    <th>Código Único</th>
                    <th>Acción Gerencia</th>
                  </tr>
                </thead>
                <tbody>
                  {personal.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.nombre} {emp.apellidos}</td>
                      <td>{emp.ci}</td>
                      <td>{emp.telefono}</td>
                      <td>{emp.email}</td>
                      <td>{emp.cargo} ({emp.turno})</td>
                      <td>
                        {emp.estado === 'aprobado' && <span className="badge-ok">✅ Aprobado</span>}
                        {emp.estado === 'pendiente' && <span className="badge-alerta">⏳ Pendiente</span>}
                        {emp.estado === 'rechazado' && <span className="badge-alerta">❌ Rechazado</span>}
                      </td>
                      <td>
                        <strong>{emp.codigo || '—'}</strong>
                      </td>
                      <td>
                        {emp.estado === 'pendiente' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                              onClick={() => aprobarConCodigo(emp)}
                            >
                              Aprobar y Generar Código
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => onRechazarSolicitud(emp.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
                            Sin acciones pendientes
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;