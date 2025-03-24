document.addEventListener('DOMContentLoaded', function() {
    const tieneBandejaCheckbox = document.getElementById('tiene_bandeja');
    const configCorreoFields = document.querySelectorAll('.config-correo');
    
    function toggleConfigFields() {
        const display = tieneBandejaCheckbox.checked ? 'block' : 'none';
        configCorreoFields.forEach(field => {
            const formGroup = field.closest('.form-group') || field.closest('.mb-3');
            if (formGroup) {
                formGroup.style.display = display;
            }
        });
    }
    
    if (tieneBandejaCheckbox) {
        toggleConfigFields(); // Estado inicial
        tieneBandejaCheckbox.addEventListener('change', toggleConfigFields);
    }
}); 