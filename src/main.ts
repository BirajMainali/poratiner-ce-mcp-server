#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOL } from "./constants/index.ts";

import {
  createDockerContainer,
  deleteDockerContainer,
  deleteImageBuildCache,
  deleteStoppedContainers,
  deleteUnusedImages,
  fetchContainerLogs,
  fetchDockerContainers,
  fetchImages,
  fetchNetworks,
  fetchServiceLog,
  fetchServices,
  inspectNetwork,
  startDockerContainer,
  updateContainerResourceLimits,
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
        name: TOOL.FETCH_DOCKER_CONTAINERS,
        description: "Fetch all Docker containers from a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to fetch containers from",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.CREATE_DOCKER_CONTAINER,
        description: "Create a new Docker container in a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description:
                "The ID of the environment to create the container in",
            },
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
          required: ["envId", "containerName", "image"],
        },
      },
      {
        name: TOOL.START_DOCKER_CONTAINER,
        description: "Start a Docker container in a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment containing the container",
            },
            containerId: {
              type: "string",
              description: "The ID of the container to start",
            },
          },
          required: ["envId", "containerId"],
        },
      },
      {
        name: TOOL.DELETE_DOCKER_CONTAINER,
        description: "Delete a Docker container from a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment containing the container",
            },
            containerId: {
              type: "string",
              description: "The ID of the container to delete",
            },
            force: {
              type: "boolean",
              description: "Whether to force the deletion of the container",
            },
          },
          required: ["envId", "containerId"],
        },
      },
      {
        name: TOOL.FETCH_CONTAINER_LOGS,
        description: "Fetch logs from a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment containing the container",
            },
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
          required: ["envId", "containerId"],
        },
      },
      {
        name: TOOL.UPDATE_CONTAINER_RESOURCE_LIMITS,
        description: "Update resource limits for a Docker container",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment containing the container",
            },
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
          required: ["envId", "containerId"],
        },
      },
      {
        name: TOOL.DELETE_STOPPED_CONTAINERS,
        description:
          "Delete all stopped containers from a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to clean up",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.FETCH_IMAGES,
        description: "Fetch all Docker images from a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to fetch images from",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.DELETE_IMAGE_BUILD_CACHE,
        description: "Delete the build cache for Docker images",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to clean up",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.DELETE_UNUSED_IMAGES,
        description: "Delete unused Docker images",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to clean up",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.FETCH_NETWORKS,
        description: "Fetch all Docker networks from a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to fetch networks from",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.INSPECT_NETWORK,
        description: "Get detailed information about a specific Docker network",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment containing the network",
            },
            networkId: {
              type: "string",
              description: "The ID of the network to inspect",
            },
          },
          required: ["envId", "networkId"],
        },
      },
      {
        name: TOOL.FETCH_SERVICES,
        description: "Fetch all Docker services from a specified environment",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment to fetch services from",
            },
          },
          required: ["envId"],
        },
      },
      {
        name: TOOL.FETCH_SERVICE_LOG,
        description: "Fetch logs from a Docker service",
        inputSchema: {
          type: "object",
          properties: {
            envId: {
              type: "string",
              description: "The ID of the environment containing the service",
            },
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
          required: ["envId", "serviceId"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  // Type assertion for args to ensure proper typing
  const typedArgs = args as Record<string, any>;

  switch (name) {
    case TOOL.FETCH_DOCKER_CONTAINERS: {
      const containers = await fetchDockerContainers(typedArgs.envId as string);
      return { result: containers };
    }

    case TOOL.CREATE_DOCKER_CONTAINER: {
      const createResult = await createDockerContainer(
        typedArgs.envId as string,
        typedArgs.containerName as string,
        typedArgs.image as string,
        typedArgs.exposedPorts as Record<string, unknown> || {},
        typedArgs.hostConfig as Record<string, unknown> || {},
      );
      return { result: createResult };
    }

    case TOOL.START_DOCKER_CONTAINER: {
      const startResult = await startDockerContainer(
        typedArgs.envId as string,
        typedArgs.containerId as string,
      );
      return { result: startResult };
    }

    case TOOL.DELETE_DOCKER_CONTAINER: {
      const deleteResult = await deleteDockerContainer(
        typedArgs.envId as string,
        typedArgs.containerId as string,
        typedArgs.force as boolean,
      );
      return { result: deleteResult };
    }

    case TOOL.FETCH_CONTAINER_LOGS: {
      const logs = await fetchContainerLogs(
        typedArgs.envId as string,
        typedArgs.containerId as string,
        typedArgs.stdout as boolean,
        typedArgs.stderr as boolean,
        typedArgs.follow as boolean,
        typedArgs.timestamps as boolean,
        typedArgs.tail as number,
      );
      return { result: logs };
    }

    case TOOL.UPDATE_CONTAINER_RESOURCE_LIMITS: {
      const updateResult = await updateContainerResourceLimits(
        typedArgs.envId as string,
        typedArgs.containerId as string,
        typedArgs.memory as number,
        typedArgs.memorySwap as number,
        typedArgs.restartPolicy as Record<string, unknown>,
      );
      return { result: updateResult };
    }

    case TOOL.DELETE_STOPPED_CONTAINERS: {
      const deleteResult = await deleteStoppedContainers(
        typedArgs.envId as string,
      );
      return { result: deleteResult };
    }

    case TOOL.FETCH_IMAGES: {
      const images = await fetchImages(typedArgs.envId as string);
      return { result: images };
    }

    case TOOL.DELETE_IMAGE_BUILD_CACHE: {
      const cacheResult = await deleteImageBuildCache(
        typedArgs.envId as string,
      );
      return { result: cacheResult };
    }

    case TOOL.DELETE_UNUSED_IMAGES: {
      const unusedResult = await deleteUnusedImages(typedArgs.envId as string);
      return { result: unusedResult };
    }

    case TOOL.FETCH_NETWORKS: {
      const networks = await fetchNetworks(typedArgs.envId as string);
      return { result: networks };
    }

    case TOOL.INSPECT_NETWORK: {
      const network = await inspectNetwork(
        typedArgs.envId as string,
        typedArgs.networkId as string,
      );
      return { result: network };
    }

    case TOOL.FETCH_SERVICES: {
      const services = await fetchServices(typedArgs.envId as string);
      return { result: services };
    }

    case TOOL.FETCH_SERVICE_LOG: {
      const serviceLogs = await fetchServiceLog(
        typedArgs.envId as string,
        typedArgs.serviceId as string,
        typedArgs.stdout as boolean,
        typedArgs.stderr as boolean,
        typedArgs.follow as boolean,
        typedArgs.timestamps as boolean,
        typedArgs.tail as number,
      );
      return { result: serviceLogs };
    }

    default: {
      throw new Error(`Unknown tool: ${name}`);
    }
  }
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
