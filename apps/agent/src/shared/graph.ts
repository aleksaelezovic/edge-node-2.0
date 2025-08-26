//@ts-nocheck

import { THREE, TextureLoader } from "expo-three";
import SpriteText from "three-spritetext";

const ualReg = /^(did:dkg:([a-z]+(:([0-9]*))?))\/([0-9a-zA-Z]+)\/(\d+)$/;
export const isUal = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return ualReg.test(value);
};

export const GRAPH_OPTIONS = {
  backgroundColor: "#03061c",
  warmupTicks: 130,
  cooldownTicks: 200,
  cooldownTime: 300,
  enableNodeDrag: true,
  linkDistance: 100,
  chargeStrength: -100,
};

export const LINK = {
  width: 0.1,
  opacity: 1,
};

export const CAMERA = {
  position: { x: 0, y: 0, z: 200 },
  target: { x: 0, y: 0, z: 0 },
  duration: 3000,
};

export const NODE_ZOOM = 35;

type GraphNodeId = string | number;

type GraphNodeData = {
  type: string;
  color: string;
  shape: string;
  size: number;
  glow?: boolean;
  expanded?: boolean;
};

type GraphNodeDynamicData = {
  id: GraphNodeId;
  value?: string;
};

type GraphNode = {
  index: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
} & GraphNodeDynamicData &
  GraphNodeData;

type GraphLinkData = {
  type: string;
  color: string;
  width: number;
  opacity: number;
};

type GraphLinkDynamicData = {
  source: GraphNodeId;
  target: GraphNodeId;
  value?: string;
};

type GraphLink = GraphLinkDynamicData &
  GraphLinkData & {
    index: number;
    source: GraphNode;
    target: GraphNode;
  };

const nodeTypes = {
  knowledgeCollection: {
    type: "KNOWLEDGE_COLLECTION",
    color: "#8B85F4",
    shape: "hexagonal_prism",
    size: 10,
  },
  knowledgeAsset: {
    type: "KNOWLEDGE_ASSET",
    color: "#8B85F4",
    shape: "ka",
    size: 10,
    glow: true,
  },
  knowledgeAssetClickable: {
    type: "KNOWLEDGE_ASSET_CLICKABLE",
    color: "#6344DF",
    shape: "ka_clickable",
    size: 6,
  },
  knowledgeAssetHidden: {
    type: "KNOWLEDGE_ASSET_HIDDEN",
    color: "#6344DF",
    shape: "octahedron",
    size: 6,
  },
  knowledgeAssetWithUrl: {
    type: "KNOWLEDGE_ASSET_URL",
    color: "#6344DF",
    shape: "octahedron",
    size: 7,
    glow: true,
  },
  property: {
    type: "PROPERTY",
    color: "#8B85F4",
    shape: "sphere_text",
    size: 3,
  },
  propertyWithUrl: {
    type: "PROPERTY_URL",
    color: "#1ADED7",
    shape: "sphere",
    size: 4,
    glow: true,
  },
  owner: {
    type: "OWNER",
    color: "#FF0087",
    shape: "toroid",
    size: 7,
  },
  array: {
    type: "ARRAY",
    color: "#1ADEDC",
    shape: "sphere",
    size: 3,
  },
} satisfies Record<string, GraphNodeData>;

const linkTypes = {
  directedCollection: {
    type: "DIRECTED_COLLECTION",
    color: "#1ADED7",
    width: 2,
    opacity: 0.8,
  },
  undirectedCollection: {
    type: "UNDIRECTED_COLLECTION",
    color: "#8B85F4",
    width: 1.5,
    opacity: 0.7,
  },
  directed: {
    type: "DIRECTED",
    color: "#1ADED7",
    width: 3,
    opacity: 0.9,
  },
  undirected: {
    type: "UNDIRECTED",
    color: "#8B85F4",
    width: 1,
    opacity: 0.6,
  },
} satisfies Record<string, GraphLinkData>;

export function getNodeMesh(node: GraphNode, version: string) {
  if (!node) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(4),
      new THREE.MeshBasicMaterial({ color: "#000000" }),
    );
  }

  let geometry, material;
  if (version === "v6") {
    switch (node.shape) {
      case "ka_clickable":
        const imgTexture2 = new TextureLoader().load(
          require(`../assets/images/ka/Purple KA.png`),
        );
        imgTexture2.colorSpace = THREE.SRGBColorSpace;
        const sprite2 = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: imgTexture2,
            transparent: true,
            alphaTest: 0,
          }),
        );
        sprite2.scale.set(node.size * 2, node.size * 2, 0);
        return sprite2;
      case "ka":
        geometry = new THREE.SphereGeometry(4);
        material = new THREE.MeshPhongMaterial({
          color: node.color,
          emissive: node.color,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        break;
      case "sphere_text":
        const text = new SpriteText(`${node.value}`, node.size, node.color);
        // text.material.depthWrite = false;
        text.fontWeight = "bold";
        text.backgroundColor = "#03061c";
        text.padding = [1.5 * node.size, node.size];
        text.borderRadius = node.size;
        text.borderColor = "#8B85F4";
        text.borderWidth = 0.2;

        geometry = new THREE.SphereGeometry(node.size);
        material = new THREE.MeshPhongMaterial({
          color: "#ffffff",
          emissive: node.color,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        const sphere = new THREE.Mesh(geometry, material);

        const group = new THREE.Group();
        text.translateY(3 * node.size);
        group.add(text);
        group.add(sphere);

        return group;
      case "hexagonal_prism":
        const imgTexture = new TextureLoader().load(
          require(`../assets/images/ka/White Outline KA.png`),
        );
        imgTexture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: imgTexture,
            transparent: true,
            alphaTest: 0,
          }),
        );
        sprite.scale.set(node.size * 2, node.size * 2, 0);
        return sprite;
      default:
        geometry = new THREE.SphereGeometry(4);
        material = new THREE.MeshPhongMaterial({
          color: node.color,
          emissive: node.color,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        break;
    }
  } else {
    switch (node.shape) {
      case "ka2":
        const radius = 6;
        const shape = new THREE.Shape();
        const angle = Math.PI / 3;
        const points = [];

        for (let i = 0; i < 6; i++) {
          const x = radius * Math.cos(i * angle);
          const y = radius * Math.sin(i * angle);
          points.push(new THREE.Vector2(x, y));
        }

        shape.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          shape.lineTo(points[i].x, points[i].y);
        }
        shape.lineTo(points[0].x, points[0].y);

        const extrudeSettings = {
          depth: 0.4, // Depth of extrusion (thickness of the ring)
          bevelEnabled: true, // Enable bevel to round the edges
          bevelThickness: 0.4, // Thickness of the bevel
          bevelSize: 0.6, // Size of the bevel
          bevelOffset: 0, // Offset of the bevel
          bevelSegments: 5,
          UVGenerator: {
            generateTopUV: (_, vertices, indexA, indexB, indexC) => {
              const ax = vertices[indexA * 3];
              const ay = vertices[indexA * 3 + 1];
              const bx = vertices[indexB * 3];
              const by = vertices[indexB * 3 + 1];
              const cx = vertices[indexC * 3];
              const cy = vertices[indexC * 3 + 1];

              // Normalize UV coordinates to range [0, 1]
              return [
                new THREE.Vector2(
                  ax / (2 * radius) + 0.5,
                  ay / (2 * radius) + 0.5,
                ),
                new THREE.Vector2(
                  bx / (2 * radius) + 0.5,
                  by / (2 * radius) + 0.5,
                ),
                new THREE.Vector2(
                  cx / (2 * radius) + 0.5,
                  cy / (2 * radius) + 0.5,
                ),
              ];
            },
            generateSideWallUV: (
              geometry,
              vertices,
              indexA,
              indexB,
              indexC,
              indexD,
            ) => {
              return [
                new THREE.Vector2(0, 0),
                new THREE.Vector2(1, 0),
                new THREE.Vector2(1, 1),
                new THREE.Vector2(0, 1),
              ];
            },
          },
        };

        geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        const loader = new TextureLoader();
        const texture = loader.load(
          require("../assets/images/ka/Gradient KA.png"),
        );
        texture.colorSpace = THREE.SRGBColorSpace;

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        const materialWithTexture = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false,
          opacity: 1,
        });

        const materialWithoutTexture = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geometry, [
          materialWithTexture,
          materialWithoutTexture,
        ]);

        return mesh;
      case "ka_clickable":
        const imgTexture2 = new TextureLoader().load(
          require(`../assets/images/ka/Purple KA.png`),
        );
        imgTexture2.colorSpace = THREE.SRGBColorSpace;
        const sprite2 = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: imgTexture2,
            transparent: true,
            alphaTest: 0,
          }),
        );
        sprite2.scale.set(node.size * 2, node.size * 2, 0);
        return sprite2;
      case "octahedron":
        const imgTexture3 = new TextureLoader().load(
          require(`../assets/images/ka/Lock KA.png`),
        );
        imgTexture3.colorSpace = THREE.SRGBColorSpace;
        const sprite3 = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: imgTexture3,
            transparent: true,
            alphaTest: 0,
          }),
        );
        sprite3.scale.set(node.size * 2, node.size * 2, 0);
        return sprite3;
      case "sphere":
        geometry = new THREE.SphereGeometry(4);
        material = new THREE.MeshPhongMaterial({
          color: node.color,
          emissive: node.color,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        break;
      case "sphere_text":
        const text = new SpriteText(`${node.value}`, node.size, node.color);
        // text.material.depthWrite = false;
        text.fontWeight = "bold";
        text.backgroundColor = "#03061c";
        text.padding = [1.5 * node.size, node.size];
        text.borderRadius = node.size;
        text.borderColor = "#8B85F4";
        text.borderWidth = 0.2;

        geometry = new THREE.SphereGeometry(node.size);
        material = new THREE.MeshPhongMaterial({
          color: "#ffffff",
          emissive: node.color,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        const sphere = new THREE.Mesh(geometry, material);

        const group = new THREE.Group();
        text.translateY(3 * node.size);
        group.add(text);
        group.add(sphere);

        return group;
      case "ka":
        const imgTexture = new TextureLoader().load(
          require(`../assets/images/ka/White Outline KA.png`),
        );
        imgTexture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: imgTexture,
            transparent: true,
            alphaTest: 0,
          }),
        );
        sprite.scale.set(node.size * 2, node.size * 2, 0);
        return sprite;
      default:
        geometry = new THREE.SphereGeometry(4);
        material = new THREE.MeshPhongMaterial({
          color: node.color,
          emissive: node.color,
          emissiveIntensity: 0.5,
          shininess: 10,
          specular: "#ffffff",
          transparent: false,
          opacity: 1,
        });
        break;
    }
  }

  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}

export function getLinkMesh(link: GraphLink) {
  const { source, target, value } = link;
  const positions = new Float32Array([
    source.x,
    source.y,
    source.z,
    target.x,
    target.y,
    target.z,
  ]);

  const colors = new Float32Array([
    99 / 255,
    68 / 255,
    223 / 255,
    26 / 255,
    222 / 255,
    215 / 255,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // const material = new THREE.LineBasicMaterial({
  //   vertexColors: true,
  //   opacity: 1,
  // });

  //const line = new THREE.Line(geometry, material);
  // TODO: merge line & text

  const text = new SpriteText(value, 2.5, "lightgrey");
  text.fontWeight = "bold";

  text.position.set(
    source.x + (source.x + target.x) / 2,
    source.y + (source.y + target.y) / 2,
    source.z + (source.z + target.z) / 2, // middle point
  );

  return text;
}

export const createNode = (
  typeKey: keyof typeof nodeTypes,
  id: GraphNodeId,
  value?: string,
): GraphNodeData & GraphNodeDynamicData => {
  const data = nodeTypes[typeKey];
  return {
    id,
    glow: Math.random() >= 0.5 ? true : false,
    ...data,
    value,
    expanded: false,
  };
};

export const createLink = (
  source: GraphNodeId,
  target: GraphNodeId,
  type: keyof typeof linkTypes,
  value?: string,
): GraphLinkData & GraphLinkDynamicData => {
  return {
    ...linkTypes[type],
    source,
    target,
    value,
  };
};

type KnowledgeGraphAssertion = Record<string, any>;

export class KnowledgeGraph {
  private nodes: (GraphNodeData & GraphNodeDynamicData)[];
  private links: (GraphLinkData & GraphLinkDynamicData)[];
  private knowledgeCollectionShown = false;
  private resolvedMap: Record<GraphNodeId, number> = {};
  public version: string;

  constructor(
    public readonly ual: string,
    options: {
      assertion?: Record<string, any>[];
      showKnowledgeCollection?: boolean;
    } = {},
    version: string,
  ) {
    this.nodes = [];
    this.links = [];
    this.version = version;

    if (options.assertion) this.addKnowledgeAssets(options.assertion, ual);
  }

  addKnowledgeAssets(
    assertion: KnowledgeGraphAssertion[],
    collectionId: string | undefined,
  ) {
    const idMap = {};

    for (const ka of assertion) {
      idMap[ka["@id"]] = 0;
    }

    for (const ka of assertion) {
      if (!("@id" in ka))
        throw new Error("Unexpected error - no @id field in assertion!");

      const ka_id = ka["@id"];

      for (const relation in ka) {
        if (relation === "@id") continue;

        const props = ka[relation];
        if (!Array.isArray(props) || !props.length)
          throw new Error("Unexpected value in assertion - not an array!");

        let source_id = ka_id;
        if (props.length !== 1) {
          source_id = `${ka_id}_${relation}_props`;
          this.nodes.push(createNode("array", source_id));
          this.links.push(createLink(ka_id, source_id, "directed"));
        }

        for (const prop of props) {
          if (typeof prop === "string") {
          } else {
            let target_id = prop["@id"];
            if (target_id) {
              if (idMap[target_id] === 0) {
                idMap[target_id] = 1;
              }

              if (!(target_id in this.resolvedMap)) {
                let mockNode;
                if (isUal(target_id)) {
                  mockNode = createNode("knowledgeAssetClickable", target_id);
                } else {
                  mockNode = createNode("knowledgeAssetHidden", target_id);
                }
                this.nodes.push(mockNode);
                this.resolvedMap[target_id] = this.nodes.length - 1;
              } else {
                if (this.version === "v6" && !(target_id in idMap)) {
                  target_id = `${target_id}_${Math.random()}`;
                  let mockNode;
                  if (isUal(target_id)) {
                    mockNode = createNode("knowledgeAssetClickable", target_id);
                  } else {
                    mockNode = createNode("knowledgeAssetHidden", target_id);
                  }
                  this.nodes.push(mockNode);
                  this.resolvedMap[target_id] = this.nodes.length - 1;
                }
              }
            } else {
              const value = prop["@value"];
              if (value === undefined) {
                console.error(
                  "Unexpected error - no @value field in property!",
                );
              } else {
                target_id = `${ka_id}_${relation}_prop_${value}`;
                this.nodes.push(createNode("property", target_id, value));
              }
            }

            this.links.push(
              createLink(source_id, target_id, "directed", relation),
            );
          }
        }
      }

      if (this.version === "v6") {
        const node = createNode("knowledgeAssetHidden", ka_id);
        const i = this.resolvedMap[ka_id];
        if (typeof i !== "number") {
          this.nodes.push(node);
          this.resolvedMap[ka_id] = this.nodes.length - 1;
        }
      } else {
        const node = createNode("knowledgeAsset", ka_id);
        const i = this.resolvedMap[ka_id];
        if (typeof i === "number") {
          this.nodes[i] = node;
        } else {
          this.nodes.push(node);
          this.resolvedMap[ka_id] = this.nodes.length - 1;
        }
      }
    }

    if (this.version === "v6") {
      for (const id in idMap) {
        if (idMap[id] === 0) {
          this.nodes.push(createNode("knowledgeCollection", collectionId));
          this.links.push(createLink(collectionId, id, "directedCollection"));
          break;
        }
      }
    }
  }

  get data() {
    return { nodes: this.nodes, links: this.links };
  }
}
