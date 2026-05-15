#!/bin/bash
sudo dnf install -y 'dnf-command(config-manager)'

sudo dnf install -y dotnet-sdk-8.0 openssl-libs unzip libicu git

sudo git clone --depth 1 --branch v5.4.0 https://github.com/amazon-gamelift/amazon-gamelift-servers-csharp-server-sdk.git aws-gamelift-sdk-temp
sudo mkdir DLL

cd aws-gamelift-sdk-temp/src/GameLiftServerSDK/
sudo dotnet publish -c Release -f net8.0 -o ../../../DLL/
cd ../../../
sudo rm -rf aws-gamelift-sdk-temp

sudo dotnet publish SampleGameBuild.csproj -c Release -r linux-x64 --self-contained true -o ./publish
sudo cp ./DLL/*.dll ./publish/
sudo cp ./log4net.config ./publish/
sudo cp ./QuizConfig.json ./publish/
