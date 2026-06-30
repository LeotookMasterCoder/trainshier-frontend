import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../../core/services/product.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';
import { environment } from '../../../../environments/environment';

interface Product {
  id: number;
  code: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  iva?: number;
}

interface CartItem {
  code: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  iva?: number;
}

interface Sale {
  product: string;
  quantity: number;
  total: number;
  date: string;
}

interface SimulationSummary {
  finalScore: number;
  totalSalesCount: number;
  totalServedProducts: number;
  totalClientsAttended: number;
  averageSatisfaction: number;
  completionDate: string;
}

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent implements OnInit {

  /* =========================================
      ESTADÍSTICAS FLOTANTES
  ========================================= */
  showStats: boolean = false;
  h: boolean = false;
  @ViewChild('statsDropdown') statsDropdown!: ElementRef;

  /* =========================================
      ROLES
  ========================================= */
  role: string = 'APRENDIZ';

  /* =========================================
      ESTADO GENERAL Y MENSAJES (TOASTS)
  ========================================= */
  simulationStarted = false;
  simulationFinished = false;

  successMessage = '';
  errorMessage = '';

  // Arqueo de Caja variables
  showAperturaModal = false;
  initialCash = 100000;
  cashSalesTotal = 0;
  cardSalesTotal = 0;
  showArqueoModal = false;
  physicalCashCount: number | null = null;
  arqueoResult: any = null;

  score = 0;
  salesCount = 0;
  servedProducts = 0;
  totalClients = 0;

  timeLeft = 60;
  timer: any;

  difficulty = 'MEDIA';

  /* =========================================
      REPORTE GUARDADO
  ========================================= */
  savedSimulationReport: SimulationSummary | null = null;

  /* =========================================
      IA COACH
  ========================================= */
  traineeResponse = '';
  coachFeedback = '';
  customerSatisfaction = 100;

  /* =========================================
      CALENDARIO
  ========================================= */
  saleDate = new Date().toISOString().split('T')[0];
  specialEvent = 'Día Normal';
  specialDiscount = 0;
  discountValue = 0;

  /* =========================================
      CLIENTE IA & CONFIGURACIONES AVANZADAS
  ========================================= */
  selectedDifficulty: string = 'Fácil';
  selectedMood: string = 'Amable';
  patienceValue: number = 100;

  chatMessages: { sender: string; text: string; barcodes?: string[] }[] = [];
  chatMessageInput: string = '';
  isChatLoading: boolean = false;

  // Barcode search modal
  showSearchProductsModal: boolean = false;
  private scanBuffer: string = '';
  private lastScanTime: number = 0;

  currentCustomer: any = {
    name: '',
    mood: '',
    patience: 100,
    request: '',
    message: ''
  };

  customers = [
    {
      name: 'Laura Gómez',
      mood: 'Feliz',
      patience: 5,
      request: '2 Leches y 1 Pan',
      message: 'Buenos días, necesito dos leches y un pan por favor.'
    },
    {
      name: 'Carlos Ruiz',
      mood: 'Apurado',
      patience: 2,
      request: '1 Chocolate',
      message: 'Tengo poco tiempo, por favor atiéndeme rápido.'
    },
    {
      name: 'Martha Díaz',
      mood: 'Molesta',
      patience: 1,
      request: '1 Arroz Premium',
      message: 'La vez pasada me cobraron mal.'
    },
    {
      name: 'Valentina Castro',
      mood: 'Impaciente',
      patience: 2,
      request: '3 Gaseosas',
      message: '¿Falta mucho para terminar?'
    },
    {
      name: 'Andrés Moreno',
      mood: 'Tranquilo',
      patience: 5,
      request: '2 Chocolates',
      message: 'Gracias por atenderme.'
    }
  ];

  /* =========================================
      PRODUCTOS Y BUSCADOR
  ========================================= */
  products: Product[] = [];

  newProduct = {
    name: '',
    code: '',
    barcode: '',
    price: 0,
    stock: 0
  };

  // Barcode Modal
  barcodeModalUrl: string = '';
  barcodeModalName: string = '';
  showBarcodeModalFlag: boolean = false;
  visibleProductsCount: number = 10;

  searchQuery: string = '';

  get filteredProducts(): Product[] {
    if (!this.searchQuery.trim()) {
      return this.products;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }

  showBarcodeModal(barcode: string, productName: string): void {
    this.barcodeModalUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode.trim()}&scale=3&rotate=N&includetext`;
    this.barcodeModalName = productName;
    this.showBarcodeModalFlag = true;
  }

  /* =========================================
      CARRITO
  ========================================= */
  cart: CartItem[] = [];
  productCode = '';
  subtotal = 0;
  ivaPercentage = 19;
  ivaValue = 0;
  totalToPay = 0;
  paymentMethod = 'Efectivo';
  cashReceived : number | null = null;
  change = 0;

  /* =========================================
      HISTORIAL
  ========================================= */
  salesHistory: Sale[] = [];

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private reportService: ReportService,
    private http: HttpClient
  ) {}

  /* =========================================
      INIT
  ========================================= */
  ngOnInit(): void {
    const savedRole = localStorage.getItem('role');

    if (savedRole) {
      this.role = savedRole.toUpperCase();
    }

    this.loadProducts();
    this.loadSalesHistory();
    this.generateCustomer();
    this.updateSpecialDay();
  }

  /* =========================================
      SISTEMA AUXILIAR DE NOTIFICACIONES (TOAST)
  ========================================= */
  private showToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.errorMessage = message;
      this.successMessage = '';
      setTimeout(() => this.errorMessage = '', 3000);
    } else {
      this.successMessage = message;
      this.errorMessage = '';
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  /* =========================================
      MÉTODOS CONTROL DE INTERFAZ
  ========================================= */
  toggleStats(event: Event): void {
    event.stopPropagation();
    this.showStats = !this.showStats;
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: MouseEvent): void {
    if (
      this.showStats &&
      this.statsDropdown &&
      !this.statsDropdown.nativeElement.contains(event.target)
    ) {
      this.showStats = false;
    }
  }

  /* =========================================
      LOCAL STORAGE & DATABASE INTEGRATION
  ========================================= */
  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.products = res.map(p => ({
            id: p.id,
            code: p.barcode, // Map barcode to code for compatibility
            barcode: p.barcode,
            name: p.name,
            price: p.price,
            stock: p.stock
          }));
          this.saveProducts();
        } else {
          this.seedDefaultProducts();
        }
      },
      error: (err) => {
        console.error('Error loading products from database, using fallback:', err);
        this.loadProductsFromFallback();
      }
    });
  }

  seedDefaultProducts(): void {
    const defaultProducts = [
      { name: 'Leche 1L', price: 4500, stock: 50, barcode: '7701001001', active: true },
      { name: 'Pan Integral', price: 5500, stock: 40, barcode: '7701001002', active: true },
      { name: 'Chocolate', price: 3000, stock: 60, barcode: '7701001003', active: true },
      { name: 'Arroz Premium', price: 8000, stock: 35, barcode: '7701001004', active: true },
      { name: 'Gaseosa Cola', price: 6000, stock: 80, barcode: '7701001005', active: true }
    ];
    
    let completed = 0;
    defaultProducts.forEach(prod => {
      this.productService.create(prod).subscribe({
        next: () => {
          completed++;
          if (completed === defaultProducts.length) {
            this.productService.getAll().subscribe(res => {
              this.products = res.map(p => ({
                id: p.id,
                code: p.barcode,
                barcode: p.barcode,
                name: p.name,
                price: p.price,
                stock: p.stock
              }));
              this.saveProducts();
            });
          }
        },
        error: (err) => console.error('Error seeding default product:', err)
      });
    });
  }

  loadProductsFromFallback(): void {
    const savedProducts = localStorage.getItem('trainshier_products');
    if (savedProducts) {
      this.products = JSON.parse(savedProducts);
      return;
    }

    this.products = [
      { id: 1, code: '1001', barcode: '7701001001', name: 'Leche 1L', price: 4500, stock: 50 },
      { id: 2, code: '1002', barcode: '7701001002', name: 'Pan Integral', price: 5500, stock: 40 },
      { id: 3, code: '1003', barcode: '7701001003', name: 'Chocolate', price: 3000, stock: 60 },
      { id: 4, code: '1004', barcode: '7701001004', name: 'Arroz Premium', price: 8000, stock: 35 },
      { id: 5, code: '1005', barcode: '7701001005', name: 'Gaseosa Cola', price: 6000, stock: 80 }
    ];
    this.saveProducts();
  }

  saveProducts(): void {
    localStorage.setItem('trainshier_products', JSON.stringify(this.products));
  }

  loadSalesHistory(): void {
    const saved = localStorage.getItem('trainshier_sales');
    if (saved) {
      this.salesHistory = JSON.parse(saved);
    }
  }

  saveSalesHistory(): void {
    localStorage.setItem('trainshier_sales', JSON.stringify(this.salesHistory));
  }

  /* =========================================
      CLIENTE IA
  ========================================= */
  generateCustomer(): void {
    const randomIndex = Math.floor(Math.random() * this.customers.length);
    this.currentCustomer = this.customers[randomIndex];
    this.customerSatisfaction = 100;
    this.totalClients++;
  }

  /* =========================================
      CALENDARIO COMERCIAL
  ========================================= */
  updateSpecialDay(): void {
    const date = new Date(this.saleDate + 'T00:00:00');
    const day = date.getDate();
    const month = date.getMonth() + 1;

    this.specialEvent = 'Día Normal';
    this.specialDiscount = 0;

    if (month === 1 && day === 1) {
      this.specialEvent = 'Año Nuevo';
      this.specialDiscount = 25;
    } else if (month === 2 && day === 14) {
      this.specialEvent = 'San Valentín';
      this.specialDiscount = 10;
    } else if (month === 5 && day === 10) {
      this.specialEvent = 'Día de la Madre';
      this.specialDiscount = 15;
    } else if (month === 6 && day === 21) {
      this.specialEvent = 'Día del Padre';
      this.specialDiscount = 15;
    } else if (month === 10 && day === 31) {
      this.specialEvent = 'Halloween';
      this.specialDiscount = 15;
    } else if (month === 11 && day === 27) {
      this.specialEvent = 'Viernes Negro';
      this.specialDiscount = 30;
    } else if (month === 12 && day === 24) {
      this.specialEvent = 'Navidad';
      this.specialDiscount = 20;
    } else if (month === 12 && day === 31) {
      this.specialEvent = 'Fin de Año';
      this.specialDiscount = 25;
    }
  }

  /* =========================================
      CRUD PRODUCTOS (DATABASE CONNECTED)
  ========================================= */
  autofillProduct(): void {
    const products = [
      { name: 'Aceite de Oliva 500ml', code: '7701002001', barcode: '7701002001', price: 18000, stock: 25 },
      { name: 'Café Molido 500g', code: '7701002002', barcode: '7701002002', price: 9500, stock: 30 },
      { name: 'Sal Refinada 1kg', code: '7701002003', barcode: '7701002003', price: 1800, stock: 40 },
      { name: 'Detergente Líquido 1L', code: '7701002004', barcode: '7701002004', price: 12500, stock: 15 }
    ];
    const randomProd = products[Math.floor(Math.random() * products.length)];
    this.newProduct = {
      name: randomProd.name,
      code: randomProd.code,
      barcode: randomProd.barcode,
      price: randomProd.price,
      stock: randomProd.stock
    };
  }

  addProduct(): void {
    if (!this.newProduct.name || !this.newProduct.code) {
      return;
    }

    const product = {
      name: this.newProduct.name,
      price: this.newProduct.price,
      stock: this.newProduct.stock,
      barcode: this.newProduct.code, // Use code as barcode
      active: true
    };

    this.productService.create(product).subscribe({
      next: () => {
        this.loadProducts();
        this.newProduct = { name: '', code: '', barcode: '', price: 0, stock: 0 };
        this.showToast('Producto agregado correctamente');
      },
      error: (err) => {
        console.error('Error saving product in DB:', err);
        this.showToast('Error al agregar el producto', true);
      }
    });
  }

  editProduct(product: Product): void {
    const newPrice = prompt('Nuevo precio', product.price.toString());
    if (newPrice) {
      const updatedProduct = {
        id: product.id,
        name: product.name,
        price: Number(newPrice),
        stock: product.stock,
        barcode: product.barcode,
        active: true
      };
      this.productService.update(updatedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showToast('Precio actualizado');
        },
        error: (err) => console.error(err)
      });
    }
  }

  deleteProduct(product: Product): void {
    const confirmed = confirm('¿Eliminar producto?');
    if (!confirmed) {
      return;
    }
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.loadProducts();
        this.showToast('Producto eliminado');
      },
      error: (err) => {
        console.error('Error deleting product from DB, removing locally:', err);
        this.products = this.products.filter(p => p.id !== product.id);
        this.saveProducts();
      }
    });
  }

  /* =========================================
      SIMULACIÓN Y CONTADOR DE TIEMPO
  ========================================= */
  startSimulation(): void {
    if (this.role === 'OBSERVADOR') {
      this.showToast('Los observadores no pueden iniciar simulaciones', true);
      return;
    }

    // Refresh products catalog in real-time from database
    this.loadProducts();

    this.simulationStarted = true;
    this.simulationFinished = false;
    this.showToast('Simulación iniciada');
    this.errorMessage = '';
    this.score = 0;
    this.salesCount = 0;
    this.servedProducts = 0;
    this.totalClients = 1;

    this.generateCustomerScenario();
    this.startTimerForCurrentCustomer();
  }

  setDifficultyTime(): void {
    let baseTimePerPatiencePoint = 20;

    switch (this.difficulty) {
      case 'FACIL':
        baseTimePerPatiencePoint = 30;
        break;
      case 'MEDIA':
        baseTimePerPatiencePoint = 20;
        break;
      case 'DIFICIL':
        baseTimePerPatiencePoint = 12;
        break;
      default:
        baseTimePerPatiencePoint = 20;
    }

    this.timeLeft = this.currentCustomer.patience * baseTimePerPatiencePoint;
  }

  startTimerForCurrentCustomer(): void {
    clearInterval(this.timer);
    this.setDifficultyTime();
    
    let tickMs = 1000;
    if (this.difficulty === 'FACIL') {
      tickMs = 1200;
    } else if (this.difficulty === 'DIFICIL') {
      tickMs = 800;
    }

    this.timer = setInterval(() => {
      this.timeLeft--;
      
      let patienceReduction = 1.5;
      if (this.currentCustomer.mood === 'Impaciente') {
        patienceReduction = 3.0;
      } else if (this.currentCustomer.mood === 'Enojado') {
        patienceReduction = 4.5;
      } else if (this.currentCustomer.mood === 'Confundido') {
        patienceReduction = 2.0;
      }
      
      if (this.difficulty === 'DIFICIL') {
        patienceReduction *= 1.5;
      } else if (this.difficulty === 'FACIL') {
        patienceReduction *= 0.7;
      }
      
      this.customerSatisfaction = Math.max(0, this.customerSatisfaction - patienceReduction);

      if (this.timeLeft <= 0 || this.customerSatisfaction <= 0) {
        clearInterval(this.timer);
        this.customerSatisfaction = 0;
        this.showToast('El cliente ha perdido la paciencia y se ha retirado.', true);
        this.score = Math.max(0, this.score - 50);
        
        setTimeout(() => {
          if (this.simulationStarted) {
            this.clearCart();
            this.generateNextCustomer();
            this.totalClients++;
            this.startTimerForCurrentCustomer();
          }
        }, 2000);
      }
    }, tickMs);
  }

  /* =========================================
      REGISTRO POR CÓDIGO (OPTIMIZADO PISTOLA)
  ========================================= */
  registerByCode(): void {
    if (!this.productCode || !this.productCode.trim()) {
      return;
    }

    const limpiado = this.productCode.trim();

    const product = this.products.find(
      p => p.code === limpiado || p.barcode === limpiado
    );

    if (!product) {
      this.showToast(`Código ${limpiado} no encontrado`, true);
      this.productCode = '';
      return;
    }

    if (product.stock <= 0) {
      this.showToast(`El producto ${product.name} no tiene stock`, true);
      this.productCode = '';
      return;
    }

    this.addToCart(product);
    this.productCode = '';
  }

  /* =========================================
      CARRITO Y CONTROLES DE FLUJO
  ========================================= */
  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.code === product.code);

    if (existingItem) {
      existingItem.quantity++;
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      this.cart.push({
        code: product.code,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
        iva: product.iva
      });
    }

    this.calculateTotals();
  }

  increaseQuantity(item: CartItem): void {
    item.quantity++;
    item.subtotal = item.quantity * item.price;
    this.calculateTotals();
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }
    item.quantity--;
    item.subtotal = item.quantity * item.price;
    this.calculateTotals();
  }

  removeItem(item: CartItem): void {
    this.cart = this.cart.filter(p => p !== item);
    this.calculateTotals();
    this.showToast(`Se quitó ${item.name} del carrito`);
  }

  clearCart(): void {
    this.cart = [];
    this.calculateTotals();
  }

  /* =========================================
      CÁLCULOS
  ========================================= */
  calculateTotals(): void {
    this.subtotal = 0;
    this.ivaValue = 0;

    this.cart.forEach(item => {
      this.subtotal += item.subtotal;
      const ivaPct = item.iva !== undefined && item.iva !== null ? item.iva : 19;
      this.ivaValue += item.subtotal * (ivaPct / 100);
    });

    this.discountValue = this.subtotal * (this.specialDiscount / 100);
    this.totalToPay = this.subtotal + this.ivaValue - this.discountValue;

    this.calculatePayment();
  }

  calculatePayment(): void {
    if (this.paymentMethod !== 'Efectivo') {
      this.change = 0;
      return;
    }
    const cash = this.cashReceived ?? 0;
    this.change = cash - this.totalToPay;
  }

  /* =========================================
      REGISTRAR VENTA
  ========================================= */
  /* =========================================
      REGISTRO VENTA (DATABASE CONNECTED)
  ========================================= */
  registerSale(): void {
    const cash = this.cashReceived ?? 0;
    if (this.cart.length === 0) {
      this.showToast('No hay productos registrados', true);
      return;
    }

    if (this.paymentMethod === 'Efectivo' && cash < this.totalToPay) {
      this.showToast('Dinero insuficiente', true);
      return;
    }

    // Save transaction to DB
    const errorsCount = this.timeLeft <= 0 ? 1 : 0;
    const transaction = {
      status: 'COMPLETED',
      total: this.totalToPay,
      errors: errorsCount,
      effectiveness: this.customerSatisfaction,
      date: new Date().toISOString(),
      details: this.cart.map(item => {
        const prod = this.products.find(p => p.code === item.code || p.name === item.name);
        return {
          product: prod ? { id: prod.id } : null,
          quantity: item.quantity,
          unitPrice: item.price,
          discountApplied: 0
        };
      })
    };

    this.transactionService.create(transaction).subscribe({
      next: (savedTx) => {
        console.log('Transaction saved in DB:', savedTx);
      },
      error: (err) => {
        console.error('Error saving transaction in DB:', err);
      }
    });

    this.cart.forEach(item => {
      const product = this.products.find(p => p.code === item.code);
      if (product) {
        product.stock -= item.quantity;
        // Optionally update stock in backend
        const updatedProd = {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          barcode: product.barcode,
          active: true
        };
        this.productService.update(updatedProd).subscribe({
          error: (err) => console.error('Error updating stock in DB:', err)
        });
      }

      this.salesHistory.push({
        product: item.name,
        quantity: item.quantity,
        total: item.subtotal,
        date: new Date().toLocaleString()
      });
    });

    this.saveProducts();
    this.saveSalesHistory();

    // Accumulate sales for Arqueo de Caja
    if (this.paymentMethod === 'Efectivo') {
      this.cashSalesTotal += this.totalToPay;
    } else {
      this.cardSalesTotal += this.totalToPay;
    }

    this.salesCount++;
    this.servedProducts += this.cart.length;
    this.score += 100;

    this.showToast('Venta registrada correctamente');

    this.clearCart();
    this.cashReceived = null;
    this.change = 0;

    if (this.simulationStarted) {
      this.generateNextCustomer();
      this.totalClients++;
      this.startTimerForCurrentCustomer();
    } else {
      this.generateCustomer();
    }
  }

  /* =========================================
      AI COACH
  ========================================= */
  evaluateResponse(): void {
    const response = this.traineeResponse.toLowerCase();

    if (
      response.includes('buenos') ||
      response.includes('gracias') ||
      response.includes('claro') ||
      response.includes('ayudar')
    ) {
      this.coachFeedback = 'Excelente atención al cliente. Respuesta amable y profesional.';
      this.score += 25;
      this.customerSatisfaction += 5;
    } else {
      this.coachFeedback = 'La respuesta puede mejorar. Usa lenguaje amable y cordial.';
      this.score -= 5;
      this.customerSatisfaction -= 5;
    }
  }

  /* =========================================
      ARQUEO DE CAJA (BUSINESS WORKFLOWS)
  ========================================= */
  openAperturaModal(): void {
    if (this.role === 'OBSERVADOR') {
      this.showToast('Los observadores no pueden iniciar la simulación.', true);
      return;
    }
    this.initialCash = 100000; // default 100K COP
    this.showAperturaModal = true;
  }

  confirmApertura(): void {
    this.showAperturaModal = false;
    this.cashSalesTotal = 0;
    this.cardSalesTotal = 0;
    this.physicalCashCount = null;
    this.arqueoResult = null;
    this.startSimulation();
  }

  openArqueoModal(): void {
    clearInterval(this.timer);
    this.physicalCashCount = null;
    this.arqueoResult = null;
    this.showArqueoModal = true;
  }

  cancelArqueo(): void {
    this.showArqueoModal = false;
    if (this.timeLeft > 0) {
      this.startTimerForCurrentCustomer();
    }
  }

  calculateArqueo(): void {
    if (this.physicalCashCount === null || this.physicalCashCount === undefined) {
      this.showToast('Por favor, ingresa el dinero físico contado.', true);
      return;
    }
    const expected = this.initialCash + this.cashSalesTotal;
    const diff = this.physicalCashCount - expected;
    let status = 'CUADRADO';
    let msg = '✓ Caja totalmente cuadrada. ¡Excelente trabajo!';
    if (diff > 0) {
      status = 'SOBRANTE';
      msg = `⚠️ Sobrante en caja de $${diff.toLocaleString()} COP. Revisa si olvidaste entregar cambio.`;
    } else if (diff < 0) {
      status = 'FALTANTE';
      msg = `❌ Faltante en caja de $${Math.abs(diff).toLocaleString()} COP. Revisa los cobros realizados.`;
    }
    this.arqueoResult = {
      expected: expected,
      difference: diff,
      status: status,
      message: msg
    };
  }

  submitArqueoAndFinish(): void {
    this.showArqueoModal = false;
    this.finishSimulation();
  }

  /* =========================================
      FINALIZAR SIMULACIÓN
  ========================================= */
  finishSimulation(): void {
    clearInterval(this.timer);

    // Push notification for the Instructor role
    const savedNotifs = localStorage.getItem('trainshier_notifications');
    let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
    notifs.push({
      id: String(Date.now()),
      role: 'INSTRUCTOR',
      message: `🚀 El aprendiz ${localStorage.getItem('name') || 'Usuario'} completó el examen y subió sus resultados (Puntaje: ${this.score}, Satisfacción: ${Math.round(this.customerSatisfaction)}%).`,
      actionText: 'Evaluar',
      route: '/evaluation',
      read: false
    });
    localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));

    this.savedSimulationReport = {
      finalScore: this.score,
      totalSalesCount: this.salesCount,
      totalServedProducts: this.servedProducts,
      totalClientsAttended: this.totalClients,
      averageSatisfaction: this.customerSatisfaction,
      completionDate: new Date().toISOString()
    };

    // Save report to DB
    const userId = Number(localStorage.getItem('userId')) || null;
    const report = {
      score: Number(this.score),
      effectiveness: Number(this.customerSatisfaction),
      user: userId ? { id: userId } : null
    };

    this.reportService.create(report).subscribe({
      next: (savedReport) => {
        console.log('Report saved in DB:', savedReport);
      },
      error: (err) => {
        console.error('Error saving report in DB:', err);
      }
    });

    console.log('Estadísticas capturadas para uso posterior:', this.savedSimulationReport);

    this.resetSimulation();

    this.simulationFinished = true;
    this.simulationStarted = false;
    this.showToast('Simulación finalizada y datos restaurados');
  }

  /* =========================================
      REINICIAR / LIMPIAR VARIABLES
  ========================================= */
  resetSimulation(): void {
    clearInterval(this.timer);

    this.simulationStarted = false;
    this.simulationFinished = false;

    this.cart = [];
    this.subtotal = 0;
    this.ivaValue = 0;
    this.discountValue = 0;
    this.totalToPay = 0;

    this.cashReceived = null;
    this.change = 0;

    this.score = 0;
    this.salesCount = 0;
    this.servedProducts = 0;
    this.totalClients = 0;

    this.customerSatisfaction = 100;

    this.successMessage = '';
    this.errorMessage = '';

    this.coachFeedback = '';
    this.traineeResponse = '';

    this.generateCustomer();
  }

  cambiar(): void {
    this.h = !this.h;
  }

  scrollToConfig(): void {
    const configCard = document.querySelector('.scenario-settings-card');
    if (configCard) {
      configCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* =========================================
      SCENARIO SELECTOR, WEB CAMERA SCANNER, AND AI CHAT CUSTOMER METHODS
  ========================================= */
  generateCustomerRequest(mood: string): { request: string, message: string, patience: number, barcodes: string[] } {
    let patience = 5;
    if (mood === 'Amable') patience = 5;
    else if (mood === 'Impaciente') patience = 3;
    else if (mood === 'Enojado') patience = 2;
    else if (mood === 'Confundido') patience = 4;

    const orderItems: { product: Product, qty: number }[] = [];
    if (this.products && this.products.length > 0) {
      const count = Math.min(Math.floor(Math.random() * 3) + 1, this.products.length);
      const tempProducts = [...this.products];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * tempProducts.length);
        const prod = tempProducts.splice(idx, 1)[0];
        const qty = Math.floor(Math.random() * 3) + 1; // 1 to 3 units
        orderItems.push({ product: prod, qty });
      }
    } else {
      orderItems.push({
        product: { id: 1, name: 'Leche 1L', price: 4500, stock: 50, barcode: '7701001001', code: '7701001001' },
        qty: 2
      });
      orderItems.push({
        product: { id: 2, name: 'Pan Integral', price: 5500, stock: 40, barcode: '7701001002', code: '7701001002' },
        qty: 1
      });
    }

    const requestSummary = orderItems.map(item => `${item.qty}x ${item.product.name}`).join(', ');

    let welcome = '';
    if (mood === 'Amable') {
      welcome = 'Hola, buenos días. ¿Cómo estás? Quisiera llevar estos productos:';
    } else if (mood === 'Impaciente') {
      welcome = 'Hola. Tengo el tiempo justo, por favor cobra esto rápido:';
    } else if (mood === 'Enojado') {
      welcome = 'El servicio siempre está demorado aquí. Espero que hoy cobren bien estos productos:';
    } else if (mood === 'Confundido') {
      welcome = 'Disculpe, ¿estos productos tienen el descuento del calendario de hoy? Quisiera llevar:';
    }

    let itemsList = '';
    const barcodes: string[] = [];
    orderItems.forEach(item => {
      itemsList += `\n• ${item.qty} unidad(es) de ${item.product.name}`;
      if (item.product.barcode) {
        for (let q = 0; q < item.qty; q++) {
          barcodes.push(item.product.barcode);
        }
      }
    });

    const message = `${welcome}${itemsList}`;

    return { request: requestSummary, message, patience, barcodes };
  }

  generateCustomerScenario(): void {
    const names = ['Carlos Gómez', 'Laura Rodríguez', 'Patricia Jaramillo', 'Juan Carlos Pérez', 'Martha Lucía Pinzón', 'Andrés Felipe Castro', 'Sofía Beltrán'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    
    this.difficulty = this.selectedDifficulty.toUpperCase();
    const mood = this.selectedMood;
    
    this.currentCustomer.name = selectedName;
    this.currentCustomer.mood = mood;

    const data = this.generateCustomerRequest(mood);
    this.currentCustomer.patience = data.patience;
    this.currentCustomer.request = data.request;
    this.currentCustomer.message = data.message;
    
    this.customerSatisfaction = mood === 'Amable' ? 100 : mood === 'Impaciente' ? 75 : mood === 'Enojado' ? 50 : 85;
    
    this.chatMessages = [
      { sender: 'Sistema', text: `Simulación iniciada. Cliente: ${selectedName}. Actitud: ${mood}. Dificultad: ${this.selectedDifficulty}.` },
      { sender: selectedName, text: data.message, barcodes: data.barcodes }
    ];
  }

  generateNextCustomer(): void {
    const moods = ['Amable', 'Impaciente', 'Enojado', 'Confundido'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    
    const names = ['Mauricio Díaz', 'Elena Varela', 'Santiago Ortega', 'Diana Marín', 'Roberto Soler'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    
    this.currentCustomer.name = selectedName;
    this.currentCustomer.mood = randomMood;

    const data = this.generateCustomerRequest(randomMood);
    this.currentCustomer.patience = data.patience;
    this.currentCustomer.request = data.request;
    this.currentCustomer.message = data.message;
    
    this.chatMessages.push({ sender: 'Sistema', text: `Siguiente cliente en fila: ${selectedName} (${randomMood}).` });
    this.chatMessages.push({ sender: selectedName, text: data.message, barcodes: data.barcodes });
  }

  sendMessageToCustomer(): void {
    if (!this.chatMessageInput || !this.chatMessageInput.trim()) return;
    if (!this.simulationStarted) {
      this.showToast('Inicie la simulación para interactuar con el cliente', true);
      return;
    }

    const message = this.chatMessageInput.trim();
    this.chatMessages.push({ sender: 'Cajero (Tú)', text: message });
    this.chatMessageInput = '';
    this.isChatLoading = true;

    const cartDesc = this.cart.map(item => `${item.quantity}x ${item.name}`).join(', ') || 'Ninguno';

    const payload = {
      customerName: this.currentCustomer.name,
      mood: this.currentCustomer.mood,
      difficulty: this.difficulty,
      cartProducts: cartDesc,
      patience: Math.round(this.customerSatisfaction),
      message: message
    };

    this.http.post<any>(`${environment.apiUrl}/simulation/chat`, payload).subscribe({
      next: (res) => {
        this.isChatLoading = false;
        if (res && res.response) {
          this.chatMessages.push({ sender: this.currentCustomer.name, text: res.response });
          
          const lowerRes = res.response.toLowerCase();
          if (lowerRes.includes('gracias') || lowerRes.includes('amable') || lowerRes.includes('entiendo')) {
            this.customerSatisfaction = Math.min(100, this.customerSatisfaction + 5);
            this.timeLeft = Math.min(120, this.timeLeft + 15);
            this.showToast('¡El cliente se muestra satisfecho! Tiempo de atención extendido (+15s)', false);
          } else if (lowerRes.includes('molest') || lowerRes.includes('tarde') || lowerRes.includes('apur')) {
            this.customerSatisfaction = Math.max(0, this.customerSatisfaction - 5);
          }
        }
      },
      error: (err) => {
        this.isChatLoading = false;
        console.error('Error in customer chat API:', err);
        let fallbackReply = '... El cliente te mira sin entender mucho. "Por favor, solo cobre los productos..."';
        if (this.currentCustomer.mood === 'Impaciente') {
          fallbackReply = '¿Podríamos apurarnos, por favor? Tengo prisa.';
        } else if (this.currentCustomer.mood === 'Enojado') {
          fallbackReply = '¡Esto es el colmo! Apúrese con la cuenta o me voy.';
        } else if (this.currentCustomer.mood === 'Confundido') {
          fallbackReply = 'No estoy seguro de cuánto cuesta eso. ¿Tiene descuento?';
        } else if (this.currentCustomer.mood === 'Amable') {
          fallbackReply = 'Muchas gracias por su atención, joven. Muy amable.';
        }
        this.chatMessages.push({ sender: this.currentCustomer.name, text: fallbackReply });
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleBarcodeScanner(event: KeyboardEvent): void {
    if (!this.simulationStarted) return;
    
    // Intercept keyboard emulator barcode guns
    const activeElement = document.activeElement?.tagName;
    
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastScanTime;
    this.lastScanTime = currentTime;
    
    if (event.key === 'Enter') {
      if (this.scanBuffer.length >= 6) {
        event.preventDefault();
        this.processScannedBarcode(this.scanBuffer);
        this.scanBuffer = '';
      } else {
        this.scanBuffer = '';
      }
    } else if (event.key.length === 1 && ((event.key >= '0' && event.key <= '9') || (event.key >= 'a' && event.key <= 'z') || (event.key >= 'A' && event.key <= 'Z'))) {
      if (timeDiff <= 50) {
        this.scanBuffer += event.key;
      } else {
        this.scanBuffer = event.key;
      }
    }
  }

  processScannedBarcode(barcode: string): void {
    const cleanBarcode = barcode.trim();
    const product = this.products.find(
      p => p.barcode === cleanBarcode || p.code === cleanBarcode
    );

    if (!product) {
      this.showToast(`Producto escaneado "${cleanBarcode}" no encontrado`, true);
      return;
    }

    if (product.stock <= 0) {
      this.showToast(`El producto ${product.name} no tiene stock`, true);
      return;
    }

    this.addToCart(product);
    this.showToast(`Escaneado: ${product.name} (${product.price} COP)`);
  }

  selectAndAddProduct(product: Product): void {
    if (!this.simulationStarted) {
      this.showToast('Debes iniciar la simulación antes de agregar productos', true);
      return;
    }
    if (product.stock <= 0) {
      this.showToast(`El producto ${product.name} no tiene stock`, true);
      return;
    }
    this.addToCart(product);
    this.showToast(`Agregado: ${product.name}`);
  }
}
