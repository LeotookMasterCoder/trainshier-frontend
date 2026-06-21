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

  loadStatistics(): void {
    // Load Users
    this.userService.getAll().subscribe({
      next: (usersList) => {
        this.totalUsers = usersList.length;
        this.apprentices = usersList.filter(u => u.role === 'APRENDIZ').length;
        this.instructors = usersList.filter(u => u.role === 'INSTRUCTOR').length;

        // Create initial ranking structure
        const initialRanking = usersList.map(u => ({
          name: u.name || 'Usuario',
          role: u.role || 'APRENDIZ',
          effectiveness: 0,
          simulations: 0
        }));

        // Load Reports (Simulations)
        this.reportService.getAll().subscribe({
          next: (reportsList) => {
            this.totalSimulations = reportsList.length;
            this.totalCustomers = reportsList.length * 3; // Approx 3 customers per simulation session
            
            if (reportsList.length > 0) {
              const totalScore = reportsList.reduce((sum, r) => sum + (r.score || 0), 0);
              this.averageScore = Math.round(totalScore / reportsList.length);
              this.successRate = this.averageScore;
              
              const scores = reportsList.map(r => r.score || 0);
              this.bestScore = Math.max(...scores);
            }

            // Fill rankings
            initialRanking.forEach(userItem => {
              const userReports = reportsList.filter(r => r.user && r.user.name === userItem.name);
              userItem.simulations = userReports.length;
              if (userReports.length > 0) {
                const userSum = userReports.reduce((sum, r) => sum + (r.effectiveness || 0), 0);
                userItem.effectiveness = Math.round(userSum / userReports.length);
              }
            });

            // Filter out users with 0 simulations and sort by effectiveness
            this.ranking = initialRanking
              .filter(u => u.simulations > 0)
              .sort((a, b) => b.effectiveness - a.effectiveness)
              .slice(0, 5);
          }
        });
      }
    });

    // Load Transactions
    this.transactionService.getAll().subscribe({
      next: (txList) => {
        this.totalTransactions = txList.length;
        this.productsSold = txList.length * 4; // Approx 4 products sold per POS checkout transaction
        this.totalErrors = txList.reduce((sum, t) => sum + (t.errors || 0), 0);
      }
    });
  }
}
