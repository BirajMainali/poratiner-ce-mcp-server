#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Tools } from "./constants/index.ts";

import {
  createDockerContainer,
  deleteDockerContainer,
  deleteImageBuildCache,
  deleteUnusedImages,
  fetchContainerLogs,
  fetchDockerContainers,
  fetchImages,
  fetchNetworks,
  fetchServiceLog,
  fetchServices,
  pruneContainer,
  startDockerContainer,
  updateContainerResourceLimits,
  restartDockerService,
  inspectService,

} from "./api/portainer.ts";

const server = new Server(
  {
    name: "poratiner/ce-v.1.0",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      {
        name: Tools.DockerContainers,
        description: "Fetch all Docker containers",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.CreateDockerContainer,
        description: "Create a new Docker container",
        inputSchema: {
          type: "object",
          properties: {
            containerName: {
              type: "string",
              description: "The name of the container to create",
            },
            image: {
              type: "string",
              description: "The Docker image to use for the container",
            },
            exposedPorts: {
              type: "object",
              description: "Ports to expose from the container",
            },
            hostConfig: {
              type: "object",
              description: "Host configuration for the container",
            },
          },
          required: ["containerName", "image"],
        },
      },
      {
        name: Tools.StartDockerContainer,
        description: "Start a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            containerId: {
              type: "string",
              description: "The ID of the container to start",
            },
          },
          required: ["containerId"],
        },
      },
      {
        name: Tools.DeleteDockerContainer,
        description: "Delete a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            containerId: {
              type: "string",
              description: "The ID of the container to delete",
            },
            force: {
              type: "boolean",
              description: "Whether to force the deletion of the container",
            },
          },
          required: ["containerId"],
        },
      },
      {
        name: Tools.ContainerLogs,
        description: "Fetch logs from a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            containerId: {
              type: "string",
              description: "The ID of the container to fetch logs from",
            },
            since: {
              type: "number",
              description: "Timestamp to start fetching logs from",
            },
            timestamps: {
              type: "boolean",
              description: "Whether to include timestamps",
            },
            tail: {
              type: "string",
              description: "Number of lines to return from the end of the logs",
            },
          },
          required: ["containerId"],
        },
      },
      {
        name: Tools.UpdateContainer,
        description: "Update resource limits for a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            containerId: {
              type: "string",
              description: "The ID of the container to update",
            },
            memory: {
              type: "number",
              description: "Memory limit in bytes",
            },
            memorySwap: {
              type: "number",
              description: "Memory swap limit in bytes",
            },
            restartPolicy: {
              type: "object",
              description: "Restart policy for the container",
            },
          },
          required: ["containerId"],
        },
      },
      {
        name: Tools.DeleteUnwantedContainers,
        description: "Delete all stopped containers",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.GetImages,
        description: "Fetch all Docker images",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.DeleteImageBuilderCache,
        description: "Delete the build cache for Docker images",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.DeleteUnusedImages,
        description: "Delete unused Docker images",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.GetNetworks,
        description: "Fetch all Docker networks",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.GetServices,
        description: "Fetch all Docker services",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: Tools.ServiceLogs,
        description: "Fetch logs from a Docker service",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "The ID of the service to fetch logs from",
            },
            since: {
              type: "number",
              description: "Timestamp to start fetching logs from",
            },
            timestamps: {
              type: "boolean",
              description: "Whether to include timestamps",
            },
            tail: {
              type: "number",
              description: "Number of lines to return from the end of the logs",
            },
          },
          required: ["serviceId"],
        },
      },
      {
        name: Tools.InspectService,
        description: "Inspect a Docker service",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "The ID of the service to inspect",
            }
          },
          required: ["serviceId"],
        },
      },
      {
        name: Tools.UpdateService,
        description: "Update a Docker service",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "The ID of the service to update",
            }
          },
          required: ["serviceId"]
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error(`No arguments provided for tool: ${name}`);
    }

    // Type assertion for args to ensure proper typing
    const typedArgs = args as Record<string, any>;

    switch (name) {
      case Tools.DockerContainers: {
        const result = await fetchDockerContainers();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.CreateDockerContainer: {
        const result = await createDockerContainer(
          typedArgs.containerName as string,
          typedArgs.image as string,
          typedArgs.exposedPorts as Record<string, unknown> || {},
          typedArgs.hostConfig as Record<string, unknown> || {},
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.StartDockerContainer: {
        const result = await startDockerContainer(
          typedArgs.containerId as string,
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.DeleteDockerContainer: {
        const result = await deleteDockerContainer(
          typedArgs.containerId as string,
          typedArgs.force as boolean,
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.ContainerLogs: {
        const result = await fetchContainerLogs(
          typedArgs.containerId as string,
          typedArgs.since as number,
          typedArgs.timestamps as boolean,
          typedArgs.tail as string,
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.UpdateContainer: {
        const result = await updateContainerResourceLimits(
          typedArgs.containerId as string,
          typedArgs.memory as number,
          typedArgs.memorySwap as number,
          typedArgs.restartPolicy as Record<string, unknown>,
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.DeleteUnwantedContainers: {
        const response = await pruneContainer();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2),
          }],
        };
      }

      case Tools.GetImages: {
        const images = await fetchImages();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(images, null, 2),
          }],
        };
      }

      case Tools.DeleteImageBuilderCache: {
        const result = await deleteImageBuildCache();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.DeleteUnusedImages: {
        const result = await deleteUnusedImages();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.GetNetworks: {
        const networks = await fetchNetworks();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(networks, null, 2),
          }],
        };
      }

      case Tools.GetServices: {
        const services = await fetchServices();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(services, null, 2),
          }],
        };
      }

      case Tools.ServiceLogs: {
        const result = await fetchServiceLog(
          typedArgs.serviceId as string,
          typedArgs.since as number,
          typedArgs.timestamps as boolean,
          typedArgs.tail as string,
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.InspectService: {
        const result = await inspectService(
          typedArgs.serviceId as string,
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case Tools.UpdateService: {
        const result = await restartDockerService(
          typedArgs.serviceId as string
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }



      default: {
        throw new Error(`Unknown tool: ${name}`);
      }
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Cannot process the request";
    return {
      content: [{
        type: "text",
        text: `Failed: ${errorMessage}`,
      }],
    };
  }
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
