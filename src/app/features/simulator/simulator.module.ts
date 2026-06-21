import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { SimulatorComponent } from './simulator/simulator.component';

@NgModule({
  declarations: [
    SimulatorComponent
  ],

  imports: [
    CommonModule,
    FormsModule,
    ZXingScannerModule
  ],

  exports: [
    SimulatorComponent
  ]
})
export class SimulatorModule {}
