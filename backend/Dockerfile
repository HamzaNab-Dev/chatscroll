# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ChatScroll.slnx .
COPY src/ChatScroll.Api/ChatScroll.Api.csproj src/ChatScroll.Api/
COPY src/ChatScroll.Core/ChatScroll.Core.csproj src/ChatScroll.Core/
COPY src/ChatScroll.Application/ChatScroll.Application.csproj src/ChatScroll.Application/
COPY src/ChatScroll.Infrastructure/ChatScroll.Infrastructure.csproj src/ChatScroll.Infrastructure/

# Restore
RUN dotnet restore

# Copy everything else
COPY src/ src/

# Build and publish
RUN dotnet publish src/ChatScroll.Api/ChatScroll.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# App Runner uses port 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "ChatScroll.Api.dll"]
