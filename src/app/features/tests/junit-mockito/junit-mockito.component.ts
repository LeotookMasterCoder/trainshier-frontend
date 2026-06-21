import { Component } from '@angular/core';

@Component({
  selector: 'app-junit-mockito',
  templateUrl: './junit-mockito.component.html',
  styleUrls: ['./junit-mockito.component.scss']
})
export class JunitMockitoComponent {

  tests = [
    {
      name:'LoginTest',
      status:'PASSED'
    },
    {
      name:'RegisterTest',
      status:'PASSED'
    },
    {
      name:'SimulatorTest',
      status:'PASSED'
    },
    {
      name:'TransactionTest',
      status:'PASSED'
    }
  ];

}
