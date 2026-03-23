# ============================================================
# Kuikly Web E2E — Docker 测试环境
#
# 基于 Playwright 官方镜像，确保本地与 CI 截图像素级一致。
#
# 用法（通过 docker-compose，推荐）：
#   docker compose run --rm e2e            # 运行全量测试
#   docker compose run --rm update         # 更新基准截图
#
# 用法（直接 docker run）：
#   docker build -t kuikly-e2e .
#   docker run --rm \
#     -v $(pwd):/app/web-e2e \
#     -v $(pwd)/../h5App:/app/h5App:ro \
#     -v $(pwd)/../demo:/app/demo:ro \
#     kuikly-e2e
# ============================================================
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app/web-e2e

# 单独拷贝 package.json，利用 Docker 层缓存：
# 只有依赖变化时才重新 npm ci，代码变化不会触发重装。
COPY package.json ./

RUN npm ci

# 拷贝其余测试代码（Dockerfile、.dockerignore 已排除无关文件）
COPY . .

# 默认运行全量测试；docker compose 各 service 可覆盖此命令
CMD ["npm", "test"]
