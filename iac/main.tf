terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "admin_cidr_blocks" {
  description = "Rangos CIDR autorizados para SSH al bastion (p. ej. la VPN del equipo)"
  type        = list(string)
  default     = ["10.0.0.0/24"]
}

variable "egress_cidr_blocks" {
  description = "Rangos CIDR a los que el bastion puede salir por HTTPS"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_security_group" "localvibe_bastion" {
  name        = "localvibe-bastion"
  description = "Acceso de administración del entorno LocalVibe"
  tags = {
    Name    = "LocalVibe Bastion"
    Service = "localvibe"
  }

  ingress {
    description = "Acceso SSH para el equipo de administración"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.egress_cidr_blocks
  }
}