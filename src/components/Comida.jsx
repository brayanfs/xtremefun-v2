import { useState } from 'react';
import './Comida.css';

const Comida = ({
  abrirModalGlobal,
  clienteActual,
  onRequiereLoginCliente,
  onIniciarPagoQr,
}) => {
  const menu = [
    { id: 1, nombre: 'Hamburguesa Xtreme', precio: 35, categoria: 'Salados', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop' },
    { id: 2, nombre: 'Salchipapa Especial', precio: 25, categoria: 'Salados', img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=500&auto=format&fit=crop' },
    { id: 3, nombre: 'Coca-Cola 500ml', precio: 10, categoria: 'Bebidas', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop' },
    { id: 4, nombre: 'Sprite 500ml', precio: 10, categoria: 'Bebidas', img: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=500&auto=format&fit=crop' },
    { id: 5, nombre: 'Cerveza Paceña', precio: 20, categoria: 'Bebidas', img: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=500&auto=format&fit=crop' },
    { id: 6, nombre: 'Postre de Chocolate', precio: 18, categoria: 'Postres', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=500&auto=format&fit=crop' },
    { id: 7, nombre: 'Helado Artesanal', precio: 15, categoria: 'Postres', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=500&auto=format&fit=crop' },
  ];

  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

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
      alert('Tu carrito está vacío. ¡Agrega algo rico primero!');
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

    if (onIniciarPagoQr) {
      onIniciarPagoQr({
        tipo: 'comida',
        items: carrito,
        montoTotal: total,
        mostrarFacturaDirecta: true,
      });
    } else {
      abrirModalGlobal(
        '¡Pedido Confirmado!',
        `Tu pedido por un total de Bs. ${total} está listo para pedir al mostrador.`,
        true
      );
    }

    setCarrito([]);
  };

  const productosFiltrados =
    categoriaActiva === 'Todos'
      ? menu
      : menu.filter((p) => p.categoria === categoriaActiva);

  return (
    <div className="comida-page">
      <div className="comida-banner">
        <div className="banner-text">
          <h2>
            ¿Hambre en la <span className="highlight">Aventura?</span>
          </h2>
          <p>Pide tus hamburguesas, salchipapas, bebidas y postres sin salir del parque.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              abrirModalGlobal(
                '¿Cómo funciona?',
                'Selecciona tus productos favoritos, agrégalos al carrito y al darle a pagar se mostrará tu factura lista para ir a pedir al mostrador.'
              )
            }
          >
            ¿Cómo funciona? 🍔
          </button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop"
          alt="Comida"
          className="banner-img"
        />
      </div>

      <div className="filtros">
        {['Todos', 'Salados', 'Bebidas', 'Postres'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filtro-btn ${categoriaActiva === cat ? 'activo' : ''}`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {productosFiltrados.map((prod) => (
          <div key={prod.id} className="producto-card">
            <img src={prod.img} alt={prod.nombre} />
            <div className="producto-info">
              <h4>{prod.nombre}</h4>
              <p className="precio">Bs. {prod.precio}</p>
              <button type="button" className="btn-add" onClick={() => agregarAlCarrito(prod)}>
                + Agregar
              </button>
            </div>
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <div className="carrito-flotante">
          <div className="carrito-header">
            <h3>Tu Pedido 🛒</h3>
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

export default Comida;