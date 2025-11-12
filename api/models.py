from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# --- NUEVO MODELO DE PERFIL ---
class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    rut = models.CharField(max_length=20, blank=True, null=True)
    area = models.CharField(max_length=100, blank=True, null=True)
    ocupacion = models.CharField(max_length=100, blank=True, null=True)
    foto = models.ImageField(upload_to='perfil_fotos/', null=True, blank=True)

    def __str__(self):
        return self.user.username

@receiver(post_save, sender=User)
def crear_o_actualizar_perfil_de_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(user=instance)
    instance.perfil.save()

# --- TUS OTROS MODELOS ---
class TiposDeEquipo(models.Model):
    nombre_tipo = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nombre_tipo

class Estados(models.Model):
    nombre_estado = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nombre_estado

class Proveedores(models.Model):
    nombre_proveedor = models.CharField(max_length=255)
    def __str__(self):
        return self.nombre_proveedor

class Equipos(models.Model):
    nro_serie = models.CharField(max_length=255, unique=True)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    fecha_compra = models.DateField(null=True, blank=True)
    rut_asociado = models.CharField(max_length=20, blank=True, null=True) 
    
    id_tipo_equipo = models.ForeignKey(TiposDeEquipo, on_delete=models.SET_NULL, null=True, blank=True)
    id_estado = models.ForeignKey(Estados, on_delete=models.SET_NULL, null=True, blank=True)
    id_usuario_responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) 
    id_proveedor = models.ForeignKey(Proveedores, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.nro_serie})"

# --- NUEVO MODELO: RESERVAS ---
class Reserva(models.Model):
    equipo = models.ForeignKey(Equipos, on_delete=models.CASCADE)
    usuario_solicitante = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    motivo = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Reserva: {self.equipo} por {self.usuario_solicitante}"