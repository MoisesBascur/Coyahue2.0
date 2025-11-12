from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
# 1. Importamos IsAdminUser e IsAuthenticated
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser 
from django.db.models import Q 
from rest_framework import generics

from .models import Equipos, Perfil, TiposDeEquipo, Estados, Reserva
from .serializers import (
    EquipoSerializer, 
    UserPerfilSerializer,
    UserManagementSerializer,
    ReservaSerializer
)

# --- VISTA 1: LOGIN (PÚBLICA) ---
class LoginView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        print("--- INICIANDO LOGIN ---")
        email_or_username = request.data.get('correo')
        password = request.data.get('contraseña')
        
        print(f"Intentando loguear con: '{email_or_username}'")

        if not email_or_username or not password:
            return Response({"error": "Debe proporcionar correo y contraseña"}, status=status.HTTP_400_BAD_REQUEST)

        # Búsqueda doble (Username O Email)
        user = User.objects.filter(
            Q(username=email_or_username) | Q(email=email_or_username)
        ).first()

        if user is None:
            print("ERROR: No se encontró usuario.")
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        
        print(f"Usuario encontrado: {user.username}")

        authenticated_user = authenticate(username=user.username, password=password)

        if authenticated_user:
            print("¡ÉXITO! Contraseña correcta.")
            token, created = Token.objects.get_or_create(user=authenticated_user)
            
            # Enviamos también si es admin (is_staff) para que el frontend sepa qué mostrar
            return Response(
                {
                    'token': token.key,
                    'user_id': authenticated_user.pk,
                    'email': authenticated_user.email,
                    'es_admin': authenticated_user.is_staff # <-- Útil para el frontend
                },
                status=status.HTTP_200_OK
            )
        
        print("ERROR: Contraseña incorrecta.")
        return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

# --- VISTAS DE PERFIL (CUALQUIER USUARIO LOGUEADO) ---
class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPerfilSerializer
    permission_classes = [IsAuthenticated] # Solo necesita estar logueado

    def get_object(self):
        return self.request.user

# --- VISTAS DE GESTIÓN DE USUARIOS (SOLO ADMIN) ---
# Aquí aplicamos la restricción de seguridad
class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('id') 
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser] # <-- ¡SOLO ADMINS!

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser] # <-- ¡SOLO ADMINS!

# --- VISTAS DE INVENTARIO (CUALQUIER USUARIO LOGUEADO) ---
# (Si quisieras restringir esto también, cambia a IsAdminUser)
class EquipoListView(generics.ListAPIView):
    queryset = Equipos.objects.all()
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]

class EquipoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Equipos.objects.all()
    serializer_class = EquipoSerializer
    # Nota: Si quieres que solo admins puedan EDITAR equipos, 
    # deberías usar IsAdminUser aquí también. 
    # Por ahora lo dejaré en IsAuthenticated según tus requerimientos anteriores.
    permission_classes = [IsAuthenticated] 

# --- VISTA DASHBOARD (CUALQUIER USUARIO LOGUEADO) ---
class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        total_equipos = Equipos.objects.count()
        total_usuarios = User.objects.count()
        try:
            estado_sin_uso_id = Estados.objects.get(nombre_estado__iexact='Disponible').id
        except Estados.DoesNotExist:
            estado_sin_uso_id = None
        equipos_sin_uso = Equipos.objects.filter(id_estado=estado_sin_uso_id).count()
        equipos_en_uso = total_equipos - equipos_sin_uso
        stock_general = []
        tipos_de_equipo = TiposDeEquipo.objects.all()
        for tipo in tipos_de_equipo:
            conteo = Equipos.objects.filter(id_tipo_equipo=tipo).count()
            stock_general.append({'tipo': tipo.nombre_tipo, 'cantidad': conteo})
        data = {
            'kpis': {'total_equipos': total_equipos, 'total_usuarios': total_usuarios, 'equipos_sin_uso': equipos_sin_uso},
            'grafico_equipos_uso': {'en_uso': equipos_en_uso, 'sin_uso': equipos_sin_uso},
            'grafico_stock_general': stock_general
        }
        return Response(data, status=status.HTTP_200_OK)

# --- VISTAS DE RESERVAS (CUALQUIER USUARIO LOGUEADO) ---
class ReservaListView(generics.ListCreateAPIView):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

class ReservaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]