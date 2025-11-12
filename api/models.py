from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# ==============================================================================
# 1. TABLAS MAESTRAS (Catálogos)
# ==============================================================================

class TiposDeEquipo(models.Model):
    """Catálogo para clasificar hardware (ej: Notebook, Monitor, Impresora)."""
    nombre_tipo = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre_tipo

class Estados(models.Model):
    """Catálogo de estados del ciclo de vida (ej: Activo, En Mantención, De Baja)."""
    nombre_estado = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre_estado

class Proveedores(models.Model):
    """Registro de empresas proveedoras para trazabilidad de compras."""
    nombre_proveedor = models.CharField(max_length=255)
    def __str__(self): return self.nombre_proveedor



# ==============================================================================
# 2. Menu ACTIVIDADES
# ==============================================================================

class Actividad(models.Model):
    TIPOS = [
        ('tarea', 'Tarea'),
        ('notificacion', 'Notificación'),
        ('noticia', 'Noticia')
    ]
    
    ETIQUETAS = [
        ('urgente', 'Urgente'),
        ('hecho', 'Hecho'),
        ('pendiente', 'Por hacer'),
        ('info', 'Info') # Para noticias normales
    ]

    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS, default='tarea')
    etiqueta = models.CharField(max_length=20, choices=ETIQUETAS, default='pendiente')
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Usuario al que se le asigna o que creó la actividad
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.tipo}: {self.titulo}"



# ==============================================================================
# 3. GESTIÓN DE USUARIOS
# ==============================================================================

class Perfil(models.Model):
    """Extensión del usuario de Django con datos corporativos (RUT, Área, Foto)."""
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    rut = models.CharField(max_length=20, blank=True, null=True)
    area = models.CharField(max_length=100, blank=True, null=True)
    ocupacion = models.CharField(max_length=100, blank=True, null=True)
    foto = models.ImageField(upload_to='perfil_fotos/', null=True, blank=True)

    def __str__(self):
        return self.user.username


# ==============================================================================
# 4. INVENTARIO PRINCIPAL
# ==============================================================================

class Equipos(models.Model):
    """Ficha principal del activo tecnológico con specs y relaciones."""
    
    # Identificación
    nro_serie = models.CharField(max_length=255, unique=True)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    fecha_compra = models.DateField(null=True, blank=True)
    rut_asociado = models.CharField(max_length=20, blank=True, null=True)
    
    # Especificaciones Técnicas
    procesador = models.CharField(max_length=100, blank=True, null=True)
    ram = models.CharField(max_length=50, blank=True, null=True)
    almacenamiento = models.CharField(max_length=100, blank=True, null=True)
    
    # Documentación
    factura = models.FileField(upload_to='facturas_equipos/', null=True, blank=True)

    # Relaciones (Foreign Keys)
    id_tipo_equipo = models.ForeignKey(TiposDeEquipo, on_delete=models.SET_NULL, null=True, blank=True)
    id_estado = models.ForeignKey(Estados, on_delete=models.SET_NULL, null=True, blank=True)
    id_usuario_responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) 
    id_proveedor = models.ForeignKey(Proveedores, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.nro_serie})"


# ==============================================================================
# 5. OPERACIONES Y AUDITORÍA
# ==============================================================================

class Reserva(models.Model):
    """Registro de asignaciones temporales de equipos a usuarios."""
    equipo = models.ForeignKey(Equipos, on_delete=models.CASCADE)
    usuario_solicitante = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    motivo = models.CharField(max_length=255, blank=True, null=True)

class RegistroAuditoria(models.Model):
    """Bitácora automática de acciones (Crear/Editar/Eliminar) para seguridad."""
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=50)
    modelo_afectado = models.CharField(max_length=50)
    detalle = models.CharField(max_length=255, blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta: 
        ordering = ['-fecha']


# ==============================================================================
# 6. SEÑALES (Signals)
# ==============================================================================

@receiver(post_save, sender=User)
def crear_o_actualizar_perfil_de_usuario(sender, instance, created, **kwargs):
    """Automatización: Crea un Perfil vacío cada vez que se crea un User."""
    if created:
        Perfil.objects.create(user=instance)
    instance.perfil.save()


