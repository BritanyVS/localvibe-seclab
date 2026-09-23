terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
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
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}