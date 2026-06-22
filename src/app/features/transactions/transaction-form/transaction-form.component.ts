import { Component, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';
import { CommentService } from '../../../core/services/comment.service';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss']
})
export class TransactionFormComponent implements OnInit {
  @ViewChild(TransactionListComponent) listComponent?: TransactionListComponent;

  form: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  // Roles y visualización para el Aprendiz
  role: string = '';
  userName: string = '';
  userId: number = 0;

  userReports: any[] = [];
  userEvaluations: any[] = [];

  // Estadísticas del Aprendiz
  averageScore: number = 0;
  totalSimulations: number = 0;
  approvedCount: number = 0;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private reportService: ReportService,
    private commentService: CommentService
  ) {
    this.form = this.fb.group({
      product: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.role = localStorage.getItem('role') || 'APRENDIZ';
    this.userName = localStorage.getItem('name') || 'Aprendiz';
    this.userId = Number(localStorage.getItem('userId')) || 0;

    if (this.role === 'APRENDIZ') {
      this.loadApprenticeData();
    }
  }

  loadApprenticeData(): void {
    // Cargar reportes de simulación del aprendiz (Historial de desempeño privado)
    this.reportService.getAll().subscribe({
      next: (reports) => {
        // Filtrar reportes que correspondan al aprendiz logueado
        this.userReports = reports.filter(r => r.user && r.user.name.toLowerCase() === this.userName.toLowerCase());

        // Semilla por si no tiene simulaciones en base de datos para no dejar vacío
        if (this.userReports.length === 0) {
          this.userReports = [
            { id: 1, date: new Date().toISOString(), score: 82, effectiveness: 85, state: 'Calificado: Aprobado' },
            { id: 2, date: new Date(Date.now() - 86400000).toISOString(), score: 65, effectiveness: 70, state: 'Calificado: No aprobado' }
          ];
        }

        this.totalSimulations = this.userReports.length;
        if (this.totalSimulations > 0) {
          const sum = this.userReports.reduce((total, r) => total + (r.score || 0), 0);
          this.averageScore = Math.round(sum / this.totalSimulations);
        }

        this.matchEvaluations();
      },
      error: (err) => {
        console.error('Error al cargar reportes del aprendiz:', err);
        // Semilla fallback
        this.userReports = [
          { id: 1, date: new Date().toISOString(), score: 82, effectiveness: 85, state: 'Calificado: Aprobado' },
          { id: 2, date: new Date(Date.now() - 86400000).toISOString(), score: 65, effectiveness: 70, state: 'Calificado: No aprobado' }
        ];
        this.totalSimulations = 2;
        this.averageScore = 73;
        this.matchEvaluations();
      }
    });

    // Cargar calificaciones escritas por instructores
    this.commentService.getAll().subscribe({
      next: (comments) => {
        const parsedList = comments.map(item => {
          let parsed = {
            studentName: 'Aprendiz',
            module: 'Caja POS',
            state: 'Aprobado',
            feedback: item.comment,
            errors: '0'
          };
          try {
            parsed = JSON.parse(item.comment);
          } catch (e) {
            parsed.feedback = item.comment;
          }
          return {
            id: item.id,
            studentName: parsed.studentName,
            module: parsed.module,
            score: item.score,
            state: parsed.state,
            feedback: parsed.feedback,
            errors: parsed.errors,
            date: item.date ? item.date.split('T')[0] : new Date().toLocaleDateString()
          };
        });

        // Filtrar evaluaciones que pertenecen a este aprendiz
        this.userEvaluations = parsedList.filter(e => e.studentName.toLowerCase() === this.userName.toLowerCase());

        // Si es Carlos Ramírez (cuenta demo), sembrar una calificación por defecto
        if (this.userEvaluations.length === 0 && this.userName.toLowerCase().includes('ramirez')) {
          this.userEvaluations = [
            {
              id: 99,
              studentName: this.userName,
              module: 'Caja POS',
              score: 82,
              state: 'Aprobado',
              feedback: 'Buen desempeño general en la simulación, pero debe mejorar la velocidad en el cobro con tarjeta.',
              errors: '3',
              date: new Date().toISOString().split('T')[0]
            }
          ];
        }

        this.approvedCount = this.userEvaluations.filter(e => e.state === 'Aprobado').length;
        this.matchEvaluations();
      },
      error: (err) => {
        console.error('Error al cargar calificaciones del aprendiz:', err);
      }
    });
  }

  matchEvaluations(): void {
    if (this.userReports.length > 0) {
      this.userReports.forEach(r => {
        // Encontrar evaluación con puntaje coincidente o aproximado
        const matched = this.userEvaluations.find(e => Math.abs(e.score - r.score) < 5);
        if (matched) {
          r.state = 'Calificado: ' + matched.state;
          r.feedback = matched.feedback;
        } else {
          // Si no hay comentario en la base de datos
          if (!r.state) {
            r.state = 'Pendiente de Calificación';
            r.feedback = 'Su simulación está en espera de la revisión por parte del instructor.';
          }
        }
      });
    }
  }

  autofill(): void {
    const products = ['Arroz Premium', 'Leche 1L', 'Pan Integral', 'Chocolate', 'Gaseosa Cola'];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomQty = Math.floor(1 + Math.random() * 5);
    const prices: { [key: string]: number } = {
      'Arroz Premium': 8000,
      'Leche 1L': 4500,
      'Pan Integral': 5500,
      'Chocolate': 3000,
      'Gaseosa Cola': 6000
    };
    
    this.form.patchValue({
      product: randomProduct,
      quantity: randomQty,
      price: prices[randomProduct]
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
    const transaction = {
      status: 'COMPLETADO',
      client: 'Cliente Manual',
      type: 'POS',
      product: val.product,
      quantity: val.quantity,
      total: val.quantity * val.price,
      errors: 0,
      effectiveness: 100.0,
      date: new Date().toISOString()
    };

    this.transactionService.create(transaction).subscribe({
      next: (savedTx) => {
        this.successMessage = 'Transacción registrada correctamente';
        this.errorMessage = '';
        this.form.reset();
        if (this.listComponent) {
          this.listComponent.load();
        }
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error al guardar transacción manual:', err);
        this.errorMessage = 'Error al registrar la transacción en el servidor';
        this.successMessage = '';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }
}
