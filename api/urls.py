from django.urls import path
from .views import (
    LoginView, 
    EquipoListView, 
    EquipoDetailView, 
    PerfilView,
    UserListView,
    UserDetailView,
    DashboardDataView,
    ReservaListView, 
    ReservaDetailView,
    TipoEquipoListView, 
    EstadoListView, 
    ProveedorListView,
    AuditoriaListView,
    ActividadListView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='api_login'),
    
    # Perfil (Current User)
    path('perfil/', PerfilView.as_view(), name='api_perfil'),
    
    # Equipos (Inventory)
    path('equipos/', EquipoListView.as_view(), name='api_equipos'),
    path('equipos/<int:pk>/', EquipoDetailView.as_view(), name='api_equipo_detalle'),
    
    # Gestión de Usuarios
    path('usuarios/', UserListView.as_view(), name='api_usuarios_list'),
    path('usuarios/<int:pk>/', UserDetailView.as_view(), name='api_usuarios_detail'),

    # Dashboard
    path('dashboard/', DashboardDataView.as_view(), name='api_dashboard'),

    # Reservas (Calendario)
    path('reservas/', ReservaListView.as_view(), name='api_reservas_list'),
    path('reservas/<int:pk>/', ReservaDetailView.as_view(), name='api_reservas_detail'),

    # Dropdowns (Listas para formularios)
    path('tipos-equipo/', TipoEquipoListView.as_view(), name='api_tipos_list'),
    path('estados/', EstadoListView.as_view(), name='api_estados_list'),
    path('proveedores/', ProveedorListView.as_view(), name='api_proveedores_list'),

    # --- AUDITORÍA (LA RUTA QUE FALTABA) ---
    path('auditoria/', AuditoriaListView.as_view(), name='api_auditoria_list'),

    path('actividades/', ActividadListView.as_view(), name='api_actividades_list'),
]