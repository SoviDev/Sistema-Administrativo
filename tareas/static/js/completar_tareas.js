document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".completar-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            let tareaId = this.getAttribute("data-tarea-id");
            let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");

            if (!tareaId) {
                console.error("ID de tarea no encontrado");
                return;
            }

            fetch(`/tareas/completar/${tareaId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken
                },
                body: JSON.stringify({})
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("✅ Tarea completada con éxito.");
                    location.reload();  // Recargar la página para actualizar el estado de la tarea
                } else {
                    alert("❌ Error: " + (data.error || "No se pudo completar la tarea."));
                }
            })
            .catch(error => {
                console.error("Error al completar la tarea:", error);
                alert("❌ Ocurrió un error al intentar completar la tarea.");
            });
        });
    });
});
