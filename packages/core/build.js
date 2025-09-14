#!/usr/bin/env node

/**
 * Core模块构建脚本
 *
 * 此脚本负责构建Core模块，包括TypeScript编译、类型检查、代码格式化等。
 * 支持开发模式和生产模式两种构建方式。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}▶ ${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: __dirname,
    });
    log(
      `${colors.green}✓ ${description} completed successfully${colors.reset}`
    );
  } catch (error) {
    log(`${colors.red}✗ ${description} failed${colors.reset}`, 'red');
    process.exit(1);
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function main() {
  const args = process.argv.slice(2);
  const isDev = args.includes('--dev');
  const isWatch = args.includes('--watch');
  const skipTests = args.includes('--skip-tests');
  const skipLint = args.includes('--skip-lint');

  log(`${colors.bright}${colors.blue}Core模块构建开始${colors.reset}`);
  log(`构建模式: ${isDev ? '开发' : '生产'}`);
  log(`监听模式: ${isWatch ? '是' : '否'}`);

  // 检查必要文件
  const requiredFiles = ['tsconfig.json', 'package.json', 'src/index.ts'];

  for (const file of requiredFiles) {
    if (!checkFileExists(file)) {
      log(`${colors.red}错误: 缺少必要文件 ${file}${colors.reset}`, 'red');
      process.exit(1);
    }
  }

  // 清理旧的构建文件
  if (fs.existsSync('dist')) {
    runCommand('rm -rf dist', '清理旧的构建文件');
  }

  // 代码检查
  if (!skipLint) {
    runCommand('pnpm lint', 'ESLint代码检查');
  }

  // 类型检查
  runCommand('pnpm typecheck', 'TypeScript类型检查');

  // 运行测试
  if (!skipTests) {
    runCommand('pnpm test', '运行单元测试');
  }

  // 构建
  if (isWatch) {
    log(`${colors.yellow}启动监听模式构建...${colors.reset}`);
    runCommand('pnpm tsc --watch', 'TypeScript监听构建');
  } else {
    runCommand('pnpm build', 'TypeScript构建');
  }

  // 验证构建结果
  if (!isWatch) {
    if (checkFileExists('dist/index.d.ts')) {
      log(`${colors.green}✓ 构建完成，类型定义文件已生成${colors.reset}`);
    } else {
      log(`${colors.red}✗ 构建失败，类型定义文件未生成${colors.reset}`, 'red');
      process.exit(1);
    }
  }

  log(`${colors.bright}${colors.green}Core模块构建完成！${colors.reset}`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
