/*
 * ============================================================
 * main.js
 * ============================================================
 */

import { GraphModel } from "./graph.js";

import { Camera } from "./camera.js";

import { GraphRenderer } from "./renderer.js";

import { InteractionController } from "./interaction.js";

import {
    loadJsonFile,
    saveJsonFile,
} from "./file.js";


/*
 * ============================================================
 * DOM
 * ============================================================
 */

const svg =
    document.getElementById(
        "graph",
    );

const gridGroup =
    document.getElementById(
        "grid",
    );

const gridLinesGroup =
    document.getElementById(
        "grid-lines",
    );

const gridLabelsGroup =
    document.getElementById(
        "grid-labels",
    );

const edgesGroup =
    document.getElementById(
        "edges",
    );

const verticesGroup =
    document.getElementById(
        "vertices",
    );

const selectionGroup =
    document.getElementById(
        "selection",
    );

const fileInput =
    document.getElementById(
        "file-input",
    );

const saveButton =
    document.getElementById(
        "save-button",
    );

const resetButton =
    document.getElementById(
        "reset-button",
    );

const emptyState =
    document.getElementById(
        "empty-state",
    );

const errorElement =
    document.getElementById(
        "error",
    );

const errorMessageElement =
    document.getElementById(
        "error-message",
    );

const cursorCoordinates =
    document.getElementById(
        "cursor-coordinates",
    );

const zoomLevel =
    document.getElementById(
        "zoom-level",
    );

const vertexCount =
    document.getElementById(
        "vertex-count",
    );

const edgeCount =
    document.getElementById(
        "edge-count",
    );

const toolHint =
    document.getElementById(
        "tool-hint",
    );

const selectionEmpty =
    document.getElementById(
        "selection-empty",
    );

const vertexInfo =
    document.getElementById(
        "vertex-info",
    );

const edgeInfo =
    document.getElementById(
        "edge-info",
    );

const selectedVertexId =
    document.getElementById(
        "selected-vertex-id",
    );

const selectedVertexX =
    document.getElementById(
        "selected-vertex-x",
    );

const selectedVertexY =
    document.getElementById(
        "selected-vertex-y",
    );

const selectedEdge =
    document.getElementById(
        "selected-edge",
    );


/*
 * ============================================================
 * MODELO
 * ============================================================
 */

const graph =
    new GraphModel();


/*
 * ============================================================
 * CÁMARA
 * ============================================================
 */

const camera =
    new Camera(
        1000,
        600,
    );


/*
 * ============================================================
 * RENDERER
 * ============================================================
 */

const renderer =
    new GraphRenderer({
        svg,
        gridGroup,
        gridLinesGroup,
        gridLabelsGroup,
        edgesGroup,
        verticesGroup,
        selectionGroup,
        graph,
        camera,
    });


/*
 * ============================================================
 * ESTADO
 * ============================================================
 */

let hasGraph = false;


/*
 * ============================================================
 * RENDER GENERAL
 * ============================================================
 */

function render() {
    renderer.render();

    updateStats();

    updateSelectionPanel();

    updateZoomLabel();

    updateEmptyState();
}


/*
 * ============================================================
 * GRAPH CHANGED
 * ============================================================
 */

function onGraphChanged(
    renderImmediately = true,
) {
    hasGraph = true;

    saveButton.disabled = false;

    resetButton.disabled = false;

    if (renderImmediately) {
        render();
    } else {
        renderer.render();
        updateStats();
        updateSelectionPanel();
    }
}


/*
 * ============================================================
 * CAMERA CHANGED
 * ============================================================
 */

function onCameraChanged() {
    renderer.render();

    updateZoomLabel();

    updateSelectionPanel();
}


/*
 * ============================================================
 * SELECCIÓN
 * ============================================================
 */

function onSelectionChanged() {
    render();
}


/*
 * ============================================================
 * TOOL
 * ============================================================
 */

function onToolChanged(tool) {
    document
        .querySelectorAll(
            ".tool-button",
        )
        .forEach(
            (button) => {
                button.classList.toggle(
                    "active",
                    button.dataset.tool
                    === tool,
                );
            },
        );

    const hints = {
        select:
            "Selecciona o arrastra un vértice. Arrastra el fondo para mover la cámara.",

        "add-vertex":
            "Haz click en el mapa para crear un vértice.",

        "delete-vertex":
            "Haz click sobre un vértice para eliminarlo.",

        "add-edge":
            "Haz click en dos vértices para conectarlos.",

        "delete-edge":
            "Haz click sobre una arista para eliminarla.",
    };

    toolHint.textContent =
        hints[tool]
        ?? "";
}


/*
 * ============================================================
 * TOOL HINT
 * ============================================================
 */

function onToolHint(message) {
    toolHint.textContent =
        message;

    clearTimeout(
        onToolHint.timeout,
    );

    onToolHint.timeout =
        setTimeout(
            () => {
                const activeTool =
                    document.querySelector(
                        ".tool-button.active",
                    );

                if (!activeTool) {
                    return;
                }

                onToolChanged(
                    activeTool.dataset.tool,
                );
            },
            180,
        );
}


/*
 * ============================================================
 * CURSOR
 * ============================================================
 */

function onCursorMoved(
    x,
    y,
) {
    cursorCoordinates.textContent =
        `X: ${x.toFixed(2)}   Y: ${y.toFixed(2)}`;
}


/*
 * ============================================================
 * ESTADÍSTICAS
 * ============================================================
 */

function updateStats() {
    vertexCount.textContent =
        graph.vertices.length;

    edgeCount.textContent =
        graph.edges.length;
}


/*
 * ============================================================
 * SELECCIÓN PANEL
 * ============================================================
 */

function updateSelectionPanel() {

    selectionEmpty.classList.add(
        "hidden",
    );

    vertexInfo.classList.add(
        "hidden",
    );

    edgeInfo.classList.add(
        "hidden",
    );


    /*
     * VÉRTICE
     */

    if (
        renderer.selectedVertex !== null
    ) {
        const vertex =
            renderer.selectedVertex;

        const position =
            graph.getPosition(vertex);

        if (position) {

            selectedVertexId.textContent =
                vertex;

            selectedVertexX.textContent =
                position[0].toFixed(2);

            selectedVertexY.textContent =
                position[1].toFixed(2);

            vertexInfo.classList.remove(
                "hidden",
            );

            return;
        }
    }


    /*
     * ARISTA
     */

    if (
        renderer.selectedEdge
    ) {
        const [
            from,
            to,
        ] = renderer.selectedEdge;

        selectedEdge.textContent =
            `${from} ↔ ${to}`;

        edgeInfo.classList.remove(
            "hidden",
        );

        return;
    }


    /*
     * NADA
     */

    selectionEmpty.classList.remove(
        "hidden",
    );
}


/*
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function updateEmptyState() {
    emptyState.classList.toggle(
        "hidden",
        hasGraph,
    );
}


/*
 * ============================================================
 * ZOOM
 * ============================================================
 */

function updateZoomLabel() {
    zoomLevel.textContent =
        `${Math.round(
            camera.zoom * 100,
        )}%`;
}


document
    .getElementById(
        "zoom-in",
    )
    .addEventListener(
        "click",
        () => {
            camera.zoomAt(
                500,
                300,
                1.25,
            );

            onCameraChanged();
        },
    );


document
    .getElementById(
        "zoom-out",
    )
    .addEventListener(
        "click",
        () => {
            camera.zoomAt(
                500,
                300,
                1 / 1.25,
            );

            onCameraChanged();
        },
    );


document
    .getElementById(
        "zoom-reset",
    )
    .addEventListener(
        "click",
        () => {
            if (hasGraph) {
                camera.fitToPositions(
                    graph.positions,
                );
            } else {
                camera.reset();
            }

            onCameraChanged();
        },
    );


/*
 * ============================================================
 * HERRAMIENTAS
 * ============================================================
 */

document
    .querySelectorAll(
        ".tool-button[data-tool]",
    )
    .forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    interaction.setTool(
                        button.dataset.tool,
                    );
                },
            );
        },
    );


/*
 * ============================================================
 * CARGAR JSON
 * ============================================================
 */

fileInput.addEventListener(
    "change",
    async (event) => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        try {

            await loadJsonFile(
                file,
                graph,
            );

            hasGraph = true;

            saveButton.disabled =
                false;

            resetButton.disabled =
                false;

            renderer.selectedVertex =
                null;

            renderer.selectedEdge =
                null;

            camera.fitToPositions(
                graph.positions,
            );

            hideError();

            render();

            onToolHint(
                "Mapa cargado correctamente.",
            );

        } catch (error) {

            showError(
                error.message,
            );

            console.error(error);
        }

        /*
         * Permitir volver a cargar
         * el mismo archivo.
         */

        fileInput.value = "";
    },
);


/*
 * ============================================================
 * GUARDAR JSON
 * ============================================================
 */

saveButton.addEventListener(
    "click",
    () => {

        if (!hasGraph) {
            return;
        }

        saveJsonFile(
            graph,
            "city_layout.json",
        );

        onToolHint(
            "💾 city_layout.json guardado.",
        );
    },
);


/*
 * ============================================================
 * RESET
 * ============================================================
 *
 * Aquí "Restablecer" significa únicamente
 * devolver la cámara al encuadre del mapa.
 *
 * No borra las modificaciones.
 */

resetButton.addEventListener(
    "click",
    () => {

        if (!hasGraph) {
            return;
        }

        camera.fitToPositions(
            graph.positions,
        );

        renderer.selectedVertex =
            null;

        renderer.selectedEdge =
            null;

        render();

        onToolHint(
            "Vista restablecida.",
        );
    },
);


/*
 * ============================================================
 * ERROR
 * ============================================================
 */

function showError(message) {
    errorElement.classList.remove(
        "hidden",
    );

    errorMessageElement.textContent =
        message;
}


function hideError() {
    errorElement.classList.add(
        "hidden",
    );

    errorMessageElement.textContent =
        "";
}


/*
 * ============================================================
 * INTERACTION
 * ============================================================
 */

const interaction =
    new InteractionController({
        svg,
        graph,
        camera,
        renderer,

        callbacks: {
            onGraphChanged,
            onCameraChanged,
            onSelectionChanged,
            onToolChanged,
            onToolHint,
            onCursorMoved,
        },
    });


interaction.init();

interaction.setTool(
    "select",
);


/*
 * ============================================================
 * RESIZE
 * ============================================================
 */

window.addEventListener(
    "resize",
    () => {
        renderer.render();
    },
);


/*
 * ============================================================
 * START
 * ============================================================
 */

render();