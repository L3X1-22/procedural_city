/*
 * ============================================================
 * camera.js
 * ============================================================
 */

export class Camera {

    constructor(width = 1000, height = 600) {
        this.width = width;
        this.height = height;

        /*
         * screen = world * zoom + offset
         */

        this.zoom = 1;

        this.offsetX = 0;
        this.offsetY = 0;

        this.minZoom = 0.05;
        this.maxZoom = 20;
    }


    /*
     * WORLD → SCREEN
     */

    worldToScreen(x, y) {
        return {
            x: x * this.zoom + this.offsetX,
            y: y * this.zoom + this.offsetY,
        };
    }


    /*
     * SCREEN → WORLD
     */

    screenToWorld(x, y) {
        return {
            x: (x - this.offsetX) / this.zoom,
            y: (y - this.offsetY) / this.zoom,
        };
    }


    /*
     * ZOOM HACIA UN PUNTO
     */

    zoomAt(screenX, screenY, factor) {
        const worldBefore =
            this.screenToWorld(
                screenX,
                screenY,
            );

        const newZoom = Math.max(
            this.minZoom,
            Math.min(
                this.maxZoom,
                this.zoom * factor,
            ),
        );

        this.zoom = newZoom;

        const screenAfter =
            this.worldToScreen(
                worldBefore.x,
                worldBefore.y,
            );

        this.offsetX +=
            screenX - screenAfter.x;

        this.offsetY +=
            screenY - screenAfter.y;
    }


    /*
     * PAN
     */

    pan(deltaX, deltaY) {
        this.offsetX += deltaX;
        this.offsetY += deltaY;
    }


    /*
     * AJUSTAR A TODO EL GRAFO
     */

    fitToPositions(
        positions,
        padding = 80,
    ) {
        const values =
            Object.values(positions);

        if (values.length === 0) {
            this.zoom = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }

        const xs =
            values.map(
                ([x]) => x,
            );

        const ys =
            values.map(
                ([, y]) => y,
            );

        let minX = Math.min(...xs);
        let maxX = Math.max(...xs);

        let minY = Math.min(...ys);
        let maxY = Math.max(...ys);

        /*
         * Evitar división por cero.
         */

        if (minX === maxX) {
            minX -= 1;
            maxX += 1;
        }

        if (minY === maxY) {
            minY -= 1;
            maxY += 1;
        }

        const worldWidth =
            maxX - minX;

        const worldHeight =
            maxY - minY;

        const availableWidth =
            this.width - padding * 2;

        const availableHeight =
            this.height - padding * 2;

        const zoomX =
            availableWidth / worldWidth;

        const zoomY =
            availableHeight / worldHeight;

        this.zoom = Math.max(
            this.minZoom,
            Math.min(
                this.maxZoom,
                Math.min(zoomX, zoomY),
            ),
        );

        const centerWorldX =
            (minX + maxX) / 2;

        const centerWorldY =
            (minY + maxY) / 2;

        this.offsetX =
            this.width / 2
            - centerWorldX * this.zoom;

        this.offsetY =
            this.height / 2
            - centerWorldY * this.zoom;
    }


    /*
     * RESET
     */

    reset() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}