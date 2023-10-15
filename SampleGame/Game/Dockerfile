FROM amazonlinux:2023
RUN dnf install -y 'dnf-command(config-manager)'
RUN mkdir /local/game
WORKDIR /local/game/
RUN dnf config-manager --add-repo https://download.mono-project.com/repo/centos8-stable.repo
RUN dnf install -y mono-complete nuget mono-devel
RUN rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm ;
RUN dnf install -y dotnet-sdk-7.0 openssl-libs unzip
RUN curl -O https://gamelift-server-sdk-release.s3.us-west-2.amazonaws.com/csharp/GameLift-CSharp-ServerSDK-5.1.1.zip ;\
mkdir aws-gamelift-sdk-temp ;\
unzip GameLift-CSharp-ServerSDK-5.1.1.zip -d aws-gamelift-sdk-temp ;\
rm GameLift-CSharp-ServerSDK-5.1.1.zip
RUN mkdir -p DLL ;\
cd aws-gamelift-sdk-temp/src ;\
nuget restore GameLiftServerSDK.sln ;\
msbuild GameLiftServerSDK.sln -property:Configuration=Release -property:TargetFrameworkVersion=v4.6.2 ;\
cp src/GameLiftServerSDK/bin/x64/Release/net6.0/* ../../DLL/ ;\
cd ../.. ;\
rm -rf aws-gamelift-sdk-temp
COPY . /local/game/
RUN /bin/dotnet publish -c SampleGameBuild.csproj -r linux-x64 --self-contained true ;\
cp /local/game/log4net.config /local/game/bin/SampleGameBuild.csproj/net6.0/linux-x64/ ;\
cp /local/game/QuizConfig.json /local/game/bin/SampleGameBuild.csproj/net6.0/linux-x64/
CMD tail -f
