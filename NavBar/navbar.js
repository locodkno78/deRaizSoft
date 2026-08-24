import { auth } from "../firebase.js";

import {
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// ======================================================
// INICIO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  loadNavbar().catch((error) => {

    console.error(
      "Error inicial:",
      error
    );

    showFallbackNavbar();

  });

});


// ======================================================
// CARGAR NAVBAR
// ======================================================

async function loadNavbar() {

  try {

    const navbarUrl =
      new URL(
        "./navbar.html",
        import.meta.url
      ).href;


    const response =
      await fetch(navbarUrl);


    if (!response.ok) {

      throw new Error(
        "No se pudo cargar el navbar"
      );

    }


    const data =
      await response.text();


    const navbarContainer =
      document.getElementById(
        "navbar-placeholder"
      );


    if (!navbarContainer) {

      throw new Error(
        "Contenedor del navbar no encontrado"
      );

    }


    // ==================================================
    // INSERTAR NAVBAR
    // ==================================================

    navbarContainer.innerHTML =
      data;

    if (window.FontAwesome?.dom) {

      window.FontAwesome.dom.i2svg();

    }


    // ==================================================
    // CONFIGURAR
    // ==================================================

    setupNavbarListeners();

    setupRegistrationForm();

    updateUserInfo();

  } catch (error) {

    console.error(
      "Error cargando navbar:",
      error
    );

    throw error;

  }

}


// ======================================================
// MOSTRAR CUENTA ACTIVA
// ======================================================

function updateUserInfo() {

  const nameElement =
    document.getElementById(
      "user-name"
    );


  if (
    !nameElement
  ) {

    return;

  }


  // ====================================================
  // SESSION STORAGE
  // ====================================================

  const usuarioNombre =
    sessionStorage.getItem(
      "usuarioNombre"
    );


  // ====================================================
  // NOMBRE
  // ====================================================

  nameElement.textContent =
    usuarioNombre ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    "Usuario";


}


// ======================================================
// CONFIGURAR LISTENERS DEL NAVBAR
// ======================================================

function setupNavbarListeners() {

  // ====================================================
  // CERRAR SESIÓN
  // ====================================================

  const logoutBtn =
    document.getElementById(
      "logout"
    );


  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      handleLogout
    );

  }

}


// ======================================================
// CERRAR SESIÓN
// ======================================================

async function handleLogout(e) {

  e.preventDefault();


  try {

    // ==================================================
    // CERRAR SESIÓN FIREBASE
    // ==================================================

    await signOut(auth);


    // ==================================================
    // LIMPIAR SESSION STORAGE
    // ==================================================

    sessionStorage.removeItem(
      "usuarioNombre"
    );

    sessionStorage.removeItem(
      "usuarioId"
    );


    // ==================================================
    // VOLVER AL LOGIN
    // ==================================================

    const loginUrl =
      new URL(
        "../login.html",
        window.location.href
      ).href;


    window.location.href =
      loginUrl;


  } catch (error) {

    console.error(
      "Error al cerrar sesión:",
      error
    );


    showNotification(
      "Error al cerrar sesión",
      "danger"
    );

  }

}


// ======================================================
// FORMULARIO DE REGISTRO
// ======================================================

function setupRegistrationForm() {

  const signupForm =
    document.getElementById(
      "signup-form"
    );


  if (!signupForm) {

    return;

  }


  signupForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      // ================================================
      // OBTENER DATOS
      // ================================================

      const nombre =
        document
          .getElementById(
            "signup-name"
          )
          .value
          .trim();


      const email =
        document
          .getElementById(
            "signup-email"
          )
          .value
          .trim();


      const password =
        document.getElementById(
          "signup-password"
        ).value;


      // ================================================
      // VALIDAR
      // ================================================

      if (
        !nombre ||
        !email ||
        !password
      ) {

        showNotification(
          "Todos los campos son requeridos",
          "danger"
        );

        return;

      }


      try {

        // ==============================================
        // CREAR USUARIO
        // ==============================================

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        // ==============================================
        // ACTUALIZAR PERFIL
        // ==============================================

        await updateProfile(
          userCredential.user,
          {
            displayName:
              nombre,
          }
        );


        // ==============================================
        // CERRAR MODAL
        // ==============================================

        const modalElement =
          document.getElementById(
            "signupModal"
          );


        if (modalElement) {

          const modal =
            bootstrap.Modal
              .getInstance(
                modalElement
              );


          if (modal) {

            modal.hide();

          }

        }


        // ==============================================
        // LIMPIAR FORMULARIO
        // ==============================================

        signupForm.reset();


        // ==============================================
        // MENSAJE
        // ==============================================

        showNotification(
          "Usuario registrado exitosamente",
          "success"
        );


      } catch (error) {

        console.error(
          "Error en registro:",
          error
        );


        showNotification(
          `Error: ${error.message}`,
          "danger"
        );

      }

    }
  );

}


// ======================================================
// MOSTRAR NOTIFICACIÓN
// ======================================================

function showNotification(
  message,
  type = "success"
) {

  const notification =
    document.createElement(
      "div"
    );


  notification.className =
    `alert alert-${type} position-fixed top-0 end-0 m-3`;


  notification.style.zIndex =
    "1100";


  notification.textContent =
    message;


  document.body.appendChild(
    notification
  );


  setTimeout(
    () => notification.remove(),
    3000
  );

}


// ======================================================
// NAVBAR DE RESPALDO
// ======================================================

function showFallbackNavbar() {

  const navbarContainer =
    document.getElementById(
      "navbar-placeholder"
    ) ||
    document.body;


  navbarContainer.innerHTML = `

    <nav class="navbar navbar-expand-lg bg-dark">

      <div class="container-fluid">

        <span class="navbar-brand text-white">

          <i class="fas fa-user-circle me-2"></i>

          Farmacia Libertad

        </span>


        <div class="d-flex">

          <a
            href="../Customers/tableCustomers.html"
            class="btn btn-secondary mx-1"
          >

            Clientes

          </a>


          <a
            href="../Sales/sales.html"
            class="btn btn-primary mx-1"
          >

            Ventas

          </a>


          <a
            href="../login.html"
            class="btn btn-light mx-1"
          >

            Login

          </a>

        </div>

      </div>

    </nav>

  `;

}


