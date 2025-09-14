/**
 * UUID mock for Jest testing
 * 解决uuid ESM模块导入问题
 */

let counter = 0;

// Mock v4 function - 每次调用返回不同的值
const v4 = () => `mocked-uuid-v4-${++counter}`;

// Mock v1 function
const v1 = () => `mocked-uuid-v1-${++counter}`;

// Mock all exports
module.exports = {
  v4,
  v1,
  default: v4,
};

module.exports.v4 = v4;
module.exports.v1 = v1;
