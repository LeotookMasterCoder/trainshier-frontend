import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector:'app-transaction-form',
  templateUrl:'./transaction-form.component.html',
  styleUrls:['./transaction-form.component.scss']
})

export class TransactionFormComponent{

  form:FormGroup;

  successMessage:string='';

  constructor(
    private fb:FormBuilder,
    private transactionService: TransactionService
  ){

    this.form=this.fb.group({

      product:['',Validators.required],

      quantity:[
        '',
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      price:['', [Validators.required, Validators.min(0)]]

    });

  }

  autofill(): void {
    const products = ['Arroz Premium', 'Leche 1L', 'Pan Integral', 'Chocolate', 'Gaseosa Cola'];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomQty = Math.floor(1 + Math.random() * 5);
    const prices: { [key: string]: number } = {
      'Arroz Premium': 8000,
      'Leche 1L': 4500,
      'Pan Integral': 5500,
      'Chocolate': 3000,
      'Gaseosa Cola': 6000
    };
    
    this.form.patchValue({
      product: randomProduct,
      quantity: randomQty,
      price: prices[randomProduct]
    });
  }

  submit():void{

    if(this.form.invalid){

      this.successMessage='Completa todos los campos';
      return;

    }

    const val = this.form.value;
    const transaction = {
      status: 'COMPLETED',
      total: val.quantity * val.price,
      errors: 0,
      effectiveness: 100.0,
      date: new Date().toISOString()
    };

    this.transactionService.create(transaction).subscribe({
      next: (savedTx) => {
        this.successMessage = 'Transacción registrada correctamente';
        this.form.reset();
      },
      error: (err) => {
        console.error('Error saving manual transaction in DB:', err);
        this.successMessage = 'Error al registrar la transacción';
      }
    });

  }

}
