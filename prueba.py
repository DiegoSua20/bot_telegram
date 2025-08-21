import csv
import asyncio
from flask import Flask, render_template, request, redirect
from telegram import Bot

# --- Configuración del bot ---
TOKEN = "7983769298:AAEHZLFJFrbx8VqVnsew65trTUqFabz5xw4"
bot = Bot(token=TOKEN)
CSV_FILE = "contactos.csv"

# --- Configuración de Flask ---
app = Flask(__name__)

# Leer contactos del CSV
def leer_contactos():
    contactos = []
    with open(CSV_FILE, newline='', encoding='utf-8') as f:
        lector = csv.DictReader(f)
        for fila in lector:
            contactos.append(fila)
    return contactos

# Página principal con la lista de contactos
@app.route("/")
def index():
    contactos = leer_contactos()
    return render_template("index.html", contactos=contactos)

# Procesar formulario
@app.route("/enviar", methods=["POST"])
def enviar():
    seleccionados = request.form.getlist("contactos")  # chat_id seleccionados
    monto = request.form["monto"]
    fecha = request.form["fecha"]

    # Enviar mensajes con asyncio
    async def enviar_mensajes():
        for chat_id in seleccionados:
            mensaje = f"Hola, tienes un monto pendiente de {monto} para la fecha {fecha}."
            await bot.send_message(chat_id=int(chat_id), text=mensaje)

    asyncio.run(enviar_mensajes())
    return redirect("/")

# --- Iniciar servidor Flask ---
if __name__ == "__main__":
    app.run(debug=True)
