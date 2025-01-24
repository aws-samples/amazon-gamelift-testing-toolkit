#!/bin/bash
sudo dnf install -y 'dnf-command(config-manager)'

sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm

sudo awk '
    /^\[amazonlinux\]/ {in_section=1}
    /^$/ && in_section {print "excludepkgs=dotnet*,aspnet*,netstandard*"; in_section=0}
    {print}
' /etc/yum.repos.d/amazonlinux.repo > temp && sudo mv temp /etc/yum.repos.d/amazonlinux.repo

sudo dnf install -y dotnet-sdk-7.0 openssl-libs unzip

sudo dnf config-manager --add-repo https://download.mono-project.com/repo/centos8-stable.repo
sudo dnf install -y mono-complete nuget mono-devel

sudo curl -O https://gamelift-server-sdk-release.s3.us-west-2.amazonaws.com/csharp/GameLift-CSharp-ServerSDK-5.1.1.zip
sudo mkdir DLL
sudo mkdir aws-gamelift-sdk-temp
sudo unzip GameLift-CSharp-ServerSDK-5.1.1.zip -d aws-gamelift-sdk-temp
sudo rm GameLift-CSharp-ServerSDK-5.1.1.zip

cd aws-gamelift-sdk-temp/src/
sudo nuget restore GameLiftServerSDK.sln 
sudo msbuild GameLiftServerSDK.sln -property:Configuration=Release -property:TargetFrameworkVersion=v4.6.2
sudo cp src/GameLiftServerSDK/bin/x64/Release/net6.0/* ../../DLL/
cd ../../
sudo rm -rf aws-gamelift-sdk-temp

sudo dotnet publish -c SampleGameBuild.csproj -r linux-x64 --self-contained true
sudo cp ./log4net.config ./bin/SampleGameBuild.csproj/net6.0/linux-x64/
sudo cp ./QuizConfig.json ./bin/SampleGameBuild.csproj/net6.0/linux-x64/
