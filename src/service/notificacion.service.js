import Notificacion from "./models/Notificacion.js";
import Usuario from "../usuario/models/Usuario.js";
import { sendPushNotification } from "../firebase/firebase.service.js";

export const crearNotificacion = async (id_usuario, titulo, cuerpo) => {
  const user = await Usuario.findByPk(id_usuario);

  // 1. guardar en BD
  const noti = await Notificacion.create({
    id_usuario,
    titulo,
    cuerpo
  });

  // 2. Si tiene token_real, enviar FCM
  if (user?.token_real) {
    await sendPushNotification(user.token_real, titulo, cuerpo);
  }

  return noti;
};

export const listarPorUsuario = (id_usuario) => {
  return Notificacion.findAll({
    where: { id_usuario },
    order: [["fecha_envio", "DESC"]]
  });
};

export const marcarLeida = (id_notificacion) => {
  return Notificacion.update(
    { leido: true },
    { where: { id_notificacion } }
  );
};

export const marcarTodasLeidas = (id_usuario) => {
  return Notificacion.update(
    { leido: true },
    { where: { id_usuario } }
  );
};

export const eliminarNotificacion = (id_notificacion) => {
  return Notificacion.destroy({
    where: { id_notificacion }
  });
};

export const eliminarTodas = (id_usuario) => {
  return Notificacion.destroy({
    where: { id_usuario }
  });
};
