document.addEventListener('DOMContentLoaded', function() {
    const tieneBandejaCheckbox = document.getElementById('tiene_bandeja');
    const configFields = document.querySelectorAll('.config-correo');
    const configFieldsContainers = Array.from(configFields).map(field => field.closest('.mb-3'));

    function toggleConfigFields() {
        const isChecked = tieneBandejaCheckbox.checked;
        configFieldsContainers.forEach(container => {
            container.style.display = isChecked ? 'block' : 'none';
        });
    }

    if (tieneBandejaCheckbox) {
        toggleConfigFields(); // Estado inicial
        tieneBandejaCheckbox.addEventListener('change', toggleConfigFields);
    }
}); 