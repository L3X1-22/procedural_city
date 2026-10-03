const SVG_WIDTH = 1000;
const SVG_HEIGHT = 600;

const VERTEX_RADIUS = 24;

const fileInput = document.getElementById("file-input");
const randomizeButton = document.getElementById("randomize-button");

const graphSvg = document.getElementById("graph");
const edgesGroup = document.getElementById("edges");
const verticesGroup = document.getElementById("vertices");

const emptyState = document.getElementById("empty-state");
const errorElement = document.getElementById("error");
const errorMessageElement = document.getElementById("error-message");

let graph = null;
let positions = new Map();
let draggedVertex = null;


/*
 * Cargar el JSON mediante input type="file".
 */
fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        validateGraph(data);

        graph = data;

        errorElement.classList.add("hidden");
        emptyState.classList.add("hidden");

        randomizeButton.disabled = false;

        randomizePositions();
        renderGraph();

    } catch (error) {
        graph = null;

        randomizeButton.disabled = true;

        errorElement.classList.remove("hidden");
        errorMessageElement.textContent = error.message;

        console.error(error);
    }
});


/*
 * Comprueba la estructura del JSON.
 */
function validateGraph(data) {
    if (!data || typeof data !== "object") {
        throw new Error("El archivo no contiene un objeto JSON.");
    }

    if (!Array.isArray(data.vertices)) {
        throw new Error(
            "El JSON no contiene un array 'vertices'."
        );
    }

    if (!Array.isArray(data.edges)) {
        throw new Error(
            "El JSON no contiene un array 'edges'."
        );
    }

    for (const edge of data.edges) {
        if (
            !Array.isArray(edge) ||
            edge.length !== 2
        ) {
            throw new Error(
                "Se encontró una arista inválida."
            );
        }
    }
}


/*
 * Genera posiciones aleatorias.
 */
function randomizePositions() {
    positions.clear();

    const margin = 60;

    for (const vertex of graph.vertices) {
        positions.set(vertex, {
            x: randomNumber(
                margin,
                SVG_WIDTH - margin
            ),

            y: randomNumber(
                margin,
                SVG_HEIGHT - margin
            ),
        });
    }
}


function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}


/*
 * Dibuja el grafo completo.
 */
function renderGraph() {
    edgesGroup.innerHTML = "";
    verticesGroup.innerHTML = "";

    renderEdges();
    renderVertices();
}


/*
 * Dibuja las aristas.
 */
function renderEdges() {
    for (const [from, to] of graph.edges) {

        const fromPosition = positions.get(from);
        const toPosition = positions.get(to);

        if (!fromPosition || !toPosition) {
            continue;
        }

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.classList.add("edge");

        line.setAttribute("x1", fromPosition.x);
        line.setAttribute("y1", fromPosition.y);

        line.setAttribute("x2", toPosition.x);
        line.setAttribute("y2", toPosition.y);

        line.dataset.from = from;
        line.dataset.to = to;

        edgesGroup.appendChild(line);
    }
}


/*
 * Dibuja los vértices.
 */
function renderVertices() {
    for (const vertex of graph.vertices) {

        const position = positions.get(vertex);

        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        group.dataset.vertex = vertex;

        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.classList.add("vertex");

        circle.setAttribute("cx", position.x);
        circle.setAttribute("cy", position.y);
        circle.setAttribute("r", VERTEX_RADIUS);


        const label = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        label.classList.add("vertex-label");

        label.setAttribute("x", position.x);
        label.setAttribute("y", position.y);

        label.textContent = vertex;


        group.appendChild(circle);
        group.appendChild(label);

        group.addEventListener(
            "pointerdown",
            (event) => startDragging(
                event,
                vertex,
                group
            )
        );

        verticesGroup.appendChild(group);
    }
}


/*
 * Empieza a arrastrar un vértice.
 */
function startDragging(event, vertex, group) {
    event.preventDefault();

    draggedVertex = {
        vertex,
        group,
    };

    group.classList.add("dragging");

    group.setPointerCapture(event.pointerId);

    group.addEventListener(
        "pointermove",
        handleDragging
    );

    group.addEventListener(
        "pointerup",
        stopDragging,
        { once: true }
    );
}


/*
 * Mueve el vértice.
 */
function handleDragging(event) {
    if (!draggedVertex) {
        return;
    }

    const point = getSvgPoint(event);

    const x = clamp(
        point.x,
        VERTEX_RADIUS,
        SVG_WIDTH - VERTEX_RADIUS
    );

    const y = clamp(
        point.y,
        VERTEX_RADIUS,
        SVG_HEIGHT - VERTEX_RADIUS
    );

    positions.set(
        draggedVertex.vertex,
        { x, y }
    );

    updateVertex(
        draggedVertex.vertex,
        x,
        y
    );

    updateEdges();
}


/*
 * Termina de arrastrar.
 */
function stopDragging(event) {
    if (!draggedVertex) {
        return;
    }

    draggedVertex.group.classList.remove("dragging");

    draggedVertex.group.releasePointerCapture(
        event.pointerId
    );

    draggedVertex.group.removeEventListener(
        "pointermove",
        handleDragging
    );

    draggedVertex = null;
}


/*
 * Actualiza la posición visual del vértice.
 */
function updateVertex(vertex, x, y) {
    const group = verticesGroup.querySelector(
        `[data-vertex="${vertex}"]`
    );

    if (!group) {
        return;
    }

    const circle = group.querySelector("circle");
    const label = group.querySelector("text");

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);

    label.setAttribute("x", x);
    label.setAttribute("y", y);
}


/*
 * Actualiza las aristas conectadas.
 */
function updateEdges() {
    const lines = edgesGroup.querySelectorAll(".edge");

    for (const line of lines) {

        const from = Number(line.dataset.from);
        const to = Number(line.dataset.to);

        const fromPosition = positions.get(from);
        const toPosition = positions.get(to);

        if (!fromPosition || !toPosition) {
            continue;
        }

        line.setAttribute(
            "x1",
            fromPosition.x
        );

        line.setAttribute(
            "y1",
            fromPosition.y
        );

        line.setAttribute(
            "x2",
            toPosition.x
        );

        line.setAttribute(
            "y2",
            toPosition.y
        );
    }
}


/*
 * Convierte coordenadas del mouse a coordenadas SVG.
 */
function getSvgPoint(event) {
    const rect = graphSvg.getBoundingClientRect();

    return {
        x:
            (event.clientX - rect.left)
            * (SVG_WIDTH / rect.width),

        y:
            (event.clientY - rect.top)
            * (SVG_HEIGHT / rect.height),
    };
}


function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


/*
 * Organizar aleatoriamente.
 */
randomizeButton.addEventListener(
    "click",
    () => {
        if (!graph) {
            return;
        }

        randomizePositions();
        renderGraph();
    }
);