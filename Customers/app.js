import {
  saveForm,
  getForm,
  deleteCliente,
  updateCliente,
  getCliente,  
} from "../firebase.js";


const clientesTable = document.getElementById("table");
const openModal = document.getElementById("openRegisterModal");
const modal = document.getElementById("newCustomer");
const closeModal = document.getElementById("closeRegisterModal");
const registerForm = document.getElementById("register-form");

// Carga la tabla con datos
function updateTable(querySnapshot) {
  const columnNames = [
    "DNI",
    "Nombre",
    "Apellido",
    "Fecha de Nacimiento",
    "Dirección",
    "Teléfono",
    "Email",    
    "Descripción",
    "Acciones"
  ];

  let html = `
    <thead>
      <tr>${columnNames.map(columnName => `<th>${columnName}</th>`).join('')}</tr>
    </thead>
    <tbody>`;

  querySnapshot.forEach((doc) => {
    const clientesData = doc.data();

    html += `
      <tr>
        <td>${clientesData.dni}</td>
        <td>${clientesData.name}</td>
        <td>${clientesData.surname}</td>
        <td>${clientesData.date}</td>
        <td>${clientesData.address}</td>
        <td>${clientesData.phone}</td>
        <td>${clientesData.email}</td>        
        <td>${clientesData.description}</td>
        <td>
          <button type="button" class="btn btn-success button-view" data-bs-toggle="modal" data-bs-target="#viewCustomer" data-id="${doc.id}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Tooltip on top">
            <i class="fas fa-sharp fa-solid fa-eye"></i>
          </button>
          <button type="button" class="btn btn-info button-cliente" data-id="${doc.id}">
            <i class="fas fa-user"></i>
          </button>
          <button type="button" class="btn btn-warning button-edit" data-bs-toggle="modal" data-bs-target="#editCustomer" data-id="${doc.id}">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button type="button" class="btn btn-danger button-delete" data-id=${doc.id}>
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  });

  html += '</tbody>';
  clientesTable.innerHTML = html;

  const buttonView = clientesTable.querySelectorAll(".button-view");
  buttonView.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const clienteId = e.currentTarget.getAttribute("data-id");
      const clienteData = await getCliente(clienteId);
      if (clienteData !== null) {
        showClienteModal(clienteData);
      } else {
        console.log("Cliente no encontrado");
      }
    });
  });

  const buttonUpDate = clientesTable.querySelectorAll(".button-edit");
  const editForm = document.getElementById("edit-form");

  buttonUpDate.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const clienteId = e.currentTarget.getAttribute("data-id");
      const clienteData = await getCliente(clienteId);

      if (clienteData !== null) {
        // Llenar el formulario con los datos existentes
        const editForm = document.getElementById("edit-form");
        editForm.elements["dni"].value = clienteData.dni;
        editForm.elements["name"].value = clienteData.name;
        editForm.elements["surname"].value = clienteData.surname;
        editForm.elements["date"].value = clienteData.date;
        editForm.elements["address"].value = clienteData.address;
        editForm.elements["phone"].value = clienteData.phone;
        editForm.elements["email"].value = clienteData.email;       
        editForm.elements["description"].value = clienteData.description;

        // Mostrar el formulario de edición
        const editModal = document.getElementById("editCustomer");
        editModal.classList.add("is-active");

        // También se puedes añadir el clienteId al formulario si se lo necesita después
        editForm.setAttribute("data-id", clienteId);
        
        editForm.removeEventListener("submit", handleEditSubmit);

        // Agregar el evento submit al formulario
        editForm.addEventListener("submit", handleEditSubmit);
      } else {
        console.log("Cliente no encontrado");
      }
    });
  });

  // Función que maneja el envío del formulario
  const handleEditSubmit = async (event) => {
    event.preventDefault();

    // Obtener el clienteId del formulario
    const clienteId = event.currentTarget.getAttribute("data-id");

    // Obtener los nuevos datos del formulario
    const newData = {
      dni: editForm.elements["dni"].value,
      name: editForm.elements["name"].value,
      surname: editForm.elements["surname"].value,
      date: editForm.elements["date"].value,
      address: editForm.elements["address"].value,
      phone: editForm.elements["phone"].value,
      email: editForm.elements["email"].value,      
      description: editForm.elements["description"].value,
    };

    try {
      // Actualizar el cliente
      await updateCliente(clienteId, newData);

      // Actualizar la tabla después de la edición 
      const updatedQuerySnapshot = await getForm();
      updateTable(updatedQuerySnapshot);
      showNotification("Edición Correcta");

      // Cerrar el modal después de actualizar
      const editModal = document.getElementById("editCustomer");
      const bootstrapModal = bootstrap.Modal.getInstance(editModal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      showNotification("Error al guardar los cambios", "error");
    }
  };
  const buttonDelete = clientesTable.querySelectorAll(".button-delete");
  buttonDelete.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const clienteId = e.currentTarget.getAttribute("data-id");
      await deleteCliente(clienteId);
      const updatedQuerySnapshot = await getForm();
      updateTable(updatedQuerySnapshot);

      showNotification("Cliente eliminado correctamente");
    });
  });


  const botonesClientes = document.querySelectorAll(".button-cliente");
  botonesClientes.forEach(function (botonCliente) {
    botonCliente.addEventListener("click", function () {
      const filaCliente = this.closest("tr");
      const nombreCliente = filaCliente.querySelector("td:nth-child(2)").textContent;
      const apellidoCliente = filaCliente.querySelector("td:nth-child(3)").textContent;
      const dniCliente = filaCliente.querySelector("td:nth-child(1)").textContent;
      const dateCliente = filaCliente.querySelector("td:nth-child(4)").textContent;
      const clienteId = this.getAttribute("data-id");

      const parametros = new URLSearchParams({
        nombre: nombreCliente,
        apellido: apellidoCliente,
        dni: dniCliente,
        date: dateCliente,
        clienteId,
      });

      window.location.href = `Account/account.html?${parametros.toString()}`;
    });
  });

  function showClienteModal(clienteData) {
    const dniElement = document.getElementById("dni");
    const nameElement = document.getElementById("name");
    const surnameElement = document.getElementById("surname");
    const dateElement = document.getElementById("date");
    const addressElement = document.getElementById("address");
    const phoneElement = document.getElementById("phone");
    const emailElement = document.getElementById("email");    
    const descriptionElement = document.getElementById("description");

    dniElement.textContent = clienteData.dni;
    nameElement.textContent = clienteData.name;
    surnameElement.textContent = clienteData.surname;
    dateElement.textContent = clienteData.date;
    addressElement.textContent = clienteData.address;
    phoneElement.textContent = clienteData.phone;
    emailElement.textContent = clienteData.email;    
    descriptionElement.textContent = clienteData.description;

    const clienteModal = document.getElementById("viewCustomer");
    clienteModal.classList.add("is-active");
  }

  const closeClienteModalButton = document.getElementById("closeViewModal");
  closeClienteModalButton.addEventListener("click", () => {
    const clienteModal = document.getElementById("viewCustomer");
    clienteModal.classList.remove("is-active");
  })
}

window.addEventListener("DOMContentLoaded", async (e) => {
  const querySnapshot = await getForm();
  updateTable(querySnapshot);
  
});

const showRegisterModal = () => {
  modal.classList.toggle("is-active");
};

openModal.addEventListener("click", showRegisterModal);
closeModal.addEventListener("click", showRegisterModal);

const closeRegisterModal = () => {
  modal.classList.remove("is-active");
};

closeModal.addEventListener("click", closeRegisterModal);

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dni = registerForm["dni"].value;
  const name = registerForm["name"].value;
  const surname = registerForm["surname"].value;
  const date = registerForm["date"].value;
  const address = registerForm["address"].value;
  const phone = registerForm["phone"].value;
  const email = registerForm["email"].value;  
  const description = registerForm["description"].value;

  await saveForm(dni, name, surname, date, address, phone, email, description);
  registerForm.reset();
  closeRegisterModal();
  const updatedQuerySnapshot = await getForm();
  updateTable(updatedQuerySnapshot);
  showNotification("Cliente creado correctamente");
});

const closeEditModalButton = document.getElementById("closeEditModal");
closeEditModalButton.addEventListener("click", () => {
  const editModal = document.getElementById("edit-form");
  editModal.classList.remove("is-active");
});

clientesTable.addEventListener("click", async (e) => {
  if (e.target.classList.contains("button-edit")) {
    const clienteId = e.target.getAttribute("data-id");
    const clienteData = await getCliente(clienteId);

    const editForm = document.getElementById("edit-form");
    editForm.elements["dni"].value = clienteData.dni;
    editForm.elements["name"].value = clienteData.name;
    editForm.elements["surname"].value = clienteData.surname;
    editForm.elements["date"].value = clienteData.date;
    editForm.elements["address"].value = clienteData.address;
    editForm.elements["phone"].value = clienteData.phone;
    editForm.elements["email"].value = clienteData.email;    
    editForm.elements["description"].value = clienteData.description;

    const editModal = document.getElementById("edit-form");
    editModal.classList.add("is-active");
    editForm.setAttribute("data-id", clienteId);
  }
});

const searchButton = document.getElementById("searchButton");
searchButton.addEventListener("click", () => {
  const searchTerm = document.getElementById("searchInput").value;
  performSearch(searchTerm);
});

function performSearch(searchTerm) {
  const rows = document.querySelectorAll("#table tbody tr");
  searchTerm = searchTerm.toLowerCase();

  rows.forEach((row) => {
    const rowData = row.textContent.toLowerCase();
    if (rowData.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value;
  if (searchTerm === "") {
    resetTable();
  }
});
// Función para mostrar la notificación
function showNotification(message) {
  const notificationElement = document.getElementById("notification");
  notificationElement.textContent = message;

  // Agrega estilos de diseño o clases 
  notificationElement.style.backgroundColor = "#08C706"; // Fondo verde
  notificationElement.style.color = "white"; // Texto blanco
  notificationElement.style.fontSize = "30px";

  // Muestra la notificación por 3 segundos
  setTimeout(() => {
    notificationElement.textContent = "";
  }, 3000);
}

function resetTable() {
  const rows = document.querySelectorAll("#table tbody tr");
  rows.forEach((row) => {
    row.style.display = "";
  });
}



