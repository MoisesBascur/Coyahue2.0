from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, update_last_login
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Q
from rest_framework import generics
from .models import Actividad
from .serializers import ActividadSerializer


from .models import (
    Equipos, Perfil, TiposDeEquipo, Estados, Reserva, RegistroAuditoria, Proveedores
)

from .serializers import (
    EquipoSerializer, UserPerfilSerializer, UserManagementSerializer,
    ReservaSerializer, RegistroAuditoriaSerializer, TipoEquipoSerializer,
    EstadoSerializer, ProveedorSerializer
)

# --- VISTA 1: LOGIN ---
class LoginView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        print("--- INICIANDO LOGIN ---")
        email_or_username = request.data.get('correo')
        password = request.data.get('contraseña')
        
        if not email_or_username or not password:
            return Response({"error": "Debe proporcionar correo y contraseña"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(
            Q(username=email_or_username) | Q(email=email_or_username)
        ).first()

        if user is None:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        
        authenticated_user = authenticate(username=user.username, password=password)

        if authenticated_user:
            update_last_login(None, authenticated_user)
            token, created = Token.objects.get_or_create(user=authenticated_user)
            
            return Response(
                {
                    'token': token.key,
                    'user_id': authenticated_user.pk,
                    'email': authenticated_user.email,
                    'es_admin': authenticated_user.is_staff
                },
                status=status.HTTP_200_OK
            )
        
        return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

# --- VISTAS DE PERFIL ---
class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPerfilSerializer
    permission_classes = [IsAuthenticated]
    def get_object(self): return self.request.user

# --- VISTAS DE GESTIÓN DE USUARIOS (CON AUDITORÍA AÑADIDA) ---
class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('id') 
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser] 

    # Auditoría al Crear Usuario
    def perform_create(self, serializer):
        instancia = serializer.save()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Crear Usuario",
            modelo_afectado="Usuario",
            detalle=f"ID: {instancia.id} - {instancia.username} ({instancia.first_name} {instancia.last_name})"
        )

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser]

    # Auditoría al Editar Usuario
    def perform_update(self, serializer):
        instancia = serializer.save()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Editar Usuario",
            modelo_afectado="Usuario",
            detalle=f"ID: {instancia.id} - {instancia.username}"
        )

    # Auditoría al Eliminar Usuario
    def perform_destroy(self, instance):
        detalle_log = f"ID: {instance.id} - {instance.username}"
        instance.delete()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Eliminar Usuario",
            modelo_afectado="Usuario",
            detalle=detalle_log
        )

# --- VISTAS DE INVENTARIO (CON AUDITORÍA) ---
class EquipoListView(generics.ListCreateAPIView):
    queryset = Equipos.objects.all().order_by('id')
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        instancia = serializer.save()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Crear",
            modelo_afectado="Equipo",
            detalle=f"ID: {instancia.id} - {instancia.marca} {instancia.modelo}"
        )

class EquipoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Equipos.objects.all()
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instancia = serializer.save()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Editar",
            modelo_afectado="Equipo",
            detalle=f"ID: {instancia.id} - {instancia.marca} {instancia.modelo}"
        )

    def perform_destroy(self, instance):
        detalle_log = f"ID: {instance.id} - {instance.marca} {instance.modelo}"
        instance.delete()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Eliminar",
            modelo_afectado="Equipo",
            detalle=detalle_log
        )

# --- VISTAS DE UTILIDADES ---
class TipoEquipoListView(generics.ListAPIView):
    queryset = TiposDeEquipo.objects.all()
    serializer_class = TipoEquipoSerializer
    permission_classes = [IsAuthenticated]

class EstadoListView(generics.ListAPIView):
    queryset = Estados.objects.all()
    serializer_class = EstadoSerializer
    permission_classes = [IsAuthenticated]

class ProveedorListView(generics.ListAPIView):
    queryset = Proveedores.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]

# --- VISTA DE AUDITORÍA ---
class AuditoriaListView(generics.ListAPIView):
    queryset = RegistroAuditoria.objects.all()
    serializer_class = RegistroAuditoriaSerializer
    permission_classes = [IsAdminUser]

# --- VISTA DASHBOARD ---
class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        total_equipos = Equipos.objects.count()
        total_usuarios = User.objects.count()
        try: estado_sin_uso_id = Estados.objects.filter(nombre_estado__icontains='Disponible').first().id
        except AttributeError: estado_sin_uso_id = None
        equipos_sin_uso = Equipos.objects.filter(id_estado=estado_sin_uso_id).count() if estado_sin_uso_id else 0
        stock_general = []
        for tipo in TiposDeEquipo.objects.all():
            stock_general.append({'tipo': tipo.nombre_tipo, 'cantidad': Equipos.objects.filter(id_tipo_equipo=tipo).count()})
        data = {
            'kpis': {'total_equipos': total_equipos, 'total_usuarios': total_usuarios, 'equipos_sin_uso': equipos_sin_uso},
            'grafico_equipos_uso': {'en_uso': total_equipos - equipos_sin_uso, 'sin_uso': equipos_sin_uso},
            'grafico_stock_general': stock_general
        }
        return Response(data, status=status.HTTP_200_OK)

# --- VISTAS DE RESERVAS ---
class ReservaListView(generics.ListCreateAPIView):
    queryset = Reserva.objects.all().order_by('id')
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

class ReservaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

# --- VISTA DE ACTIVIDADES ---
class ActividadListView(generics.ListCreateAPIView):
    """ Lista actividades y permite crear nuevas """
    queryset = Actividad.objects.all().order_by('-fecha') # Las más nuevas primero
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]
