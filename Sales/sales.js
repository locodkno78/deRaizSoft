import {
  db,
  collection,
  getDocs,
  saveOrUpdatePedido,
  getFormProd,
  registrarVenta,
  auth,
} from "../firebase.js";

// ✅ Función para actualizar completamente la vista
async function actualizarVistaCompleta() {
  try {
    const productosSnapshot = await getFormProd();

    document.getElementById("searchInput").value = "";
  } catch (error) {
    console.error("Error al actualizar la vista:", error);
  }
}

// Función de búsqueda de productos
document.getElementById("searchButton").addEventListener("click", async () => {
  const searchInput = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  if (searchInput === "") {
    alert("Ingrese un nombre de producto para buscar.");
    return;
  }

  try {
    const productosRef = collection(db, "productos");
    const querySnapshot = await getDocs(productosRef);

    let productosEncontrados = [];

    querySnapshot.forEach((doc) => {
      let producto = doc.data();
      if (producto.name.toLowerCase().includes(searchInput)) {
        productosEncontrados.push({ id: doc.id, ...producto });
      }
    });

    if (productosEncontrados.length > 0) {
      mostrarProductosEnModal(productosEncontrados);
    } else {
      alert("No se encontraron productos.");
    }
  } catch (error) {
    console.error("Error al buscar productos:", error);
  }
});

// Función de búsqueda de clientes
document
  .getElementById("searchClientButton")
  .addEventListener("click", async () => {
    const searchInputClient = document
      .getElementById("searchInputClient")
      .value.trim()
      .toLowerCase();
    if (searchInputClient === "") {
      alert("Ingrese un nombre de cliente para buscar.");
      return;
    }
    try {
      const clientesRef = collection(db, "clientes");
      const querySnapshot = await getDocs(clientesRef);

      let clientesEncontrados = [];

      querySnapshot.forEach((doc) => {
        let cliente = doc.data();
        if (cliente.name.toLowerCase().includes(searchInputClient)) {
          clientesEncontrados.push({ id: doc.id, ...cliente });
        }
      });

      if (clientesEncontrados.length > 0) {
        mostrarClientesEnModal(clientesEncontrados);
      } else {
        alert("No se encontraron clientes.");
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error);
    }
  });

document.getElementById("searchInputClient").addEventListener("input", (event) => {
  delete event.currentTarget.dataset.clientId;
});

// Función para mostrar productos en un modal
function mostrarProductosEnModal(productos) {
  let modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = "";

  productos.forEach((producto) => {
    let div = document.createElement("div");
    div.classList.add(
      "producto-item",
      "p-2",
      "border",
      "mb-2",
      "d-flex",
      "justify-content-between",
    );
    div.innerHTML = `
            <span>${producto.name} - $${producto.price}</span>
            <button 
    class="btn btn-success btn-sm seleccionar-producto"
    data-id="${producto.id}"
    data-nombre="${producto.name}"
    data-precio="${producto.price}"
    data-costo="${producto.cost}"
    data-stock="${producto.stock}">
    Seleccionar
</button>
        `;
    modalBody.appendChild(div);
  });

  let modal = new bootstrap.Modal(document.getElementById("productModal"));
  modal.show();

  document.querySelectorAll(".seleccionar-producto").forEach((button) => {
    button.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const nombre = this.getAttribute("data-nombre");
      const precio = parseFloat(this.getAttribute("data-precio")) || 0;
      const costo = parseFloat(this.getAttribute("data-costo")) || 0;
      const stock = parseInt(this.getAttribute("data-stock")) || 0;

      agregarATabla(id, nombre, precio, costo, stock);

      modal.hide();
    });
  });
}

// Función para mostrar clientes en un modal y permitir su selección
function mostrarClientesEnModal(clientes) {
  const modalBody = document.getElementById("clientModalBody");
  modalBody.innerHTML = "";

  clientes.forEach((cliente) => {
    const clienteItem = document.createElement("div");
    clienteItem.classList.add("cliente-item");
    clienteItem.innerHTML = `
      <div class="cliente-info">
        <strong>${cliente.name} ${cliente.surname || ""}</strong>
        <span>DNI: ${cliente.dni || "No informado"}</span>
        <span>${cliente.phone || "Sin teléfono"} · ${cliente.email || "Sin email"}</span>
      </div>
      <button
        type="button"
        class="btn btn-success btn-sm seleccionar-cliente"
        data-id="${cliente.id}"
        data-name="${cliente.name}"
        data-surname="${cliente.surname || ""}"
      >
        Seleccionar
      </button>
    `;
    modalBody.appendChild(clienteItem);
  });

  const modalElement = document.getElementById("clientModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();

  modalBody.querySelectorAll(".seleccionar-cliente").forEach((button) => {
    button.addEventListener("click", () => {
      const nombreCompleto = `${button.dataset.name} ${button.dataset.surname}`.trim();
      const input = document.getElementById("searchInputClient");
      input.value = nombreCompleto;
      input.dataset.clientId = button.dataset.id;
      modal.hide();
    });
  });
}

// Array para almacenar los productos agregados a la tabla
let productosEnTabla = [];

// Función para agregar un producto a la tabla
window.agregarATabla = function (id, nombre, precio, costo, stock) {
  let table = document.getElementById("table");
  let tbody = table.querySelector("tbody");

  let row = tbody.insertRow();

  row.insertCell(0).textContent = nombre;
  row.insertCell(1).textContent = `$${precio.toFixed(2)}`;

  let cantidadCell = row.insertCell(2);
  let cantidadInput = document.createElement("input");
  cantidadInput.type = "number";
  cantidadInput.value = 1;
  cantidadInput.min = 1;
  cantidadInput.classList.add("form-control", "cantidad");
  cantidadInput.addEventListener("input", actualizarTotal);
  cantidadCell.appendChild(cantidadInput);

  let descuentoCell = row.insertCell(3);
  let descuentoInput = document.createElement("input");
  descuentoInput.type = "number";
  descuentoInput.value = 0;
  descuentoInput.min = 0;
  descuentoInput.max = 100;
  descuentoInput.classList.add("form-control", "descuento");
  descuentoInput.addEventListener("input", actualizarTotal);
  descuentoCell.appendChild(descuentoInput);

  let totalCell = row.insertCell(4);
  totalCell.textContent = `$${precio.toFixed(2)}`;
  totalCell.classList.add("total");

  let actionCell = row.insertCell(5);
  actionCell.classList.add("text-center");
  let deleteButton = document.createElement("button");
  deleteButton.classList.add("btn", "btn-danger", "btn-sm");
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.addEventListener("click", function () {
    row.remove();
    productosEnTabla = productosEnTabla.filter((p) => p.row !== row);
    actualizarTotalGeneral();
  });
  actionCell.appendChild(deleteButton);

  productosEnTabla.push({
    id,
    nombre,
    precio,
    costo,
    stock,
    cantidad: 1,
    descuento: 0,
    row,
  });

  actualizarTotalGeneral();
};

// Función para actualizar el total de cada fila
function actualizarTotal() {
  let row = this.closest("tr");
  let cantidad = parseFloat(row.querySelector(".cantidad").value) || 1;
  let descuento = parseFloat(row.querySelector(".descuento").value) || 0;
  let precio = parseFloat(row.cells[1].textContent.replace("$", ""));

  let total = precio * cantidad * (1 - descuento / 100);
  row.querySelector(".total").textContent = `$${total.toFixed(2)}`;

  let producto = productosEnTabla.find((p) => p.row === row);
  if (producto) {
    producto.cantidad = cantidad;
    producto.descuento = descuento;
  }

  actualizarTotalGeneral();
}

// Función para calcular el total general
function actualizarTotalGeneral() {
  let totalGeneral = 0;
  document.querySelectorAll(".total").forEach((cell) => {
    totalGeneral += parseFloat(cell.textContent.replace("$", "")) || 0;
  });

  document.getElementById("totalGeneral").textContent =
    `$${totalGeneral.toFixed(2)}`;
}

// ACTUALIZAR TOTAL SEGÚN FORMA DE PAGO

function actualizarMontoPago() {
  let total =
    parseFloat(
      document.getElementById("totalGeneral").textContent.replace("$", ""),
    ) || 0;

  const formaPago = document.querySelector('input[name="formaPago"]:checked');

  let totalFinal = total;

  if (formaPago) {
    if (formaPago.value === "credito") {
      const cuotas = Number(document.getElementById("cuotas").value);

      switch (cuotas) {
        case 3:
          totalFinal *= 1.15;
          break;

        case 6:
          totalFinal *= 1.25;
          break;

        case 12:
          totalFinal *= 1.3;
          break;
      }
    }
  }

  document.getElementById("totalToPay").textContent =
    `Monto Total a Pagar: $${totalFinal.toFixed(2)}`;
}

// Función para mostrar el modal de pago
document.getElementById("payButton").addEventListener("click", () => {
  let totalGeneral = parseFloat(
    document.getElementById("totalGeneral").textContent.replace("$", ""),
  );

  if (totalGeneral <= 0) {
    Swal.fire({
      title: "Venta vacía",
      text: "Agregá al menos un producto antes de cobrar.",
      icon: "warning",
    });

    return;
  }

  // Mostrar total
  actualizarMontoPago();

  // Limpiar selección anterior
  document
    .querySelectorAll('input[name="formaPago"]')
    .forEach((input) => (input.checked = false));

  // Ocultar cuotas
  document.getElementById("creditoContainer").style.display = "none";

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById("payModal"));

  modal.show();
});

//Mostrar cuotas cuando eligen crédito
document.querySelectorAll('input[name="formaPago"]').forEach((input) => {
  input.addEventListener("change", () => {
    const creditoContainer = document.getElementById("creditoContainer");

    if (input.value === "credito" && input.checked) {
      creditoContainer.style.display = "block";
    } else if (input.checked) {
      creditoContainer.style.display = "none";
    }

    actualizarMontoPago();
  });
});

document
  .getElementById("cuotas")
  .addEventListener("change", actualizarMontoPago);

// Función para realizar el pago y actualizar la vista
document
  .getElementById("finalizarPagoButton")
  .addEventListener("click", async () => {
    try {
      // 1. VERIFICAR FORMA DE PAGO

      const formaPagoSeleccionada = document.querySelector(
        'input[name="formaPago"]:checked',
      );

      if (!formaPagoSeleccionada) {
        Swal.fire({
          title: "Seleccioná un medio de pago",
          text: "Debés indicar cómo pagó el cliente.",
          icon: "warning",
        });

        return;
      }

      const formaPago = formaPagoSeleccionada.value;

      const clienteInput = document.getElementById("searchInputClient");
      const clienteId = clienteInput.dataset.clientId;

      if (!clienteId) {
        Swal.fire({
          title: "Seleccioná un cliente",
          text: "Buscá y seleccioná un cliente antes de confirmar la venta.",
          icon: "warning",
        });

        return;
      }

      const cuotas =
        formaPago === "credito"
          ? Number(document.getElementById("cuotas").value)
          : 1;

      // 2. CALCULAR LA VENTA

      let subtotal = 0;
      let descuentoTotal = 0;
      let total = 0;
      let costoTotal = 0;
      let gananciaTotal = 0;

      const productosVenta = productosEnTabla.map((producto) => {
        const subtotalProducto = producto.precio * producto.cantidad;

        const descuentoProducto = subtotalProducto * (producto.descuento / 100);

        const totalProducto = subtotalProducto - descuentoProducto;

        // Costo real del producto
        const costoProducto = producto.costo * producto.cantidad;

        // Ganancia bruta
        const gananciaProducto = totalProducto - costoProducto;

        subtotal += subtotalProducto;
        descuentoTotal += descuentoProducto;
        total += totalProducto;
        costoTotal += costoProducto;
        gananciaTotal += gananciaProducto;

        return {
          id: producto.id,
          nombre: producto.nombre,

          precio: producto.precio,
          costo: producto.costo,

          cantidad: producto.cantidad,
          descuento: producto.descuento,

          subtotal: subtotalProducto,
          total: totalProducto,

          ganancia: gananciaProducto,
        };
      });
      let totalFinal = total;

      if (formaPago === "credito") {
        switch (cuotas) {
          case 3:
            totalFinal *= 1.15;
            break;

          case 6:
            totalFinal *= 1.25;
            break;

          case 12:
            totalFinal *= 1.3;
            break;
        }
      }

      // 3. USUARIO ACTUAL

      const user = auth.currentUser;
      const usuarioNombre =
        sessionStorage.getItem("usuarioNombre") ||
        user?.displayName ||
        "Usuario desconocido";

      // 4. CREAR DATOS DE LA VENTA

      const ventaData = {
        clienteId: clienteId,

        clienteNombre: clienteInput.value,

        usuarioId: user ? user.uid : null,

        usuarioNombre: usuarioNombre,

        productos: productosVenta,

        subtotal: subtotal,

        descuentoTotal: descuentoTotal,

        total: totalFinal,

        costoTotal: costoTotal,

        gananciaTotal: gananciaTotal,

        formaPago: formaPago,

        cuotas: cuotas,
      };
      // 5. GUARDAR VENTA

      const ventaId = await registrarVenta(ventaData);

      // 7. ACTUALIZAR PEDIDOS

      const pedidoData = productosEnTabla.map((producto) => ({
        producto: producto.nombre,
        cantidad: producto.cantidad,
      }));

      await saveOrUpdatePedido(pedidoData);

      // 8. MOSTRAR CONFIRMACIÓN

      Swal.fire({
        title: "¡Éxito!",
        text: "Venta realizada correctamente",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
      });

      // 9. CERRAR MODAL

      const payModalElement = document.getElementById("payModal");

      const payModalInstance = bootstrap.Modal.getInstance(payModalElement);

      if (payModalInstance) {
        payModalInstance.hide();
      }

      // 10. LIMPIAR VENTA

      document.getElementById("table").querySelector("tbody").innerHTML = "";

      productosEnTabla = [];

      document.getElementById("totalGeneral").textContent = "$0.00";

      clienteInput.value = "";
      delete clienteInput.dataset.clientId;

      // 11. ACTUALIZAR VISTA

      await actualizarVistaCompleta();
    } catch (error) {
      console.error("Error en el proceso completo:", error);

      Swal.fire({
        title: "Error",
        text: `No se pudo completar la venta: ${error.message}`,
        icon: "error",
      });
    }
  });
