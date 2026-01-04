// Example MVS data for the simple viewer
export const exampleMVSData = {
  root: {
    kind: "root",
    children: [
      {
        kind: "download",
        params: {
          url: "https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif",
        },
        children: [
          {
            kind: "parse",
            params: { format: "bcif" },
            children: [
              {
                kind: "structure",
                params: { type: "model" },
                children: [
                  {
                    kind: "component",
                    params: {
                      selector: "polymer",
                    },
                    children: [
                      {
                        kind: "representation",
                        params: {
                          type: "cartoon",
                        },
                        children: [
                          {
                            kind: "color",
                            params: {
                              color: "green",
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  metadata: { title: "Example Structure", version: "1" },
};

// Default code for the editor
export const defaultCode = `const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'green' });

structure
  .component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#cc3399' });`;
