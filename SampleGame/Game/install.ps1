[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls, [Net.SecurityProtocolType]::Tls11, [Net.SecurityProtocolType]::Tls12, [Net.SecurityProtocolType]::Ssl3
[Net.ServicePointManager]::SecurityProtocol = "Tls, Tls11, Tls12, Ssl3"
Invoke-WebRequest -Uri https://dot.net/v1/dotnet-install.ps1 -UseBasicParsing -OutFile dotnet-install.ps1
./dotnet-install.ps1 -Channel LTS
Invoke-WebRequest -Uri https://github.com/amazon-gamelift/amazon-gamelift-servers-csharp-server-sdk/archive/refs/tags/v5.4.0.zip -OutFile GameLift-CSharp-ServerSDK-5.4.0.zip
Expand-Archive GameLift-CSharp-ServerSDK-5.4.0.zip
mkdir DLL
cd .\GameLift-CSharp-ServerSDK-5.4.0\amazon-gamelift-servers-csharp-server-sdk-5.4.0\
dotnet restore .\GameLiftServerSDK.sln
dotnet msbuild .\GameLiftServerSDK.sln -property:Configuration=Release -property:TargetFrameworkVersion=v4.6.2
cp .\src\GameLiftServerSDK\bin\x64\Release\net462\* ..\..\DLL\
cd ..\..\
rm -r -fo .\GameLift-CSharp-ServerSDK-5.4.0\
dotnet publish -c SampleGameBuild.csproj -r win-x64 --self-contained true
