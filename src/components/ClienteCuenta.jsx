import { useState } from 'react';
import { QrVisual, imprimirFacturaOperacion } from './ModalPagoQr';
import './AdminPanel.css';

const obtenerEstadoAtraccion = (venta, sesionesActivas = []) => {
  const pases = venta.pasesPorAtraccion || [];
  const restantesPases = pases.reduce((acc, p) => acc + p.restantes, 0);
  const ahora = Date.now();

  const tieneSesionActiva = sesionesActivas.some(
    (s) =>
      (s.codigoVenta === venta.codigoVenta || s.codigoQr === venta.codigoIngresoQr) &&
      s.expiraEn > ahora
  );

  if (tieneSesionActiva) {
    return {
      clave: 'en_uso',
      texto: 'En uso',
      badgeClass: 'badge-alerta',
    };
  }

  if (restantesPases > 0) {
    return {
      clave: 'disponible',
      texto: 'Disponible para su pase',
      badgeClass: 'badge-ok',
    };
  }

  return {
    clave: 'usado',
    texto: 'Ya fue usado',
    badgeClass: 'badge-metodo',
  };
};

const obtenerEstadoComida = (venta) => {
  if (venta.consumido) {
    return {
      clave: 'usado',
      texto: 'Ya fue usado',
      badgeClass: 'badge-metodo',
    };
  }
  return {
    clave: 'disponible',
    texto: 'Disponible para su pase',
    badgeClass: 'badge-ok',
  };
};

const ClienteCuenta = ({
  seccionInicial = 'perfil',
  clienteActual,
  onAgregarMenor,
  onEliminarMenor,
  ventasValidadas = [],
  sesionesActivas = [],
  onConsumirComida,
  volverAlInicio,
}) => {
  const [subTabPerfil, setSubTabPerfil] = useState('datos'); // 'datos' | 'historial'
  const [nombreMenor, setNombreMenor] = useState('');
  const [ciMenor, setCiMenor] = useState('');
  const [edadMenor, setEdadMenor] = useState('');
  const [facturaModal, setFacturaModal] = useState(null);

  if (!clienteActual) {
    return null;
  }

  const menores = clienteActual.menores || [];

  const ventasDelCliente = ventasValidadas.filter((v) => {
    if (v.estadoPago !== 'validado') return false;
    const ciCoincide =
      clienteActual.ci &&
      clienteActual.ci !== 'No especificado' &&
      String(v.cliente?.ci || '').trim() === String(clienteActual.ci).trim();
    const emailCoincide =
      clienteActual.email &&
      String(v.cliente?.email || '').trim().toLowerCase() ===
        String(clienteActual.email).trim().toLowerCase();
    return ciCoincide || emailCoincide;
  });

  // Solo quedan en "Mis Tickets QR" los tickets activos o disponibles (no usados)
  const ticketsActivos = ventasDelCliente.filter((v) => {
    if (v.tipo === 'comida') return !v.consumido;
    const estado = obtenerEstadoAtraccion(v, sesionesActivas);
    return estado.clave !== 'usado';
  });

  // Los tickets usados pasan automáticamente al Historial de compras en Mi Perfil
  const historialConsumidos = ventasDelCliente.filter((v) => {
    if (v.tipo === 'comida') return Boolean(v.consumido);
    const estado = obtenerEstadoAtraccion(v, sesionesActivas);
    return estado.clave === 'usado';
  });

  const handleSubmitMenor = (e) => {
    e.preventDefault();
    if (!nombreMenor.trim() || !ciMenor.trim() || !edadMenor) return;

    onAgregarMenor({
      id: `MEN-${Date.now()}`,
      nombreCompleto: nombreMenor.trim(),
      ci: ciMenor.trim(),
      edad: Number(edadMenor),
    });

    setNombreMenor('');
    setCiMenor('');
    setEdadMenor('');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>
            {seccionInicial === 'tickets' ? 'Mis Tickets' : 'Mi'}{' '}
            <span className="highlight">{seccionInicial === 'tickets' ? 'QR' : 'Perfil'}</span>
          </h2>
          <p>
            Cliente: <strong>{clienteActual.nombre}</strong> • CI: {clienteActual.ci} •{' '}
            {clienteActual.email}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={volverAlInicio}>
          Volver al Inicio
        </button>
      </div>

      {seccionInicial === 'perfil' ? (
        <div className="admin-content" style={{ minHeight: 'auto' }}>
          <div className="admin-tabs" style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={`tab-btn ${subTabPerfil === 'datos' ? 'activo' : ''}`}
              onClick={() => setSubTabPerfil('datos')}
            >
              👤 Datos y Menores a Cargo
            </button>
            <button
              type="button"
              className={`tab-btn ${subTabPerfil === 'historial' ? 'activo' : ''}`}
              onClick={() => setSubTabPerfil('historial')}
            >
              🧾 Historial de compras ({historialConsumidos.length})
            </button>
          </div>

          {subTabPerfil === 'datos' ? (
            <>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', marginBottom: '0.75rem' }}>
                Datos del Cliente
              </h3>
              <div className="cards-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                  <span className="stat-label">Nombre Completo</span>
                  <h4 style={{ marginTop: '0.35rem', fontSize: '1.1rem' }}>{clienteActual.nombre}</h4>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Carnet de Identidad (CI)</span>
                  <h4 style={{ marginTop: '0.35rem', fontSize: '1.1rem' }}>{clienteActual.ci}</h4>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Correo Electrónico</span>
                  <h4 style={{ marginTop: '0.35rem', fontSize: '1rem', wordBreak: 'break-all' }}>
                    {clienteActual.email}
                  </h4>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Teléfono / Exención</span>
                  <h4 style={{ marginTop: '0.35rem', fontSize: '1rem' }}>
                    {clienteActual.telefono || 'No registrado'} •{' '}
                    {clienteActual.exencionFirmada ? '✅ Exención firmada' : 'Pendiente firma'}
                  </h4>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', marginBottom: '0.35rem' }}>
                Hijos o Menores de los que es Responsable
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Agrega los datos de hijos o menores a tu cargo (nombre completo, CI y edad).
              </p>

              <form onSubmit={handleSubmitMenor} style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej: Mateo Pérez López"
                      value={nombreMenor}
                      onChange={(e) => setNombreMenor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>CI</label>
                    <input
                      type="text"
                      placeholder="Ej: 11223344"
                      value={ciMenor}
                      onChange={(e) => setCiMenor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Edad</label>
                    <input
                      type="number"
                      min="1"
                      max="17"
                      placeholder="Ej: 9"
                      value={edadMenor}
                      onChange={(e) => setEdadMenor(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary">
                  + Agregar Hijo / Responsable
                </button>
              </form>

              {menores.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  Aún no agregaste hijos o menores a tu cargo.
                </p>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nombre Completo</th>
                        <th>CI</th>
                        <th>Edad</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menores.map((m) => (
                        <tr key={m.id}>
                          <td>{m.nombreCompleto}</td>
                          <td>{m.ci}</td>
                          <td>{m.edad} años</td>
                          <td>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                              onClick={() => onEliminarMenor(m.id)}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', marginBottom: '0.35rem' }}>
                Historial de compras consumidas
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Aquí aparecen tus compras de atracciones y comida una vez que fueron usadas.
              </p>

              {historialConsumidos.length === 0 ? (
                <p style={{ color: 'var(--text-light)', padding: '1rem 0' }}>
                  Aún no tienes compras consumidas en tu historial.
                </p>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Código Venta / QR</th>
                        <th>Detalle</th>
                        <th>Fecha Compra</th>
                        <th>Fecha Ingreso / Consumo</th>
                        <th>Estado</th>
                        <th>Factura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialConsumidos.map((v) => {
                        const esAtraccion = v.tipo === 'atracciones';
                        const codigoMostrar = esAtraccion
                          ? v.codigoIngresoQr
                          : v.codigoComidaQr || `COM-${v.codigoVenta}`;
                        const fechaConsumo = esAtraccion
                          ? v.fechaIngreso || 'Registrado en atracción'
                          : v.fechaConsumo || 'Consumido';

                        return (
                          <tr key={v.codigoVenta}>
                            <td>
                              <span
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  backgroundColor: esAtraccion ? '#dbeafe' : '#fef3c7',
                                  color: esAtraccion ? '#1e40af' : '#92400e',
                                }}
                              >
                                {esAtraccion ? '🎢 ATRACCIÓN' : '🍔 COMIDA'}
                              </span>
                            </td>
                            <td>
                              <strong>{codigoMostrar}</strong>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-light)' }}>
                                Venta: {v.codigoVenta}
                              </div>
                            </td>
                            <td>
                              {(v.items || []).map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')} —{' '}
                              <strong>Bs. {v.montoPagado ?? v.montoTotal}</strong>
                            </td>
                            <td>{v.fechaCompra}</td>
                            <td>{fechaConsumo}</td>
                            <td>
                              <span className="badge-metodo">Ya fue usado</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                                onClick={() => setFacturaModal(v)}
                              >
                                Ver factura
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="admin-content" style={{ minHeight: 'auto' }}>
          <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', marginBottom: '0.35rem' }}>
            Mis Tickets QR (Atracciones y Comida)
          </h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Los tickets usados se mueven automáticamente a <strong>Mi Perfil → Historial de compras</strong>.
          </p>

          {ticketsActivos.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem 0' }}>
              No tienes tickets QR disponibles o en uso en este momento.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {ticketsActivos.map((ticket) => {
                const esAtraccion = ticket.tipo === 'atracciones';
                const codigoQr = esAtraccion
                  ? ticket.codigoIngresoQr
                  : ticket.codigoComidaQr || `COM-${ticket.codigoVenta}`;
                const estado = esAtraccion
                  ? obtenerEstadoAtraccion(ticket, sesionesActivas)
                  : obtenerEstadoComida(ticket);

                return (
                  <div
                    key={ticket.codigoVenta}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      padding: '1.15rem',
                      border: esAtraccion ? '2px solid #93c5fd' : '2px solid #fcd34d',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '50px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: esAtraccion ? '#dbeafe' : '#fef3c7',
                            color: esAtraccion ? '#1e40af' : '#92400e',
                          }}
                        >
                          {esAtraccion ? '🎢 QR INGRESO ATRACCIÓN' : '🍔 QR COMIDA'}
                        </span>

                        <span className={estado.badgeClass}>{estado.texto}</span>
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
                        <QrVisual
                          valor={codigoQr}
                          size={128}
                          color={esAtraccion ? '#1e40af' : '#92400e'}
                        />
                      </div>

                      <div style={{ fontSize: '0.84rem', lineHeight: 1.55 }}>
                        <div>
                          <strong>Código Venta:</strong> {ticket.codigoVenta}
                        </div>
                        <div>
                          <strong>Fecha compra:</strong> {ticket.fechaCompra}
                        </div>
                        <div>
                          <strong>Fecha / Hora ingreso:</strong>{' '}
                          {esAtraccion
                            ? ticket.fechaIngreso || 'Aún sin ingreso'
                            : ticket.fechaConsumo || 'Aún sin consumir'}
                        </div>
                        <div>
                          <strong>Detalle:</strong>{' '}
                          {(ticket.items || []).map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
                        </div>
                        {esAtraccion && (ticket.pasesPorAtraccion || []).length > 0 && (
                          <div style={{ marginTop: '0.35rem' }}>
                            <strong>Pases restantes:</strong>{' '}
                            {ticket.pasesPorAtraccion
                              .map((p) => `${p.nombre} (${p.restantes}/${p.total})`)
                              .join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setFacturaModal(ticket)}
                      >
                        Ver factura
                      </button>

                      {!esAtraccion && !ticket.consumido && onConsumirComida && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            flex: 1,
                            marginTop: 0,
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.8rem',
                          }}
                          onClick={() => onConsumirComida(ticket.codigoVenta)}
                        >
                          Marcar consumido
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {facturaModal && (
        <div className="modal-overlay" style={{ zIndex: 2100 }} onClick={() => setFacturaModal(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '480px', textAlign: 'left' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="close-btn" onClick={() => setFacturaModal(null)}>
              &times;
            </span>
            <h3 style={{ textAlign: 'center' }}>Factura / Recibo</h3>
            <div
              style={{
                background: 'var(--bg-color)',
                padding: '1rem',
                borderRadius: '12px',
                fontSize: '0.86rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <strong>Código Venta:</strong> {facturaModal.codigoVenta}
              </div>
              <div>
                <strong>Fecha compra:</strong> {facturaModal.fechaCompra}
              </div>
              <div>
                <strong>Cliente:</strong> {facturaModal.cliente?.nombre} (CI:{' '}
                {facturaModal.cliente?.ci})
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e0', margin: '0.6rem 0' }} />
              {(facturaModal.items || []).map((item) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}
                >
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <strong>Bs. {item.precio * item.cantidad}</strong>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e0', margin: '0.6rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total:</span>
                <span>Bs. {facturaModal.montoPagado ?? facturaModal.montoTotal}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => imprimirFacturaOperacion(facturaModal)}
              >
                🖨️ Imprimir / Guardar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, marginTop: 0 }}
                onClick={() => setFacturaModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteCuenta;