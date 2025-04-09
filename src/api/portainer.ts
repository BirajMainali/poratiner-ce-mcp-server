import axios, { AxiosError, AxiosInstance } from "axios";
import {
    DockerContainer,
    DockerImage,
    DockerNetwork,
    DockerService,
} from "../types/index.ts";
import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";

await load({ export: true });

const PORTAINER_BASE_URL = Deno.env.get("PORTAINER_BASE_URL") || "portainer-api";
const PORTAINER_API_KEY = Deno.env.get("PORTAINER_API_KEY") || "poratienr-access-token";

const portainerClient: AxiosInstance = axios.create({
    baseURL: PORTAINER_BASE_URL,
    headers: { "X-API-Key": PORTAINER_API_KEY },
    timeout: 30000,
});

async function handleRequest<T>(request: Promise<{ data: T }>): Promise<T> {
    try {
        const response = await request;
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                throw new Error(
                    `Portainer API error: ${axiosError.response.status} - ${
                        JSON.stringify(axiosError.response.data)
                    }`,
                );
            } else if (axiosError.request) {
                throw new Error(
                    `No response from Portainer API: ${axiosError.message}`,
                );
            } else {
                throw new Error(
                    `Error setting up request to Portainer API: ${axiosError.message}`,
                );
            }
        }
        throw error;
    }
}

/**
 * Fetch all Docker containers from a specified environment
 * @param envId - The ID of the environment to fetch containers from
 * @returns Array of Docker containers
 */
async function fetchDockerContainers(
    envId: string,
): Promise<DockerContainer[]> {
    return await handleRequest(
        portainerClient.get(`/api/endpoints/${envId}/docker/containers/json`, {
            params: {
                all: true,
            },
        }),
    );
}

/**
 * Create a new Docker container in a specified environment
 * @param envId - The ID of the environment to create the container in
 * @param containerName - The name of the container to create
 * @param image - The Docker image to use for the container
 * @param exposedPorts - Ports to expose from the container
 * @param hostConfig - Host configuration for the container
 * @returns Container creation response
 */
async function createDockerContainer(
    envId: string,
    containerName: string,
    image: string,
    exposedPorts: Record<string, unknown>,
    hostConfig: Record<string, unknown>,
): Promise<{ Id: string; Warnings: string[] }> {
    return await handleRequest(
        portainerClient.post(`/api/endpoints/${envId}/docker/containers/create`, {
            name: containerName,
            Image: image,
            ExposedPorts: exposedPorts,
            HostConfig: hostConfig,
        }),
    );
}

/**
 * Start a Docker container in a specified environment
 * @param envId - The ID of the environment containing the container
 * @param containerId - The ID of the container to start
 * @returns Empty response on success
 */
async function startDockerContainer(
    envId: string,
    containerId: string,
): Promise<void> {
    return await handleRequest(
        portainerClient.post(
            `/api/endpoints/${envId}/docker/containers/${containerId}/start`,
        ),
    );
}

/**
 * Delete a Docker container from a specified environment
 * @param envId - The ID of the environment containing the container
 * @param containerId - The ID of the container to delete
 * @param force - Whether to force the deletion of the container
 * @returns Empty response on success
 */
async function deleteDockerContainer(
    envId: string,
    containerId: string,
    force: boolean = false,
): Promise<void> {
    return await handleRequest(
        portainerClient.delete(
            `/api/endpoints/${envId}/docker/containers/${containerId}`,
            {
                params: {
                    force: force,
                },
            },
        ),
    );
}

/**
 * Fetch logs from a Docker container
 * @param envId - The ID of the environment containing the container
 * @param containerId - The ID of the container to fetch logs from
 * @param stdout - Whether to include stdout logs
 * @param stderr - Whether to include stderr logs
 * @param follow - Whether to follow the logs
 * @param timestamps - Whether to include timestamps
 * @param tail - Number of lines to return from the end of the logs
 * @returns Container logs
 */
async function fetchContainerLogs(
    envId: string,
    containerId: string,
    stdout: boolean = true,
    stderr: boolean = true,
    follow: boolean = false,
    timestamps: boolean = false,
    tail: number = 10,
): Promise<string> {
    return handleRequest(
        portainerClient.get(
            `/api/endpoints/${envId}/docker/containers/${containerId}/logs`,
            {
                params: {
                    stdout: stdout,
                    stderr: stderr,
                    follow: follow,
                    timestamps: timestamps,
                    tail: tail,
                },
            },
        ),
    );
}

/**
 * Update resource limits for a Docker container
 * @param envId - The ID of the environment containing the container
 * @param containerId - The ID of the container to update
 * @param memory - Memory limit in bytes
 * @param memorySwap - Memory swap limit in bytes
 * @param restartPolicy - Restart policy for the container
 * @returns Empty response on success
 */
async function updateContainerResourceLimits(
    envId: string,
    containerId: string,
    memory: number,
    memorySwap: number,
    restartPolicy: Record<string, unknown>,
): Promise<void> {
    return await handleRequest(
        portainerClient.post(
            `/api/endpoints/${envId}/docker/containers/${containerId}/update`,
            {
                Memory: memory,
                MemorySwap: memorySwap,
                RestartPolicy: restartPolicy,
            },
        ),
    );
}

/**
 * Delete all stopped containers from a specified environment
 * @param envId - The ID of the environment to clean up
 * @returns Prune response with deleted container IDs
 */
async function deleteStoppedContainers(
    envId: string,
): Promise<{ ContainersDeleted: string[]; SpaceReclaimed: number }> {
    return await handleRequest(
        portainerClient.delete(`/api/endpoints/${envId}/docker/containers/prune`, {
            params: {
                all: true,
            },
        }),
    );
}

/**
 * Fetch all Docker images from a specified environment
 * @param envId - The ID of the environment to fetch images from
 * @returns Array of Docker images
 */
async function fetchImages(envId: string): Promise<DockerImage[]> {
    return await handleRequest(
        portainerClient.get(`/api/endpoints/${envId}/docker/images/json`),
    );
}

/**
 * Delete the build cache for Docker images
 * @param envId - The ID of the environment to clean up
 * @returns Prune response with deleted image IDs
 */
async function deleteImageBuildCache(
    envId: string,
): Promise<{ ImagesDeleted: string[]; SpaceReclaimed: number }> {
    return await handleRequest(
        portainerClient.delete(`/api/endpoints/${envId}/docker/images/prune`),
    );
}

/**
 * Delete unused Docker images
 * @param envId - The ID of the environment to clean up
 * @returns Prune response with deleted image IDs
 */
async function deleteUnusedImages(
    envId: string,
): Promise<{ ImagesDeleted: string[]; SpaceReclaimed: number }> {
    return await handleRequest(
        portainerClient.delete(`/api/endpoints/${envId}/docker/images/prune`),
    );
}

/**
 * Fetch all Docker networks from a specified environment
 * @param envId - The ID of the environment to fetch networks from
 * @returns Array of Docker networks
 */
async function fetchNetworks(envId: string): Promise<DockerNetwork[]> {
    return await handleRequest(
        portainerClient.get(`/api/endpoints/${envId}/docker/networks`),
    );
}

/**
 * Get detailed information about a specific Docker network
 * @param envId - The ID of the environment containing the network
 * @param networkId - The ID of the network to inspect
 * @returns Network details
 */
async function inspectNetwork(
    envId: string,
    networkId: string,
): Promise<DockerNetwork> {
    return await handleRequest(
        portainerClient.get(`/api/endpoints/${envId}/docker/networks/${networkId}`),
    );
}

/**
 * Fetch all Docker services from a specified environment
 * @param envId - The ID of the environment to fetch services from
 * @returns Array of Docker services
 */
async function fetchServices(envId: string): Promise<DockerService[]> {
    return await handleRequest(
        portainerClient.get(`/api/endpoints/${envId}/docker/services`),
    );
}

/**
 * Fetch logs from a Docker service
 * @param envId - The ID of the environment containing the service
 * @param serviceId - The ID of the service to fetch logs from
 * @param stdout - Whether to include stdout logs
 * @param stderr - Whether to include stderr logs
 * @param follow - Whether to follow the logs
 * @param timestamps - Whether to include timestamps
 * @param tail - Number of lines to return from the end of the logs
 * @returns Service logs
 */
async function fetchServiceLog(
    envId: string,
    serviceId: string,
    stdout: boolean = true,
    stderr: boolean = true,
    follow: boolean = false,
    timestamps: boolean = false,
    tail: number = 10,
): Promise<string> {
    return await handleRequest(
        portainerClient.get(
            `/api/endpoints/${envId}/docker/services/${serviceId}/logs`,
            {
                params: {
                    stdout: stdout,
                    stderr: stderr,
                    follow: follow,
                    timestamps: timestamps,
                    tail: tail,
                },
            },
        ),
    );
}

export {
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
};

export type { DockerContainer, DockerImage, DockerNetwork, DockerService };
