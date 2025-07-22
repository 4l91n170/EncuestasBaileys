export interface EncuestasBaileys {
    code:    number;
    message: string;
    data:    DatosEncolamiento[];
    
}

export interface DatosEncolamiento {
    id:              string;
    telefono:        string;
    nombre:          string;
    idPregunta:      number;
    pregunta:        string;
    idClasificacion: string;
}
export interface ActualizarEncolamiento {
    id: string;
}
export interface guardarMensaje {
    nombre:     string;
    telefono:   string;
    fromme:     boolean;
    mensaje:    string;
    idPregunta: number;
    idClasificacion: string;
}