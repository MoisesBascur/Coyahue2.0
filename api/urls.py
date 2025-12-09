from django.urls import path
from .views import (
    LoginView, EquipoListView, EquipoDetailView, PerfilView, UserListView, UserDetailView,
    DashboardDataView, ReservaListView, ReservaDetailView, TipoEquipoListView, EstadoListView,
    ProveedorListView, SucursalListView, AuditoriaListView, ActividadListView, InsumoListView,
    InsumoDetailView, TareaListView, TareaDetailView, TareaCompleteView, NotificacionListView
)

app_name = 'api'

urlpatterns = [
    path('login/', LoginView.as_view(), name='api_login'),
    path('perfil/', PerfilView.as_view(), name='api_perfil'),
    path('equipos/', EquipoListView.as_view(), name='api_equipos'),
    path('equipos/<int:pk>/', EquipoDetailView.as_view(), name='api_equipo_detalle'),
    path('insumos/', InsumoListView.as_view(), name='api_insumos_list'),
    path('insumos/<int:pk>/', InsumoDetailView.as_view(), name='api_insumos_detail'),
    path('usuarios/', UserListView.as_view(), name='api_usuarios_list'),
    path('usuarios/<int:pk>/', UserDetailView.as_view(), name='api_usuarios_detail'),
    path('dashboard/', DashboardDataView.as_view(), name='api_dashboard'),
    path('reservas/', ReservaListView.as_view(), name='api_reservas_list'),
    path('reservas/<int:pk>/', ReservaDetailView.as_view(), name='api_reservas_detail'),
    path('tipos-equipo/', TipoEquipoListView.as_view(), name='api_tipos_list'),
    path('estados/', EstadoListView.as_view(), name='api_estados_list'),
    path('proveedores/', ProveedorListView.as_view(), name='api_proveedores_list'),
    path('sucursales/', SucursalListView.as_view(), name='api_sucursales_list'),
    path('auditoria/', AuditoriaListView.as_view(), name='api_auditoria_list'),
    path('actividades/', ActividadListView.as_view(), name='api_actividades_list'),
    path('tareas/', TareaListView.as_view(), name='api_tareas_list'),
    path('tareas/create/', TareaListView.as_view(), name='api_tareas_create'),
    path('tareas/<int:pk>/', TareaDetailView.as_view(), name='api_tareas_detail'),
    path('tareas/<int:pk>/complete/', TareaCompleteView.as_view(), name='api_tareas_complete'),
    path('notificaciones/', NotificacionListView.as_view(), name='api_notificaciones_list'),
]