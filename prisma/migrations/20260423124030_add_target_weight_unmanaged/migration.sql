-- CreateEnum
CREATE TYPE "CashTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST', 'BUY_ASSET', 'SELL_ASSET');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'VND',

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPrice" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "closePrice" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "realizedPnL" DOUBLE PRECISION,
    "cashTransactionId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "type" "CashTransactionType" NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermDeposit" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TermDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "investedValue" DOUBLE PRECISION NOT NULL,
    "cashBalance" DOUBLE PRECISION NOT NULL,
    "costBasis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotation_tag_entity" (
    "id" VARCHAR(16) NOT NULL,
    "name" VARCHAR(24) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_69dfa041592c30bbc0d4b84aa00" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identity" (
    "userId" UUID,
    "providerId" VARCHAR(255) NOT NULL,
    "providerType" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "auth_identity_pkey" PRIMARY KEY ("providerId","providerType")
);

-- CreateTable
CREATE TABLE "auth_provider_sync_history" (
    "id" SERIAL NOT NULL,
    "providerType" VARCHAR(32) NOT NULL,
    "runMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanned" INTEGER NOT NULL,
    "created" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "disabled" INTEGER NOT NULL,
    "error" TEXT,

    CONSTRAINT "auth_provider_sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "binary_data" (
    "fileId" UUID NOT NULL,
    "sourceType" VARCHAR(50) NOT NULL,
    "sourceId" VARCHAR(255) NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" VARCHAR(255),
    "fileName" VARCHAR(255),
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_fc3691585b39408bb0551122af6" PRIMARY KEY ("fileId")
);

-- CreateTable
CREATE TABLE "chat_hub_agent_tools" (
    "agentId" UUID NOT NULL,
    "toolId" UUID NOT NULL,

    CONSTRAINT "PK_cc8806fdea48297a7d497035d72" PRIMARY KEY ("agentId","toolId")
);

-- CreateTable
CREATE TABLE "chat_hub_agents" (
    "id" UUID NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" VARCHAR(512),
    "systemPrompt" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "credentialId" VARCHAR(36),
    "provider" VARCHAR(16) NOT NULL,
    "model" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "icon" JSON,
    "files" JSON NOT NULL DEFAULT '[]',
    "suggestedPrompts" JSON NOT NULL DEFAULT '[]',

    CONSTRAINT "PK_f39a3b36bbdf0e2979ddb21cf78" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_hub_messages" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "previousMessageId" UUID,
    "revisionOfMessageId" UUID,
    "retryOfMessageId" UUID,
    "type" VARCHAR(16) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "content" TEXT NOT NULL,
    "provider" VARCHAR(16),
    "model" VARCHAR(256),
    "workflowId" VARCHAR(36),
    "executionId" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "agentId" UUID,
    "status" VARCHAR(16) NOT NULL DEFAULT 'success',
    "attachments" JSON,

    CONSTRAINT "PK_7704a5add6baed43eef835f0bfb" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_hub_session_tools" (
    "sessionId" UUID NOT NULL,
    "toolId" UUID NOT NULL,

    CONSTRAINT "PK_87aea76ff4c274c4a5ac838ebe3" PRIMARY KEY ("sessionId","toolId")
);

-- CreateTable
CREATE TABLE "chat_hub_sessions" (
    "id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "ownerId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMPTZ(3) NOT NULL,
    "credentialId" VARCHAR(36),
    "provider" VARCHAR(16),
    "model" VARCHAR(256),
    "workflowId" VARCHAR(36),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "agentId" UUID,
    "agentName" VARCHAR(128),
    "type" VARCHAR(16) NOT NULL DEFAULT 'production',

    CONSTRAINT "PK_1eafef1273c70e4464fec703412" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_hub_tools" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "typeVersion" DOUBLE PRECISION NOT NULL,
    "ownerId" UUID NOT NULL,
    "definition" JSON NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_696d26426c704fba79b2c195ef5" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_dependency" (
    "id" SERIAL NOT NULL,
    "credentialId" VARCHAR(36) NOT NULL,
    "dependencyType" VARCHAR(64) NOT NULL,
    "dependencyId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_80212729ed0ffa0709417ab28f4" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials_entity" (
    "name" VARCHAR(128) NOT NULL,
    "data" TEXT NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "id" VARCHAR(36) NOT NULL,
    "isManaged" BOOLEAN NOT NULL DEFAULT false,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isResolvable" BOOLEAN NOT NULL DEFAULT false,
    "resolvableAllowFallback" BOOLEAN NOT NULL DEFAULT false,
    "resolverId" VARCHAR(16),

    CONSTRAINT "credentials_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_table" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "projectId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_e226d0001b9e6097cbfe70617cb" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_table_column" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "index" INTEGER NOT NULL,
    "dataTableId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_673cb121ee4a8a5e27850c72c51" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_credential_entry" (
    "credential_id" VARCHAR(16) NOT NULL,
    "subject_id" VARCHAR(2048) NOT NULL,
    "resolver_id" VARCHAR(16) NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_5135ffcabecad4727ff6b9b803d" PRIMARY KEY ("credential_id","subject_id","resolver_id")
);

-- CreateTable
CREATE TABLE "dynamic_credential_resolver" (
    "id" VARCHAR(16) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_b76cfb088dcdaf5275e9980bb64" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_credential_user_entry" (
    "credentialId" VARCHAR(16) NOT NULL,
    "userId" UUID NOT NULL,
    "resolverId" VARCHAR(16) NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_74f548e633abc66dc27c8f0ca77" PRIMARY KEY ("credentialId","userId","resolverId")
);

-- CreateTable
CREATE TABLE "event_destinations" (
    "id" UUID NOT NULL,
    "destination" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "event_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_annotation_tags" (
    "annotationId" INTEGER NOT NULL,
    "tagId" VARCHAR(24) NOT NULL,

    CONSTRAINT "PK_979ec03d31294cca484be65d11f" PRIMARY KEY ("annotationId","tagId")
);

-- CreateTable
CREATE TABLE "execution_annotations" (
    "id" SERIAL NOT NULL,
    "executionId" INTEGER NOT NULL,
    "vote" VARCHAR(6),
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_7afcf93ffa20c4252869a7c6a23" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_data" (
    "executionId" INTEGER NOT NULL,
    "workflowData" JSON NOT NULL,
    "data" TEXT NOT NULL,
    "workflowVersionId" VARCHAR(36),

    CONSTRAINT "execution_data_pkey" PRIMARY KEY ("executionId")
);

-- CreateTable
CREATE TABLE "execution_entity" (
    "id" SERIAL NOT NULL,
    "finished" BOOLEAN NOT NULL,
    "mode" VARCHAR NOT NULL,
    "retryOf" VARCHAR,
    "retrySuccessId" VARCHAR,
    "startedAt" TIMESTAMPTZ(3),
    "stoppedAt" TIMESTAMPTZ(3),
    "waitTill" TIMESTAMPTZ(3),
    "status" VARCHAR NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "storedAt" VARCHAR(2) NOT NULL DEFAULT 'db',

    CONSTRAINT "pk_e3e63bbf986767844bbe1166d4e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_metadata" (
    "id" SERIAL NOT NULL,
    "executionId" INTEGER NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "PK_17a0b6284f8d626aae88e1c16e4" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "parentFolderId" VARCHAR(36),
    "projectId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_6278a41a706740c94c02e288df8" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_tag" (
    "folderId" VARCHAR(36) NOT NULL,
    "tagId" VARCHAR(36) NOT NULL,

    CONSTRAINT "PK_27e4e00852f6b06a925a4d83a3e" PRIMARY KEY ("folderId","tagId")
);

-- CreateTable
CREATE TABLE "insights_by_period" (
    "id" SERIAL NOT NULL,
    "metaId" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "value" BIGINT NOT NULL,
    "periodUnit" INTEGER NOT NULL,
    "periodStart" TIMESTAMPTZ(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_b606942249b90cc39b0265f0575" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights_metadata" (
    "metaId" SERIAL NOT NULL,
    "workflowId" VARCHAR(36),
    "projectId" VARCHAR(36),
    "workflowName" VARCHAR(128) NOT NULL,
    "projectName" VARCHAR(255) NOT NULL,

    CONSTRAINT "PK_f448a94c35218b6208ce20cf5a1" PRIMARY KEY ("metaId")
);

-- CreateTable
CREATE TABLE "insights_raw" (
    "id" SERIAL NOT NULL,
    "metaId" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "value" BIGINT NOT NULL,
    "timestamp" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_ec15125755151e3a7e00e00014f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installed_nodes" (
    "name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(200) NOT NULL,
    "latestVersion" INTEGER NOT NULL DEFAULT 1,
    "package" VARCHAR(241) NOT NULL,

    CONSTRAINT "PK_8ebd28194e4f792f96b5933423fc439df97d9689" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "installed_packages" (
    "packageName" VARCHAR(214) NOT NULL,
    "installedVersion" VARCHAR(50) NOT NULL,
    "authorName" VARCHAR(70),
    "authorEmail" VARCHAR(70),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_08cc9197c39b028c1e9beca225940576fd1a5804" PRIMARY KEY ("packageName")
);

-- CreateTable
CREATE TABLE "instance_ai_iteration_logs" (
    "id" VARCHAR(36) NOT NULL,
    "threadId" UUID NOT NULL,
    "taskKey" VARCHAR NOT NULL,
    "entry" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_21c2b214b44bc6c34a6d3551c90" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_ai_messages" (
    "id" VARCHAR(36) NOT NULL,
    "threadId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "role" VARCHAR(16) NOT NULL,
    "type" VARCHAR(32),
    "resourceId" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_156c6f287225e9befe0181bb02b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_ai_observational_memory" (
    "id" VARCHAR(36) NOT NULL,
    "lookupKey" VARCHAR(255) NOT NULL,
    "scope" VARCHAR(16) NOT NULL,
    "threadId" UUID,
    "resourceId" VARCHAR(255) NOT NULL,
    "activeObservations" TEXT NOT NULL DEFAULT '',
    "originType" VARCHAR(32) NOT NULL,
    "config" TEXT NOT NULL,
    "generationCount" INTEGER NOT NULL DEFAULT 0,
    "lastObservedAt" TIMESTAMPTZ(3),
    "pendingMessageTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokensObserved" INTEGER NOT NULL DEFAULT 0,
    "observationTokenCount" INTEGER NOT NULL DEFAULT 0,
    "isObserving" BOOLEAN NOT NULL DEFAULT false,
    "isReflecting" BOOLEAN NOT NULL DEFAULT false,
    "observedMessageIds" JSON,
    "observedTimezone" VARCHAR,
    "bufferedObservations" TEXT,
    "bufferedObservationTokens" INTEGER,
    "bufferedMessageIds" JSON,
    "bufferedReflection" TEXT,
    "bufferedReflectionTokens" INTEGER,
    "bufferedReflectionInputTokens" INTEGER,
    "reflectedObservationLineCount" INTEGER,
    "bufferedObservationChunks" JSON,
    "isBufferingObservation" BOOLEAN NOT NULL DEFAULT false,
    "isBufferingReflection" BOOLEAN NOT NULL DEFAULT false,
    "lastBufferedAtTokens" INTEGER NOT NULL DEFAULT 0,
    "lastBufferedAtTime" TIMESTAMPTZ(3),
    "metadata" JSON,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_7192dd00cddba039bf1d3e6a098" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_ai_resources" (
    "id" VARCHAR(255) NOT NULL,
    "workingMemory" TEXT,
    "metadata" JSON,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_45b5b0b6f715dae4292b86603d8" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_ai_run_snapshots" (
    "threadId" UUID NOT NULL,
    "runId" VARCHAR(36) NOT NULL,
    "messageGroupId" VARCHAR(36),
    "runIds" JSON,
    "tree" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_0a5fc9690a84950ebf1416fb146" PRIMARY KEY ("threadId","runId")
);

-- CreateTable
CREATE TABLE "instance_ai_threads" (
    "id" UUID NOT NULL,
    "resourceId" VARCHAR(255) NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "metadata" JSON,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_35575100e45cdedeb89ae0643e9" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_ai_workflow_snapshots" (
    "runId" VARCHAR(36) NOT NULL,
    "workflowName" VARCHAR(255) NOT NULL,
    "resourceId" VARCHAR(255),
    "status" VARCHAR,
    "snapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_93f2696eb321dfe1d7defe7073f" PRIMARY KEY ("runId","workflowName")
);

-- CreateTable
CREATE TABLE "instance_version_history" (
    "id" SERIAL NOT NULL,
    "major" INTEGER NOT NULL,
    "minor" INTEGER NOT NULL,
    "patch" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_874f58cb616935bf49d9dbd67e9" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invalid_auth_token" (
    "token" VARCHAR(512) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PK_5779069b7235b256d91f7af1a15" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_access_tokens" (
    "token" VARCHAR NOT NULL,
    "clientId" VARCHAR NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "PK_dcd71f96a5d5f4bf79e67d322bf" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "oauth_authorization_codes" (
    "code" VARCHAR(255) NOT NULL,
    "clientId" VARCHAR NOT NULL,
    "userId" UUID NOT NULL,
    "redirectUri" VARCHAR NOT NULL,
    "codeChallenge" VARCHAR NOT NULL,
    "codeChallengeMethod" VARCHAR(255) NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "state" VARCHAR,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_fb91ab932cfbd694061501cc20f" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "oauth_clients" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "redirectUris" JSON NOT NULL,
    "grantTypes" JSON NOT NULL,
    "clientSecret" VARCHAR(255),
    "clientSecretExpiresAt" BIGINT,
    "tokenEndpointAuthMethod" VARCHAR(255) NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_refresh_tokens" (
    "token" VARCHAR(255) NOT NULL,
    "clientId" VARCHAR NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_74abaed0b30711b6532598b0392" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "oauth_user_consents" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "clientId" VARCHAR NOT NULL,
    "grantedAt" BIGINT NOT NULL,

    CONSTRAINT "PK_85b9ada746802c8993103470f05" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_data" (
    "workflowId" VARCHAR(36) NOT NULL,
    "context" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "value" TEXT NOT NULL,

    CONSTRAINT "PK_ca04b9d8dc72de268fe07a65773" PRIMARY KEY ("workflowId","context")
);

-- CreateTable
CREATE TABLE "project" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "icon" JSON,
    "description" VARCHAR(512),
    "creatorId" UUID,

    CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_relation" (
    "projectId" VARCHAR(36) NOT NULL,
    "userId" UUID NOT NULL,
    "role" VARCHAR NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_1caaa312a5d7184a003be0f0cb6" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "project_secrets_provider_access" (
    "secretsProviderConnectionId" INTEGER NOT NULL,
    "projectId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "role" VARCHAR(128) NOT NULL DEFAULT 'secretsProviderConnection:user',

    CONSTRAINT "PK_0402b7fcec5415246656f102f83" PRIMARY KEY ("secretsProviderConnectionId","projectId")
);

-- CreateTable
CREATE TABLE "role" (
    "slug" VARCHAR(128) NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "roleType" TEXT,
    "systemRole" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_35c9b140caaf6da09cfabb0d675" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "role_mapping_rule" (
    "id" VARCHAR(16) NOT NULL,
    "expression" TEXT NOT NULL,
    "role" VARCHAR(128) NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_d772c8ec1a89b52d31c882bc560" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_mapping_rule_project" (
    "roleMappingRuleId" VARCHAR(16) NOT NULL,
    "projectId" VARCHAR(36) NOT NULL,

    CONSTRAINT "PK_198c5b5aea509d139274efcaf9a" PRIMARY KEY ("roleMappingRuleId","projectId")
);

-- CreateTable
CREATE TABLE "role_scope" (
    "roleSlug" VARCHAR(128) NOT NULL,
    "scopeSlug" VARCHAR(128) NOT NULL,

    CONSTRAINT "PK_role_scope" PRIMARY KEY ("roleSlug","scopeSlug")
);

-- CreateTable
CREATE TABLE "scope" (
    "slug" VARCHAR(128) NOT NULL,
    "displayName" TEXT,
    "description" TEXT,

    CONSTRAINT "PK_bfc45df0481abd7f355d6187da1" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "secrets_provider_connection" (
    "id" SERIAL NOT NULL,
    "providerKey" VARCHAR(128) NOT NULL,
    "type" VARCHAR(36) NOT NULL,
    "encryptedSettings" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_4350ae85e76f9ba7df1370acb5d" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "loadOnStartup" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_dc0fe14e6d9943f268e7b119f69ab8bd" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "shared_credentials" (
    "credentialsId" VARCHAR(36) NOT NULL,
    "projectId" VARCHAR(36) NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_8ef3a59796a228913f251779cff" PRIMARY KEY ("credentialsId","projectId")
);

-- CreateTable
CREATE TABLE "shared_workflow" (
    "workflowId" VARCHAR(36) NOT NULL,
    "projectId" VARCHAR(36) NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_5ba87620386b847201c9531c58f" PRIMARY KEY ("workflowId","projectId")
);

-- CreateTable
CREATE TABLE "tag_entity" (
    "name" VARCHAR(24) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "id" VARCHAR(36) NOT NULL,

    CONSTRAINT "tag_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_execution" (
    "id" VARCHAR(36) NOT NULL,
    "testRunId" VARCHAR(36) NOT NULL,
    "executionId" INTEGER,
    "status" VARCHAR NOT NULL,
    "runAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "errorCode" VARCHAR,
    "errorDetails" JSON,
    "metrics" JSON,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "inputs" JSON,
    "outputs" JSON,

    CONSTRAINT "PK_90c121f77a78a6580e94b794bce" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_run" (
    "id" VARCHAR(36) NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "status" VARCHAR NOT NULL,
    "errorCode" VARCHAR,
    "errorDetails" JSON,
    "runAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "metrics" JSON,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "runningInstanceId" VARCHAR(255),
    "cancelRequested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_011c050f566e9db509a0fadb9b9" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_exchange_jti" (
    "jti" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PK_d8e8a6f737d530fdd2dd716e89c" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "firstName" VARCHAR(32),
    "lastName" VARCHAR(32),
    "password" VARCHAR(255),
    "personalizationAnswers" JSON,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "settings" JSON,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaRecoveryCodes" TEXT,
    "lastActiveAt" DATE,
    "roleSlug" VARCHAR(128) NOT NULL DEFAULT 'global:member',

    CONSTRAINT "PK_ea8f538c94b6e352418254ed6474a81f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "id" VARCHAR(36) NOT NULL,
    "userId" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "apiKey" VARCHAR NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "scopes" JSON,
    "audience" VARCHAR NOT NULL DEFAULT 'public-api',

    CONSTRAINT "PK_978fa5caa3468f463dac9d92e69" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables" (
    "key" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'string',
    "value" VARCHAR(255),
    "id" VARCHAR(36) NOT NULL,
    "projectId" VARCHAR(36),

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_entity" (
    "webhookPath" VARCHAR NOT NULL,
    "method" VARCHAR NOT NULL,
    "node" VARCHAR NOT NULL,
    "webhookId" VARCHAR,
    "pathLength" INTEGER,
    "workflowId" VARCHAR(36) NOT NULL,

    CONSTRAINT "PK_b21ace2e13596ccd87dc9bf4ea6" PRIMARY KEY ("webhookPath","method")
);

-- CreateTable
CREATE TABLE "workflow_builder_session" (
    "id" UUID NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "userId" UUID NOT NULL,
    "messages" JSON NOT NULL DEFAULT '[]',
    "previousSummary" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "activeVersionCardId" VARCHAR(255),
    "resumeAfterRestoreMessageId" VARCHAR(255),

    CONSTRAINT "PK_e69ef0d385986e273423b0e8695" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_dependency" (
    "id" SERIAL NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "workflowVersionId" INTEGER NOT NULL,
    "dependencyType" VARCHAR(32) NOT NULL,
    "dependencyKey" VARCHAR(255) NOT NULL,
    "dependencyInfo" JSON,
    "indexVersionId" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "publishedVersionId" VARCHAR(36),

    CONSTRAINT "PK_52325e34cd7a2f0f67b0f3cad65" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_entity" (
    "name" VARCHAR(128) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "nodes" JSON NOT NULL,
    "connections" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "settings" JSON,
    "staticData" JSON,
    "pinData" JSON,
    "versionId" CHAR(36) NOT NULL,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "id" VARCHAR(36) NOT NULL,
    "meta" JSON,
    "parentFolderId" VARCHAR(36),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "versionCounter" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "activeVersionId" VARCHAR(36),

    CONSTRAINT "workflow_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "versionId" VARCHAR(36) NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "authors" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "nodes" JSON NOT NULL,
    "connections" JSON NOT NULL,
    "name" VARCHAR(128),
    "autosaved" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "PK_b6572dd6173e4cd06fe79937b58" PRIMARY KEY ("versionId")
);

-- CreateTable
CREATE TABLE "workflow_publish_history" (
    "id" SERIAL NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "versionId" VARCHAR(36) NOT NULL,
    "event" VARCHAR(36) NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_c788f7caf88e91e365c97d6d04a" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_published_version" (
    "workflowId" VARCHAR(36) NOT NULL,
    "publishedVersionId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT "PK_5c76fb7ee939fe2530374d3f75a" PRIMARY KEY ("workflowId")
);

-- CreateTable
CREATE TABLE "workflow_statistics" (
    "count" BIGINT DEFAULT 0,
    "latestEvent" TIMESTAMPTZ(3),
    "name" VARCHAR(128) NOT NULL,
    "workflowId" VARCHAR(36) NOT NULL,
    "rootCount" BIGINT DEFAULT 0,
    "id" SERIAL NOT NULL,
    "workflowName" VARCHAR(128),

    CONSTRAINT "workflow_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows_tags" (
    "workflowId" VARCHAR(36) NOT NULL,
    "tagId" VARCHAR(36) NOT NULL,

    CONSTRAINT "pk_workflows_tags" PRIMARY KEY ("workflowId","tagId")
);

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrice_assetId_date_key" ON "DailyPrice"("assetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_cashTransactionId_key" ON "Transaction"("cashTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "CashTransaction_userId_idx" ON "CashTransaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSnapshot_userId_date_key" ON "PortfolioSnapshot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_ae51b54c4bb430cf92f48b623f" ON "annotation_tag_entity"("name");

-- CreateIndex
CREATE INDEX "IDX_56900edc3cfd16612e2ef2c6a8" ON "binary_data"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "IDX_chat_hub_messages_sessionId" ON "chat_hub_messages"("sessionId");

-- CreateIndex
CREATE INDEX "IDX_chat_hub_sessions_owner_lastmsg_id" ON "chat_hub_sessions"("ownerId", "lastMessageAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_4c72ebdb265d1775bf61147af0" ON "chat_hub_tools"("ownerId", "name");

-- CreateIndex
CREATE INDEX "IDX_5ec8e8c8d3539f3696cf73b43b" ON "credential_dependency"("credentialId");

-- CreateIndex
CREATE INDEX "IDX_91ee85fa9619dd6776725e117b" ON "credential_dependency"("dependencyType", "dependencyId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_credential_dependency_credentialId_dependencyType_dependenc" ON "credential_dependency"("credentialId", "dependencyType", "dependencyId");

-- CreateIndex
CREATE UNIQUE INDEX "pk_credentials_entity_id" ON "credentials_entity"("id");

-- CreateIndex
CREATE INDEX "idx_07fde106c0b471d8cc80a64fc8" ON "credentials_entity"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_b23096ef747281ac944d28e8b0d" ON "data_table"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_8082ec4890f892f0bc77473a123" ON "data_table_column"("dataTableId", "name");

-- CreateIndex
CREATE INDEX "IDX_62476b94b56d9dc7ed9ed75d3d" ON "dynamic_credential_entry"("subject_id");

-- CreateIndex
CREATE INDEX "IDX_d61a12235d268a49af6a3c09c1" ON "dynamic_credential_entry"("resolver_id");

-- CreateIndex
CREATE INDEX "IDX_9c9ee9df586e60bb723234e499" ON "dynamic_credential_resolver"("type");

-- CreateIndex
CREATE INDEX "IDX_6edec973a6450990977bb854c3" ON "dynamic_credential_user_entry"("resolverId");

-- CreateIndex
CREATE INDEX "IDX_a36dc616fabc3f736bb82410a2" ON "dynamic_credential_user_entry"("userId");

-- CreateIndex
CREATE INDEX "IDX_a3697779b366e131b2bbdae297" ON "execution_annotation_tags"("tagId");

-- CreateIndex
CREATE INDEX "IDX_c1519757391996eb06064f0e7c" ON "execution_annotation_tags"("annotationId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_97f863fa83c4786f1956508496" ON "execution_annotations"("executionId");

-- CreateIndex
CREATE INDEX "IDX_execution_entity_deletedAt" ON "execution_entity"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_cec8eea3bf49551482ccb4933e" ON "execution_metadata"("executionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_14f68deffaf858465715995508" ON "folder"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_60b6a84299eeb3f671dfec7693" ON "insights_by_period"("periodStart", "type", "periodUnit", "metaId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_1d8ab99d5861c9388d2dc1cf73" ON "insights_metadata"("workflowId");

-- CreateIndex
CREATE INDEX "IDX_02751202c9a2ad75f2d8e14f5e" ON "instance_ai_iteration_logs"("threadId", "taskKey", "createdAt");

-- CreateIndex
CREATE INDEX "IDX_1eeb64cb9d66a927988de759e6" ON "instance_ai_messages"("threadId");

-- CreateIndex
CREATE INDEX "IDX_76e212c6867fbaa06bf0decd6f" ON "instance_ai_messages"("resourceId");

-- CreateIndex
CREATE INDEX "IDX_92f13cb6bc694227e069447f7b" ON "instance_ai_observational_memory"("lookupKey");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_a680ac96aae02dc887bbaac512" ON "instance_ai_observational_memory"("scope", "threadId", "resourceId");

-- CreateIndex
CREATE INDEX "IDX_d3a2bc880e7a8626802e5474ad" ON "instance_ai_run_snapshots"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "IDX_d926c16c2ad9728cb9a81790c0" ON "instance_ai_run_snapshots"("threadId", "messageGroupId");

-- CreateIndex
CREATE INDEX "IDX_f36dea4d38fe92e0e8f44d5a56" ON "instance_ai_threads"("resourceId");

-- CreateIndex
CREATE INDEX "IDX_a371ee6b8e0ebb5635f8baa46d" ON "instance_ai_workflow_snapshots"("workflowName", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_083721d99ce8db4033e2958ebb4" ON "oauth_user_consents"("userId", "clientId");

-- CreateIndex
CREATE INDEX "IDX_5f0643f6717905a05164090dde" ON "project_relation"("userId");

-- CreateIndex
CREATE INDEX "IDX_61448d56d61802b5dfde5cdb00" ON "project_relation"("projectId");

-- CreateIndex
CREATE INDEX "project_relation_role_idx" ON "project_relation"("role");

-- CreateIndex
CREATE INDEX "project_relation_role_project_idx" ON "project_relation"("projectId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_UniqueRoleDisplayName" ON "role"("displayName");

-- CreateIndex
CREATE INDEX "IDX_bb66e404c35996b0d694617750" ON "role_mapping_rule"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_b33ac896ad3099fc8de36fdc1c4" ON "role_mapping_rule"("type", "order");

-- CreateIndex
CREATE INDEX "IDX_35a78869286c65d9330d02b88f" ON "role_mapping_rule_project"("projectId");

-- CreateIndex
CREATE INDEX "IDX_role_scope_scopeSlug" ON "role_scope"("scopeSlug");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_secrets_provider_connection_providerKey" ON "secrets_provider_connection"("providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "idx_812eb05f7451ca757fb98444ce" ON "tag_entity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pk_tag_entity_id" ON "tag_entity"("id");

-- CreateIndex
CREATE INDEX "IDX_8e4b4774db42f1e6dda3452b2a" ON "test_case_execution"("testRunId");

-- CreateIndex
CREATE INDEX "IDX_d6870d3b6e4c185d33926f423c" ON "test_run"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e2" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("roleSlug");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_1ef35bac35d20bdae979d917a3" ON "user_api_keys"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_63d7bbae72c767cf162d459fcc" ON "user_api_keys"("userId", "label");

-- CreateIndex
CREATE INDEX "idx_16f4436789e804e3e1c9eeb240" ON "webhook_entity"("webhookId", "method", "pathLength");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_ec2aa73632932d485a1d5192ce1" ON "workflow_builder_session"("workflowId", "userId");

-- CreateIndex
CREATE INDEX "IDX_a4ff2d9b9628ea988fa9e7d0bf" ON "workflow_dependency"("workflowId");

-- CreateIndex
CREATE INDEX "IDX_e48a201071ab85d9d09119d640" ON "workflow_dependency"("dependencyKey");

-- CreateIndex
CREATE INDEX "IDX_e7fe1cfda990c14a445937d0b9" ON "workflow_dependency"("dependencyType");

-- CreateIndex
CREATE INDEX "IDX_workflow_dependency_publishedVersionId" ON "workflow_dependency"("publishedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "pk_workflow_entity_id" ON "workflow_entity"("id");

-- CreateIndex
CREATE INDEX "IDX_workflow_entity_name" ON "workflow_entity"("name");

-- CreateIndex
CREATE INDEX "IDX_1e31657f5fe46816c34be7c1b4" ON "workflow_history"("workflowId");

-- CreateIndex
CREATE INDEX "IDX_070b5de842ece9ccdda0d9738b" ON "workflow_publish_history"("workflowId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_workflow_statistics_workflow_name" ON "workflow_statistics"("workflowId", "name");

-- CreateIndex
CREATE INDEX "idx_workflows_tags_workflow_id" ON "workflows_tags"("workflowId");

-- AddForeignKey
ALTER TABLE "DailyPrice" ADD CONSTRAINT "DailyPrice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cashTransactionId_fkey" FOREIGN KEY ("cashTransactionId") REFERENCES "CashTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermDeposit" ADD CONSTRAINT "TermDeposit_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_agent_tools" ADD CONSTRAINT "FK_2b53d796b3dbae91b1a9553c048" FOREIGN KEY ("agentId") REFERENCES "chat_hub_agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_agent_tools" ADD CONSTRAINT "FK_43e70f04c53344f82483d0570f6" FOREIGN KEY ("toolId") REFERENCES "chat_hub_tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_agents" ADD CONSTRAINT "FK_441ba2caba11e077ce3fbfa2cd8" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_agents" ADD CONSTRAINT "FK_9c61ad497dcbae499c96a6a78ba" FOREIGN KEY ("credentialId") REFERENCES "credentials_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_1f4998c8a7dec9e00a9ab15550e" FOREIGN KEY ("revisionOfMessageId") REFERENCES "chat_hub_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_25c9736e7f769f3a005eef4b372" FOREIGN KEY ("retryOfMessageId") REFERENCES "chat_hub_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_6afb260449dd7a9b85355d4e0c9" FOREIGN KEY ("executionId") REFERENCES "execution_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_acf8926098f063cdbbad8497fd1" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_chat_hub_messages_agentId" FOREIGN KEY ("agentId") REFERENCES "chat_hub_agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_e22538eb50a71a17954cd7e076c" FOREIGN KEY ("sessionId") REFERENCES "chat_hub_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_messages" ADD CONSTRAINT "FK_e5d1fa722c5a8d38ac204746662" FOREIGN KEY ("previousMessageId") REFERENCES "chat_hub_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_session_tools" ADD CONSTRAINT "FK_6596a328affd8d4967ffb303eee" FOREIGN KEY ("toolId") REFERENCES "chat_hub_tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_session_tools" ADD CONSTRAINT "FK_e649bf1295f4ed8d4299ed290f9" FOREIGN KEY ("sessionId") REFERENCES "chat_hub_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_sessions" ADD CONSTRAINT "FK_7bc13b4c7e6afbfaf9be326c189" FOREIGN KEY ("credentialId") REFERENCES "credentials_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_sessions" ADD CONSTRAINT "FK_9f9293d9f552496c40e0d1a8f80" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_sessions" ADD CONSTRAINT "FK_chat_hub_sessions_agentId" FOREIGN KEY ("agentId") REFERENCES "chat_hub_agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_sessions" ADD CONSTRAINT "FK_e9ecf8ede7d989fcd18790fe36a" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_hub_tools" ADD CONSTRAINT "FK_b8030b47af9213f1fd15450fb7f" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credential_dependency" ADD CONSTRAINT "FK_5ec8e8c8d3539f3696cf73b43bf" FOREIGN KEY ("credentialId") REFERENCES "credentials_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credentials_entity" ADD CONSTRAINT "credentials_entity_resolverId_foreign" FOREIGN KEY ("resolverId") REFERENCES "dynamic_credential_resolver"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_table" ADD CONSTRAINT "FK_c2a794257dee48af7c9abf681de" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_table_column" ADD CONSTRAINT "FK_930b6e8faaf88294cef23484160" FOREIGN KEY ("dataTableId") REFERENCES "data_table"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dynamic_credential_entry" ADD CONSTRAINT "FK_a6d1dd080958304a47a02952aab" FOREIGN KEY ("credential_id") REFERENCES "credentials_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dynamic_credential_entry" ADD CONSTRAINT "FK_d61a12235d268a49af6a3c09c13" FOREIGN KEY ("resolver_id") REFERENCES "dynamic_credential_resolver"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dynamic_credential_user_entry" ADD CONSTRAINT "FK_6edec973a6450990977bb854c38" FOREIGN KEY ("resolverId") REFERENCES "dynamic_credential_resolver"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dynamic_credential_user_entry" ADD CONSTRAINT "FK_945ba70b342a066d1306b12ccd2" FOREIGN KEY ("credentialId") REFERENCES "credentials_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dynamic_credential_user_entry" ADD CONSTRAINT "FK_a36dc616fabc3f736bb82410a22" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_annotation_tags" ADD CONSTRAINT "FK_a3697779b366e131b2bbdae2976" FOREIGN KEY ("tagId") REFERENCES "annotation_tag_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_annotation_tags" ADD CONSTRAINT "FK_c1519757391996eb06064f0e7c8" FOREIGN KEY ("annotationId") REFERENCES "execution_annotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_annotations" ADD CONSTRAINT "FK_97f863fa83c4786f19565084960" FOREIGN KEY ("executionId") REFERENCES "execution_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_data" ADD CONSTRAINT "execution_data_fk" FOREIGN KEY ("executionId") REFERENCES "execution_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_entity" ADD CONSTRAINT "fk_execution_entity_workflow_id" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "execution_metadata" ADD CONSTRAINT "FK_31d0b4c93fb85ced26f6005cda3" FOREIGN KEY ("executionId") REFERENCES "execution_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "FK_804ea52f6729e3940498bd54d78" FOREIGN KEY ("parentFolderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "FK_a8260b0b36939c6247f385b8221" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "folder_tag" ADD CONSTRAINT "FK_94a60854e06f2897b2e0d39edba" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "folder_tag" ADD CONSTRAINT "FK_dc88164176283de80af47621746" FOREIGN KEY ("tagId") REFERENCES "tag_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insights_by_period" ADD CONSTRAINT "FK_6414cfed98daabbfdd61a1cfbc0" FOREIGN KEY ("metaId") REFERENCES "insights_metadata"("metaId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insights_metadata" ADD CONSTRAINT "FK_1d8ab99d5861c9388d2dc1cf733" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insights_metadata" ADD CONSTRAINT "FK_2375a1eda085adb16b24615b69c" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insights_raw" ADD CONSTRAINT "FK_6e2e33741adef2a7c5d66befa4e" FOREIGN KEY ("metaId") REFERENCES "insights_metadata"("metaId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "installed_nodes" ADD CONSTRAINT "FK_73f857fc5dce682cef8a99c11dbddbc969618951" FOREIGN KEY ("package") REFERENCES "installed_packages"("packageName") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_ai_iteration_logs" ADD CONSTRAINT "FK_8bfcc6c51fd3d69b1eae8aebd49" FOREIGN KEY ("threadId") REFERENCES "instance_ai_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "instance_ai_messages" ADD CONSTRAINT "FK_1eeb64cb9d66a927988de759e6e" FOREIGN KEY ("threadId") REFERENCES "instance_ai_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "instance_ai_observational_memory" ADD CONSTRAINT "FK_34018c303885cd37093458e6409" FOREIGN KEY ("threadId") REFERENCES "instance_ai_threads"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "instance_ai_run_snapshots" ADD CONSTRAINT "FK_2f63fa21d09d7918f347ddbdf70" FOREIGN KEY ("threadId") REFERENCES "instance_ai_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "FK_7234a36d8e49a1fa85095328845" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "FK_78b26968132b7e5e45b75876481" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "FK_64d965bd072ea24fb6da55468cd" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "FK_aa8d3560484944c19bdf79ffa16" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "FK_a699f3ed9fd0c1b19bc2608ac53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "FK_b388696ce4d8be7ffbe8d3e4b69" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_user_consents" ADD CONSTRAINT "FK_21e6c3c2d78a097478fae6aaefa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oauth_user_consents" ADD CONSTRAINT "FK_a651acea2f6c97f8c4514935486" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "processed_data" ADD CONSTRAINT "FK_06a69a7032c97a763c2c7599464" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "projects_creatorId_foreign" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_relation" ADD CONSTRAINT "FK_5f0643f6717905a05164090dde7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_relation" ADD CONSTRAINT "FK_61448d56d61802b5dfde5cdb002" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_relation" ADD CONSTRAINT "FK_c6b99592dc96b0d836d7a21db91" FOREIGN KEY ("role") REFERENCES "role"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_secrets_provider_access" ADD CONSTRAINT "FK_18e5c27d2524b1638b292904e48" FOREIGN KEY ("secretsProviderConnectionId") REFERENCES "secrets_provider_connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_secrets_provider_access" ADD CONSTRAINT "FK_bd264b81209355b543878deedb1" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_mapping_rule" ADD CONSTRAINT "FK_bb66e404c35996b0d6946177501" FOREIGN KEY ("role") REFERENCES "role"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_mapping_rule_project" ADD CONSTRAINT "FK_35a78869286c65d9330d02b88f5" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_mapping_rule_project" ADD CONSTRAINT "FK_dd7ce4dfa09e95b36a626bd9de3" FOREIGN KEY ("roleMappingRuleId") REFERENCES "role_mapping_rule"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_scope" ADD CONSTRAINT "FK_role" FOREIGN KEY ("roleSlug") REFERENCES "role"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_scope" ADD CONSTRAINT "FK_scope" FOREIGN KEY ("scopeSlug") REFERENCES "scope"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_credentials" ADD CONSTRAINT "FK_416f66fc846c7c442970c094ccf" FOREIGN KEY ("credentialsId") REFERENCES "credentials_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shared_credentials" ADD CONSTRAINT "FK_812c2852270da1247756e77f5a4" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shared_workflow" ADD CONSTRAINT "FK_a45ea5f27bcfdc21af9b4188560" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shared_workflow" ADD CONSTRAINT "FK_daa206a04983d47d0a9c34649ce" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_case_execution" ADD CONSTRAINT "FK_8e4b4774db42f1e6dda3452b2af" FOREIGN KEY ("testRunId") REFERENCES "test_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_case_execution" ADD CONSTRAINT "FK_e48965fac35d0f5b9e7f51d8c44" FOREIGN KEY ("executionId") REFERENCES "execution_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_run" ADD CONSTRAINT "FK_d6870d3b6e4c185d33926f423c8" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "FK_eaea92ee7bfb9c1b6cd01505d56" FOREIGN KEY ("roleSlug") REFERENCES "role"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_api_keys" ADD CONSTRAINT "FK_e131705cbbc8fb589889b02d457" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "FK_42f6c766f9f9d2edcc15bdd6e9b" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "webhook_entity" ADD CONSTRAINT "fk_webhook_entity_workflow_id" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_builder_session" ADD CONSTRAINT "FK_00290cdeee4d4d7db84709be936" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_builder_session" ADD CONSTRAINT "FK_7983c618db48f47bf5a4cc1e1e4" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_dependency" ADD CONSTRAINT "FK_a4ff2d9b9628ea988fa9e7d0bf8" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_entity" ADD CONSTRAINT "FK_08d6c67b7f722b0039d9d5ed620" FOREIGN KEY ("activeVersionId") REFERENCES "workflow_history"("versionId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_entity" ADD CONSTRAINT "fk_workflow_parent_folder" FOREIGN KEY ("parentFolderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "FK_1e31657f5fe46816c34be7c1b4b" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_publish_history" ADD CONSTRAINT "FK_6eab5bd9eedabe9c54bd879fc40" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_publish_history" ADD CONSTRAINT "FK_b4cfbc7556d07f36ca177f5e473" FOREIGN KEY ("versionId") REFERENCES "workflow_history"("versionId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_publish_history" ADD CONSTRAINT "FK_c01316f8c2d7101ec4fa9809267" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_published_version" ADD CONSTRAINT "FK_5c76fb7ee939fe2530374d3f75a" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_published_version" ADD CONSTRAINT "FK_df3428a541b802d6a63ac56e330" FOREIGN KEY ("publishedVersionId") REFERENCES "workflow_history"("versionId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflows_tags" ADD CONSTRAINT "fk_workflows_tags_tag_id" FOREIGN KEY ("tagId") REFERENCES "tag_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflows_tags" ADD CONSTRAINT "fk_workflows_tags_workflow_id" FOREIGN KEY ("workflowId") REFERENCES "workflow_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
