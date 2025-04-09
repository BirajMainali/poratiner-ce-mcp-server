export interface DockerContainer {
    Id: string;
    Names: string[];
    Image: string;
    ImageID: string;
    Command: string;
    Created: number;
    State: string;
    Status: string;
    Ports: Array<{
        IP?: string;
        PrivatePort: number;
        PublicPort?: number;
        Type: string;
    }>;
    Labels: Record<string, string>;
    NetworkSettings: {
        Networks: Record<string, unknown>;
    };
    Mounts: Array<{
        Type: string;
        Name?: string;
        Source: string;
        Destination: string;
        Driver?: string;
        Mode: string;
        RW: boolean;
        Propagation: string;
    }>;
}

export interface DockerImage {
    Id: string;
    ParentId: string;
    RepoTags: string[];
    RepoDigests: string[];
    Created: number;
    Size: number;
    VirtualSize: number;
    Labels: Record<string, string>;
}

export interface DockerNetwork {
    Id: string;
    Name: string;
    Scope: string;
    Driver: string;
    EnableIPv6: boolean;
    IPAM: {
        Driver: string;
        Options: Record<string, string>;
        Config: Array<{
            Subnet: string;
            Gateway: string;
        }>;
    };
    Internal: boolean;
    Attachable: boolean;
    Ingress: boolean;
    ConfigFrom: {
        Network: string;
    };
    ConfigOnly: boolean;
    Containers: Record<string, unknown>;
    Options: Record<string, string>;
}

export interface DockerService {
    ID: string;
    Version: {
        Index: number;
    };
    CreatedAt: string;
    UpdatedAt: string;
    Spec: {
        Name: string;
        Labels: Record<string, string>;
        TaskTemplate: {
            ContainerSpec: {
                Image: string;
            };
        };
        Mode: {
            Replicated: {
                Replicas: number;
            };
        };
    };
    Endpoint: {
        Spec: {
            Mode: string;
            Ports: Array<{
                Protocol: string;
                TargetPort: number;
                PublishedPort: number;
                PublishMode: string;
            }>;
        };
    };
    UpdateStatus: {
        State: string;
        StartedAt: string;
        CompletedAt: string;
        Message: string;
    };
} 