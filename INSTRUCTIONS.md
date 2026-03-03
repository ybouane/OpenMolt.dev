You need to create OpenMolt a nodejs npm package (npm i openmolt).

OpenMolt is a programmatic AI Agent System. It allows your code to create agents that can perform tasks, make decisions, and interact with their environment.
OpenMolt is the OpenClaw for your code.

It provides a simple and flexible API for creating agents, defining their behavior, skills, integrations, and more. You can use OpenMolt to build intelligent applications, automate tasks, and create complex systems that can learn and adapt over time.


Your goal is to create the OpenMolt package with the following specifications:

How to create an agent programmatically:
```javascript
import OpenMolt from 'openmolt';

// Create an instance of OpenMolt and provide the necessary configuration, such as API keys for LLM providers and integrations.
const om = new OpenMolt({
	llmProviders: {
		openai: {
			apiKey: 'your-openai-api-key'// defaults to process.env.OPENMOLT_OPENAI_API_KEY
		},
		anthropic: {
			apiKey: 'your-anthropic-api-key'// defaults to process.env.OPENMOLT_ANTHROPIC_API_KEY
		},
		google: {
			apiKey: 'your-google-api-key'// defaults to process.env.OPENMOLT_GOOGLE_API_KEY
		},
	},
	integrations: {
		notion: {
			apiKey: 'your-notion-api-key'
		},
	},

	maxSteps: 10, // Set a maximum number of steps for the agent to prevent infinite loops or excessive resource usage.
	verbose: true, // Enable verbose logging for debugging and monitoring the agent's behavior.

});

// Optional: Register custom integrations
om.registerIntegration('myCustomIntegration', {
	name: 'My Custom Integration',

	apiSetup: { // Generic config for api calls
		baseUrl: 'https://api.mycustomintegration.com',
		headers: {
			'Authorization': 'Bearer {{ config.apiKey }}', // apiKey liquid variable will be replaced with the actual API key from the integration config when making requests.
			'Content-Type': 'application/json'
		},
		requestFormat: 'json', // Specify the format for requests (json | form-data | text)
		responseFormat: 'json' // Specify the expected format for responses (json | text | xml)
	},
	credentialSetup: [
		{
			type: 'bearer',
			headers: {
				'Authorization': 'Bearer {{ config.apiKey }}' // apiKey liquid variable will be replaced with the actual API key from the integration config when making requests.
			}

		},
		{
			type: 'custom',
			headers: {
				'X-API-Key': '{{ config.apiKey }}'
			},
			queryParams: {
				'api_key': '{{ config.apiKey }}'
			}
		},
		{
			type: 'oauth2',
			authUrl: 'https://api.mycustomintegration.com/oauth2/authorize',
			tokenUrl: 'https://api.mycustomintegration.com/oauth2/token',
			clientId: '{{ config.clientId }}',
			clientSecret: '{{ config.clientSecret }}',
			refreshToken: '{{ config.refreshToken }}',
			scopes: ['read', 'write'] // Define the scopes for the OAuth2 token for this particular integration. These scopes are different from the tool scopes defined in the integration configuration. These are specifically for the OAuth2 token and will determine what permissions the token has when making API calls to the integration. The agent must have these scopes in the integration configuration to be able to use the tools that require them.
		}
	],

	scopes: {
		'read': 'Allows the agent to read data from the custom integration.',
		'write': 'Allows the agent to write data to the custom integration.'
	},

	tools: [
		{
			handle: 'myCustomTool',
			description: 'A tool for doing something specific with my custom integration.',
			scopes: ['read', 'write'], // Define the scopes required to use this tool. The agent must have these scopes in the integration configuration to use the tool.

			// You can define a tool as an HTTP request
			method: 'POST',
			endpoint: '/do-something', // This will be appended to the baseUrl defined in apiSetup when making requests.
			queryParams: {
				// Define any query parameters needed for the API call here. You can use liquid variables to dynamically insert values from the tool input or integration config when making requests.
			},
			body: {
				param1: '{{ input.param1 }}', // input.param1 liquid variable will be replaced with the actual value from the tool input when making requests.
				param2: '{{ input.param2 }}'
			},
			// Or as a function:
			execute: async (input, context) => {
				// input: This is the input provided to the tool when the agent calls it. It will be an object that matches the structure defined in the inputSchema for this tool. You can use this input to perform actions, make API calls, or execute any logic needed to accomplish the task defined by the tool.
				// context: The context object contains information about the agent's current state, such as its memory, configuration, and any other relevant data that might be needed to execute the tool properly.
			},


			inputSchema: z.object({
				param1: z.string().describe('Description for param1'), // You can add descriptions to the schema fields to provide more context about their purpose and usage.
				param2: z.string().describe('Description for param2')
			}),
			outputSchema: z.object({
				result: z.string().describe('Description for the result field in the output') // Define the expected structure of the tool's output using a Zod schema. This helps the agent understand how to use the tool effectively and what kind of data to expect in return.
			}),
			// Note: the outputSchema is not guaranteed to be followed by the tool's implementation, but it serves as a guideline for the agent to understand what kind of output to expect and how to use it in its reasoning and decision-making process.
		}
	],
});


const myAgent = om.createAgent({
	name: 'My Agent',

	model: 'google:gemini-3.1-pro',

	modelConfig: {
		thinking: true, // Enable or disable the agent's "thinking" process, which allows it to reason and plan its actions before executing them
		search: true, // Enable or disable the agent's ability to perform web searches to gather information. If enabled, the agent can use a built-in search tool that utilizes a search engine API to find relevant information on the web based on the agent's needs and instructions.
		temperature: 0.7, // Model-specific configuration can be provided here. This will be passed to the LLM provider when making requests.
	},

	config: {
		// Adjust the constructor's config as needed.
	},
	
	instructions: `Put your instructions here. This will be used to guide the agent's behavior and decision-making process`,
	// OR
	instructionsPath: 'path/to/instructions.md',

	// Give the agent access to specific integrations. The agent will only be able to use the integrations specified here, even if other integrations are configured in the OpenMolt instance.
	integrations: [
		{
			integration: 'myCustomIntegration',
			credential: {
				type: 'oauth2',
				config: {
					clientId: 'your-client-id',
					clientSecret: 'your-client-secret',
					refreshToken: 'your-refresh-token',
					expiryDate: '2024-12-31T23:59:59Z'
				},
				onTokenRefresh: async (newConfig) => { // only for oauth2 type
					// This function will be called whenever the token for this integration is refreshed. You can use this to update the token in your key management system.
				}
			},
			scopes: [
				'read',
				'write'
			] // if scopes is not defined, or 'all', then the agent will have access to all scopes defined for that integration.
		}
	],
	// Memory configuration allows you to define how the agent's memory works, including long-term and short-term memory. You can specify data storage and update mechanisms for both types of memory.
	memory: {
		longTerm: {
			data: '',
			onUpdate: async (newData) => {
				// This function will be called whenever the long-term memory is updated.
				// You can use this to perform actions based on changes in the long-term memory.
			}
		},
		shortTerm: {
			data: '',
			onUpdate: async (newData) => { }
		}
	},


	// (optional) This function will be called whenever the agent requests input from a human. You can use this to provide a way for the agent to ask questions or seek clarification from the user.
	// You can set it to false if you want to disable human input requests.
	onHumanInputRequest: async (input) => {
		// Handle the human input request here. You can display a prompt to the user and return their response.
		// For example:
		const userResponse = await getUserInput(input); // Implement getUserInput to get input from the user.
		return userResponse;
	},

	outputSchema: z.object({
		result: z.string().describe('Description for the result field in the output') // Define the expected structure of the agent's output using a Zod schema. This helps ensure that the agent's responses are consistent and can be easily processed by your application.
	})
});

let output = await myAgent.run(
	// Feed any initial input to the agent here. This can be used to provide context or information that the agent needs to perform its task.
	// Could be a string, an object, or any data structure that your agent can work with, depending on how you design your agent's behavior and instructions.
	`Initial input for the agent to start with`
);




/* Optional: Attach event listeners to monitor the agent's behavior and interactions. This can be useful for debugging, logging, or triggering actions based on specific events in the agent's lifecycle. */
myAgent.on('llmOutput', (e) => console.log('LLM OUTPUT', e.output)); // Can be used to track the raw output from the language model, which can be useful to track the cost of the LLM calls, monitor the agent's reasoning process, or debug any issues with the agent's behavior. Format depends on the LLM provider's response structure, but it typically includes the generated text and any relevant metadata about the LLM call.
myAgent.on('commandsQueued', (e) => console.log('COMMANDS QUEUED', e.commands));
myAgent.on('tool:call', (e) => console.log('CALL', e.tool));
myAgent.on('tool:response', (e) => console.log('RESPONSE', e.tool, e.response));
myAgent.on('planUpdate', (e) => console.log('PLAN UPDATE', e.plan));
myAgent.on('finish', (e) => console.log('FINISH', e.plan)); // Same as the 'run' method's return value, but emitted as an event.


/* Schedule */
// You can also schedule the agent to run at specific intervals or times using the schedule method. This allows you to automate the agent's execution without needing to trigger it manually each time.

myAgent.schedule({
	type: 'interval',
	value: 60 * 60, // (seconds) Run the agent every hour.
});
myAgent.schedule({
	type: 'daily',

	dayOfWeek: [1, 3, 5], // Run the agent every Monday, Wednesday, and Friday. Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
	// Or
	dayOfMonth: [1, 15], // Run the agent on the 1st and 15th of every month.

	hour: 14, minute: 0 // Run the agent at 2:00 PM every scheduled day.
	timeZone: 'America/New_York' // Optional: Specify the timezone for the scheduled execution. If not provided, it will default to the server's timezone.
});

// calling .schedule() will return a schedule ID that you can use to manage the schedule, such as canceling it if needed. (via a .cancelSchedule(scheduleId) method)
// The schedule will be handled internally by the OpenMolt instance, which will keep track of all scheduled executions and trigger the agent's run method at the appropriate times based on the defined schedule configuration.


```




Here's how the agent's execution flow will work:
- There will be a loop that continues until the agent has completed its task, reaches the maximum number of steps defined in the OpenMolt configuration, or encounters a stopping condition defined in the instructions.
- In each iteration of the loop, the agent will be provided with:
	- A "Maestro" prompt that explains the whole process of how the agent should think, plan, and execute its actions. (The maestro prompt corresponds to the system prompt in a typical LLM interaction)
	- An input structure that contains the current state of the agent:
		- Agent's instructions and details
		- Input provided to the agent at the start of the execution (if any)
		- Available tools and integrations
		- Memory (short-term and long-term)
		- Previous commands and their outputs
	- The agent will use this information to:
		- Think and plan its next actions based on the instructions, available tools, and its current state.
		- Decide which tools to use and how to use them, including what input to provide to the tools.
		- Define a list of commands to execute, which may include tool calls, API requests, or any other actions needed to accomplish the task.
	- The agent will then execute the defined commands, which may involve making API calls to the configured integrations, using the tools defined in those integrations, and updating its plan and memory based on the results of those actions.
	- After executing the commands, the agent will receive the outputs and update its state accordingly, which will be used in the next iteration of the loop for further thinking, planning, and action execution until it reaches a stopping condition or completes its task.
- The maestro prompt should insist on always outputting valid JSON like { "commands": [ ... ] } and never outputting anything that is not part of the JSON response to ensure that the agent's output can be easily parsed and processed by the system executing the agent's commands. This helps maintain a clear and structured communication format between the agent and the execution environment, allowing for more reliable and efficient handling of the agent's actions and responses.
- Make the prompt as detailed as possible to guide the agent's behavior effectively, including instructions on how to use the available tools, how to update its plan and memory, and how to decide when to request human input if necessary. The more comprehensive and clear the maestro prompt is, the better the agent will be able to perform its tasks and make informed decisions based on its instructions and current state.

Here are the possible commands that the agent can execute:
- callTool: This command allows the agent to call a specific tool defined in the integrations. The agent must specify the tool handle, the input for the tool, and any necessary configuration for the tool call. The agent will receive the output from the tool after execution, which it can use for further reasoning and planning.
- wait: This command allows the agent to pause its execution for a specified amount of time. The agent can use this to wait for certain conditions to be met or to create delays between actions. A wait command should not exceed 1 minute in duration to prevent excessive delays in the agent's execution.
- updatePlan: This command allows the agent to update its current plan based on new information or changes in the environment. The agent can provide a new plan or modify the existing plan to adapt to the current situation and improve its chances of successfully completing its task.
- updateMemory: This command allows the agent to update its long-term or short-term memory with new information. The agent can specify which type of memory to update and provide the new data to be stored. This can help the agent retain important information over time and use it for future reasoning and decision-making processes.
	- When updating the memory, give two options:
		- replace: This option allows the agent to completely replace the existing memory with the new data provided. This can be useful when the new information is more accurate or relevant than the previous memory, and the agent wants to discard the old data.
		- append: This option allows the agent to add the new data to the existing memory without removing the previous information. This can be useful for retaining a history of information or when the new data is complementary to the existing memory rather than a replacement.
- requestHumanInput: This command allows the agent to request input from a human user. The agent can provide a prompt or question for the user, and it will wait for the user's response before continuing with its execution. This can be useful for situations where the agent needs clarification, additional information, or confirmation from the user before proceeding with its actions. This command is usually a last resort for the agent when it has exhausted all other options and needs human assistance to move forward with its task. It should be used judiciously to avoid excessive interruptions in the agent's workflow and to ensure a smooth user experience. This command should only be described if the onHumanInputRequest function is defined in the agent's configuration, as it relies on that function to handle the human input request and provide a response back to the agent for further processing.
- finish: This command indicates that the agent has completed its task and will stop executing further commands. The agent can provide a final output when issuing the finish command, which will be returned as the result of the agent's execution. The output should follow the structure defined in the agent's outputSchema to ensure consistency and proper handling of the result. The finish command should also provide a "status" field in the output to indicate whether the task was completed successfully or if there were any issues encountered during execution. This can help in monitoring and debugging the agent's behavior. Finally it can provide a "humanMessage" field in the output, which can be used to communicate any important information or instructions to the user after the agent has completed its task. This can enhance the user experience and provide clarity on the outcome of the agent's execution.


A plan should look like this:
```json
[ // Array of steps
	{
		"name": "Name of the step, describing the action to be taken",
		"status": "pending | inProgress | completed | failed",
		"notes": "Additional details about the step, can also be updated to contain errors or important information during the execution of the step",
		"subSteps": [ // Optional array of sub-steps, allowing for a hierarchical structure in the plan to break down complex tasks into smaller, manageable actions.
			{
				"name": "Name of the sub-step",
				"status": "pending | inProgress | completed | failed",
				"notes": "Additional details about the sub-step"
			}
		]
	}
]
```
Only one-level deep of sub-steps is allowed.


Classes you should create:
- OpenMolt: The main class for the package, responsible for managing agents, integrations, and overall configuration.
- Agent: A class representing an individual agent, responsible for its own behavior, memory, and execution flow.
- Integration: A class representing an integration, responsible for defining tools, API setup, and scopes for a specific service or platform.
	- This class is initialized with an object as described by the registerIntegration method in the OpenMolt class, which allows users to add custom integrations to their OpenMolt instance.
- LLMProvider: A class representing a language model provider, responsible for handling API interactions with the LLM service and providing methods for generating responses based on prompts and input.
	- Its parameters should be consistent with the llmProviders configuration in the OpenMolt constructor, allowing for easy integration of different LLM services by simply providing the necessary API keys and selecting the desired model. The modelConfig should have a consistent structure across different LLM providers to allow for seamless switching between providers without needing to change the agent's configuration or behavior. You can however allow for provider-specific configuration options as needed, but the core parameters like temperature, thinking, etc. should be standardized to ensure compatibility across different LLM services.


Dependencies:
- Zod
- LiquidJS

Define these llm providers:
- OpenAI -> OPENMOLT_OPENAI_API_KEY
- Anthropic -> OPENMOLT_ANTHROPIC_API_KEY
- Google Gemini -> OPENMOLT_GOOGLE_API_KEY


HTTP Tool Calls:
- For tools defined as HTTP requests, you should implement a generic function in the Integration class that takes the tool's configuration (method, endpoint, query parameters, body, etc.) merges it with the integration's API setup (baseUrl, headers, etc.).
	- Inject the input values into those fields using LiquidJS to generate the final API request configuration
	- Separately inject the config values into the credential's setup fields (depending on the credential type) to generate the necessary authentication details for the API request.
	- Merge the generated authentication details with the API request configuration to create the final configuration for the API call.
	- Handle objects recursively, meaning that if the body of the request contains nested objects, the function should be able to process those as well and replace any liquid variables with the appropriate values from the tool input or integration config.
	- If a value is set as "{{ input.someField }}" then detect that format using regex and replace it with the actual value from the tool input as is without resorting to liquid. The reason is to keep the same type as the original value in the input since liquid would convert it to a string.
	- Use the native fetch API to make the HTTP request based on the generated configuration.



- The code you generate should be in TypeScript to ensure type safety and better developer experience.
- Make the package modular and extensible, allowing users to easily add new integrations, llm providers... without needing to modify the core codebase.
- Use tabs
- Use ES6 syntax -> import/export & async/await
- Use native fetch
- Make the Library ready for documentation generation using TypeDoc + Docusaurus, with clear comments for all classes, methods, and parameters to ensure that users can easily understand how to use the package and its features.
	- Docs are a separate folder and not bundled with npm publish.


The library should also support:
`npx openmolt agentConfig.json` or `npx openmolt agentConfig.js`
- In it you can add a "schedules" property (array of schedule objects) that defines the scheduling configuration for the agent, allowing users to easily set up scheduled executions.
- As for the api keys, you can allow users to provide them through environment variables, a .env file, or directly in the agentConfig.json for flexibility. You can also implement a priority system for loading the API keys, where environment variables take precedence over the agentConfig.json to allow for more secure handling of sensitive information.


After creating the project and the library, you must also create some built-in integrations and tools for these services / APIs:
- Notion
- Fal.ai (You can use their built-in sdk, you don't have to use HTTP requests for this one)
- Google Calendar
- Gmail
- Google Drive
- Google Sheets
- Microsoft Outlook
- Nano Banana & Veo3 via Gemini's API
- OpenAI for GPT-Image models
- Discord
- Slack
- Telegram
- Whatsapp
- X
- Instagram
- Twilio
- Airtable
- TikTok
- Youtube
- S3 API
- Shopify
- Stripe
- Etsy
- Github
- Dropbox
- Google Ads
- Meta Ads
- browser-use.com's API for web browsing capabilities
- HTTP Request (a generic integration)
- FileSystem - with tools for reading, writing, and managing files and directories on the local filesystem. This can be useful for agents that need to work with data stored in files, such as reading input data, writing output results, or managing configuration files.  This integration should not be available by default but should allow something like:
```javascript
om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration('path/to/base/directory'));
```
And only allow access to that specific directory. You can also allow an array of directories for more flexibility.

When creating the integrations, you must make sure to implement them based on the latest API Versions and best practices for each service, ensuring that the tools provided are functional, efficient, and secure.
You must make the implementations full and complete, not just a base project/structure, make the actual full working implementation in its entirety. Don't leave any placeholders or incomplete code for the integrations, as they should be ready to use out of the box for agents created with OpenMolt. You may need to research each of the APIs and their documentation to ensure that you are implementing the integrations correctly and following the recommended guidelines for each service.


The integrations should be js files that define the tools, API setup, and scopes for each service. They should be put under an "integrations" folder in the project, and they should be imported and registered in the OpenMolt class to be available for agents to use by default.
For most of these integrations, you must not use "execute" functions for the tools, but rather define them as HTTP requests with the necessary configuration (method, endpoint, query parameters, body, etc.) to allow the agent to use them without needing custom code execution for each tool call. This will make the tools more flexible and easier to maintain, as you can simply update the API configuration as needed without changing the underlying code.


When making this implementation, you can create an Architecture.md file to outline the structure of the project, the relationships between different classes and components, and the overall design of the system. This can help ensure that the implementation is organized, modular, and follows best practices for software development. It can also serve as a reference for future development and maintenance of the OpenMolt package.

Make no mistakes.