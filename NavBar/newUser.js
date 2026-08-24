import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { auth } from './firebase.js';

const signupForm = document.querySelector('#signup-form');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = signupForm['signup-name'].value;
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        showNotification("Usuario creado correctamente");

    } catch (error) {

        if (error.code === 'auth/email-already-in-use') {
            showNotification('Este email ya está en uso');
        } else if (error.code === 'auth/invalid-email') {
            showNotification('Email Invalido');
        } else if (error.code === 'auth/weak-password') {
            showNotification('La contraseña debe tener al menos 6 caracteres');
        } else if (error.code) {
            showNotification('Ups!!! \n Algo salió mal. \n Vuelve a intentarlo');
        }
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