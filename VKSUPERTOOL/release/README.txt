Release binaries are intentionally not stored in git.

Build locally:
cd VKSUPERTOOL
tsc -p tsconfig.json && cp src/nodes/VkApi/vk.svg dist/nodes/VkApi/vk.svg
npm pack --pack-destination release

Install in n8n custom extensions:
npm install ./n8n-nodes-vksupertool-0.1.0.tgz
