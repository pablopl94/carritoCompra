document.addEventListener('DOMContentLoaded', async () => {
    // Primero voy a intentar cargar los datos desde JSONBlob usando AllOrigins para esquivar el tema de CORS (aunque a veces peta).
    const url = 'https://jsonblob.com/api/1293817941211340800';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    // Si lo de JSONBlob falla, tengo el JSON local como plan B
    const localUrl = 'datos.json';

    // Función para que al probar el JSONBlob por AllOrigins no se tire dos horas probando y pase al JSON local.
    const fetchWithTimeout = (url, timeout) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tiempo de espera agotado')), timeout) 
            )
        ]);
    };

    try {
        console.log("Intentando cargar datos desde JSONBlob con AllOrigins...");
        const response = await fetchWithTimeout(proxyUrl, 15000); // Intento de conexión con un tiempo maximo de 15 segundos

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Productos cargados desde JSONBlob usando AllOrigins:', data);

        // Si todo va bien, creo el carrito con estos datos y actualizo la página
        const carrito = new Carrito(data.products);
        window.carrito = carrito;
        mostrarProductos(data.products);
        actualizarCarritoDOM(carrito);
    } catch (error) {
        console.warn('No pude cargar los datos desde JSONBlob con AllOrigins:', error);
        console.log('Voy a probar con el archivo local...');

        try {
            const response = await fetch(localUrl); // Ahora intento con el JSON local

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Productos cargados desde el archivo local:', data);

            // Si carga bien desde el archivo, creo el carrito y actualizo la página
            const carrito = new Carrito(data.products);
            window.carrito = carrito;
            mostrarProductos(data.products);
            actualizarCarritoDOM(carrito);
        } catch (localError) {
            console.error('Tampoco pude cargar los datos desde el archivo local:', localError);
            alert('No se pudieron cargar los productos ni desde JSONBlob ni desde el archivo local.');
        }
    }
});


function mostrarProductos(productos) {
    console.log("Ejecutando mostrarProductos...");
    const productosDiv = document.getElementById('productos');
    if (!productosDiv) {
        console.error("No se encontró el elemento con id 'productos'");
        return;
    }

    productosDiv.innerHTML = ""; // Limpiar contenido anterior

    productos.forEach(producto => {
        console.log("Mostrando producto:", producto); // Verificar cada producto que se muestra
        const div = document.createElement('div');
        div.classList.add('producto');
        div.innerHTML = `
            <div>
                <h3>${producto.title}</h3>
                <p>Ref: ${producto.SKU}</p>
            </div>
            <div class="cantidad" style="display: flex; align-items: center; gap: 5px; max-width: 100px;">
                <button class="decrementar" onclick="actualizarCantidad('${producto.SKU}', -1)" style="width: 25px; height: 25px;">-</button>
                <input type="number" id="cantidad-${producto.SKU}" value="0" min="0" readonly style="width: 30px; text-align: center;">
                <button class="incrementar" onclick="actualizarCantidad('${producto.SKU}', 1)" style="width: 25px; height: 25px;">+</button>
            </div>
            <div>
                <p>${producto.price} €</p>
            </div>
            <div>
                <p id="total-${producto.SKU}">0 €</p>
            </div>
        `;
        productosDiv.appendChild(div);
    });
}

function actualizarCantidad(sku, cambio) {
    console.log(`Actualizando cantidad para SKU ${sku} con cambio ${cambio}`);
    const inputCantidad = document.getElementById(`cantidad-${sku}`);
    if (!inputCantidad) {
        console.error(`No se encontró el input para SKU ${sku}`);
        return;
    }

    let cantidadActual = parseInt(inputCantidad.value);
    cantidadActual = Math.max(0, cantidadActual + cambio);
    inputCantidad.value = cantidadActual;

    window.carrito.actualizarUnidades(sku, cantidadActual);
    actualizarCarritoDOM(window.carrito);
}

function actualizarCarritoDOM(carrito) {
    console.log("Actualizando el carrito en el DOM...");
    const carritoInfo = carrito.obtenerCarrito();
    const listaCarrito = document.getElementById('lista-carrito');
    if (!listaCarrito) {
        console.error("No se encontró el elemento con id 'lista-carrito'");
        return;
    }

    listaCarrito.innerHTML = ''; // Limpiar contenido antes de volver a renderizar

    carritoInfo.products.forEach(prod => {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>${prod.title} - ${prod.quantity} unidades - ${(prod.price * prod.quantity).toFixed(2)} €</p>
        `;
        listaCarrito.appendChild(div);

        // Actualizar el total individual en la lista de productos
        const totalProducto = document.getElementById(`total-${prod.sku}`);
        if (totalProducto) {
            totalProducto.textContent = `${(prod.price * prod.quantity).toFixed(2)} €`;
        } else {
            console.error(`No se encontró el elemento con id 'total-${prod.sku}'`);
        }
    });

    document.getElementById('total').textContent = `${carritoInfo.total} €`;
}