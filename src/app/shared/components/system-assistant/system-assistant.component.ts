import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

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
    { text: '¿Cómo funciona el RFID?', category: 'rfid' },
    { text: '¿Cómo uso la cámara o escáner?', category: 'scanner' },
    { text: '¿Qué son los escenarios de dificultad?', category: 'scenarios' },
    { text: '¿Cómo hablo con clientes por inteligencia artificial?', category: 'chat' },
    { text: '¿Cómo aplico descuentos e IVA?', category: 'promotions' },
    { text: '¿Qué roles de usuario existen?', category: 'roles' }
  ];

  constructor(
    private elementRef: ElementRef,
    private userService: UserService
  ) {}

  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent): void {
    if (!this.isOpen) return;

    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  ngOnInit(): void {
    // Mensaje de bienvenida inicial sin emojis, comillas ni caracteres especiales
    this.messages.push({
      sender: 'Asistente',
      text: 'Hola. Soy el agente asistente virtual de TrainShier. Estoy aquí para orientarle en el funcionamiento del simulador y de la plataforma. Puede consultarme sobre el acceso por tarjetas RFID, el escáner de cámara para productos, la liquidación, el IVA y los descuentos, la conversación por Inteligencia Artificial o los roles disponibles. Escriba su pregunta o seleccione una sugerencia.',
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

    // Consultar al asistente virtual en el backend (Gemini con Notion Context)
    this.userService.askAssistant(text).subscribe({
      next: (res: any) => {
        this.isTyping = false;
        let cleanText = res.response || '';
        
        // Sanitizar y limpiar texto de comillas, asteriscos y emojis
        cleanText = cleanText
          .replace(/[\"*`]/g, '') // Quitar comillas dobles, asteriscos y backticks
          .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '') // Quitar emojis
          .replace(/'/g, '') // Quitar comillas simples
          .trim();

        if (!cleanText) {
          cleanText = 'Lo siento, no he podido generar una respuesta para tu consulta.';
        }

        this.messages.push({
          sender: 'Asistente',
          text: cleanText,
          timestamp: new Date()
        });
        this.scrollToBottom();
      },
      error: (err: any) => {
        this.isTyping = false;
        // Fallback local en caso de que el backend falle o no tenga API Key
        const fallback = this.generateResponse(text);
        this.messages.push({
          sender: 'Asistente',
          text: fallback,
          timestamp: new Date()
        });
        this.scrollToBottom();
      }
    });
  }

  selectSuggestion(suggestion: string): void {
    this.sendMessage(suggestion);
  }
  private generateResponse(input: string): string {
    const normalized = this.normalizeText(input);

    if (this.matches(normalized, ['que es trainshier', 'trainshier', 'plataforma', 'sistema', 'proyecto'])) {
      return 'TrainShier es una plataforma educativa interactiva diseñada para la formación y el entrenamiento de aprendices en operaciones de caja POS y atención al cliente. Integra tecnologías modernas como identificación por RFID, escaneo de códigos de barra mediante cámara web y un simulador de clientes con Inteligencia Artificial.';
    }

    if (this.matches(normalized, ['que es el simulador', 'simulador', 'funcionamiento del simulador', 'entrenamiento'])) {
      return 'El simulador de TrainShier es un entorno de simulación en tiempo real en el cual los aprendices pueden practicar el registro de productos en un sistema de caja registradora POS, el cálculo del IVA y promociones de temporada, el proceso de facturación y la interacción con clientes que tienen temperamentos variados y respuestas dinámicas gracias a la Inteligencia Artificial.';
    }

    if (this.matches(normalized, ['rfid', 'tarjeta', 'lector', 'uid', 'llavero', 'identificacion', 'identificación'])) {
      return 'Inicio de sesión con RFID: En TrainShier puede iniciar sesión acercando su tarjeta RFID física al lector USB sin necesidad de hacer clic en ningún campo.\n\n' +
             'Simulación de Tarjetas Demo:\n' +
             'Si no dispone de un lector físico, vaya a la pantalla de Inicio de Sesión, presione el botón Acceso con Tarjeta RFID y seleccione una de las cuentas demo preconfiguradas:\n' +
             '- Cajero Aprendiz con el código 1029384756\n' +
             '- Instructor con el código 5678901234\n' +
             '- Administrador con el código 9876543210';
    }

    if (this.matches(normalized, ['camara', 'cámara', 'escanear', 'escaner', 'escáner', 'zxing', 'barras', 'codigo', 'código', 'pistola'])) {
      return 'Escaneo de códigos de barras: Para registrar productos en el carrito de compras del simulador tiene dos opciones.\n\n' +
             'La primera es usar una pistola de códigos USB, haciendo clic en el campo de texto de registro en el simulador y disparando el gatillo del lector físico apuntando al código del producto.\n\n' +
             'La segunda es usar el lector de cámara integrado con la tecnología ZXing, donde debe presionar el botón Escanear Cámara, autorizar los permisos en el navegador, y apuntar el código de barras del producto hacia la lente para agregarlo instantáneamente al carrito.';
    }

    if (this.matches(normalized, ['dificultad', 'facil', 'fácil', 'medio', 'media', 'dificil', 'difícil', 'escenario', 'actitud', 'temperamento', 'paciencia', 'estres', 'estrés'])) {
      return 'Configuración de escenarios y dificultad: Antes de iniciar la simulación, en la tarjeta Configurar Escenario, puede definir la dificultad en niveles Fácil, Media o Difícil, lo cual ajusta el tiempo de tolerancia para atender y las penalizaciones.\n\n' +
             'También puede elegir el temperamento del cliente entre Amable (alta paciencia y tiempo lento), Impaciente (contador rápido), Enojado (paciencia muy baja y máxima exigencia) y Confundido (quien hará preguntas de precios y promociones en el chat del simulador).';
    }

    if (this.matches(normalized, ['conversar', 'chat', 'conversacion', 'conversación', 'pregunta', 'gemini', 'inteligencia', 'ia', 'cliente ia'])) {
      return 'Clientes con Inteligencia Artificial: En la simulación activa se habilita un chat impulsado por la tecnología de Google Gemini. Puede escribirle preguntas reales al cliente, como si tiene tarjeta de puntos, si desea bolsa o aclarar dudas de su compra.\n\n' +
             'El cliente procesará sus mensajes de forma dinámica y le responderá adoptando una personalidad y estado de ánimo específicos. Esto simula la interacción real de atención al cliente de un cajero de supermercado.';
    }

    if (this.matches(normalized, ['calendario', 'promocion', 'promoción', 'descuento', 'descuentos', 'halloween', 'navidad', 'fecha', 'fechas'])) {
      return 'Calendario comercial y promociones: El simulador incluye cálculos automáticos del IVA del 19 por ciento para Colombia sobre el subtotal de la compra.\n\n' +
             'Además, puede seleccionar fechas especiales en el calendario de ventas para aplicar descuentos promocionales. Por ejemplo, en Halloween se aplica un 10 por ciento de descuento, en Navidad un 15 por ciento y en Año Nuevo un 20 por ciento. Los clientes esperan ver estos descuentos aplicados correctamente en su total de compra.';
    }

    if (this.matches(normalized, ['iva', 'impuesto', 'impuestos', 'colombia'])) {
      return 'Cálculo del IVA (19%): Conforme a la legislación colombiana, el sistema calcula de manera automática el 19 por ciento de IVA sobre el subtotal de los productos registrados. Puede ver el desglose en tiempo real dentro del panel de Liquidación antes de registrar el pago de la simulación.';
    }

    if (this.matches(normalized, ['pago', 'caja', 'efectivo', 'cambio', 'vueltas', 'pagar', 'dinero', 'tarjeta', 'liquidacion', 'liquidación'])) {
      return 'Proceso de cobro y pago: Tras registrar todos los artículos solicitados por el cliente, haga clic en Pagar Ahora para avanzar a la caja registradora.\n\n' +
             'Allí podrá seleccionar el método de pago de preferencia del cliente. Si es en Efectivo, ingrese la suma entregada y el simulador calculará el cambio exacto. Presione Registrar Venta para finalizar la transacción. Si el cambio es incorrecto o si demora demasiado tiempo, la satisfacción del cliente disminuirá afectando su puntaje.';
    }

    if (this.matches(normalized, ['rol', 'roles', 'aprendiz', 'instructor', 'admin', 'administrador', 'cajero', 'instructor'])) {
      return 'Roles de usuario: El sistema cuenta con tres perfiles de acceso. El Aprendiz u Operador de Caja realiza entrenamientos en el simulador, visualiza el manual y registra transacciones.\n\n' +
             'El Instructor supervisa el progreso, agrega, edita o elimina productos del inventario de simulación y escribe calificaciones de evaluación. El Administrador gestiona el sistema en su totalidad y revisa estadísticas globales.';
    }

    if (this.matches(normalized, ['iniciar', 'empezar', 'comenzar', 'simulacion', 'simulación'])) {
      return 'Cómo iniciar el simulador: Diríjase al módulo del Simulador en el menú superior. Puede presionar el botón flotante en la parte derecha para bajar directo a la sección de Configurar Escenario.\n\n' +
             'Seleccione el nivel de dificultad y la actitud del cliente, y haga clic en Iniciar Simulación. Esto activará el temporizador y el panel de chat con el cliente.';
    }

    if (this.matches(normalized, ['manual', 'ayuda', 'guia', 'guía', 'instrucciones', 'documentacion', 'documentación'])) {
      return 'Manual de operaciones: Puede ingresar al Manual de operaciones desde el menú de navegación. En esta sección encontrará detalladas las explicaciones de la emulación de teclado para RFID, el funcionamiento de la cámara, la fórmula de impuestos colombianos y la interacción de Google Gemini en el chat.';
    }

    if (this.matches(normalized, ['hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'quien eres', 'asistente', 'ayuda'])) {
      return 'Hola. Soy el agente asistente virtual de TrainShier. Estoy aquí para orientarle en el funcionamiento del simulador y de la plataforma.\n\n' +
             'Puede consultarme sobre el acceso por tarjetas RFID, el escáner de cámara para productos, la liquidación, el IVA y los descuentos, la conversación por Inteligencia Artificial o los roles disponibles. Escriba su pregunta o seleccione una sugerencia.';
    }

    return 'No he podido encontrar una respuesta directa a su pregunta en mi base de conocimientos. Por favor intente consultar utilizando palabras sencillas como RFID, cámara, escenario, pago, IVA, descuentos o roles. También puede revisar el Manual en el menú superior.';
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
