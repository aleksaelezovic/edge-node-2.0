const { publish, defineConfig } = require('test-results-reporter');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from example-edge-node directory
dotenv.config({ path: path.resolve(__dirname, 'apps/example-edge-node/.env') });

const teamsHookBaseURL = process.env.DKG_Node_Teams_Hook;

const config = defineConfig({
  reports: [
    {
      targets: [
        {
          name: 'teams',
          condition: 'fail',
          inputs: {
            url: teamsHookBaseURL,
            only_failures: true,
            publish: 'test-summary-slim',
            title: 'DKG Node UI Tests Report',
            width: 'Full',
          },
          extensions: [
            {
              name: 'quick-chart-test-summary',
            },
            {
              name: 'hyperlinks',
              inputs: {
                links: [
                  {
                    text: 'Production HTML Report',
                    url: 'https://titan.dplcenter.xyz/view/Tests/job/DKG-Node-Tests/DKG_20Node_20UI_20Report/*zip*/DKG_20Node_20UI_20Report.zip',
                  },
                ],
              },
            },
          ],
        },
      ],
      results: [
        {
          type: 'junit',
          files: ['./apps/example-edge-node/DKG_Node_UI_Tests.xml'],
        },
      ],
    },
  ],
});

publish({ config });
