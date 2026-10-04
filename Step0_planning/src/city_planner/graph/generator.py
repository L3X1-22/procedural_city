import json
import math
import random
from pathlib import Path

N = 10
SPACING = 100
JITTER = 10
ROTATION = 45
SIDE_OFFSET = 300
MIN_DISTANCE = 0.8

OUT = Path(__file__).resolve().parents[3] / "outputs" / "generated_graph.json"


def generate(n):
    grids = [(0, 0, 0)]
    side = N * SPACING

    for _ in range(n - 1):
        px, py, prev_angle = grids[-1]

        for _ in range(100):
            direction = random.randrange(4)
            angle = prev_angle + direction * math.pi / 2
            offset = random.uniform(-SIDE_OFFSET, SIDE_OFFSET)

            x = px + math.cos(angle) * side
            y = py + math.sin(angle) * side

            x += math.cos(angle + math.pi / 2) * offset
            y += math.sin(angle + math.pi / 2) * offset

            if all(
                math.hypot(x - gx, y - gy) >= side * MIN_DISTANCE
                for gx, gy, _ in grids
            ):
                rotation = math.radians(
                    random.uniform(-ROTATION, ROTATION)
                )
                grids.append((x, y, rotation))
                break
        else:
            raise RuntimeError("No se encontró una posición válida.")

    vertices, edges, positions = [], [], {}
    vid = 0
    width = (N - 1) * SPACING

    for cx, cy, angle in grids:
        c, s = math.cos(angle), math.sin(angle)
        ids = []

        for y in range(N):
            for x in range(N):
                ids.append(vid)
                vertices.append(vid)

                lx = x * SPACING - width / 2 + random.uniform(-JITTER, JITTER)
                ly = y * SPACING - width / 2 + random.uniform(-JITTER, JITTER)

                positions[str(vid)] = [
                    cx + lx * c - ly * s,
                    cy + lx * s + ly * c,
                ]

                vid += 1

        for y in range(N):
            for x in range(N):
                i = y * N + x
                if x:
                    edges.append([ids[i - 1], ids[i]])
                if y:
                    edges.append([ids[i - N], ids[i]])

    return {
        "vertices": vertices,
        "edges": edges,
        "positions": positions,
    }


count = int(input("¿Cuántas cuadrículas?: "))
graph = generate(count)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(graph, indent=2), encoding="utf-8")

print(f"Grafo generado en: {OUT}")