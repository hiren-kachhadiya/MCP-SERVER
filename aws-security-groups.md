# AWS Security Groups Configuration

## Required Ports for MCP API Searcher

### Inbound Rules

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22 | TCP | Your IP/0.0.0.0/0 | SSH Access |
| 80 | TCP | 0.0.0.0/0 | HTTP (optional - for redirect) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (optional - for SSL) |
| 3000 | TCP | 0.0.0.0/0 | **NestJS Main Application** |
| 5000 | TCP | 0.0.0.0/0 | **MCP HTTP Server** |
| 5001 | TCP | 0.0.0.0/0 | **WebSocket Realtime Server** |

### AWS CLI Commands to Add Rules

```bash
# Get your security group ID
SECURITY_GROUP_ID="sg-xxxxxxxxx"  # Replace with your actual security group ID

# Add NestJS App port (3000)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0

# Add MCP HTTP Server port (5000)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0

# Add WebSocket Realtime Server port (5001)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5001 \
    --cidr 0.0.0.0/0
```

### AWS Console Steps

1. **Go to EC2 Dashboard**
2. **Navigate to Security Groups**
3. **Select your instance's security group**
4. **Click "Edit inbound rules"**
5. **Add the following rules:**

#### Rule 1: NestJS Application
- **Type**: Custom TCP
- **Port**: 3000
- **Source**: 0.0.0.0/0
- **Description**: NestJS Main Application

#### Rule 2: MCP HTTP Server
- **Type**: Custom TCP
- **Port**: 5000
- **Source**: 0.0.0.0/0
- **Description**: MCP HTTP Server

#### Rule 3: WebSocket Realtime
- **Type**: Custom TCP
- **Port**: 5001
- **Source**: 0.0.0.0/0
- **Description**: WebSocket Realtime Server

### Verification Commands

After updating security groups, verify the ports are accessible:

```bash
# Check if ports are listening on EC2 instance
sudo netstat -tuln | grep -E ':(3000|5000|5001) '

# Test from external machine
curl http://YOUR_EC2_PUBLIC_IP:3000
curl http://YOUR_EC2_PUBLIC_IP:5000/health
curl http://YOUR_EC2_PUBLIC_IP:5001  # This will fail for HTTP, but shows port is open
```

### Service URLs After Deployment

Replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP:

- **Main Application**: `http://YOUR_EC2_PUBLIC_IP:3000`
- **API Documentation**: `http://YOUR_EC2_PUBLIC_IP:3000/docs`
- **MCP HTTP Server**: `http://YOUR_EC2_PUBLIC_IP:5000`
- **MCP Health Check**: `http://YOUR_EC2_PUBLIC_IP:5000/health`
- **WebSocket Server**: `ws://YOUR_EC2_PUBLIC_IP:5001`
- **WebSocket Info**: `http://YOUR_EC2_PUBLIC_IP:5000/websocket`

### Security Considerations

For production environments, consider:

1. **Restrict Source IPs**: Instead of `0.0.0.0/0`, use specific IP ranges
2. **Use Application Load Balancer**: Route traffic through ALB
3. **Enable HTTPS**: Use SSL certificates for encrypted communication
4. **VPC Configuration**: Place services in private subnets with NAT Gateway
