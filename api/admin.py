from django.contrib import admin
# 1. Importa todos tus modelos
from .models import Equipos, TiposDeEquipo, Estados, Proveedores, Perfil 

# Registra los modelos para que aparezcan en el admin
admin.site.register(Equipos)
admin.site.register(TiposDeEquipo)
admin.site.register(Estados)
admin.site.register(Proveedores)
admin.site.register(Perfil) # <-- 2. Registra el nuevo modelo Perfil