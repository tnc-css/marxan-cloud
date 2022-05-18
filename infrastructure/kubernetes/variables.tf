variable "project_name" {
  type        = string
  description = "The name of the project. Used in naming most of the resources in the infrastructure."
}

variable "project_resource_group" {
  type        = string
  description = "Azure resource group to use for the project."
}

variable "location" {
  type        = string
  description = "Azure Location in which the resources will be created"
}

variable "port" {
  type        = number
  default     = 443
  description = "The TCP port to use when reaching the AKS cluster. Useful when using an SSH tunnel"
}

variable "cert_email" {
  type        = string
  description = "Email address to use for cert renovation warnings"
}

variable "domain" {
  type        = string
  description = "The domain name"
}

variable "sparkpost_api_key" {
  type        = string
  description = "The API key for Sparkpost"
}

variable "backend_storage_size" {
  type        = string
  description = "Size of the backend storage claim"
}

variable "container_registry_name" {
  type        = string
  description = "Name for the Azure CR. Must be globally unique"
}

variable "key_vault_access_users" {
  type        = list(string)
  description = "The names of the users to grant access to the secrets"
}

variable "key_vault_name_prefix" {
  type        = string
  description = "The prefix to use for the key vault names. KV names must be globally unique."
}
