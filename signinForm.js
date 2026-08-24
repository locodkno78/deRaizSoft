import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  auth,
} from "./firebase.js";

import { showMessage } from "./showMessage.js";


// ======================================================
// PREVENIR VOLVER ATRÁS DESDE LOGIN
// ======================================================

window.addEventListener("load", () => {
  window.history.pushState(
    null,
    null,
    window.location.href
  );
});

window.addEventListener("popstate", () => {
  window.history.pushState(
    null,
    null,
    window.location.href
  );
});


// ======================================================
// FORMULARIO DE LOGIN
// ======================================================

const signInForm = document.querySelector("#login-form");


// ======================================================
// VERIFICAR QUE EL FORMULARIO EXISTA
// ======================================================

if (signInForm) {

  signInForm.addEventListener("submit", async (e) => {

    e.preventDefault();


    // ==================================================
    // OBTENER DATOS DEL FORMULARIO
    // ==================================================    

    const email =
      signInForm["login-email"].value.trim();

    const password =
      signInForm["login-password"].value;


    // ==================================================
    // VALIDAR CAMPOS
    // ==================================================

    if (!email || !password) {

      showMessage(
        "Por favor, complete todos los campos.",
        "error"
      );

      return;
    }


    try {

      await setPersistence(
        auth,
        browserLocalPersistence
      );

      // ==================================================
      // 1. AUTENTICAR EN FIREBASE
      // ==================================================

      const userCredentials =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredentials.user;

      // ==================================================
      // 2. DETERMINAR NOMBRE
      // ==================================================

      const nombre =
        user.displayName ||
        email;


      // ==================================================
      // 3. GUARDAR SESIÓN
      // ==================================================

      sessionStorage.setItem(
        "usuarioId",
        user.uid
      );

      sessionStorage.setItem(
        "usuarioNombre",
        nombre
      );

      sessionStorage.setItem(
        "usuarioEmail",
        user.email || email
      );


      // ==================================================
      // 9. MOSTRAR INFORMACIÓN EN CONSOLA
      // ==================================================

      // ==================================================
      // 10. REDIRECCIÓN
      // ==================================================

      window.location.href =
        "./Sales/sales.html";

    }


    // ====================================================
    // ERRORES
    // ====================================================

    catch (error) {

      console.error(
        "Error al iniciar sesión:",
        error
      );


      // -----------------------------------------------
      // CONTRASEÑA INCORRECTA
      // -----------------------------------------------

      if (
        error.code ===
        "auth/wrong-password"
      ) {

        showMessage(
          "Contraseña incorrecta.",
          "error"
        );

      }


      // -----------------------------------------------
      // USUARIO NO ENCONTRADO
      // -----------------------------------------------

      else if (
        error.code ===
        "auth/user-not-found"
      ) {

        showMessage(
          "El correo electrónico no está registrado.",
          "error"
        );

      }


      // -----------------------------------------------
      // CREDENCIALES INCORRECTAS
      // -----------------------------------------------

      else if (
        error.code ===
        "auth/invalid-credential"
      ) {

        showMessage(
          "Correo o contraseña incorrectos.",
          "error"
        );

      }


      // -----------------------------------------------
      // EMAIL INVÁLIDO
      // -----------------------------------------------

      else if (
        error.code ===
        "auth/invalid-email"
      ) {

        showMessage(
          "El correo electrónico no es válido.",
          "error"
        );

      }


      // -----------------------------------------------
      // DEMASIADOS INTENTOS
      // -----------------------------------------------

      else if (
        error.code ===
        "auth/too-many-requests"
      ) {

        showMessage(
          "Demasiados intentos. Espere unos minutos e inténtelo nuevamente.",
          "error"
        );

      }


      // -----------------------------------------------
      // ERROR GENERAL
      // -----------------------------------------------

      else {

        showMessage(
          "No se pudo iniciar sesión. Inténtelo nuevamente.",
          "error"
        );

      }

    }

  });

}
