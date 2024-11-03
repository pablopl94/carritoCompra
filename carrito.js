class Carrito {
    constructor(productos = []) {
        this.productos = productos;
        this.carrito = {};
    }

    actualizarUnidades(sku, unidades) {
        if (unidades === 0) {
            delete this.carrito[sku];
        } else {
            this.carrito[sku] = unidades;
        }
    }

    obtenerInformacionProducto(sku) {
        const producto = this.productos.find(prod => prod.SKU === sku);
        return {
            sku: producto.SKU,
            quantity: this.carrito[sku] || 0,
            title: producto.title,
            price: producto.price
        };
    }

    obtenerCarrito() {
        let total = 0;
        let productosEnCarrito = [];
        for (let sku in this.carrito) {
            let producto = this.obtenerInformacionProducto(sku);
            total += parseFloat(producto.price) * producto.quantity;
            productosEnCarrito.push(producto);
        }
        return {
            total: total.toFixed(2),
            currency: "€",
            products: productosEnCarrito
        };
    }
}
