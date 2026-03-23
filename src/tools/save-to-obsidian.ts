import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { config } from '../config.js';
import { getLatest } from '../store.js';

export function register(server: McpServer): void {
  server.tool(
    'save_to_obsidian',
    'Saves content as a markdown file to an Obsidian vault with YAML frontmatter. Optionally embeds the handwriting image.',
    {
      title: z.string().describe('Note title (used as filename)'),
      content: z.string().describe('Markdown content for the note body'),
      folder: z.string().optional().describe('Subfolder within the vault (default: root)'),
      tags: z.array(z.string()).optional().describe('Tags for YAML frontmatter'),
      embed_image: z.boolean().optional().describe('Whether to embed the latest handwriting PNG (default: false)'),
    },
    async ({ title, content, folder, tags, embed_image }) => {
      if (!config.vaultPath) {
        return {
          content: [{ type: 'text', text: 'Error: --vault-path not configured. Start the server with --vault-path /path/to/vault' }],
          isError: true,
        };
      }

      const targetDir = folder
        ? join(config.vaultPath, folder)
        : config.vaultPath;

      await mkdir(targetDir, { recursive: true });

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const latest = getLatest();

      // Build YAML frontmatter
      const frontmatter: Record<string, unknown> = {
        date: dateStr,
        source: 'petroglyphs',
      };
      if (tags && tags.length > 0) {
        frontmatter.tags = tags;
      }

      const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map((v) => `  - ${v}`).join('\n')}`;
        }
        return `${key}: ${value}`;
      });

      let body = content;

      // Embed image if requested
      if (embed_image && latest) {
        const attachDir = join(config.vaultPath, 'attachments');
        await mkdir(attachDir, { recursive: true });

        const imgFilename = `petroglyphs-${now.getTime()}.png`;
        const imgPath = join(attachDir, imgFilename);
        const imgBuffer = Buffer.from(latest.imageBase64, 'base64');
        await writeFile(imgPath, imgBuffer);

        body = `![[${imgFilename}]]\n\n${body}`;
      }

      const md = `---\n${yamlLines.join('\n')}\n---\n\n${body}\n`;

      const sanitizedTitle = title.replace(/[/\\:*?"<>|]/g, '-');
      const filePath = join(targetDir, `${sanitizedTitle}.md`);
      await writeFile(filePath, md, 'utf-8');

      return {
        content: [{ type: 'text', text: `Saved to ${filePath}` }],
      };
    }
  );
}
