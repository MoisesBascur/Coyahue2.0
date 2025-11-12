from rest_framework import serializers
from django.contrib.auth.models import User 
from .models import Perfil, Equipos, TiposDeEquipo, Estados, Reserva, Proveedores, RegistroAuditoria, Actividad

# --- Serializers Auxiliares ---
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta: model = User; fields = ['id', 'username', 'email']
class TipoEquipoSerializer(serializers.ModelSerializer):
    class Meta: model = TiposDeEquipo; fields = ['id', 'nombre_tipo']
class EstadoSerializer(serializers.ModelSerializer):
    class Meta: model = Estados; fields = ['id', 'nombre_estado']
class ProveedorSerializer(serializers.ModelSerializer):
    class Meta: model = Proveedores; fields = ['id', 'nombre_proveedor']
class EquipoSimpleSerializer(serializers.ModelSerializer):
    class Meta: model = Equipos; fields = ['id', 'marca', 'modelo', 'nro_serie']

# --- Serializer de Equipos ---
class EquipoSerializer(serializers.ModelSerializer):
    id_tipo_equipo = TipoEquipoSerializer(read_only=True, allow_null=True)
    id_estado = EstadoSerializer(read_only=True, allow_null=True)
    id_proveedor = ProveedorSerializer(read_only=True, allow_null=True)
    id_usuario_responsable = UsuarioSerializer(read_only=True, allow_null=True) 
    
    tipo_id = serializers.PrimaryKeyRelatedField(queryset=TiposDeEquipo.objects.all(), source='id_tipo_equipo', write_only=True)
    estado_id = serializers.PrimaryKeyRelatedField(queryset=Estados.objects.all(), source='id_estado', write_only=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(queryset=Proveedores.objects.all(), source='id_proveedor', write_only=True, allow_null=True, required=False)
    usuario_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='id_usuario_responsable', write_only=True, allow_null=True, required=False)
    factura = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Equipos
        fields = ['id', 'nro_serie', 'marca', 'modelo', 'fecha_compra', 'rut_asociado', 'procesador', 'ram', 'almacenamiento', 'factura', 'id_tipo_equipo', 'id_estado', 'id_proveedor', 'id_usuario_responsable', 'tipo_id', 'estado_id', 'proveedor_id', 'usuario_id']

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
        fields = ['username', 'email', 'nombres', 'apellidos', 'perfil', 'equipos_asignados', 'es_admin']

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

# --- ESTO ES LO QUE FALTABA: SERIALIZER DE ACTIVIDADES ---
class ActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actividad
        fields = '__all__'