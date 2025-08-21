import csv
from telegram import Update, Bot
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

TOKEN = "7983769298:AAEHZLFJFrbx8VqVnsew65trTUqFabz5xw4"
CSV_FILE = "contactos.csv"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    nombre = update.effective_user.first_name

    # Leer CSV para no duplicar IDs
    try:
        with open(CSV_FILE, newline='', encoding='utf-8') as f:
            ids = [int(row['chat_id']) for row in csv.DictReader(f)]
    except FileNotFoundError:
        ids = []

    if chat_id not in ids:
        with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if f.tell() == 0:  # si el archivo está vacío, escribir cabecera
                writer.writerow(['nombre', 'chat_id'])
            writer.writerow([nombre, chat_id])
        await update.message.reply_text(f"¡Hola {nombre}! Tu chat_id ha sido registrado.")
    else:
        await update.message.reply_text(f"¡Hola {nombre}! Ya estás registrado.")

# Crear aplicación y handler
app = ApplicationBuilder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))

# Ejecutar bot
app.run_polling()
