import json
import random
from pathlib import Path


OUTPUT_PATH = Path(__file__).resolve().parents[3] / "outputs" / "generated_graph.json"


def generate_graph(num_vertices: int) -> dict:
    vertices = list(range(num_vertices))
    edges = []

    for vertex in vertices:
        for other in range(vertex + 1, num_vertices):
            if random.choice([True, False]):
                edges.append([vertex, other])

    return {
        "vertices": vertices,
        "edges": edges,
    }


def main():
    num_vertices = int(input("Número de vértices: "))

    graph = generate_graph(num_vertices)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(graph, file, indent=2)

    print(f"Grafo generado en: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()