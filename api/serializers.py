from rest_framework import serializers
from django.contrib.auth.models import User 
from django.utils import timezone
from django.utils.dateparse import parse_datetime
# AGREGADO: Importamos 'Insumo' y 'Sucursal'
from .models import Perfil, Equipos, TiposDeEquipo, Estados, Reserva, Proveedores, RegistroAuditoria, Actividad, Insumo, Sucursal

# --- Serializers Auxiliares ---
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta: model = User; fields = ['id', 'username', 'email']
class TipoEquipoSerializer(serializers.ModelSerializer):
    class Meta: model = TiposDeEquipo; fields = ['id', 'nombre_tipo']
class EstadoSerializer(serializers.ModelSerializer):
    class Meta: model = Estados; fields = ['id', 'nombre_estado']
class ProveedorSerializer(serializers.ModelSerializer):
    class Meta: model = Proveedores; fields = ['id', 'nombre_proveedor']
class SucursalSerializer(serializers.ModelSerializer):
    class Meta: model = Sucursal; fields = ['id', 'nombre', 'direccion']
    
# --- CORRECCIÓN CLAVE: Incluimos Garantía y Factura en el Serializador Simple ---
class EquipoSimpleSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Equipos
        # Incluimos 'warranty_end_date' y 'factura' para que estén disponibles en Reservas y Calendario.
        fields = ['id', 'marca', 'modelo', 'nro_serie', 'factura', 'warranty_end_date'] 

# --- Serializer de Equipos ---
class EquipoSerializer(serializers.ModelSerializer):
    # Serializers anidados para Read
    id_tipo_equipo = TipoEquipoSerializer(read_only=True, allow_null=True)
    id_estado = EstadoSerializer(read_only=True, allow_null=True)
    id_proveedor = ProveedorSerializer(read_only=True, allow_null=True)
    id_usuario_responsable = UsuarioSerializer(read_only=True, allow_null=True) 
    id_sucursal = SucursalSerializer(read_only=True, allow_null=True)
    
    # PrimaryKey fields para Write
    tipo_id = serializers.PrimaryKeyRelatedField(queryset=TiposDeEquipo.objects.all(), source='id_tipo_equipo', write_only=True)
    estado_id = serializers.PrimaryKeyRelatedField(queryset=Estados.objects.all(), source='id_estado', write_only=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(queryset=Proveedores.objects.all(), source='id_proveedor', write_only=True, allow_null=True, required=False)
    usuario_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='id_usuario_responsable', write_only=True, allow_null=True, required=False)
    sucursal_id = serializers.PrimaryKeyRelatedField(queryset=Sucursal.objects.all(), source='id_sucursal', write_only=True, allow_null=True, required=False)
    sucursal_nombre = serializers.CharField(write_only=True, required=False, allow_blank=True)
    factura = serializers.FileField(required=False, allow_null=True) 

    class Meta:
        model = Equipos
        # Aseguramos que 'warranty_end_date' y 'factura' están en los campos principales
        fields = ['id', 'nro_serie', 'marca', 'modelo', 'fecha_compra', 'warranty_end_date', 'rut_asociado', 'procesador', 'ram', 'almacenamiento', 'factura', 'id_tipo_equipo', 'id_estado', 'id_proveedor', 'id_usuario_responsable', 'id_sucursal', 'tipo_id', 'estado_id', 'proveedor_id', 'usuario_id', 'sucursal_id', 'sucursal_nombre']

    def create(self, validated_data):
        sucursal = validated_data.pop('id_sucursal', None)
        sucursal_nombre = validated_data.pop('sucursal_nombre', '').strip()
        if not sucursal and sucursal_nombre:
            sucursal, _ = Sucursal.objects.get_or_create(nombre=sucursal_nombre)
        if sucursal:
            validated_data['id_sucursal'] = sucursal
        return super().create(validated_data)

    def update(self, instance, validated_data):
        sucursal = validated_data.pop('id_sucursal', None)
        sucursal_nombre = validated_data.pop('sucursal_nombre', '').strip()
        if not sucursal and sucursal_nombre:
            sucursal, _ = Sucursal.objects.get_or_create(nombre=sucursal_nombre)
        if sucursal is not None:
            instance.id_sucursal = sucursal
        return super().update(instance, validated_data)

# --- Serializer de Perfil ---
class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['rut', 'area', 'ocupacion', 'foto']

# --- Serializer para "Mi Perfil" ---
class UserPerfilSerializer(serializers.ModelSerializer):
    perfil = PerfilSerializer()
    nombres = serializers.CharField(source='first_name')
    apellidos = serializers.CharField(source='last_name')
    equipos_asignados = EquipoSimpleSerializer(source='equipos_set', many=True, read_only=True)
    es_admin = serializers.BooleanField(source='is_staff', read_only=True)

    class Meta:
        model = User
        fields = ['id','username', 'email', 'nombres', 'apellidos', 'perfil', 'equipos_asignados', 'es_admin']

# --- Serializer para Gestión de Usuarios ---
class UserManagementSerializer(serializers.ModelSerializer):
    nombres = serializers.CharField(source='first_name')
    apellidos = serializers.CharField(source='last_name')
    rol = serializers.BooleanField(source='is_staff', default=False)
    estado = serializers.BooleanField(source='is_active', default=True)
    ultimo_acceso = serializers.DateTimeField(source='last_login', read_only=True)
    
    rut = serializers.CharField(required=False, allow_blank=True)
    area = serializers.CharField(required=False, allow_blank=True)
    ocupacion = serializers.CharField(required=False, allow_blank=True)
    foto = serializers.ImageField(required=False, allow_null=True)
    perfil = PerfilSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'nombres', 'apellidos', 'password', 'rol', 'estado', 'ultimo_acceso', 'rut', 'area', 'ocupacion', 'foto', 'perfil']
        extra_kwargs = { 'password': {'write_only': True, 'required': False} }

    def create(self, validated_data):
        rut = validated_data.pop('rut', '')
        area = validated_data.pop('area', '')
        ocupacion = validated_data.pop('ocupacion', '')
        foto = validated_data.pop('foto', None)
        password = validated_data.pop('password', None)
        
        user = User(**validated_data)
        if password: user.set_password(password)
        else: user.set_unusable_password()
        user.save()

        perfil = user.perfil
        perfil.rut = rut
        perfil.area = area
        perfil.ocupacion = ocupacion
        if foto: perfil.foto = foto
        perfil.save()
        return user

    def update(self, instance, validated_data):
        rut = validated_data.pop('rut', None)
        area = validated_data.pop('area', None)
        ocupacion = validated_data.pop('ocupacion', None)
        foto = validated_data.pop('foto', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password: instance.set_password(password)
        instance.save()

        perfil = instance.perfil
        if rut is not None: perfil.rut = rut
        if area is not None: perfil.area = area
        if ocupacion is not None: perfil.ocupacion = ocupacion
        if foto is not None: perfil.foto = foto
        perfil.save()
        return instance
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if hasattr(instance, 'perfil'):
            representation['rut'] = instance.perfil.rut
            representation['area'] = instance.perfil.area
            representation['ocupacion'] = instance.perfil.ocupacion
        return representation

# --- Serializer de Reservas ---
class ReservaSerializer(serializers.ModelSerializer):
    # Ahora equipo_data incluye garantía y factura para el calendario
    equipo_data = EquipoSimpleSerializer(source='equipo', read_only=True) 
    usuario_data = UsuarioSerializer(source='usuario_solicitante', read_only=True)
    equipo_id = serializers.PrimaryKeyRelatedField(queryset=Equipos.objects.all(), source='equipo', write_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='usuario_solicitante', write_only=True, required=False)
    class Meta: model = Reserva; fields = ['id', 'fecha_inicio', 'fecha_fin', 'motivo', 'equipo_data', 'usuario_data', 'equipo_id', 'usuario_id']
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and 'usuario_solicitante' not in validated_data:
            validated_data['usuario_solicitante'] = request.user
        return super().create(validated_data)

# --- Serializer de Auditoría ---
class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    class Meta: model = RegistroAuditoria; fields = ['id', 'usuario_nombre', 'accion', 'modelo_afectado', 'detalle', 'fecha']
    def get_usuario_nombre(self, obj):
        return obj.usuario.username if obj.usuario else "Usuario Eliminado / Sistema"

# --- Serializer de Actividades ---
class ActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = '__all__'

# --- Serializer adaptado para endpoints de tareas ---
class TareaSerializer(serializers.Serializer):
    # Nota: Este serializador no tiene un campo 'equipo'
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    due_time = serializers.TimeField(required=False, allow_null=True)
    due_datetime = serializers.DateTimeField(required=False, allow_null=True)
    is_important = serializers.BooleanField(required=False, default=False)
    status = serializers.ChoiceField(choices=['pending', 'completed'], default='pending')
    assigned_user_id = serializers.IntegerField()

    def create(self, validated_data):
        user_id = validated_data.get('assigned_user_id')
        user = User.objects.get(pk=user_id)
        etiqueta = 'urgente' if validated_data.get('is_important') else ('hecho' if validated_data.get('status') == 'completed' else 'pendiente')
        dt = validated_data.get('due_datetime')
        if dt is None:
            dd = validated_data.get('due_date')
            tt = validated_data.get('due_time') or '09:00:00'
            if dd:
                dt_str = f"{dd}T{tt}"
                dt_parsed = parse_datetime(dt_str)
                if dt_parsed is not None and timezone.is_naive(dt_parsed):
                    dt = timezone.make_aware(dt_parsed, timezone.get_current_timezone())
                else:
                    dt = dt_parsed
        actividad = Actividad.objects.create(
            titulo=validated_data.get('title'),
            descripcion=validated_data.get('description', ''),
            tipo='tarea',
            etiqueta=etiqueta,
            usuario=user,
            due_datetime=dt
        )
        return actividad

    def to_representation(self, instance):
        dd_iso = instance.due_datetime.isoformat() if instance.due_datetime else None
        due_date = None
        due_time = None
        if instance.due_datetime:
            due_date = instance.due_datetime.date().isoformat()
            due_time = instance.due_datetime.time().strftime('%H:%M:%S')
        return {
            'id': instance.id,
            'title': instance.titulo,
            'description': instance.descripcion,
            'due_datetime': dd_iso,
            'due_date': due_date,
            'due_time': due_time,
            'is_important': instance.etiqueta == 'urgente',
            'status': 'completed' if instance.etiqueta == 'hecho' else 'pending',
            'assigned_user_id': instance.usuario_id,
            'completed_at': instance.completed_at
        }

# ==============================================================================
# SERIALIZER DE INSUMOS
# ==============================================================================
class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = '__all__'
