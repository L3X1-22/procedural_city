/*
 * ============================================================
 * file.js
 * ============================================================
 */

export function loadJsonFile(
    file,
    graph,
) {
    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {
                try {
                    const data =
                        JSON.parse(
                            reader.result,
                        );

                    validateJson(data);

                    graph.load(data);

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(
                    new Error(
                        "No fue posible leer el archivo.",
                    ),
                );
            };

            reader.readAsText(
                file,
                "utf-8",
            );
        },
    );
}


export function saveJsonFile(
    graph,
    filename = "city_layout.json",
) {
    const data =
        graph.toJSON();

    const json =
        JSON.stringify(
            data,
            null,
            2,
        );

    const blob =
        new Blob(
            [json],
            {
                type: "application/json",
            },
        );

    const url =
        URL.createObjectURL(
            blob,
        );

    const link =
        document.createElement(
            "a",
        );

    link.href = url;

    link.download = filename;

    document.body.appendChild(
        link,
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url,
    );
}


function validateJson(data) {
    if (
        !data
        || typeof data !== "object"
    ) {
        throw new Error(
            "El archivo no contiene un objeto JSON.",
        );
    }

    if (
        !Array.isArray(data.vertices)
    ) {
        throw new Error(
            "Falta el array 'vertices'.",
        );
    }

    if (
        !Array.isArray(data.edges)
    ) {
        throw new Error(
            "Falta el array 'edges'.",
        );
    }

    if (
        !data.positions
        || typeof data.positions !== "object"
        || Array.isArray(data.positions)
    ) {
        throw new Error(
            "Falta el objeto 'positions'.",
        );
    }

    const vertices =
        new Set(
            data.vertices,
        );

    for (
        const vertex of data.vertices
    ) {
        const position =
            data.positions[
                String(vertex)
            ];

        if (
            !Array.isArray(position)
            || position.length !== 2
            || !Number.isFinite(
                position[0],
            )
            || !Number.isFinite(
                position[1],
            )
        ) {
            throw new Error(
                `La posición del vértice ${vertex} no es válida.`,
            );
        }
    }

    for (
        const edge of data.edges
    ) {
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
            !vertices.has(from)
            || !vertices.has(to)
        ) {
            throw new Error(
                `La arista [${from}, ${to}] `
                + "referencia un vértice inexistente.",
            );
        }

        if (from === to) {
            throw new Error(
                "No se permiten aristas hacia "
                + "el mismo vértice.",
            );
        }
    }
}