# Changelog

All notable changes to this project will be documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `global.json` pinning .NET SDK to 8.0.420 for reproducible builds
- `engines.node` field set to `>=18` in the UI package
- Multi-stage Dockerfile for the sample game, reducing virtual-player container image size

### Changed

#### Runtime & Framework

- Management Console backend: .NET 6 → .NET 8 (`ManagementConsoleBackend.csproj`, `ManagementConsoleInfra.csproj`)
- Sample game: .NET 6 → .NET 8 (`SampleGameInfra.csproj`, `SampleGameBackend.csproj`, `SampleGameBuild.csproj`)
- Lambda runtime: `dotnetcore3.1` → `dotnet8` in both `aws-lambda-tools-defaults.json` files
- CDK `Runtime.DOTNET_6` → `Runtime.DOTNET_8` in both `Program.cs` files
- Sample game Dockerfile and `install.sh`: `dotnet-sdk-7.0` → `dotnet-sdk-8.0`
- All hardcoded `net6.0` path references under `SampleGame/` updated to `net8.0` (Dockerfile, `install.sh`, `BackendStack.cs`, `InfraStage.cs`, `VirtualPlayersStack.cs`)

#### CDK & Infrastructure

- `Amazon.CDK.Lib`: 2.124.0 → 2.253.x (latest stable)
- `Constructs`: 10.3.0 → 10.5.x
- `Cdklabs.CdkNag`: 2.28.23 → current
- `aws-cdk` CLI: 2.124.0 → matching latest
- `WebStack.cs`: migrated deprecated `CloudFrontWebDistribution` to `Distribution` with Origin Access Control (OAC)
- `DataStack.cs`: replaced all `TableProps.PointInTimeRecovery` usages with `PointInTimeRecoverySpecification`
- `BackendStack.cs` (Sample Game): removed deprecated `CfnFleetProps` capacity scalars (`MaxSize`, `MinSize`, `DesiredEc2Instances`) from both fleet definitions
- `BackendStack.cs` (Sample Game): replaced deprecated `PointInTimeRecovery` boolean with `PointInTimeRecoverySpecification`
- `BackendStack.cs` (Sample Game): updated fleet `Ec2InstanceType` from `c4.large` → `c5.large` (both OnDemand and Spot fleets)
- Cognito: removed `Amazon.CDK.AWS.Cognito.IdentityPool.Alpha` package and migrated to stable `Amazon.CDK.AWS.Cognito` API (both Management Console and Sample Game)
- GameLift Server SDK: 5.1.1 → 5.4.0 (Dockerfile, `install.sh`, `install.ps1`, `InfraStage.cs`)
- GameLift Server SDK DLL copy: replaced hardcoded per-file copies with wildcard `*.dll` pattern in Dockerfile and `install.sh`

#### AWS SDK & Lambda Packages

- All `AWSSDK.*` packages bumped to latest 3.7.x patches (Management Console and Sample Game)
- All `Amazon.Lambda.*` packages bumped to current patch releases (`Amazon.Lambda.Serialization.SystemTextJson` stays on 2.x)

#### UI Dependencies

- `@types/node`: 14 → 20
- `typescript`: 4 → 5
- `webpack-cli`: 4 → 5
- `webpack-dev-server`: 4 → 5
- `babel-loader`: 8 → 9
- `copy-webpack-plugin`: 9 → 12
- `clean-webpack-plugin`: 4.0.0-alpha.0 → 4.0.0 (stable)
- `jsoneditor`: 9 → 10
- `@aws-amplify/auth`: 4.x → `aws-amplify` 6.x + `@aws-amplify/auth` v6
- Migrated all Amplify call sites to v6 named imports (`Auth.signIn` → `signIn`, etc.)
- Updated `Amplify.configure` to v6 shape (`Auth.Cognito.userPoolId` / `userPoolClientId`)
- Replaced `aws-sdk-js-v3` GitHub tarball with explicit `@aws-sdk/client-*` packages

#### CI & Docs

- `.github/workflows/build.yml`: `actions/checkout@v3` → `@v4`, `actions/setup-dotnet@v3` → `@v4`, `actions/upload-artifact@v2` → `@v4`
- `.github/workflows/build.yml`: SDK sourced from `global.json` instead of explicit `dotnet-version` matrix
- `.github/workflows/docs.yml`: `actions/checkout@v2` → `@v4`, `actions/setup-python@v2` → `@v5`, pinned `python-version: '3.12'`, pinned `mkdocs-material>=9.5.32`
- `.github/workflows/release-prep.yml`: `actions/checkout@v2` → `@v4`, replaced deprecated `::set-output` with `$GITHUB_OUTPUT`, bumped `jacobtomlinson/gha-find-replace` v2 → v3 and `peter-evans/create-pull-request` v3 → v7
- `.github/workflows/release-drafter.yml`: `release-drafter/release-drafter` v5 → v6
- `docs/docs/Dockerfile`: `python:3.9.2-alpine3.13` → `python:3.12-alpine3.19`
- `README.md`: updated prerequisites to reflect .NET 8 and Node 18.x
- `docs/docs/quick_start.md`: updated prerequisites and added bootstrap step
- `docs/docs/toolkit_design.md`: updated Lambda runtime reference to .NET 8
- `docs/docs/security.md`: updated CloudFront section to reflect OAC migration
- `docs/docs/additional_resources.md`: updated to reflect current pricing and instance type

### Fixed

- Virtual player container launch path corrected in `InfraStage.cs` and `VirtualPlayersStack.cs` (`/local/game/publish/SampleGameBuild` → `/local/game/SampleGameBuild`) to match multi-stage Dockerfile output layout
- MSB3243 assembly version conflict warning resolved by removing redundant `System.Net.WebSockets.Client` reference (net8.0 shared framework provides it)
- NU1902 build warning suppressed via `<NoWarn>` for `log4net` 2.0.15 (CVE-2026-40021 only affects unused XmlLayout; pinned to match GameLift SDK)

### Removed

- Stale `bin/Release/net6.0` and `obj/Release/net6.0` build output directories
- Unused `matrix.net-version` and `matrix.os` references from CI build workflow
