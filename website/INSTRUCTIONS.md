You need to generate the website for openmolt.dev.

The website needs to be contained under the `website/` directory.

Coding style guidelines:
- It must be a react-router (@lts) app.
- Use await/async & try-catch
- Use Tabs.
- Use Vanilla CSS, no frameworks.
	- Use CSS variables for theming.
	- Try avoiding using classes (only use them as modifiers), prefer custom element.
	- Use nested CSS definitions for better organization. E.g. `integrations-slider { ... integration-icon { ... } }`
- Never use Fetcher, always use the native Fetch API with async/await.
- Use fs-routes for routing (folder: /routes)


Create a landing page for the OpenMolt website that includes:
- A hero section with
	- Logo
	- OpenMolt written in a catchy bold font
	- a catchy headline, a brief description of OpenMolt
	- a subheadline
	- Call to action buttons: QuickStart | Documentation | Playground
- A QuickStart section with a code snippet that demonstrates how to create an agent with OpenMolt and run it. Show the `npm i openmolt`. Then use the hello world example from the README.md.
- A features section that highlights the key features of OpenMolt with icons and brief descriptions.
- An integrations section that showcases the various integrations available with OpenMolt, using a slider or grid layout to display the integration logos and names. The logos will be provided under /website/public/images/integrations/:integration.png (accessed as `/images/integrations/${integration}.png`). Store the list of integrations in an array and map over it to generate the UI. I will take care of adding the actual logo files later.
- A section showing the features / benefits of using OpenMolt.
	- Explain how security works (scopes, how the llm doesnt have direct access to credentials, etc.)
	- Explain how configurable the agents are (instructions, model, tools, output schema, etc.)
	- Memory
	- Scheduling
	- ...
- A use cases section that describes different scenarios where OpenMolt can be used, with examples and benefits.
- Make sure to include the following links:
	- Link to the documentation /docs/
	- Link to the GitHub repo: https://github.com/ybouane/openmolt.dev
	- Link to my X (Twitter): @ybouane -> https://x.com/ybouane
- Use the logo at /website/public/images/logo.png.
	- The logo's colors are: Main: #3da0e6 Stroke: #0f4e7d
- The body bg color should be: #050810
- The background should also contain stars:
    background-image: radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, .8), transparent), radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, .5), transparent), radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, .6), transparent), radial-gradient(2px 2px at 130px 80px, rgba(255, 255, 255, .4), transparent), radial-gradient(1px 1px at 160px 120px, rgba(255, 255, 255, .7), transparent), radial-gradient(2px 2px at 200px 60px, rgba(0, 229, 204, .6), transparent), radial-gradient(1px 1px at 250px 150px, rgba(255, 255, 255, .5), transparent), radial-gradient(2px 2px at 300px 40px, rgba(255, 77, 77, .4), transparent);
    background-size: 350px 200px;
    animation: twinkle 8s ease-in-out infinite alternate;

with a twinkle animation: 
0% {
    opacity: .4;
}
100% {
    opacity: .7;
}
when scrolling, background should stay fixed.
(Apply the bg on ::after of the body and make sure it covers the entire page, fixed and under the content)


The /docs/ routes are handled automatically by Docusaurus, so you only need to generate the main website. The source files are in the `website/` directory. The /docs/ files are generated from the `docs/` directory, which is a separate Docusaurus project.
You can put links to the documentation in the website, but you don't need to generate the documentation itself.



You must also generate a playground page at /playground that allows users to create and test agents directly in the browser.

The playground should present a "form" where users can input:
- Agent Name
- Instructions
- Model (dropdown with options: gpt-@latest, gpt-@latest-mini, claude-opus-@latest, claude-sonnet-@latest, gemini-@latest-flash, gemini-@latest-pro) use the latest versions available by replacing @latest with the actual latest version numbers.
	- API Key input for the selected model's provider (e.g. OpenAI, Anthropic, Google)
- Integrations: A field to pick integrations from a list of available integrations (the field should be scrollable, have a search field to filter the options, allow multiple selections).
	- Configuration for the integrations that are selected like api key inputs.
	- Selecting which scopes the agent can access. (By default all scopes should be selected)
- Put the playground websockets server under: /playground-server and the dist under /playground-dist

- Input Request: A text area where users can input the request they want to run with the agent.

[Run Agent]

When the user clicks "Run Agent", the playground should open a websocket connection to /api/playground send a JSON payload with the agent configuration and the input request, and display the responses / events from the agent in real-time in a console-like interface.
	- Make it look nice with different colors for user input, agent responses, tool calls, errors, etc.
	- Handle loading states, errors, etc. gracefully.
	- Spinners where appropriate.
	- Proper formatting of the plan and tool calls.
	- Final output

The playground backend (which you also need to generate) should handle the websocket connection, receive the agent configuration and input request, create an agent instance with the provided configuration, run the agent with the input request, and send the responses / events back to the frontend in real-time.
Once the agent run is complete, the backend should close the websocket connection.

Use the provided API keys to run the agents in the playground. If not provided, return an error message indicating that the API key is missing.

Make sure to handle security properly, especially when dealing with API keys and user input. Do not log sensitive information. Validate and sanitize all inputs with zod.


Only allow certain integrations to be used in the playground for security reasons (e.g. no file system access). You can create a predefined list of allowed integrations and only allow users to select from that list.

The list should be the handles of the integrations while the actual details of the integrations should be extracted directly from /src/integrations/index.ts to ensure consistency between the playground and the actual integrations available in OpenMolt. Assume logos for the integrations are available at `/images/integrations/${handle}.png`.

You should also add a Code section in the playground that shows the generated code for the agent based on the input configuration, so users can see how to use the OpenMolt library to create the same agent in their own codebase.


Make the overall design clean, modern, and visually appealing while simple and easy to navigate.


Server config:
- Main server should listen on port 62053 in dev mode
- Playground backend endpoint should listen on port 62052 (websocket) at /api/playground
- Listen on localhost with allowedHosts set to openmolt.dev

Before you get started, make sure to analyze the Architecture.md file and any other relevant files to understand the overall architecture of OpenMolt and how the different components interact with each other. This will help you design the website and playground in a way that accurately represents the capabilities and features of OpenMolt.




Make no mistakes.