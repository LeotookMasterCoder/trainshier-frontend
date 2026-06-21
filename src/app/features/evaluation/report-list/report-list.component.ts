import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit {

  totalReports = 0;
  completedReports = 0;
  pendingReports = 0;

  searchTerm = '';
  reports: any[] = [];
  filteredReports: any[] = [];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportService.getAll().subscribe({
      next: (res: any[]) => {
        this.reports = res.map(r => ({
          title: `Reporte de Simulación #${r.id}`,
          description: `Score de ${r.score} pts con una efectividad del ${r.effectiveness}%.`,
          status: 'Completado',
          date: r.generatedAt ? r.generatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          author: r.user ? r.user.name : 'Aprendiz'
        }));
        
        // Add a couple of placeholders only if DB is empty, otherwise show DB reports
        if (this.reports.length === 0) {
          this.reports = [
            {
              title: 'Reporte Semanal de Caja',
              description: 'Rendimiento de aprendices durante las simulaciones semanales.',
              status: 'Completado',
              date: new Date().toISOString().split('T')[0],
              author: 'Sistema'
            }
          ];
        }

        this.filteredReports = [...this.reports];
        this.calculateKPIs();
      },
      error: (err) => {
        console.error('Error loading reports from DB, using fallback:', err);
        this.reports = [
          {
            title: 'Reporte semanal',
            description: 'Rendimiento de aprendices durante la semana.',
            status: 'Completado',
            date: '2026-06-01',
            author: 'Instructor Principal'
          }
        ];
        this.filteredReports = [...this.reports];
        this.calculateKPIs();
      }
    });
  }

  calculateKPIs(): void {

    this.totalReports = this.reports.length;

    this.completedReports =
      this.reports.filter(
        report => report.status === 'Completado'
      ).length;

    this.pendingReports =
      this.reports.filter(
        report => report.status === 'Pendiente'
      ).length;
  }

  filterReports(): void {

    const term =
      this.searchTerm.toLowerCase();

    this.filteredReports =
      this.reports.filter(report =>
        report.title.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term) ||
        report.author.toLowerCase().includes(term)
      );
  }

  exportReports(): void {

    const content =
      JSON.stringify(
        this.filteredReports,
        null,
        2
      );

    const blob =
      new Blob(
        [content],
        { type: 'application/json' }
      );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download =
      'reportes-trainshier.json';

    a.click();

    window.URL.revokeObjectURL(url);

  }

}
