from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, update_last_login
from django.db.models import Q, Count 
from django.db.models.functions import ExtractYear 
from django.utils import timezone
from django.core.files.base import ContentFile
import io

from rest_framework.filters import SearchFilter 
from django_filters.rest_framework import DjangoFilterBackend 
from rest_framework.pagination import PageNumberPagination 
from .filters import EquipoFilter 

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

# --- FUNCIÓN AUXILIAR PARA CREAR NOTIFICACIONES ---
def crear_notificacion(usuario, titulo, descripcion):
    """Crea una notificación en la campanita de forma segura"""
    usuario_a_guardar = usuario if usuario else None 
    try:
        Actividad.objects.create(
            usuario=usuario_a_guardar,
            tipo='notificacion',
            titulo=titulo,
            descripcion=descripcion,
            fecha=timezone.now(),
            due_datetime=timezone.now()
        )
    except Exception as e:
        print(f"❌ Error creando notificación: {e}")

# --- VISTA 1: LOGIN ---
class LoginView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
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
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Crear Usuario",
            modelo_afectado="Usuario",
            detalle=f"ID: {instancia.id} - {instancia.username}"
        )
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
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend] 
    filterset_class = EquipoFilter
    
    pagination_class = None 

    def get_queryset(self):
        queryset = Equipos.objects.all()

        # --- MANEJO ROBUSTO DE FILTRO DE TEXTO LIBRE (LUPA) ---
        search_term = self.request.query_params.get('search', None)
        
        if search_term:
            queryset = queryset.filter(
                Q(marca__icontains=search_term) |
                Q(modelo__icontains=search_term) |
                Q(nro_serie__icontains=search_term) |
                Q(rut_asociado__icontains=search_term) | 
                Q(id_estado__nombre_estado__icontains=search_term) |
                Q(id_tipo_equipo__nombre_tipo__icontains=search_term) |
                Q(id_sucursal__nombre__icontains=search_term) |
                Q(id_usuario_responsable__username__icontains=search_term) |
                Q(id_usuario_responsable__email__icontains=search_term) 
            )

        return queryset.order_by('-id') 

    # 🛑 CRÍTICO: ANULAR LA PAGINACIÓN SI SE PIDE 'all=true' (para el Calendario)
    def get(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            if hasattr(self, 'pagination_class'):
                self._original_pagination_class = self.pagination_class
            self.pagination_class = None
        
        response = super().get(request, *args, **kwargs)
        
        if hasattr(self, '_original_pagination_class'):
            self.pagination_class = self._original_pagination_class
        
        return response

    def perform_create(self, serializer):
        instancia = serializer.save()
        
        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Crear",
            modelo_afectado="Equipo",
            detalle=f"ID: {instancia.id} - {instancia.marca} {instancia.modelo}"
        )
        
        crear_notificacion(
            None,
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
        crear_notificacion(
            self.request.user,
            "Auditoría: Equipo Eliminado",
            f"Se eliminó: {detalle_log}"
        )

# --- VISTA PARA CARGA MASIVA DE EQUIPOS (BULK) ---
class EquipoBulkCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        
        cantidad_str = data.get('cantidad', '1')
        id_proveedor = data.get('proveedor_id') 
        factura_file = request.FILES.get('factura')
        
        try:
            cantidad = int(cantidad_str)
            if cantidad < 1:
                raise ValueError
        except ValueError:
            return Response({"error": "La cantidad debe ser un número entero válido mayor a 0."}, status=status.HTTP_400_BAD_REQUEST)

        if not id_proveedor:
            return Response({"error": "El campo Proveedor es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            id_tipo_equipo = data.get('tipo_id')
            id_estado = data.get('estado_id')
            id_sucursal = data.get('sucursal_id')
            
            tipo_equipo_inst = TiposDeEquipo.objects.get(pk=id_tipo_equipo) if id_tipo_equipo else None
            estado_inst = Estados.objects.get(pk=id_estado) if id_estado else None
            proveedor_inst = Proveedores.objects.get(pk=id_proveedor)
            sucursal_inst = Sucursal.objects.get(pk=id_sucursal) if id_sucursal else None
            
        except (TiposDeEquipo.DoesNotExist, Estados.DoesNotExist, Proveedores.DoesNotExist, Sucursal.DoesNotExist) as e:
            return Response({"error": f"ID de relación inválido. Por favor, verifica el ID de Proveedor, Tipo, Estado o Sucursal."}, status=status.HTTP_400_BAD_REQUEST)

        import io
        from django.core.files.base import ContentFile
        
        factura_content = None
        factura_name = None
        if factura_file:
            factura_content = factura_file.read() 
            factura_file.seek(0)
            factura_name = factura_file.name
        
        equipos_creados = []
        nro_base = data.get('nro_serie', 'BULK')

        for i in range(1, cantidad + 1):
            
            equipo = Equipos(
                id_tipo_equipo=tipo_equipo_inst,
                id_estado=estado_inst,
                id_proveedor=proveedor_inst, 
                id_sucursal=sucursal_inst,
                
                marca=data.get('marca', 'N/A'),
                modelo=data.get('modelo', 'N/A'),
                
                nro_serie=f"{nro_base}-{i}-{timezone.now().strftime('%Y%m%d%H%M%S')}", 
                
                fecha_compra=data.get('fecha_compra'),
                warranty_end_date=data.get('warranty_end_date'),
                
                procesador=data.get('procesador'),
                ram=data.get('ram'),
                almacenamiento=data.get('almacenamiento'),
            )
            
            equipo.save() 
            
            if factura_content is not None:
                file_to_save = ContentFile(factura_content) 
                equipo.factura.save(factura_name, file_to_save, save=True) 
            
            equipos_creados.append(equipo)

        RegistroAuditoria.objects.create(
            usuario=self.request.user,
            accion="Creación Masiva",
            modelo_afectado="Equipos",
            detalle=f"Creados {cantidad} equipos. Marca: {data.get('marca', 'N/A')} | Proveedor: {proveedor_inst.nombre_proveedor}"
        )
        crear_notificacion(
            None,
            "Carga Masiva Completada",
            f"Se crearon {cantidad} equipos. Actualiza la tabla para verlos."
        )

        return Response({"message": f"Se crearon {cantidad} equipos exitosamente."}, status=status.HTTP_201_CREATED)


class InsumoListView(generics.ListCreateAPIView):
    queryset = Insumo.objects.all().order_by('id')
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        instancia = serializer.save()
        crear_notificacion(None, "Nuevo Insumo", f"Registrado: {instancia.nombre}") 

class InsumoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instancia = serializer.save()
        crear_notificacion(None, "Insumo Actualizado", f"Editado: {instancia.nombre}") 

    def perform_destroy(self, instance):
        nombre = instance.nombre
        instance.delete()
        crear_notificacion(None, "Insumo Eliminado", f"Se borró: {nombre}") 

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
        
        equipos_por_proveedor = []
        proveedores = Proveedores.objects.all()
        
        for prov in proveedores:
            cantidad = Equipos.objects.filter(id_proveedor=prov).count()
            if cantidad > 0: 
                equipos_por_proveedor.append({
                    'proveedor': prov.nombre_proveedor, 
                    'cantidad': cantidad
                })
        
        equipos_sin_proveedor = Equipos.objects.filter(id_proveedor__isnull=True).count()
        if equipos_sin_proveedor > 0:
            equipos_por_proveedor.append({
                'proveedor': 'Sin Proveedor Asignado', 
                'cantidad': equipos_sin_proveedor
            })
            
        adquisiciones_por_anio = Equipos.objects.annotate(
            anio=ExtractYear('fecha_compra')
        ).filter(
            anio__isnull=False
        ).values('anio', 'id_proveedor__nombre_proveedor').annotate(
            total=Count('id')
        ).order_by('anio', 'id_proveedor__nombre_proveedor')
        
        grafico_adquisiciones = []
        for item in adquisiciones_por_anio:
            proveedor_nombre = item['id_proveedor__nombre_proveedor'] or 'Sin Proveedor Asignado'
            
            grafico_adquisiciones.append({
                'anio': item['anio'],
                'proveedor': proveedor_nombre,
                'cantidad': item['total']
            })
            
        data = {
            'kpis': {
                'total_equipos': total_equipos,
                'total_usuarios': total_usuarios,
                'equipos_sin_uso': equipos_sin_uso,
                'total_insumos': total_insumos
            },
            'grafico_equipos_uso': {'en_uso': total_equipos - equipos_sin_uso, 'sin_uso': equipos_sin_uso},
            'grafico_stock_general': stock_general,
            'grafico_proveedores': equipos_por_proveedor,
            'grafico_adquisiciones': grafico_adquisiciones,
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

# --- ACTIVIDADES Y TAREAS ---
class ActividadListView(generics.ListCreateAPIView):
    queryset = Actividad.objects.all().order_by('-fecha')
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

class TareaListView(generics.ListCreateAPIView):
    queryset = Actividad.objects.filter(tipo='tarea').order_by('-fecha')
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        instancia = serializer.save(tipo='tarea')
        
        crear_notificacion(
            self.request.user,
            "Nueva Tarea Creada",
            f"Asignaste la tarea '{instancia.titulo}' a {instancia.usuario.username}"
        )

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
        
        tarea.etiqueta = 'hecho'
        tarea.completed_at = timezone.now()
        tarea.save()
        
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
            tipo='notificacion'
        ).filter(
            Q(usuario=self.request.user) | Q(usuario__isnull=True)
        ).order_by('-fecha')