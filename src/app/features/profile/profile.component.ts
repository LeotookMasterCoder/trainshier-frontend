import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators
} from '@angular/forms';
import { UserService } from '../../core/services/user.service';

@Component({
  selector:'app-profile',
  templateUrl:'./profile.component.html',
  styleUrls:['./profile.component.scss']
})
export class ProfileComponent{

  showSuccess: boolean = false;
  errorMessage: string = '';
  profileImage:string='assets/img/default-profile.png';

  role:string='APRENDIZ';

  name:string='Usuario TrainShier';

  userId:string='TRN-0000';

  isLoggedIn: boolean = false;
  solicitudRol: string = 'instructor';
  reporteError: string = '';
  supportSuccessMessage: string = '';
  form=this.fb.group({
    name:[
      '',
      Validators.required
    ],
    email:[
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    username:[
      '',
      [
        Validators.required,
        Validators.pattern(
          /^[a-zA-Z0-9]+#[0-9]{4}$/
        )
      ]
    ],
    birthDate:['']
  });

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ){
    this.isLoggedIn = !!localStorage.getItem('token');
    
    if (!this.isLoggedIn) {
      this.role = 'OBSERVADOR';
      this.name = 'Invitado Observador';
      this.userId = 'INV-0000';
      return;
    }

    this.role = localStorage.getItem('role') || 'APRENDIZ';
    this.name = localStorage.getItem('name') || 'Usuario TrainShier';
    this.userId = localStorage.getItem('userId') || 'TRN-5642';
    this.profileImage = localStorage.getItem('profileImage') || 'assets/img/default-profile.png';

    this.form.patchValue({
      name: this.name,
      email: localStorage.getItem('email') || '',
      username: localStorage.getItem('username') || '',
      birthDate: localStorage.getItem('birthDate') || ''
    });
  }

  changePhoto(event:any):void{

    const file=event.target.files[0];

    if(!file){
      return;
    }

    const reader=new FileReader();

    reader.onload=()=>{

      this.profileImage=
        reader.result as string;

      localStorage.setItem(
        'profileImage',
        this.profileImage
      );

    };

    reader.readAsDataURL(file);

  }
  saveChanges(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    const userIdNum = Number(this.userId);
    const updatePayload = {
      name: this.form.value.name,
      email: this.form.value.email
    };
    this.userService.update(userIdNum, updatePayload).subscribe({
      next: (updatedUser: any) => {
        // Save back to localStorage
        localStorage.setItem('name', updatedUser.name);
        localStorage.setItem('email', updatedUser.email);
        localStorage.setItem('username', this.form.value.username || '');
        localStorage.setItem('birthDate', this.form.value.birthDate || '');

        // Update class property
        this.name = updatedUser.name;

        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
        }, 3000);
      },
      error: (err: any) => {
        console.error('Error updating profile:', err);
        this.errorMessage = err.error?.message || 'Error al actualizar perfil en el servidor';
        setTimeout(() => {
          this.errorMessage = '';
        }, 4000);
      }
    });
  }
  requestRoleChange(): void {
    const savedNotifs = localStorage.getItem('trainshier_notifications');
    let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
    notifs.push({
      id: String(Date.now()),
      role: 'ADMIN',
      message: `👤 Solicitud de Rol: El usuario "${this.name}" solicita cambiar su rol a "${this.solicitudRol.toUpperCase()}".`,
      actionText: 'Ver Solicitudes',
      route: '/statistics',
      read: false
    });
    localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));
    this.supportSuccessMessage = 'Solicitud de cambio de rol enviada al administrador.';
    setTimeout(() => this.supportSuccessMessage = '', 3000);
  }

  reportSystemError(): void {
    if (!this.reporteError || !this.reporteError.trim()) return;
    const savedNotifs = localStorage.getItem('trainshier_notifications');
    let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
    notifs.push({
      id: String(Date.now()),
      role: 'ADMIN',
      message: `⚠️ Reporte de Error: "${this.reporteError.trim()}" (enviado por "${this.name}").`,
      actionText: 'Ver Reportes',
      route: '/reports',
      read: false
    });
    localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));
    this.reporteError = '';
    this.supportSuccessMessage = 'Reporte de error enviado al administrador.';
    setTimeout(() => this.supportSuccessMessage = '', 3000);
  }

}
