import asyncio
import csv
from telegram import Bot

# Token de tu bot
TOKEN = "7983769298:AAEHZLFJFrbx8VqVnsew65trTUqFabz5xw4"
bot = Bot(token=TOKEN)

# Archivo CSV con contactos
CSV_FILE = 'contactos.csv'

async def enviar_mensajes():
    while True:  # Bucle infinito para enviar mensajes cada 2 minutos
        try:
            with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
                lector = csv.DictReader(csvfile)
                for fila in lector:
                    nombre = fila['nombre']
                    chat_id = int(fila['chat_id'])
                    monto = fila['monto']
                    fecha = fila['fecha']

                    mensaje = f"Hola {nombre}, tienes un monto pendiente de {monto} para la fecha {fecha}."
                    
                    try:
                        await bot.send_message(chat_id=chat_id, text=mensaje)
                        print(f"Mensaje enviado a {nombre} (chat_id: {chat_id})")
                    except Exception as e:
                        print(f"No se pudo enviar el mensaje a {nombre}: {e}")
        except FileNotFoundError:
            print(f"No se encontró el archivo {CSV_FILE}. Esperando a que se cree...")

        print("Esperando 2 minutos para el siguiente envío...\n")
        await asyncio.sleep(120)  # Espera 2 minutos antes de la siguiente iteración

# Ejecutar la función asíncrona
asyncio.run(enviar_mensajes())
