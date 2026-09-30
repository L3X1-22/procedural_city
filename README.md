# Procedural City Generator

Sistema procedural para generar ciudades a partir de una descripción abstracta de su infraestructura urbana.

La idea central es separar el problema en varias etapas:

```text
PLANIFICAR → DISEÑAR → CONSTRUIR → ENSAMBLAR → DECORAR
```

El sistema no intenta generar una ciudad completa en un único algoritmo. Cada etapa transforma una descripción estructurada en una descripción más concreta, hasta terminar con una ciudad 3D lista para ser utilizada en un videojuego.

---

# Arquitectura general

```text
                         ┌──────────────────────┐
                         │       PASO 0         │
                         │    PLANIFICACIÓN     │
                         │                      │
                         │ calles + manzanas   │
                         │ distritos + seeds    │
                         │ atributos + influencias
                         └──────────┬───────────┘
                                    │
                              city_plan.json
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       PASO 1         │
                         │     CONSTRUCCIÓN     │
                         │                      │
                         │ qué edificios deben │
                         │ existir y dónde      │
                         └──────────┬───────────┘
                                    │
                            construction.json
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       PASO 2         │
                         │     FABRICACIÓN      │
                         │                      │
                         │       Blender        │
                         │ genera los assets    │
                         └──────────┬───────────┘
                                    │
                              generated assets
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       PASO 3         │
                         │     ENSAMBLADO       │
                         │                      │
                         │        Unity         │
                         │ coloca y organiza    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       PASO 4         │
                         │ "TRABAJEN, VAGOS"    │
                         │                      │
                         │ decoración, vida,    │
                         │ detalles y polish    │
                         └──────────────────────┘
```

Cada etapa debe tener una entrada y una salida claramente definidas.

La regla fundamental del proyecto es:

> **Una etapa decide qué debe existir. La siguiente decide cómo materializarlo.**

---

# Paso 0 — Herramientas para POT

## Plan de Ordenamiento Territorial™ (no, no se está volviendo político)

El Paso 0 define **la estructura urbana de la ciudad**.

Todavía no existen edificios.

Existe únicamente la información necesaria para describir:

* calles;
* intersecciones;
* manzanas;
* zonas;
* atributos urbanos;
* distritos;
* influencias;
* restricciones.

El resultado de este paso es un archivo que funciona como los "planos" de la ciudad.

```text
graph
   ↓
geometric graph
   ↓
blocks
   ↓
district attributes
   ↓
influence fields
   ↓
city_plan.json
```

## 0.1 Grafo abstracto

Python genera inicialmente un grafo:

```text
V = vertices
E = edges
```

Los vértices representan intersecciones.

Las aristas representan conexiones entre intersecciones.

En esta fase el grafo no necesita tener coordenadas.

Ejemplo:

```json
{
  "vertices": [
    { "id": 0 },
    { "id": 1 },
    { "id": 2 }
  ],
  "edges": [
    { "id": 0, "from": 0, "to": 1 },
    { "id": 1, "from": 1, "to": 2 }
  ]
}
```

La topología y la geometría se mantienen separadas.

---

## 0.2 Geometría de las calles

La herramienta web permite convertir el grafo abstracto en una representación geométrica.

Cada vértice recibe:

```json
{
  "id": 0,
  "position": [120.5, -43.2]
}
```

Las coordenadas están expresadas en metros respecto al origen:

```text
(0, 0)
```

La ciudad se centra alrededor de ese origen.

La geometría puede modificarse manualmente o mediante generación automática hasta obtener una distribución satisfactoria.

El grafo puede tener múltiples embeddings geométricos sin cambiar su topología.

```text
mismo grafo
     │
     ├── embedding A
     ├── embedding B
     ├── embedding C
     └── embedding D
```

---

## 0.3 Propiedades de las calles

Cada arista puede recibir propiedades como:

```json
{
  "id": 17,
  "from": 4,
  "to": 9,
  "lanes": 2
}
```

Inicialmente se contemplan:

* número de carriles;
* longitud;
* ancho;
* importancia;
* tipo de vía.

La longitud debe poder recalcularse a partir de la geometría.

---

## 0.4 Detección de manzanas

A partir del grafo planar se detectan las caras del grafo.

Estas caras son candidatas a convertirse en manzanas.

```text
┌───────┬───────┐
│       │       │
│   A   │   B   │
│       │       │
├───────┼───────┤
│       │       │
│   C   │   D   │
│       │       │
└───────┴───────┘
```

La detección automática no tiene por qué acertar siempre.

Por ello, la herramienta debe permitir:

* aceptar una cara como manzana;
* rechazarla;
* fusionar manzanas;
* dividir manzanas;
* cambiar manualmente sus límites.

Cada manzana recibe un ID estable.

---

## 0.5 Atributos urbanos

Las manzanas pueden recibir atributos normalizados entre `0` y `1`.

Ejemplo:

```json
{
  "wealth": 0.72,
  "density": 0.81,
  "age": 0.43
}
```

La interfaz utiliza sliders para editar estos valores.

Los atributos se mantendrán deliberadamente genéricos para permitir que el sistema evolucione.

Ejemplos futuros:

```text
wealth
density
age
commercial
residential
industrial
tourism
crime
maintenance
traffic
population
```

---

## 0.6 Atributos estéticos

Las características estéticas se mantienen separadas de los atributos físicos/sociales.

Ejemplo:

```json
{
  "aesthetic": {
    "suburban": 0.72,
    "modern": 0.31,
    "chinatown": 0.83,
    "business": 0.14
  }
}
```

Todos los valores continúan normalizados entre `0` y `1`.

---

## 0.7 Manzanas semilla

El diseñador puede seleccionar determinadas manzanas como semillas.

Una seed define una influencia.

Ejemplo:

```json
{
  "block": 42,
  "radius": 200,
  "strength": 1.0,
  "properties": {
    "wealth": 0.5
  },
  "aesthetic": {
    "chinatown": 1.0
  }
}
```

La influencia se propaga hacia las manzanas cercanas.

Varias seeds pueden afectar simultáneamente una misma manzana.

Por ejemplo:

```text
wealth       = 0.73
density      = 0.81
chinatown    = 0.62
business     = 0.47
suburban     = 0.09
```

---

## 0.8 Mapa de influencia

La herramienta visualiza los resultados mediante un mapa de calor.

Cada manzana puede colorearse según:

* una propiedad;
* una influencia;
* un atributo;
* una combinación de atributos.

El diseñador puede modificar las seeds y regenerar el mapa hasta obtener la distribución deseada.

Cuando se acepta el resultado, se genera:

```text
city_plan.json
```

Este archivo constituye la salida final del Paso 0.

---

# Paso 1 — Herramientas para construcción

El Paso 1 toma los planos urbanos y responde:

> **"¿Qué demonios vamos a construir aquí?"**

No genera todavía la geometría final.

Genera **planes de construcción**.

Entrada:

```text
city_plan.json
```

Salida:

```text
construction.json
```

---

## 1.1 Parcelación

Cada manzana se subdivide en parcelas.

```text
┌───────────────────────────┐
│     │          │          │
│  A  │     B    │    C     │
│     │          │          │
├─────┴──────────┴──────────┤
│             D             │
└───────────────────────────┘
```

Cada parcela recibe características derivadas de:

* la manzana;
* las calles cercanas;
* las propiedades del terreno;
* las reglas urbanas;
* las semillas;
* la geometría de la parcela.

---

## 1.2 Selección del tipo de construcción

El generador decide qué debe existir en cada parcela.

Ejemplos:

```text
house
apartment
office
shop
warehouse
factory
school
hospital
parking
park
```

El sistema no está limitado a viviendas.

La decisión se basa en los atributos calculados durante el Paso 0.

Ejemplo:

```text
wealth       = 0.82
density      = 0.91
commercial   = 0.73
business     = 0.81
```

Podría producir:

```text
office building
```

Mientras:

```text
wealth       = 0.31
density      = 0.42
residential  = 0.87
suburban     = 0.81
```

podría producir:

```text
house
```

---

## 1.3 Blueprint de construcción

Cada construcción se describe mediante un blueprint.

Ejemplo:

```json
{
  "id": "building_001",
  "type": "house",

  "position": [125.4, 82.1],
  "rotation": 90,

  "width": 11.2,
  "depth": 18.3,
  "floors": 2,

  "wealth": 0.54,
  "age": 0.32,

  "aesthetic": {
    "suburban": 0.81,
    "modern": 0.24
  },

  "seed": 918273
}
```

El Paso 1 produce cientos o miles de estas definiciones.

---

## 1.4 Salida

Ejemplo conceptual:

```json
{
  "buildings": [
    {
      "id": "house_001",
      "type": "house",
      "blueprint": {}
    },
    {
      "id": "building_001",
      "type": "apartment",
      "blueprint": {}
    },
    {
      "id": "shop_001",
      "type": "commercial",
      "blueprint": {}
    }
  ]
}
```

En otras palabras:

> **Paso 0 decide dónde y qué tipo de ciudad tenemos.**

> **Paso 1 decide qué cosas concretas necesitamos construir.**

---

# Paso 2 — Construcción

Ahora sí:

## Blender, haz tu magia.

El Paso 2 recibe los blueprints generados durante el Paso 1.

```text
construction.json
       ↓
Blender
       ↓
generated assets
```

Blender no debería tomar decisiones urbanísticas.

Su responsabilidad es:

> **"Me dijeron que aquí debe existir un edificio de apartamentos de 7 pisos, de determinada estética y edad. Lo construyo."**

---

## 2.1 Biblioteca de componentes

El generador de Blender utiliza una biblioteca de piezas:

```text
assets/
├── walls/
├── windows/
├── doors/
├── roofs/
├── balconies/
├── stairs/
├── decorations/
└── materials/
```

Cada componente puede tener metadata:

```text
type
wealth
age
aesthetic
scale
compatible_buildings
```

---

## 2.2 Generación procedural

Blender combina las piezas según el blueprint.

Ejemplo:

```text
House
 ├── foundation
 ├── walls
 ├── windows
 ├── doors
 ├── roof
 └── decoration
```

La selección de componentes puede depender de:

```text
wealth
age
aesthetic
building type
random seed
```

Por lo tanto, dos edificios con el mismo tipo pueden ser diferentes.

---

## 2.3 Materiales y geometría

El generador puede encargarse de:

* geometría;
* materiales;
* UV;
* texturas;
* normal maps;
* roughness;
* displacement cuando sea necesario;
* detalles de fachada;
* modificaciones de malla;
* LODs.

El objetivo es que un blueprint abstracto termine convertido en un asset 3D utilizable.

---

## 2.4 Salida

Por ejemplo:

```text
generated/
├── house_001.glb
├── apartment_001.glb
├── shop_001.glb
├── warehouse_001.glb
└── office_001.glb
```

Estos assets quedan disponibles para Unity.

---

# Paso 3 — Ensamblado de ciudad

Ahora entra Unity.

Unity recibe:

```text
city_plan.json
construction.json
generated assets
```

y responde:

> **"Perfecto, yo acomodo esta mierda."**

---

## 3.1 Importación

Unity importa los assets generados y los relaciona con sus IDs.

```text
building_001
      ↓
apartment_001.glb
```

---

## 3.2 Posicionamiento

Cada objeto se coloca según el blueprint:

```text
position
rotation
scale
```

La ciudad pasa de:

```text
JSON
```

a:

```text
GameObjects
Meshes
Materials
Prefabs
```

---

## 3.3 Calles

Unity genera o instancia la infraestructura vial:

* geometría de calles;
* aceras;
* intersecciones;
* bordillos;
* señalización básica.

---

## 3.4 Optimización

Esta etapa también será responsable de preparar la ciudad para funcionar como un entorno de videojuego.

Se contemplan:

* LOD;
* GPU instancing;
* batching;
* culling;
* streaming;
* división por sectores;
* generación de colliders;
* navegación.

El objetivo es que la ciudad generada no solamente exista, sino que pueda **ejecutarse**.

---

# Paso 4 — Trabajen, vagos

También conocido como:

> **"Ya hice que la ciudad exista. Ahora alguien tiene que hacer que parezca una ciudad."**

La generación procedural proporciona la estructura.

Los humanos hacen el polish.

---

## 4.1 Vegetación

Añadir:

* árboles;
* arbustos;
* césped;
* plantas;
* jardines;
* macetas;
* vegetación urbana;
* vegetación específica de cada zona.

---

## 4.2 Infraestructura urbana

Añadir:

* semáforos;
* señales;
* postes;
* farolas;
* hidrantes;
* cámaras;
* contenedores;
* parquímetros;
* mobiliario urbano.

---

## 4.3 Props

Añadir:

* bicicletas;
* motos;
* vehículos;
* basura;
* cajas;
* carteles;
* anuncios;
* máquinas expendedoras;
* mesas;
* sillas;
* objetos abandonados;
* decoración.

---

## 4.4 Identidad de los barrios

Aquí el equipo puede intervenir manualmente.

Por ejemplo:

```text
"Esta esquina necesita un restaurante."

"Este edificio debería tener un cartel enorme."

"Aquí debería haber un callejón."

"Esta zona se ve demasiado limpia."

"Este parque necesita árboles."

"Este barrio necesita más cables."
```

El generador proporciona la base.

Los humanos hacen que deje de parecer una demostración técnica.

---

## 4.5 Vida

Finalmente se añaden los sistemas que hacen que la ciudad parezca habitada:

* peatones;
* tráfico;
* transporte público;
* horarios;
* luces;
* comercios;
* actividad nocturna;
* eventos;
* sonidos;
* animales;
* NPCs;
* rutinas.

La ciudad deja de ser:

```text
una colección de edificios
```

y se convierte en:

```text
un lugar.
```

---

# Flujo completo

Una ciudad completa debería poder generarse siguiendo este pipeline:

```text
                 GRAPH
                   │
                   ▼
        ┌─────────────────────┐
        │       PASO 0        │
        │     PLANIFICACIÓN   │
        └──────────┬──────────┘
                   │
             city_plan.json
                   │
                   ▼
        ┌─────────────────────┐
        │       PASO 1        │
        │     CONSTRUCCIÓN    │
        └──────────┬──────────┘
                   │
           construction.json
                   │
                   ▼
        ┌─────────────────────┐
        │       PASO 2        │
        │      BLENDER        │
        └──────────┬──────────┘
                   │
              3D assets
                   │
                   ▼
        ┌─────────────────────┐
        │       PASO 3        │
        │       UNITY         │
        └──────────┬──────────┘
                   │
             assembled city
                   │
                   ▼
        ┌─────────────────────┐
        │       PASO 4        │
        │       HUMAN         │
        │      POLISH™        │
        └──────────┬──────────┘
                   │
                   ▼
              FINAL CITY
```

---

# Principios del proyecto

## 1. Datos antes que geometría

La ciudad debe poder existir como datos independientemente de Unity o Blender.

```text
city_plan.json
```

es más importante que:

```text
city.unity
```

---

## 2. Separación de responsabilidades

### Python

Genera y procesa información.

### Web editor

Permite al diseñador editar esa información.

### Blender

Convierte blueprints en geometría.

### Unity

Ensambla, visualiza y ejecuta la ciudad.

### Humanos

Corrigen, decoran y aportan intención artística.

---

## 3. Determinismo

La generación debe utilizar seeds.

```text
seed = 918273
```

El mismo input + la misma seed debería producir el mismo resultado.

Esto permite reproducibilidad y debugging.

---

## 4. Generación incremental

No se debe regenerar todo cuando cambia una sola cosa.

Si solamente cambia:

```text
building_042
```

el sistema debería poder regenerar solamente:

```text
building_042
```

y conservar el resto.

---

## 5. Los archivos intermedios son parte del sistema

Los JSON generados no son basura temporal.

Son artefactos importantes:

```text
graph.json
      ↓
city_plan.json
      ↓
construction.json
      ↓
generated assets
```

Esto permite inspeccionar, modificar y regenerar cualquier etapa.

---

# Estado objetivo

El objetivo final del proyecto es que el flujo de creación pueda aproximarse a:

```text
1. Crear/generar grafo.
2. Ajustar calles.
3. Seleccionar manzanas semilla.
4. Definir características de la ciudad.
5. Pulsar GENERATE.
6. Esperar mientras la máquina se sacrifica por la patria.
7. Unity recibe la ciudad.
8. Los humanos hacen el polish.
9. Listo.
```

La intervención humana se concentra deliberadamente en las partes donde aporta más valor:

```text
                 ALGORITMO
                     │
          ┌──────────┴──────────┐
          │                     │
       estructura             variación
          │                     │
          └──────────┬──────────┘
                     │
                  HUMANOS
                     │
                 intención
                 narrativa
                 detalle
                 identidad
```

La meta no es eliminar al artista.

La meta es evitar que el artista tenga que colocar **4.000 edificios a mano**.

---

# Roadmap resumido

| Paso | Nombre                         | Entrada             | Salida              |
| ---- | ------------------------------ | ------------------- | ------------------- |
| 0    | Herramientas para POT          | Grafo               | `city_plan.json`    |
| 1    | Herramientas para construcción | `city_plan.json`    | `construction.json` |
| 2    | Construcción                   | `construction.json` | Assets 3D           |
| 3    | Ensamblado                     | Assets + JSON       | Ciudad en Unity     |
| 4    | Trabajen, vagos                | Ciudad ensamblada   | Ciudad final        |

---

# Tecnologías previstas

```text
Python
├── NumPy
├── SciPy
├── Shapely
└── NetworkX

Web Editor
├── HTML
├── JavaScript
├── CSS
└── SVG / Canvas

3D Generation
└── Blender Python API

Game Engine
└── Unity + C#

Data
└── JSON

Version Control
└── Git
```

El stack podrá cambiar durante el desarrollo.

Los formatos de datos y las interfaces entre etapas deberían cambiar lo menos posible.

---

# Filosofía

El proyecto parte de una idea sencilla:

> **No modelar una ciudad. Modelar las reglas que permiten construir una ciudad.**

Una ciudad final será el resultado de miles de pequeñas decisiones procedurales:

```text
¿Dónde hay una calle?
        ↓
¿Dónde hay una manzana?
        ↓
¿Qué caracteriza esta zona?
        ↓
¿Qué tipo de parcela corresponde?
        ↓
¿Qué edificio debería existir?
        ↓
¿Cómo se construye?
        ↓
¿Cómo se coloca?
        ↓
¿Qué detalles necesita?
        ↓
¿Qué hace que parezca habitado?
```

El objetivo del proyecto es convertir toda esa cadena en un pipeline reproducible, editable y automatizable.

Y, cuando todo funcione:

**dos clicks, CPU al 100%, ventiladores a velocidad de despegue y una ciudad nueva apareciendo delante de nosotros.**