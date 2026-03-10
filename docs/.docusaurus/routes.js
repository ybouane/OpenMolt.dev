import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', 'c04'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '524'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', '212'),
            routes: [
              {
                path: '/docs/api/',
                component: ComponentCreator('/docs/api/', 'c10'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/Agent',
                component: ComponentCreator('/docs/api/classes/Agent', '1d6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/AnthropicProvider',
                component: ComponentCreator('/docs/api/classes/AnthropicProvider', '17c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/BaseProvider',
                component: ComponentCreator('/docs/api/classes/BaseProvider', 'd7c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/GoogleProvider',
                component: ComponentCreator('/docs/api/classes/GoogleProvider', '363'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/Integration',
                component: ComponentCreator('/docs/api/classes/Integration', '9c2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/OpenAIProvider',
                component: ComponentCreator('/docs/api/classes/OpenAIProvider', '228'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/classes/OpenMolt',
                component: ComponentCreator('/docs/api/classes/OpenMolt', '39d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/functions/createFileSystemIntegration',
                component: ComponentCreator('/docs/api/functions/createFileSystemIntegration', 'fb7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/AgentConfig',
                component: ComponentCreator('/docs/api/interfaces/AgentConfig', '063'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/AgentIntegrationConfig',
                component: ComponentCreator('/docs/api/interfaces/AgentIntegrationConfig', 'b23'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/AgentLLMResponse',
                component: ComponentCreator('/docs/api/interfaces/AgentLLMResponse', 'a2a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/AgentState',
                component: ComponentCreator('/docs/api/interfaces/AgentState', '2fc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/APISetup',
                component: ComponentCreator('/docs/api/interfaces/APISetup', '1d0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/BasicCredential',
                component: ComponentCreator('/docs/api/interfaces/BasicCredential', '0ea'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/BasicCredentialSetup',
                component: ComponentCreator('/docs/api/interfaces/BasicCredentialSetup', 'a77'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/BearerCredential',
                component: ComponentCreator('/docs/api/interfaces/BearerCredential', '66b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/BearerCredentialSetup',
                component: ComponentCreator('/docs/api/interfaces/BearerCredentialSetup', 'a4c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/CallToolCommand',
                component: ComponentCreator('/docs/api/interfaces/CallToolCommand', 'f01'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/CommandHistoryEntry',
                component: ComponentCreator('/docs/api/interfaces/CommandHistoryEntry', 'd8b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/CustomCredential',
                component: ComponentCreator('/docs/api/interfaces/CustomCredential', '4f2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/CustomCredentialSetup',
                component: ComponentCreator('/docs/api/interfaces/CustomCredentialSetup', '26d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/DailySchedule',
                component: ComponentCreator('/docs/api/interfaces/DailySchedule', 'c10'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/FinishCommand',
                component: ComponentCreator('/docs/api/interfaces/FinishCommand', 'caf'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/IntegrationDefinition',
                component: ComponentCreator('/docs/api/interfaces/IntegrationDefinition', 'b37'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/IntervalSchedule',
                component: ComponentCreator('/docs/api/interfaces/IntervalSchedule', '485'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/LLMProviderConfig',
                component: ComponentCreator('/docs/api/interfaces/LLMProviderConfig', 'c39'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/LLMResponse',
                component: ComponentCreator('/docs/api/interfaces/LLMResponse', '0c0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/MemoryConfig',
                component: ComponentCreator('/docs/api/interfaces/MemoryConfig', '236'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/MemoryStore',
                component: ComponentCreator('/docs/api/interfaces/MemoryStore', 'd5c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/ModelConfig',
                component: ComponentCreator('/docs/api/interfaces/ModelConfig', 'd5d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/OAuth2Credential',
                component: ComponentCreator('/docs/api/interfaces/OAuth2Credential', '6b0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/OAuth2CredentialSetup',
                component: ComponentCreator('/docs/api/interfaces/OAuth2CredentialSetup', '714'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/OpenMoltConfig',
                component: ComponentCreator('/docs/api/interfaces/OpenMoltConfig', 'e0d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/PlanStep',
                component: ComponentCreator('/docs/api/interfaces/PlanStep', '393'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/PlanSubStep',
                component: ComponentCreator('/docs/api/interfaces/PlanSubStep', '334'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/RequestHumanInputCommand',
                component: ComponentCreator('/docs/api/interfaces/RequestHumanInputCommand', '497'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/ToolContext',
                component: ComponentCreator('/docs/api/interfaces/ToolContext', '157'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/ToolDefinition',
                component: ComponentCreator('/docs/api/interfaces/ToolDefinition', '764'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/UpdateMemoryCommand',
                component: ComponentCreator('/docs/api/interfaces/UpdateMemoryCommand', 'f75'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/UpdatePlanCommand',
                component: ComponentCreator('/docs/api/interfaces/UpdatePlanCommand', 'b4f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/interfaces/WaitCommand',
                component: ComponentCreator('/docs/api/interfaces/WaitCommand', 'dc6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/type-aliases/AgentCommand',
                component: ComponentCreator('/docs/api/type-aliases/AgentCommand', 'edf'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/type-aliases/AgentCredential',
                component: ComponentCreator('/docs/api/type-aliases/AgentCredential', 'a53'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/type-aliases/AgentEventMap',
                component: ComponentCreator('/docs/api/type-aliases/AgentEventMap', '23c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/type-aliases/CredentialSetup',
                component: ComponentCreator('/docs/api/type-aliases/CredentialSetup', '080'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/type-aliases/ScheduleConfig',
                component: ComponentCreator('/docs/api/type-aliases/ScheduleConfig', '3eb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/airtableDefinition',
                component: ComponentCreator('/docs/api/variables/airtableDefinition', '0ab'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/browserUseDefinition',
                component: ComponentCreator('/docs/api/variables/browserUseDefinition', '4a8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/discordDefinition',
                component: ComponentCreator('/docs/api/variables/discordDefinition', '973'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/dropboxDefinition',
                component: ComponentCreator('/docs/api/variables/dropboxDefinition', '99f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/etsyDefinition',
                component: ComponentCreator('/docs/api/variables/etsyDefinition', '678'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/falDefinition',
                component: ComponentCreator('/docs/api/variables/falDefinition', 'c5d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/fileSystemDefinition',
                component: ComponentCreator('/docs/api/variables/fileSystemDefinition', '023'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/geminiMediaModelsDefinition',
                component: ComponentCreator('/docs/api/variables/geminiMediaModelsDefinition', '18d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/githubDefinition',
                component: ComponentCreator('/docs/api/variables/githubDefinition', '347'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/gmailDefinition',
                component: ComponentCreator('/docs/api/variables/gmailDefinition', '3ce'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/googleAdsDefinition',
                component: ComponentCreator('/docs/api/variables/googleAdsDefinition', 'd43'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/googleCalendarDefinition',
                component: ComponentCreator('/docs/api/variables/googleCalendarDefinition', '777'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/googleDriveDefinition',
                component: ComponentCreator('/docs/api/variables/googleDriveDefinition', 'c4f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/googleSheetsDefinition',
                component: ComponentCreator('/docs/api/variables/googleSheetsDefinition', 'b41'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/httpRequestDefinition',
                component: ComponentCreator('/docs/api/variables/httpRequestDefinition', 'b30'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/instagramDefinition',
                component: ComponentCreator('/docs/api/variables/instagramDefinition', '373'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/metaAdsDefinition',
                component: ComponentCreator('/docs/api/variables/metaAdsDefinition', '6c1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/microsoftOutlookDefinition',
                component: ComponentCreator('/docs/api/variables/microsoftOutlookDefinition', '9ba'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/notionDefinition',
                component: ComponentCreator('/docs/api/variables/notionDefinition', 'a60'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/openAiMediaModelsDefinition',
                component: ComponentCreator('/docs/api/variables/openAiMediaModelsDefinition', '896'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/s3Definition',
                component: ComponentCreator('/docs/api/variables/s3Definition', '91b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/shopifyDefinition',
                component: ComponentCreator('/docs/api/variables/shopifyDefinition', 'aef'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/slackDefinition',
                component: ComponentCreator('/docs/api/variables/slackDefinition', '3da'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/stripeDefinition',
                component: ComponentCreator('/docs/api/variables/stripeDefinition', 'fb1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/telegramDefinition',
                component: ComponentCreator('/docs/api/variables/telegramDefinition', '24a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/tiktokDefinition',
                component: ComponentCreator('/docs/api/variables/tiktokDefinition', '4a4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/twilioDefinition',
                component: ComponentCreator('/docs/api/variables/twilioDefinition', '6a8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/whatsappDefinition',
                component: ComponentCreator('/docs/api/variables/whatsappDefinition', '527'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/xDefinition',
                component: ComponentCreator('/docs/api/variables/xDefinition', '26f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api/variables/youtubeDefinition',
                component: ComponentCreator('/docs/api/variables/youtubeDefinition', 'e54'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/concepts/agents',
                component: ComponentCreator('/docs/concepts/agents', 'fe5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/concepts/integrations',
                component: ComponentCreator('/docs/concepts/integrations', '76b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/concepts/memory-scheduling',
                component: ComponentCreator('/docs/concepts/memory-scheduling', '311'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/concepts/providers',
                component: ComponentCreator('/docs/concepts/providers', '7f0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/examples/overview',
                component: ComponentCreator('/docs/examples/overview', 'c2e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started',
                component: ComponentCreator('/docs/getting-started', '565'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', 'be8'),
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
