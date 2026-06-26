import { Component, OnInit } from '@angular/core';
import { CommentService } from '../../../core/services/comment.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  selectedPeriod = 'Mes';
  loading = true;

  totalSimulations = 0;
  averageScore = 0;
  activeStudents = 0;

  stats: any[] = [];
  topStudents: any[] = [];

  constructor(
    private commentService: CommentService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load comments (evaluations) as simulations proxy
    this.commentService.getAll().subscribe({
      next: (res: any[]) => {
        this.totalSimulations = res.length;

        if (res.length > 0) {
          const totalScore = res.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
          this.averageScore = Math.round(totalScore / res.length);
        }

        // Build top students from comments
        const studentMap = new Map<string, { name: string; totalScore: number; count: number }>();
        res.forEach(item => {
          let name = 'Aprendiz';
          try { name = JSON.parse(item.comment)?.studentName || 'Aprendiz'; } catch {}
          const entry = studentMap.get(name) || { name, totalScore: 0, count: 0 };
          entry.totalScore += Number(item.score) || 0;
          entry.count++;
          studentMap.set(name, entry);
        });

        this.topStudents = Array.from(studentMap.values())
          .map(e => ({ name: e.name, score: Math.round(e.totalScore / e.count) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        this.buildStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Load active apprentice count
    this.userService.getAll().subscribe({
      next: (users: any[]) => {
        this.activeStudents = users.filter(u =>
          (u.role + '').toUpperCase().includes('APPRENTICE') ||
          (u.role + '').toUpperCase().includes('APRENDIZ')
        ).length;
        this.buildStats();
      },
      error: () => {}
    });
  }

  private buildStats(): void {
    this.stats = [
      {
        title: 'Simulaciones exitosas',
        value: this.totalSimulations > 0 ? `${this.averageScore}%` : '—',
        progress: this.averageScore
      },
      {
        title: 'Aprendices activos',
        value: String(this.activeStudents),
        progress: Math.min(this.activeStudents * 10, 100)
      },
      {
        title: 'Evaluaciones registradas',
        value: String(this.totalSimulations),
        progress: Math.min(this.totalSimulations * 5, 100)
      }
    ];
  }
}
