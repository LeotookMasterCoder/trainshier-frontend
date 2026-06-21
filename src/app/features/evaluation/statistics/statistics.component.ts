import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  selectedPeriod = 'Mes';

  totalSimulations = 1254;
  averageScore = 92;
  averageTime = 38;
  activeStudents = 245;

  stats = [
    {
      title: 'Simulaciones exitosas',
      value: '92%',
      progress: 92
    },
    {
      title: 'Tiempo promedio',
      value: '38s',
      progress: 76
    },
    {
      title: 'Aprendices activos',
      value: '245',
      progress: 85
    },
    {
      title: 'Satisfacción clientes IA',
      value: '96%',
      progress: 96
    }
  ];

  topStudents = [
    {
      name: 'Laura Gómez',
      score: 98
    },
    {
      name: 'Carlos Ruiz',
      score: 95
    },
    {
      name: 'Valentina Castro',
      score: 93
    },
    {
      name: 'Julián Pérez',
      score: 91
    }
  ];

  ngOnInit(): void {}

}
