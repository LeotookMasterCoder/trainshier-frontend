import { Component, HostListener, OnInit } from '@angular/core';
import { CommentService } from '../../../core/services/comment.service';

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

  constructor(private commentService: CommentService) {}

  ngOnInit(): void {
    this.loadComments();
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
          role: 'APPRENTICE',
          message: `📋 El instructor calificó tu simulación de "${this.comment.module}" con un puntaje de ${this.comment.score}.`,
          actionText: 'Ver Calificación',
          route: '/evaluation',
          read: false
        });
        localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));

        this.loadComments();
        this.notification = 'Evaluación guardada correctamente.';
        this.comment = { studentName: '', module: '', score: '', state: '', feedback: '', errors: '' };
        setTimeout(() => this.notification = '', 3000);
      },
      error: (err) => {
        console.error('Error saving comment:', err);
        this.notification = 'Error al guardar la evaluación.';
        setTimeout(() => this.notification = '', 3000);
      }
    });
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
