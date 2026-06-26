import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';
import { ProductService } from '../../../core/services/product.service';

declare var Chart: any;

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('effectivenessChart') effectivenessChartRef!: ElementRef;
  @ViewChild('topProductsChart') topProductsChartRef!: ElementRef;

  totalUsers: number = 0;
  totalTransactions: number = 0;
  totalSimulations: number = 0;
  averageScore: number = 0;
  totalRevenue: number = 0;
  totalErrors: number = 0;
  activeProducts: number = 0;
  totalClientsServed: number = 0;
  averageTicket: number = 0;
  aiReport: string = '';

  startDate: string = '';
  endDate: string = '';
  selectedRole: string = 'TODOS';
  users: any[] = [];
  originalUsers: any[] = [];
  topUsers: any[] = [];
  topProducts: any[] = [];

  loading = true;
  chartsReady = false;
  private effectivenessChartInst: any = null;
  private topProductsChartInst: any = null;

  private cachedTransactions: any[] | null = null;
  private cachedProducts: any[] | null = null;

  constructor(
    private userService: UserService,
    private transactionService: TransactionService,
    private reportService: ReportService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.tryRenderCharts();
  }

  ngOnDestroy(): void {
    this.effectivenessChartInst?.destroy();
    this.topProductsChartInst?.destroy();
  }

  loadAll(): void {
    this.loading = true;

    // Users
    this.userService.getAll().subscribe({
      next: (usersList: any[]) => {
        this.totalUsers = usersList.length;
        this.users = usersList.map(u => ({
          id: u.id,
          name: u.name || 'Usuario',
          role: u.role || 'APPRENTICE',
          email: u.email || '',
          active: u.active !== false,
          simulations: 0,
          effectiveness: 0
        }));
        this.originalUsers = [...this.users];
        this.loadReports();
      },
      error: () => { this.loadReports(); }
    });

    // Transactions
    this.transactionService.getAll().subscribe({
      next: (txList: any[]) => {
        this.totalTransactions = txList.length;
        this.totalRevenue = txList.reduce((sum, t) => sum + (t.total || 0), 0);
        this.totalErrors = txList.reduce((sum, t) => sum + (t.errors || 0), 0);
        this.totalClientsServed = txList.length;
        if (txList.length > 0) {
          this.averageTicket = Math.round(this.totalRevenue / txList.length);
        }
        this.cachedTransactions = txList;
        this.calculateTopProducts();
      },
      error: () => {}
    });

    // Products
    this.productService.getAll().subscribe({
      next: (prodList: any[]) => {
        this.activeProducts = prodList.filter((p: any) => p.active !== false).length;
        this.cachedProducts = prodList;
        this.calculateTopProducts();
      },
      error: () => {}
    });
  }

  calculateTopProducts(): void {
    if (!this.cachedProducts || !this.cachedTransactions) return;

    const salesMap = new Map<number, number>();
    this.cachedTransactions.forEach(tx => {
      if (tx.details) {
        tx.details.forEach((det: any) => {
          if (det.product && det.product.id) {
            const count = salesMap.get(det.product.id) || 0;
            salesMap.set(det.product.id, count + (det.quantity || 0));
          }
        });
      }
    });

    const activeProds = this.cachedProducts.filter((p: any) => p.active !== false);
    this.topProducts = activeProds.map((p: any) => {
      const sales = salesMap.get(p.id) || 0;
      return { name: p.name, sales: sales };
    });

    this.topProducts.sort((a, b) => b.sales - a.sales);
    if (this.topProducts.length > 5) {
      this.topProducts = this.topProducts.slice(0, 5);
    }
    this.tryRenderCharts();
  }

  loadReports(): void {
    this.reportService.getAll().subscribe({
      next: (reportsList: any[]) => {
        this.totalSimulations = reportsList.length;

        if (reportsList.length > 0) {
          const totalScore = reportsList.reduce((sum, r) => sum + (r.score || 0), 0);
          this.averageScore = Math.round(totalScore / reportsList.length);
        }

        // Enrich users with simulation data
        this.users.forEach(u => {
          const userReports = reportsList.filter(r => r.user && r.user.id === u.id);
          u.simulations = userReports.length;
          if (userReports.length > 0) {
            const ef = userReports.reduce((sum, r) => sum + (r.effectiveness || 0), 0);
            u.effectiveness = Math.round(ef / userReports.length);
          }
        });

        this.topUsers = [...this.users]
          .sort((a, b) => b.effectiveness - a.effectiveness)
          .slice(0, 5);
        this.originalUsers = [...this.users];
        this.generateAIAnalysis();
        this.loading = false;
        this.tryRenderCharts();
      },
      error: () => {
        this.loading = false;
        this.generateAIAnalysis();
      }
    });
  }

  applyFilters(): void {
    if (this.selectedRole === 'TODOS') {
      this.users = [...this.originalUsers];
      return;
    }
    this.users = this.originalUsers.filter(u =>
      (u.role + '').toUpperCase().includes(this.selectedRole)
    );
  }

  exportPDF(): void {
    window.print();
  }

  generateAIAnalysis(): void {
    if (this.totalSimulations === 0) {
      this.aiReport = 'Aún no hay simulaciones registradas. Cuando los aprendices completen su primera sesión, aquí aparecerá el análisis de desempeño.';
      return;
    }
    if (this.averageScore >= 90) {
      this.aiReport = 'El rendimiento general es excelente. Los aprendices dominan los procesos de caja, descuentos y atención al cliente.';
    } else if (this.averageScore >= 70) {
      this.aiReport = 'El rendimiento general es bueno. Se observan oportunidades de mejora en tiempos de atención y manejo de descuentos.';
    } else {
      this.aiReport = 'El desempeño requiere acompañamiento adicional. Se recomienda reforzar los fundamentos del sistema POS.';
    }
  }

  private tryRenderCharts(): void {
    if (!this.chartsReady) return;
    setTimeout(() => {
      this.renderEffectivenessChart();
      this.renderTopProductsChart();
    }, 100);
  }

  private renderEffectivenessChart(): void {
    if (!this.effectivenessChartRef?.nativeElement) return;
    this.effectivenessChartInst?.destroy();
    const ctx = this.effectivenessChartRef.nativeElement.getContext('2d');
    const completed = this.averageScore;
    const pending = 100 - completed;
    this.effectivenessChartInst = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Efectividad', 'Margen de mejora'],
        datasets: [{
          data: [completed || 1, pending || 99],
          backgroundColor: ['#4f46e5', 'rgba(255,255,255,0.07)'],
          borderColor: ['#6366f1', 'rgba(255,255,255,0.1)'],
          borderWidth: 2
        }]
      },
      options: {
        cutout: '72%',
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { size: 12 } } }
        }
      }
    });
  }

  private renderTopProductsChart(): void {
    if (!this.topProductsChartRef?.nativeElement || this.topProducts.length === 0) return;
    this.topProductsChartInst?.destroy();
    const ctx = this.topProductsChartRef.nativeElement.getContext('2d');
    this.topProductsChartInst = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.topProducts.map(p => p.name),
        datasets: [{
          label: 'Ventas',
          data: this.topProducts.map(p => p.sales || 0),
          backgroundColor: ['#4f46e5','#7c3aed','#059669','#d97706','#0d9488'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          }
        }
      }
    });
  }

  getSuccessRate(): number { return this.averageScore; }
  getTotalSales(): number { return this.totalTransactions; }
  getTotalRevenue(): number { return this.totalRevenue; }
}
