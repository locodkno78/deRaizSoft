import {
  getPedidos,
  getFormProd,
  resetProductoPedidos,
  deleteAllPedidos,
  agregarProductoPedido,
  actualizarCantidadPedido,
} from "../firebase.js";


// =====================================================
// ELEMENTOS
// =====================================================

const pedidosTable =
  document.getElementById("table");

const searchButton =
  document.getElementById("searchButton");

const searchInput =
  document.getElementById("searchInput");

const deleteAllButton =
  document.getElementById("deleteAllPedidos");

const printButton =
  document.getElementById("print");

const addProductButton =
  document.getElementById("addProductPedido");


// =====================================================
// ESTADO
// =====================================================

let productosDisponibles = [];

let productoSeleccionado = null;


// =====================================================
// NOTIFICACIÓN
// =====================================================

function showNotification(
  message,
  tipo = "success"
) {

  const element =
    document.getElementById("notification");

  if (!element) return;

  element.textContent =
    message;

  element.style.backgroundColor =
    tipo === "error"
      ? "#dc3545"
      : "#08C706";

  element.style.color =
    "white";

  element.style.fontSize =
    "20px";

  setTimeout(() => {

    element.textContent = "";

  }, 3000);

}


// =====================================================
// CARGAR PEDIDOS
// =====================================================

async function cargarPedidos() {

  try {

    const snapshot =
      await getPedidos();

    updateTable(snapshot);

  } catch (error) {

    console.error(
      "Error al cargar pedidos:",
      error
    );

    showNotification(
      "No se pudieron cargar los pedidos.",
      "error"
    );

  }

}


// =====================================================
// ACTUALIZAR TABLA
// =====================================================

function updateTable(querySnapshot) {

  const productosAcumulados = {};


  // ===================================================
  // ACUMULAR
  // ===================================================

  querySnapshot.forEach((docSnap) => {

    const pedido =
      docSnap.data();


    // -----------------------------------------------
    // FORMATO NUEVO
    // -----------------------------------------------

    if (
      pedido.productos &&
      Array.isArray(pedido.productos)
    ) {

      pedido.productos.forEach((item) => {

        const cantidad =
          Number(item.cantidad);

        if (
          item.producto &&
          cantidad > 0
        ) {

          if (
            !productosAcumulados[item.producto]
          ) {

            productosAcumulados[
              item.producto
            ] = 0;

          }

          productosAcumulados[
            item.producto
          ] += cantidad;

        }

      });

    }


    // -----------------------------------------------
    // FORMATO ANTIGUO
    // -----------------------------------------------

    else if (
      pedido.producto &&
      pedido.cantidad
    ) {

      const cantidad =
        Number(pedido.cantidad);

      if (cantidad > 0) {

        if (
          !productosAcumulados[
            pedido.producto
          ]
        ) {

          productosAcumulados[
            pedido.producto
          ] = 0;

        }

        productosAcumulados[
          pedido.producto
        ] += cantidad;

      }

    }

  });


  // ===================================================
  // CONSTRUIR TABLA
  // ===================================================

  let html = `

    <thead>

      <tr>

        <th>Producto</th>

        <th>Cantidad</th>

        <th>Acciones</th>

      </tr>

    </thead>

    <tbody>

  `;


  const productos =
    Object.keys(productosAcumulados)
      .sort((a, b) =>
        a.localeCompare(b, "es")
      );


  // ===================================================
  // SIN PEDIDOS
  // ===================================================

  if (
    productos.length === 0
  ) {

    html += `

      <tr>

        <td
          colspan="3"
          class="text-center text-muted py-4"
        >

          <i class="fas fa-check-circle fa-2x mb-2"></i>

          <br>

          No hay productos pendientes de pedido.

        </td>

      </tr>

    `;

  }


  // ===================================================
  // PRODUCTOS
  // ===================================================

  productos.forEach((producto) => {

    const cantidad =
      productosAcumulados[producto];


    const accionesPedido = `

          <button
            type="button"
            class="btn btn-warning btn-sm button-edit"
            data-producto="${producto}"
            data-cantidad="${cantidad}"
            title="Editar cantidad"
          >

            <i class="fas fa-pencil-alt"></i>

          </button>

          <button
            type="button"
            class="btn btn-danger btn-sm button-delete"
            data-producto="${producto}"
            title="Eliminar producto"
          >

            <i class="fas fa-trash"></i>

          </button>

        `;


    html += `

      <tr>

        <td>

          <strong>
            ${producto}
          </strong>

        </td>


        <td>

          <span class="badge bg-primary fs-6">
            ${cantidad}
          </span>

        </td>


        <td>

          <button
            type="button"
            class="btn btn-success btn-sm button-view"
            data-producto="${producto}"
            data-cantidad="${cantidad}"
            title="Ver detalle"
          >

            <i class="fas fa-eye"></i>

          </button>

          ${accionesPedido}

        </td>

      </tr>

    `;

  });


  html += "</tbody>";


  pedidosTable.innerHTML =
    html;


  configurarEventosTabla();

}


// =====================================================
// EVENTOS DE TABLA
// =====================================================

function configurarEventosTabla() {


  // ===================================================
  // VER
  // ===================================================

  pedidosTable
    .querySelectorAll(".button-view")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const producto =
            button.dataset.producto;

          const cantidad =
            button.dataset.cantidad;


          document.getElementById(
            "name"
          ).textContent =
            producto;


          document.getElementById(
            "cantidad"
          ).textContent =
            cantidad;


          const modal =
            bootstrap.Modal.getOrCreateInstance(
              document.getElementById(
                "viewProducto"
              )
            );

          modal.show();

        }
      );

    });


  // ===================================================
  // EDITAR
  // ===================================================

  pedidosTable
    .querySelectorAll(".button-edit")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const producto =
            button.dataset.producto;

          const cantidad =
            button.dataset.cantidad;


          abrirModalEditar(
            producto,
            cantidad
          );

        }
      );

    });


  // ===================================================
  // ELIMINAR
  // ===================================================

  pedidosTable
    .querySelectorAll(".button-delete")
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const producto =
            button.dataset.producto;


          const confirmacion =
            await Swal.fire({

              title:
                "¿Eliminar producto?",

              text:
                `Se eliminarán todas las unidades de "${producto}" del pedido.`,

              icon:
                "warning",

              showCancelButton:
                true,

              confirmButtonText:
                "Sí, eliminar",

              cancelButtonText:
                "Cancelar",

              reverseButtons:
                true,

            });


          if (
            !confirmacion.isConfirmed
          ) {
            return;
          }


          try {

            await resetProductoPedidos(
              producto
            );

            await cargarPedidos();

            showNotification(
              "Producto eliminado del pedido."
            );

          } catch (error) {

            console.error(error);

            showNotification(
              "No se pudo eliminar el producto.",
              "error"
            );

          }

        }
      );

    });

}


// =====================================================
// MODAL EDITAR
// =====================================================

function abrirModalEditar(
  producto,
  cantidad
) {

  document.getElementById(
    "editPedidoProducto"
  ).value =
    producto;


  document.getElementById(
    "editPedidoCantidad"
  ).value =
    cantidad;


  const modal =
    bootstrap.Modal.getOrCreateInstance(
      document.getElementById(
        "editPedidoModal"
      )
    );


  modal.show();

}


// =====================================================
// GUARDAR EDICIÓN
// =====================================================

const editPedidoForm =
  document.getElementById(
    "editPedidoForm"
  );


if (editPedidoForm) {

  editPedidoForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const producto =
        document.getElementById(
          "editPedidoProducto"
        ).value.trim();


      const cantidad =
        Number(
          document.getElementById(
            "editPedidoCantidad"
          ).value
        );


      if (
        !producto ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {

        Swal.fire({

          title:
            "Cantidad inválida",

          text:
            "La cantidad debe ser un número entero mayor a 0.",

          icon:
            "warning",

        });

        return;

      }


      try {

        await actualizarCantidadPedido(
          producto,
          cantidad
        );


        const modalElement =
          document.getElementById(
            "editPedidoModal"
          );


        const modal =
          bootstrap.Modal.getInstance(
            modalElement
          );


        if (modal) {
          modal.hide();
        }


        await cargarPedidos();


        showNotification(
          "Cantidad actualizada correctamente."
        );

      } catch (error) {

        console.error(error);

        Swal.fire({

          title:
            "Error",

          text:
            error.message ||
            "No se pudo actualizar el pedido.",

          icon:
            "error",

        });

      }

    }
  );

}


// =====================================================
// ABRIR MODAL AGREGAR
// =====================================================

if (addProductButton) {

  addProductButton.addEventListener(
    "click",
    async () => {

      productoSeleccionado =
        null;


      document.getElementById(
        "productoSeleccionadoContainer"
      ).style.display =
        "none";


      document.getElementById(
        "confirmarAgregarPedido"
      ).disabled =
        true;


      document.getElementById(
        "buscarProductoPedido"
      ).value =
        "";


      const modal =
        bootstrap.Modal.getOrCreateInstance(
          document.getElementById(
            "addPedidoModal"
          )
        );


      modal.show();


      await cargarProductosDisponibles();

    }
  );

}


// =====================================================
// CARGAR PRODUCTOS DISPONIBLES
// =====================================================

async function cargarProductosDisponibles() {

  try {

    const snapshot =
      await getFormProd();


    productosDisponibles =
      [];


    snapshot.forEach((docSnap) => {

      const data =
        docSnap.data();


      if (
        data.activo !== false
      ) {

        productosDisponibles.push({

          id:
            docSnap.id,

          nombre:
            data.name || "",

          stock:
            Number(data.stock) || 0,

        });

      }

    });


    productosDisponibles.sort(
      (a, b) =>
        a.nombre.localeCompare(
          b.nombre,
          "es"
        )
    );


    mostrarProductosDisponibles(
      productosDisponibles
    );

  } catch (error) {

    console.error(
      "Error al cargar productos:",
      error
    );

    document.getElementById(
      "productosDisponiblesPedido"
    ).innerHTML = `

      <div class="alert alert-danger">
        No se pudieron cargar los productos.
      </div>

    `;

  }

}


// =====================================================
// MOSTRAR PRODUCTOS
// =====================================================

function mostrarProductosDisponibles(
  productos
) {

  const container =
    document.getElementById(
      "productosDisponiblesPedido"
    );


  if (
    productos.length === 0
  ) {

    container.innerHTML = `

      <div class="text-muted text-center p-3">
        No se encontraron productos.
      </div>

    `;

    return;

  }


  container.innerHTML =
    "";


  productos.forEach((producto) => {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "list-group-item list-group-item-action";


    button.innerHTML = `

      <div
        class="d-flex justify-content-between align-items-center"
      >

        <span>

          <strong>
            ${producto.nombre}
          </strong>

        </span>

        <span class="badge bg-secondary">
          Stock: ${producto.stock}
        </span>

      </div>

    `;


    button.addEventListener(
      "click",
      () => {

        seleccionarProducto(
          producto
        );

      }
    );


    container.appendChild(
      button
    );

  });

}


// =====================================================
// SELECCIONAR PRODUCTO
// =====================================================

function seleccionarProducto(
  producto
) {

  productoSeleccionado =
    producto;


  document.getElementById(
    "productoSeleccionadoNombre"
  ).textContent =
    producto.nombre;


  document.getElementById(
    "productoSeleccionadoStock"
  ).textContent =
    producto.stock;


  document.getElementById(
    "cantidadNuevoPedido"
  ).value =
    1;


  document.getElementById(
    "productoSeleccionadoContainer"
  ).style.display =
    "block";


  document.getElementById(
    "confirmarAgregarPedido"
  ).disabled =
    false;

}


// =====================================================
// BUSCADOR DE PRODUCTOS DEL MODAL
// =====================================================

const buscarProductoPedido =
  document.getElementById(
    "buscarProductoPedido"
  );


if (buscarProductoPedido) {

  buscarProductoPedido.addEventListener(
    "input",
    (event) => {

      const texto =
        event.target.value
          .toLowerCase()
          .trim();


      const filtrados =
        productosDisponibles.filter(
          (producto) =>
            producto.nombre
              .toLowerCase()
              .includes(texto)
        );


      mostrarProductosDisponibles(
        filtrados
      );

    }
  );

}


// =====================================================
// CONFIRMAR AGREGAR PRODUCTO
// =====================================================

const confirmarAgregar =
  document.getElementById(
    "confirmarAgregarPedido"
  );


if (confirmarAgregar) {

  confirmarAgregar.addEventListener(
    "click",
    async () => {

      if (!productoSeleccionado) {
        return;
      }


      const cantidad =
        Number(
          document.getElementById(
            "cantidadNuevoPedido"
          ).value
        );


      if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {

        Swal.fire({

          title:
            "Cantidad inválida",

          text:
            "La cantidad debe ser un número entero mayor a 0.",

          icon:
            "warning",

        });

        return;

      }


      try {

        confirmarAgregar.disabled =
          true;


        await agregarProductoPedido(
          productoSeleccionado.nombre,
          cantidad
        );


        const modalElement =
          document.getElementById(
            "addPedidoModal"
          );


        const modal =
          bootstrap.Modal.getInstance(
            modalElement
          );


        if (modal) {
          modal.hide();
        }


        await cargarPedidos();


        showNotification(
          "Producto agregado al pedido."
        );


      } catch (error) {

        console.error(error);


        Swal.fire({

          title:
            "Error",

          text:
            error.message ||
            "No se pudo agregar el producto.",

          icon:
            "error",

        });


      } finally {

        confirmarAgregar.disabled =
          false;

      }

    }
  );

}


// =====================================================
// ELIMINAR TODO
// =====================================================

if (deleteAllButton) {

  deleteAllButton.addEventListener(
      "click",
      async () => {

        const confirmacion =
          await Swal.fire({

            title:
              "¿Eliminar todo el pedido?",

            text:
              "Se eliminarán todos los productos pendientes. Esta acción no se puede deshacer.",

            icon:
              "warning",

            showCancelButton:
              true,

            confirmButtonText:
              "Sí, eliminar todo",

            cancelButtonText:
              "Cancelar",

            reverseButtons:
              true,

          });


        if (
          !confirmacion.isConfirmed
        ) {
          return;
        }


        try {

          await deleteAllPedidos();

          await cargarPedidos();


          showNotification(
            "Todos los pedidos fueron eliminados."
          );


        } catch (error) {

          console.error(error);

          showNotification(
            "No se pudieron eliminar los pedidos.",
            "error"
          );

        }

      }
  );

}


// =====================================================
// BUSCADOR
// =====================================================

function performSearch(
  searchTerm
) {

  const rows =
    document.querySelectorAll(
      "#table tbody tr"
    );


  searchTerm =
    searchTerm
      .toLowerCase()
      .trim();


  rows.forEach((row) => {

    const contenido =
      row.textContent
        .toLowerCase();


    row.style.display =
      contenido.includes(searchTerm)
        ? ""
        : "none";

  });

}


if (searchButton) {

  searchButton.addEventListener(
    "click",
    () => {

      performSearch(
        searchInput.value
      );

    }
  );

}


if (searchInput) {

  searchInput.addEventListener(
    "input",
    (event) => {

      performSearch(
        event.target.value
      );

    }
  );

}


// =====================================================
// IMPRIMIR
// =====================================================

if (printButton) {

  printButton.addEventListener(
    "click",
    () => {

      window.print();

    }
  );

}


// =====================================================
// INICIO
// =====================================================

window.addEventListener(
  "DOMContentLoaded",
  cargarPedidos
);