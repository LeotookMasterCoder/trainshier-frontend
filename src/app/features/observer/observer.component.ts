import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-observer',
  templateUrl: './observer.component.html',
  styleUrls: ['./observer.component.scss']
})
export class ObserverComponent implements OnInit {

  restrictions: any[] = [];

  ngOnInit(): void {

    this.restrictions = [

      {
        icon: '🔒',
        title: 'Acceso Restringido',
        message: 'Debes iniciar sesión para acceder al simulador.'
      },

      {
        icon: '🛒',
        title: 'Simulación Bloqueada',
        message: 'Los observadores no pueden iniciar simulaciones.'
      },

      {
        icon: '📊',
        title: 'Estadísticas Privadas',
        message: 'Las estadísticas completas solo están disponibles para usuarios registrados.'
      },

      {
        icon: '📝',
        title: 'Evaluaciones Restringidas',
        message: 'Solo los instructores pueden acceder a las evaluaciones.'
      },

      {
        icon: '👤',
        title: 'Perfil Requerido',
        message: 'Debes crear una cuenta para personalizar tu experiencia.'
      },

      {
        icon: '📁',
        title: 'Reportes Bloqueados',
        message: 'Los reportes administrativos requieren permisos especiales.'
      },

      {
        icon: '⚙️',
        title: 'Configuración Limitada',
        message: 'Las opciones avanzadas solo están disponibles para administradores.'
      },

      {
        icon: '🤖',
        title: 'IA de Entrenamiento',
        message: 'Las simulaciones con clientes inteligentes requieren una cuenta activa.'
      }

    ];

  }

}
