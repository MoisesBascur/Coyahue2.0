from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, update_last_login
from django.db.models import Q
from django.utils import timezone

# Modelos unificados
from .models import (
    Actividad, Equipos, Perfil, TiposDeEquipo, Estados, 
    Reserva, RegistroAuditoria, Proveedores, Insumo, Sucursal
)

# Serializers unificados
from .serializers import (
    ActividadSerializer, EquipoSerializer, UserPerfilSerializer, 
    UserManagementSerializer, ReservaSerializer, RegistroAuditoriaSerializer, 
    TipoEquipoSerializer, EstadoSerializer, ProveedorSerializer, 
    InsumoSerializer, TareaSerializer, SucursalSerializer
)

# --- FUNCIÓN AUXILIAR PARA CREAR NOTIFICACIONES (NUEVO) ---
def crear_notificacion(usuario, titulo, descripcion):
    """Crea una notificación en la campanita de forma segura"""
    try:
        Actividad.objects.create(
            usuario=usuario,
            tipo='notificacion',
            titulo=titulo,
            descripcion=descripcion,
            fecha=timezone.now(),
            due_datetime=timezone.now()
        )
        print(f"🔔 Notificación creada para {usuario.username}: {titulo}")
    except Exception as e:
        print(f"❌ Error creando notificación: {e}")

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

# --- GESTIÓN DE USUARIOS (CON NOTIFICACIONES DE AUDITORÍA) ---
class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('id') 
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser] 

    def perform_create(self, serializer):
        instancia = serializer.save()
        # 1. Auditoría
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Crear Usuario",
            modelo_afectado="Usuario",
            detalle=f"ID: {instancia.id} - {instancia.username}"
        )
        # 2. Notificación (Campanita)
        crear_notificacion(
            self.request.user, 
            "Auditoría: Usuario Creado", 
            f"Has creado al usuario {instancia.username}"
        )

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        instancia = serializer.save()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Editar Usuario",
            modelo_afectado="Usuario",
            detalle=f"ID: {instancia.id} - {instancia.username}"
        )
        crear_notificacion(self.request.user, "Auditoría: Usuario Editado", f"Modificaste a {instancia.username}")

    def perform_destroy(self, instance):
        detalle_log = f"ID: {instance.id} - {instance.username}"
        instance.delete()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Eliminar Usuario",
            modelo_afectado="Usuario",
            detalle=detalle_log
        )
        crear_notificacion(self.request.user, "Auditoría: Usuario Eliminado", f"Se eliminó: {detalle_log}")

# --- INVENTARIO (EQUIPOS) ---
class EquipoListView(generics.ListCreateAPIView):
    queryset = Equipos.objects.all().order_by('id')
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def perform_create(self, serializer):
        instancia = serializer.save()
        
        # 1. Auditoría
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Crear",
            modelo_afectado="Equipo",
            detalle=f"ID: {instancia.id} - {instancia.marca} {instancia.modelo}"
        )
        
        # 2. Notificación de Nuevo Equipo
        crear_notificacion(
            self.request.user,
            "Nuevo Equipo",
            f"Agregado: {instancia.marca} {instancia.modelo} ({instancia.nro_serie})"
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
            detalle=f"ID: {instancia.id}"
        )
        # Notificación de edición
        crear_notificacion(
            self.request.user,
            "Auditoría: Equipo Editado",
            f"Se actualizó: {instancia.marca} {instancia.modelo}"
        )

    def perform_destroy(self, instance):
        detalle_log = f"{instance.marca} {instance.modelo}"
        instance.delete()
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Eliminar",
            modelo_afectado="Equipo",
            detalle=detalle_log
        )
        # Notificación de eliminación
        crear_notificacion(
            self.request.user,
            "Auditoría: Equipo Eliminado",
            f"Se eliminó: {detalle_log}"
        )

# --- INSUMOS ---
class InsumoListView(generics.ListCreateAPIView):
    queryset = Insumo.objects.all().order_by('id')
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        instancia = serializer.save()
        crear_notificacion(self.request.user, "Nuevo Insumo", f"Registrado: {instancia.nombre}")

class InsumoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instancia = serializer.save()
        crear_notificacion(self.request.user, "Insumo Actualizado", f"Editado: {instancia.nombre}")

    def perform_destroy(self, instance):
        nombre = instance.nombre
        instance.delete()
        crear_notificacion(self.request.user, "Insumo Eliminado", f"Se borró: {nombre}")

# --- UTILIDADES ---
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

class SucursalListView(generics.ListAPIView):
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [IsAuthenticated]

# --- AUDITORÍA ---
class AuditoriaListView(generics.ListAPIView):
    queryset = RegistroAuditoria.objects.all()
    serializer_class = RegistroAuditoriaSerializer
    permission_classes = [IsAdminUser]

# --- DASHBOARD ---
class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        total_equipos = Equipos.objects.count()
        total_usuarios = User.objects.count()
        total_insumos = Insumo.objects.count()

        try: 
            estado_sin_uso_id = Estados.objects.filter(nombre_estado__icontains='Disponible').first().id
        except AttributeError: 
            estado_sin_uso_id = None
        
        equipos_sin_uso = Equipos.objects.filter(id_estado=estado_sin_uso_id).count() if estado_sin_uso_id else 0
        
        stock_general = []
        for tipo in TiposDeEquipo.objects.all():
            stock_general.append({'tipo': tipo.nombre_tipo, 'cantidad': Equipos.objects.filter(id_tipo_equipo=tipo).count()})
        
        data = {
            'kpis': {
                'total_equipos': total_equipos, 
                'total_usuarios': total_usuarios, 
                'equipos_sin_uso': equipos_sin_uso,
                'total_insumos': total_insumos
            },
            'grafico_equipos_uso': {'en_uso': total_equipos - equipos_sin_uso, 'sin_uso': equipos_sin_uso},
            'grafico_stock_general': stock_general
        }
        return Response(data, status=status.HTTP_200_OK)

# --- RESERVAS ---
class ReservaListView(generics.ListCreateAPIView):
    queryset = Reserva.objects.all().order_by('id')
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

class ReservaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

# --- ACTIVIDADES Y TAREAS (¡AQUÍ ESTÁ LA MAGIA!) ---
class ActividadListView(generics.ListCreateAPIView):
    queryset = Actividad.objects.all().order_by('-fecha')
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

class TareaListView(generics.ListCreateAPIView):
    queryset = Actividad.objects.filter(tipo='tarea').order_by('-fecha')
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # 1. Crear la Tarea real (Se asigna al usuario que venía en el form)
        instancia = serializer.save(tipo='tarea')
        
        # 2. Notificación para el CREADOR (Tú)
        crear_notificacion(
            self.request.user,
            "Nueva Tarea Creada",
            f"Asignaste la tarea '{instancia.titulo}' a {instancia.usuario.username}"
        )

        # 3. Notificación para el ASIGNADO (Si no eres tú mismo)
        if instancia.usuario.id != self.request.user.id:
            crear_notificacion(
                instancia.usuario,
                "Nueva Tarea Asignada",
                f"{self.request.user.username} te asignó: {instancia.titulo}"
            )

class TareaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Actividad.objects.filter(tipo='tarea')
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

class TareaCompleteView(APIView):
    """ Vista para marcar una tarea como completada """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            tarea = Actividad.objects.get(pk=pk, tipo='tarea')
        except Actividad.DoesNotExist:
            return Response({"detail": "Tarea no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        
        # Marcar como hecho
        tarea.etiqueta = 'hecho'
        tarea.completed_at = timezone.now()
        tarea.save()
        
        # --- AQUÍ AGREGAMOS LA NOTIFICACIÓN AL COMPLETAR ---
        crear_notificacion(
            request.user,
            "Tarea Completada",
            f"Has finalizado con éxito: {tarea.titulo}"
        )
        
        data = TareaSerializer(tarea).data
        return Response(data, status=status.HTTP_200_OK)

# --- VISTA DE LA CAMPANITA ---
class NotificacionListView(generics.ListAPIView):
    """ Devuelve solo notificaciones para la campanita del usuario actual """
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Actividad.objects.filter(
            tipo='notificacion', 
            usuario=self.request.user
        ).order_by('-fecha')