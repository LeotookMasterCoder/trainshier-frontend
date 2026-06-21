import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SimulatorComponent } from './simulator/simulator.component';

@NgModule({
  declarations: [
    SimulatorComponent
  ],

  imports: [
    CommonModule,
    FormsModule
  ],

  exports: [
    SimulatorComponent
  ]
})
export class SimulatorModule {}
