import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc, query,
  where, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

 const firebaseConfig = {
    apiKey: "AIzaSyB6MXv58WNvNd40RMNzj5liw__riYCaHyw",
    authDomain: "socios-a1064.firebaseapp.com",
    projectId: "socios-a1064",
    storageBucket: "socios-a1064.firebasestorage.app",
    messagingSenderId: "333514800618",
    appId: "1:333514800618:web:875a651da0982e2b36c693",
    measurementId: "G-F4J7MR71KW"
  };

const app = initializeApp(firebaseConfig);
// Inicializar Firebase Firestore
const db = getFirestore(app);
const auth = getAuth(app);

export const saveFormProd = (
  name,
  quantity,
  cost,
  price,
  stock,
  stockMinimo = 0,  
) => {
  return addDoc(collection(db, "productos"), {
    name,
    quantity : Number(quantity),
    cost: Number(cost),
    price: Number(price),
    stock: Number(stock),
    stockMinimo: Number(stockMinimo), 
    activo: true,
    createdAt: new Date()
  });
};

export const getFormProd = async () => {
  const querySnapshot = await getDocs(collection(db, 'productos'));
  return querySnapshot;
};

export const getPedidos = async () => {
  const querySnapshot = await getDocs(collection(db, 'pedidos'));
  return querySnapshot;
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, "productos", productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
  }
};

export const deletePedido = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    await deleteDoc(pedidoRef);
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
  }
};

export const updatePedidos = async (pedidoId, newData) => {
  const pedidoRef = doc(db, "pedidos", pedidoId);

  try {
    await updateDoc(pedidoRef, newData);
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
  }
};

export const updateProduct = async (productoId, newData) => {
  const productoRef = doc(db, "productos", productoId);

  try {
    await updateDoc(productoRef, newData);
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
  }
};

// OBTENER HISTORIAL DE VENTAS

export const getVentas = async () => {

  const ventasRef = collection(db, "ventas");

  const querySnapshot =
    await getDocs(ventasRef);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

};

export const getProducto = async (productoId) => {
  const productoRef = doc(db, "productos", productoId);
  const productoSnapshot = await getDoc(productoRef);

  if (productoSnapshot.exists()) {
    return productoSnapshot.data();
  } else {
    console.error("Producto no encontrado");
    return null;
  }
};

// Función específica para obtener productos
export const getProducts = async () => {
  const querySnapshot = await getDocs(collection(db, 'productos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const registrarVenta = async (ventaData) => {
  try {
    const ventaRef = doc(collection(db, "ventas"));

    await runTransaction(db, async (transaction) => {

      // ==================================================
      // 1. OBTENER PRODUCTOS DE FIRESTORE
      // ==================================================

      const productosFirestore = [];

      for (const producto of ventaData.productos) {

        const productoRef = doc(
          db,
          "productos",
          producto.id
        );

        const productoSnapshot =
          await transaction.get(productoRef);

        if (!productoSnapshot.exists()) {

          throw new Error(
            `El producto "${producto.nombre}" no existe`
          );

        }

        productosFirestore.push({
          ref: productoRef,
          snapshot: productoSnapshot
        });

      }


      // ==================================================
      // 2. VERIFICAR STOCK Y COSTOS
      // ==================================================

      for (let i = 0; i < ventaData.productos.length; i++) {

        const productoVenta =
          ventaData.productos[i];

        const productoFirestore =
          productosFirestore[i].snapshot.data();


        // -----------------------------------------------
        // STOCK
        // -----------------------------------------------

        const stockActual =
          Number(productoFirestore.stock) || 0;

        const cantidadVenta =
          Number(productoVenta.cantidad) || 0;

        if (cantidadVenta <= 0) {

          throw new Error(
            `La cantidad de "${productoVenta.nombre}" no es válida.`
          );

        }


        if (stockActual < cantidadVenta) {

          throw new Error(
            `No hay suficiente stock para ${productoVenta.nombre}. ` +
            `Stock actual: ${stockActual}`
          );

        }


        // -----------------------------------------------
        // COSTO
        // -----------------------------------------------

        const costo =
          Number(productoFirestore.cost);

        if (
          !Number.isFinite(costo) ||
          costo < 0
        ) {

          throw new Error(
            `El producto "${productoVenta.nombre}" ` +
            `no tiene un costo válido registrado.`
          );

        }

      }


      // ==================================================
      // 3. CALCULAR COSTOS Y GANANCIAS
      // ==================================================

      let costoTotalVenta = 0;
      let gananciaTotal = 0;


      const productosConCosto =
        ventaData.productos.map(
          (productoVenta, index) => {

            const productoFirestore =
              productosFirestore[index].snapshot.data();


            // -------------------------------------------
            // COSTO HISTÓRICO
            // -------------------------------------------

            const costo =
              Number(productoFirestore.cost);


            const cantidad =
              Number(productoVenta.cantidad) || 0;


            const costoTotalProducto =
              costo * cantidad;


            // -------------------------------------------
            // TOTAL COBRADO POR EL PRODUCTO
            // -------------------------------------------

            const totalProducto =
              Number(productoVenta.total) || 0;


            // -------------------------------------------
            // GANANCIA DEL PRODUCTO
            // -------------------------------------------

            const gananciaProducto =
              totalProducto -
              costoTotalProducto;


            // -------------------------------------------
            // ACUMULAR
            // -------------------------------------------

            costoTotalVenta +=
              costoTotalProducto;


            gananciaTotal +=
              gananciaProducto;


            // -------------------------------------------
            // GUARDAR INFORMACIÓN HISTÓRICA
            // -------------------------------------------

            return {

              ...productoVenta,

              costo: costo,

              costoTotal: costoTotalProducto,

              ganancia: gananciaProducto

            };

          }
        );


      // ==================================================
      // 4. CALCULAR GANANCIA TOTAL
      // ==================================================

      // La calculamos a partir de los productos para que
      // sea consistente con los costos históricos.

      gananciaTotal =
        Number(ventaData.total || 0) -
        costoTotalVenta;


      // ==================================================
      // 5. DESCONTAR STOCK
      // ==================================================

      for (
        let i = 0;
        i < ventaData.productos.length;
        i++
      ) {

        const productoVenta =
          ventaData.productos[i];


        const productoFirestore =
          productosFirestore[i].snapshot.data();


        const stockActual =
          Number(productoFirestore.stock) || 0;


        const cantidadVenta =
          Number(productoVenta.cantidad) || 0;


        const nuevoStock =
          stockActual -
          cantidadVenta;


        transaction.update(
          productosFirestore[i].ref,
          {
            stock: nuevoStock
          }
        );

      }


      // ==================================================
      // 6. GUARDAR VENTA
      // ==================================================

      transaction.set(
        ventaRef,
        {

          ...ventaData,

          // ---------------------------------------------
          // PRODUCTOS CON INFORMACIÓN HISTÓRICA
          // ---------------------------------------------

          productos: productosConCosto,


          // ---------------------------------------------
          // COSTO TOTAL DE LA MERCADERÍA
          // ---------------------------------------------

          costoTotal: costoTotalVenta,


          // ---------------------------------------------
          // GANANCIA BRUTA
          // ---------------------------------------------

          gananciaTotal: gananciaTotal,


          // ---------------------------------------------
          // FECHA
          // ---------------------------------------------

          createdAt: serverTimestamp()

        }
      );

    });

    return ventaRef.id;


  } catch (error) {

    console.error(
      "Error al registrar la venta:",
      error
    );

    throw error;

  }
};

export const getProductByName = async (productName) => {
  const productosRef = collection(db, "productos");
  const q = query(productosRef, where("name", "==", productName));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveOrUpdatePedido = async (productosVendidos) => {
  try {    
    // DOCUMENTO ÚNICO DE PEDIDOS
    
    const pedidoRef = doc(db, "pedidos", "pedidoActivo");
    
    // OBTENER PEDIDO ACTUAL    

    const pedidoSnapshot = await getDoc(pedidoRef);

    const acumuladorPedidos = {};
    
    // PEDIDOS EXISTENTES    

    if (pedidoSnapshot.exists()) {
      const pedido = pedidoSnapshot.data();

      if (
        pedido.productos &&
        Array.isArray(pedido.productos)
      ) {
        pedido.productos.forEach((item) => {
          const cantidad = Number(item.cantidad) || 0;

          if (
            item.producto &&
            cantidad > 0
          ) {
            if (!acumuladorPedidos[item.producto]) {
              acumuladorPedidos[item.producto] = 0;
            }

            acumuladorPedidos[item.producto] += cantidad;
          }
        });
      }
    }
    
    // AGREGAR PRODUCTOS DE LA NUEVA VENTA
    
    productosVendidos.forEach((producto) => {
      const cantidad = Number(producto.cantidad) || 0;

      if (
        producto.producto &&
        cantidad > 0
      ) {
        if (!acumuladorPedidos[producto.producto]) {
          acumuladorPedidos[producto.producto] = 0;
        }

        acumuladorPedidos[producto.producto] += cantidad;
      }
    });
   
    // ARRAY FINAL    

    const productosAcumulados = Object.entries(
      acumuladorPedidos
    ).map(([producto, cantidad]) => ({
      producto,
      cantidad,
    }));
    
    // GUARDAR / ACTUALIZAR
    
    await setDoc(
      pedidoRef,
      {
        productos: productosAcumulados,
        fecha: serverTimestamp(),
        estado: "activo",
      },
      {
        merge: true,
      }
    );

    return true;

  } catch (error) {

    console.error(
      "Error al guardar/actualizar pedido:",
      error
    );

    throw error;
  }
};

export const agregarProductoPedido = async (
  productoNombre,
  cantidad
) => {

  const cantidadNueva =
    Number(cantidad);

  if (
    !productoNombre ||
    !Number.isInteger(cantidadNueva) ||
    cantidadNueva <= 0
  ) {

    throw new Error(
      "Producto o cantidad inválida."
    );

  }


  const pedidosRef =
    collection(db, "pedidos");

  const snapshot =
    await getDocs(pedidosRef);

  // ACUMULAR TODOS LOS PEDIDOS EXISTENTES  

  const acumulador = {};


  snapshot.forEach((docSnap) => {

    const data =
      docSnap.data();


    if (
      data.productos &&
      Array.isArray(data.productos)
    ) {

      data.productos.forEach((item) => {

        const cantidadItem =
          Number(item.cantidad) || 0;


        if (
          item.producto &&
          cantidadItem > 0
        ) {

          if (
            !acumulador[item.producto]
          ) {

            acumulador[item.producto] =
              0;

          }


          acumulador[item.producto] +=
            cantidadItem;

        }

      });

    }


    else if (
      data.producto &&
      data.cantidad
    ) {

      const cantidadItem =
        Number(data.cantidad) || 0;


      if (
        cantidadItem > 0
      ) {

        if (
          !acumulador[data.producto]
        ) {

          acumulador[data.producto] =
            0;

        }


        acumulador[data.producto] +=
          cantidadItem;

      }

    }

  });

  // SUMAR PRODUCTO

  if (
    !acumulador[productoNombre]
  ) {

    acumulador[productoNombre] =
      0;

  }


  acumulador[productoNombre] +=
    cantidadNueva;


  const productos =
    Object.entries(acumulador)
      .map(([producto, cantidad]) => ({

        producto,

        cantidad,

      }));

  // GUARDAR EN DOCUMENTO ÚNICO  

  if (
    snapshot.empty
  ) {

    await addDoc(
      pedidosRef,
      {

        productos,

        fecha:
          serverTimestamp(),

        estado:
          "activo",

      }
    );

  } else {

    const primerDocumento =
      snapshot.docs[0];


    await updateDoc(
      primerDocumento.ref,
      {

        productos,

        fecha:
          serverTimestamp(),

        estado:
          "activo",

      }
    );


    // Eliminar documentos duplicados
    // para mantener un único pedido activo

    const documentosDuplicados =
      snapshot.docs.slice(1);


    await Promise.all(
      documentosDuplicados.map(
        (docSnap) =>
          deleteDoc(docSnap.ref)
      )
    );

  }


  return true;

};

export const actualizarCantidadPedido = async (
  productoNombre,
  nuevaCantidad
) => {

  const cantidad =
    Number(nuevaCantidad);


  if (
    !productoNombre ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {

    throw new Error(
      "Producto o cantidad inválida."
    );

  }


  const pedidosRef =
    collection(db, "pedidos");

  const snapshot =
    await getDocs(pedidosRef);


  if (
    snapshot.empty
  ) {

    throw new Error(
      "No existe un pedido activo."
    );

  }


  const acumulador = {};


  // ===================================================
  // UNIFICAR PEDIDOS
  // ===================================================

  snapshot.forEach((docSnap) => {

    const data =
      docSnap.data();


    if (
      data.productos &&
      Array.isArray(data.productos)
    ) {

      data.productos.forEach((item) => {

        const cantidadItem =
          Number(item.cantidad) || 0;


        if (
          item.producto &&
          cantidadItem > 0
        ) {

          if (
            !acumulador[item.producto]
          ) {

            acumulador[item.producto] =
              0;

          }


          acumulador[item.producto] +=
            cantidadItem;

        }

      });

    }


    else if (
      data.producto &&
      data.cantidad
    ) {

      const cantidadItem =
        Number(data.cantidad) || 0;


      if (
        cantidadItem > 0
      ) {

        if (
          !acumulador[data.producto]
        ) {

          acumulador[data.producto] =
            0;

        }


        acumulador[data.producto] +=
          cantidadItem;

      }

    }

  });


  // ===================================================
  // COMPROBAR PRODUCTO
  // ===================================================

  if (
    acumulador[productoNombre] === undefined
  ) {

    throw new Error(
      "El producto no existe en el pedido."
    );

  }


  // ===================================================
  // ESTABLECER NUEVA CANTIDAD
  // ===================================================

  acumulador[productoNombre] =
    cantidad;


  const productos =
    Object.entries(acumulador)
      .map(([producto, cantidad]) => ({

        producto,

        cantidad,

      }));


  // ===================================================
  // GUARDAR
  // ===================================================

  const primerDocumento =
    snapshot.docs[0];


  await updateDoc(
    primerDocumento.ref,
    {

      productos,

      fecha:
        serverTimestamp(),

      estado:
        "activo",

    }
  );


  // Eliminar documentos duplicados

  const documentosDuplicados =
    snapshot.docs.slice(1);


  await Promise.all(
    documentosDuplicados.map(
      (docSnap) =>
        deleteDoc(docSnap.ref)
    )
  );


  return true;

};

export const resetProductoPedidos = async (productoNombre) => {
  try {
    const pedidosRef = collection(db, "pedidos");
    const querySnapshot = await getDocs(pedidosRef);

    const acciones = [];

    querySnapshot.forEach((docSnap) => {
      const pedidoData = docSnap.data();

      if (pedidoData.productos && Array.isArray(pedidoData.productos)) {
        const nuevosProductos = pedidoData.productos.filter(item => item.producto !== productoNombre);

        if (nuevosProductos.length === 0) {
          // Si no quedan productos, eliminar el documento
          acciones.push(deleteDoc(docSnap.ref));
        } else {
          // Si quedan otros productos, actualizar el array
          acciones.push(updateDoc(docSnap.ref, { productos: nuevosProductos }));
        }
      } else if (pedidoData.producto === productoNombre) {
        // Formato viejo: producto suelto
        acciones.push(deleteDoc(docSnap.ref));
      }
    });

    await Promise.all(acciones);
    return true;
  } catch (error) {
    console.error("Error al resetear producto en pedidos:", error);
    throw error;
  }
};

export const deleteAllPedidos = async () => {
  try {
    const pedidosRef = collection(db, "pedidos");
    const snapshot = await getDocs(pedidosRef);

    const deletes = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletes);
  } catch (error) {
    console.error("Error al eliminar todos los pedidos:", error);
  }
};

//Clientes

export const saveForm = (dni, name, surname, date, address, phone, email, description) => {
  return addDoc(collection(db, 'clientes'), { dni, name, surname, date, address, phone, email, description }
  )
}

export const consultaForm = (clienteId, fechaCompra, producto, precio, cantidad, precioT, detalles) => {
  return addDoc(collection(db, 'clientes', clienteId, 'consultas'), { fechaCompra, producto, precio, cantidad, precioT, detalles }
  )
}

export const getForm = async () => {
  const querySnapshot = await getDocs(collection(db, 'clientes'));
  return querySnapshot;
};

export const getConsulta = async (clienteId) => {
  const querySnapshot = await getDocs(collection(db, 'clientes', clienteId, 'consultas'));
  return querySnapshot;
};

export const deleteCliente = async (clienteId) => {
  try {
    const clienteRef = doc(db, "clientes", clienteId);
    await deleteDoc(clienteRef);
    console.log("Cliente eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
  }
};

export const deleteConsulta = async (clienteId, consultasId) => {
  try {
    const clienteRef = doc(db, "clientes", clienteId, 'consultas', consultasId);
    await deleteDoc(clienteRef);
    console.log("Consulta eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar la consulta:", error);
  }
};

export const updateCliente = async (clienteId, newData) => {
  const clienteRef = doc(db, "clientes", clienteId);

  try {
    await updateDoc(clienteRef, newData);
    console.log("Cliente actualizado con éxito");
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
  }
};

export const updateConsulta = async (clienteId, consultasId, newData) => {
  const clienteRef = doc(db, "clientes", clienteId, 'consultas', consultasId);

  try {
    const consultaDoc = await getDoc(clienteRef);

    if (consultaDoc.exists()) {
      console.log("Nuevo precio:", newData.precio);
      await updateDoc(clienteRef, newData);
      console.log("Consulta actualizada con éxito");
    } else {
      console.error("Documento no encontrado para actualizar");
    }
  } catch (error) {
    console.error("Error al actualizar la consulta:", error);
    throw error; // Asegúrate de propagar el error para manejarlo en el lugar correspondiente
  }
};

export const getCliente = async (clienteId) => {
  const clienteRef = doc(db, "clientes", clienteId);
  const clienteSnapshot = await getDoc(clienteRef);

  if (clienteSnapshot.exists()) {
    return clienteSnapshot.data();
  } else {
    console.error("Cliente no encontrado");
    return null;
  }
};

export const getHistorial = async (clienteId, consultasId) => {
  if (clienteId && consultasId) { // Comprueba que ambos valores no sean undefined
    const consultaRef = doc(db, 'clientes', clienteId, 'consultas', consultasId);
    const consultaSnapshot = await getDoc(consultaRef);
    console.log(consultasId)
    if (consultaSnapshot.exists()) {
      return consultaSnapshot.data();
    } else {
      console.error("Consulta no encontrada");
      return null; // Retorna null para indicar que la consulta no se encontró
    }
  } else {
    console.error("Valores de clienteId o consultasId indefinidos");
    return null; // Retorna null en caso de valores indefinidos
  }
};

export {
  app, db, doc, auth, setDoc, collection, getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  getDoc,
  deleteDoc
}