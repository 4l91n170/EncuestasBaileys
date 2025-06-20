export interface datosFormularioAsistencia{
   Connection: ConnectionSession [];

}

export interface ConnectionSession{
 numeroCel: number;
 Nombre: string;
}
export interface Message{
 fromme : string;
 participante: string;
 messageTimestamp: string;
 conversation: string;
}