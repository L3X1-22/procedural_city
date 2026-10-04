/*
 * ============================================================
 * renderer.js
 * ============================================================
 */

const SVG_NS =
    "http://www.w3.org/2000/svg";

const BASE_VERTEX_RADIUS = 8;

const MIN_VERTEX_RADIUS = 3;

const MAX_VERTEX_RADIUS = 22;


export class GraphRenderer {

    constructor({
        svg,
        gridGroup,
        gridLinesGroup,
        gridLabelsGroup,
        edgesGroup,
        verticesGroup,
        selectionGroup,
        graph,
        camera,
    }) {
        this.svg = svg;

        this.gridGroup = gridGroup;
        this.gridLinesGroup = gridLinesGroup;
        this.gridLabelsGroup = gridLabelsGroup;

        this.edgesGroup = edgesGroup;
        this.verticesGroup = verticesGroup;

        this.selectionGroup = selectionGroup;

        this.graph = graph;
        this.camera = camera;

        this.selectedVertex = null;

        this.selectedEdge = null;

        this.hoveredVertex = null;

        this.hoveredEdge = null;
    }


    /*
     * ========================================================
     * RENDER COMPLETO
     * ========================================================
     */

    render() {
        this.renderGrid();

        this.renderEdges();

        this.renderVertices();

        this.renderSelection();
    }


    /*
     * ========================================================
     * GRID
     * ========================================================
     */

    renderGrid() {
        this.gridLinesGroup.innerHTML = "";
        this.gridLabelsGroup.innerHTML = "";

        /*
         * Averiguar qué zona del mundo
         * está actualmente visible.
         */

        const topLeft =
            this.camera.screenToWorld(
                0,
                0,
            );

        const bottomRight =
            this.camera.screenToWorld(
                this.camera.width,
                this.camera.height,
            );

        const minX =
            Math.min(
                topLeft.x,
                bottomRight.x,
            );

        const maxX =
            Math.max(
                topLeft.x,
                bottomRight.x,
            );

        const minY =
            Math.min(
                topLeft.y,
                bottomRight.y,
            );

        const maxY =
            Math.max(
                topLeft.y,
                bottomRight.y,
            );

        const step =
            this.getGridStep();

        const startX =
            Math.floor(minX / step) * step;

        const startY =
            Math.floor(minY / step) * step;

        /*
         * Líneas verticales.
         */

        for (
            let x = startX;
            x <= maxX;
            x += step
        ) {
            const screen =
                this.camera.worldToScreen(
                    x,
                    0,
                );

            const line =
                this.createSvgElement("line");

            line.setAttribute(
                "x1",
                screen.x,
            );

            line.setAttribute(
                "y1",
                0,
            );

            line.setAttribute(
                "x2",
                screen.x,
            );

            line.setAttribute(
                "y2",
                this.camera.height,
            );

            line.classList.add(
                "grid-line",
            );

            if (
                Math.abs(x) < step * 0.001
            ) {
                line.classList.add(
                    "grid-axis",
                );
            }

            this.gridLinesGroup.appendChild(
                line,
            );

            if (
                this.camera.zoom > 0.35
            ) {
                const label =
                    this.createGridLabel(
                        x.toFixed(
                            step < 1 ? 1 : 0,
                        ),
                        screen.x + 4,
                        16,
                    );

                this.gridLabelsGroup.appendChild(
                    label,
                );
            }
        }


        /*
         * Líneas horizontales.
         */

        for (
            let y = startY;
            y <= maxY;
            y += step
        ) {
            const screen =
                this.camera.worldToScreen(
                    0,
                    y,
                );

            const line =
                this.createSvgElement("line");

            line.setAttribute(
                "x1",
                0,
            );

            line.setAttribute(
                "y1",
                screen.y,
            );

            line.setAttribute(
                "x2",
                this.camera.width,
            );

            line.setAttribute(
                "y2",
                screen.y,
            );

            line.classList.add(
                "grid-line",
            );

            if (
                Math.abs(y) < step * 0.001
            ) {
                line.classList.add(
                    "grid-axis",
                );
            }

            this.gridLinesGroup.appendChild(
                line,
            );

            if (
                this.camera.zoom > 0.35
            ) {
                const label =
                    this.createGridLabel(
                        y.toFixed(
                            step < 1 ? 1 : 0,
                        ),
                        5,
                        screen.y - 5,
                    );

                this.gridLabelsGroup.appendChild(
                    label,
                );
            }
        }
    }


    /*
     * ========================================================
     * GRID STEP
     * ========================================================
     */

    getGridStep() {
        const desiredScreenSpacing = 50;

        const rawStep =
            desiredScreenSpacing
            / this.camera.zoom;

        const power =
            Math.pow(
                10,
                Math.floor(
                    Math.log10(rawStep),
                ),
            );

        const normalized =
            rawStep / power;

        let multiplier;

        if (normalized <= 1) {
            multiplier = 1;
        } else if (normalized <= 2) {
            multiplier = 2;
        } else if (normalized <= 5) {
            multiplier = 5;
        } else {
            multiplier = 10;
        }

        return multiplier * power;
    }


    /*
     * ========================================================
     * EDGES
     * ========================================================
     */

    renderEdges() {
        this.edgesGroup.innerHTML = "";

        for (const [from, to] of this.graph.edges) {

            const fromPosition =
                this.graph.getPosition(from);

            const toPosition =
                this.graph.getPosition(to);

            if (
                !fromPosition
                || !toPosition
            ) {
                continue;
            }

            const fromScreen =
                this.camera.worldToScreen(
                    fromPosition[0],
                    fromPosition[1],
                );

            const toScreen =
                this.camera.worldToScreen(
                    toPosition[0],
                    toPosition[1],
                );

            const line =
                this.createSvgElement("line");

            line.classList.add(
                "edge",
            );

            line.dataset.from =
                String(from);

            line.dataset.to =
                String(to);

            line.setAttribute(
                "x1",
                fromScreen.x,
            );

            line.setAttribute(
                "y1",
                fromScreen.y,
            );

            line.setAttribute(
                "x2",
                toScreen.x,
            );

            line.setAttribute(
                "y2",
                toScreen.y,
            );

            /*
             * Mantener las líneas legibles
             * independientemente del zoom.
             */

            const width =
                Math.max(
                    0.7,
                    Math.min(
                        4,
                        2 / Math.sqrt(
                            this.camera.zoom,
                        ),
                    ),
                );

            line.setAttribute(
                "stroke-width",
                width,
            );

            if (
                this.isSelectedEdge(
                    from,
                    to,
                )
            ) {
                line.classList.add(
                    "edge-selected",
                );
            }

            if (
                this.isHoveredEdge(
                    from,
                    to,
                )
            ) {
                line.classList.add(
                    "edge-hover",
                );
            }

            this.edgesGroup.appendChild(
                line,
            );
        }
    }


    /*
     * ========================================================
     * VERTICES
     * ========================================================
     */

    renderVertices() {
        this.verticesGroup.innerHTML = "";

        /*
         * El radio es reactivo al zoom.
         *
         * Cerca  → grande
         * Lejos  → pequeño
         */

        const radius =
            Math.max(
                MIN_VERTEX_RADIUS,
                Math.min(
                    MAX_VERTEX_RADIUS,
                    BASE_VERTEX_RADIUS
                    * Math.sqrt(
                        this.camera.zoom,
                    ),
                ),
            );

        for (const vertex of this.graph.vertices) {

            const position =
                this.graph.getPosition(vertex);

            if (!position) {
                continue;
            }

            const screen =
                this.camera.worldToScreen(
                    position[0],
                    position[1],
                );

            const group =
                this.createSvgElement("g");

            group.dataset.vertex =
                String(vertex);

            group.classList.add(
                "vertex-group",
            );

            if (
                this.selectedVertex === vertex
            ) {
                group.classList.add(
                    "vertex-selected",
                );
            }

            if (
                this.hoveredVertex === vertex
            ) {
                group.classList.add(
                    "vertex-hover",
                );
            }

            const circle =
                this.createSvgElement(
                    "circle",
                );

            circle.classList.add(
                "vertex",
            );

            circle.setAttribute(
                "cx",
                screen.x,
            );

            circle.setAttribute(
                "cy",
                screen.y,
            );

            circle.setAttribute(
                "r",
                radius,
            );

            circle.dataset.vertex =
                String(vertex);


            /*
             * Label.
             */

            const label =
                this.createSvgElement(
                    "text",
                );

            label.classList.add(
                "vertex-label",
            );

            label.setAttribute(
                "x",
                screen.x,
            );

            label.setAttribute(
                "y",
                screen.y,
            );

            label.textContent =
                String(vertex);


            /*
             * Coordenadas.
             */

            const coordinateLabel =
                this.createSvgElement(
                    "text",
                );

            coordinateLabel.classList.add(
                "coordinate-label",
            );

            coordinateLabel.setAttribute(
                "x",
                screen.x + radius + 5,
            );

            coordinateLabel.setAttribute(
                "y",
                screen.y - radius - 5,
            );

            coordinateLabel.textContent =
                `${position[0].toFixed(1)}, ${position[1].toFixed(1)}`;


            group.appendChild(circle);

            group.appendChild(label);

            group.appendChild(
                coordinateLabel,
            );

            this.verticesGroup.appendChild(
                group,
            );
        }
    }


    /*
     * ========================================================
     * SELECCIÓN
     * ========================================================
     */

    renderSelection() {
        this.selectionGroup.innerHTML = "";

        if (
            this.selectedVertex === null
        ) {
            return;
        }

        const position =
            this.graph.getPosition(
                this.selectedVertex,
            );

        if (!position) {
            return;
        }

        const screen =
            this.camera.worldToScreen(
                position[0],
                position[1],
            );

        const circle =
            this.createSvgElement(
                "circle",
            );

        const radius =
            Math.max(
                12,
                12 * Math.sqrt(
                    this.camera.zoom,
                ),
            );

        circle.classList.add(
            "selection-ring",
        );

        circle.setAttribute(
            "cx",
            screen.x,
        );

        circle.setAttribute(
            "cy",
            screen.y,
        );

        circle.setAttribute(
            "r",
            radius,
        );

        this.selectionGroup.appendChild(
            circle,
        );
    }


    /*
     * ========================================================
     * HIT TEST
     * ========================================================
     */

    findVertexAtScreenPoint(
        screenX,
        screenY,
    ) {
        let closest = null;

        let closestDistance =
            Infinity;

        const radius =
            Math.max(
                12,
                BASE_VERTEX_RADIUS
                * Math.sqrt(
                    this.camera.zoom,
                )
                + 6,
            );

        for (const vertex of this.graph.vertices) {

            const position =
                this.graph.getPosition(vertex);

            if (!position) {
                continue;
            }

            const screen =
                this.camera.worldToScreen(
                    position[0],
                    position[1],
                );

            const dx =
                screen.x - screenX;

            const dy =
                screen.y - screenY;

            const distance =
                Math.sqrt(
                    dx * dx + dy * dy,
                );

            if (
                distance <= radius
                && distance < closestDistance
            ) {
                closest = vertex;
                closestDistance = distance;
            }
        }

        return closest;
    }


    /*
     * ========================================================
     * HIT TEST ARISTA
     * ========================================================
     */

    findEdgeAtScreenPoint(
        screenX,
        screenY,
    ) {
        let closest = null;

        let closestDistance =
            Infinity;

        for (const [from, to] of this.graph.edges) {

            const fromPosition =
                this.graph.getPosition(from);

            const toPosition =
                this.graph.getPosition(to);

            if (
                !fromPosition
                || !toPosition
            ) {
                continue;
            }

            const a =
                this.camera.worldToScreen(
                    fromPosition[0],
                    fromPosition[1],
                );

            const b =
                this.camera.worldToScreen(
                    toPosition[0],
                    toPosition[1],
                );

            const distance =
                this.distanceToSegment(
                    screenX,
                    screenY,
                    a.x,
                    a.y,
                    b.x,
                    b.y,
                );

            if (
                distance <= 10
                && distance < closestDistance
            ) {
                closest = [from, to];
                closestDistance = distance;
            }
        }

        return closest;
    }


    /*
     * ========================================================
     * DISTANCIA A SEGMENTO
     * ========================================================
     */

    distanceToSegment(
        px,
        py,
        x1,
        y1,
        x2,
        y2,
    ) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            return Math.hypot(
                px - x1,
                py - y1,
            );
        }

        const t = Math.max(
            0,
            Math.min(
                1,
                (
                    (px - x1) * dx
                    + (py - y1) * dy
                )
                / (dx * dx + dy * dy),
            ),
        );

        const closestX =
            x1 + t * dx;

        const closestY =
            y1 + t * dy;

        return Math.hypot(
            px - closestX,
            py - closestY,
        );
    }


    /*
     * ========================================================
     * HELPERS
     * ========================================================
     */

    isSelectedEdge(from, to) {
        if (!this.selectedEdge) {
            return false;
        }

        const [
            selectedFrom,
            selectedTo,
        ] = this.selectedEdge;

        return (
            (
                selectedFrom === from
                && selectedTo === to
            )
            ||
            (
                selectedFrom === to
                && selectedTo === from
            )
        );
    }


    isHoveredEdge(from, to) {
        if (!this.hoveredEdge) {
            return false;
        }

        const [
            hoveredFrom,
            hoveredTo,
        ] = this.hoveredEdge;

        return (
            (
                hoveredFrom === from
                && hoveredTo === to
            )
            ||
            (
                hoveredFrom === to
                && hoveredTo === from
            )
        );
    }


    createSvgElement(type) {
        return document.createElementNS(
            SVG_NS,
            type,
        );
    }


    createGridLabel(
        text,
        x,
        y,
    ) {
        const label =
            this.createSvgElement(
                "text",
            );

        label.classList.add(
            "grid-label",
        );

        label.setAttribute(
            "x",
            x,
        );

        label.setAttribute(
            "y",
            y,
        );

        label.textContent = text;

        return label;
    }
}