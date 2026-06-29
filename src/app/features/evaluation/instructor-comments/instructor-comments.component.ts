import { Component, HostListener, OnInit } from '@angular/core';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-instructor-comments',
  templateUrl: './instructor-comments.component.html',
  styleUrls: ['./instructor-comments.component.scss']
})
export class InstructorCommentsComponent implements OnInit {

  notification: string = '';

  comment: any = {
    studentName: '',
    module: '',
    score: '',
    state: '',
    feedback: '',
    errors: ''
  };

  comments: any[] = [];
  loading: boolean = true;

  trnRequests: any[] = [];
  trnLoading: boolean = false;
  currentInstructorId: number = 0;

  // Autocomplete properties
  apprentices: any[] = [];
  filteredApprentices: any[] = [];
  searchQuery: string = '';
  showSuggestions: boolean = false;

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentInstructorId = Number(localStorage.getItem('userId') || 0);
    this.loadComments();
    this.loadTrnRequests();
    this.loadApprentices();
  }

  loadComments(): void {
    this.loading = true;
    this.commentService.getAll().subscribe({
      next: (res: any[]) => {
        this.comments = res.map(item => {
          let parsed: any = {
            studentName: 'Aprendiz',
            module: 'Simulación',
            state: 'Aprobado',
            feedback: item.comment,
            errors: '0'
          };
          try {
            const p = JSON.parse(item.comment);
            if (p && typeof p === 'object') {
              parsed = { ...parsed, ...p };
            }
          } catch {
            parsed.feedback = item.comment;
          }
          return {
            id: item.id,
            studentName: parsed.studentName || 'Aprendiz',
            module: parsed.module || 'Simulación',
            score: item.score,
            state: parsed.state || 'Aprobado',
            feedback: parsed.feedback || item.comment,
            errors: parsed.errors || '0',
            date: item.date ? item.date.split('T')[0] : new Date().toLocaleDateString()
          };
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        const saved = localStorage.getItem('comments');
        this.comments = saved ? JSON.parse(saved) : [];
        this.loading = false;
      }
    });
  }

  saveComment(): void {
    if (
      !this.comment.studentName ||
      !this.comment.module ||
      !this.comment.score ||
      !this.comment.state ||
      !this.comment.feedback
    ) {
      this.notification = 'Completa todos los campos obligatorios.';
      setTimeout(() => this.notification = '', 3000);
      return;
    }

    const payload = {
      comment: JSON.stringify({
        studentName: this.comment.studentName,
        module: this.comment.module,
        state: this.comment.state,
        feedback: this.comment.feedback,
        errors: this.comment.errors || '0'
      }),
      score: Number(this.comment.score),
      date: new Date().toISOString()
    };

    this.commentService.create(payload).subscribe({
      next: () => {
        // Notify the apprentice
        const savedNotifs = localStorage.getItem('trainshier_notifications');
        let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        notifs.push({
          id: String(Date.now()),
          role: 'APRENDIZ',
          message: `📋 El instructor calificó tu simulación de "${this.comment.module}" con un puntaje de ${this.comment.score}.`,
          actionText: 'Ver Calificación',
          route: '/evaluation',
          read: false
        });
        localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));

        this.loadComments();
        this.notification = 'Evaluación guardada correctamente.';
        this.comment = { studentName: '', module: '', score: '', state: '', feedback: '', errors: '' };
        this.searchQuery = '';
        setTimeout(() => this.notification = '', 3000);
      },
      error: (err) => {
        console.error('Error saving comment:', err);
        this.notification = 'Error al guardar la evaluación.';
        setTimeout(() => this.notification = '', 3000);
      }
    });
  }

  // Autocomplete filter helpers
  loadApprentices(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.apprentices = users.filter(u => u.role?.toUpperCase() === 'APRENDIZ');
        this.filteredApprentices = [...this.apprentices];
      },
      error: (err) => {
        console.error('Error loading apprentices:', err);
      }
    });
  }

  filterApprentices(): void {
    const query = this.searchQuery ? this.searchQuery.toLowerCase().trim() : '';
    if (!query) {
      this.filteredApprentices = [...this.apprentices];
    } else {
      this.filteredApprentices = this.apprentices.filter(a =>
        a.name?.toLowerCase().includes(query) || a.email?.toLowerCase().includes(query)
      );
    }
    // Set studentName to query while typing to maintain model state
    this.comment.studentName = this.searchQuery;
  }

  selectApprentice(app: any): void {
    this.comment.studentName = app.name;
    this.searchQuery = app.name;
    this.showSuggestions = false;
  }

  hideSuggestionsWithDelay(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  deleteComment(index: number): void {
    const target = this.comments[index];
    if (target && target.id) {
      this.commentService.delete(target.id).subscribe({
        next: () => {
          this.loadComments();
          this.notification = 'Evaluación eliminada.';
          setTimeout(() => this.notification = '', 3000);
        },
        error: () => {
          this.comments.splice(index, 1);
          this.notification = 'Evaluación eliminada localmente.';
          setTimeout(() => this.notification = '', 3000);
        }
      });
    } else {
      this.comments.splice(index, 1);
    }
  }

  loadTrnRequests(): void {
    if (!this.currentInstructorId) return;
    this.trnLoading = true;
    this.authService.getPendingTrnRequests(this.currentInstructorId).subscribe({
      next: (reqs) => {
        this.trnRequests = reqs;
        this.trnLoading = false;
      },
      error: (err) => {
        console.error('Error loading TRN requests:', err);
        this.trnLoading = false;
      }
    });
  }

  approveTrn(id: number): void {
    this.authService.approveTrnRequest(id).subscribe({
      next: (res) => {
        this.notification = `Solicitud aprobada. Código generado: ${res.trnCode}`;
        this.loadTrnRequests();

        // Push real-time notification to the apprentice
        const savedNotifs = localStorage.getItem('trainshier_notifications');
        let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        notifs.push({
          id: String(Date.now()),
          role: 'APRENDIZ',
          message: `🎉 ¡Tu solicitud de registro TRN ha sido aprobada! Código: ${res.trnCode}`,
          actionText: 'Completar Registro',
          route: '/register',
          read: false
        });
        localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));

        setTimeout(() => this.notification = '', 4000);
      },
      error: (err) => {
        console.error('Error approving TRN:', err);
        this.notification = 'Error al aprobar la solicitud TRN.';
        setTimeout(() => this.notification = '', 3000);
      }
    });
  }

  rejectTrn(id: number): void {
    this.authService.rejectTrnRequest(id).subscribe({
      next: () => {
        this.notification = 'Solicitud rechazada.';
        this.loadTrnRequests();

        // Push real-time notification to the apprentice
        const savedNotifs = localStorage.getItem('trainshier_notifications');
        let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        notifs.push({
          id: String(Date.now()),
          role: 'APRENDIZ',
          message: `❌ Tu solicitud de registro TRN fue rechazada por el instructor.`,
          actionText: 'Intentar de Nuevo',
          route: '/register',
          read: false
        });
        localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));

        setTimeout(() => this.notification = '', 3000);
      },
      error: (err) => {
        console.error('Error rejecting TRN:', err);
        this.notification = 'Error al rechazar la solicitud TRN.';
        setTimeout(() => this.notification = '', 3000);
      }
    });
  }

  exportEvaluation(): void {
    this.notification = 'Función de exportación disponible próximamente.';
    setTimeout(() => this.notification = '', 3000);
  }

  @HostListener('document:keydown.enter')
  handleEnter(): void {
    const buttons = document.querySelectorAll('button');
    if (buttons.length > 0) (buttons[0] as HTMLButtonElement).focus();
  }

  getApprovedCount(): number {
    return this.comments.filter(c => c.state === 'Aprobado').length;
  }

  getRejectedCount(): number {
    return this.comments.filter(c => c.state === 'No aprobado').length;
  }

  getAverageScore(): number {
    if (this.comments.length === 0) return 0;
    const total = this.comments.reduce((sum, item) => sum + Number(item.score), 0);
    return Math.round(total / this.comments.length);
  }
}
