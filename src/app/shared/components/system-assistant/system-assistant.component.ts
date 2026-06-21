import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';

interface Message {
  sender: 'Asistente' | 'Tú';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-system-assistant',
  templateUrl: './system-assistant.component.html',
  styleUrls: ['./system-assistant.component.scss']
})
export class SystemAssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  isOpen = false;
  isTyping = false;
  chatInput = '';
  
  messages: Message[] = [];
  
  suggestions = [
    { text: '🔑 ¿Cómo funciona el RFID?', category: 'rfid' },
    { text: '📷 ¿Cómo uso la cámara / ZXing?', category: 'scanner' },
    { text: '⚙️ ¿Qué son los escenarios?', category: 'scenarios' },
    { text: '🤖 ¿Cómo hablo con clientes IA?', category: 'chat' },
    { text: '📅 ¿Cómo aplico descuentos e IVA?', category: 'promotions' },
    { text: '👤 ¿Qué roles existen?', category: 'roles' }
  ];

  ngOnInit(): void {
    // Mensaje de bienvenida inicial
    this.messages.push({
      sender: 'Asistente',
      text: '👋 ¡Hola! Soy el asistente virtual de **TrainShier**. Estoy aquí para guiarte en el uso de la plataforma. Puedes preguntarme cualquier duda sobre el sistema o seleccionar una de las sugerencias rápidas.',
      timestamp: new Date()
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  sendMessage(textToSend?: string): void {
    const text = (textToSend || this.chatInput).trim();
    if (!text) return;

    if (!textToSend) {
      this.chatInput = '';
    }

    // Añadir mensaje del usuario
    this.messages.push({
      sender: 'Tú',
      text: text,
      timestamp: new Date()
    });

    this.isTyping = true;
    this.scrollToBottom();

    // Simular un retraso en la respuesta del bot para que se sienta dinámico
    setTimeout(() => {
      this.isTyping = false;
      const response = this.generateResponse(text);
      this.messages.push({
        sender: 'Asistente',
        text: response,
        timestamp: new Date()
      });
      this.scrollToBottom();
    }, 700);
  }

  selectSuggestion(suggestion: string): void {
    this.sendMessage(suggestion);
  }

  private generateResponse(input: string): string {
    const normalized = this.normalizeText(input);

    // Detección de palabras clave y lógica de respuestas
    if (this.matches(normalized, ['rfid', 'tarjeta', 'lector', 'uid', 'llavero', 'identificacion', 'identificación'])) {
      return '🔑 **Inicio de Sesión con RFID**:\n\n' +
             'En TrainShier puedes iniciar sesión acercando tu tarjeta RFID física al lector USB sin necesidad de hacer clic en ningún campo.\n\n' +
             '**Simulación de Tarjetas (Demo)**:\n' +
             'Si no dispones de un lector físico, ve a la pantalla de Inicio de Sesión, presiona el botón **"Acceso con Tarjeta RFID"** y selecciona una de las cuentas demo preconfiguradas:\n' +
             '- Cajero Aprendiz: `1029384756`\n' +
             '- Instructor: `5678901234`\n' +
             '- Administrador: `9876543210`';
    }

    if (this.matches(normalized, ['camara', 'cámara', 'escanear', 'escaner', 'escáner', 'zxing', 'barras', 'codigo', 'código', 'pistola'])) {
      return '📷 **Escaneo de Códigos de Barras**:\n\n' +
             'Para registrar productos en el carrito de compras del simulador:\n' +
             '1. **Pistola de Códigos USB**: Haz clic en el campo de texto de registro en el simulador y dispara el gatillo del lector físico apuntando al código de barras del producto.\n' +
             '2. **Lector de Cámara (ZXing)**: Haz clic en el botón **"📷 Escanear Cámara"**, otorga los permisos necesarios, apunta el código del producto a la lente y se añadirá de forma instantánea al carrito.';
    }

    if (this.matches(normalized, ['dificultad', 'facil', 'fácil', 'medio', 'media', 'dificil', 'difícil', 'escenario', 'actitud', 'temperamento', 'paciencia', 'estres', 'estrés'])) {
      return '⚙️ **Configuración de Escenarios y Dificultad**:\n\n' +
             'Antes de presionar "Iniciar Simulación", puedes parametrizar:\n' +
             '- **Dificultad (Fácil, Media, Difícil)**: Define el tiempo base disponible y las penalizaciones por demoras o errores.\n' +
             '- **Actitud del Cliente**:\n' +
             '  - 😊 *Amable*: Tiene mucha paciencia, el tiempo avanza despacio y responde de manera atenta.\n' +
             '  - ⏱️ *Impaciente*: Poca tolerancia y el contador avanza rápidamente.\n' +
             '  - 😠 *Enojado*: Comienza con paciencia muy baja. Requiere máxima velocidad y exactitud.\n' +
             '  - ❓ *Confundido*: Realizará preguntas sobre los descuentos y los precios del día en el chat.';
    }

    if (this.matches(normalized, ['conversar', 'chat', 'conversacion', 'conversación', 'pregunta', 'gemini', 'inteligencia', 'ia', 'cliente ia'])) {
      return '🤖 **Clientes con Inteligencia Artificial (Gemini)**:\n\n' +
             'Durante una simulación activa, puedes chatear en tiempo real con el cliente simulado en la tarjeta de chat. El cliente responderá contextualmente de forma única, usando la API de **Google Gemini**.\n\n' +
             'Puedes responder a sus quejas, aclararle precios o preguntarle cosas como *"¿Desea bolsa plástica?"* o *"¿Tiene tarjeta de puntos?"* para sumar puntos adicionales en tu simulación.';
    }

    if (this.matches(normalized, ['calendario', 'promocion', 'promoción', 'descuento', 'descuentos', 'halloween', 'navidad', 'fecha', 'fechas'])) {
      return '📅 **Calendario Comercial y Promociones**:\n\n' +
             'El simulador cuenta con un selector de fechas. Dependiendo de la festividad comercial, se aplican descuentos automáticos:\n' +
             '- **Halloween (31 de Octubre)**: 10% de descuento.\n' +
             '- **Navidad (24/25 de Diciembre)**: 15% de descuento.\n' +
             '- **Año Nuevo (1 de Enero)**: 20% de descuento.\n\n' +
             'Ten en cuenta que los clientes (especialmente los confundidos) te reclamarán si no aplicas correctamente estos beneficios.';
    }

    if (this.matches(normalized, ['iva', 'impuesto', 'impuestos', 'colombia'])) {
      return '💰 **Cálculo del IVA (19%)**:\n\n' +
             'Conforme a la legislación colombiana, el sistema calcula de manera automática el **19% de IVA** sobre el subtotal de los productos registrados. Puedes ver el desglose en tiempo real dentro del panel de **"Liquidación"** antes de registrar el pago.';
    }

    if (this.matches(normalized, ['pago', 'caja', 'efectivo', 'cambio', 'vueltas', 'pagar', 'dinero', 'tarjeta', 'liquidacion', 'liquidación'])) {
      return '🛒 **Proceso de Cobro y Liquidación**:\n\n' +
             '1. Una vez cargado el carrito, presiona **"Pagar Ahora"**.\n' +
             '2. Selecciona el medio de pago del cliente (Efectivo, Débito, Crédito, etc.).\n' +
             '3. Si es en **Efectivo**, digita la cantidad recibida. El sistema te mostrará el cambio (vueltas) a entregar.\n' +
             '4. Presiona **"Registrar Venta"** para finalizar la transacción. ¡Evita equivocarte de vueltas o perderás puntos de paciencia del cliente!';
    }

    if (this.matches(normalized, ['rol', 'roles', 'aprendiz', 'instructor', 'admin', 'administrador', 'cajero', 'instructor'])) {
      return '👤 **Roles en TrainShier**:\n\n' +
             '- **Aprendiz**: Rol operativo principal. Puede entrenar en el simulador, ver su manual y realizar simulaciones de caja.\n' +
             '- **Instructor**: Rol de supervisión. Puede registrar, editar y eliminar productos del inventario de simulación, además de dejar comentarios de evaluación.\n' +
             '- **Administrador**: Control total del sistema y estadísticas globales.';
    }

    if (this.matches(normalized, ['iniciar', 'empezar', 'comenzar', 'simulacion', 'simulación'])) {
      return '🚀 **Cómo iniciar una Simulación**:\n\n' +
             '1. Ve a la sección **"Simulador"**.\n' +
             '2. Haz clic en el botón **"⚙️ Configurar e Iniciar"** de la parte superior para ir directo al panel de configuración.\n' +
             '3. Escoge la dificultad y la actitud de tu cliente.\n' +
             '4. Presiona **"Iniciar Simulación"** y ¡comienza a escanear productos!';
    }

    if (this.matches(normalized, ['manual', 'ayuda', 'guia', 'guía', 'instrucciones', 'documentacion', 'documentación'])) {
      return '📖 **Manual de Operaciones**:\n\n' +
             'El manual está disponible de forma completa en el menú superior. Allí se detallan técnicamente los flujos de inicio de sesión RFID, la emulación de teclado, y la lógica impositiva/descuentos del sistema.';
    }

    if (this.matches(normalized, ['hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'quien eres', 'asistente', 'ayuda'])) {
      return '👋 ¡Hola! Soy el asistente virtual de **TrainShier**.\n\n' +
             'Mi objetivo es orientarte en la operación del simulador y del sistema. Puedes consultarme acerca de:\n' +
             '- **🔑 Tarjetas RFID** y cómo loguearte.\n' +
             '- **📷 Escáner de Cámara (ZXing)**.\n' +
             '- **🤖 Chat de Clientes con Gemini**.\n' +
             '- **📅 Calendario e IVA**.\n' +
             '- **👤 Roles de usuario**.\n\n' +
             '¿En qué puedo ayudarte hoy?';
    }

    return 'Hmm, no he logrado identificar esa consulta en mi base de conocimientos. 🧐\n\n' +
           'Por favor, intenta usar palabras clave más simples como **RFID**, **Cámara**, **Escenarios**, **Clientes IA**, **IVA**, **Calendario** o **Pago**. También puedes consultar el **Manual de Operaciones** en el menú superior.';
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover tildes y diacríticos
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => {
      const normalizedKeyword = this.normalizeText(keyword);
      return text.includes(normalizedKeyword);
    });
  }

  private scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Ignorar si el elemento no está disponible aún
    }
  }
}
