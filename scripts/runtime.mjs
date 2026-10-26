// 与锁定的 Vite / Vitest 的 Node 支持范围保持一致。
export const nodeRequirement='22.12+（22.x）、24.x 或 26+';
export function supportedNode(version){const [major,minor]=version.split('.').map(Number);return (major===22&&minor>=12)||major===24||major>=26}
