import GraphView from "@/components/GraphView";

export default function Testing() {
  return (
    <GraphView
      ual="123"
      assertion={[
        {
          "@id": "urn:ka:node09-46bca8a1-e04e-4b3a-a59c-87dc9a5f1312",
          "http://schema.org/name": [
            {
              "@value": "DKG Orbit 1754906131",
            },
          ],
          "http://schema.org/description": [
            {
              "@value": "An in-depth look into Orbit technologies.",
            },
          ],
          "@type": ["http://schema.org/CreativeWork"],
        },
      ]}
    />
  );
}
