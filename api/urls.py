from django.urls import path
from .views import (
    LoginView, 
    EquipoListView, 
    EquipoDetailView, 
    PerfilView,
    UserListView,
    UserDetailView,
    DashboardDataView,
    ReservaListView, # Importar
    ReservaDetailView # Importar
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='api_login'),
    
    path('perfil/', PerfilView.as_view(), name='api_perfil'),
    
    path('equipos/', EquipoListView.as_view(), name='api_equipos'),
    path('equipos/<int:pk>/', EquipoDetailView.as_view(), name='api_equipo_detalle'),
    
    path('usuarios/', UserListView.as_view(), name='api_usuarios_list'),
    path('usuarios/<int:pk>/', UserDetailView.as_view(), name='api_usuarios_detail'),

    path('dashboard/', DashboardDataView.as_view(), name='api_dashboard'),

    # --- RUTAS DE CALENDARIO ---
    path('reservas/', ReservaListView.as_view(), name='api_reservas_list'),
    path('reservas/<int:pk>/', ReservaDetailView.as_view(), name='api_reservas_detail'),
]