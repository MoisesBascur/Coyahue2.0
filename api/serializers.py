from rest_framework import serializers
from django.contrib.auth.models import User 
from .models import Perfil, Equipos, TiposDeEquipo, Estados, Reserva # Importar Reserva

# --- Serializers Auxiliares ---
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TipoEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TiposDeEquipo
        fields = ['nombre_tipo']

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estados
        fields = ['nombre_estado']

class EquipoSimpleSerializer(serializers.ModelSerializer):
    # Versión simplificada del equipo para mostrar en la reserva
    class Meta:
        model = Equipos
        fields = ['id', 'marca', 'modelo', 'nro_serie']

# --- Serializer de Equipos ---
class EquipoSerializer(serializers.ModelSerializer):
    id_tipo_equipo = TipoEquipoSerializer(read_only=True, allow_null=True)
    id_estado = EstadoSerializer(read_only=True, allow_null=True)
    id_usuario_responsable = UsuarioSerializer(read_only=True, allow_null=True) 
    
    # Campo de escritura para asignar usuario (lo mantuvimos del paso anterior)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='id_usuario_responsable', write_only=True, allow_null=True
    )

    class Meta:
        model = Equipos
        fields = [
            'id', 'nro_serie', 'marca', 'modelo', 'fecha_compra',
            'rut_asociado', 'id_tipo_equipo', 'id_estado', 'id_usuario_responsable', 'usuario_id'
        ]

# --- Serializers de Perfil y Usuario ---
class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['rut', 'area', 'ocupacion', 'foto']

class UserPerfilSerializer(serializers.ModelSerializer):
    perfil = PerfilSerializer()
    nombres = serializers.CharField(source='first_name')
    apellidos = serializers.CharField(source='last_name')
    class Meta:
        model = User
        fields = ['username', 'email', 'nombres', 'apellidos', 'perfil']

class UserManagementSerializer(serializers.ModelSerializer):
    perfil = PerfilSerializer()
    nombres = serializers.CharField(source='first_name')
    apellidos = serializers.CharField(source='last_name')
    rol = serializers.BooleanField(source='is_staff', default=False) 
    estado = serializers.BooleanField(source='is_active', default=True)
    ultimo_acceso = serializers.DateTimeField(source='last_login', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'nombres', 'apellidos', 'perfil', 'password', 'rol', 'estado', 'ultimo_acceso']
        extra_kwargs = {'password': {'write_only': True, 'required': True}}

    def create(self, validated_data):
        perfil_data = validated_data.pop('perfil')
        password = validated_data.pop('password')
        validated_data['first_name'] = validated_data.pop('nombres')
        validated_data['last_name'] = validated_data.pop('apellidos')
        user_rol = validated_data.pop('rol', False)
        user_estado = validated_data.pop('estado', True)
        user = User.objects.create_user(password=password, is_staff=user_rol, is_active=user_estado, **validated_data)
        Perfil.objects.filter(user=user).update(**perfil_data)
        return user

    def update(self, instance, validated_data):
        perfil_data = validated_data.pop('perfil', None)
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.is_staff = validated_data.get('rol', instance.is_staff)
        instance.is_active = validated_data.get('estado', instance.is_active)
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        instance.save() 
        if perfil_data:
            Perfil.objects.filter(user=instance).update(**perfil_data)
        return instance

# --- NUEVO: Serializer para Reservas ---
class ReservaSerializer(serializers.ModelSerializer):
    # Lectura: mostramos los objetos completos para que el calendario tenga datos
    equipo_data = EquipoSimpleSerializer(source='equipo', read_only=True)
    usuario_data = UsuarioSerializer(source='usuario_solicitante', read_only=True)

    # Escritura: usamos IDs
    equipo_id = serializers.PrimaryKeyRelatedField(
        queryset=Equipos.objects.all(), source='equipo', write_only=True
    )
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='usuario_solicitante', write_only=True, required=False
    )

    class Meta:
        model = Reserva
        fields = ['id', 'fecha_inicio', 'fecha_fin', 'motivo', 'equipo_data', 'usuario_data', 'equipo_id', 'usuario_id']
    
    def create(self, validated_data):
        # Asignar automáticamente el usuario que hace la petición si no se envía
        request = self.context.get('request')
        if request and hasattr(request, 'user') and 'usuario_solicitante' not in validated_data:
            validated_data['usuario_solicitante'] = request.user
        return super().create(validated_data)