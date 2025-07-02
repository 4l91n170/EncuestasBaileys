import {environment} from '../../environments/environment'
import axios from 'axios'
import { EncuestasBaileys } from '../Models/Message.Model'



export class ServiceIndexService {

private url = environment.url

// public async getNumeros(sock:any) {
//    try{
//    const {data} = await axios.get(`${this.url}/`)
//    for (const contacto of data){
//       const concat = contacto.numeroCel + '@s.whatsapp.net'
//       const mensaje = `Hola ${contacto.Nombre}, este es un mensaje automático.`

//       await sock.sendMessage(concat,{text:mensaje})
//       console.log(`Mensaje enviado a ${contacto.Nombre}`)
//    }
//    }
//    catch (error) {
//     console.error('❌ Error al leer la API o enviar mensajes:', error)
    
// }
// }
public async getNumerosMock(sock: any){
   const numlist: number [] = [573193680827,573232310777,573195049964,573134370862]
   for(let number of numlist){
      const concat = number + '@s.whatsapp.net'
      const mensaje = `Hola ${number}, este es un mensaje automático.`
      await sock.sendMessage(concat,{text:mensaje})
      console.log(`Mensaje enviado a ${number}`)
   }
}
}