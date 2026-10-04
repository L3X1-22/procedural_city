/*
 * ============================================================
 * interaction.js
 * ============================================================
 */

export class InteractionController {

    constructor({
        svg,
        graph,
        camera,
        renderer,
        callbacks,
    }) {
        this.svg = svg;

        this.graph = graph;

        this.camera = camera;

        this.renderer = renderer;

        this.callbacks = callbacks;

        this.tool = "select";

        this.dragging = false;

        this.panning = false;

        this.pointerStart = null;

        this.draggedVertex = null;

        this.edgeStartVertex = null;
    }


    /*
     * ========================================================
     * INICIALIZAR
     * ========================================================
     */

    init() {
        this.svg.addEventListener(
            "pointerdown",
            (event) => {
                this.pointerDown(event);
            },
        );

        this.svg.addEventListener(
            "pointermove",
            (event) => {
                this.pointerMove(event);
            },
        );

        this.svg.addEventListener(
            "pointerup",
            (event) => {
                this.pointerUp(event);
            },
        );

        this.svg.addEventListener(
            "pointercancel",
            (event) => {
                this.pointerUp(event);
            },
        );

        this.svg.addEventListener(
            "wheel",
            (event) => {
                this.wheel(event);
            },
            {
                passive: false,
            },
        );

        this.svg.addEventListener(
            "contextmenu",
            (event) => {
                event.preventDefault();
            },
        );
    }


    /*
     * ========================================================
     * HERRAMIENTA
     * ========================================================
     */

    setTool(tool) {
        this.tool = tool;

        this.edgeStartVertex = null;

        this.renderer.selectedEdge = null;

        this.callbacks.onToolChanged(
            tool,
        );

        this.renderer.render();
    }


    /*
     * ========================================================
     * POINTER DOWN
     * ========================================================
     */

    pointerDown(event) {
        const point =
            this.getSvgPoint(event);

        const vertex =
            this.renderer.findVertexAtScreenPoint(
                point.x,
                point.y,
            );

        const edge =
            this.renderer.findEdgeAtScreenPoint(
                point.x,
                point.y,
            );


        /*
         * --------------------------------------------
         * AÑADIR VÉRTICE
         * --------------------------------------------
         */

        if (
            this.tool === "add-vertex"
        ) {
            if (vertex !== null) {
                return;
            }

            const world =
                this.camera.screenToWorld(
                    point.x,
                    point.y,
                );

            const newVertex =
                this.graph.addVertex(
                    world.x,
                    world.y,
                );

            this.renderer.selectedVertex =
                newVertex;

            this.callbacks.onGraphChanged();

            return;
        }


        /*
         * --------------------------------------------
         * ELIMINAR VÉRTICE
         * --------------------------------------------
         */

        if (
            this.tool === "delete-vertex"
        ) {
            if (vertex === null) {
                return;
            }

            this.graph.deleteVertex(
                vertex,
            );

            if (
                this.renderer.selectedVertex
                === vertex
            ) {
                this.renderer.selectedVertex =
                    null;
            }

            this.callbacks.onGraphChanged();

            return;
        }


        /*
         * --------------------------------------------
         * AÑADIR ARISTA
         * --------------------------------------------
         */

        if (
            this.tool === "add-edge"
        ) {
            if (vertex === null) {
                return;
            }

            if (
                this.edgeStartVertex === null
            ) {
                this.edgeStartVertex =
                    vertex;

                this.renderer.selectedVertex =
                    vertex;

                this.callbacks.onToolHint(
                    `Vértice ${vertex} seleccionado. `
                    + "Ahora selecciona el segundo.",
                );

                this.renderer.render();

                return;
            }

            if (
                vertex === this.edgeStartVertex
            ) {
                return;
            }

            const added =
                this.graph.addEdge(
                    this.edgeStartVertex,
                    vertex,
                );

            if (added) {
                this.callbacks.onToolHint(
                    `Arista ${this.edgeStartVertex} ↔ ${vertex} creada.`,
                );
            } else {
                this.callbacks.onToolHint(
                    "Esa arista ya existe.",
                );
            }

            this.edgeStartVertex = null;

            this.callbacks.onGraphChanged();

            return;
        }


        /*
         * --------------------------------------------
         * ELIMINAR ARISTA
         * --------------------------------------------
         */

        if (
            this.tool === "delete-edge"
        ) {
            if (!edge) {
                return;
            }

            this.graph.deleteEdge(
                edge[0],
                edge[1],
            );

            this.renderer.selectedEdge =
                null;

            this.callbacks.onGraphChanged();

            return;
        }


        /*
         * --------------------------------------------
         * SELECT
         * --------------------------------------------
         */

        if (
            this.tool === "select"
        ) {
            if (vertex !== null) {

                this.renderer.selectedVertex =
                    vertex;

                this.renderer.selectedEdge =
                    null;

                this.draggedVertex =
                    vertex;

                this.dragging = false;

                this.pointerStart = {
                    x: point.x,
                    y: point.y,
                };

                this.callbacks.onSelectionChanged();

                return;
            }

            if (edge) {
                this.renderer.selectedVertex =
                    null;

                this.renderer.selectedEdge =
                    edge;

                this.callbacks.onSelectionChanged();

                this.renderer.render();

                return;
            }

            /*
             * Fondo: empezar pan.
             */

            this.renderer.selectedVertex =
                null;

            this.renderer.selectedEdge =
                null;

            this.panning = true;

            this.pointerStart = {
                x: point.x,
                y: point.y,
            };

            this.callbacks.onSelectionChanged();
        }
    }


    /*
     * ========================================================
     * POINTER MOVE
     * ========================================================
     */

    pointerMove(event) {
        const point =
            this.getSvgPoint(event);


        /*
         * Mostrar coordenadas.
         */

        const world =
            this.camera.screenToWorld(
                point.x,
                point.y,
            );

        this.callbacks.onCursorMoved(
            world.x,
            world.y,
        );


        /*
         * --------------------------------------------
         * DRAG VÉRTICE
         * --------------------------------------------
         */

        if (
            this.draggedVertex !== null
            && this.pointerStart
        ) {
            const dx =
                point.x
                - this.pointerStart.x;

            const dy =
                point.y
                - this.pointerStart.y;

            if (
                Math.hypot(dx, dy) > 3
            ) {
                this.dragging = true;
            }

            if (this.dragging) {

                const worldPosition =
                    this.camera.screenToWorld(
                        point.x,
                        point.y,
                    );

                this.graph.setPosition(
                    this.draggedVertex,
                    worldPosition.x,
                    worldPosition.y,
                );

                this.callbacks.onGraphChanged(
                    false,
                );
            }

            return;
        }


        /*
         * --------------------------------------------
         * PAN
         * --------------------------------------------
         */

        if (
            this.panning
            && this.pointerStart
        ) {
            const dx =
                point.x
                - this.pointerStart.x;

            const dy =
                point.y
                - this.pointerStart.y;

            this.camera.pan(
                dx,
                dy,
            );

            this.pointerStart = {
                x: point.x,
                y: point.y,
            };

            this.callbacks.onCameraChanged();

            return;
        }


        /*
         * --------------------------------------------
         * HOVER
         * --------------------------------------------
         */

        const vertex =
            this.renderer.findVertexAtScreenPoint(
                point.x,
                point.y,
            );

        const edge =
            vertex === null
                ? this.renderer.findEdgeAtScreenPoint(
                    point.x,
                    point.y,
                )
                : null;

        this.renderer.hoveredVertex =
            vertex;

        this.renderer.hoveredEdge =
            edge;

        this.renderer.render();
    }


    /*
     * ========================================================
     * POINTER UP
     * ========================================================
     */

    pointerUp() {
        if (
            this.dragging
            && this.draggedVertex !== null
        ) {
            this.callbacks.onGraphChanged();
        }

        this.dragging = false;

        this.draggedVertex = null;

        this.panning = false;

        this.pointerStart = null;
    }


    /*
     * ========================================================
     * WHEEL
     * ========================================================
     */

    wheel(event) {
        event.preventDefault();

        const point =
            this.getSvgPoint(event);

        const factor =
            event.deltaY < 0
                ? 1.15
                : 1 / 1.15;

        this.camera.zoomAt(
            point.x,
            point.y,
            factor,
        );

        this.callbacks.onCameraChanged();
    }


    /*
     * ========================================================
     * SVG COORDINATES
     * ========================================================
     */

    getSvgPoint(event) {
        const rect =
            this.svg.getBoundingClientRect();

        return {
            x:
                (
                    event.clientX
                    - rect.left
                )
                * (
                    1000
                    / rect.width
                ),

            y:
                (
                    event.clientY
                    - rect.top
                )
                * (
                    600
                    / rect.height
                ),
        };
    }
}