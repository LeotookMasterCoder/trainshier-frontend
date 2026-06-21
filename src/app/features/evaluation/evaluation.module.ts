import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportListComponent } from './report-list/report-list.component';
import { InstructorCommentsComponent } from './instructor-comments/instructor-comments.component';
import { StatisticsComponent } from './statistics/statistics.component';



@NgModule({
  declarations: [
    ReportListComponent,
    InstructorCommentsComponent,
    StatisticsComponent
  ],
  imports: [
    CommonModule
  ]
})
export class EvaluationModule { }
