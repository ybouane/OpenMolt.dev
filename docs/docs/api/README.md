**openmolt**

***

# openmolt

## Example

```typescript
import OpenMolt from 'openmolt';
import { z } from 'zod';

const om = new OpenMolt({
  llmProviders: { openai: { apiKey: 'sk-...' } },
  maxSteps: 15,
});

const agent = om.createAgent({
  name: 'Researcher',
  model: 'openai:gpt-4o',
  instructions: 'You are a helpful research assistant.',
  outputSchema: z.object({ summary: z.string() }),
});

const result = await agent.run('Summarise the key benefits of TypeScript.');
console.log(result);
```

## Classes

- [Agent](classes/Agent.md)
- [AnthropicProvider](classes/AnthropicProvider.md)
- [BaseProvider](classes/BaseProvider.md)
- [GoogleProvider](classes/GoogleProvider.md)
- [Integration](classes/Integration.md)
- [OpenAIProvider](classes/OpenAIProvider.md)
- [OpenMolt](classes/OpenMolt.md)

## Interfaces

- [AgentConfig](interfaces/AgentConfig.md)
- [AgentIntegrationConfig](interfaces/AgentIntegrationConfig.md)
- [AgentLLMResponse](interfaces/AgentLLMResponse.md)
- [AgentState](interfaces/AgentState.md)
- [APISetup](interfaces/APISetup.md)
- [BasicCredential](interfaces/BasicCredential.md)
- [BasicCredentialSetup](interfaces/BasicCredentialSetup.md)
- [BearerCredential](interfaces/BearerCredential.md)
- [BearerCredentialSetup](interfaces/BearerCredentialSetup.md)
- [CallToolCommand](interfaces/CallToolCommand.md)
- [CommandHistoryEntry](interfaces/CommandHistoryEntry.md)
- [CustomCredential](interfaces/CustomCredential.md)
- [CustomCredentialSetup](interfaces/CustomCredentialSetup.md)
- [DailySchedule](interfaces/DailySchedule.md)
- [FinishCommand](interfaces/FinishCommand.md)
- [IntegrationDefinition](interfaces/IntegrationDefinition.md)
- [IntervalSchedule](interfaces/IntervalSchedule.md)
- [LLMProviderConfig](interfaces/LLMProviderConfig.md)
- [LLMResponse](interfaces/LLMResponse.md)
- [MemoryConfig](interfaces/MemoryConfig.md)
- [MemoryStore](interfaces/MemoryStore.md)
- [ModelConfig](interfaces/ModelConfig.md)
- [OAuth2Credential](interfaces/OAuth2Credential.md)
- [OAuth2CredentialSetup](interfaces/OAuth2CredentialSetup.md)
- [OpenMoltConfig](interfaces/OpenMoltConfig.md)
- [PlanStep](interfaces/PlanStep.md)
- [PlanSubStep](interfaces/PlanSubStep.md)
- [RequestHumanInputCommand](interfaces/RequestHumanInputCommand.md)
- [ToolContext](interfaces/ToolContext.md)
- [ToolDefinition](interfaces/ToolDefinition.md)
- [UpdateMemoryCommand](interfaces/UpdateMemoryCommand.md)
- [UpdatePlanCommand](interfaces/UpdatePlanCommand.md)
- [WaitCommand](interfaces/WaitCommand.md)

## Type Aliases

- [AgentCommand](type-aliases/AgentCommand.md)
- [AgentCredential](type-aliases/AgentCredential.md)
- [AgentEventMap](type-aliases/AgentEventMap.md)
- [CredentialSetup](type-aliases/CredentialSetup.md)
- [ScheduleConfig](type-aliases/ScheduleConfig.md)

## Variables

- [airtableDefinition](variables/airtableDefinition.md)
- [browserUseDefinition](variables/browserUseDefinition.md)
- [discordDefinition](variables/discordDefinition.md)
- [dropboxDefinition](variables/dropboxDefinition.md)
- [etsyDefinition](variables/etsyDefinition.md)
- [falDefinition](variables/falDefinition.md)
- [fileSystemDefinition](variables/fileSystemDefinition.md)
- [geminiMediaModelsDefinition](variables/geminiMediaModelsDefinition.md)
- [githubDefinition](variables/githubDefinition.md)
- [gmailDefinition](variables/gmailDefinition.md)
- [googleAdsDefinition](variables/googleAdsDefinition.md)
- [googleCalendarDefinition](variables/googleCalendarDefinition.md)
- [googleDriveDefinition](variables/googleDriveDefinition.md)
- [googleSheetsDefinition](variables/googleSheetsDefinition.md)
- [httpRequestDefinition](variables/httpRequestDefinition.md)
- [instagramDefinition](variables/instagramDefinition.md)
- [metaAdsDefinition](variables/metaAdsDefinition.md)
- [microsoftOutlookDefinition](variables/microsoftOutlookDefinition.md)
- [notionDefinition](variables/notionDefinition.md)
- [openAiMediaModelsDefinition](variables/openAiMediaModelsDefinition.md)
- [s3Definition](variables/s3Definition.md)
- [shopifyDefinition](variables/shopifyDefinition.md)
- [slackDefinition](variables/slackDefinition.md)
- [stripeDefinition](variables/stripeDefinition.md)
- [telegramDefinition](variables/telegramDefinition.md)
- [tiktokDefinition](variables/tiktokDefinition.md)
- [twilioDefinition](variables/twilioDefinition.md)
- [xDefinition](variables/xDefinition.md)
- [whatsappDefinition](variables/whatsappDefinition.md)
- [youtubeDefinition](variables/youtubeDefinition.md)

## Functions

- [createFileSystemIntegration](functions/createFileSystemIntegration.md)

## References

### default

Renames and re-exports [OpenMolt](classes/OpenMolt.md)
