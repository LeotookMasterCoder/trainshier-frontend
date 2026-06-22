import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector:'app-statistics',
  templateUrl:'./statistics.component.html',
  styleUrls:['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  totalUsers: number = 0;
  totalTransactions: number = 0;
  totalSimulations: number = 0;
  successRate: number = 100;
  totalCustomers: number = 0;
  productsSold: number = 0;
  instructors: number = 0;
  apprentices: number = 0;
  bestScore: number = 0;
  averageScore: number = 0;
  totalErrors: number = 0;
  activeSimulations: number = 0;

  ranking: any[] = [];

  constructor(
    private userService: UserService,
    private transactionService: TransactionService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  private cachedUsers: any[] | null = null;
  private cachedReports: any[] | null = null;

  loadStatistics(): void {
    // 1. Load Users
    this.userService.getAll().subscribe({
      next: (usersList) => {
        this.totalUsers = usersList.length;
        this.apprentices = usersList.filter(u => u.role === 'APRENDIZ').length;
        this.instructors = usersList.filter(u => u.role === 'INSTRUCTOR').length;
        this.updateRanking(usersList, null);
      },
      error: (err) => {
        console.error('Error loading users for statistics:', err);
      }
    });

    // 2. Load Reports (Simulations)
    this.reportService.getAll().subscribe({
      next: (reportsList) => {
        this.totalSimulations = reportsList.length;
        this.totalCustomers = reportsList.length * 3; // Aprox 3 clientes por simulacion
        
        if (reportsList.length > 0) {
          const totalScore = reportsList.reduce((sum, r) => sum + (r.score || 0), 0);
          this.averageScore = Math.round(totalScore / reportsList.length);
          this.successRate = this.averageScore;
          
          const scores = reportsList.map(r => r.score || 0);
          this.bestScore = Math.max(...scores);
        }
        this.updateRanking(null, reportsList);
      },
      error: (err) => {
        console.error('Error loading reports for statistics:', err);
      }
    });

    // 3. Load Transactions
    this.transactionService.getAll().subscribe({
      next: (txList) => {
        this.totalTransactions = txList.length;
        this.productsSold = txList.length * 4; // Aprox 4 productos por venta
        this.totalErrors = txList.reduce((sum, t) => sum + (t.errors || 0), 0);
      },
      error: (err) => {
        console.error('Error loading transactions for statistics:', err);
      }
    });
  }

  private updateRanking(usersList: any[] | null, reportsList: any[] | null): void {
    if (usersList) this.cachedUsers = usersList;
    if (reportsList) this.cachedReports = reportsList;

    if (this.cachedUsers && this.cachedReports) {
      const initialRanking = this.cachedUsers.map(u => ({
        name: u.name || 'Usuario',
        role: u.role || 'APRENDIZ',
        effectiveness: 0,
        simulations: 0
      }));

      initialRanking.forEach(userItem => {
        const userReports = this.cachedReports!.filter(r => r.user && r.user.name === userItem.name);
        userItem.simulations = userReports.length;
        if (userReports.length > 0) {
          const userSum = userReports.reduce((sum, r) => sum + (r.effectiveness || 0), 0);
          userItem.effectiveness = Math.round(userSum / userReports.length);
        }
      });

      this.ranking = initialRanking
        .filter(u => u.simulations > 0)
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, 5);
    }
  }
}
