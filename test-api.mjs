/**
 * 端到端测试脚本 - 测试本地去背景功能
 * 通过创建一个最小 Next.js page 来测试
 */
// 直接用 curl 测试 API Route（remove-bg 代理）

// 测试 1: API Key 未配置时应返回 500
const test1 = async () => {
  const res = await fetch('http://localhost:3000/api/remove-bg', {
    method: 'POST',
  });
  const data = await res.json();
  console.log('Test 1 - API Key missing:', res.status, data);
  return res.status === 500 && data.error === 'api_key_missing';
};

// 测试 2: 无 image_file 应返回 400
const test2 = async () => {
  const res = await fetch('http://localhost:3000/api/remove-bg', {
    method: 'POST',
    body: new FormData(),
  });
  const data = await res.json();
  console.log('Test 2 - No image_file:', res.status, data);
  return res.status === 400;
};

// 运行测试
(async () => {
  const results = await Promise.all([test1(), test2()]);
  console.log('\nResults:', results.every(Boolean) ? '✅ ALL PASS' : '❌ SOME FAILED');
  process.exit(results.every(Boolean) ? 0 : 1);
})();
