import { useState } from 'react';
import './Atracciones.css';

const mapearAtraccionId = (nombrePaquete) => {
  const n = nombrePaquete.toLowerCase();
  if (n.includes('trampoline')) return { id: 'trampoline', minutos: 60 };
  if (n.includes('bowling')) return { id: 'bowling', minutos: 45 };
  if (n.includes('tirolesa')) return { id: 'tirolesa', minutos: 15 };
  if (n.includes('láser') || n.includes('laser')) return { id: 'lasertag', minutos: 15 };
  return { id: 'trampoline', minutos: 60 };
};

const Atracciones = ({
  abrirModalGlobal,
  clienteActual,
  onRequiereLoginCliente,
  onIniciarPagoQr,
}) => {
  const [carrito, setCarrito] = useState([]);

  const paquetes = [
    {
      id: 1,
      nombre: 'Trampoline Park',
      precio: 50,
      desc: '1 Hora de salto en todas las zonas.',
      img: 'https://images.unsplash.com/photo-1574360772545-3b7852c7a4a5?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 2,
      nombre: 'Bowling',
      precio: 40,
      desc: '1 Turno completo. Incluye calzados.',
      img: 'https://images.unsplash.com/photo-1538511059549-6984e388863a?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 3,
      nombre: 'Tirolesa Extrema',
      precio: 60,
      desc: 'Descenso completo con equipo de seguridad.',
      img: 'https://images.unsplash.com/photo-1521677237042-9108e0b0c5b9?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 4,
      nombre: 'Láser Tag',
      precio: 45,
      desc: 'Partida de 15 minutos por equipos.',
      img: 'https://images.unsplash.com/photo-1595859702898-24d3e3f8b0c8?q=80&w=400&auto=format&fit=crop',
    },
  ];

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((item) => item.id === producto.id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const finalizarCompra = () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío. ¡Elige una atracción!');
      return;
    }

    if (!clienteActual) {
      if (onRequiereLoginCliente) {
        onRequiereLoginCliente();
      } else {
        alert('Ingrese a su cuenta para realizar el pago.');
      }
      return;
    }

    const pasesPorAtraccion = carrito.map((item) => {
      const meta = mapearAtraccionId(item.nombre);
      return {
        atraccionId: meta.id,
        nombre: item.nombre,
        total: item.cantidad,
        restantes: item.cantidad,
        minutos: meta.minutos,
      };
    });

    if (onIniciarPagoQr) {
      onIniciarPagoQr({
        tipo: 'atracciones',
        items: carrito,
        montoTotal: total,
        pasesPorAtraccion,
        mostrarFacturaDirecta: true,
      });
    } else {
      abrirModalGlobal(
        '¡Compra Exitosa!',
        `Has comprado ${carrito.reduce((acc, item) => acc + item.cantidad, 0)} paquetes por un total de Bs. ${total}.`,
        true
      );
    }

    setCarrito([]);
  };

  return (
    <div className="atracciones-page">
      <div className="promo-banner-light">
        <div className="promo-content">
          <span className="promo-tag">🔥 PROMO DE LA SEMANA</span>
          <h2>
            ¡Ven con tus amigos y <span className="highlight">salten juntos!</span>
          </h2>
          <p>Compra 2 horas de Trampoline Park y llévate gratis 1 refresco grande.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              abrirModalGlobal(
                'Promoción Especial',
                'Válido solo los días viernes de 15:00 a 18:00. Muestra este código en caja para reclamar tu bebida.'
              )
            }
          >
            Reclamar Beneficio
          </button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1574360772545-3b7852c7a4a5?q=80&w=600&auto=format&fit=crop"
          alt="Promo"
          className="promo-img"
        />
      </div>

      <div className="seccion-header">
        <h2 className="title">
          Elige tu <span className="highlight">Aventura</span>
        </h2>
        <p className="description">Selecciona tus atracciones favoritas y prepárate para la diversión.</p>
      </div>

      <div className="paquetes-grid-light">
        {paquetes.map((paq) => (
          <div key={paq.id} className="paquete-card-light">
            <div className="card-img-container">
              <img src={paq.img} alt={paq.nombre} />
            </div>
            <div className="card-info">
              <h3>{paq.nombre}</h3>
              <p className="desc">{paq.desc}</p>
              <p className="precio-light">Bs. {paq.precio.toFixed(2)}</p>

              <button type="button" className="btn-add-con-imagen" onClick={() => agregarAlCarrito(paq)}>
                <img src={paq.img} alt="icon" className="btn-thumb" />
                <span>Agregar al Carrito 🛒</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <div className="carrito-flotante-light">
          <div className="carrito-header">
            <h3>Tu Carrito 🛒</h3>
            <span>{carrito.reduce((acc, item) => acc + item.cantidad, 0)} items</span>
          </div>
          <div className="carrito-items">
            {carrito.map((item) => (
              <div key={item.id} className="carrito-item">
                <span>
                  {item.cantidad}x {item.nombre}
                </span>
                <span>Bs. {item.precio * item.cantidad}</span>
                <button
                  type="button"
                  onClick={() => eliminarDelCarrito(item.id)}
                  className="btn-delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="carrito-footer">
            <div className="total">
              <span>Total:</span>
              <span className="total-precio">Bs. {total}</span>
            </div>
            <button type="button" className="btn-primary btn-full" onClick={finalizarCompra}>
              Pagar y Generar QR 📱
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Atracciones;