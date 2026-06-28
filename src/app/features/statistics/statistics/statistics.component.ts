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
  successRate: number = 0;
  totalCustomers: number = 0;
  instructors: number = 0;
  apprentices: number = 0;
  bestScore: number = 0;
  averageScore: number = 0;
  totalErrors: number = 0;

  ranking: any[] = [];

  currentTab: string = 'stats'; // 'stats' | 'users' | 'rfid' | 'settings'
  isAdmin: boolean = false;
  cameraEnabled: boolean = true;

  // User Management
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  pagedUsers: any[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // RFID Requests
  rfidRequests: any[] = [];
  rfidLoading: boolean = false;

  // Modals
  showCreateUserModal: boolean = false;
  showEditUserModal: boolean = false;
  showDeleteConfirm: boolean = false;
  showTruncateConfirm: boolean = false;

  // Create user form
  newUserName: string = '';
  newUserEmail: string = '';
  newUserPass: string = '';
  newUserRfid: string = '';
  newUserRole: string = 'INSTRUCTOR';

  // Edit user form
  editingUser: any = null;
  editName: string = '';
  editEmail: string = '';
  editRole: string = 'APPRENTICE';
  editRfid: string = '';

  userToDelete: any = null;
  successMessage: string = '';
  errorMessage: string = '';
  Math = Math;

  private currentAdminId: number = 0;

  constructor(
    private userService: UserService,
    private transactionService: TransactionService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const roleStr = localStorage.getItem('role') || '';
    this.isAdmin = roleStr.toUpperCase().includes('ADMINISTRATOR') ||
                   roleStr.toUpperCase().includes('ADMINISTRADOR') ||
                   roleStr.toUpperCase().includes('ADMIN');
    this.currentAdminId = Number(localStorage.getItem('userId') || 0);
    this.cameraEnabled = localStorage.getItem('camera_enabled') !== 'false';
    this.loadStatistics();
    if (this.isAdmin) this.loadAllUsers();
  }

  toggleCameraConfig(): void {
    this.cameraEnabled = !this.cameraEnabled;
    localStorage.setItem('camera_enabled', String(this.cameraEnabled));
    this.successMessage = `Cámara de escaneo ${this.cameraEnabled ? 'habilitada' : 'deshabilitada'} globalmente.`;
    setTimeout(() => this.successMessage = '', 4000);
  }

  private cachedUsers: any[] | null = null;
  private cachedReports: any[] | null = null;

  loadStatistics(): void {
    this.userService.getAll().subscribe({
      next: (usersList) => {
        this.totalUsers = usersList.length;
        this.apprentices = usersList.filter(u =>
          (u.role + '').toUpperCase().includes('APPRENTICE') ||
          (u.role + '').toUpperCase().includes('APRENDIZ')
        ).length;
        this.instructors = usersList.filter(u =>
          (u.role + '').toUpperCase().includes('INSTRUCTOR')
        ).length;
        this.updateRanking(usersList, null);
      },
      error: (err) => console.error('Error loading users:', err)
    });

    this.reportService.getAll().subscribe({
      next: (reportsList) => {
        this.totalSimulations = reportsList.length;
        this.totalCustomers = reportsList.length * 3;
        if (reportsList.length > 0) {
          const totalScore = reportsList.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
          this.averageScore = Math.round(totalScore / reportsList.length);
          this.successRate = this.averageScore;
          this.bestScore = Math.max(...reportsList.map((r: any) => r.score || 0));
        }
        this.updateRanking(null, reportsList);
      },
      error: (err) => console.error('Error loading reports:', err)
    });

    this.transactionService.getAll().subscribe({
      next: (txList) => {
        this.totalTransactions = txList.length;
        this.totalErrors = txList.reduce((sum: number, t: any) => sum + (t.errors || 0), 0);
      },
      error: (err) => console.error('Error loading transactions:', err)
    });
  }

  private updateRanking(usersList: any[] | null, reportsList: any[] | null): void {
    if (usersList) this.cachedUsers = usersList;
    if (reportsList) this.cachedReports = reportsList;
    if (this.cachedUsers && this.cachedReports) {
      const ranks = this.cachedUsers.map(u => ({
        name: u.name || 'Usuario', role: u.role || 'APPRENTICE', effectiveness: 0, simulations: 0
      }));
      ranks.forEach(item => {
        const userReports = this.cachedReports!.filter(r => r.user && r.user.name === item.name);
        item.simulations = userReports.length;
        if (userReports.length > 0) {
          const ef = userReports.reduce((sum: number, r: any) => sum + (r.effectiveness || 0), 0);
          item.effectiveness = Math.round(ef / userReports.length);
        }
      });
      this.ranking = ranks.filter(u => u.simulations > 0)
        .sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 5);
    }
  }

  changeTab(tabName: string): void {
    this.currentTab = tabName;
    this.successMessage = '';
    this.errorMessage = '';
    if (tabName === 'rfid') this.loadRfidRequests();
  }

  loadAllUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => { this.allUsers = users; this.applyFilterAndPagination(); },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  applyFilterAndPagination(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredUsers = !query ? [...this.allUsers] :
      this.allUsers.filter(u =>
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.role || '').toLowerCase().includes(query) ||
        (u.rfidUid || '').toLowerCase().includes(query)
      );
    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; this.applyFilterAndPagination(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.applyFilterAndPagination(); } }
  onSearchChange(): void { this.currentPage = 1; this.applyFilterAndPagination(); }

  /** Toggle user active/inactive */
  toggleActive(user: any): void {
    const newState = !user.active;
    this.userService.toggleActive(user.id, newState).subscribe({
      next: () => {
        user.active = newState;
        this.successMessage = `Usuario ${user.name} ${newState ? 'activado' : 'desactivado'}.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al cambiar estado';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  /** Open create user modal (any role) */
  openCreateUser(): void {
    this.newUserName = ''; this.newUserEmail = ''; this.newUserPass = '';
    this.newUserRfid = ''; this.newUserRole = 'INSTRUCTOR';
    this.successMessage = ''; this.errorMessage = '';
    this.showCreateUserModal = true;
  }

  closeCreateUser(): void { this.showCreateUserModal = false; }

  saveNewUser(): void {
    if (!this.newUserName || !this.newUserEmail || !this.newUserPass) {
      this.errorMessage = 'Nombre, correo y contraseña son obligatorios.';
      return;
    }
    const payload = { name: this.newUserName, email: this.newUserEmail,
      password: this.newUserPass, role: this.newUserRole, rfidUid: this.newUserRfid || null };
    this.userService.createAny(payload).subscribe({
      next: () => {
        this.successMessage = 'Usuario creado exitosamente.';
        this.closeCreateUser();
        this.loadAllUsers(); this.loadStatistics();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Error al crear el usuario'; }
    });
  }

  openEditUser(user: any): void {
    this.editingUser = user;
    this.editName = user.name || ''; this.editEmail = user.email || '';
    this.editRole = user.role || 'APPRENTICE'; this.editRfid = user.rfidUid || '';
    this.successMessage = ''; this.errorMessage = '';
    this.showEditUserModal = true;
  }

  closeEditUser(): void { this.showEditUserModal = false; this.editingUser = null; }

  saveUserEdit(): void {
    if (!this.editName || !this.editEmail) { this.errorMessage = 'Nombre y correo son obligatorios'; return; }
    const payload = { name: this.editName, email: this.editEmail, role: this.editRole, rfidUid: this.editRfid || null };
    this.userService.updateAdmin(this.editingUser.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Usuario actualizado correctamente';
        this.closeEditUser(); this.loadAllUsers(); this.loadStatistics();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Error al actualizar'; }
    });
  }

  openDeleteConfirm(user: any): void {
    this.userToDelete = user; this.successMessage = ''; this.errorMessage = '';
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void { this.showDeleteConfirm = false; this.userToDelete = null; }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    this.userService.delete(this.userToDelete.id).subscribe({
      next: () => {
        this.successMessage = `Usuario ${this.userToDelete.name} eliminado.`;
        this.closeDeleteConfirm(); this.loadAllUsers(); this.loadStatistics();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Error al eliminar'; this.closeDeleteConfirm(); }
    });
  }

  openTruncateConfirm(): void { this.successMessage = ''; this.errorMessage = ''; this.showTruncateConfirm = true; }
  closeTruncateConfirm(): void { this.showTruncateConfirm = false; }

  confirmTruncate(): void {
    this.userService.truncateData().subscribe({
      next: () => {
        this.successMessage = 'Tablas de entrenamiento reiniciadas.';
        this.closeTruncateConfirm(); this.loadAllUsers(); this.loadStatistics();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Error al reiniciar'; this.closeTruncateConfirm(); }
    });
  }

  loadRfidRequests(): void {
    this.rfidLoading = true;
    this.userService.getRfidRequests().subscribe({
      next: (reqs: any[]) => { this.rfidRequests = reqs; this.rfidLoading = false; },
      error: () => { this.rfidLoading = false; }
    });
  }

  approveRfid(req: any): void {
    this.userService.reviewRfidRequest(req.id, 'approved', this.currentAdminId).subscribe({
      next: () => {
        req.status = 'approved';
        this.successMessage = `Tarjeta RFID aprobada para ${req.user?.name || 'el usuario'}.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Error al aprobar'; }
    });
  }

  rejectRfid(req: any): void {
    this.userService.reviewRfidRequest(req.id, 'rejected', this.currentAdminId, 'Rechazado por administrador').subscribe({
      next: () => {
        req.status = 'rejected';
        this.successMessage = 'Solicitud RFID rechazada.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Error al rechazar'; }
    });
  }
}
