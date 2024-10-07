import express from 'express';
import * as chat from '@botpress/chat';
import dotenv from 'dotenv';
dotenv.config();



const app = express();
app.use(express.json());

// Configura el webhook ID desde una variable de entorno o directamente
const webhookId = process.env.WEBHOOK_ID;
if (!webhookId) {
  throw new Error('WEBHOOK_ID is required');
}

const apiUrl = `https://chat.botpress.cloud/${webhookId}`;

let botpressClient;

// Inicializar cliente Botpress
const initializeClient = async () => {
  try {
    botpressClient = await chat.Client.connect({ apiUrl });
    console.log('Botpress Client connected');
  } catch (error) {
    console.error('Error connecting to Botpress Client:', error);
  }
};

// Endpoint para enviar un mensaje al bot
app.post('/send-message', async (req, res) => {
  const { userId, text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({ error: 'userId and text are required' });
  }

  try {
    // Crear una nueva conversación si no existe
    const { conversation } = await botpressClient.createConversation({});

    // Enviar mensaje al bot
    await botpressClient.createMessage({
      conversationId: conversation.id,
      payload: {
        type: 'text',
        text,
      },
    });

    // Esperar un poco para recibir respuesta
    setTimeout(async () => {
      // Listar mensajes de la conversación
      const { messages } = await botpressClient.listConversationMessages({
        id: conversation.id,
      });

      // Obtener la respuesta del bot (asumiendo que es el segundo mensaje)
      const botResponse = messages.find((m) => m.userId !== userId);
      res.status(200).json({
        userMessage: text,
        botResponse: botResponse?.payload?.text || 'No response from bot',
      });
    }, 2000);
  } catch (error) {
    console.error('Error enviando el mensaje:', error);
    res.status(500).json({ error: 'Ocurrió un error al enviar el mensaje' });
  }
});

// Iniciar el cliente y luego el servidor
initializeClient().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API de Botpress ejecutándose en el puerto ${PORT}`);
  });
});
