import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', '32d'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'dc6'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '436'),
            routes: [
              {
                path: '/api/',
                component: ComponentCreator('/api/', '91f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/Agent',
                component: ComponentCreator('/api/classes/Agent', 'd8c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/AnthropicProvider',
                component: ComponentCreator('/api/classes/AnthropicProvider', 'f40'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/BaseProvider',
                component: ComponentCreator('/api/classes/BaseProvider', 'e4b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/GoogleProvider',
                component: ComponentCreator('/api/classes/GoogleProvider', 'c1e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/Integration',
                component: ComponentCreator('/api/classes/Integration', '7d6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/OpenAIProvider',
                component: ComponentCreator('/api/classes/OpenAIProvider', 'd6e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/classes/OpenMolt',
                component: ComponentCreator('/api/classes/OpenMolt', '452'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/functions/createFileSystemIntegration',
                component: ComponentCreator('/api/functions/createFileSystemIntegration', '003'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/AgentConfig',
                component: ComponentCreator('/api/interfaces/AgentConfig', 'faa'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/AgentIntegrationConfig',
                component: ComponentCreator('/api/interfaces/AgentIntegrationConfig', '3b8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/AgentLLMResponse',
                component: ComponentCreator('/api/interfaces/AgentLLMResponse', '6a4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/AgentState',
                component: ComponentCreator('/api/interfaces/AgentState', '2d3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/APISetup',
                component: ComponentCreator('/api/interfaces/APISetup', '2e2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/BasicCredential',
                component: ComponentCreator('/api/interfaces/BasicCredential', '0fd'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/BasicCredentialSetup',
                component: ComponentCreator('/api/interfaces/BasicCredentialSetup', '067'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/BearerCredential',
                component: ComponentCreator('/api/interfaces/BearerCredential', '673'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/BearerCredentialSetup',
                component: ComponentCreator('/api/interfaces/BearerCredentialSetup', 'b42'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/CallToolCommand',
                component: ComponentCreator('/api/interfaces/CallToolCommand', 'd25'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/CommandHistoryEntry',
                component: ComponentCreator('/api/interfaces/CommandHistoryEntry', '471'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/CustomCredential',
                component: ComponentCreator('/api/interfaces/CustomCredential', 'c20'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/CustomCredentialSetup',
                component: ComponentCreator('/api/interfaces/CustomCredentialSetup', '0b5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/DailySchedule',
                component: ComponentCreator('/api/interfaces/DailySchedule', '4c8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/FinishCommand',
                component: ComponentCreator('/api/interfaces/FinishCommand', '921'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/IntegrationDefinition',
                component: ComponentCreator('/api/interfaces/IntegrationDefinition', 'aed'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/IntervalSchedule',
                component: ComponentCreator('/api/interfaces/IntervalSchedule', '1f2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/LLMProviderConfig',
                component: ComponentCreator('/api/interfaces/LLMProviderConfig', '91f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/LLMResponse',
                component: ComponentCreator('/api/interfaces/LLMResponse', '145'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/MemoryConfig',
                component: ComponentCreator('/api/interfaces/MemoryConfig', 'efd'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/MemoryStore',
                component: ComponentCreator('/api/interfaces/MemoryStore', 'bbf'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/ModelConfig',
                component: ComponentCreator('/api/interfaces/ModelConfig', '2b8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/OAuth2Credential',
                component: ComponentCreator('/api/interfaces/OAuth2Credential', '404'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/OAuth2CredentialSetup',
                component: ComponentCreator('/api/interfaces/OAuth2CredentialSetup', '775'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/OpenMoltConfig',
                component: ComponentCreator('/api/interfaces/OpenMoltConfig', '28d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/PlanStep',
                component: ComponentCreator('/api/interfaces/PlanStep', '4b9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/PlanSubStep',
                component: ComponentCreator('/api/interfaces/PlanSubStep', 'bec'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/RequestHumanInputCommand',
                component: ComponentCreator('/api/interfaces/RequestHumanInputCommand', '109'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/ToolContext',
                component: ComponentCreator('/api/interfaces/ToolContext', 'dd4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/ToolDefinition',
                component: ComponentCreator('/api/interfaces/ToolDefinition', '35a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/UpdateMemoryCommand',
                component: ComponentCreator('/api/interfaces/UpdateMemoryCommand', '6ae'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/UpdatePlanCommand',
                component: ComponentCreator('/api/interfaces/UpdatePlanCommand', 'b09'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/interfaces/WaitCommand',
                component: ComponentCreator('/api/interfaces/WaitCommand', '420'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/type-aliases/AgentCommand',
                component: ComponentCreator('/api/type-aliases/AgentCommand', '0d8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/type-aliases/AgentCredential',
                component: ComponentCreator('/api/type-aliases/AgentCredential', 'dff'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/type-aliases/AgentEventMap',
                component: ComponentCreator('/api/type-aliases/AgentEventMap', 'e88'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/type-aliases/CredentialSetup',
                component: ComponentCreator('/api/type-aliases/CredentialSetup', 'c7e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/type-aliases/ScheduleConfig',
                component: ComponentCreator('/api/type-aliases/ScheduleConfig', '90c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/airtableDefinition',
                component: ComponentCreator('/api/variables/airtableDefinition', 'bb5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/browserUseDefinition',
                component: ComponentCreator('/api/variables/browserUseDefinition', 'e93'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/discordDefinition',
                component: ComponentCreator('/api/variables/discordDefinition', '10f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/dropboxDefinition',
                component: ComponentCreator('/api/variables/dropboxDefinition', 'ff6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/etsyDefinition',
                component: ComponentCreator('/api/variables/etsyDefinition', '01a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/falDefinition',
                component: ComponentCreator('/api/variables/falDefinition', '04b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/fileSystemDefinition',
                component: ComponentCreator('/api/variables/fileSystemDefinition', '69f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/geminiMediaDefinition',
                component: ComponentCreator('/api/variables/geminiMediaDefinition', '5a2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/githubDefinition',
                component: ComponentCreator('/api/variables/githubDefinition', '4ff'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/gmailDefinition',
                component: ComponentCreator('/api/variables/gmailDefinition', '021'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/googleAdsDefinition',
                component: ComponentCreator('/api/variables/googleAdsDefinition', '679'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/googleCalendarDefinition',
                component: ComponentCreator('/api/variables/googleCalendarDefinition', '04d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/googleDriveDefinition',
                component: ComponentCreator('/api/variables/googleDriveDefinition', 'a76'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/googleSheetsDefinition',
                component: ComponentCreator('/api/variables/googleSheetsDefinition', '40a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/httpRequestDefinition',
                component: ComponentCreator('/api/variables/httpRequestDefinition', 'a64'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/instagramDefinition',
                component: ComponentCreator('/api/variables/instagramDefinition', 'ac8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/metaAdsDefinition',
                component: ComponentCreator('/api/variables/metaAdsDefinition', '618'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/microsoftOutlookDefinition',
                component: ComponentCreator('/api/variables/microsoftOutlookDefinition', '247'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/notionDefinition',
                component: ComponentCreator('/api/variables/notionDefinition', '877'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/openaiImagesDefinition',
                component: ComponentCreator('/api/variables/openaiImagesDefinition', '5c4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/s3Definition',
                component: ComponentCreator('/api/variables/s3Definition', 'cf5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/shopifyDefinition',
                component: ComponentCreator('/api/variables/shopifyDefinition', 'e82'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/slackDefinition',
                component: ComponentCreator('/api/variables/slackDefinition', '521'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/stripeDefinition',
                component: ComponentCreator('/api/variables/stripeDefinition', '212'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/telegramDefinition',
                component: ComponentCreator('/api/variables/telegramDefinition', 'd04'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/tiktokDefinition',
                component: ComponentCreator('/api/variables/tiktokDefinition', 'c1d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/twilioDefinition',
                component: ComponentCreator('/api/variables/twilioDefinition', 'bcb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/twitterDefinition',
                component: ComponentCreator('/api/variables/twitterDefinition', '1ab'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/whatsappDefinition',
                component: ComponentCreator('/api/variables/whatsappDefinition', 'f9a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api/variables/youtubeDefinition',
                component: ComponentCreator('/api/variables/youtubeDefinition', 'ac7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/concepts/agents',
                component: ComponentCreator('/concepts/agents', '061'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/concepts/integrations',
                component: ComponentCreator('/concepts/integrations', '95d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/concepts/memory-scheduling',
                component: ComponentCreator('/concepts/memory-scheduling', '3ff'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/concepts/providers',
                component: ComponentCreator('/concepts/providers', 'bce'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/examples/overview',
                component: ComponentCreator('/examples/overview', '0f7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/getting-started',
                component: ComponentCreator('/getting-started', 'ac2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/',
                component: ComponentCreator('/', '7da'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
