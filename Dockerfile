# Usa una imagen oficial de Python
FROM python:3.11

# Define el directorio de trabajo
WORKDIR /code

# Copia y instala dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el código del proyecto
COPY . .

# Recolectar archivos estáticos antes de iniciar
RUN python manage.py collectstatic --noinput

# Comando para ejecutar Gunicorn
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
