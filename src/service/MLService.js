import axios from "axios";

export const registrarServicioParaML = async (data) => {
    try {
        await axios.post(process.env.ML_URL + "/registrar_datos", data);
    } catch (err) {
        console.log("Error enviando datos al ML:", err);
    }
};
