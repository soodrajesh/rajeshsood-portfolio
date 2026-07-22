---
title: Terraform Modules: Structure, Versioning, and Testing
date: 2026-07-10
tags: terraform, infrastructure-as-code, devops
---

# Terraform Modules: Structure, Versioning, and Testing

Terraform modules are the key to scaling infrastructure-as-code across teams. But many teams structure modules poorly, leading to versioning chaos and hidden dependencies. Let's build it right.

## Why Modules Matter

Without modules, every new environment looks like this:

```hcl
# Copied main.tf (200+ lines) 😱
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  # ... repeated in every environment
}

resource "aws_security_group" "alb" {
  # ... also repeated
}
```

With modules:

```hcl
module "vpc" {
  source = "git::https://github.com/myorg/terraform-aws-vpc.git?ref=v1.2.0"
  
  cidr_block = "10.0.0.0/16"
  environment = "prod"
}
```

One source of truth, versioned, testable.

## Module Structure

A well-designed module has a predictable, conventional structure:

```
terraform-aws-vpc/
├── main.tf          # Core resources
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── versions.tf      # Terraform & provider versions
├── variables.tf.example
└── examples/
    ├── basic/
    │   ├── main.tf
    │   └── terraform.tfvars
    └── with-nat/
        ├── main.tf
        └── terraform.tfvars
```

### main.tf - Declare Actual Resources

```hcl
# terraform-aws-vpc/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = var.name
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name}-public-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name}-igw"
  }
}
```

### variables.tf - Define Inputs

```hcl
# terraform-aws-vpc/variables.tf

variable "name" {
  description = "VPC name"
  type        = string
  nullable    = false
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.name))
    error_message = "Name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  nullable    = false

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition = alltrue([
      for cidr in var.public_subnet_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All subnet CIDRs must be valid."
  }
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### outputs.tf - Export Key Values

```hcl
# terraform-aws-vpc/outputs.tf

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}
```

## Versioning Strategy

Use semantic versioning (MAJOR.MINOR.PATCH):

```hcl
# terraform/main.tf (using your module)

module "vpc" {
  source = "git::https://github.com/myorg/terraform-aws-vpc.git?ref=v2.1.3"
  
  name               = "prod-vpc"
  cidr_block         = "10.0.0.0/16"
  environment        = "prod"
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}
```

**Version rules:**
- `v1.0.0` → First stable release
- `v1.1.0` → New feature (backwards compatible)
- `v1.1.1` → Bug fix (backwards compatible)
- `v2.0.0` → Breaking change (requires config updates)

**Git workflow:**

```bash
# Create feature branch
git checkout -b feature/add-nat-gateway

# Make changes, test, commit
git add -A
git commit -m "feat: add NAT gateway support"

# Create release
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Users can now use ref=v1.2.0
```

## Testing Modules

Test modules locally before publishing:

```hcl
# examples/basic/main.tf

terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source = "../../" # Reference parent module

  name        = "test-vpc"
  cidr_block  = "10.0.0.0/16"
  environment = "dev"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
```

Run locally:

```bash
cd examples/basic
terraform init
terraform plan    # Verify resources look correct
terraform apply   # Deploy test infrastructure
terraform destroy # Clean up
```

**Use Terratest for automated tests** (Go):

```go
// test/vpc_test.go

package test

import (
	"testing"
	"github.com/gruntwork-io/terratest/modules/terraform"
)

func TestVPCModule(t *testing.T) {
	terraformOptions := &terraform.Options{
		TerraformDir: "../examples/basic",
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	vpcId := terraform.Output(t, terraformOptions, "vpc_id")
	if vpcId == "" {
		t.Fatal("VPC ID is empty")
	}
}
```

Run tests:

```bash
go test -v ./test
```

## Publishing Modules

### Option 1: Git Repository (Recommended for private)

```hcl
module "vpc" {
  source = "git::git@github.com:myorg/terraform-aws-vpc.git?ref=v1.2.0"
}
```

**Pros:** Simple, works with private repos, version control
**Cons:** Not discoverable

### Option 2: Terraform Registry (Best for public)

1. Publish to GitHub as `terraform-aws-<service>`
2. Link to Terraform Registry: https://registry.terraform.io
3. Users install via:

```hcl
module "vpc" {
  source = "myorg/vpc/aws"
  version = "~> 1.2"
}
```

### Option 3: Private Registry (For enterprises)

Self-hosted registry using Terraform Cloud/Enterprise:

```hcl
terraform {
  cloud {
    organization = "myorg"
  }
}

module "vpc" {
  source = "app.terraform.io/myorg/vpc/aws"
  version = "1.2.0"
}
```

## Real-World Example: Reusable EC2 Module

```hcl
# terraform-aws-ec2-instance/main.tf

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ami" {
  type        = string
  description = "AMI ID"
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_instance" "main" {
  ami           = var.ami
  instance_type = var.instance_type
  tags          = var.tags
}

# Usage:
# module "web_server" {
#   source = "git::https://github.com/myorg/terraform-aws-ec2-instance.git?ref=v1.0.0"
#   
#   instance_type = "t3.small"
#   ami           = "ami-0c55b159cbfafe1f0"
#   tags = {
#     Name = "web-prod"
#     Environment = "prod"
#   }
# }
```

## Checklist for Production Modules

- [ ] Versioned (git tags like `v1.0.0`)
- [ ] Has README with examples and variables documented
- [ ] All variables have descriptions and validation rules
- [ ] All outputs are documented
- [ ] Examples directory with 2-3 use cases
- [ ] Tested locally with `terraform plan/apply`
- [ ] Uses pinned provider versions (`version = "~> 5.0"`)
- [ ] No hardcoded values (everything is a variable)
- [ ] Readme has a "Requirements" section listing terraform & provider versions

## Final Tips

1. **One module = one responsibility** (don't make mega-modules)
2. **Make defaults sensible** (so simple configs work out of the box)
3. **Validate inputs** (catch mistakes early with variable validation)
4. **Document outputs** (users need to know what they're getting)
5. **Version it** (git tags, terraform registry, or private registry)

Modules are the building blocks of infrastructure scale. Invest time in getting them right, and they'll pay dividends across your entire organization.

---

**Related:** Read about [Terraform State Management](/blog) or [GitOps for Terraform](/blog).
