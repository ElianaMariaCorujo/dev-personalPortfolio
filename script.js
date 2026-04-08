const form = document.getElementById("form-contacto");
const estado = document.getElementById("mensaje-estado");

function validarCampo(campo, errorId, mensaje) {
  const error = document.getElementById(errorId);
  if (!error) return true;

  if (!campo.value.trim()) {
    error.textContent = mensaje;
    return false;
  }

  error.textContent = "";
  return true;
}

if (form && estado) {
  const nombre = document.getElementById("nombre");
  const mail = document.getElementById("mail");
  const consulta = document.getElementById("consulta");

  nombre?.addEventListener("input", () =>
    validarCampo(nombre, "error-nombre", "Por favor, comparti tu nombre elegido.")
  );
  mail?.addEventListener("input", () => {
    const error = document.getElementById("error-mail");
    if (!error || !mail) return;

    if (!mail.value.trim()) {
      error.textContent = "Necesitamos un mail para responderte.";
      return;
    }

    if (!mail.checkValidity()) {
      error.textContent = "El formato del mail parece incompleto. Revisalo por favor.";
      return;
    }

    error.textContent = "";
  });
  consulta?.addEventListener("input", () =>
    validarCampo(
      consulta,
      "error-consulta",
      "Contanos tu consulta para ayudarte mejor."
    )
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nombreOk = validarCampo(
      nombre,
      "error-nombre",
      "Por favor, comparti tu nombre elegido."
    );
    const consultaOk = validarCampo(
      consulta,
      "error-consulta",
      "Contanos tu consulta para ayudarte mejor."
    );
    const mailError = document.getElementById("error-mail");
    const mailOk = !!mail?.value.trim() && mail.checkValidity();
    if (mailError && !mailOk) {
      mailError.textContent = !mail?.value.trim()
        ? "Necesitamos un mail para responderte."
        : "El formato del mail parece incompleto. Revisalo por favor.";
    }

    if (!nombreOk || !mailOk || !consultaOk) {
      estado.textContent =
        "Todavia hay campos por revisar. Te mostramos mensajes claros en cada campo.";
      return;
    }

    estado.textContent = "Gracias por tu consulta. Te respondemos a la brevedad.";
    form.reset();
  });
}

const botonesAudio = document.querySelectorAll("[data-audio-target]");
const soportaAudio = "speechSynthesis" in window;

botonesAudio.forEach((boton) => {
  boton.addEventListener("click", () => {
    const targetId = boton.getAttribute("data-audio-target");
    const parrafo = targetId ? document.getElementById(targetId) : null;
    if (!parrafo) return;

    if (!soportaAudio) {
      if (estado) {
        estado.textContent =
          "Tu navegador no soporta sintesis de voz. Podes usar lector de pantalla.";
      }
      return;
    }

    window.speechSynthesis.cancel();
    const lectura = new SpeechSynthesisUtterance(parrafo.textContent || "");
    lectura.lang = "es-AR";
    lectura.rate = 1;
    window.speechSynthesis.speak(lectura);
  });
});
