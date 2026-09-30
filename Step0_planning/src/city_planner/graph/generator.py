import json
import random
from pathlib import Path


def edge_exists(edges: list[tuple[int, int]], a: int, b: int) -> bool:
    return (a, b) in edges or (b, a) in edges


def generate_graph(
    vertex_count: int,
    *,
    seed: int | None = None,
) -> tuple[list[int], list[tuple[int, int]]]:

    if vertex_count < 2:
        raise ValueError("El grafo necesita al menos 2 vértices.")

    rng = random.Random(seed)

    vertices = list(range(vertex_count))
    edges: list[tuple[int, int]] = []

    def add_edge(a: int, b: int) -> None:
        if a == b:
            return

        if edge_exists(edges, a, b):
            return

        edges.append((a, b))

    # ---------------------------------------------------------
    # Crear un grafo conectado.
    #
    # Cada nuevo vértice se conecta a uno existente.
    # Esto garantiza que todos los vértices pertenezcan
    # al mismo componente.
    # ---------------------------------------------------------

    for vertex in range(1, vertex_count):
        parent = rng.randrange(vertex)
        add_edge(parent, vertex)

    # ---------------------------------------------------------
    # Añadir algunas aristas adicionales para evitar que
    # el resultado sea simplemente un árbol.
    #
    # Seguimos trabajando exclusivamente con la topología.
    # ---------------------------------------------------------

    possible_edges = [
        (a, b)
        for a in vertices
        for b in range(a + 1, vertex_count)
        if not edge_exists(edges, a, b)
    ]

    rng.shuffle(possible_edges)

    # Añadimos aproximadamente una arista extra por cada
    # tres vértices.
    extra_edges = max(1, vertex_count // 3)

    for a, b in possible_edges[:extra_edges]:
        add_edge(a, b)

    return vertices, edges


def save_graph(
    vertices: list[int],
    edges: list[tuple[int, int]],
    output_path: Path,
) -> None:

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    data = {
        "vertices": vertices,
        "edges": [
            [a, b]
            for a, b in edges
        ],
    }

    with output_path.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            data,
            file,
            indent=2,
        )


def main() -> None:
    print("=== Procedural City - Graph Generator ===")
    print()

    vertex_count = int(
        input("¿Cuántos vértices quieres? ")
    )

    seed_input = input(
        "Seed (Enter para aleatoria): "
    ).strip()

    seed = (
        int(seed_input)
        if seed_input
        else None
    )

    vertices, edges = generate_graph(
        vertex_count,
        seed=seed,
    )

    project_root = Path(__file__).resolve().parents[3]

    output_path = (
        project_root
        / "outputs"
        / "generated_graph.json"
    )

    save_graph(
        vertices,
        edges,
        output_path,
    )

    print()
    print("=== Grafo generado ===")
    print(f"Vértices: {len(vertices)}")
    print(f"Aristas:  {len(edges)}")
    print()
    print(f"Guardado en:")
    print(output_path)


if __name__ == "__main__":
    main()