import { Boom } from '@hapi/boom'
import NodeCache from '@cacheable/node-cache'
import readline from 'readline'
import {ServiceIndexService} from '../src/Servicios/service.index'
import makeWASocket, {
  AnyMessageContent,
  BinaryInfo,
  delay,
  DisconnectReason,
  downloadAndProcessHistorySyncNotification,
  encodeWAM,
  fetchLatestBaileysVersion,
  getAggregateVotesInPollMessage,
  getHistoryMsg,
  isJidNewsletter,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
  WAMessageContent,
  WAMessageKey
} from '../src'
// import MAIN_LOGGER from '../src/Utils/logger'
import open from 'open'
import fs from 'fs'
import P from 'pino'

// 🔳 Descomenta si quieres mostrar el QR en forma visual en consola
// npm install qrcode-terminal
import qrcode from 'qrcode-terminal'

const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./wa-logs.txt'))
logger.level = 'trace'


const _serviceIndex = new ServiceIndexService
const doReplies = process.argv.includes('--do-reply')
const usePairingCode = process.argv.includes('--use-pairing-code')
const msgRetryCounterCache = new NodeCache()
const onDemandMap = new Map<string, string>()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    getMessage,
  })

  if (usePairingCode && !sock.authState.creds.registered) {
    const phoneNumber = await question('Please enter your phone number:\n')
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code: ${code}`)
  }

  const sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
    await sock.presenceSubscribe(jid)
    await delay(500)
    await sock.sendPresenceUpdate('composing', jid)
    await delay(2000)
    await sock.sendPresenceUpdate('paused', jid)
    await sock.sendMessage(jid, msg)
  }

  sock.ev.process(async (events) => {
    if (events['connection.update']) {
      const update = events['connection.update']
      const { connection, lastDisconnect, qr } = update

      //  Mostrar el QR en la consola, siempre y cuando este sin ningun vinculo en baileys_auth_info
      if (qr) {
        console.log('Escanea este QR:')
        qrcode.generate(qr, { small: true }) 
      }
	  // ---------------------------------------------------------------------------------------------------
	  // Se ejecuta cuando se cierra la conexion desde whatsapp
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        console.log('Conexión cerrada. ¿Reconectar?', shouldReconnect)
        if (shouldReconnect) startSock()
        else console.log('Sesión cerrada por completo.')
      }
	  // Cuando la sincronización es exitosa
      if (connection === 'open') {
        console.log('✅ ¡Conexión establecida con WhatsApp!')
        
        //Envio de los mensajes a los numeros mockeados
       _serviceIndex.getEnvioAutomatico(sock)
       console.log('✅ Mensajes automáticos enviados')
      }

      console.log('connection update', update)
    }

    if (events['creds.update']) {
      await saveCreds()
    }
//----------------------------------------------------------------------------------------------
//Todo lo que tiene que ver con los eventos de los mensajes
    if (events['messages.upsert']) {
      const upsert = events['messages.upsert']
      console.log('recv messages ', JSON.stringify(upsert, undefined, 2))

      if (upsert.type === 'notify') {
        for (const msg of upsert.messages) {
          const jid = msg.key.remoteJid!
          const isFromMe = msg.key.fromMe
          const mensajeTexto = msg.message?.conversation || msg.message?.extendedTextMessage?.text

          const ahora = Date.now() / 1000
          if (!isFromMe && mensajeTexto && msg.messageTimestamp && (ahora - Number(msg.messageTimestamp)) < 10) {
          //  const mensajeRecibido = {
          //   idMensaje: msg.key.id,
          //   de: jid,
          //   mensaje: mensajeTexto,
          //   fecha: new Date().toISOString(),
          //   fromme: msg.key.fromMe
          // }
            console.log('📩 Mensaje recibido')
             _serviceIndex.postGuardadoConversacion({
              nombre: '',
              telefono: jid,
              fromme:false,
              mensaje: mensajeTexto,
              idPregunta:  0, // Puedes ajustar esto según tu lógica
              idClasificacion: '' // Puedes ajustar esto según tu lógica
            })
            console.log('Mensaje guardado en la base de datos')
         
        // 📤 Responder automáticamente
        // await sock.sendMessage(jid, { text: `👋 Hola! Recibí tu mensaje: "${mensajeTexto}"` })
         
          }
        }
      }
    }

    // ... el resto de tus eventos permanece igual
  })

  return sock

  async function getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
    return proto.Message.fromObject({})
  }
}

startSock()
