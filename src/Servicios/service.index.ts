import {environment} from '../../environments/environment'
import axios from 'axios'
import { ActualizarEncolamiento, DatosEncolamiento, guardarMensaje } from '../Models/Message.Model'
import cron from 'node-cron'


export class ServiceIndexService {


private url = environment.url
// Programacion de los envios de mensajes
 public programarEnvioJueves(sock: any) {
    // 0 9 * * 4 → Todos los jueves a las 09:00 AM
    cron.schedule ('22 21 * * 1', () => {
      
      this.getEnvioAutomatico(sock)
       // Aquí se llama el método que ya tienes
    })
  }

   public async getEnvioAutomatico(sock: any) {
  axios.get(`${this.url}/EnvioAutomatico/EnvioAutomatico`)
    .then((response) => {
       
      if (response.data.data === true ) {
        // Si getEncolamiento es async, puedes encadenarlo también con .then()
        this.getEncolamiento(sock)
          .then(() => {})
          .catch((error) => {
            console.error('❌ Error en getEncolamiento:', error);
          });
      }
      // console.log('✅ Mensaje automático obtenido');
    })
    .catch((error) => {
      console.error('❌ Error al obtener el mensaje automático:', error);
    });
}
// Get encolamiento
 public async getEncolamiento(sock:any) {
   try{
   const response = await axios.get(`${this.url}/Baileys/GetEncolamiento`)
   
   const datosEncolamiento: DatosEncolamiento[] = response.data.data
   
   if (!Array.isArray(datosEncolamiento) || datosEncolamiento.length === 0) {
        console.warn('⚠️ No se encontraron contactos.')
        return
      }

      const tamañoGrupo = 5

      const listaIds: ActualizarEncolamiento[] = []
      // Función para enviar mensaje a un grupo
      const enviarGrupo = async (grupo: DatosEncolamiento[], indiceGrupo: number) => {
        for (const contacto of grupo) {
          const numero =  contacto.telefono
          const mensaje = `${contacto.pregunta} ${contacto.nombre}.`
          
          await sock.sendMessage( numero, { text: mensaje })
         
          
          listaIds.push({ id: contacto.id })
          await this.postGuardadoConversacion({
            nombre: contacto.nombre,
            telefono: contacto.telefono,
            fromme: true,// se debe poner true
            mensaje: mensaje,
            idPregunta: contacto.idPregunta,
            idClasificacion: contacto.idClasificacion
          
        })
      }
        await this.postActualizarEncolamiento(listaIds)
      
      }
      

      // Recorrer lista en grupos de 2 con retardo entre grupos
      for (let i = 0; i < datosEncolamiento.length; i += tamañoGrupo) {
        const grupo = datosEncolamiento.slice(i, i + tamañoGrupo)
        const delay =  (i / tamañoGrupo) * 5000 // espera entre grupos

        setTimeout(() => {
          enviarGrupo(grupo, i / tamañoGrupo)
        }, delay)
      }
    } catch (error) {
      console.error('❌ Error al leer la API o enviar mensajes:', error)
    }
  }
  // get Envio automatico
 

  // Post actualizar encolamiento
public async postActualizarEncolamiento(listaIds: ActualizarEncolamiento[]) {
  try
  {
    const response = await axios.post(`${this.url}/Baileys/ActualizarEncolamiento`, listaIds)
    
  }
  catch (error) {
    console.error('❌ Error al actualizar la encuesta')
  }
}

// Post guardado conversacion
public async postGuardadoConversacion(guardarMensaje: guardarMensaje) {
  try {
    // console.log('✌Guardando mensaje:', guardarMensaje)
    const response = await axios.post(`${this.url}/Baileys/GuardarMensaje`, guardarMensaje)
    
  }
  catch (error) {
    console.error('❌ Error al guardar la encuesta:', error)
  }
}

}