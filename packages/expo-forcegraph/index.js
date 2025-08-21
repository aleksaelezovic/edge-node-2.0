import fromKapsule from "react-kapsule";

const initForceGraph3D = async (wrapperElement) =>
  import("3d-force-graph").then((m) =>
    fromKapsule(m.default, {
      wrapperElementType: wrapperElement,
      methodNames: [
        // bind methods
        "emitParticle",
        "d3Force",
        "d3ReheatSimulation",
        "stopAnimation",
        "pauseAnimation",
        "resumeAnimation",
        "cameraPosition",
        "zoomToFit",
        "getGraphBbox",
        "screen2GraphCoords",
        "graph2ScreenCoords",
        "postProcessingComposer",
        "lights",
        "scene",
        "camera",
        "renderer",
        "controls",
        "refresh",
      ],
      initPropNames: ["controlType", "rendererConfig", "extraRenderers"],
    }),
  );

export default initForceGraph3D;
