from flask import Flask, render_template, request, redirect
from telegram import Bot
import csv
import asyncio

# Token de tu bot
TOKEN = "7983769298:AAEHZLFJFrbx8VqVnsew65trTUqFabz5xw4"
bot = Bot(token=TOKEN)

# Archivo CSV con contactos
CSV_FILE = 'contactos.csv'

app = Flask(__name__)

# Crear un loop global que se usará siempre
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

# Página principal
@app.route('/')
def index():
    contactos = []
    try:
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            lector = csv.DictReader(csvfile)
            for fila in lector:
                contactos.append(fila)
    except FileNotFoundError:
        pass

    # Opciones que el usuario puede elegir
    opciones = [
        "Paga tu deuda en 3 meses",
        "Paga tu deuda en 6 meses",
        "Paga tu deuda en 12 meses",
        "Pago inmediato con descuento",
    ]

    return render_template('index.html', contactos=contactos, opciones=opciones)

# Ruta para enviar mensajes
@app.route('/enviar', methods=['POST'])
def enviar():
    seleccionados = request.form.getlist('contactos')
    opcion = request.form.get('opcion')
    
    if not seleccionados or not opcion:
        return redirect('/')

    # Enviar mensaje a cada usuario seleccionado
    for chat_id in seleccionados:
        try:
            loop.run_until_complete(bot.send_message(chat_id=int(chat_id), text=opcion))
            print(f"Mensaje enviado a {chat_id}: {opcion}")
        except Exception as e:
            print(f"Error enviando a {chat_id}: {e}")

    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)
