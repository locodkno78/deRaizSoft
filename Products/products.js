import {
  saveFormProd,
  getFormProd,
  deleteProduct,
  getProducto,
  updateProduct,
} from "../firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { auth } from "../firebase.js";

// VARIABLES

const productosTable = document.getElementById("table");
const openModal = document.getElementById("openRegisterModal");
const modal = document.getElementById("newCustomer");
const closeModal = document.getElementById("closeRegisterModal");
const registerForm = document.getElementById("register-form");

// NOTIFICACIÓN

const showNotification = (message, type = "success") => {
  const notificationElement = document.getElementById("notification");

  if (!notificationElement) return;

  notificationElement.textContent = message;

  notificationElement.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;

  notificationElement.style.zIndex = "1100";

  setTimeout(() => {
    notificationElement.textContent = "";
  }, 3000);
};

// TABLA

const resetTable = () => {
  document.querySelectorAll("#table tbody tr").forEach((row) => {
    row.style.display = "";
  });
};

const performSearch = (searchTerm) => {
  const rows = document.querySelectorAll("#table tbody tr");

  searchTerm = searchTerm.toLowerCase().trim();

  rows.forEach((row) => {
    const rowData = row.textContent.toLowerCase();

    row.style.display = rowData.includes(searchTerm) ? "" : "none";
  });
};

// VER PRODUCTO

const showProductModal = (productData) => {
  const fields = [
    "name",
    "quantity",
    "cost",
    "price",
    "stock",    
  ];

  fields.forEach((field) => {
    const element = document.getElementById(field);

    if (!element) return;

    element.textContent =
      productData[field] !== undefined && productData[field] !== null
        ? productData[field]
        : "No disponible";
  });

  const modalElement = document.getElementById("viewProduct");

  if (modalElement) {
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }
};

// FORMULARIO EDITAR

const fillEditForm = (productData, productId) => {
  const editForm = document.getElementById("edit-form");

  if (!editForm) return;

  Object.keys(productData).forEach((key) => {
    if (editForm.elements[key]) {
      editForm.elements[key].value = productData[key];
    }
  });

  editForm.setAttribute("data-id", productId);
};

// ACTUALIZAR TABLA

const updateTable = (querySnapshot) => {
  const columns = [
    "Nombre",
    "Cantidad",
    "Costo",
    "Precio venta",
    "Stock",
    "Estado",
    "Acciones",
  ];

  const productosArray = [];

  querySnapshot.forEach((docSnap) => {
    productosArray.push({
      id: docSnap.id,

      ...docSnap.data(),
    });
  });

  // ORDEN ALFABÉTICO //
  

  productosArray.sort((a, b) =>
    (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase()),
  );

  let html = `

    <thead>

      <tr>

        ${columns.map((col) => `<th>${col}</th>`).join("")}

      </tr>

    </thead>

    <tbody>

  `;

  productosArray.forEach((producto) => {
    const stock = Number(producto.stock) || 0;

    let estado = "";
    let claseEstado = "";

    if (stock === 0) {
      estado = "SIN STOCK";
      claseEstado = "bg-danger";
    } else {
      estado = "OK";
      claseEstado = "bg-success";
    }

    const botonesProducto = `

        <button
          class="btn btn-warning button-edit"
          data-id="${producto.id}"
          title="Editar producto"
        >

          <i class="fas fa-pencil-alt"></i>

        </button>


        <button
          class="btn btn-danger button-delete"
          data-id="${producto.id}"
          title="Eliminar producto"
        >

          <i class="fas fa-trash"></i>

        </button>

      `;

    html += `

      <tr>

        <td>
          ${producto.name || "Sin nombre"}
        </td>


        <td>
          <strong>
            ${Number(producto.quantity || 0)}
          </strong>
        </td>


        <td>

          $${Number(producto.cost || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}

        </td>


        <td>

          $${Number(producto.price || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}

        </td>


        <td>
          <strong>${stock}</strong>
        </td>

        <td>
          <span class="badge ${claseEstado}">${estado}</span>
        </td>

        <td>

          <button
            class="btn btn-success button-view"
            data-id="${producto.id}"
            title="Ver producto"
          >

            <i class="fas fa-eye"></i>

          </button>

          ${botonesProducto}

        </td>

      </tr>

    `;
  });

  html += "</tbody>";

  productosTable.innerHTML = html;

  // BOTÓN VER //

  productosTable.querySelectorAll(".button-view").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const id = event.currentTarget.getAttribute("data-id");

      try {
        const data = await getProducto(id);

        if (data) {
          showProductModal(data);
        }
      } catch (error) {
        console.error("Error al obtener producto:", error);
      }
    });
  });

  // EDITAR //

  productosTable.querySelectorAll(".button-edit").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const id = event.currentTarget.getAttribute("data-id");

      try {
        const data = await getProducto(id);

        if (data) {
          fillEditForm(data, id);

          const modalElement = document.getElementById("editProducto");

          if (modalElement) {
            bootstrap.Modal.getOrCreateInstance(modalElement).show();
          }
        }
      } catch (error) {
        console.error("Error al obtener producto:", error);
      }
    });
  });

  // ELIMINAR // 

  productosTable.querySelectorAll(".button-delete").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const id = event.currentTarget.getAttribute("data-id");

      const confirmar = await Swal.fire({
        title: "¿Eliminar producto?",

        text: "Esta acción no se puede deshacer.",

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar",
      });

      if (!confirmar.isConfirmed) {
        return;
      }

      try {
        await deleteProduct(id);

        updateTable(await getFormProd());

        showNotification("Producto eliminado correctamente", "success");
      } catch (error) {
        console.error("Error al eliminar:", error);

        showNotification("No se pudo eliminar el producto", "danger");
      }
    });
  });
};

// NUEVO PRODUCTO

const configurarNuevoProducto = () => {
  if (!registerForm) {
    return;
  }

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const name = registerForm.elements.name.value.trim();

      const quantity = Number(registerForm.elements.quantity.value);

      const cost = Number(registerForm.elements.cost.value);

      const price = Number(registerForm.elements.price.value);

      const stock = Number(registerForm.elements.stock.value);

      await saveFormProd(name, quantity, cost, price, stock);

      registerForm.reset();

      const modalInstance = bootstrap.Modal.getInstance(modal);

      if (modalInstance) {
        modalInstance.hide();
      }

      updateTable(await getFormProd());

      showNotification("Producto creado correctamente", "success");
    } catch (error) {
      console.error("Error al crear producto:", error);

      showNotification("No se pudo crear el producto", "danger");
    }
  });
};

// MODAL NUEVO PRODUCTO

const configurarModalNuevoProducto = () => {
  if (openModal) {
    openModal.addEventListener("click", () => {
      bootstrap.Modal.getOrCreateInstance(modal).show();
    });
  }
};

// CERRAR MODALES

const configurarModales = () => {
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      const instance = bootstrap.Modal.getInstance(modal);

      if (instance) {
        instance.hide();
      }
    });
  }

  const closeEditModal = document.getElementById("closeEditModal");

  if (closeEditModal) {
    closeEditModal.addEventListener("click", () => {
      const modalElement = document.getElementById("editProducto");

      const instance = bootstrap.Modal.getInstance(modalElement);

      if (instance) {
        instance.hide();
      }
    });
  }

  const closeViewModal = document.getElementById("closeViewModal");

  if (closeViewModal) {
    closeViewModal.addEventListener("click", () => {
      const modalElement = document.getElementById("viewProduct");

      const instance = bootstrap.Modal.getInstance(modalElement);

      if (instance) {
        instance.hide();
      }
    });
  }
};

// FORMULARIO EDITAR

const configurarEdicion = () => {
  const editForm = document.getElementById("edit-form");

  if (!editForm) return;

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const productId = editForm.getAttribute("data-id");

      const newData = {
        name: editForm.elements.name.value.trim(),

        quantity: Number(editForm.elements.quantity.value),

        cost: Number(editForm.elements.cost.value),

        price: Number(editForm.elements.price.value),

        stock: Number(editForm.elements.stock.value),
        
      };

      await updateProduct(productId, newData);

      const modalElement = document.getElementById("editProducto");

      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance) {
        modalInstance.hide();
      }

      updateTable(await getFormProd());

      showNotification("Producto actualizado correctamente", "success");
    } catch (error) {
      console.error("Error al actualizar producto:", error);

      showNotification("No se pudo actualizar el producto", "danger");
    }
  });
};

// BUSCADOR

const configurarBuscador = () => {
  const searchButton = document.getElementById("searchButton");

  const searchInput = document.getElementById("searchInput");

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      performSearch(searchInput.value);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      if (event.target.value === "") {
        resetTable();
      }
    });
  }
};

// FILTRO STOCK BAJO

const configurarFiltroStock = () => {
  const btnStockBajo = document.getElementById("btnStockBajo");
  const btnTodosProductos = document.getElementById("btnTodosProductos");

  if (btnStockBajo) {
    btnStockBajo.addEventListener("click", () => {
      document.querySelectorAll("#table tbody tr").forEach((fila) => {
        const estado = fila.cells[5].textContent.trim();

        if (estado === "OK") {
          fila.style.display = "none";
        } else {
          fila.style.display = "";
        }
      });
    });
  }

  if (btnTodosProductos) {
    btnTodosProductos.addEventListener("click", () => {
      resetTable();
    });
  }
};

// INICIO

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const usuario = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!usuario) {
      window.location.href = "../login.html";
      return;
    }

    // CARGAR PRODUCTOS

    const productos = await getFormProd();

    updateTable(productos);

    // CONFIGURAR FUNCIONES

    configurarNuevoProducto();
    configurarModalNuevoProducto();
    configurarModales();
    configurarEdicion();
    configurarBuscador();
    configurarFiltroStock();
  } catch (error) {
    console.error("Error al inicializar Productos:", error);

    if (error.code === "permission-denied") {
      showNotification(
        auth.currentUser
          ? "Firestore rechazó el acceso. Verifica que las reglas estén publicadas en el proyecto socios-a1064."
          : "No hay una sesión activa. Inicia sesión nuevamente.",
        "danger",
      );
    }

    Swal.fire({
      title: "Error",
      text: "No se pudo cargar la sección Productos.",
      icon: "error",
    });
  }
});
