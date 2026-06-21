import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss']
})
export class ManualComponent implements OnInit {
  activeTab: string = 'rfid';
  darkMode: boolean = false;

  tabs = [
    { id: 'rfid', label: '🔑 Acceso RFID', icon: 'card_membership' },
    { id: 'pos', label: '🛒 Simulador POS', icon: 'point_of_sale' },
    { id: 'scanner', label: '📷 Escaneo ZXing / USB', icon: 'qr_code_scanner' },
    { id: 'ai', label: '🤖 Escenarios e IA', icon: 'psychology' }
  ];

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('theme') === 'dark';
  }

  setTab(tabId: string): void {
    this.activeTab = tabId;
  }
}
