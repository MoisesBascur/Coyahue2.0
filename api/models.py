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
    
    class Meta:
        ordering = ['id']
        
class Estados(models.Model):
    """Catálogo de estados del ciclo de vida (ej: Activo, En Mantención, De Baja)."""
    nombre_estado = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre_estado
    
    class Meta:
        ordering = ['id']

class Proveedores(models.Model):
    """Registro de empresas proveedoras para trazabilidad de compras."""
    nombre_proveedor = models.CharField(max_length=255)
    def __str__(self): return self.nombre_proveedor
    
    #nuevo
    class Meta:
        ordering = ['id']

class Sucursal(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self): return self.nombre
    class Meta:
        ordering = ['id']

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
    due_datetime = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Usuario al que se le asigna o que creó la actividad
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.tipo}: {self.titulo}"

# ==============================================================================
# 3. GESTIÓN DE USUARIOS
# ==============================================================================

class Perfil(models.Model):
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
    nro_serie = models.CharField(max_length=255, unique=True)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    fecha_compra = models.DateField(null=True, blank=True)
    warranty_end_date = models.DateField(null=True, blank=True)
    rut_asociado = models.CharField(max_length=20, blank=True, null=True)
    
    procesador = models.CharField(max_length=100, blank=True, null=True)
    ram = models.CharField(max_length=50, blank=True, null=True)
    almacenamiento = models.CharField(max_length=100, blank=True, null=True)
    
    factura = models.FileField(upload_to='facturas_equipos/', null=True, blank=True)

    id_tipo_equipo = models.ForeignKey(TiposDeEquipo, on_delete=models.SET_NULL, null=True, blank=True)
    id_estado = models.ForeignKey(Estados, on_delete=models.SET_NULL, null=True, blank=True)
    id_usuario_responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    id_proveedor = models.ForeignKey(Proveedores, on_delete=models.SET_NULL, null=True, blank=True)
    id_sucursal = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.nro_serie})"

# ==============================================================================
# 5. OPERACIONES Y AUDITORÍA
# ==============================================================================

class Reserva(models.Model):
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

# ==============================================================================
# 7. GESTIÓN DE INSUMOS (NUEVO)
# ==============================================================================

class Insumo(models.Model):
    """Gestión de stock de insumos (toners, cables, repuestos)."""
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=5) # Gatillo para alertas
    
    unidad_medida = models.CharField(max_length=20, default='Unidad') # Ej: Caja, Unidad, Litro
    ubicacion = models.CharField(max_length=100, blank=True, null=True) # Ej: Bodega 1, Estante B
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} (Stock: {self.stock_actual})"

    class Meta:
        ordering = ['nombre']


