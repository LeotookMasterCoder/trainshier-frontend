import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { LoadingComponent } from './components/loading/loading.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';



@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    LoadingComponent,
    EmptyStateComponent
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
