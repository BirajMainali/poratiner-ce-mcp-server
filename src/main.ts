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
  fetchServices,
  pruneContainer,
  startDockerContainer,
  updateContainerResourceLimits,
  fetchServiceLog,
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
        name: Tools.GetDockerContainers,
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
        name: Tools.GetContainerLogs,
        description: "Fetch logs from a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            containerId: {
              type: "string",
              description: "The ID of the container to fetch logs from",
            },
            stdout: {
              type: "boolean",
              description: "Whether to include stdout logs",
            },
            stderr: {
              type: "boolean",
              description: "Whether to include stderr logs",
            },
            follow: {
              type: "boolean",
              description: "Whether to follow the logs",
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
        name: Tools.GetServiceLogs,
        description: "Fetch logs from a Docker service",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "The ID of the service to fetch logs from",
            },
            stdout: {
              type: "boolean",
              description: "Whether to include stdout logs",
            },
            stderr: {
              type: "boolean",
              description: "Whether to include stderr logs",
            },
            follow: {
              type: "boolean",
              description: "Whether to follow the logs",
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
      case Tools.GetDockerContainers: {
        const result = await fetchDockerContainers();
        return {
          content: [{
            type: "text",
            text: result.map((container: any) => {
              return `ContainerId: ${container.Id}, Name: ${container.Names?.[0] || "unknown"}, Ports: ${container.Ports?.map((p: {
                PublicPort: number;
                PrivatePort: number;
                Type: string;
              }) => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`).join(", ") || "none"}, State: ${container.State}, Status: ${container.Status}`;
            }).join("\n"),
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
            text: `Container created successfully with Id: ${result.Id}${result.Warnings.length > 0
              ? `\nWarnings: ${result.Warnings.join(", ")}`
              : ""
              }`,
          }],
        };
      }

      case Tools.StartDockerContainer: {
        await startDockerContainer(
          typedArgs.containerId as string,
        );
        return {
          content: [{
            type: "text",
            text:
              `Operation successful - Container Id: ${typedArgs.containerId}, Env Id: ${typedArgs.envId}`,
          }],
        };
      }

      case Tools.DeleteDockerContainer: {
        await deleteDockerContainer(
          typedArgs.containerId as string,
          typedArgs.force as boolean,
        );
        return {
          content: [{
            type: "text",
            text:
              `Operation successful - Container Id: ${typedArgs.containerId}, Env Id: ${typedArgs.envId}`,
          }],
        };
      }

      case Tools.GetContainerLogs: {
        const result = await fetchContainerLogs(
          typedArgs.containerId as string,
          typedArgs.stdout as boolean,
          typedArgs.stderr as boolean,
          typedArgs.follow as boolean,
          typedArgs.timestamps as boolean,
          typedArgs.tail as number,
        );
        return {
          content: [{
            type: "text",
            text: result.message,
          }],
        };
      }

      case Tools.UpdateContainer: {
        await updateContainerResourceLimits(
          typedArgs.containerId as string,
          typedArgs.memory as number,
          typedArgs.memorySwap as number,
          typedArgs.restartPolicy as Record<string, unknown>,
        );
        return {
          content: [{
            type: "text",
            text: `Operation successful - Container Id: ${typedArgs.containerId}, Env Id: ${typedArgs.envId}`,
          }],
        };
      }

      case Tools.DeleteUnwantedContainers: {
        await pruneContainer();
        return {
          content: [{
            type: "text",
            text: `Operation successful - Env Id: ${typedArgs.envId}`,
          }],
        };
      }

      case Tools.GetImages: {
        const images = await fetchImages();
        return {
          content: [{
            type: "text",
            text: images.map((image: {
              Id: string;
              RepoTags: string[];
            }) => {
              const name = image.RepoTags?.[0] || "untagged";
              const registry = name.includes("/")
                ? name.split("/")[0]
                : "docker.io";
              return `Name: ${name}, Registry: ${registry}, Id: ${image.Id}`;
            }).join("\n"),
          }],
        };
      }

      case Tools.DeleteImageBuilderCache: {
        await deleteImageBuildCache();
        return {
          content: [{
            type: "text",
            text: `Operation successful - Env Id: ${typedArgs.envId}`,
          }],
        };
      }

      case Tools.DeleteUnusedImages: {
        const result = await deleteUnusedImages();
        return {
          content: [{
            type: "text",
            text: result.map((image: {
              name: string;
              description: string;
            }) => `Name: ${image.name}, Description: ${image.description}`).join(
              "\n",
            ),
          }],
        };
      }

      case Tools.GetNetworks: {
        const networks = await fetchNetworks();
        return {
          content: [{
            type: "text",
            text: networks.map((network: {
              Name: string;
              Id: string;
              Created: string;
              Scope: string;
              Driver: string;
            }) =>
              `Name: ${network.Name}, Id: ${network.Id}, Created: ${network.Created}, Scope: ${network.Scope}, Driver: ${network.Driver}`
            ).join("\n"),
          }],
        };
      }

      case Tools.GetServices: {
        const services = await fetchServices();
        return {
          content: [{
            type: "text",
            text: services.map((service: any) => {
              const name = service?.Spec?.Name || "N/A";
              const image = service?.Spec?.TaskTemplate?.ContainerSpec?.Image ||
                "N/A";
              const ports = service?.Endpoint?.Ports?.map((port: any) =>
                `${port.PublishedPort}->${port.TargetPort}/${port.Protocol}`
              ).join(", ") || "None";

              return `Name: ${name}, Image: ${image}, Ports: ${ports}`;
            }).join("\n"),
          }],
        };
      }

      case Tools.GetServiceLogs: {
        const result = await fetchServiceLog(
          typedArgs.serviceId as string,
          typedArgs.stdout as boolean,
          typedArgs.stderr as boolean,
          typedArgs.follow as boolean,
          typedArgs.timestamps as boolean,
          typedArgs.tail as number,
        );

        return {
          content: [{
            type: "text",
            text: result.message,
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
})

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
