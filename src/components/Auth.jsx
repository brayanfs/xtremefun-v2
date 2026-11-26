import { useState, useRef, useEffect, useCallback } from 'react';
import './Auth.css';

const STORAGE_KEY_CLIENTES = 'xtremefun_clientes_registrados_v1';

const cargarClientesGuardados = () => {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY_CLIENTES);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

const guardarClientesEnStorage = (clientes) => {
  try {
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
  } catch {
    // Ignorar errores de almacenamiento
  }
};

const Auth = ({
  abrirModalGlobal,
  onClienteAutenticado,
  clientesRegistrados: clientesRegistradosProp,
  onActualizarClientes: onActualizarClientesProp,
}) => {
  const [esLogin, setEsLogin] = useState(true);
  const [loginInput, setLoginInput] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [clientesLocales, setClientesLocales] = useState(cargarClientesGuardados);

  const controladoPorPadre =
    Array.isArray(clientesRegistradosProp) && typeof onActualizarClientesProp === 'function';

  const clientesRegistrados = controladoPorPadre
    ? clientesRegistradosProp
    : clientesLocales;

  const actualizarClientes = useCallback(
    (actualizador) => {
      if (controladoPorPadre) {
        onActualizarClientesProp((prev) =>
          typeof actualizador === 'function' ? actualizador(prev || []) : actualizador
        );
      } else {
        setClientesLocales((prev) =>
          typeof actualizador === 'function' ? actualizador(prev || []) : actualizador
        );
      }
    },
    [controladoPorPadre, onActualizarClientesProp]
  );

  const [formData, setFormData] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    password: '',
    confirmPassword: '',
  });

  // Solo se usa al crear cuenta (registro)
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [firmaAceptada, setFirmaAceptada] = useState(false);
  const [tutorNombre, setTutorNombre] = useState('');
  const [clientePendienteRegistro, setClientePendienteRegistro] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (controladoPorPadre) return;
    guardarClientesEnStorage(clientesLocales);
  }, [controladoPorPadre, clientesLocales]);

  useEffect(() => {
    if (mostrarFirma && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2C3E50';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [mostrarFirma]);

  const obtenerCoordenadas = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = obtenerCoordenadas(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = obtenerCoordenadas(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Iniciar sesión: valida contra clientes registrados y su contraseña
  const handleLogin = (e) => {
    e.preventDefault();
    setErrorLogin('');

    const limpio = loginInput.trim();
    const clave = passwordLogin;
    const esCorreo = limpio.includes('@');

    if (!limpio || !clave) {
      setErrorLogin('Ingresa tu CI o correo electrónico y tu contraseña.');
      return;
    }

    const encontrado = clientesRegistrados.find((cli) => {
      const coincideUsuario = esCorreo
        ? String(cli.email || '').trim().toLowerCase() === limpio.toLowerCase()
        : String(cli.ci || '').trim() === limpio;
      const coincidePassword = String(cli.password || '') === clave;
      return coincideUsuario && coincidePassword;
    });

    if (!encontrado) {
      setErrorLogin(
        'CI, correo o contraseña incorrectos. Si aún no tienes cuenta, regístrate primero.'
      );
      return;
    }

    setPasswordLogin('');
    if (onClienteAutenticado) {
      onClienteAutenticado(encontrado);
    }
  };

  // Crear cuenta: prepara el cliente y abre la firma de responsabilidades una sola vez
  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden. Por favor, verifica.');
      return;
    }
    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const nombreCompleto = `${formData.nombre.trim()} ${formData.apellido.trim()}`.trim();
    const nuevoCliente = {
      id: `CLI-${Date.now()}`,
      nombre: nombreCompleto || 'Cliente XtremeFun',
      ci: formData.ci.trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      fechaNacimiento: formData.fechaNacimiento,
      password: formData.password,
      menores: [],
      exencionFirmada: false,
      firmaImagen: '',
      tutorNombre: '',
      fechaFirma: '',
    };

    setClientePendienteRegistro(nuevoCliente);
    setFirmaAceptada(false);
    setTutorNombre('');
    setMostrarFirma(true);
  };

  // Guarda la firma en el sistema junto con la cuenta creada
  const handleFirmarExencion = () => {
    if (!firmaAceptada) {
      alert('Por favor, marca la casilla para aceptar los términos de seguridad.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const isEmpty = !imageData.some((channel) => channel !== 0);

    if (isEmpty) {
      alert('Por favor, dibuja tu firma en el recuadro blanco.');
      return;
    }

    const firmaDataUrl = canvas.toDataURL('image/png');
    const clienteGuardado = {
      ...(clientePendienteRegistro || {
        id: `CLI-${Date.now()}`,
        nombre: 'Cliente XtremeFun',
        ci: '0000000',
        email: 'cliente@xtremefun.bo',
        password: '',
        menores: [],
      }),
      exencionFirmada: true,
      firmaImagen: firmaDataUrl,
      tutorNombre: tutorNombre.trim(),
      fechaFirma: new Date().toLocaleString('es-BO'),
    };

    actualizarClientes((prev) => {
      const sinDuplicado = (prev || []).filter(
        (c) =>
          (c.ci && clienteGuardado.ci && c.ci === clienteGuardado.ci) ||
          (c.email &&
            clienteGuardado.email &&
            c.email.toLowerCase() === clienteGuardado.email.toLowerCase())
      );
      return [clienteGuardado, ...sinDuplicado];
    });

    setMostrarFirma(false);
    setFirmaAceptada(false);
    setClientePendienteRegistro(null);
    setFormData({
      ci: '',
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      fechaNacimiento: '',
      password: '',
      confirmPassword: '',
    });

    if (onClienteAutenticado) {
      onClienteAutenticado(clienteGuardado);
    } else {
      alert('¡Cuenta creada y firma guardada exitosamente! No tendrás que volver a firmarla.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-info">
          <h2 className="title">
            Bienvenido a <br />
            <span className="highlight">XtremeFun</span>
          </h2>
          <p>
            Regístrate o inicia sesión con tu Carnet de Identidad o correo para comprar tus entradas
            y comida en el parque.
          </p>
          <img
            src="https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=500&auto=format&fit=crop"
            alt="Diversión"
          />
        </div>

        <div className="auth-form-container">
          <h3>{esLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h3>

          <form onSubmit={esLogin ? handleLogin : handleRegister} className="auth-form">
            {esLogin ? (
              <>
                <div className="input-group">
                  <label>CI o Correo Electrónico</label>
                  <input
                    type="text"
                    placeholder="Ej: 12345678 o correo@ejemplo.com"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-info-icon"
                    onClick={() =>
                      abrirModalGlobal(
                        '¿Qué va aquí?',
                        'Ingresa tu número de Carnet de Identidad o tu correo electrónico.'
                      )
                    }
                  >
                    ?
                  </button>
                </div>
                <div className="input-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordLogin}
                    onChange={(e) => setPasswordLogin(e.target.value)}
                    required
                  />
                </div>
                {errorLogin && (
                  <div
                    style={{
                      backgroundColor: '#fff5f5',
                      border: '1px solid #feb2b2',
                      color: '#c53030',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.83rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {errorLogin}
                  </div>
                )}
                <button type="submit" className="btn-primary btn-full">
                  Entrar a mi cuenta 🚀
                </button>
              </>
            ) : (
              <>
                <div className="input-row">
                  <div className="input-group">
                    <label>Carnet de Identidad (CI)</label>
                    <input
                      type="text"
                      name="ci"
                      placeholder="Ej: 9876543"
                      value={formData.ci}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn-info-icon"
                      onClick={() =>
                        abrirModalGlobal('Carnet de Identidad', 'Usamos tu CI para identificarte.')
                      }
                    >
                      ?
                    </button>
                  </div>
                  <div className="input-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Ej: 77712345"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Nombre(s)</label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Ej: Juan"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Apellido(s)</label>
                    <input
                      type="text"
                      name="apellido"
                      placeholder="Ej: Pérez"
                      value={formData.apellido}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn-info-icon"
                    onClick={() =>
                      abrirModalGlobal(
                        'Fecha de Nacimiento',
                        'Necesaria para validar si eres mayor de edad.'
                      )
                    }
                  >
                    ?
                  </button>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Confirmar Contraseña</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary btn-full">
                  Registrarme y Firmar Exención ✍️
                </button>
              </>
            )}
          </form>

          <p className="toggle-auth">
            {esLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                setErrorLogin('');
                setPasswordLogin('');
                setEsLogin(!esLogin);
              }}
              className="btn-link"
            >
              {esLogin ? ' Regístrate aquí' : ' Inicia Sesión'}
            </button>
          </p>
        </div>
      </div>

      {/* MODAL DE FIRMA CON CANVAS (SOLO AL CREAR CUENTA) */}
      {mostrarFirma && !esLogin && (
        <div className="modal-overlay firma-overlay">
          <div className="modal-content firma-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Exención de Responsabilidad</h3>

            <div className="texto-legal">
              Yo, en mi calidad de cliente (o padre/tutor del menor), declaro que comprendo los
              riesgos inherentes a las actividades físicas en XtremeFun. Se guardará una sola vez en
              tu cuenta al crearla.
              <br />
              <br />
              <strong>
                Eximo a la empresa de cualquier responsabilidad por lesiones o incidentes ocurridos
                por negligencia propia.
              </strong>
            </div>

            <div className="input-group">
              <label>Nombre del Tutor (Si el cliente es menor de edad)</label>
              <input
                type="text"
                placeholder="Nombre completo del tutor"
                value={tutorNombre}
                onChange={(e) => setTutorNombre(e.target.value)}
              />
            </div>

            <div className="canvas-container">
              <div className="canvas-header">
                <span>Firma aquí con el mouse o dedo</span>
                <button type="button" className="btn-clear" onClick={limpiarCanvas}>
                  Limpiar 🗑️
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="firma-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={firmaAceptada}
                onChange={(e) => setFirmaAceptada(e.target.checked)}
              />
              He leído y acepto los términos y condiciones de seguridad.
            </label>

            <div className="firma-botones">
              <button
                type="button"
                className="btn-primary"
                onClick={handleFirmarExencion}
                style={{ opacity: firmaAceptada ? 1 : 0.6 }}
              >
                Guardar Firma y Crear Cuenta 🖋️
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setMostrarFirma(false);
                  setClientePendienteRegistro(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;