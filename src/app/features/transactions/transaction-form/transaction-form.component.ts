import {
  Component, ViewChild, OnInit, OnDestroy, ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';
import { CommentService } from '../../../core/services/comment.service';
import { ProductService } from '../../../core/services/product.service';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';
// ZXing — barcode scanner (compatible with @zxing/library@0.21.3 + @zxing/browser@0.1.4)
import { BrowserMultiFormatReader } from '@zxing/browser';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit, OnDestroy {
  @ViewChild(TransactionListComponent) listComponent?: TransactionListComponent;
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  form: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  role: string = '';
  userName: string = '';
  userId: number = 0;

  userReports: any[] = [];
  userEvaluations: any[] = [];
  averageScore: number = 0;
  totalSimulations: number = 0;
  approvedCount: number = 0;

  // ZXing barcode scanner
  codeReader: BrowserMultiFormatReader | null = null;
  scannerActive: boolean = false;
  scannerLoading: boolean = false;
  scannedCode: string = '';
  scannedProduct: any = null;
  allProducts: any[] = [];
  cameraEnabled: boolean = true;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private reportService: ReportService,
    private commentService: CommentService,
    private productService: ProductService
  ) {
    this.form = this.fb.group({
      product: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.role = localStorage.getItem('role') || '';
    this.userName = localStorage.getItem('name') || '';
    this.userId = Number(localStorage.getItem('userId')) || 0;
    this.cameraEnabled = localStorage.getItem('camera_enabled') !== 'false';

    // Load products for barcode lookup
    this.productService.getAll().subscribe({
      next: (prods: any[]) => { this.allProducts = prods; },
      error: () => {}
    });

    if (this.isApprentice()) {
      this.loadApprenticeData();
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  isApprentice(): boolean {
    return (this.role + '').toUpperCase().includes('APPRENTICE') ||
           (this.role + '').toUpperCase().includes('APRENDIZ');
  }

  // ================================================================
  // APPRENTICE DATA
  // ================================================================
  loadApprenticeData(): void {
    this.reportService.getAll().subscribe({
      next: (reports: any[]) => {
        // Filter only this user's reports
        this.userReports = reports.filter(r =>
          r.user && (r.user.id === this.userId ||
                     (r.user.name || '').toLowerCase() === this.userName.toLowerCase())
        );
        this.totalSimulations = this.userReports.length;
        if (this.totalSimulations > 0) {
          const sum = this.userReports.reduce((t: number, r: any) => t + (r.score || 0), 0);
          this.averageScore = Math.round(sum / this.totalSimulations);
        }
        this.matchEvaluations();
      },
      error: () => {}
    });

    this.commentService.getAll().subscribe({
      next: (comments: any[]) => {
        const parsed = comments.map(item => {
          let p: any = { studentName: '', module: 'Caja POS', state: 'Aprobado', feedback: item.comment, errors: '0' };
          try { p = { ...p, ...JSON.parse(item.comment) }; } catch {}
          return {
            id: item.id,
            studentName: p.studentName || '',
            module: p.module || 'Caja POS',
            score: item.score,
            state: p.state || 'Aprobado',
            feedback: p.feedback || item.comment,
            errors: p.errors || '0',
            date: item.date ? item.date.split('T')[0] : ''
          };
        });
        this.userEvaluations = parsed.filter(e =>
          e.studentName.toLowerCase() === this.userName.toLowerCase()
        );
        this.approvedCount = this.userEvaluations.filter(e => e.state === 'Aprobado').length;
        this.matchEvaluations();
      },
      error: () => {}
    });
  }

  matchEvaluations(): void {
    this.userReports.forEach(r => {
      const matched = this.userEvaluations.find(e => Math.abs(e.score - r.score) < 5);
      if (matched) {
        r.state = 'Calificado: ' + matched.state;
        r.feedback = matched.feedback;
      } else if (!r.state) {
        r.state = 'Pendiente de Calificación';
        r.feedback = 'En espera de revisión del instructor.';
      }
    });
  }

  // ================================================================
  // BARCODE SCANNER (ZXing — compatible con SAT PCS via cámara)
  // ================================================================
  async startScanner(): Promise<void> {
    if (!this.cameraEnabled) return;
    this.scannerLoading = true;
    this.scannedCode = '';
    this.scannedProduct = null;
    this.scannerActive = true;

    // Pequeño delay para que el *ngIf renderice el <video>
    await this.delay(300);

    try {
      this.codeReader = new BrowserMultiFormatReader();
      const videoEl = this.videoRef?.nativeElement;
      if (!videoEl) {
        this.errorMessage = 'Error al acceder al elemento de video.';
        this.scannerActive = false;
        this.scannerLoading = false;
        return;
      }

      this.scannerLoading = false;
      // Decodifica continuamente desde la cámara
      await this.codeReader.decodeFromVideoDevice(
        undefined,
        videoEl,
        (result: any, err: any) => {
          if (result) {
            this.onBarcodeDetected(result.getText());
          }
          // Ignoramos NotFoundException que es ruido normal del scanner
        }
      );
    } catch (e: any) {
      this.scannerLoading = false;
      this.errorMessage = 'No se pudo acceder a la cámara: ' + (e?.message || e);
      this.scannerActive = false;
      setTimeout(() => this.errorMessage = '', 4000);
    }
  }

  stopScanner(): void {
    if (this.codeReader) {
      BrowserMultiFormatReader.releaseAllStreams();
      this.codeReader = null;
    }
    this.scannerActive = false;
    this.scannerLoading = false;
  }

  onBarcodeDetected(code: string): void {
    if (this.scannedCode === code) return; // Evitar duplicados
    this.scannedCode = code;
    this.stopScanner();

    // Buscar el producto por código de barras en la lista cargada
    const found = this.allProducts.find((p: any) =>
      (p.barcode || '').trim() === code.trim()
    );

    if (found) {
      this.scannedProduct = found;
      this.form.patchValue({
        product: found.name,
        price: found.price,
        quantity: 1
      });
      this.successMessage = `Producto detectado: ${found.name} — $${found.price}`;
    } else {
      this.scannedProduct = null;
      this.form.patchValue({ product: code });
      this.successMessage = `Código escaneado: ${code} (no encontrado en catálogo, ingresar precio manual)`;
    }
    setTimeout(() => this.successMessage = '', 5000);
  }

  /** Handle input manually typed barcode (for USB gun scanners like SAT PCS) */
  onManualBarcodeInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.trim();
    if (input.length > 4) {
      const found = this.allProducts.find((p: any) => (p.barcode || '').trim() === input);
      if (found) {
        this.scannedProduct = found;
        this.form.patchValue({ product: found.name, price: found.price, quantity: 1 });
        this.successMessage = `Producto: ${found.name} — $${found.price}`;
        setTimeout(() => this.successMessage = '', 4000);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ================================================================
  // FORM SUBMIT
  // ================================================================
  autofill(): void {
    if (this.allProducts.length > 0) {
      const rand = this.allProducts[Math.floor(Math.random() * this.allProducts.length)];
      this.form.patchValue({ product: rand.name, quantity: 1, price: rand.price });
    } else {
      this.form.patchValue({ product: 'Producto Demo', quantity: 1, price: 5000 });
    }
  }

  submitTransactionWithProduct(prod: any, quantity: number, price: number): void {
    const transaction = {
      status: 'COMPLETED',
      total: quantity * price,
      errors: 0,
      effectiveness: 100.0,
      date: new Date().toISOString(),
      details: [
        {
          product: prod ? { id: prod.id } : null,
          quantity: quantity,
          unitPrice: price,
          discountApplied: 0
        }
      ]
    };

    this.transactionService.create(transaction).subscribe({
      next: () => {
        this.successMessage = 'Transacción registrada correctamente';
        this.errorMessage = '';
        this.form.reset();
        this.scannedCode = '';
        this.scannedProduct = null;
        
        // Focus the barcode gun input back
        const gunInput = document.getElementById('barcode-gun-input');
        if (gunInput) {
          (gunInput as HTMLInputElement).value = '';
          gunInput.focus();
        }

        if (this.listComponent) this.listComponent.load();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = 'Error al registrar la transacción';
        this.successMessage = '';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos obligatorios.';
      this.successMessage = '';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const val = this.form.value;
    let prod = this.allProducts.find(p => 
      p.name === val.product || 
      (p.barcode && p.barcode.trim() === val.product.trim())
    );

    if (!prod) {
      // Auto-create product in database first!
      const barcode = this.scannedCode || val.product.trim();
      const newProd = {
        name: val.product,
        price: Number(val.price),
        stock: 50,
        barcode: barcode,
        active: true
      };

      this.productService.create(newProd).subscribe({
        next: (created) => {
          this.allProducts.push(created);
          this.submitTransactionWithProduct(created, Number(val.quantity), Number(val.price));
        },
        error: () => {
          this.errorMessage = 'Error al crear el nuevo producto en el catálogo';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    } else {
      this.submitTransactionWithProduct(prod, Number(val.quantity), Number(val.price));
    }
  }
}
