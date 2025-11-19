// 🟦 M11. Cómo Node llama a Flask

// En Node:
const axios = require("axios");
const haversine = require("../utils/haversine");


async function recomendarTecnicos(cliente, tecnico) {
    const distancia = haversine(
        cliente.lat,
        cliente.lon,
        tecnico.lat,
        tecnico.lon
    );

    const payload = {
        distancia,
        precio: tecnico.precio_estimado,
        calificacion: tecnico.calificacion_promedio || 3,
        tiempo_respuesta: tecnico.tiempo_respuesta || 60
    };

    const { data } = await axios.post(
        "http://localhost:5000/recomendar",
        payload
    );

    return { score: data.score, distancia };
}


// M12. Node ordena los técnicos por la puntuación del modelo
for (let tec of tecnicos) {
    const score = await recomendarTecnicos({
        distancia: calcularDistancia(cliente, tec),
        precio: tec.precio_estimado,
        calificacion: tec.calificacion_promedio,
        tiempo_respuesta: tec.tiempo_respuesta
    });
    
    tec.score = score.score;
}

tecnicos.sort((a, b) => b.score - a.score);


// 🟩 5️⃣ FLUJO COMPLETO M+7 (PROFESIONAL)

// 🔥 Node recibe una solicitud de servicio
// → guarda en PostgreSQL
// → manda notificaciones a técnicos

// 🔥 Node llama al microservicio ML
// → /recomendar
// → ML genera un ranking ordenado
// → Node presenta resultados al cliente

// 🔥 Microservicio ML re-entrena SOLO
// → trainer ejecuta cada 24 horas
// → modelo actualizado todos los días
// → aprendizaje automático continuo

// 🔥 Docker asegura deployment simple
// → docker-compose up -d
// → ambos servicios corriendo en producción

// 🔥 BI usa datos del histórico
// → perfectamente soportado



























// for (let tec of tecnicos) {
//     const { score } = await axios.post("http://localhost:5000/recomendar", {
//         lat_cliente: solicitud.lat,
//         lon_cliente: solicitud.lon,
//         lat_tecnico: tec.lat,
//         lon_tecnico: tec.lon,
//         precio: tec.precio,
//         calificacion: tec.calificacion_promedio,
//         tiempo_respuesta: tec.tiempo_respuesta
//     });

//     tec.score = score;
// }

// tecnicos.sort((a, b) => b.score - a.score);



module.exports = recomendarTecnicos;


// 🟦 4. ¿Cómo lo llama Node/Express?
// POST http://localhost:5005/recomendar

// BODY:

// {
//   "id_solicitud": 33
// }


// RESPUESTA:

// {
//   "id_solicitud": 33,
//   "tecnicos_recomendados": [
//     {
//       "id_tecnico": 12,
//       "distancia_km": 0.8,
//       "rating_promedio": 4.8,
//       "historico_rating": 4.9,
//       "cantidad_calificaciones": 20,
//       "precio_promedio": 40,
//       "ofertas_totales": 55,
//       "servicios_realizados": 12,
//       "disponibilidad": 1,
//       "score": 0.887
//     },
//     ...
//   ]
// }

// 🟩 🧠 ¿Qué acabamos de construir?
// ✔ Microservicio ML profesional

// → Flask + XGBoostRanker + PostgreSQL

// ✔ API /recomendar lista para Node

// → Devuelve técnicos rankeados

// ✔ Dataset dinámico

// → Calculado en tiempo real por solicitud

// ✔ Lista ordenada por score

// → Tu aplicación ya puede mostrar:

// "TÉCNICOS RECOMENDADOS PARA TI"

// igual que Uber, Glovo, Airbnb.