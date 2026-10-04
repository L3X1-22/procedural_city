/*
 * ============================================================
 * GRAPH MODEL
 * ============================================================
 *
 * Aquí vive la estructura lógica de la ciudad.
 *
 * El grafo utiliza:
 *
 * vertices: [0, 1, 2, 3]
 *
 * edges:
 * [
 *     [0, 1],
 *     [1, 2]
 * ]
 *
 * positions:
 * {
 *     "0": [10.5, 20.3],
 *     "1": [15.2, 21.8]
 * }
 *
 * Las coordenadas son WORLD COORDINATES.
 * El zoom de la cámara no modifica estas coordenadas.
 */

export class GraphModel {

    constructor() {
        this.vertices = [];
        this.edges = [];
        this.positions = {};

        this.nextVertexId = 0;
    }


    /*
     * ========================================================
     * CARGAR
     * ========================================================
     */

    load(data) {
        this.vertices = [...data.vertices];

        this.edges = data.edges.map(
            ([from, to]) => [from, to],
        );

        this.positions = {};

        for (const vertex of this.vertices) {
            const position = data.positions[String(vertex)];

            this.positions[String(vertex)] = [
                Number(position[0]),
                Number(position[1]),
            ];
        }

        this.updateNextVertexId();

        this.validate();
    }


    /*
     * ========================================================
     * EXPORTAR
     * ========================================================
     */

    toJSON() {
        const positions = {};

        for (const vertex of this.vertices) {
            const position =
                this.positions[String(vertex)];

            positions[String(vertex)] = [
                position[0],
                position[1],
            ];
        }

        return {
            vertices: [...this.vertices],

            edges: this.edges.map(
                ([from, to]) => [from, to],
            ),

            positions,
        };
    }


    /*
     * ========================================================
     * CREAR VÉRTICE
     * ========================================================
     */

    addVertex(x, y) {
        const id = this.nextVertexId;

        this.vertices.push(id);

        this.positions[String(id)] = [
            x,
            y,
        ];

        this.nextVertexId += 1;

        return id;
    }


    /*
     * ========================================================
     * ELIMINAR VÉRTICE
     * ========================================================
     */

    deleteVertex(vertex) {
        if (!this.hasVertex(vertex)) {
            return false;
        }

        this.vertices = this.vertices.filter(
            (value) => value !== vertex,
        );

        delete this.positions[String(vertex)];

        /*
         * Eliminar automáticamente todas
         * las aristas conectadas.
         */

        this.edges = this.edges.filter(
            ([from, to]) =>
                from !== vertex
                && to !== vertex,
        );

        return true;
    }


    /*
     * ========================================================
     * MOVER VÉRTICE
     * ========================================================
     */

    setPosition(vertex, x, y) {
        if (!this.hasVertex(vertex)) {
            return false;
        }

        this.positions[String(vertex)] = [
            x,
            y,
        ];

        return true;
    }


    /*
     * ========================================================
     * OBTENER POSICIÓN
     * ========================================================
     */

    getPosition(vertex) {
        return this.positions[String(vertex)] ?? null;
    }


    /*
     * ========================================================
     * AÑADIR ARISTA
     * ========================================================
     */

    addEdge(from, to) {
        if (!this.hasVertex(from)) {
            return false;
        }

        if (!this.hasVertex(to)) {
            return false;
        }

        if (from === to) {
            return false;
        }

        if (this.hasEdge(from, to)) {
            return false;
        }

        this.edges.push([
            from,
            to,
        ]);

        return true;
    }


    /*
     * ========================================================
     * ELIMINAR ARISTA
     * ========================================================
     */

    deleteEdge(from, to) {
        const oldLength = this.edges.length;

        this.edges = this.edges.filter(
            ([edgeFrom, edgeTo]) =>
                !(
                    (
                        edgeFrom === from
                        && edgeTo === to
                    )
                    ||
                    (
                        edgeFrom === to
                        && edgeTo === from
                    )
                ),
        );

        return this.edges.length !== oldLength;
    }


    /*
     * ========================================================
     * COMPROBAR VÉRTICE
     * ========================================================
     */

    hasVertex(vertex) {
        return this.vertices.includes(vertex);
    }


    /*
     * ========================================================
     * COMPROBAR ARISTA
     * ========================================================
     */

    hasEdge(from, to) {
        return this.edges.some(
            ([edgeFrom, edgeTo]) =>
                (
                    edgeFrom === from
                    && edgeTo === to
                )
                ||
                (
                    edgeFrom === to
                    && edgeTo === from
                ),
        );
    }


    /*
     * ========================================================
     * OBTENER GRADO
     * ========================================================
     */

    getDegree(vertex) {
        return this.edges.filter(
            ([from, to]) =>
                from === vertex
                || to === vertex,
        ).length;
    }


    /*
     * ========================================================
     * SIGUIENTE ID
     * ========================================================
     */

    updateNextVertexId() {
        if (this.vertices.length === 0) {
            this.nextVertexId = 0;
            return;
        }

        const numericVertices =
            this.vertices.filter(
                (vertex) =>
                    typeof vertex === "number"
                    && Number.isFinite(vertex),
            );

        if (numericVertices.length === 0) {
            this.nextVertexId = 0;
            return;
        }

        this.nextVertexId =
            Math.max(...numericVertices) + 1;
    }


    /*
     * ========================================================
     * VALIDACIÓN
     * ========================================================
     */

    validate() {
        const vertexSet =
            new Set(this.vertices);

        for (const vertex of this.vertices) {
            const position =
                this.positions[String(vertex)];

            if (
                !Array.isArray(position)
                || position.length !== 2
                || !Number.isFinite(position[0])
                || !Number.isFinite(position[1])
            ) {
                throw new Error(
                    `El vértice ${vertex} no tiene `
                    + "una posición válida.",
                );
            }
        }

        for (const edge of this.edges) {
            if (
                !Array.isArray(edge)
                || edge.length !== 2
            ) {
                throw new Error(
                    "Se encontró una arista inválida.",
                );
            }

            const [from, to] = edge;

            if (
                !vertexSet.has(from)
                || !vertexSet.has(to)
            ) {
                throw new Error(
                    `La arista [${from}, ${to}] `
                    + "referencia un vértice inexistente.",
                );
            }

            if (from === to) {
                throw new Error(
                    "No se permiten loops.",
                );
            }
        }
    }
}