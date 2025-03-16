# Usar la versión estable de Python
FROM python:3.12

# Evitar almacenamiento en búfer en la salida de Python
ENV PYTHONUNBUFFERED=1

# Definir el directorio de trabajo
WORKDIR /code

# Copiar solo el archivo de dependencias primero
COPY requirements.txt /code/

# Actualizar pip e instalar dependencias en una sola capa
RUN python -m pip install --upgrade pip 
RUN python -m pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código fuente
COPY . /code/

# Exponer el puerto 8000
EXPOSE 8000

# Comando para iniciar el servidor automáticamente
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
