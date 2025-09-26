const { publish, defineConfig } = require("test-results-reporter");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from agent directory
dotenv.config({ path: path.resolve(__dirname, "apps/agent/.env") });

const teamsHookBaseURL = process.env.DKG_Node_Teams_Hook;

const config = defineConfig({
  reports: [
    {
      targets: [
        {
          name: "teams",
          condition: "fail",
          inputs: {
            url: teamsHookBaseURL,
            only_failures: true,
            publish: "test-summary-slim",
            title: "DKG Node Integration Tests Report",
            width: "Full",
          },
          extensions: [
            {
              name: "quick-chart-test-summary",
            },
            {
              name: "hyperlinks",
              inputs: {
                links: [
                  {
                    text: "Integration Tests HTML Report",
                    url: "https://titan.dplcenter.xyz/view/Tests/job/DKG-Node-Tests/DKG_20Node_20Integration_20Report/*zip*/DKG_20Node_20Integration_20Report.zip",
                  },
                ],
              },
            },
          ],
        },
      ],
      results: [
        {
          type: "mocha",
          files: ["./mochawesome-report/DKG_Node_Integration_Tests.json"],
        },
      ],
    },
  ],
});

publish({ config });
