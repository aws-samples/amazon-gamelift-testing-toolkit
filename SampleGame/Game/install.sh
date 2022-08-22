#!/bin/bash
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
sudo yum -y install dotnet-sdk-5.0 openssl-libs unzip yum-utils

sudo mkdir -p mono_dependencies
cd mono_dependencies
sudo rpm --import "http://keyserver.ubuntu.com/pks/lookup?op=get&search=0x3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF"
sudo yum-config-manager --add-repo http://download.mono-project.com/repo/centos/
sudo yum -y install mono-devel mono-complete nuget
cd ..
sudo rm -rf mono_dependencies

sudo curl -O https://gamelift-release.s3-us-west-2.amazonaws.com/GameLift_06_03_2021.zip
sudo mkdir DLL
sudo mkdir aws-gamelift-sdk-temp
sudo unzip GameLift_06_03_2021.zip -d aws-gamelift-sdk-temp
sudo rm GameLift_06_03_2021.zip
cd aws-gamelift-sdk-temp/GameLift-SDK-Release-4.0.2/GameLift-CSharp-ServerSDK-4.0.2/
sudo nuget restore
sudo msbuild GameLiftServerSDKNet45.sln -property:Configuration=Release
sudo cp Net45/bin/Release/* ../../../DLL/
cd ../../..
sudo rm -rf aws-gamelift-sdk-temp

sudo dotnet publish -c SampleGameBuild.csproj -r linux-x64 --self-contained true
sudo cp ./log4net.config ./bin/SampleGameBuild.csproj/net5.0/linux-x64/
sudo cp ./QuizConfig.json ./bin/SampleGameBuild.csproj/net5.0/linux-x64/