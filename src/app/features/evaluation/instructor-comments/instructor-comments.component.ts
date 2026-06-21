import { Component, HostListener, OnInit } from '@angular/core';
import { CommentService } from '../../../core/services/comment.service';

@Component({
  selector: 'app-instructor-comments',
  templateUrl: './instructor-comments.component.html',
  styleUrls: ['./instructor-comments.component.scss']
})
export class InstructorCommentsComponent implements OnInit {
  nombreAprendiz: string = 'Carlos Ramírez';
  puntaje: number = 82;
  tiempo: number = 14;
  errores: number = 3;
  aiAnalysis: string = 'Analizando desempeño...';
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

  constructor(private commentService: CommentService) {}

  ngOnInit(): void {
    this.loadComments();
    this.generateAIAnalysis();

    setTimeout(() => {
      this.notification = 'El aprendiz terminó correctamente la simulación.';
    }, 1500);
  }

  loadComments(): void {
    this.commentService.getAll().subscribe({
      next: (res: any[]) => {
        this.comments = res.map(item => {
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
            // Fallback if not JSON
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

        // Seed some defaults only if database is empty
        if (this.comments.length === 0) {
          this.comments = [
            {
              studentName: 'Carlos Ramírez',
              module: 'Arqueo de Caja',
              score: 82,
              state: 'Aprobado',
              feedback: 'Buen desempeño general en la simulación, pero debe mejorar la velocidad en el cobro con tarjeta.',
              errors: '3',
              date: new Date().toISOString().split('T')[0]
            }
          ];
        }
      },
      error: (err) => {
        console.error('Error loading comments from DB, using fallback:', err);
        const savedComments = localStorage.getItem('comments');
        if (savedComments) {
          this.comments = JSON.parse(savedComments);
        }
      }
    });
  }

  generateAIAnalysis(): void {
    if (this.puntaje >= 90) {
      this.aiAnalysis = 'Excelente desempeño. El aprendiz domina los procesos POS, la atención al cliente y la gestión de promociones.';
    } else if (this.puntaje >= 70) {
      this.aiAnalysis = 'Buen rendimiento general. Se recomienda reforzar la velocidad de atención y el cálculo correcto del cambio al cliente.';
    } else {
      this.aiAnalysis = 'Se requiere práctica adicional. Es recomendable fortalecer el manejo de descuentos, procesos POS y validación de productos.';
    }
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
      next: (savedComment) => {
        this.loadComments();
        this.notification = 'Evaluación guardada correctamente.';
        this.comment = {
          studentName: '',
          module: '',
          score: '',
          state: '',
          feedback: '',
          errors: ''
        };
      },
      error: (err) => {
        console.error('Error saving comment in DB:', err);
        this.notification = 'Error al guardar la evaluación.';
      }
    });
  }

  deleteComment(index: number): void {
    const target = this.comments[index];
    if (target && target.id) {
      this.commentService.delete(target.id).subscribe({
        next: () => {
          this.loadComments();
          this.notification = 'Evaluación eliminada correctamente.';
        },
        error: (err) => {
          console.error('Error deleting comment from DB:', err);
          this.comments.splice(index, 1);
          this.notification = 'Evaluación eliminada localmente.';
        }
      });
    } else {
      this.comments.splice(index, 1);
      this.notification = 'Evaluación eliminada.';
    }
  }

  exportEvaluation(): void {

    this.notification =
      'Función de exportación disponible próximamente.';

  }

  @HostListener('document:keydown.enter')

  handleEnter(): void {

    const buttons =
      document.querySelectorAll('button');

    if (buttons.length > 0) {

      (buttons[0] as HTMLButtonElement).focus();

    }

  }

  getApprovedCount(): number {

    return this.comments.filter(

      comment =>
        comment.state === 'Aprobado'

    ).length;

  }

  getRejectedCount(): number {

    return this.comments.filter(

      comment =>
        comment.state === 'No aprobado'

    ).length;

  }

  getAverageScore(): number {

    if (this.comments.length === 0) {

      return 0;

    }

    const total =
      this.comments.reduce(

        (sum, item) =>
          sum + Number(item.score),

        0

      );

    return Math.round(

      total / this.comments.length

    );

  }

}
