import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators
} from '@angular/forms';

@Component({
  selector:'app-profile',
  templateUrl:'./profile.component.html',
  styleUrls:['./profile.component.scss']
})
export class ProfileComponent{

  showSuccess:boolean=false;

  profileImage:string='assets/img/default-profile.png';

  role:string='APRENDIZ';

  name:string='Usuario TrainShier';

  userId:string='TRN-0000';

  form=this.fb.group({

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
    private fb:FormBuilder
  ){

    this.role=
      localStorage.getItem('role')
      || 'APRENDIZ';

    this.name=
      localStorage.getItem('name')
      || 'Usuario TrainShier';

    this.userId=
      localStorage.getItem('userId')
      || 'TRN-5642';

    this.profileImage=
      localStorage.getItem('profileImage')
      || 'assets/img/default-profile.png';

    this.form.patchValue({

      email:
        localStorage.getItem('email')
        || '',

      username:
        localStorage.getItem('username')
        || '',

      birthDate:
        localStorage.getItem('birthDate')
        || ''

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

  saveChanges():void{

    if(this.form.invalid){

      this.form.markAllAsTouched();
      return;

    }

    localStorage.setItem(
      'email',
      this.form.value.email || ''
    );

    localStorage.setItem(
      'username',
      this.form.value.username || ''
    );

    localStorage.setItem(
      'birthDate',
      this.form.value.birthDate || ''
    );

    this.showSuccess=true;

    setTimeout(()=>{

      this.showSuccess=false;

    },3000);

  }

}
