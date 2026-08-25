import {
	deleteCuentaCliente,
	getCliente,
	getVentasCliente,
	updateVentaCliente,
} from "../../firebase.js";

const parametros = new URLSearchParams(window.location.search);
const clienteId = parametros.get("clienteId");
const customerName = document.getElementById("customerName");
const customerDetails = document.getElementById("customerDetails");
const purchasesState = document.getElementById("purchasesState");
const purchasesTableBody = document.querySelector("#purchasesTable tbody");
const purchasesPayments = document.getElementById("purchasesPayments");
const purchasesTotal = document.getElementById("purchasesTotal");
const deleteAccountButton = document.getElementById("deleteAccount");
const editProductForm = document.getElementById("editProductForm");
let editingProduct = null;

function formatDate(timestamp) {
	if (!timestamp?.toDate) {
		return "Sin fecha";
	}

	return timestamp.toDate().toLocaleDateString("es-AR");
}

function formatCurrency(value) {
	return `$${Number(value || 0).toFixed(2)}`;
}

function showCustomer(cliente) {
	customerName.textContent = `${cliente.name || ""} ${cliente.surname || ""}`.trim();
	customerDetails.textContent = `Domicilio: ${cliente.address || "No informado"} · Teléfono: ${cliente.phone || "No informado"}`;
}

function showPurchases(ventas) {
	if (ventas.length === 0) {
		purchasesState.textContent = "Este cliente todavía no tiene compras registradas.";
		return;
	}

	purchasesState.textContent = "";
	let totalCompras = 0;
	const formasDePago = new Set();

	ventas
		.sort((first, second) => (second.createdAt?.seconds || 0) - (first.createdAt?.seconds || 0))
		.forEach((venta) => {
			totalCompras += Number(venta.total || 0);
			formasDePago.add(venta.formaPago || "No informado");
			const productos = Array.isArray(venta.productos) && venta.productos.length > 0
				? venta.productos
				: [{ nombre: "Sin productos", cantidad: 0 }];

			productos.forEach((producto, productIndex) => {
				const row = document.createElement("tr");
				const purchaseRowspan = productIndex === 0 ? ` rowspan="${productos.length}"` : "";
				const subtotal = producto.subtotal ?? (Number(producto.precio || 0) * Number(producto.cantidad || 0));

				row.innerHTML = `
					${productIndex === 0 ? `<td${purchaseRowspan}>${formatDate(venta.createdAt)}</td>` : ""}
					<td>${producto.nombre || "Sin nombre"}</td>
					<td>${producto.cantidad || 0}</td>
					<td>${formatCurrency(producto.precio)}</td>
					<td>${formatCurrency(subtotal)}</td>
					<td class="purchase-actions">
						<button type="button" class="btn btn-warning btn-sm edit-product" title="Editar producto" aria-label="Editar producto">
							<i class="fas fa-pencil-alt"></i>
						</button>
						<button type="button" class="btn btn-danger btn-sm delete-product" title="Eliminar producto" aria-label="Eliminar producto">
							<i class="fas fa-trash"></i>
						</button>
					</td>
				`;
				purchasesTableBody.appendChild(row);
				row.querySelector(".edit-product").addEventListener("click", () => openEditProduct(venta, productIndex));
				row.querySelector(".delete-product").addEventListener("click", () => deleteProduct(venta, productIndex));
			});
		});

	purchasesPayments.textContent = [...formasDePago].join(" · ");
	purchasesTotal.textContent = `Total: ${formatCurrency(totalCompras)}`;

}

async function deleteProduct(venta, productIndex) {
	if (!window.confirm("¿Querés eliminar este producto de la compra?")) {
		return;
	}

	const productos = venta.productos.filter((_, index) => index !== productIndex);
	if (productos.length === 0) {
		await deletePurchase(venta.id);
		return;
	}

	await saveVentaProducts(venta, productos);
}

async function saveVentaProducts(venta, productos) {
	const subtotal = productos.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
	const descuentoTotal = productos.reduce((sum, item) => sum + (Number(item.subtotal || 0) - Number(item.total || 0)), 0);
	let total = productos.reduce((sum, item) => sum + Number(item.total || 0), 0);
	if (venta.formaPago === "credito") {
		total *= { 3: 1.15, 6: 1.25, 12: 1.3 }[venta.cuotas] || 1;
	}

	try {
		await updateVentaCliente(clienteId, venta.id, { ...venta, productos, subtotal, descuentoTotal, total });
		await loadAccount();
	} catch (error) {
		console.error("Error al guardar los productos:", error);
		window.alert("No se pudo modificar la compra.");
	}
}

async function deletePurchase(ventaId) {
	try {
		await deleteCuentaCliente(clienteId, [{ id: ventaId }]);
		await loadAccount();
	} catch (error) {
		console.error("Error al eliminar la compra:", error);
		window.alert("No se pudo eliminar la compra.");
	}
}

function openEditProduct(venta, productIndex) {
	const producto = venta.productos?.[productIndex];
	if (!producto) {
		return;
	}

	editingProduct = { venta, productIndex };
	document.getElementById("editProductName").value = producto.nombre || "";
	document.getElementById("editProductQuantity").value = producto.cantidad ?? 1;
	document.getElementById("editProductPrice").value = producto.precio ?? 0;
	bootstrap.Modal.getOrCreateInstance(document.getElementById("editProductModal")).show();
}

editProductForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (!editProductForm.reportValidity() || !editingProduct) {
		return;
	}

	const { venta, productIndex } = editingProduct;
	const nombre = document.getElementById("editProductName").value.trim();
	const cantidad = Number(document.getElementById("editProductQuantity").value);
	const precio = Number(document.getElementById("editProductPrice").value);

	const productos = venta.productos.map((item, index) => {
		if (index !== productIndex) {
			return item;
		}

		const subtotal = precio * cantidad;
		const descuento = Number(item.descuento || 0);
		const total = subtotal * (1 - descuento / 100);
		return { ...item, nombre: nombre.trim(), precio, cantidad, subtotal, total };
	});

	bootstrap.Modal.getOrCreateInstance(document.getElementById("editProductModal")).hide();
	editingProduct = null;
	await saveVentaProducts(venta, productos);
});

deleteAccountButton.addEventListener("click", async () => {
	if (!window.confirm("¿Querés eliminar todas las compras de esta cuenta?")) {
		return;
	}

	deleteAccountButton.disabled = true;
	try {
		const ventas = await getVentasCliente(clienteId);
		await deleteCuentaCliente(clienteId, ventas);
		await loadAccount();
	} catch (error) {
		console.error("Error al eliminar la cuenta:", error);
		window.alert("No se pudo eliminar la cuenta.");
	} finally {
		deleteAccountButton.disabled = false;
	}
});

async function loadAccount() {
	if (!clienteId) {
		customerName.textContent = "Cliente no especificado";
		purchasesState.textContent = "No se recibió el identificador del cliente.";
		return;
	}

	try {
		const [cliente, ventas] = await Promise.all([
			getCliente(clienteId),
			getVentasCliente(clienteId),
		]);

		if (!cliente) {
			customerName.textContent = "Cliente no encontrado";
			purchasesState.textContent = "No existe un cliente con ese identificador.";
			return;
		}

		showCustomer(cliente);
		purchasesTableBody.innerHTML = "";
		purchasesPayments.textContent = "";
		purchasesTotal.textContent = "Total: $0.00";
		showPurchases(ventas);
	} catch (error) {
		console.error("Error al cargar la cuenta del cliente:", error);
		purchasesState.textContent = "No se pudieron cargar las compras.";
	}
}

loadAccount();
