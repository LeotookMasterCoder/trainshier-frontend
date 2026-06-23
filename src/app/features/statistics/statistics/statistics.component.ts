import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector:'app-statistics',
  templateUrl:'./statistics.component.html',
  styleUrls:['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  totalUsers: number = 0;
  totalTransactions: number = 0;
  totalSimulations: number = 0;
  successRate: number = 100;
  totalCustomers: number = 0;
  productsSold: number = 0;
  instructors: number = 0;
  apprentices: number = 0;
  bestScore: number = 0;
  averageScore: number = 0;
  totalErrors: number = 0;
  activeSimulations: number = 0;

  ranking: any[] = [];

  // Tab and Admin Panel variables
  currentTab: string = 'stats'; // 'stats' or 'users'
  isAdmin: boolean = false;
  
  // User Management
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  pagedUsers: any[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Modals
  showCreateInstructorModal: boolean = false;
  showEditUserModal: boolean = false;
  showDeleteConfirm: boolean = false;
  showTruncateConfirm: boolean = false;

  // Form Fields
  newInstName: string = '';
  newInstEmail: string = '';
  newInstPass: string = '';
  newInstRfid: string = '';

  editingUser: any = null;
  editName: string = '';
  editEmail: string = '';
  editRole: string = 'APRENDIZ';
  editRfid: string = '';

  userToDelete: any = null;

  successMessage: string = '';
  errorMessage: string = '';
  Math = Math;

  constructor(
    private userService: UserService,
    private transactionService: TransactionService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const roleStr = localStorage.getItem('role') || '';
    this.isAdmin = roleStr.includes('ADMINISTRATOR') || roleStr.includes('admin') || roleStr.includes('ADMIN');
    this.loadStatistics();
    if (this.isAdmin) {
      this.loadAllUsers();
    }
  }

  private cachedUsers: any[] | null = null;
  private cachedReports: any[] | null = null;

  loadStatistics(): void {
    // 1. Load Users
    this.userService.getAll().subscribe({
      next: (usersList) => {
        this.totalUsers = usersList.length;
        this.apprentices = usersList.filter(u => u.role === 'APRENDIZ').length;
        this.instructors = usersList.filter(u => u.role === 'INSTRUCTOR').length;
        this.updateRanking(usersList, null);
      },
      error: (err) => {
        console.error('Error loading users for statistics:', err);
      }
    });

    // 2. Load Reports (Simulations)
    this.reportService.getAll().subscribe({
      next: (reportsList) => {
        this.totalSimulations = reportsList.length;
        this.totalCustomers = reportsList.length * 3; // Aprox 3 clientes por simulacion
        
        if (reportsList.length > 0) {
          const totalScore = reportsList.reduce((sum, r) => sum + (r.score || 0), 0);
          this.averageScore = Math.round(totalScore / reportsList.length);
          this.successRate = this.averageScore;
          
          const scores = reportsList.map(r => r.score || 0);
          this.bestScore = Math.max(...scores);
        }
        this.updateRanking(null, reportsList);
      },
      error: (err) => {
        console.error('Error loading reports for statistics:', err);
      }
    });

    // 3. Load Transactions
    this.transactionService.getAll().subscribe({
      next: (txList) => {
        this.totalTransactions = txList.length;
        this.productsSold = txList.length * 4; // Aprox 4 productos por venta
        this.totalErrors = txList.reduce((sum, t) => sum + (t.errors || 0), 0);
      },
      error: (err) => {
        console.error('Error loading transactions for statistics:', err);
      }
    });
  }

  private updateRanking(usersList: any[] | null, reportsList: any[] | null): void {
    if (usersList) this.cachedUsers = usersList;
    if (reportsList) this.cachedReports = reportsList;

    if (this.cachedUsers && this.cachedReports) {
      const initialRanking = this.cachedUsers.map(u => ({
        name: u.name || 'Usuario',
        role: u.role || 'APRENDIZ',
        effectiveness: 0,
        simulations: 0
      }));

      initialRanking.forEach(userItem => {
        const userReports = this.cachedReports!.filter(r => r.user && r.user.name === userItem.name);
        userItem.simulations = userReports.length;
        if (userReports.length > 0) {
          const userSum = userReports.reduce((sum, r) => sum + (r.effectiveness || 0), 0);
          userItem.effectiveness = Math.round(userSum / userReports.length);
        }
      });

      this.ranking = initialRanking
        .filter(u => u.simulations > 0)
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, 5);
    }
  }

  // === USER MANAGEMENT PANEL METHODS ===
  changeTab(tabName: string): void {
    this.currentTab = tabName;
    this.successMessage = '';
    this.errorMessage = '';
  }

  loadAllUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.applyFilterAndPagination();
      },
      error: (err) => {
        console.error("Error loading users for management:", err);
      }
    });
  }

  applyFilterAndPagination(): void {
    // 1. Filtrado por buscador
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredUsers = [...this.allUsers];
    } else {
      this.filteredUsers = this.allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query)) ||
        (u.rfidUid && u.rfidUid.toLowerCase().includes(query))
      );
    }

    // 2. Calcular páginas
    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    // 3. Obtener subconjunto paginado
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, end);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilterAndPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilterAndPagination();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  // --- CRUD Modals ---
  openCreateInstructor(): void {
    this.newInstName = '';
    this.newInstEmail = '';
    this.newInstPass = '';
    this.newInstRfid = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.showCreateInstructorModal = true;
  }

  closeCreateInstructor(): void {
    this.showCreateInstructorModal = false;
  }

  saveInstructor(): void {
    if (!this.newInstName || !this.newInstEmail || !this.newInstPass) {
      this.errorMessage = 'Los campos de nombre, correo y contraseña son obligatorios';
      return;
    }

    const payload = {
      name: this.newInstName,
      email: this.newInstEmail,
      password: this.newInstPass,
      rfidUid: this.newInstRfid || null
    };

    this.userService.createInstructor(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Instructor creado exitosamente. Se pueden enviar las credenciales.';
        this.closeCreateInstructor();
        this.loadAllUsers();
        this.loadStatistics(); // Actualizar contadores
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al crear la cuenta de instructor';
      }
    });
  }

  openEditUser(user: any): void {
    this.editingUser = user;
    this.editName = user.name || '';
    this.editEmail = user.email || '';
    this.editRole = user.role || 'APRENDIZ';
    this.editRfid = user.rfidUid || '';
    this.successMessage = '';
    this.errorMessage = '';
    this.showEditUserModal = true;
  }

  closeEditUser(): void {
    this.showEditUserModal = false;
    this.editingUser = null;
  }

  saveUserEdit(): void {
    if (!this.editName || !this.editEmail) {
      this.errorMessage = 'Nombre y correo son obligatorios';
      return;
    }

    const payload = {
      name: this.editName,
      email: this.editEmail,
      role: this.editRole,
      rfidUid: this.editRfid || null
    };

    this.userService.updateAdmin(this.editingUser.id, payload).subscribe({
      next: (res) => {
        this.successMessage = 'Datos de usuario actualizados correctamente';
        this.closeEditUser();
        this.loadAllUsers();
        this.loadStatistics(); // Actualizar contadores
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al actualizar el usuario';
      }
    });
  }

  openDeleteConfirm(user: any): void {
    this.userToDelete = user;
    this.successMessage = '';
    this.errorMessage = '';
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.userService.delete(this.userToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = `El usuario ${this.userToDelete.name} y todos sus datos asociados fueron eliminados en cascada con éxito.`;
        this.closeDeleteConfirm();
        this.loadAllUsers();
        this.loadStatistics(); // Actualizar contadores
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al eliminar el usuario';
        this.closeDeleteConfirm();
      }
    });
  }

  openTruncateConfirm(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.showTruncateConfirm = true;
  }

  closeTruncateConfirm(): void {
    this.showTruncateConfirm = false;
  }

  confirmTruncate(): void {
    this.userService.truncateData().subscribe({
      next: (res) => {
        this.successMessage = 'Se han reiniciado y vaciado todas las tablas de entrenamiento y simulación del sistema.';
        this.closeTruncateConfirm();
        this.loadAllUsers();
        this.loadStatistics(); // Recargar todas las estadísticas (deben quedar en 0)
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al reiniciar las tablas';
        this.closeTruncateConfirm();
      }
    });
  }
}
