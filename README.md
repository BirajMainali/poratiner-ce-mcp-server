# Portainer MCP Server

A Model Context Protocol (MCP) server implementation for Portainer, enabling AI assistants to interact with Docker containers and services through Portainer's API.

## Features

- Docker container management (create, start, delete, fetch logs)
- Docker image management (fetch, delete unused, clear build cache)
- Docker network operations (inspect, fetch)
- Docker service management (fetch, logs)
- Resource limit management for containers

## Project Structure

```
portainer-ce-mcp/
├── src/
│   ├── api/
│   │   └── portainer.ts      # Portainer API integration
│   ├── constants/
│   │   └── index.ts          # Tool names and other constants
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── main.ts               # Main server implementation
├── package.json              # Project dependencies
├── package-lock.json         # Dependency lock file
├── deno.json                 # Deno configuration
└── README.md                 # Project documentation
```

## Prerequisites

- Deno
- Portainer instance with API access
- Docker installed and running

## Installation

1. Clone the repository:
```bash
git https://github.com/BirajMainali/poratiner-ce-mcp-server.git
cd portainer-ce-mcp
```
## Configuration

The server requires the following environment variables:
- `PORTAINER_URL`: The URL of your Portainer instance
- `PORTAINER_API_KEY`: Your Portainer API key
- `PORTAINER_ENV_ID`: Your Poratiner Environment Id

## API Tools

The server provides the following tools for AI assistants:

### Container Management
- `FETCH_DOCKER_CONTAINERS`: List all containers
- `CREATE_DOCKER_CONTAINER`: Create a new container
- `START_DOCKER_CONTAINER`: Start a container
- `DELETE_DOCKER_CONTAINER`: Remove a container
- `FETCH_CONTAINER_LOGS`: Get container logs
- `UPDATE_CONTAINER_RESOURCE_LIMITS`: Update container resources
- `DELETE_STOPPED_CONTAINERS`: Clean up stopped containers

### Image Management
- `FETCH_IMAGES`: List all images
- `DELETE_IMAGE_BUILD_CACHE`: Clear build cache
- `DELETE_UNUSED_IMAGES`: Remove unused images

### Network Operations
- `FETCH_NETWORKS`: List all networks
- `INSPECT_NETWORK`: Get network details

### Service Management
- `FETCH_SERVICES`: List all services
- `FETCH_SERVICE_LOG`: Get service logs

## Development


### Building
```bash
deno compile --allow-env --allow-read --allow-net --env-file=.env  src/main.ts
```

### Inspect MCP Server
```bash
npx @modelcontextprotocol/inspector deno run --allow-env --allow-read --allow-net --env-file=.env  src/main.ts
```

### MCP Config
```json
{
  "mcpServers": {
    "poratiner": {
      "command": "C:\\MCP\\portainer-ce-mcp\\src.exe", // use executable path
      "args": [
        "y"
      ]
    }
  }
}
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 