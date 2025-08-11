terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  backend "s3" {
    bucket         = "dreamer-ai-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "dreamer-ai"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "devops-team"
    }
  }
}

locals {
  common_tags = {
    Project     = "dreamer-ai"
    Environment = var.environment
    Region      = var.aws_region
  }
  
  name_prefix = "dreamer-ai-${var.environment}"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix          = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  single_nat_gateway   = var.environment != "prod"
  enable_vpn_gateway   = var.enable_vpn_gateway
  
  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "${local.name_prefix}-cluster"
  cluster_version = var.kubernetes_version
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  
  node_groups = var.node_groups
  
  enable_irsa                  = true
  cluster_endpoint_public_access = var.environment == "dev"
  cluster_endpoint_private_access = true
  
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
  
  tags = local.common_tags
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  identifier = "${local.name_prefix}-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  database_name = "dreamerai"
  username      = "dreameradmin"
  
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.cluster_security_group_id]
  
  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"
  
  performance_insights_enabled = var.environment == "prod"
  monitoring_interval         = var.environment == "prod" ? 60 : 0
  
  tags = local.common_tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/elasticache"
  
  cluster_id = "${local.name_prefix}-redis"
  
  engine         = "redis"
  engine_version = "7.0"
  node_type      = var.redis_node_type
  
  num_cache_nodes = var.environment == "prod" ? 2 : 1
  
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.cluster_security_group_id]
  
  automatic_failover_enabled = var.environment == "prod"
  multi_az_enabled          = var.environment == "prod"
  
  snapshot_retention_limit = var.environment == "prod" ? 7 : 0
  snapshot_window         = "03:00-05:00"
  
  tags = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"
  
  buckets = {
    assets = {
      name = "${local.name_prefix}-assets"
      versioning = true
      lifecycle_rules = [
        {
          id      = "archive-old-versions"
          enabled = true
          noncurrent_version_transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            },
            {
              days          = 90
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    backups = {
      name = "${local.name_prefix}-backups"
      versioning = true
      lifecycle_rules = [
        {
          id      = "delete-old-backups"
          enabled = true
          expiration = {
            days = var.environment == "prod" ? 90 : 30
          }
        }
      ]
    }
    logs = {
      name = "${local.name_prefix}-logs"
      versioning = false
      lifecycle_rules = [
        {
          id      = "archive-logs"
          enabled = true
          transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            },
            {
              days          = 90
              storage_class = "GLACIER"
            }
          ]
          expiration = {
            days = 365
          }
        }
      ]
    }
  }
  
  tags = local.common_tags
}

# CloudFront CDN
module "cdn" {
  source = "./modules/cloudfront"
  
  enabled = var.enable_cdn
  
  domain_names = var.environment == "prod" ? ["dreamer-ai.com", "www.dreamer-ai.com"] : ["${var.environment}.dreamer-ai.com"]
  
  origin_domain_name = module.alb.dns_name
  origin_id          = "alb-origin"
  
  s3_bucket_domain_name = module.s3.bucket_domain_names["assets"]
  s3_origin_id         = "s3-origin"
  
  acm_certificate_arn = var.acm_certificate_arn
  
  price_class = var.environment == "prod" ? "PriceClass_All" : "PriceClass_100"
  
  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name = "${local.name_prefix}-alb"
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.public_subnet_ids
  security_groups = [module.security_groups.alb_security_group_id]
  
  certificate_arn = var.acm_certificate_arn
  
  target_groups = {
    frontend = {
      port     = 80
      protocol = "HTTP"
      health_check = {
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 2
        timeout             = 5
        interval            = 30
      }
    }
    backend = {
      port     = 3000
      protocol = "HTTP"
      health_check = {
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 2
        timeout             = 5
        interval            = 30
      }
    }
  }
  
  tags = local.common_tags
}

# Security Groups
module "security_groups" {
  source = "./modules/security-groups"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = var.vpc_cidr
  
  tags = local.common_tags
}

# WAF
module "waf" {
  source = "./modules/waf"
  
  enabled = var.enable_waf
  
  name = "${local.name_prefix}-waf"
  
  alb_arn = module.alb.arn
  
  rate_limit = var.environment == "prod" ? 2000 : 1000
  
  tags = local.common_tags
}

# Route53
module "route53" {
  source = "./modules/route53"
  
  enabled = var.enable_route53
  
  zone_name = "dreamer-ai.com"
  
  records = {
    root = {
      type = "A"
      alias = {
        name                   = var.enable_cdn ? module.cdn.distribution_domain_name : module.alb.dns_name
        zone_id                = var.enable_cdn ? module.cdn.distribution_hosted_zone_id : module.alb.zone_id
        evaluate_target_health = true
      }
    }
    www = {
      type = "CNAME"
      ttl  = 300
      records = ["dreamer-ai.com"]
    }
    api = {
      type = "A"
      alias = {
        name                   = module.alb.dns_name
        zone_id                = module.alb.zone_id
        evaluate_target_health = true
      }
    }
  }
  
  tags = local.common_tags
}

# Monitoring and Logging
module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix = local.name_prefix
  
  eks_cluster_name = module.eks.cluster_name
  
  log_retention_days = var.environment == "prod" ? 90 : 30
  
  alarm_email = var.alarm_email
  
  tags = local.common_tags
}