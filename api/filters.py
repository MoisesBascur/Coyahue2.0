import django_filters
from .models import Equipos

class EquipoFilter(django_filters.FilterSet):
    # 1. Filtro por Tipo de Equipo (Busca por ID)
    tipo = django_filters.NumberFilter(
        field_name='id_tipo_equipo__id', 
        lookup_expr='exact'
    )
    
    # 2. Filtro por Estado (Busca por ID)
    estado = django_filters.NumberFilter(
        field_name='id_estado__id', 
        lookup_expr='exact'
    )
    
    # 3. Filtro por Rango de Fecha de Compra (Mayor o igual a)
    fecha_compra_min = django_filters.DateFilter(
        field_name='fecha_compra', 
        lookup_expr='gte' # greater than or equal
    )
    
    # 4. Filtro por Rango de Fecha de Compra (Menor o igual a)
    fecha_compra_max = django_filters.DateFilter(
        field_name='fecha_compra', 
        lookup_expr='lte' # less than or equal
    )

    class Meta:
        model = Equipos
        fields = [
            'tipo', 
            'estado', 
            'fecha_compra_min', 
            'fecha_compra_max',
            # Filtros existentes que el cliente mencionó
            # 'id_usuario_responsable__email', 
            # 'id_sucursal__nombre', 
            # 'nro_serie',
        ]