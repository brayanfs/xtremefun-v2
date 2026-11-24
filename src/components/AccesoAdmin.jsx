import { useState } from 'react';
import './Auth.css';

export const PERSONAL_INICIAL = [
  {
    id: 'EMP-001',
    ci: '9876543',
    codigo: 'XF-101',
    nombre: 'Valeria',
    apellidos: 'Mendoza Quispe',
    telefono: '77711223',
    email: 'valeria.caja@gmail.com',
    cargo: 'Cajera Principal',
    turno: 'Mañana',
    estado: 'aprobado',
    fechaRegistro: '2026-10-01',
  },
];

const AccesoAdmin = ({ personal, onAgregarSolicitud, onLoginExitoso, volverAlInicio }) => {
  const [modo, setModo] = useState('acceso'); // 'acceso' | 'solicitud' | 'enviada'
  const [ciAcceso, setCiAcceso] = useState('');
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [errorAcceso, setErrorAcceso] = useState('');

  const [datosContratacion, setDatosContratacion] = useState({
    nombre: '',
    apellidos: '',
    ci: '',
    telefono: '',
    email: '',
    cargo: 'Recepción',
    turno: 'Mañana',
  });
  const [ultimaSolicitud, setUltimaSolicitud] = useState(null);

  const handleIngreso = (e) => {
    e.preventDefault();
    setErrorAcceso('');

    const ciLimpio = ciAcceso.trim();
    const codigoLimpio = codigoAcceso.trim().toUpperCase();

    const empleadoEncontrado = personal.find(
      (emp) => emp.ci.trim() === ciLimpio && emp.codigo.toUpperCase() === codigoLimpio
    );

    if (!empleadoEncontrado) {
      setErrorAcceso(
        'No encontramos ese CI con ese código único de personal. Si estás recién contratado o aún no tienes código, envía tus datos al gerente y/o dueño.'
      );
      return;
    }

    if (empleadoEncontrado.estado !== 'aprobado') {
      setErrorAcceso(
        'Tu registro está pendiente de aprobación por el gerente o dueño. Aún no puedes ingresar al panel.'
      );
      return;
    }

    onLoginExitoso(empleadoEncontrado);
  };

  const handleChangeContratacion = (e) => {
    const { name, value } = e.target;
    setDatosContratacion((prev) => ({ ...prev, [name]: value }));
  };

  const handleEnviarSolicitud = (e) => {
    e.preventDefault();

    const nuevaSolicitud = {
      id: `SOL-${Date.now().toString().slice(-4)}`,
      nombre: datosContratacion.nombre.trim(),
      apellidos: datosContratacion.apellidos.trim(),
      ci: datosContratacion.ci.trim(),
      telefono: datosContratacion.telefono.trim(),
      email: datosContratacion.email.trim(),
      cargo: datosContratacion.cargo,
      turno: datosContratacion.turno,
      codigo: '', // Se genera únicamente cuando el gerente/dueño aprueba
      estado: 'pendiente',
      fechaRegistro: new Date().toISOString().slice(0, 10),
    };

    onAgregarSolicitud(nuevaSolicitud);
    setUltimaSolicitud(nuevaSolicitud);
    setModo('enviada');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-info">
          <h2 className="title">
            Acceso <br />
            <span className="highlight">Administrativo</span>
          </h2>
          <p>
            Ingreso exclusivo para personal autorizado de XtremeFun. Si aún no estás registrado,
            envía tu ficha de contratación para aprobación del gerente o dueño.
          </p>
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop"
            alt="Gestión del parque"
          />
        </div>

        <div className="auth-form-container">
          {modo === 'acceso' && (
            <>
              <h3>Validación de Personal</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                Ingresa tu Carnet de Identidad (CI) y tu código único asignado.
              </p>

              <form onSubmit={handleIngreso} className="auth-form">
                <div className="input-group">
                  <label>Carnet de Identidad (CI)</label>
                  <input
                    type="text"
                    placeholder="Ej: 9876543"
                    value={ciAcceso}
                    onChange={(e) => setCiAcceso(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Código Único de Personal</label>
                  <input
                    type="text"
                    placeholder="Ej: XF-101"
                    value={codigoAcceso}
                    onChange={(e) => setCodigoAcceso(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>

                {errorAcceso && (
                  <div
                    style={{
                      backgroundColor: '#fff5f5',
                      border: '1px solid #feb2b2',
                      color: '#c53030',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      marginBottom: '1rem',
                      lineHeight: 1.45,
                    }}
                  >
                    {errorAcceso}
                  </div>
                )}

                <button type="submit" className="btn-primary btn-full">
                  Ingresar al Panel 🔐
                </button>
              </form>

              <div className="toggle-auth">
                <p style={{ marginBottom: '0.6rem' }}>¿Aún no estás registrado en el sistema?</p>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setDatosContratacion((prev) => ({ ...prev, ci: ciAcceso.trim() }));
                    setModo('solicitud');
                  }}
                >
                  Registrar datos de contratación para aprobación del Gerente/Dueño →
                </button>
              </div>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <button type="button" className="btn-secondary" onClick={volverAlInicio}>
                  Volver al Inicio
                </button>
              </div>
            </>
          )}

          {modo === 'solicitud' && (
            <>
              <h3>Ficha de Contratación</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                Completa tus datos. No se validará automáticamente: quedará pendiente hasta que el
                gerente o dueño apruebe tu alta y te envíe la confirmación a tu teléfono y Gmail con
                tu CI y código de acceso.
              </p>

              <form onSubmit={handleEnviarSolicitud} className="auth-form">
                <div className="input-row">
                  <div className="input-group">
                    <label>Nombre(s)</label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Ej: Carlos"
                      value={datosContratacion.nombre}
                      onChange={handleChangeContratacion}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Apellido(s)</label>
                    <input
                      type="text"
                      name="apellidos"
                      placeholder="Ej: Mamani Quispe"
                      value={datosContratacion.apellidos}
                      onChange={handleChangeContratacion}
                      required
                    />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Carnet de Identidad (CI)</label>
                    <input
                      type="text"
                      name="ci"
                      placeholder="Ej: 8451230"
                      value={datosContratacion.ci}
                      onChange={handleChangeContratacion}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Teléfono / Celular (Confirmación de alta)</label>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Ej: 71234567"
                      value={datosContratacion.telefono}
                      onChange={handleChangeContratacion}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Correo Gmail / Electrónico (Confirmación de alta)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="ejemplo@gmail.com"
                    value={datosContratacion.email}
                    onChange={handleChangeContratacion}
                    required
                  />
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Área / Cargo</label>
                    <select
                      name="cargo"
                      value={datosContratacion.cargo}
                      onChange={handleChangeContratacion}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        border: '2px solid #eee',
                        borderRadius: '12px',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.95rem',
                        backgroundColor: '#fff',
                      }}
                    >
                      <option value="Recepción">Recepción</option>
                      <option value="Caja">Caja</option>
                      <option value="Kiosco / Comida">Kiosco / Comida</option>
                      <option value="Operador de Atracciones">Operador de Atracciones</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Turno</label>
                    <select
                      name="turno"
                      value={datosContratacion.turno}
                      onChange={handleChangeContratacion}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        border: '2px solid #eee',
                        borderRadius: '12px',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.95rem',
                        backgroundColor: '#fff',
                      }}
                    >
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Rotativo">Rotativo</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary btn-full">
                  Enviar Datos al Gerente / Dueño 📨
                </button>
              </form>

              <div className="toggle-auth">
                <button type="button" className="btn-link" onClick={() => setModo('acceso')}>
                  ← Volver a ingresar con CI y Código
                </button>
              </div>
            </>
          )}

          {modo === 'enviada' && ultimaSolicitud && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
              <h3>Solicitud Enviada a Gerencia</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Los datos de <strong>{ultimaSolicitud.nombre} {ultimaSolicitud.apellidos}</strong>{' '}
                (CI: <strong>{ultimaSolicitud.ci}</strong>) fueron enviados al gerente o dueño.
                <br />
                Cuando aprueben tu alta, se enviará la confirmación con tu <strong>CI ({ultimaSolicitud.ci})</strong>{' '}
                y tu <strong>código de acceso único</strong> al teléfono{' '}
                <strong>{ultimaSolicitud.telefono}</strong> y al correo{' '}
                <strong>{ultimaSolicitud.email}</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button type="button" className="btn-primary btn-full" onClick={() => setModo('acceso')}>
                  Ir a Ingreso con CI y Código
                </button>
                <button type="button" className="btn-secondary" onClick={volverAlInicio}>
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccesoAdmin;