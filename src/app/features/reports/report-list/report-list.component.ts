import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportsComponent implements OnInit {

  totalUsers: number = 0;
  totalTransactions: number = 0;
  totalSimulations: number = 0;
  averageScore: number = 0;
  totalRevenue: number = 0;
  totalErrors: number = 0;
  averageAttentionTime: string = '1.5 min';
  activeProducts: number = 0;

  // ==========================
  // FILTROS
  // ==========================

  startDate: string = '';
  endDate: string = '';
  selectedRole: string = 'TODOS';
  users: any[] = [];
  originalUsers: any[] = [];

  topUsers: any[] = [];
  topProducts: any[] = [
    { name: 'Leche Entera', sales: 120 },
    { name: 'Pan Integral', sales: 97 },
    { name: 'Chocolate', sales: 84 },
    { name: 'Arroz Premium', sales: 79 },
    { name: 'Queso Mozzarella', sales: 65 }
  ];

  aiReport: string = 'Analizando desempeño general...';

  totalClientsServed: number = 0;
  totalDiscountsApplied: number = 0;
  averageTicket: number = 0;
  bestSellingDay: string = 'Viernes';
  worstSellingDay: string = 'Lunes';

  constructor(
    private userService: UserService,
    private transactionService: TransactionService,
    private reportService: ReportService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Load Users and calculate simulation metrics from reports
    this.userService.getAll().subscribe({
      next: (usersList) => {
        this.totalUsers = usersList.length;
        this.users = usersList.map(u => ({
          name: u.name || 'Usuario',
          role: u.role || 'APRENDIZ',
          simulations: 0,
          effectiveness: 100
        }));

        this.reportService.getAll().subscribe({
          next: (reportsList) => {
            this.totalSimulations = reportsList.length;
            
            if (reportsList.length > 0) {
              const totalScore = reportsList.reduce((sum, r) => sum + (r.score || 0), 0);
              this.averageScore = Math.round(totalScore / reportsList.length);
            }

            this.users.forEach(userItem => {
              const userReports = reportsList.filter(r => r.user && r.user.name === userItem.name);
              userItem.simulations = userReports.length;
              if (userReports.length > 0) {
                const userSum = userReports.reduce((sum, r) => sum + (r.effectiveness || 0), 0);
                userItem.effectiveness = Math.round(userSum / userReports.length);
              }
            });

            this.topUsers = [...this.users]
              .sort((a, b) => b.effectiveness - a.effectiveness)
              .slice(0, 5);

            this.originalUsers = [...this.users];
            this.generateAIAnalysis();
          }
        });
      }
    });

    // Load Transactions for financial KPIs
    this.transactionService.getAll().subscribe({
      next: (txList) => {
        this.totalTransactions = txList.length;
        this.totalRevenue = txList.reduce((sum, t) => sum + (t.total || 0), 0);
        this.totalErrors = txList.reduce((sum, t) => sum + (t.errors || 0), 0);
        this.totalClientsServed = txList.length;
        if (txList.length > 0) {
          this.averageTicket = Math.round(this.totalRevenue / txList.length);
        }
      }
    });

    // Load Products count
    this.productService.getAll().subscribe({
      next: (prodList) => {
        this.activeProducts = prodList.length;
      }
    });
  }

  applyFilters(): void {

    if (this.selectedRole === 'TODOS') {

      this.users = [...this.originalUsers];

      return;

    }

    this.users = this.originalUsers.filter(
      user =>
        user.role === this.selectedRole
    );

  }

  exportPDF(): void {

    console.log(
      'Exportando PDF...'
    );

  }

  exportExcel(): void {

    console.log(
      'Exportando Excel...'
    );

  }

  generateAIAnalysis(): void {

    if (this.averageScore >= 90) {

      this.aiReport =
        'El rendimiento general es excelente. Los aprendices dominan los procesos de caja, descuentos y atención al cliente. Se recomienda continuar fortaleciendo la precisión en el cálculo de cambios.';

    } else if (this.averageScore >= 70) {

      this.aiReport =
        'El rendimiento general es bueno. Se observan oportunidades de mejora en tiempos de atención y manejo de descuentos promocionales.';

    } else {

      this.aiReport =
        'El desempeño requiere acompañamiento adicional. Se recomienda reforzar los fundamentos del sistema POS y simulaciones prácticas.';

    }

  }

  getSuccessRate(): number {

    return this.averageScore;

  }

  getTotalSales(): number {

    return this.totalTransactions;

  }

  getTotalRevenue(): number {

    return this.totalRevenue;

  }

}
