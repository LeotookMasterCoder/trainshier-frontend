import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {

  darkMode: boolean = false;

  successMessage = '';
  errorMessage = '';

  form = this.fb.group({

    email:['',[
      Validators.required,
      Validators.email
    ]],

    newPassword:['',[
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
    ]],

    confirmPassword:['',[
      Validators.required
    ]]
  });

  constructor(
    private fb:FormBuilder,
    private router:Router
  ){}

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('theme') === 'dark';
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    const root = document.documentElement;
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }

  submit():void{

    this.errorMessage = '';
    this.successMessage = '';

    if(this.form.invalid){
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa correctamente todos los campos.';
      return;
    }

    const password = this.form.value.newPassword;
    const confirm = this.form.value.confirmPassword;

    if(password !== confirm){
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.successMessage =
      'Contraseña actualizada correctamente.';

    setTimeout(()=>{
      this.router.navigate(['/login']);
    },1500);
  }

  back():void{
    this.router.navigate(['/login']);
  }

}
